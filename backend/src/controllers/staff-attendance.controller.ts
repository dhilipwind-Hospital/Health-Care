import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { StaffAttendance, AttendanceStatus } from '../models/StaffAttendance';
import { Between } from 'typeorm';

export class StaffAttendanceController {
  static clockIn = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const staffId = (req as any).user?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const today = new Date().toISOString().split('T')[0];

      // Check if already clocked in today
      const existing = await repo.findOne({ where: { organizationId: orgId, staffId, date: today as any } });
      if (existing && existing.clockInTime) {
        return res.status(400).json({ success: false, message: 'Already clocked in today' });
      }

      if (existing) {
        existing.clockInTime = new Date();
        existing.status = AttendanceStatus.PRESENT;
        await repo.save(existing);
        return res.json({ success: true, data: existing });
      }

      const record = repo.create({
        organizationId: orgId,
        staffId,
        date: today,
        clockInTime: new Date(),
        status: AttendanceStatus.PRESENT,
      } as any);
      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static clockOut = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const staffId = (req as any).user?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const today = new Date().toISOString().split('T')[0];

      const record = await repo.findOne({ where: { organizationId: orgId, staffId, date: today as any } });
      if (!record) return res.status(404).json({ success: false, message: 'No clock-in record found for today' });
      if (record.clockOutTime) return res.status(400).json({ success: false, message: 'Already clocked out' });

      record.clockOutTime = new Date();
      if (record.clockInTime) {
        const diff = (record.clockOutTime.getTime() - new Date(record.clockInTime).getTime()) / 3600000;
        record.hoursWorked = Math.round(diff * 100) / 100;
        if (diff > 8) record.overtime = Math.round((diff - 8) * 60);
      }
      await repo.save(record);
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const { date, staffId, status } = req.query;
      const where: any = { organizationId: orgId };
      if (date) where.date = date;
      if (staffId) where.staffId = staffId;
      if (status) where.status = status;
      const data = await repo.find({ where, relations: ['staff'], order: { date: 'DESC', clockInTime: 'DESC' }, take: 500 });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getToday = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const today = new Date().toISOString().split('T')[0];
      const data = await repo.find({
        where: { organizationId: orgId, date: today as any },
        relations: ['staff'],
        order: { clockInTime: 'ASC' },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getSummary = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const { month, year } = req.query;
      const y = Number(year) || new Date().getFullYear();
      const m = Number(month) || new Date().getMonth() + 1;
      const startDate = `${y}-${String(m).padStart(2, '0')}-01`;
      const endDate = `${y}-${String(m).padStart(2, '0')}-31`;

      const data = await repo.find({
        where: { organizationId: orgId, date: Between(startDate, endDate) as any },
        relations: ['staff'],
        order: { date: 'ASC' },
      });

      const summary: Record<string, any> = {};
      data.forEach((r) => {
        if (!summary[r.staffId]) {
          summary[r.staffId] = { staffId: r.staffId, staff: (r as any).staff, present: 0, absent: 0, late: 0, leave: 0, totalHours: 0, totalOvertime: 0 };
        }
        summary[r.staffId][r.status]++;
        summary[r.staffId].totalHours += Number(r.hoursWorked || 0);
        summary[r.staffId].totalOvertime += Number(r.overtime || 0);
      });

      res.json({ success: true, data: Object.values(summary) });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static mark = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const markedById = (req as any).user?.id;
      const repo = AppDataSource.getRepository(StaffAttendance);
      const { staffId, date, status, notes } = req.body;

      let record = await repo.findOne({ where: { organizationId: orgId, staffId, date } });
      if (record) {
        record.status = status;
        record.notes = notes;
        record.markedById = markedById;
      } else {
        record = repo.create({ organizationId: orgId, staffId, date, status, notes, markedById } as any);
      }
      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
