import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { AbhaRecord, AbhaStatus } from '../models/AbhaRecord';
import { User } from '../models/User';

export class AbhaController {
  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, patientId } = req.query;

      const qb = repo.createQueryBuilder('a')
        .leftJoinAndSelect('a.patient', 'patient');

      if (orgId) qb.where('a.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('a.status = :status', { status });
      if (patientId) qb.andWhere('a.patient_id = :patientId', { patientId });

      qb.orderBy('a.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByPatient = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { patientId: req.params.patientId };
      if (orgId) where.organizationId = orgId;

      const record = await repo.findOne({ where, relations: ['patient'] });
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        status: AbhaStatus.PENDING,
      });

      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static verify = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const record = await repo.findOne({ where });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.status = AbhaStatus.VERIFIED;
      record.verifiedAt = new Date();
      record.verificationMethod = req.body.verificationMethod || 'aadhaar_otp';
      if (req.body.abhaNumber) record.abhaNumber = req.body.abhaNumber;
      if (req.body.abhaAddress) record.abhaAddress = req.body.abhaAddress;
      if (req.body.healthId) record.healthId = req.body.healthId;

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static link = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const userRepo = AppDataSource.getRepository(User);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const record = await repo.findOne({ where });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.status = AbhaStatus.LINKED;
      record.linkedAt = new Date();
      if (req.body.phrAddress) record.phrAddress = req.body.phrAddress;

      const saved = await repo.save(record);

      // Update user with ABHA details
      if (record.patientId && record.abhaNumber) {
        await userRepo.update(record.patientId, { abhaId: record.abhaNumber });
      }

      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordConsent = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const record = await repo.findOne({ where });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.consentGiven = true;
      record.consentTimestamp = new Date();
      record.consentText = req.body.consentText || 'Patient has consented to ABHA linking and health data sharing.';

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AbhaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('a');
      if (orgId) qb.where('a.organization_id = :orgId', { orgId });

      const total = await qb.getCount();

      const byStatus = await repo.createQueryBuilder('a')
        .select('a.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'a.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('a.status')
        .getRawMany();

      res.json({ success: true, data: { total, byStatus } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
