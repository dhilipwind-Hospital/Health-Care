import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { PhysiotherapyOrder, PhysiotherapySession, PhysiotherapyStatus, SessionStatus } from '../models/PhysiotherapyOrder';

export class PhysiotherapyController {
  static generateOrderNumber = (): string => {
    const date = new Date();
    const prefix = 'PT';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  static getTreatmentTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: [
        { value: 'manual_therapy', label: 'Manual Therapy' },
        { value: 'exercise_therapy', label: 'Exercise Therapy' },
        { value: 'electrotherapy', label: 'Electrotherapy' },
        { value: 'ultrasound', label: 'Ultrasound Therapy' },
        { value: 'tens', label: 'TENS' },
        { value: 'hydrotherapy', label: 'Hydrotherapy' },
        { value: 'heat_therapy', label: 'Heat Therapy' },
        { value: 'cold_therapy', label: 'Cold Therapy' },
        { value: 'traction', label: 'Traction' },
        { value: 'massage', label: 'Therapeutic Massage' },
        { value: 'mobilization', label: 'Joint Mobilization' },
        { value: 'stretching', label: 'Stretching Exercises' },
        { value: 'strengthening', label: 'Strengthening Exercises' },
        { value: 'balance_training', label: 'Balance Training' },
        { value: 'gait_training', label: 'Gait Training' },
        { value: 'post_surgical', label: 'Post-Surgical Rehabilitation' },
      ]
    });
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, patientId, doctorId } = req.query;

      const qb = repo.createQueryBuilder('o')
        .leftJoinAndSelect('o.patient', 'patient')
        .leftJoinAndSelect('o.doctor', 'doctor')
        .leftJoinAndSelect('o.therapist', 'therapist');

      if (orgId) qb.where('o.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('o.status = :status', { status });
      if (patientId) qb.andWhere('o.patient_id = :patientId', { patientId });
      if (doctorId) qb.andWhere('o.doctor_id = :doctorId', { doctorId });

      qb.orderBy('o.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const order = await repo.findOne({ where, relations: ['patient', 'doctor', 'therapist'] });
      if (!order) return res.status(404).json({ success: false, message: 'Not found' });

      res.json({ success: true, data: order });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const order = repo.create({
        ...req.body,
        organizationId: orgId,
        orderNumber: PhysiotherapyController.generateOrderNumber(),
        status: PhysiotherapyStatus.ORDERED,
        completedSessions: 0,
      });

      const saved = await repo.save(order);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapyOrder);
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

  // Sessions
  static listSessions = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapySession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('s')
        .leftJoinAndSelect('s.order', 'order')
        .leftJoinAndSelect('order.patient', 'patient')
        .leftJoinAndSelect('s.therapist', 'therapist')
        .where('s.order_id = :orderId', { orderId: req.params.orderId });

      if (orgId) qb.andWhere('s.organization_id = :orgId', { orgId });

      qb.orderBy('s.session_number', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createSession = async (req: Request, res: Response) => {
    try {
      const sessionRepo = AppDataSource.getRepository(PhysiotherapySession);
      const orderRepo = AppDataSource.getRepository(PhysiotherapyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const order = await orderRepo.findOne({ where: { id: req.params.orderId, organizationId: orgId } });
      if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

      const existingSessions = await sessionRepo.count({ where: { orderId: order.id } });

      const session = sessionRepo.create({
        ...req.body,
        organizationId: orgId,
        orderId: order.id,
        sessionNumber: existingSessions + 1,
        status: SessionStatus.SCHEDULED,
      });

      const saved = await sessionRepo.save(session);

      // Update order status
      if (order.status === PhysiotherapyStatus.ORDERED) {
        order.status = PhysiotherapyStatus.SCHEDULED;
        await orderRepo.save(order);
      }

      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static completeSession = async (req: Request, res: Response) => {
    try {
      const sessionRepo = AppDataSource.getRepository(PhysiotherapySession);
      const orderRepo = AppDataSource.getRepository(PhysiotherapyOrder);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const session = await sessionRepo.findOne({ where: { id: req.params.sessionId, organizationId: orgId }, relations: ['order'] });
      if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

      session.status = SessionStatus.COMPLETED;
      session.actualDate = new Date() as any;
      if (req.body.notes) session.notes = req.body.notes;
      if (req.body.exercisesPerformed) session.exercisesPerformed = req.body.exercisesPerformed;
      if (req.body.painLevelBefore !== undefined) session.painLevelBefore = req.body.painLevelBefore;
      if (req.body.painLevelAfter !== undefined) session.painLevelAfter = req.body.painLevelAfter;
      if (req.body.progress) session.progress = req.body.progress;

      await sessionRepo.save(session);

      // Update order
      const order = session.order;
      order.completedSessions += 1;
      if (order.completedSessions >= order.totalSessions) {
        order.status = PhysiotherapyStatus.COMPLETED;
      } else {
        order.status = PhysiotherapyStatus.IN_PROGRESS;
      }
      await orderRepo.save(order);

      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getTodaySessions = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(PhysiotherapySession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const today = new Date().toISOString().split('T')[0];

      const qb = repo.createQueryBuilder('s')
        .leftJoinAndSelect('s.order', 'order')
        .leftJoinAndSelect('order.patient', 'patient')
        .leftJoinAndSelect('s.therapist', 'therapist')
        .where('s.scheduled_date = :today', { today })
        .andWhere('s.status = :status', { status: SessionStatus.SCHEDULED });

      if (orgId) qb.andWhere('s.organization_id = :orgId', { orgId });

      qb.orderBy('s.scheduled_time', 'ASC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
