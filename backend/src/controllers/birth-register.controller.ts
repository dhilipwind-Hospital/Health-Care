import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BirthRegister } from '../models/BirthRegister';

export class BirthRegisterController {

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BirthRegister);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (status) where.status = status;

      const [data, total] = await repo.findAndCount({
        where,
        relations: ['mother', 'attendingDoctor'],
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
      const repo = AppDataSource.getRepository(BirthRegister);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const findWhere: any = { id: req.params.id };
      if (orgId) findWhere.organizationId = orgId;
      const record = await repo.findOne({
        where: findWhere,
        relations: ['mother', 'attendingDoctor', 'organization', 'location'],
      });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BirthRegister);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const countWhere: any = {};
      if (orgId) countWhere.organizationId = orgId;
      const count = await repo.count({ where: countWhere });
      const year = new Date().getFullYear();
      const regNumber = `BR-${year}-${String(count + 1).padStart(4, '0')}`;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        registerNumber: regNumber,
      });

      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BirthRegister);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const updateWhere: any = { id: req.params.id };
      if (orgId) updateWhere.organizationId = orgId;
      const record = await repo.findOne({ where: updateWhere });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      if (record.status === 'registered' || record.status === 'issued') {
        return res.status(400).json({ success: false, message: 'Cannot edit registered/issued records' });
      }

      repo.merge(record, req.body);
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordVaccination = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BirthRegister);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const vacWhere: any = { id: req.params.id };
      if (orgId) vacWhere.organizationId = orgId;
      const record = await repo.findOne({ where: vacWhere });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      if (req.body.bcgGiven !== undefined) record.bcgGiven = req.body.bcgGiven;
      if (req.body.opv0Given !== undefined) record.opv0Given = req.body.opv0Given;
      if (req.body.hepB0Given !== undefined) record.hepB0Given = req.body.hepB0Given;
      if (req.body.vitaminKGiven !== undefined) record.vitaminKGiven = req.body.vitaminKGiven;

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
