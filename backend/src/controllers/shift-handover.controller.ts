import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ShiftHandover, HandoverStatus } from '../models/ShiftHandover';

export class ShiftHandoverController {
  static list = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const { status, shiftType, wardId } = req.query;
      const where: any = { organizationId: orgId };
      if (status) where.status = status;
      if (shiftType) where.shiftType = shiftType;
      if (wardId) where.wardId = wardId;
      const data = await repo.find({ where, relations: ['fromStaff', 'toStaff'], order: { createdAt: 'DESC' }, take: 200 });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const handover = repo.create({ ...req.body, organizationId: orgId, fromStaffId: userId } as any);
      const saved = await repo.save(handover);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByShift = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const { date, shiftType } = req.query;
      const where: any = { organizationId: orgId };
      if (date) where.shiftDate = date;
      if (shiftType) where.shiftType = shiftType;
      const data = await repo.find({ where, relations: ['fromStaff', 'toStaff'], order: { createdAt: 'DESC' } });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByWard = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const data = await repo.find({
        where: { organizationId: orgId, wardId: req.params.wardId },
        relations: ['fromStaff', 'toStaff'],
        order: { createdAt: 'DESC' },
        take: 50,
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const handover = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!handover) return res.status(404).json({ success: false, message: 'Handover not found' });
      Object.assign(handover, req.body);
      await repo.save(handover);
      res.json({ success: true, data: handover });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static acknowledge = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;
      const repo = AppDataSource.getRepository(ShiftHandover);
      const handover = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!handover) return res.status(404).json({ success: false, message: 'Handover not found' });
      handover.status = HandoverStatus.ACKNOWLEDGED;
      handover.acknowledgedAt = new Date();
      handover.toStaffId = userId;
      await repo.save(handover);
      res.json({ success: true, data: handover });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
