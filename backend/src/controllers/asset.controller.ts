import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Asset, AssetMaintenanceLog, AssetType, AssetStatus } from '../models/Asset';

export class AssetController {
  static generateAssetCode = (): string => {
    const prefix = 'AST';
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}-${random}`;
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Asset);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { type, status, department } = req.query;

      const qb = repo.createQueryBuilder('a');
      if (orgId) qb.where('a.organization_id = :orgId', { orgId });
      if (type) qb.andWhere('a.type = :type', { type });
      if (status) qb.andWhere('a.status = :status', { status });
      if (department) qb.andWhere('a.department = :department', { department });

      qb.orderBy('a.name', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Asset);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const asset = repo.create({
        ...req.body,
        organizationId: orgId,
        assetCode: req.body.assetCode || AssetController.generateAssetCode(),
        status: AssetStatus.ACTIVE,
      });

      const saved = await repo.save(asset);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Asset);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const asset = await repo.findOne({ where });
      if (!asset) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(asset, req.body);
      const saved = await repo.save(asset);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static addMaintenance = async (req: Request, res: Response) => {
    try {
      const assetRepo = AppDataSource.getRepository(Asset);
      const logRepo = AppDataSource.getRepository(AssetMaintenanceLog);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const asset = await assetRepo.findOne({ where });
      if (!asset) return res.status(404).json({ success: false, message: 'Asset not found' });

      const log = logRepo.create({
        assetId: asset.id,
        ...req.body,
      });

      const saved = await logRepo.save(log);

      asset.lastMaintenanceDate = new Date(req.body.maintenanceDate);
      if (req.body.nextDueDate) {
        asset.nextMaintenanceDate = new Date(req.body.nextDueDate);
      }
      await assetRepo.save(asset);

      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getMaintenanceLogs = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AssetMaintenanceLog);
      const data = await repo.find({
        where: { assetId: req.params.id },
        order: { maintenanceDate: 'DESC' },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(AssetType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static getDueMaintenance = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Asset);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('a')
        .where('a.next_maintenance_date <= :date', { date: new Date() })
        .andWhere('a.status = :status', { status: AssetStatus.ACTIVE });

      if (orgId) qb.andWhere('a.organization_id = :orgId', { orgId });

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
