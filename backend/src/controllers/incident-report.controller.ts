import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { IncidentReport, IncidentStatus, IncidentType, IncidentSeverity } from '../models/IncidentReport';

export class IncidentReportController {

  static generateIncidentNumber = (): string => {
    const date = new Date();
    const prefix = 'INC';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20'), 1), 100);
      const status = req.query.status as string;
      const type = req.query.type as string;
      const severity = req.query.severity as string;

      const qb = repo.createQueryBuilder('ir')
        .leftJoinAndSelect('ir.reportedBy', 'reportedBy')
        .leftJoinAndSelect('ir.patient', 'patient')
        .leftJoinAndSelect('ir.investigatedBy', 'investigatedBy');

      if (orgId) qb.where('ir.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('ir.status = :status', { status });
      if (type) qb.andWhere('ir.type = :type', { type });
      if (severity) qb.andWhere('ir.severity = :severity', { severity });

      qb.orderBy('ir.incident_date', 'DESC');

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
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const incident = repo.create({
        ...req.body,
        organizationId: orgId,
        reportedById: userId,
        incidentNumber: IncidentReportController.generateIncidentNumber(),
        incidentDate: req.body.incidentDate || new Date(),
        status: IncidentStatus.REPORTED,
      });

      const saved = await repo.save(incident);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const incident = await repo.findOne({
        where,
        relations: ['reportedBy', 'patient', 'investigatedBy'],
      });

      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      res.json({ success: true, data: incident });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const incident = await repo.findOne({ where });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      Object.assign(incident, req.body);
      const saved = await repo.save(incident);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const incident = await repo.findOne({ where });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      incident.status = req.body.status;
      if (req.body.status === IncidentStatus.UNDER_INVESTIGATION) {
        incident.investigatedById = userId;
      }
      if (req.body.investigationNotes) {
        incident.investigationNotes = req.body.investigationNotes;
      }

      const saved = await repo.save(incident);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static addCapa = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const incident = await repo.findOne({ where });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      incident.rootCause = req.body.rootCause;
      incident.correctiveAction = req.body.correctiveAction;
      incident.preventiveAction = req.body.preventiveAction;
      incident.capaDueDate = req.body.capaDueDate;
      incident.status = IncidentStatus.CAPA_INITIATED;

      const saved = await repo.save(incident);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static completeCapa = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const incident = await repo.findOne({ where });
      if (!incident) {
        return res.status(404).json({ success: false, message: 'Incident not found' });
      }

      incident.capaCompletedDate = new Date();
      incident.status = IncidentStatus.RESOLVED;

      const saved = await repo.save(incident);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(IncidentReport);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('ir');
      if (orgId) qb.where('ir.organization_id = :orgId', { orgId });

      const total = await qb.getCount();

      const byStatus = await repo.createQueryBuilder('ir')
        .select('ir.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'ir.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('ir.status')
        .getRawMany();

      const byType = await repo.createQueryBuilder('ir')
        .select('ir.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'ir.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('ir.type')
        .getRawMany();

      const bySeverity = await repo.createQueryBuilder('ir')
        .select('ir.severity', 'severity')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'ir.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('ir.severity')
        .getRawMany();

      res.json({
        success: true,
        data: { total, byStatus, byType, bySeverity }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(IncidentType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static getSeverities = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(IncidentSeverity).map(s => ({
        value: s,
        label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };
}
