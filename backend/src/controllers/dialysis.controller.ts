import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DialysisMachine } from '../models/dialysis/DialysisMachine';
import { DialysisSession } from '../models/dialysis/DialysisSession';
import { DialysisPatientProfile } from '../models/dialysis/DialysisPatientProfile';

export class DialysisController {

  // ===== MACHINES =====
  static listMachines = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisMachine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const mWhere: any = { isActive: true };
      if (orgId) mWhere.organizationId = orgId;
      const data = await repo.find({ where: mWhere, order: { machineNumber: 'ASC' } });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createMachine = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisMachine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const machine = repo.create({ ...req.body, organizationId: orgId });
      const saved = await repo.save(machine);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateMachine = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisMachine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const mw1: any = { id: req.params.id };
      if (orgId) mw1.organizationId = orgId;
      const machine = await repo.findOne({ where: mw1 });
      if (!machine) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(machine, req.body);
      const saved = await repo.save(machine);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== SESSIONS =====
  static listSessions = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;
      const patientId = req.query.patientId as string;
      const date = req.query.date as string;

      const qb = repo.createQueryBuilder('ds')
        .leftJoinAndSelect('ds.patient', 'patient')
        .leftJoinAndSelect('ds.doctor', 'doctor')
        .leftJoinAndSelect('ds.machine', 'machine');
      if (orgId) qb.where('ds.organization_id = :orgId', { orgId });

      if (status) qb.andWhere('ds.status = :status', { status });
      if (patientId) qb.andWhere('ds.patient_id = :patientId', { patientId });
      if (date) qb.andWhere('ds.scheduledDate = :date', { date });

      qb.orderBy('ds.scheduledDate', 'DESC').addOrderBy('ds.scheduledTime', 'ASC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({ success: true, data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createSession = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const scw: any = {};
      if (orgId) scw.organizationId = orgId;
      const count = await repo.count({ where: scw });
      const year = new Date().getFullYear();
      const sessionNumber = `DS-${year}-${String(count + 1).padStart(4, '0')}`;

      const session = repo.create({ ...req.body, organizationId: orgId, sessionNumber });
      const saved = await repo.save(session);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getSession = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw1: any = { id: req.params.id };
      if (orgId) sw1.organizationId = orgId;
      const session = await repo.findOne({
        where: sw1,
        relations: ['patient', 'doctor', 'nurse', 'machine'],
      });
      if (!session) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: session });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateSession = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw2: any = { id: req.params.id };
      if (orgId) sw2.organizationId = orgId;
      const session = await repo.findOne({ where: sw2 });
      if (!session) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(session, req.body);
      const saved = await repo.save(session);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static startSession = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const machineRepo = AppDataSource.getRepository(DialysisMachine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw3: any = { id: req.params.id };
      if (orgId) sw3.organizationId = orgId;
      const session = await repo.findOne({ where: sw3 });
      if (!session) return res.status(404).json({ success: false, message: 'Not found' });

      session.status = 'in_progress' as any;
      session.actualStartTime = new Date();
      if (req.body.preWeight) session.preWeight = req.body.preWeight;
      if (req.body.preBP) session.preBP = req.body.preBP;
      if (req.body.preHR) session.preHR = req.body.preHR;
      if (req.body.preTemp) session.preTemp = req.body.preTemp;

      // Mark machine as in_use
      const machine = await machineRepo.findOne({ where: { id: session.machineId } });
      if (machine) {
        machine.status = 'in_use' as any;
        await machineRepo.save(machine);
      }

      const saved = await repo.save(session);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static completeSession = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisSession);
      const machineRepo = AppDataSource.getRepository(DialysisMachine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const sw4: any = { id: req.params.id };
      if (orgId) sw4.organizationId = orgId;
      const session = await repo.findOne({ where: sw4 });
      if (!session) return res.status(404).json({ success: false, message: 'Not found' });

      session.status = 'completed' as any;
      session.actualEndTime = new Date();
      if (session.actualStartTime) {
        session.durationMinutes = Math.round((new Date().getTime() - new Date(session.actualStartTime).getTime()) / 60000);
      }
      if (req.body.postWeight) session.postWeight = req.body.postWeight;
      if (req.body.postBP) session.postBP = req.body.postBP;
      if (req.body.postHR) session.postHR = req.body.postHR;
      if (req.body.postTemp) session.postTemp = req.body.postTemp;
      if (req.body.actualUF) session.actualUF = req.body.actualUF;
      if (req.body.ktv) session.ktv = req.body.ktv;
      if (req.body.urr) session.urr = req.body.urr;

      // Free machine
      const machine = await machineRepo.findOne({ where: { id: session.machineId } });
      if (machine) {
        machine.status = 'available' as any;
        machine.totalSessions = (machine.totalSessions || 0) + 1;
        await machineRepo.save(machine);
      }

      const saved = await repo.save(session);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  // ===== PATIENT PROFILES =====
  static listProfiles = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisPatientProfile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const pWhere: any = { isActive: true };
      if (orgId) pWhere.organizationId = orgId;
      const data = await repo.find({
        where: pWhere,
        relations: ['patient'],
        order: { createdAt: 'DESC' },
      });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createProfile = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisPatientProfile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      // Check if profile already exists
      const exW: any = { patientId: req.body.patientId };
      if (orgId) exW.organizationId = orgId;
      const existing = await repo.findOne({ where: exW });
      if (existing) return res.status(400).json({ success: false, message: 'Profile already exists for this patient' });

      const profile = repo.create({ ...req.body, organizationId: orgId });
      const saved = await repo.save(profile);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getProfile = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisPatientProfile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const pw1: any = { patientId: req.params.patientId };
      if (orgId) pw1.organizationId = orgId;
      const profile = await repo.findOne({
        where: pw1,
        relations: ['patient'],
      });
      if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
      res.json({ success: true, data: profile });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateProfile = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DialysisPatientProfile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const pw2: any = { id: req.params.id };
      if (orgId) pw2.organizationId = orgId;
      const profile = await repo.findOne({ where: pw2 });
      if (!profile) return res.status(404).json({ success: false, message: 'Not found' });
      repo.merge(profile, req.body);
      const saved = await repo.save(profile);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
