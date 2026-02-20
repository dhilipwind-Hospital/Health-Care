import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { InsuranceCompany, InsuranceClaim, ClaimStatus, ClaimType } from '../models/InsuranceTPA';

export class InsuranceTpaController {
  static generateClaimNumber = (): string => {
    const date = new Date();
    const prefix = 'CLM';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  // Insurance Companies
  static listCompanies = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceCompany);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('c');
      if (orgId) qb.where('c.organization_id = :orgId', { orgId });
      qb.orderBy('c.name', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createCompany = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceCompany);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const company = repo.create({
        ...req.body,
        organizationId: orgId,
        isActive: true,
      });

      const saved = await repo.save(company);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateCompany = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceCompany);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const company = await repo.findOne({ where });
      if (!company) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(company, req.body);
      const saved = await repo.save(company);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // Claims
  static listClaims = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, patientId, insuranceCompanyId } = req.query;

      const qb = repo.createQueryBuilder('c')
        .leftJoinAndSelect('c.patient', 'patient')
        .leftJoinAndSelect('c.insuranceCompany', 'insuranceCompany')
        .leftJoinAndSelect('c.createdBy', 'createdBy');

      if (orgId) qb.where('c.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('c.status = :status', { status });
      if (patientId) qb.andWhere('c.patient_id = :patientId', { patientId });
      if (insuranceCompanyId) qb.andWhere('c.insurance_company_id = :insuranceCompanyId', { insuranceCompanyId });

      qb.orderBy('c.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createClaim = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const claim = repo.create({
        ...req.body,
        organizationId: orgId,
        createdById: userId,
        claimNumber: InsuranceTpaController.generateClaimNumber(),
        status: ClaimStatus.DRAFT,
      });

      const saved = await repo.save(claim);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateClaim = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const claim = await repo.findOne({ where });
      if (!claim) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(claim, req.body);
      const saved = await repo.save(claim);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static submitClaim = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const claim = await repo.findOne({ where });
      if (!claim) return res.status(404).json({ success: false, message: 'Not found' });

      claim.status = ClaimStatus.SUBMITTED;
      claim.submissionDate = new Date() as any;

      const saved = await repo.save(claim);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateClaimStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const claim = await repo.findOne({ where });
      if (!claim) return res.status(404).json({ success: false, message: 'Not found' });

      claim.status = req.body.status;
      if (req.body.approvedAmount !== undefined) claim.approvedAmount = req.body.approvedAmount;
      if (req.body.settledAmount !== undefined) claim.settledAmount = req.body.settledAmount;
      if (req.body.patientResponsibility !== undefined) claim.patientResponsibility = req.body.patientResponsibility;
      if (req.body.queryDetails) claim.queryDetails = req.body.queryDetails;
      if (req.body.rejectionReason) claim.rejectionReason = req.body.rejectionReason;
      if (req.body.remarks) claim.remarks = req.body.remarks;

      if (req.body.status === ClaimStatus.APPROVED) claim.approvalDate = new Date() as any;
      if (req.body.status === ClaimStatus.SETTLED) claim.settlementDate = new Date() as any;

      const saved = await repo.save(claim);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(InsuranceClaim);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('c');
      if (orgId) qb.where('c.organization_id = :orgId', { orgId });

      const total = await qb.getCount();

      const byStatus = await repo.createQueryBuilder('c')
        .select('c.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .addSelect('SUM(c.claimed_amount)', 'totalClaimed')
        .addSelect('SUM(c.approved_amount)', 'totalApproved')
        .where(orgId ? 'c.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('c.status')
        .getRawMany();

      res.json({ success: true, data: { total, byStatus } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getClaimTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(ClaimType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static getClaimStatuses = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(ClaimStatus).map(s => ({
        value: s,
        label: s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };
}
