import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { MedicoLegalCase, MlcStatus } from '../models/MedicoLegalCase';

export class MlcController {

  static list = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const page = Math.max(parseInt(req.query.page as string || '1'), 1);
      const limit = Math.min(Math.max(parseInt(req.query.limit as string || '10'), 1), 100);
      const status = req.query.status as string;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const qb = repo.createQueryBuilder('mlc')
        .leftJoinAndSelect('mlc.patient', 'patient')
        .leftJoinAndSelect('mlc.attendingDoctor', 'doctor');

      if (orgId) qb.where('mlc.organization_id = :orgId', { orgId });
      if (status) qb.andWhere('mlc.status = :status', { status });
      if (startDate) qb.andWhere('mlc.dateTime >= :startDate', { startDate });
      if (endDate) qb.andWhere('mlc.dateTime <= :endDate', { endDate });

      qb.orderBy('mlc.dateTime', 'DESC');

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

  static getById = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const mlc = await repo.findOne({
        where,
        relations: ['patient', 'attendingDoctor'],
      });

      if (!mlc) {
        return res.status(404).json({ success: false, message: 'MLC not found' });
      }

      res.json({ success: true, data: mlc });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static create = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;
      const userId = (req as any).user?.id;

      const countWhere: any = {};
      if (orgId) countWhere.organizationId = orgId;
      const count = await repo.count({ where: countWhere });
      const year = new Date().getFullYear();
      const mlcNumber = `MLC-${year}-${String(count + 1).padStart(4, '0')}`;

      const mlc = repo.create({
        ...req.body,
        organizationId: orgId,
        mlcNumber,
        attendingDoctorId: req.body.attendingDoctorId || userId,
        dateTime: req.body.dateTime || new Date(),
        status: MlcStatus.REGISTERED,
      });

      const saved = await repo.save(mlc);
      res.status(201).json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static update = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const mlc = await repo.findOne({ where });
      if (!mlc) {
        return res.status(404).json({ success: false, message: 'MLC not found' });
      }

      repo.merge(mlc, req.body);
      const saved = await repo.save(mlc);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static updateStatus = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const mlc = await repo.findOne({ where });
      if (!mlc) {
        return res.status(404).json({ success: false, message: 'MLC not found' });
      }

      mlc.status = req.body.status;
      if (req.body.status === MlcStatus.DECEASED) {
        mlc.deathDateTime = req.body.deathDateTime || new Date();
        mlc.causeOfDeath = req.body.causeOfDeath;
      }

      const saved = await repo.save(mlc);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static sendPoliceIntimation = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const mlc = await repo.findOne({
        where,
        relations: ['patient', 'attendingDoctor'],
      });
      if (!mlc) {
        return res.status(404).json({ success: false, message: 'MLC not found' });
      }

      const patientName = mlc.patient ? `${mlc.patient.firstName} ${mlc.patient.lastName}` : 'Unknown';
      const doctorName = mlc.attendingDoctor ? `Dr. ${mlc.attendingDoctor.firstName} ${mlc.attendingDoctor.lastName}` : 'Attending Doctor';

      const intimationLetter = `
POLICE INTIMATION LETTER
========================

Date: ${new Date().toLocaleDateString('en-IN')}
Time: ${new Date().toLocaleTimeString('en-IN')}

To,
The Station House Officer,
${mlc.policeStation || '[Police Station]'}

Subject: Intimation regarding Medico-Legal Case

Sir/Madam,

This is to inform you that a patient has been admitted/brought to our hospital with injuries/condition that may require police investigation.

MLC Number: ${mlc.mlcNumber}
Date & Time of Arrival: ${new Date(mlc.dateTime).toLocaleString('en-IN')}

PATIENT DETAILS:
Name: ${patientName}
Brought By: ${mlc.broughtBy || 'Unknown'}
Relation: ${mlc.broughtByRelation || 'Unknown'}

NATURE OF CASE:
Type of Injury: ${mlc.natureOfInjury?.replace(/_/g, ' ').toUpperCase() || 'Unknown'}
Description: ${mlc.injuryDescription || 'As per clinical examination'}
Weapon/Object Used: ${mlc.weaponUsed || 'Not specified'}
Alcohol Smell: ${mlc.alcoholSmell ? 'Yes' : 'No'}
Foul Play Suspected: ${mlc.foulPlaySuspected ? 'Yes' : 'No'}

CLINICAL FINDINGS:
Consciousness Level: ${mlc.consciousnessLevel || 'Not recorded'}
GCS Score: ${mlc.gcsScore || 'Not recorded'}
Clinical Findings: ${mlc.clinicalFindings || 'As per medical examination'}

This intimation is being sent as per the provisions of Section 39 of the Code of Criminal Procedure, 1973.

Kindly acknowledge receipt of this intimation.

Yours faithfully,

${doctorName}
Registration No: [Medical Registration Number]
${mlc.organization?.name || 'Hospital Name'}
      `.trim();

      mlc.policeIntimationSent = true;
      mlc.policeIntimationDate = new Date();
      mlc.policeIntimationLetter = intimationLetter;

      const saved = await repo.save(mlc);
      res.json({
        success: true,
        data: saved,
        intimationLetter
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static recordBodyHandover = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = { id: req.params.id };
      if (orgId) where.organizationId = orgId;

      const mlc = await repo.findOne({ where });
      if (!mlc) {
        return res.status(404).json({ success: false, message: 'MLC not found' });
      }

      mlc.bodyHandoverTo = req.body.handoverTo;
      mlc.bodyHandoverDate = new Date();
      mlc.bodyHandoverWitness = req.body.witness;

      const saved = await repo.save(mlc);
      res.json({ success: true, data: saved });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static getRegister = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const qb = repo.createQueryBuilder('mlc')
        .leftJoinAndSelect('mlc.patient', 'patient')
        .leftJoinAndSelect('mlc.attendingDoctor', 'doctor');

      if (orgId) qb.where('mlc.organization_id = :orgId', { orgId });
      if (startDate) qb.andWhere('mlc.dateTime >= :startDate', { startDate });
      if (endDate) qb.andWhere('mlc.dateTime <= :endDate', { endDate });

      qb.orderBy('mlc.mlcNumber', 'ASC');

      const data = await qb.getMany();

      const register = data.map((mlc, index) => ({
        slNo: index + 1,
        mlcNumber: mlc.mlcNumber,
        dateTime: mlc.dateTime,
        patientName: mlc.patient ? `${mlc.patient.firstName} ${mlc.patient.lastName}` : 'Unknown',
        age: mlc.patient?.dateOfBirth ? Math.floor((Date.now() - new Date(mlc.patient.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null,
        gender: mlc.patient?.gender,
        address: mlc.patient?.address,
        broughtBy: mlc.broughtBy,
        natureOfInjury: mlc.natureOfInjury,
        policeStation: mlc.policeStation,
        firNumber: mlc.firNumber,
        attendingDoctor: mlc.attendingDoctor ? `Dr. ${mlc.attendingDoctor.firstName} ${mlc.attendingDoctor.lastName}` : null,
        status: mlc.status,
        policeIntimationSent: mlc.policeIntimationSent,
        isDoa: mlc.isDoa,
      }));

      res.json({ success: true, data: register });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };

  static analytics = async (req: Request, res: Response) => {
    try {
      const repo = AppDataSource.getRepository(MedicoLegalCase);
      const orgId = (req as any).user?.organizationId || (req as any).tenant?.id;

      const where: any = {};
      if (orgId) where.organizationId = orgId;

      const total = await repo.count({ where });
      const registered = await repo.count({ where: { ...where, status: MlcStatus.REGISTERED } });
      const underTreatment = await repo.count({ where: { ...where, status: MlcStatus.UNDER_TREATMENT } });
      const discharged = await repo.count({ where: { ...where, status: MlcStatus.DISCHARGED } });
      const deceased = await repo.count({ where: { ...where, status: MlcStatus.DECEASED } });
      const doaCases = await repo.count({ where: { ...where, isDoa: true } });

      const byInjuryQb = repo.createQueryBuilder('mlc')
        .select('mlc.natureOfInjury', 'injuryType')
        .addSelect('COUNT(*)', 'count');
      if (orgId) byInjuryQb.where('mlc.organization_id = :orgId', { orgId });
      const byInjury = await byInjuryQb.groupBy('mlc.natureOfInjury').getRawMany();

      res.json({
        success: true,
        data: {
          total,
          registered,
          underTreatment,
          discharged,
          deceased,
          doaCases,
          byInjury
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  };
}
