import { Request, Response } from 'express';
import { AppDataSource } from '../../config/database';
import { Admission, AdmissionStatus } from '../../models/inpatient/Admission';
import { Bed, BedStatus } from '../../models/inpatient/Bed';
import { Room } from '../../models/inpatient/Room';
import { User } from '../../models/User';
import { UserRole } from '../../types/roles';
import { NotificationType } from '../../models/Notification';
import { HousekeepingTask, HousekeepingTaskType, HousekeepingPriority, HousekeepingStatus } from '../../models/HousekeepingTask';
import { Bill, BillStatus } from '../../models/Bill';
import { LabOrder } from '../../models/LabOrder';
import { LabOrderItem } from '../../models/LabOrderItem';
import { Prescription } from '../../models/pharmacy/Prescription';
import { PrescriptionItem } from '../../models/pharmacy/PrescriptionItem';

export class AdmissionController {
  // Generate unique admission number
  private static async generateAdmissionNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const admissionRepository = AppDataSource.getRepository(Admission);

    // Get count of admissions this year
    const count = await admissionRepository
      .createQueryBuilder('admission')
      .where('EXTRACT(YEAR FROM admission.createdAt) = :year', { year })
      .getCount();

    const sequence = (count + 1).toString().padStart(4, '0');
    return `ADM-${year}-${sequence}`;
  }

  // Create new admission
  static createAdmission = async (req: Request, res: Response) => {
    try {
      const {
        patientId,
        admittingDoctorId,
        bedId,
        admissionReason,
        admissionDiagnosis,
        allergies,
        specialInstructions,
        isEmergency
      } = req.body;

      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({ message: 'Organization context required' });
      }

      // Validate required fields
      if (!patientId || !admittingDoctorId || !bedId || !admissionReason) {
        return res.status(400).json({
          success: false,
          message: 'Patient, doctor, bed, and admission reason are required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);
      const userRepository = AppDataSource.getRepository(User);

      // Verify patient exists (with tenant filtering)
      const patient = await userRepository.findOne({
        where: { id: patientId, role: UserRole.PATIENT, organizationId: tenantId }
      });
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: 'Patient not found'
        });
      }

      // Prevent duplicate active admissions for same patient
      const existingAdmission = await admissionRepository.findOne({
        where: { patientId, organizationId: tenantId, status: AdmissionStatus.ADMITTED }
      });
      if (existingAdmission) {
        return res.status(409).json({
          success: false,
          message: `Patient already has an active admission (${existingAdmission.admissionNumber})`
        });
      }

      // CRITICAL: Verify doctor exists within organization
      const doctor = await userRepository.findOne({
        where: { id: admittingDoctorId, role: UserRole.DOCTOR, organizationId: tenantId }
      });
      if (!doctor) {
        return res.status(404).json({
          success: false,
          message: 'Doctor not found'
        });
      }

      // CRITICAL: Verify bed exists and is available within organization
      const bed = await bedRepository.findOne({
        where: { id: bedId, organizationId: tenantId },
        relations: ['currentAdmission']
      });
      if (!bed) {
        return res.status(404).json({
          success: false,
          message: 'Bed not found'
        });
      }
      if (bed.status !== BedStatus.AVAILABLE) {
        return res.status(400).json({
          success: false,
          message: 'Bed is not available'
        });
      }

      // Generate admission number
      const admissionNumber = await this.generateAdmissionNumber();

      // Create admission
      const admission = admissionRepository.create({
        admissionNumber,
        patientId,
        admittingDoctorId,
        bedId,
        organizationId: tenantId,
        admissionDateTime: new Date(),
        admissionReason,
        admissionDiagnosis,
        allergies,
        specialInstructions,
        isEmergency: isEmergency || false,
        status: AdmissionStatus.ADMITTED
      });

      await admissionRepository.save(admission);

      // Update bed status and link current admission
      bed.status = BedStatus.OCCUPIED;
      bed.currentAdmission = admission;
      await bedRepository.save(bed);

      // Send admission notification email
      try {
        const { EmailService } = await import('../../services/email.service');
        EmailService.sendNotificationEmail(
          patient.email,
          'Hospital Admission Confirmation',
          `You have been admitted to the hospital. Admission Number: ${admissionNumber}. Your assigned bed is ${bed.bedNumber}.`,
          NotificationType.GENERAL
        ).catch(err => console.error('Failed to send admission email:', err));
      } catch (emailError) {
        console.error('Email service error:', emailError);
      }

      // CRITICAL: Fetch complete admission with relations, filtered by organization
      const savedAdmission = await admissionRepository.findOne({
        where: { id: admission.id, organizationId: tenantId },
        relations: ['patient', 'admittingDoctor', 'bed', 'bed.room', 'bed.room.ward']
      });

      return res.status(201).json({
        success: true,
        message: 'Patient admitted successfully',
        admission: savedAdmission
      });
    } catch (error) {
      console.error('Error creating admission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create admission'
      });
    }
  };

  // Get all admissions
  static getAllAdmissions = async (req: Request, res: Response) => {
    try {
      const { status, patientId } = req.query;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organizationId using queryBuilder
      const queryBuilder = admissionRepository
        .createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'doctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.organizationId = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC');

      if (status) {
        queryBuilder.andWhere('admission.status = :status', { status });
      }

      // ADDED: Support patientId query param for patient history
      if (patientId) {
        queryBuilder.andWhere('admission.patientId = :patientId', { patientId });
      }

      const admissions = await queryBuilder.getMany();

      // Return in format frontend expects
      return res.json({
        success: true,
        data: admissions,
        admissions // Keep for backward compatibility
      });
    } catch (error) {
      console.error('Error fetching admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admissions'
      });
    }
  };

  // Get current admissions (active patients)
  static getCurrentAdmissions = async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organizationId using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .leftJoinAndSelect('admission.dischargeSummary', 'dischargeSummary') // Include discharge summary to check for pending discharge
        .where('admission.status = :status', { status: AdmissionStatus.ADMITTED })
        .andWhere('admission.organizationId = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching current admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch current admissions'
      });
    }
  };

  // Get admission by ID
  static getAdmissionById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organizationId using queryBuilder
      const admission = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .leftJoinAndSelect('admission.nursingNotes', 'nursingNotes')
        .leftJoinAndSelect('admission.doctorNotes', 'doctorNotes')
        .leftJoinAndSelect('admission.vitalSigns', 'vitalSigns')
        .leftJoinAndSelect('admission.medications', 'medications')
        .leftJoinAndSelect('admission.dischargeSummary', 'dischargeSummary')
        .where('admission.id = :id', { id })
        .andWhere('admission.organizationId = :tenantId', { tenantId })
        .getOne();

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      return res.json({
        success: true,
        admission
      });
    } catch (error) {
      console.error('Error fetching admission:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch admission'
      });
    }
  };

  // Get patient admissions
  static getPatientAdmissions = async (req: Request, res: Response) => {
    try {
      const { patientId } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organizationId using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.admittingDoctor', 'admittingDoctor')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.patientId = :patientId', { patientId })
        .andWhere('admission.organizationId = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching patient admissions:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch patient admissions'
      });
    }
  };

  // Get doctor's patients
  static getDoctorPatients = async (req: Request, res: Response) => {
    try {
      const { doctorId } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);

      // CRITICAL: Filter by organizationId using queryBuilder
      const admissions = await admissionRepository.createQueryBuilder('admission')
        .leftJoinAndSelect('admission.patient', 'patient')
        .leftJoinAndSelect('admission.bed', 'bed')
        .leftJoinAndSelect('bed.room', 'room')
        .leftJoinAndSelect('room.ward', 'ward')
        .where('admission.admittingDoctorId = :doctorId', { doctorId })
        .andWhere('admission.status = :status', { status: AdmissionStatus.ADMITTED })
        .andWhere('admission.organizationId = :tenantId', { tenantId })
        .orderBy('admission.admissionDateTime', 'DESC')
        .getMany();

      return res.json({
        success: true,
        admissions
      });
    } catch (error) {
      console.error('Error fetching doctor patients:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch doctor patients'
      });
    }
  };

  // Transfer patient to different bed
  static transferPatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { newBedId, reason } = req.body;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      if (!newBedId) {
        return res.status(400).json({
          success: false,
          message: 'New bed ID is required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Get current admission filtered by organization
      const admission = await admissionRepository.findOne({
        where: { id, organizationId: tenantId },
        relations: ['bed']
      });
      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      // CRITICAL: Verify new bed is available within organization
      const newBed = await bedRepository.findOne({
        where: { id: newBedId, organizationId: tenantId },
        relations: ['currentAdmission']
      });
      if (!newBed) {
        return res.status(404).json({
          success: false,
          message: 'New bed not found'
        });
      }
      if (newBed.status !== BedStatus.AVAILABLE || newBed.currentAdmission) {
        return res.status(400).json({
          success: false,
          message: 'New bed is not available'
        });
      }

      // Free old bed
      const oldBed = admission.bed;
      oldBed.status = BedStatus.AVAILABLE;
      await bedRepository.save(oldBed);

      // Assign new bed
      admission.bedId = newBedId;
      newBed.status = BedStatus.OCCUPIED;
      await bedRepository.save(newBed);
      await admissionRepository.save(admission);

      return res.json({
        success: true,
        message: 'Patient transferred successfully',
        admission
      });
    } catch (error) {
      console.error('Error transferring patient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to transfer patient'
      });
    }
  };

  // Discharge patient
  static dischargePatient = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const tenantId = (req as any).tenant?.id || user?.organizationId;

      if (!tenantId) {
        return res.status(400).json({
          success: false,
          message: 'Organization context required'
        });
      }

      const admissionRepository = AppDataSource.getRepository(Admission);
      const bedRepository = AppDataSource.getRepository(Bed);

      // CRITICAL: Get admission filtered by organization
      const admission = await admissionRepository.findOne({
        where: { id, organizationId: tenantId },
        relations: ['bed', 'patient', 'dischargeSummary']
      });

      if (!admission) {
        return res.status(404).json({
          success: false,
          message: 'Admission not found'
        });
      }

      if (admission.status === AdmissionStatus.DISCHARGED) {
        return res.status(400).json({
          success: false,
          message: 'Patient already discharged'
        });
      }

      // Check if discharge summary exists
      if (!admission.dischargeSummary) {
        return res.status(400).json({
          success: false,
          message: 'Discharge summary required before discharge'
        });
      }

      // Update admission
      admission.status = AdmissionStatus.DISCHARGED;
      admission.dischargeDateTime = new Date();
      await admissionRepository.save(admission);

      // Free bed and clear current admission
      const bed = admission.bed;
      bed.status = BedStatus.CLEANING;
      bed.currentAdmission = null as any;
      await bedRepository.save(bed);

      // Auto-create housekeeping task for the vacated bed
      try {
        const hkRepo = AppDataSource.getRepository(HousekeepingTask);
        const todayCompact = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const hkCount = await hkRepo.count({ where: { organizationId: tenantId } });
        await hkRepo.save(hkRepo.create({
          organizationId: tenantId,
          taskNumber: `HK-${todayCompact}-${String(hkCount + 1).padStart(4, '0')}`,
          bedId: admission.bedId,
          locationName: `Bed ${bed.bedNumber || ''} (Post-Discharge)`,
          taskType: HousekeepingTaskType.SANITIZATION,
          priority: HousekeepingPriority.URGENT,
          status: HousekeepingStatus.PENDING,
        }));
      } catch (hkErr) {
        console.error('Auto-housekeeping trigger failed (non-blocking):', hkErr);
      }

      // Auto-generate discharge bill (non-blocking)
      let generatedBill: any = null;
      try {
        const roomRepo = AppDataSource.getRepository(Room);
        const labOrderRepo = AppDataSource.getRepository(LabOrder);
        const prescriptionRepo = AppDataSource.getRepository(Prescription);

        const itemDetails: Array<{ name: string; quantity: number; unitPrice: number; total: number }> = [];

        // 1. Room charges — days × dailyRate
        const room = await roomRepo.findOne({ where: { id: bed.roomId } });
        const admitTime = new Date(admission.admissionDateTime).getTime();
        const dischargeTime = admission.dischargeDateTime!.getTime();
        const stayDays = Math.max(1, Math.ceil((dischargeTime - admitTime) / (1000 * 60 * 60 * 24)));
        const dailyRate = room ? Number(room.dailyRate) || 0 : 0;
        if (dailyRate > 0) {
          itemDetails.push({
            name: `Room Charges (${room!.roomType} - ${stayDays} day${stayDays > 1 ? 's' : ''})`,
            quantity: stayDays,
            unitPrice: dailyRate,
            total: stayDays * dailyRate,
          });
        }

        // 2. Lab test charges
        const labOrders = await labOrderRepo.find({
          where: { patientId: admission.patientId, admissionId: admission.id, organizationId: tenantId },
        });
        if (labOrders.length > 0) {
          const labItemRepo = AppDataSource.getRepository(LabOrderItem);
          for (const order of labOrders) {
            const labItems = await labItemRepo.find({
              where: { labOrderId: order.id },
              relations: ['labTest'],
            });
            for (const li of labItems) {
              if (li.labTest && li.status !== 'cancelled') {
                const cost = Number(li.labTest.cost) || 0;
                if (cost > 0) {
                  itemDetails.push({
                    name: `Lab: ${li.labTest.name} (${li.labTest.code})`,
                    quantity: 1,
                    unitPrice: cost,
                    total: cost,
                  });
                }
              }
            }
          }
        }

        // 3. Prescription/medicine charges
        const prescriptions = await prescriptionRepo.find({
          where: { patientId: admission.patientId, admissionId: admission.id, organizationId: tenantId },
        });
        if (prescriptions.length > 0) {
          const prescItemRepo = AppDataSource.getRepository(PrescriptionItem);
          for (const presc of prescriptions) {
            const prescItems = await prescItemRepo.find({
              where: { prescriptionId: presc.id },
              relations: ['medicine'],
            });
            for (const pi of prescItems) {
              if (pi.medicine && pi.status === 'dispensed') {
                const price = Number(pi.medicine.sellingPrice) || 0;
                if (price > 0) {
                  itemDetails.push({
                    name: `Medicine: ${pi.medicine.name} (×${pi.quantity})`,
                    quantity: pi.quantity,
                    unitPrice: price,
                    total: pi.quantity * price,
                  });
                }
              }
            }
          }
        }

        // Calculate totals
        const subtotal = itemDetails.reduce((sum, item) => sum + item.total, 0);

        if (subtotal > 0) {
          // Generate bill number atomically inside a transaction
          generatedBill = await AppDataSource.transaction(async (manager) => {
            const bRepo = manager.getRepository(Bill);
            const year = new Date().getFullYear();
            const prefix = `BIL-${year}-`;
            const latest = await bRepo
              .createQueryBuilder('b')
              .where('b.organizationId = :orgId', { orgId: tenantId })
              .andWhere('b.billNumber LIKE :prefix', { prefix: `${prefix}%` })
              .orderBy('b.billNumber', 'DESC')
              .setLock('pessimistic_write')
              .getOne();
            const lastSeq = latest ? parseInt(latest.billNumber.replace(prefix, ''), 10) || 0 : 0;
            const billNumber = `${prefix}${String(lastSeq + 1).padStart(5, '0')}`;

            const bill = bRepo.create({
              patient: admission.patient,
              organizationId: tenantId,
              admissionId: admission.id,
              billNumber,
              amount: subtotal,
              subtotal,
              grandTotal: subtotal,
              balanceDue: subtotal,
              billDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 86400000),
              status: BillStatus.PENDING,
              billType: 'ipd',
              description: `Discharge bill for admission ${admission.admissionNumber}`,
              itemDetails,
            });
            return bRepo.save(bill);
          });
        }
      } catch (billErr) {
        console.error('Auto-billing on discharge failed (non-blocking):', billErr);
      }

      return res.json({
        success: true,
        message: 'Patient discharged successfully',
        admission,
        ...(generatedBill && { bill: { id: generatedBill.id, billNumber: generatedBill.billNumber, amount: generatedBill.amount } }),
      });
    } catch (error) {
      console.error('Error discharging patient:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to discharge patient'
      });
    }
  };
}
