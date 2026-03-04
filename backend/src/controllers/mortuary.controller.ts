import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MortuaryRecord, MortuaryStatus } from '../models/MortuaryRecord';
import { Not, In } from 'typeorm';

export class MortuaryController {
  static list = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(MortuaryRecord);
      const { status } = req.query;
      const where: any = { organizationId: orgId };
      if (status) where.status = status;
      const data = await repo.find({ where, relations: ['patient'], order: { createdAt: 'DESC' }, take: 200 });
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(MortuaryRecord);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await repo.count({ where: { organizationId: orgId } });
      const recordNumber = `MR-${today}-${String(count + 1).padStart(4, '0')}`;
      const record = repo.create({ ...req.body, organizationId: orgId, recordNumber } as any);
      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getOccupancy = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(MortuaryRecord);
      const occupied = await repo.count({
        where: { organizationId: orgId, status: In([MortuaryStatus.ADMITTED, MortuaryStatus.STORED, MortuaryStatus.POST_MORTEM, MortuaryStatus.READY_FOR_RELEASE]) },
      });
      const released = await repo.count({ where: { organizationId: orgId, status: MortuaryStatus.RELEASED } });
      const total = occupied + released;
      res.json({ success: true, data: { occupied, released, total } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static admit = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(MortuaryRecord);
      const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const count = await repo.count({ where: { organizationId: orgId } });
      const recordNumber = `MR-${today}-${String(count + 1).padStart(4, '0')}`;
      const record = repo.create({
        ...req.body,
        organizationId: orgId,
        recordNumber,
        status: MortuaryStatus.ADMITTED,
        storageStartTime: new Date(),
      } as any);
      const saved = await repo.save(record);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static release = async (req: Request, res: Response) => {
    try {
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const repo = AppDataSource.getRepository(MortuaryRecord);
      const record = await repo.findOne({ where: { id: req.params.id, organizationId: orgId } });
      if (!record) return res.status(404).json({ success: false, message: 'Record not found' });
      record.status = MortuaryStatus.RELEASED;
      record.releasedAt = new Date();
      record.storageEndTime = new Date();
      record.releaseAuthorizedById = (req as any).user?.id;
      if (req.body.releasedTo) record.releasedTo = req.body.releasedTo;
      if (req.body.releasedToRelation) record.releasedToRelation = req.body.releasedToRelation;
      if (req.body.releasedToIdType) record.releasedToIdType = req.body.releasedToIdType;
      if (req.body.releasedToIdNumber) record.releasedToIdNumber = req.body.releasedToIdNumber;
      await repo.save(record);
      res.json({ success: true, data: record });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
