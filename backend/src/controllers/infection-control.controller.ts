import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InfectionSurveillance, HandHygieneAudit, InfectionType, InfectionStatus } from '../models/InfectionControl';

export class InfectionControlController {
  static listInfections = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InfectionSurveillance);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, infectionType } = req.query;

      const qb = repo.createQueryBuilder('i')
        .leftJoinAndSelect('i.patient', 'patient')
        .leftJoinAndSelect('i.reportedBy', 'reportedBy');

      if (orgId) qb.where('i.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('i.status = :status', { status });
      if (infectionType) qb.andWhere('i.infectionType = :infectionType', { infectionType });

      qb.orderBy('i.detection_date', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createInfection = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InfectionSurveillance);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        reportedById: userId,
        status: InfectionStatus.SUSPECTED,
      });

      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateInfection = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InfectionSurveillance);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const record = await repo.findOne({ where });
      if (!record) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(record, req.body);
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static listAudits = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(HandHygieneAudit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { department } = req.query;

      const qb = repo.createQueryBuilder('a')
        .leftJoinAndSelect('a.auditor', 'auditor');

      if (orgId) qb.where('a.organization_id = :orgId', { orgId });
      if (department) qb.andWhere('a.department = :department', { department });

      qb.orderBy('a.audit_date', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createAudit = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(HandHygieneAudit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const complianceRate = req.body.opportunitiesObserved > 0
        ? (req.body.compliantActions / req.body.opportunitiesObserved) * 100
        : 0;

      const audit = repo.create({
        ...req.body,
        organizationId: orgId,
        auditorId: userId,
        complianceRate,
      });

      const saved = await repo.save(audit);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getInfectionTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(InfectionType).map(t => ({
        value: t,
        label: t.toUpperCase()
      }))
    });
  };

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const infRepo = AppDataSource.getRepository(InfectionSurveillance);
      const auditRepo = AppDataSource.getRepository(HandHygieneAudit);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const activeInfections = await infRepo.count({
        where: orgId ? { organizationId: orgId, status: InfectionStatus.CONFIRMED as any } : { status: InfectionStatus.CONFIRMED as any }
      });

      const avgCompliance = await auditRepo.createQueryBuilder('a')
        .select('AVG(a.compliance_rate)', 'avg')
        .where(orgId ? 'a.organization_id = :orgId' : '1=1', { orgId })
        .getRawOne();

      res.json({
        success: true,
        data: {
          activeInfections,
          avgHandHygieneCompliance: parseFloat(avgCompliance?.avg || 0).toFixed(1)
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
