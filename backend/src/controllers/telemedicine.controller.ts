import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { TelemedicineConsultation, ConsultationStatus, ConsultationType } from '../models/Telemedicine';

export class TelemedicineController {
  static generateConsultationNumber = (): string => {
    const date = new Date();
    const prefix = 'TM';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, doctorId, patientId, date } = req.query;

      const qb = repo.createQueryBuilder('t')
        .leftJoinAndSelect('t.patient', 'patient')
        .leftJoinAndSelect('t.doctor', 'doctor');

      if (orgId) qb.where('t.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('t.status = :status', { status });
      if (doctorId) qb.andWhere('t.doctor_id = :doctorId', { doctorId });
      if (patientId) qb.andWhere('t.patient_id = :patientId', { patientId });
      if (date) qb.andWhere('DATE(t.scheduled_at) = :date', { date });

      qb.orderBy('t.scheduled_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const consultation = repo.create({
        ...req.body,
        organizationId: orgId,
        consultationNumber: TelemedicineController.generateConsultationNumber(),
        status: ConsultationStatus.SCHEDULED,
        meetingLink: `https://meet.ayphen.com/${Math.random().toString(36).substring(2, 10)}`,
      });

      const saved = await repo.save(consultation);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consultation = await repo.findOne({
        where,
        relations: ['patient', 'doctor'],
      });

      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      res.json({ success: true, data: consultation });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consultation = await repo.findOne({ where });
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      Object.assign(consultation, req.body);
      const saved = await repo.save(consultation);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static startConsultation = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consultation = await repo.findOne({ where });
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      consultation.status = ConsultationStatus.IN_PROGRESS;
      consultation.startedAt = new Date();

      const saved = await repo.save(consultation);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static endConsultation = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consultation = await repo.findOne({ where });
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      consultation.status = ConsultationStatus.COMPLETED;
      consultation.endedAt = new Date();
      if (consultation.startedAt) {
        consultation.durationMinutes = Math.round((consultation.endedAt.getTime() - consultation.startedAt.getTime()) / 60000);
      }
      if (req.body.diagnosis) consultation.diagnosis = req.body.diagnosis;
      if (req.body.prescription) consultation.prescription = req.body.prescription;
      if (req.body.notes) consultation.notes = req.body.notes;
      if (req.body.followUpDate) consultation.followUpDate = req.body.followUpDate;

      const saved = await repo.save(consultation);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordConsent = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const consultation = await repo.findOne({ where });
      if (!consultation) {
        return res.status(404).json({ success: false, message: 'Not found' });
      }

      consultation.patientConsent = true;
      consultation.consentTimestamp = new Date();

      const saved = await repo.save(consultation);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(ConsultationType).map(t => ({
        value: t,
        label: t.replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static getTodaySchedule = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(TelemedicineConsultation);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const today = new Date().toISOString().split('T')[0];

      const qb = repo.createQueryBuilder('t')
        .leftJoinAndSelect('t.patient', 'patient')
        .leftJoinAndSelect('t.doctor', 'doctor')
        .where('DATE(t.scheduled_at) = :today', { today })
        .andWhere('t.status IN (:...statuses)', { statuses: ['scheduled', 'waiting', 'in_progress'] });

      if (orgId) qb.andWhere('t.organization_id = :orgId', { orgId });

      qb.orderBy('t.scheduled_at', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
