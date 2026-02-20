import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { Report } from '../models/Report';
import { User } from '../models/User';

export class ReportController {
  static listPatientReports = async (req: Request, res: Response) => {
    const { patientId } = req.params as any;
    const user = (req as any).user;
    let tenantId = (req as any).tenant?.id || user?.organizationId;

    if ((req as any).crossOrgAccess) {
      tenantId = (req as any).crossOrgAccess.patientOrganizationId;
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    try {
      // 1. Reports
      const reportRepo = AppDataSource.getRepository(Report);
      const reports = await reportRepo.createQueryBuilder('report')
        .where('report.patientId = :patientId', { patientId })
        .andWhere('report.organization_id = :tenantId', { tenantId })
        .getMany();

      // 2. Medical Records (Consultations, etc)
      const { MedicalRecord } = require('../models/MedicalRecord');
      const medRepo = AppDataSource.getRepository(MedicalRecord);
      const records = await medRepo.createQueryBuilder('record')
        .where('record.patient_id = :patientId', { patientId })
        .andWhere('record.organization_id = :tenantId', { tenantId })
        .getMany();

      // 3. Prescriptions
      const { Prescription } = require('../models/pharmacy/Prescription');
      const presRepo = AppDataSource.getRepository(Prescription);
      const prescriptions = await presRepo.createQueryBuilder('p')
        .where('p.patient_id = :patientId', { patientId })
        .andWhere('p.organization_id = :tenantId', { tenantId })
        .getMany();

      // 4. Lab Orders
      const { LabOrder } = require('../models/LabOrder');
      const labRepo = AppDataSource.getRepository(LabOrder);
      const labs = await labRepo.createQueryBuilder('l')
        .where('l.patient_id = :patientId', { patientId })
        .andWhere('l.organization_id = :tenantId', { tenantId })
        .getMany();

      // Combine and format
      const combined = [
        ...reports.map((r: any) => ({
          id: r.id,
          type: r.type || 'note',
          title: r.title,
          content: r.content,
          createdAt: r.createdAt
        })),
        ...records.map((r: any) => ({
          id: r.id,
          type: 'note', // Consultations show as notes
          title: r.title || 'Consultation',
          content: r.diagnosis || r.description,
          createdAt: r.createdAt || r.recordDate
        })),
        ...prescriptions.map((p: any) => ({
          id: p.id,
          type: 'prescription',
          title: 'Prescription',
          content: p.diagnosis || p.notes,
          createdAt: p.createdAt || p.prescriptionDate
        })),
        ...labs.map((l: any) => ({
          id: l.id,
          type: 'lab',
          title: l.orderNumber || 'Lab Order',
          content: l.diagnosis || l.clinicalNotes,
          createdAt: l.createdAt || l.orderDate
        }))
      ];

      // Sort DESC
      combined.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      return res.json(combined);
    } catch (e) {
      console.error('List reports error:', e);
      return res.status(500).json({ message: 'Failed to list reports' });
    }
  };

  static getReport = async (req: Request, res: Response) => {
    const { reportId } = req.params as any;
    const user = (req as any).user;
    let tenantId = (req as any).tenant?.id || user?.organizationId;

    if ((req as any).crossOrgAccess) {
      tenantId = (req as any).crossOrgAccess.patientOrganizationId;
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const repo = AppDataSource.getRepository(Report);
    try {
      // CRITICAL: Filter by organization_id
      const report = await repo.findOne({
        where: { id: reportId, organizationId: tenantId } as any
      });
      if (!report) return res.status(404).json({ message: 'Report not found' });
      return res.json(report);
    } catch (e) {
      console.error('Get report error:', e);
      return res.status(500).json({ message: 'Failed to get report' });
    }
  };

  static createReport = async (req: Request, res: Response) => {
    const user = (req as any).user;
    let tenantId = (req as any).tenant?.id || user?.organizationId;

    if ((req as any).crossOrgAccess) {
      tenantId = (req as any).crossOrgAccess.patientOrganizationId;
    }

    if (!tenantId) {
      return res.status(400).json({ message: 'Organization context required' });
    }

    const { patientId, type = 'other', title, content } = req.body || {};
    if (!patientId || !title) return res.status(400).json({ message: 'patientId and title are required' });
    const repo = AppDataSource.getRepository(Report);
    const userRepo = AppDataSource.getRepository(User);
    try {
      // CRITICAL: Filter patient by organization_id
      const patient = await userRepo.findOne({
        where: { id: patientId, organizationId: tenantId }
      });
      if (!patient) return res.status(404).json({ message: 'Patient not found' });
      const r = new Report();
      r.patientId = patientId;
      r.type = type;
      r.title = title;
      r.content = content || null;
      r.organizationId = tenantId;
      const saved = await repo.save(r);
      return res.status(201).json(saved);
    } catch (e) {
      console.error('Create report error:', e);
      return res.status(500).json({ message: 'Failed to create report' });
    }
  };
}
