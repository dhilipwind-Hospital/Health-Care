import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DietOrder, DietType, MealType, DietOrderStatus } from '../models/DietOrder';

export class DietController {
  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DietOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, patientId } = req.query;

      const qb = repo.createQueryBuilder('d')
        .leftJoinAndSelect('d.patient', 'patient')
        .leftJoinAndSelect('d.orderedBy', 'orderedBy');

      if (orgId) qb.where('d.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('d.status = :status', { status });
      if (patientId) qb.andWhere('d.patient_id = :patientId', { patientId });

      qb.orderBy('d.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DietOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const order = repo.create({
        ...req.body,
        organizationId: orgId,
        orderedById: userId,
        status: DietOrderStatus.ACTIVE,
      });

      const saved = await repo.save(order);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DietOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const order = await repo.findOne({ where });
      if (!order) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(order, req.body);
      const saved = await repo.save(order);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDietTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(DietType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static getMealTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(MealType).map(t => ({
        value: t,
        label: t.replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };
}
