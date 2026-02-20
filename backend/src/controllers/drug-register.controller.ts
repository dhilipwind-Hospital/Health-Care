import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { DrugRegisterEntry, DrugScheduleType } from '../models/pharmacy/DrugRegisterEntry';
import { NdpsRegisterEntry, NdpsTransactionType } from '../models/pharmacy/NdpsRegisterEntry';
import { Medicine } from '../models/pharmacy/Medicine';

export class DrugRegisterController {

  static listDrugRegister = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DrugRegisterEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20'), 1), 100);
      const scheduleType = req.query.scheduleType as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const medicineId = req.query.medicineId as string;

      const qb = repo.createQueryBuilder('dr')
        .leftJoinAndSelect('dr.medicine', 'medicine')
        .leftJoinAndSelect('dr.patient', 'patient')
        .leftJoinAndSelect('dr.doctor', 'doctor')
        .leftJoinAndSelect('dr.dispensedBy', 'dispensedBy');

      if (orgId) qb.where('dr.organization_id = :orgId', { orgId });
      if (scheduleType) qb.andWhere('dr.schedule_type = :scheduleType', { scheduleType });
      if (startDate) qb.andWhere('dr.date >= :startDate', { startDate });
      if (endDate) qb.andWhere('dr.date <= :endDate', { endDate });
      if (medicineId) qb.andWhere('dr.medicine_id = :medicineId', { medicineId });

      qb.orderBy('dr.date', 'DESC').addOrderBy('dr.created_at', 'DESC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createDrugRegisterEntry = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DrugRegisterEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const entry = repo.create({
        ...req.body,
        organizationId: orgId,
        dispensedById: userId,
        date: req.body.date || new Date(),
      });

      const saved = await repo.save(entry);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getDrugRegisterReport = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(DrugRegisterEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const scheduleType = req.query.scheduleType as string || 'schedule_h';

      const qb = repo.createQueryBuilder('dr')
        .leftJoinAndSelect('dr.medicine', 'medicine')
        .leftJoinAndSelect('dr.patient', 'patient')
        .leftJoinAndSelect('dr.doctor', 'doctor');

      if (orgId) qb.where('dr.organization_id = :orgId', { orgId });
      qb.andWhere('dr.schedule_type = :scheduleType', { scheduleType });
      if (startDate) qb.andWhere('dr.date >= :startDate', { startDate });
      if (endDate) qb.andWhere('dr.date <= :endDate', { endDate });

      qb.orderBy('dr.date', 'ASC').addOrderBy('dr.created_at', 'ASC');

      const data = await qb.getMany();

      const report = data.map((entry, index) => ({
        slNo: index + 1,
        date: entry.date,
        patientName: entry.patientName,
        patientAddress: entry.patientAddress,
        patientAge: entry.patientAge,
        doctorName: entry.doctorName,
        doctorLicenseNumber: entry.doctorLicenseNumber,
        prescriptionDate: entry.prescriptionDate,
        medicineName: entry.medicineName,
        medicineStrength: entry.medicineStrength,
        quantity: entry.quantity,
        batchNumber: entry.batchNumber,
        remarks: entry.remarks,
      }));

      res.json({ success: true, data: report, scheduleType });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static listNdpsRegister = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(NdpsRegisterEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '20'), 1), 100);
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;
      const medicineId = req.query.medicineId as string;

      const qb = repo.createQueryBuilder('ndps')
        .leftJoinAndSelect('ndps.medicine', 'medicine')
        .leftJoinAndSelect('ndps.patient', 'patient')
        .leftJoinAndSelect('ndps.doctor', 'doctor')
        .leftJoinAndSelect('ndps.recordedBy', 'recordedBy');

      if (orgId) qb.where('ndps.organization_id = :orgId', { orgId });
      if (startDate) qb.andWhere('ndps.date >= :startDate', { startDate });
      if (endDate) qb.andWhere('ndps.date <= :endDate', { endDate });
      if (medicineId) qb.andWhere('ndps.medicine_id = :medicineId', { medicineId });

      qb.orderBy('ndps.date', 'DESC').addOrderBy('ndps.created_at', 'DESC');

      const total = await qb.getCount();
      const data = await qb.skip((page - 1) * limit).take(limit).getMany();

      res.json({
        success: true,
        data,
        meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static createNdpsEntry = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(NdpsRegisterEntry);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const entry = repo.create({
        ...req.body,
        organizationId: orgId,
        recordedById: userId,
        date: req.body.date || new Date(),
      });

      const saved = await repo.save(entry);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getNdpsDailyBalance = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(NdpsRegisterEntry);
      const medicineRepo = AppDataSource.getRepository(Medicine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const date = req.query.date as string || new Date().toISOString().split('T')[0];

      const medWhere: any = { scheduleType: 'ndps', isActive: true };
      if (orgId) medWhere.organizationId = orgId;
      const ndpsMedicines = await medicineRepo.find({ where: medWhere });

      const balances = [];

      for (const med of ndpsMedicines) {
        const latestEntry = await repo.createQueryBuilder('ndps')
          .where('ndps.medicine_id = :medicineId', { medicineId: med.id })
          .andWhere('ndps.date <= :date', { date })
          .orderBy('ndps.date', 'DESC')
          .addOrderBy('ndps.created_at', 'DESC')
          .getOne();

        balances.push({
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          strength: med.strength,
          closingBalance: latestEntry?.closingBalance || 0,
          lastUpdated: latestEntry?.date || null,
        });
      }

      res.json({ success: true, data: balances, date });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getNdpsPeriodicReturn = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(NdpsRegisterEntry);
      const medicineRepo = AppDataSource.getRepository(Medicine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, message: 'startDate and endDate required' });
      }

      const medWhere: any = { scheduleType: 'ndps', isActive: true };
      if (orgId) medWhere.organizationId = orgId;
      const ndpsMedicines = await medicineRepo.find({ where: medWhere });

      const report = [];

      for (const med of ndpsMedicines) {
        const qb = repo.createQueryBuilder('ndps')
          .select('SUM(ndps.received)', 'totalReceived')
          .addSelect('SUM(ndps.dispensed)', 'totalDispensed')
          .where('ndps.medicine_id = :medicineId', { medicineId: med.id })
          .andWhere('ndps.date >= :startDate', { startDate })
          .andWhere('ndps.date <= :endDate', { endDate });

        const summary = await qb.getRawOne();

        const openingEntry = await repo.createQueryBuilder('ndps')
          .where('ndps.medicine_id = :medicineId', { medicineId: med.id })
          .andWhere('ndps.date < :startDate', { startDate })
          .orderBy('ndps.date', 'DESC')
          .addOrderBy('ndps.created_at', 'DESC')
          .getOne();

        const closingEntry = await repo.createQueryBuilder('ndps')
          .where('ndps.medicine_id = :medicineId', { medicineId: med.id })
          .andWhere('ndps.date <= :endDate', { endDate })
          .orderBy('ndps.date', 'DESC')
          .addOrderBy('ndps.created_at', 'DESC')
          .getOne();

        report.push({
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          strength: med.strength,
          openingBalance: openingEntry?.closingBalance || 0,
          totalReceived: parseFloat(summary?.totalReceived) || 0,
          totalDispensed: parseFloat(summary?.totalDispensed) || 0,
          closingBalance: closingEntry?.closingBalance || 0,
        });
      }

      res.json({ success: true, data: report, period: { startDate, endDate } });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getScheduledMedicines = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(Medicine);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const scheduleType = req.query.scheduleType as string;

      const qb = repo.createQueryBuilder('m')
        .where('m.is_active = true')
        .andWhere('m.schedule_type IS NOT NULL')
        .andWhere("m.schedule_type != 'general'")
        .andWhere("m.schedule_type != 'otc'");

      if (orgId) qb.andWhere('m.organization_id = :orgId', { orgId });
      if (scheduleType) qb.andWhere('m.schedule_type = :scheduleType', { scheduleType });

      qb.orderBy('m.schedule_type', 'ASC').addOrderBy('m.name', 'ASC');

      const data = await qb.getMany();

      res.json({ success: true, data });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
