import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ConsentRecord, ConsentType, ConsentStatus } from '../models/ConsentRecord';

export class ConsentController {

  static listConsentTypes = async (_req: Request, res: Response) => {
    try {
      const types = Object.values(ConsentType).map(type => ({
        value: type,
        label: type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
      }));
      res.json({ success: true, data: types });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const patientId = req.query.patientId as string;
      const consentType = req.query.consentType as string;
      const status = req.query.status as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (patientId) where.patientId = patientId;
      if (consentType) where.consentType = consentType;
      if (status) where.status = status;

      const [data, total] = await repo.findAndCount({
        where,
        relations: ['patient', 'grantedBy', 'withdrawnBy'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByPatient = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { patientId: req.params.patientId };
      if (orgId) where.organizationId = orgId;

      const data = await repo.find({
        where,
        order: { createdAt: 'DESC' },
      });

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consent = await repo.findOne({
        where,
        relations: ['patient', 'grantedBy', 'withdrawnBy'],
      });

      if (!consent) {
        return res.status(404).json({ success: false, message: 'Consent record not found' });
      }

      res.json({ success: true, data: consent });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const consent = repo.create({
        ...req.body,
        organizationId: orgId,
        grantedById: userId,
        grantedAt: new Date(),
        status: ConsentStatus.GRANTED,
        isGranted: true,
        ipAddress: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent'],
      });

      const saved = await repo.save(consent);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static withdraw = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consent = await repo.findOne({ where });
      if (!consent) {
        return res.status(404).json({ success: false, message: 'Consent record not found' });
      }

      if (consent.status === ConsentStatus.WITHDRAWN) {
        return res.status(400).json({ success: false, message: 'Consent already withdrawn' });
      }

      consent.status = ConsentStatus.WITHDRAWN;
      consent.isGranted = false;
      consent.withdrawnAt = new Date();
      consent.withdrawnById = userId;
      consent.withdrawalReason = req.body.reason;

      const saved = await repo.save(consent);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static checkConsent = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(ConsentRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { patientId, consentType } = req.query;

      if (!patientId || !consentType) {
        return res.status(400).json({ success: false, message: 'patientId and consentType required' });
      }

      const where: any = {
        patientId,
        consentType,
        status: ConsentStatus.GRANTED,
      };
      if (orgId) where.organizationId = orgId;

      const consent = await repo.findOne({ where });

      const hasConsent = !!consent && (!consent.expiresAt || new Date(consent.expiresAt) > new Date());

      res.json({
        success: true,
        data: {
          hasConsent,
          consent: hasConsent ? consent : null
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getConsentTemplates = async (_req: Request, res: Response) => {
    try {
      const templates = [
        {
          type: ConsentType.DATA_PROCESSING,
          title: 'Data Processing Consent (DPDP Act 2023)',
          text: 'I hereby consent to the collection, storage, and processing of my personal data including health information by this healthcare facility for the purpose of providing medical care and treatment. I understand that my data will be processed in accordance with the Digital Personal Data Protection Act, 2023 and I have the right to withdraw this consent at any time.'
        },
        {
          type: ConsentType.TREATMENT,
          title: 'Treatment Consent',
          text: 'I hereby consent to receive medical treatment, diagnostic procedures, and therapeutic interventions as recommended by the attending physician. I understand the nature, risks, and benefits of the proposed treatment have been explained to me.'
        },
        {
          type: ConsentType.TELEMEDICINE,
          title: 'Telemedicine Consent',
          text: 'I consent to receive healthcare services via telemedicine/video consultation. I understand that telemedicine involves electronic communication and that there are limitations to this mode of consultation. I agree to the terms of telemedicine services as per Telemedicine Practice Guidelines 2020.'
        },
        {
          type: ConsentType.DATA_SHARING,
          title: 'Data Sharing Consent',
          text: 'I consent to share my health records with other healthcare providers, insurance companies, or third parties as specified for continuity of care, insurance claims, or other legitimate purposes. I understand I can specify and limit which data is shared.'
        },
        {
          type: ConsentType.RESEARCH,
          title: 'Research Participation Consent',
          text: 'I consent to the use of my anonymized health data for medical research purposes. I understand that my identity will be protected and no personally identifiable information will be disclosed in any research publications.'
        },
        {
          type: ConsentType.ABDM_HEALTH_RECORDS,
          title: 'ABDM Health Records Consent',
          text: 'I consent to link my health records with Ayushman Bharat Digital Mission (ABDM) and allow access to my health records through my ABHA (Ayushman Bharat Health Account). I understand I can manage access permissions through the ABDM platform.'
        },
        {
          type: ConsentType.PHOTO_VIDEO,
          title: 'Photo/Video Consent',
          text: 'I consent to the capture and storage of photographs/videos for medical documentation, identification, and treatment purposes. I understand these will be stored securely and used only for medical purposes unless I provide additional consent.'
        },
        {
          type: ConsentType.EMERGENCY_CONTACT,
          title: 'Emergency Contact Consent',
          text: 'I consent to the hospital contacting my designated emergency contacts in case of medical emergencies or critical health situations. I authorize sharing of relevant medical information with them as necessary.'
        }
      ];

      res.json({ success: true, data: templates });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
