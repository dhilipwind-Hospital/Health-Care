import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { OtRoom } from '../models/ot/OtRoom';
import { Surgery } from '../models/ot/Surgery';
import { SurgicalChecklist } from '../models/ot/SurgicalChecklist';
import { AnesthesiaRecord } from '../models/ot/AnesthesiaRecord';
import { User } from '../models/User';
import { UserRole } from '../types/roles';

export class OtController {

  // ===== OT ROOMS =====
  static listRooms = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(OtRoom);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const rmW: any = { isActive: true };
      if (orgId) rmW.organizationId = orgId;
      const data = await repo.find({ where: rmW, order: { name: 'ASC' } });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createRoom = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(OtRoom);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const room = repo.create({ ...req.body, organizationId: orgId });
      const saved = await repo.save(room);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateRoom = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(OtRoom);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const rw1: any = { id: req.params.id };
      if (orgId) rw1.organizationId = orgId;
      const room = await repo.findOne({ where: rw1 });
      if (!room) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(room, req.body);
      const saved = await repo.save(room);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateRoomStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(OtRoom);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const rw2: any = { id: req.params.id };
      if (orgId) rw2.organizationId = orgId;
      const room = await repo.findOne({ where: rw2 });
      if (!room) return res.status(404).json({ success: false, message: 'Not found' });
      room.status = req.body.status;
      const saved = await repo.save(room);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== SURGERIES =====
  static listSurgeries = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;
      const date = req.query.date as string;
      const surgeonId = req.query.surgeonId as string;

      const qb = repo.createQueryBuilder('s')
        .leftJoinAndSelect('s.patient', 'patient')
        .leftJoinAndSelect('s.primarySurgeon', 'surgeon')
        .leftJoinAndSelect('s.otRoom', 'otRoom')
        .leftJoinAndSelect('s.anesthetist', 'anesthetist');
      if (orgId) qb.where('s.organization_id = :orgId', { orgId });

      if (status) qb.andWhere('s.status = :status', { status });
      if (date) qb.andWhere('s.scheduledDate = :date', { date });
      if (surgeonId) qb.andWhere('s.primary_surgeon_id = :surgeonId', { surgeonId });

      qb.orderBy('s.scheduledDate', 'DESC').addOrderBy('s.scheduledStartTime', 'ASC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createSurgery = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const scw: any = {};
      if (orgId) scw.organizationId = orgId;
      const count = await repo.count({ where: scw });
      const year = new Date().getFullYear();
      const surgeryNumber = `SUR-${year}-${String(count + 1).padStart(4, '0')}`;

      const surgery = repo.create({ ...req.body, organizationId: orgId, surgeryNumber });
      const saved = await repo.save(surgery);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getSurgery = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const checklistRepo = AppDataSource.getRepository(SurgicalChecklist);
      const anesthesiaRepo = AppDataSource.getRepository(AnesthesiaRecord);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const sw1: any = { id: req.params.id };
      if (orgId) sw1.organizationId = orgId;
      const surgery = await repo.findOne({
        where: sw1,
        relations: ['patient', 'primarySurgeon', 'anesthetist', 'otRoom'],
      });
      if (!surgery) return res.status(404).json({ success: false, message: 'Not found' });

      const checklist = await checklistRepo.findOne({ where: { surgeryId: surgery.id } });
      const anesthesia = await anesthesiaRepo.findOne({ where: { surgeryId: surgery.id }, relations: ['anesthetist'] });

      res.json({ success: true, data: { ...surgery, checklist, anesthesiaRecord: anesthesia } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSurgery = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw2: any = { id: req.params.id };
      if (orgId) sw2.organizationId = orgId;
      const surgery = await repo.findOne({ where: sw2 });
      if (!surgery) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(surgery, req.body);
      const saved = await repo.save(surgery);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSurgeryStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const roomRepo = AppDataSource.getRepository(OtRoom);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw3: any = { id: req.params.id };
      if (orgId) sw3.organizationId = orgId;
      const surgery = await repo.findOne({ where: sw3 });
      if (!surgery) return res.status(404).json({ success: false, message: 'Not found' });

      const newStatus = req.body.status;
      surgery.status = newStatus;

      // Auto-update room status based on surgery status
      const room = await roomRepo.findOne({ where: { id: surgery.otRoomId } });
      if (room) {
        if (newStatus === 'in_progress') {
          room.status = 'in_use' as any;
          surgery.actualStartTime = new Date();
        } else if (newStatus === 'completed') {
          room.status = 'cleaning' as any;
          surgery.actualEndTime = new Date();
          if (surgery.actualStartTime) {
            surgery.actualDuration = Math.round((new Date().getTime() - new Date(surgery.actualStartTime).getTime()) / 60000);
          }
        } else if (newStatus === 'cancelled' || newStatus === 'postponed') {
          room.status = 'available' as any;
          if (newStatus === 'cancelled') {
            surgery.cancelledBy = (req as any).user?.id;
            surgery.cancelledAt = new Date();
            surgery.cancellationReason = req.body.reason;
          }
        }
        await roomRepo.save(room);
      }

      const saved = await repo.save(surgery);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static deleteSurgery = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw4: any = { id: req.params.id };
      if (orgId) sw4.organizationId = orgId;
      const surgery = await repo.findOne({ where: sw4 });
      if (!surgery) return res.status(404).json({ success: false, message: 'Not found' });

      surgery.status = 'cancelled' as any;
      surgery.cancelledBy = (req as any).user?.id;
      surgery.cancelledAt = new Date();
      surgery.cancellationReason = req.body?.reason || 'Cancelled';
      const saved = await repo.save(surgery);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getSurgeryQueue = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qW: any = { status: 'scheduled' as any };
      if (orgId) qW.organizationId = orgId;
      const data = await repo.find({
        where: qW,
        relations: ['patient', 'primarySurgeon', 'otRoom'],
        order: { priority: 'ASC', scheduledDate: 'ASC', scheduledStartTime: 'ASC' },
      });

      // Sort by priority weight: emergency=0, urgent=1, elective=2
      const priorityWeight: Record<string, number> = { emergency: 0, urgent: 1, elective: 2 };
      data.sort((a, b) => (priorityWeight[a.priority] || 2) - (priorityWeight[b.priority] || 2));

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== CHECKLIST =====
  static getChecklist = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(SurgicalChecklist);
      const checklist = await repo.findOne({ where: { surgeryId: req.params.id } });
      res.json({ success: true, data: checklist || null });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static upsertChecklist = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(SurgicalChecklist);
      let checklist = await repo.findOne({ where: { surgeryId: req.params.id } });

      if (!checklist) {
        checklist = new SurgicalChecklist();
        checklist.surgeryId = req.params.id;
        Object.assign(checklist, req.body);
      } else {
        repo.merge(checklist, req.body);
      }

      // Auto-update status
      if (checklist.signOut?.completedAt) checklist.status = 'completed' as any;
      else if (checklist.timeOut?.completedAt) checklist.status = 'time_out_done' as any;
      else if (checklist.signIn?.completedAt) checklist.status = 'sign_in_done' as any;

      const saved = await repo.save(checklist);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== ANESTHESIA RECORD =====
  static getAnesthesia = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AnesthesiaRecord);
      const record = await repo.findOne({ where: { surgeryId: req.params.id }, relations: ['anesthetist'] });
      res.json({ success: true, data: record || null });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static upsertAnesthesia = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(AnesthesiaRecord);
      let record = await repo.findOne({ where: { surgeryId: req.params.id } });

      if (!record) {
        record = new AnesthesiaRecord();
        record.surgeryId = req.params.id;
        record.anesthetistId = req.body.anesthetistId || (req as any).user?.id;
        Object.assign(record, req.body);
      } else {
        repo.merge(record, req.body);
      }

      const saved = await repo.save(record);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== ANALYTICS =====
  static analytics = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Surgery);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const aw: any = {};
      if (orgId) aw.organizationId = orgId;
      const total = await repo.count({ where: aw });
      const completed = await repo.count({ where: { ...aw, status: 'completed' as any } });
      const scheduled = await repo.count({ where: { ...aw, status: 'scheduled' as any } });
      const inProgress = await repo.count({ where: { ...aw, status: 'in_progress' as any } });

      const avgQb = repo.createQueryBuilder('s')
        .select('AVG(s.actualDuration)', 'avg');
      if (orgId) avgQb.where('s.organization_id = :orgId', { orgId });
      const avgDurationResult = await avgQb
        .andWhere('s.actualDuration IS NOT NULL')
        .getRawOne();

      res.json({
        success: true,
        data: {
          total, completed, scheduled, inProgress,
          avgDuration: Math.round(avgDurationResult?.avg || 0),
        },
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== DOCTORS LIST (backward compatible with existing frontend) =====
  static listDoctors = async (req: Request, res: Response) => {
    try {
      const userRepo = AppDataSource.getRepository(User);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const dw: any = { role: UserRole.DOCTOR, isActive: true };
      if (orgId) dw.organizationId = orgId;
      const doctors = await userRepo.find({
        where: dw,
        select: ['id', 'firstName', 'lastName', 'specialization'],
        order: { firstName: 'ASC' },
      });

      const data = doctors.map(d => ({
        id: d.id,
        name: `Dr. ${d.firstName} ${d.lastName}`,
        specialization: d.specialization,
      }));

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
