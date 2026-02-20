import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MedicalRecordFile, FileStatus, FileType } from '../models/MedicalRecordFile';

export class MedicalRecordsController {
  static generateFileNumber = (): string => {
    const date = new Date();
    const prefix = 'MRF';
    const year = date.getFullYear().toString().slice(-2);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${prefix}-${year}${month}-${random}`;
  };

  static getFileTypes = async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: Object.values(FileType).map(t => ({
        value: t,
        label: t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      }))
    });
  };

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const { status, patientId, fileType } = req.query;

      const qb = repo.createQueryBuilder('f')
        .leftJoinAndSelect('f.patient', 'patient')
        .leftJoinAndSelect('f.uploadedBy', 'uploadedBy')
        .leftJoinAndSelect('f.scannedBy', 'scannedBy');

      if (orgId) qb.where('f.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('f.status = :status', { status });
      if (patientId) qb.andWhere('f.patient_id = :patientId', { patientId });
      if (fileType) qb.andWhere('f.file_type = :fileType', { fileType });

      qb.orderBy('f.created_at', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getByPatient = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('f')
        .leftJoinAndSelect('f.uploadedBy', 'uploadedBy')
        .where('f.patient_id = :patientId', { patientId: req.params.patientId });

      if (orgId) qb.andWhere('f.organization_id = :orgId', { orgId });

      qb.orderBy('f.document_date', 'DESC');

      const data = await qb.getMany();
      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const file = repo.create({
        ...req.body,
        organizationId: orgId,
        uploadedById: userId,
        fileNumber: MedicalRecordsController.generateFileNumber(),
        status: FileStatus.PENDING,
      });

      const saved = await repo.save(file);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const file = await repo.findOne({ where });
      if (!file) return res.status(404).json({ success: false, message: 'Not found' });

      Object.assign(file, req.body);
      const saved = await repo.save(file);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static markScanned = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const file = await repo.findOne({ where });
      if (!file) return res.status(404).json({ success: false, message: 'Not found' });

      file.status = FileStatus.SCANNED;
      file.scannedAt = new Date();
      file.scannedById = userId;
      if (req.body.filePath) file.filePath = req.body.filePath;

      const saved = await repo.save(file);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static markIndexed = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const file = await repo.findOne({ where });
      if (!file) return res.status(404).json({ success: false, message: 'Not found' });

      file.status = FileStatus.INDEXED;
      file.indexedAt = new Date();
      if (req.body.tags) file.tags = req.body.tags;
      if (req.body.metadata) file.metadata = req.body.metadata;

      const saved = await repo.save(file);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDashboard = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const qb = repo.createQueryBuilder('f');
      if (orgId) qb.where('f.organization_id = :orgId', { orgId });

      const total = await qb.getCount();

      const byStatus = await repo.createQueryBuilder('f')
        .select('f.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'f.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('f.status')
        .getRawMany();

      const byType = await repo.createQueryBuilder('f')
        .select('f.file_type', 'fileType')
        .addSelect('COUNT(*)', 'count')
        .where(orgId ? 'f.organization_id = :orgId' : '1=1', { orgId })
        .groupBy('f.file_type')
        .getRawMany();

      res.json({ success: true, data: { total, byStatus, byType } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static delete = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicalRecordFile);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const file = await repo.findOne({ where });
      if (!file) return res.status(404).json({ success: false, message: 'Not found' });

      await repo.remove(file);
      res.json({ success: true, message: 'Deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
