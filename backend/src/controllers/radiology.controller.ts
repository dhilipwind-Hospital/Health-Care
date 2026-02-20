import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { RadiologyOrder } from '../models/radiology/RadiologyOrder';
import { RadiologyReport } from '../models/radiology/RadiologyReport';
import { RadiologyTemplate } from '../models/radiology/RadiologyTemplate';

export class RadiologyController {

  // ===== ORDERS =====
  static listOrders = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;
      const modality = req.query.modality as string;
      const patientId = req.query.patientId as string;

      const qb = repo.createQueryBuilder('ro')
        .leftJoinAndSelect('ro.patient', 'patient')
        .leftJoinAndSelect('ro.referringDoctor', 'referringDoctor')
        .leftJoinAndSelect('ro.radiologist', 'radiologist');
      if (orgId) qb.where('ro.organization_id = :orgId', { orgId });

      if (status) qb.andWhere('ro.status = :status', { status });
      if (modality) qb.andWhere('ro.modalityType = :modality', { modality });
      if (patientId) qb.andWhere('ro.patient_id = :patientId', { patientId });

      qb.orderBy('ro.createdAt', 'DESC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createOrder = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const cw: any = {};
      if (orgId) cw.organizationId = orgId;
      const count = await repo.count({ where: cw });
      const year = new Date().getFullYear();
      const orderNumber = `RAD-${year}-${String(count + 1).padStart(4, '0')}`;

      const order = repo.create({
        ...req.body,
        organizationId: orgId,
        orderNumber,
        referringDoctorId: req.body.referringDoctorId || (req as any).user?.id,
      });
      const saved = await repo.save(order);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getOrder = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const reportRepo = AppDataSource.getRepository(RadiologyReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const ow1: any = { id: req.params.id };
      if (orgId) ow1.organizationId = orgId;
      const order = await repo.findOne({
        where: ow1,
        relations: ['patient', 'referringDoctor', 'radiologist'],
      });
      if (!order) return res.status(404).json({ success: false, message: 'Not found' });

      const report = await reportRepo.findOne({ where: { orderId: order.id }, relations: ['radiologist', 'verifiedByUser'] });

      res.json({ success: true, data: { ...order, report } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateOrder = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const ow2: any = { id: req.params.id };
      if (orgId) ow2.organizationId = orgId;
      const order = await repo.findOne({ where: ow2 });
      if (!order) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(order, req.body);
      const saved = await repo.save(order);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateOrderStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const ow3: any = { id: req.params.id };
      if (orgId) ow3.organizationId = orgId;
      const order = await repo.findOne({ where: ow3 });
      if (!order) return res.status(404).json({ success: false, message: 'Not found' });

      order.status = req.body.status;
      if (req.body.status === 'completed') order.performedDate = new Date();
      if (req.body.status === 'cancelled') order.cancellationReason = req.body.cancellationReason;

      const saved = await repo.save(order);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== REPORTS =====
  static createReport = async (req: Request, res: Response) => {
    try {
      const reportRepo = AppDataSource.getRepository(RadiologyReport);
      const orderRepo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const ow4: any = { id: req.params.id };
      if (orgId) ow4.organizationId = orgId;
      const order = await orderRepo.findOne({ where: ow4 });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      // Check if report already exists
      const existing = await reportRepo.findOne({ where: { orderId: order.id } });
      if (existing) return res.status(400).json({ success: false, message: 'Report already exists for this order' });

      const report = new RadiologyReport();
      Object.assign(report, req.body);
      report.orderId = order.id;
      report.radiologistId = req.body.radiologistId || (req as any).user?.id;
      report.reportedAt = new Date();

      const saved = await reportRepo.save(report);

      // Update order status
      order.status = 'reported' as any;
      order.reportedDate = new Date();
      order.radiologistId = report.radiologistId;
      await orderRepo.save(order);

      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateReport = async (req: Request, res: Response) => {
    try {
      const reportRepo = AppDataSource.getRepository(RadiologyReport);
      const report = await reportRepo.findOne({ where: { orderId: req.params.id } });
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      reportRepo.merge(report, req.body);
      const saved = await reportRepo.save(report);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static verifyReport = async (req: Request, res: Response) => {
    try {
      const reportRepo = AppDataSource.getRepository(RadiologyReport);
      const orderRepo = AppDataSource.getRepository(RadiologyOrder);

      const report = await reportRepo.findOne({ where: { orderId: req.params.id } });
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      report.reportStatus = 'final' as any;
      report.verifiedBy = (req as any).user?.id;
      report.verifiedAt = new Date();
      const saved = await reportRepo.save(report);

      // Update order
      const order = await orderRepo.findOne({ where: { id: req.params.id } });
      if (order) {
        order.status = 'verified' as any;
        order.verifiedDate = new Date();
        await orderRepo.save(order);
      }

      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static flagCritical = async (req: Request, res: Response) => {
    try {
      const reportRepo = AppDataSource.getRepository(RadiologyReport);
      const report = await reportRepo.findOne({ where: { orderId: req.params.id } });
      if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

      report.criticalFinding = true;
      report.criticalFindingDetails = req.body.details;
      report.criticalFindingNotifiedTo = req.body.notifyDoctorId;
      report.criticalFindingNotifiedAt = new Date();

      const saved = await reportRepo.save(report);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== TEMPLATES =====
  static listTemplates = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyTemplate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const modality = req.query.modality as string;
      const where: any = { isActive: true };
      if (orgId) where.organizationId = orgId;
      if (modality) where.modalityType = modality;

      const data = await repo.find({ where, order: { name: 'ASC' } });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createTemplate = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyTemplate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const template = repo.create({ ...req.body, organizationId: orgId, createdBy: (req as any).user?.id });
      const saved = await repo.save(template);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateTemplate = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyTemplate);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const tw1: any = { id: req.params.id };
      if (orgId) tw1.organizationId = orgId;
      const template = await repo.findOne({ where: tw1 });
      if (!template) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(template, req.body);
      const saved = await repo.save(template);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== ANALYTICS =====
  static analytics = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(RadiologyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const aw: any = {};
      if (orgId) aw.organizationId = orgId;
      const totalOrders = await repo.count({ where: aw });
      const pendingReports = await repo.count({ where: { ...aw, status: 'completed' as any } });

      const ctQb = repo.createQueryBuilder('ro');
      if (orgId) ctQb.where('ro.organization_id = :orgId', { orgId });
      const completedToday = await ctQb
        .andWhere('ro.status IN (:...statuses)', { statuses: ['reported', 'verified'] })
        .andWhere('DATE(ro.reportedDate) = CURRENT_DATE')
        .getCount();

      // Modality breakdown
      const mbQb = repo.createQueryBuilder('ro')
        .select('ro.modalityType', 'modality')
        .addSelect('COUNT(*)', 'count');
      if (orgId) mbQb.where('ro.organization_id = :orgId', { orgId });
      const modalityBreakdown = await mbQb
        .groupBy('ro.modalityType')
        .getRawMany();

      res.json({
        success: true,
        data: { totalOrders, pendingReports, completedToday, modalityBreakdown },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
