import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InpatientVisitor, VisitorStatus } from '../models/InpatientVisitor';

export class VisitorController {
  static list = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const { status, patientId, date } = req.query;
      const where: any = { organizationId: orgId };
      if (status) where.status = status;
      if (patientId) where.patientId = patientId;
      if (date) where.visitDate = date;
      const data = await repo.find({ where, relations: ['patient'], order: { createdAt: 'DESC' }, take: 200 });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await repo.count({ where: { organizationId: orgId } });
      const passNumber = `VP-${today}-${String(count + 1).padStart(4, '0')}`;
      const visitor = repo.create({ ...req.body, organizationId: orgId, passNumber } as any);
      const saved = await repo.save(visitor);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getActive = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const data = await repo.find({
        where: { organizationId: orgId, status: VisitorStatus.CHECKED_IN },
        relations: ['patient'],
        order: { checkInTime: 'DESC' },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByPatient = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const data = await repo.find({
        where: { organizationId: orgId, patientId: req.params.patientId },
        order: { createdAt: 'DESC' },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static checkIn = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const visitor = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
      visitor.status = VisitorStatus.CHECKED_IN;
      visitor.checkInTime = new Date();
      await repo.save(visitor);
      res.json({ success: true, data: visitor });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static checkOut = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(InpatientVisitor);
      const visitor = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!visitor) return res.status(404).json({ success: false, message: 'Visitor not found' });
      visitor.status = VisitorStatus.CHECKED_OUT;
      visitor.checkOutTime = new Date();
      await repo.save(visitor);
      res.json({ success: true, data: visitor });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
