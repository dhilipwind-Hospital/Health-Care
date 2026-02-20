import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DutyRoster, LeaveRequest, ShiftType, DutyStatus } from '../models/DutyRoster';

export class DutyRosterController {
  static listDuties = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DutyRoster);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { staffId, departmentId, date, startDate, endDate } = req.query;

      const qb = repo.createQueryBuilder('d')
        .leftJoinAndSelect('d.staff', 'staff')
        .leftJoinAndSelect('d.department', 'department');

      if (orgId) qb.where('d.organization_id = :orgId', { orgId });
      if (staffId) qb.andWhere('d.staff_id = :staffId', { staffId });
      if (departmentId) qb.andWhere('d.department_id = :departmentId', { departmentId });
      if (date) qb.andWhere('d.duty_date = :date', { date });
      if (startDate) qb.andWhere('d.duty_date >= :startDate', { startDate });
      if (endDate) qb.andWhere('d.duty_date <= :endDate', { endDate });

      qb.orderBy('d.duty_date', 'ASC').addOrderBy('d.start_time', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createDuty = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DutyRoster);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const duty = repo.create({
        ...req.body,
        organizationId: orgId,
        createdById: userId,
        status: DutyStatus.SCHEDULED,
      });

      const saved = await repo.save(duty);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateDuty = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DutyRoster);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const duty = await repo.findOne({ where });
      if (!duty) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(duty, req.body);
      const saved = await repo.save(duty);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deleteDuty = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DutyRoster);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const result = await repo.delete(where);
      res.json({ success: true, deleted: result.affected });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static listLeaves = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(LeaveRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { staffId, status } = req.query;

      const qb = repo.createQueryBuilder('l')
        .leftJoinAndSelect('l.staff', 'staff')
        .leftJoinAndSelect('l.approvedBy', 'approvedBy');

      if (orgId) qb.where('l.organization_id = :orgId', { orgId });
      if (staffId) qb.andWhere('l.staff_id = :staffId', { staffId });
      if (status) qb.andWhere('l.status = :status', { status });

      qb.orderBy('l.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createLeave = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(LeaveRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const leave = repo.create({
        ...req.body,
        organizationId: orgId,
        status: 'pending',
      });

      const saved = await repo.save(leave);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static approveLeave = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(LeaveRequest);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const leave = await repo.findOne({ where });
      if (!leave) return res.status(404).json({ success: false, message: 'Not found' });

      leave.status = req.body.approved ? 'approved' : 'rejected';
      leave.approvedById = userId;
      leave.approvedAt = new Date();
      leave.remarks = req.body.remarks;

      const saved = await repo.save(leave);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getShiftTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(ShiftType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };
}
