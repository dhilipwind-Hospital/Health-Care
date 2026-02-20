import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { BloodDonor } from '../models/bloodbank/BloodDonor';
import { BloodInventory } from '../models/bloodbank/BloodInventory';
import { CrossMatchRequest } from '../models/bloodbank/CrossMatchRequest';
import { Transfusion } from '../models/bloodbank/Transfusion';

export class BloodBankController {

  // ===== DONORS =====
  static listDonors = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodDonor);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const bloodGroup = req.query.bloodGroup as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (bloodGroup) where.bloodGroup = bloodGroup;

      const [data, total] = await repo.findAndCount({
        where,
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createDonor = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodDonor);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const countWhere: any = {};
      if (orgId) countWhere.organizationId = orgId;
      const count = await repo.count({ where: countWhere });
      const year = new Date().getFullYear();
      const donorNumber = `BD-${year}-${String(count + 1).padStart(4, '0')}`;

      const donor = repo.create({ ...req.body, organizationId: orgId, donorNumber });
      const saved = await repo.save(donor);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDonor = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodDonor);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w1: any = { id: req.params.id };
      if (orgId) w1.organizationId = orgId;
      const donor = await repo.findOne({ where: w1 });
      if (!donor) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: donor });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateDonor = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodDonor);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w2: any = { id: req.params.id };
      if (orgId) w2.organizationId = orgId;
      const donor = await repo.findOne({ where: w2 });
      if (!donor) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(donor, req.body);
      const saved = await repo.save(donor);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deferDonor = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodDonor);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w3: any = { id: req.params.id };
      if (orgId) w3.organizationId = orgId;
      const donor = await repo.findOne({ where: w3 });
      if (!donor) return res.status(404).json({ success: false, message: 'Not found' });
      donor.isDeferral = true;
      donor.deferralReason = req.body.reason;
      donor.deferralUntil = req.body.until;
      const saved = await repo.save(donor);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== INVENTORY =====
  static listInventory = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodInventory);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20'), 1), 100);
      const bloodGroup = req.query.bloodGroup as string;
      const status = req.query.status as string;

      const where: any = {};
      if (orgId) where.organizationId = orgId;
      if (bloodGroup) where.bloodGroup = bloodGroup;
      if (status) where.status = status;

      const [data, total] = await repo.findAndCount({
        where,
        relations: ['donor'],
        order: { expiryDate: 'ASC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static addBloodBag = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodInventory);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const countW: any = {};
      if (orgId) countW.organizationId = orgId;
      const count = await repo.count({ where: countW });
      const year = new Date().getFullYear();
      const bagNumber = `BAG-${year}-${String(count + 1).padStart(4, '0')}`;

      const bag = repo.create({ ...req.body, organizationId: orgId, bagNumber });
      const saved = await repo.save(bag);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateBagStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodInventory);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w4: any = { id: req.params.id };
      if (orgId) w4.organizationId = orgId;
      const bag = await repo.findOne({ where: w4 });
      if (!bag) return res.status(404).json({ success: false, message: 'Not found' });
      bag.status = req.body.status;
      if (req.body.discardReason) bag.discardReason = req.body.discardReason;
      if (req.body.status === 'discarded') bag.discardDate = new Date() as any;
      const saved = await repo.save(bag);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static stockSummary = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodInventory);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo
        .createQueryBuilder('bi')
        .select('bi.bloodGroup', 'bloodGroup')
        .addSelect('bi.component', 'component')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(bi.volume)', 'totalVolume');
      if (orgId) qb.where('bi.organization_id = :orgId', { orgId });
      const summary = await qb
        .andWhere('bi.status = :status', { status: 'available' })
        .groupBy('bi.bloodGroup')
        .addGroupBy('bi.component')
        .getRawMany();

      res.json({ success: true, data: summary });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getExpiring = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(BloodInventory);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const daysAhead = parseInt(req.query.days as string || '7');
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysAhead);

      const qb2 = repo.createQueryBuilder('bi');
      if (orgId) qb2.where('bi.organization_id = :orgId', { orgId });
      const data = await qb2
        .andWhere('bi.status = :status', { status: 'available' })
        .andWhere('bi.expiryDate <= :futureDate', { futureDate: futureDate.toISOString().slice(0, 10) })
        .orderBy('bi.expiryDate', 'ASC')
        .getMany();

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== CROSS MATCH =====
  static listCrossMatch = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(CrossMatchRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);

      const cmWhere: any = {};
      if (orgId) cmWhere.organizationId = orgId;
      const [data, total] = await repo.findAndCount({
        where: cmWhere,
        relations: ['patient', 'requestedByDoctor'],
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createCrossMatch = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(CrossMatchRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const cmCW: any = {};
      if (orgId) cmCW.organizationId = orgId;
      const count = await repo.count({ where: cmCW });
      const year = new Date().getFullYear();
      const requestNumber = `CM-${year}-${String(count + 1).padStart(4, '0')}`;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        requestNumber,
        requestedBy: (req as any).user?.id,
      });
      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateCrossMatch = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(CrossMatchRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w5: any = { id: req.params.id };
      if (orgId) w5.organizationId = orgId;
      const record = await repo.findOne({ where: w5 });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(record, req.body);
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== TRANSFUSION =====
  static listTransfusions = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Transfusion);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);

      const trWhere: any = {};
      if (orgId) trWhere.organizationId = orgId;
      const [data, total] = await repo.findAndCount({
        where: trWhere,
        relations: ['patient', 'bloodInventory'],
        order: { startTime: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static startTransfusion = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Transfusion);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        startTime: new Date(),
        status: 'in_progress',
      });
      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateTransfusion = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Transfusion);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w6: any = { id: req.params.id };
      if (orgId) w6.organizationId = orgId;
      const record = await repo.findOne({ where: w6 });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(record, req.body);
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static reportReaction = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Transfusion);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const w7: any = { id: req.params.id };
      if (orgId) w7.organizationId = orgId;
      const record = await repo.findOne({ where: w7 });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      record.reaction = true;
      record.reactionType = req.body.reactionType;
      record.reactionDetails = req.body.reactionDetails;
      record.reactionTime = new Date();
      record.reactionManagement = req.body.reactionManagement;
      record.status = 'stopped_reaction' as any;
      record.endTime = new Date();

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
