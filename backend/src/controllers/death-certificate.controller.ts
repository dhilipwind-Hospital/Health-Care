import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DeathCertificate } from '../models/DeathCertificate';

export class DeathCertificateController {

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;

      const [data, total] = await repo.findAndCount({
        where,
        relations: ['patient', 'certifyingDoctor'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const findWhere: any = { id: req.params.id };
      if (orgId) findWhere.organizationId = orgId;
      const record = await repo.findOne({
        where: findWhere,
        relations: ['patient', 'certifyingDoctor', 'organization', 'location'],
      });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      // Auto-generate certificate number
      const countWhere: any = {};
      if (orgId) countWhere.organizationId = orgId;
      const count = await repo.count({ where: countWhere });
      const year = new Date().getFullYear();
      const certNumber = `DC-${year}-${String(count + 1).padStart(4, '0')}`;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        certificateNumber: certNumber,
      });

      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const updateWhere: any = { id: req.params.id };
      if (orgId) updateWhere.organizationId = orgId;
      const record = await repo.findOne({ where: updateWhere });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      // Don't allow editing certified/registered records
      if (record.status === 'registered' || record.status === 'issued') {
        return res.status(400).json({ success: false, message: 'Cannot edit registered/issued certificates' });
      }

      repo.merge(record, req.body);
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static certify = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;
      const certWhere: any = { id: req.params.id };
      if (orgId) certWhere.organizationId = orgId;
      const record = await repo.findOne({ where: certWhere });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.status = 'certified' as any;
      record.certifyingDoctorId = userId;
      record.certifiedAt = new Date();
      if (req.body.certifyingDoctorName) record.certifyingDoctorName = req.body.certifyingDoctorName;
      if (req.body.certifyingDoctorReg) record.certifyingDoctorReg = req.body.certifyingDoctorReg;

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordHandover = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DeathCertificate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const hoWhere: any = { id: req.params.id };
      if (orgId) hoWhere.organizationId = orgId;
      const record = await repo.findOne({ where: hoWhere });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.bodyHandoverTo = req.body.bodyHandoverTo;
      record.bodyHandoverRelation = req.body.bodyHandoverRelation;
      record.bodyHandoverIdProof = req.body.bodyHandoverIdProof;
      record.bodyHandoverDate = new Date();
      record.bodyHandoverWitness = req.body.bodyHandoverWitness;

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
