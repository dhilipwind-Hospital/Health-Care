import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { HousekeepingTask, HousekeepingStatus } from '../models/HousekeepingTask';

export class HousekeepingController {
  static dashboard = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const [pending, assigned, inProgress, completed, verified] = await Promise.all([
        repo.count({ where: { organizationId: orgId, status: HousekeepingStatus.PENDING } }),
        repo.count({ where: { organizationId: orgId, status: HousekeepingStatus.ASSIGNED } }),
        repo.count({ where: { organizationId: orgId, status: HousekeepingStatus.IN_PROGRESS } }),
        repo.count({ where: { organizationId: orgId, status: HousekeepingStatus.COMPLETED } }),
        repo.count({ where: { organizationId: orgId, status: HousekeepingStatus.VERIFIED } }),
      ]);
      res.json({ success: true, data: { pending, assigned, inProgress, completed, verified, total: pending + assigned + inProgress + completed + verified } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static list = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const { status, priority, taskType } = req.query;
      const where: any = { organizationId: orgId };
      if (status) where.status = status;
      if (priority) where.priority = priority;
      if (taskType) where.taskType = taskType;
      const data = await repo.find({ where, relations: ['assignedTo', 'verifiedBy'], order: { createdAt: 'DESC' }, take: 200 });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await repo.count({ where: { organizationId: orgId } });
      const taskNumber = `HK-${today}-${String(count + 1).padStart(4, '0')}`;
      const task = repo.create({ ...req.body, organizationId: orgId, taskNumber, assignedById: (req as any).user?.id } as any);
      const saved = await repo.save(task);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static assign = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const task = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      task.assignedToId = req.body.assignedToId;
      task.assignedById = (req as any).user?.id;
      task.status = HousekeepingStatus.ASSIGNED;
      await repo.save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static start = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const task = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      task.status = HousekeepingStatus.IN_PROGRESS;
      task.startedAt = new Date();
      await repo.save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static complete = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const task = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      task.status = HousekeepingStatus.COMPLETED;
      task.completedAt = new Date();
      if (task.startedAt) {
        task.turnaroundMinutes = Math.round((task.completedAt.getTime() - new Date(task.startedAt).getTime()) / 60000);
      }
      await repo.save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static verify = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(HousekeepingTask);
      const task = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
      task.status = HousekeepingStatus.VERIFIED;
      task.verifiedAt = new Date();
      task.verifiedById = (req as any).user?.id;
      await repo.save(task);
      res.json({ success: true, data: task });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
