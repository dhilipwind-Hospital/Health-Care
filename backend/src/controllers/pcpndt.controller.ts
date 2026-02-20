import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PcpndtFormF } from '../models/PcpndtFormF';

export class PcpndtController {
  static generateFormNumber = (): string => {
    const date = new Date();
    const prefix = 'PCPNDT';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { patientId, doctorId, startDate, endDate } = req.query;

      const qb = repo.createQueryBuilder('f')
        .leftJoinAndSelect('f.patient', 'patient')
        .leftJoinAndSelect('f.doctor', 'doctor');

      if (orgId) qb.where('f.organization_id = :orgId', { orgId });
      if (patientId) qb.andWhere('f.patient_id = :patientId', { patientId });
      if (doctorId) qb.andWhere('f.doctor_id = :doctorId', { doctorId });
      if (startDate) qb.andWhere('f.procedure_date >= :startDate', { startDate });
      if (endDate) qb.andWhere('f.procedure_date <= :endDate', { endDate });

      qb.orderBy('f.procedure_date', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const form = await repo.findOne({ where, relations: ['patient', 'doctor'] });
      if (!form) return res.status(404).json({ success: false, message: 'Not found' });

      res.json({ success: true, data: form });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const form = repo.create({
        ...req.body,
        organizationId: orgId,
        formNumber: PcpndtController.generateFormNumber(),
      });

      const saved = await repo.save(form);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const form = await repo.findOne({ where });
      if (!form) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(form, req.body);
      const saved = await repo.save(form);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static signDeclaration = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const form = await repo.findOne({ where });
      if (!form) return res.status(404).json({ success: false, message: 'Not found' });

      form.declarationSigned = true;
      form.declarationDate = new Date() as any;
      if (req.body.patientSignature) form.patientSignature = req.body.patientSignature;
      if (req.body.doctorSignature) form.doctorSignature = req.body.doctorSignature;
      if (req.body.witnessName) form.witnessName = req.body.witnessName;
      if (req.body.witnessSignature) form.witnessSignature = req.body.witnessSignature;

      const saved = await repo.save(form);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getMonthlyReport = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PcpndtFormF);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { month, year } = req.query;

      const m = parseInt(month as string) || new Date().getMonth() + 1;
      const y = parseInt(year as string) || new Date().getFullYear();

      const startDate = new Date(y, m - 1, 1);
      const endDate = new Date(y, m, 0);

      const qb = repo.createQueryBuilder('f')
        .leftJoinAndSelect('f.patient', 'patient')
        .leftJoinAndSelect('f.doctor', 'doctor')
        .where('f.procedure_date >= :startDate', { startDate: startDate.toISOString().split('T')[0] })
        .andWhere('f.procedure_date <= :endDate', { endDate: endDate.toISOString().split('T')[0] });

      if (orgId) qb.andWhere('f.organization_id = :orgId', { orgId });

      qb.orderBy('f.procedure_date', 'ASC');

      const data = await qb.getMany();
      res.json({
        success: true,
        data: {
          month: m,
          year: y,
          totalForms: data.length,
          forms: data
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getIndications = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { value: 'advanced_maternal_age', label: 'Advanced Maternal Age (>35 years)' },
        { value: 'previous_child_anomaly', label: 'Previous Child with Congenital Anomaly' },
        { value: 'family_history', label: 'Family History of Genetic Disease' },
        { value: 'abnormal_serum_markers', label: 'Abnormal Serum Markers' },
        { value: 'abnormal_usg_findings', label: 'Abnormal USG Findings' },
        { value: 'recurrent_pregnancy_loss', label: 'Recurrent Pregnancy Loss' },
        { value: 'consanguineous_marriage', label: 'Consanguineous Marriage' },
        { value: 'exposure_to_teratogens', label: 'Exposure to Teratogens' },
        { value: 'other', label: 'Other (Specify in Remarks)' },
      ]
    });
  };
}
