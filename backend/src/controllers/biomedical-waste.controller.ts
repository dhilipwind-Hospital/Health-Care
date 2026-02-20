import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BiomedicalWasteEntry, WasteCategory, DisposalMethod } from '../models/BiomedicalWaste';

export class BiomedicalWasteController {

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20'), 1), 100);
      const category = req.query.category as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const qb = repo.createQueryBuilder('bw')
        .leftJoinAndSelect('bw.recordedBy', 'recordedBy')
        .leftJoinAndSelect('bw.disposedBy', 'disposedBy');

      if (orgId) qb.where('bw.organization_id = :orgId', { orgId });
      if (category) qb.andWhere('bw.category = :category', { category });
      if (startDate) qb.andWhere('bw.date >= :startDate', { startDate });
      if (endDate) qb.andWhere('bw.date <= :endDate', { endDate });

      qb.orderBy('bw.date', 'DESC').addOrderBy('bw.created_at', 'DESC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const entry = repo.create({
        ...req.body,
        organizationId: orgId,
        recordedById: userId,
        date: req.body.date || new Date(),
      });

      const saved = await repo.save(entry);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const entry = await repo.findOne({ where, relations: ['recordedBy', 'disposedBy'] });

      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      res.json({ success: true, data: entry });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const entry = await repo.findOne({ where });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      Object.assign(entry, req.body);
      const saved = await repo.save(entry);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordDisposal = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const entry = await repo.findOne({ where });
      if (!entry) {
        return res.status(404).json({ success: false, message: 'Entry not found' });
      }

      entry.disposalMethod = req.body.disposalMethod;
      entry.disposedAt = new Date();
      entry.disposedById = userId;
      entry.manifestNumber = req.body.manifestNumber;
      entry.transporterName = req.body.transporterName;
      entry.vehicleNumber = req.body.vehicleNumber;
      entry.treatmentFacility = req.body.treatmentFacility;

      const saved = await repo.save(entry);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDailySummary = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const date = req.query.date as string || new Date().toISOString().split('T')[0];

      const qb = repo.createQueryBuilder('bw')
        .select('bw.category', 'category')
        .addSelect('SUM(bw.quantity_kg)', 'totalKg')
        .addSelect('COUNT(*)', 'count')
        .where('bw.date = :date', { date });

      if (orgId) qb.andWhere('bw.organization_id = :orgId', { orgId });

      qb.groupBy('bw.category');

      const data = await qb.getRawMany();

      res.json({ success: true, data, date });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getMonthlyReport = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BiomedicalWasteEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const month = req.query.month as string || new Date().toISOString().slice(0, 7);

      const qb = repo.createQueryBuilder('bw')
        .select('bw.category', 'category')
        .addSelect('SUM(bw.quantity_kg)', 'totalKg')
        .addSelect('COUNT(*)', 'count')
        .where("TO_CHAR(bw.date, 'YYYY-MM') = :month", { month });

      if (orgId) qb.andWhere('bw.organization_id = :orgId', { orgId });

      qb.groupBy('bw.category');

      const data = await qb.getRawMany();

      res.json({ success: true, data, month });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getCategories = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { value: WasteCategory.YELLOW, label: 'Yellow (Infectious)', description: 'Human anatomical waste, animal waste, microbiology waste' },
        { value: WasteCategory.RED, label: 'Red (Contaminated)', description: 'Contaminated waste (recyclable), tubing, catheters, IV sets' },
        { value: WasteCategory.WHITE, label: 'White (Sharp)', description: 'Sharps including metals - needles, syringes, scalpels' },
        { value: WasteCategory.BLUE, label: 'Blue (Glassware)', description: 'Glassware, metallic body implants' },
      ]
    });
  };

  static getDisposalMethods = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { value: DisposalMethod.INCINERATION, label: 'Incineration' },
        { value: DisposalMethod.AUTOCLAVING, label: 'Autoclaving' },
        { value: DisposalMethod.CHEMICAL_TREATMENT, label: 'Chemical Treatment' },
        { value: DisposalMethod.SHREDDING, label: 'Shredding' },
        { value: DisposalMethod.DEEP_BURIAL, label: 'Deep Burial' },
        { value: DisposalMethod.SECURED_LANDFILL, label: 'Secured Landfill' },
      ]
    });
  };
}
