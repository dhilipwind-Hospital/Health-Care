
import { Request, Response } from 'express';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { Appointment, AppointmentStatus } from '../models/Appointment';
import { MedicalRecord, RecordType } from '../models/MedicalRecord';
import { LabOrder } from '../models/LabOrder';
import { Prescription } from '../models/pharmacy/Prescription';
import { Admission } from '../models/inpatient/Admission';
import { VitalSigns } from '../models/VitalSigns';
import { VitalSign as InpatientVitalSign } from '../models/inpatient/VitalSign';

export class PatientHistoryController {
    static getHistorySummary = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            console.log('--- getHistorySummary DEBUG ---');
            console.log(`Req Patient ID: ${id}`);
            console.log(`Auth User ID: ${user.id}`);
            console.log(`Auth User Role: ${user.role}`);
            console.log(`Resolved Org ID: ${orgId}`);

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            // Using AppDataSource directly to verify counts
            const [
                totalAdmissions,
                totalVisits,
                totalPrescriptions,
                totalLabTests,
                totalProcedures,
                totalDocuments,
                totalNotes,
                lastVitals,
                lastInpatientVital
            ] = await Promise.all([
                AppDataSource.getRepository(Admission).count({ where: { patient: { id }, organization: { id: orgId } } }),
                AppDataSource.getRepository(Appointment).count({ where: { patient: { id }, status: AppointmentStatus.COMPLETED, organization: { id: orgId } } }),
                AppDataSource.getRepository(Prescription).count({ where: { patient: { id }, organization: { id: orgId } } }),
                AppDataSource.getRepository(LabOrder).count({ where: { patient: { id }, organization: { id: orgId } } }),
                AppDataSource.getRepository(MedicalRecord).count({ where: { patient: { id }, type: RecordType.PROCEDURE, organization: { id: orgId } } }),
                AppDataSource.getRepository(MedicalRecord).count({ where: { patient: { id }, type: RecordType.DOCUMENT, organization: { id: orgId } } }),
                AppDataSource.getRepository(MedicalRecord).count({ where: { patient: { id }, type: RecordType.CONSULTATION, organization: { id: orgId } } }),
                AppDataSource.getRepository(VitalSigns).findOne({
                    where: { patient: { id }, organization: { id: orgId } },
                    order: { recordedAt: 'DESC' }
                }),
                AppDataSource.getRepository(InpatientVitalSign).findOne({
                    where: { admission: { patient: { id } }, organization: { id: orgId } },
                    order: { recordedAt: 'DESC' }
                })
            ]);

            console.log('Counts:', {
                totalAdmissions,
                totalVisits,
                totalPrescriptions,
                totalLabTests,
                totalProcedures,
                totalDocuments,
                totalNotes
            });

            const lastAdmission = await AppDataSource.getRepository(Admission).findOne({
                where: { patient: { id }, organization: { id: orgId } },
                order: { admissionDateTime: 'DESC' }
            });

            const lastVisit = await AppDataSource.getRepository(Appointment).findOne({
                where: { patient: { id }, status: AppointmentStatus.COMPLETED, organization: { id: orgId } },
                order: { startTime: 'DESC' }
            });

            let displayVitals = lastVitals;
            if (!lastVitals && lastInpatientVital) {
                displayVitals = lastInpatientVital as any;
            } else if (lastVitals && lastInpatientVital) {
                if (new Date(lastInpatientVital.recordedAt).getTime() > new Date(lastVitals.recordedAt).getTime()) {
                    displayVitals = lastInpatientVital as any;
                }
            }

            return res.json({
                patientId: id,
                totalAdmissions,
                totalVisits,
                totalPrescriptions,
                totalLabTests,
                totalProcedures,
                totalDocuments,
                totalNotes,
                lastAdmissionDate: lastAdmission?.admissionDateTime,
                lastVisitDate: lastVisit?.startTime,
                recentVitals: displayVitals
            });
        } catch (error) {
            console.error('Error fetching patient history summary:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getHistoryTimeline = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { limit = 20 } = req.query;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            console.log('--- getHistoryTimeline DEBUG ---');
            console.log(`Req Patient ID: ${id}`);
            console.log(`Org ID: ${orgId}`);

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            const targetLimit = Math.max(5, Math.ceil(Number(limit) / 5));

            const [admissions, appointments, prescriptions, labOrders, medicalRecords, vitalSigns, inpatientVitals] = await Promise.all([
                AppDataSource.getRepository(Admission).find({ where: { patient: { id }, organization: { id: orgId } }, order: { admissionDateTime: 'DESC' }, take: targetLimit, relations: ['admittingDoctor'] }),
                AppDataSource.getRepository(Appointment).find({ where: { patient: { id }, status: AppointmentStatus.COMPLETED, organization: { id: orgId } }, order: { startTime: 'DESC' }, take: targetLimit, relations: ['doctor', 'service', 'service.department'] }),
                AppDataSource.getRepository(Prescription).find({ where: { patient: { id }, organization: { id: orgId } }, order: { createdAt: 'DESC' }, take: targetLimit, relations: ['doctor'] }),
                AppDataSource.getRepository(LabOrder).find({ where: { patient: { id }, organization: { id: orgId } }, order: { createdAt: 'DESC' }, take: targetLimit, relations: ['doctor'] }),
                AppDataSource.getRepository(MedicalRecord).find({ where: { patient: { id }, organization: { id: orgId } }, order: { recordDate: 'DESC' }, take: targetLimit, relations: ['doctor'] }),
                AppDataSource.getRepository(VitalSigns).find({ where: { patient: { id }, organization: { id: orgId } }, order: { recordedAt: 'DESC' }, take: targetLimit, relations: ['recordedBy'] }),
                AppDataSource.getRepository(InpatientVitalSign).find({ where: { admission: { patient: { id } }, organization: { id: orgId } }, order: { recordedAt: 'DESC' }, take: targetLimit, relations: ['recordedBy'] })
            ]);

            console.log('Timeline Items Found:', {
                admissions: admissions.length,
                appointments: appointments.length,
                prescriptions: prescriptions.length,
                labOrders: labOrders.length,
                medicalRecords: medicalRecords.length
            });

            const timeline: any[] = [];

            // ... (Mapping Logic Same as Before) ...
            admissions.forEach(adm => {
                timeline.push({
                    id: `adm-${adm.id}`,
                    date: adm.admissionDateTime,
                    type: 'admission',
                    title: `Admitted: ${adm.admissionReason}`,
                    description: `Status: ${adm.status}`,
                    doctorName: adm.admittingDoctor ? `Dr. ${adm.admittingDoctor.firstName} ${adm.admittingDoctor.lastName}` : 'N/A',
                    relatedId: adm.id
                });
                if (adm.dischargeDateTime) {
                    timeline.push({
                        id: `dis-${adm.id}`,
                        date: adm.dischargeDateTime,
                        type: 'discharge',
                        title: 'Discharged from Hospital',
                        doctorName: adm.admittingDoctor ? `Dr. ${adm.admittingDoctor.firstName} ${adm.admittingDoctor.lastName}` : 'N/A',
                        relatedId: adm.id
                    });
                }
            });

            appointments.forEach(apt => {
                const duration = Math.round((new Date(apt.endTime).getTime() - new Date(apt.startTime).getTime()) / (60 * 1000));
                timeline.push({
                    id: `apt-${apt.id}`,
                    date: apt.startTime,
                    type: 'visit',
                    title: `OPD Visit: ${apt.reason || 'General'}`,
                    description: `Duration: ${duration} min`,
                    doctorName: apt.doctor ? `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}` : 'N/A',
                    department: apt.service?.department?.name,
                    relatedId: apt.id
                });
            });

            prescriptions.forEach(p => {
                timeline.push({
                    id: `rx-${p.id}`,
                    date: p.createdAt,
                    type: 'prescription',
                    title: 'New Prescription Issued',
                    description: `${(p as any).items?.length || 0} medications`,
                    doctorName: p.doctor ? `Dr. ${p.doctor.firstName} ${p.doctor.lastName}` : 'N/A',
                    status: p.status,
                    relatedId: p.id
                });
            });

            labOrders.forEach(l => {
                timeline.push({
                    id: `lab-${l.id}`,
                    date: l.createdAt,
                    type: 'lab',
                    title: `Lab Order: ${l.orderNumber}`,
                    description: `Status: ${l.status}`,
                    doctorName: l.doctor ? `Dr. ${l.doctor.firstName} ${l.doctor.lastName}` : 'N/A',
                    relatedId: l.id
                });
            });

            medicalRecords.forEach(r => {
                let type = 'document';
                if (r.type === RecordType.CONSULTATION) type = 'note';
                else if (r.type === RecordType.PROCEDURE) type = 'procedure';

                timeline.push({
                    id: `rec-${r.id}`,
                    date: r.recordDate,
                    type: type,
                    title: r.title,
                    description: r.diagnosis || r.description,
                    doctorName: r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'N/A',
                    relatedId: r.id
                });
            });

            vitalSigns.forEach(v => {
                timeline.push({
                    id: `vs-${v.id}`,
                    date: v.recordedAt,
                    type: 'vitals',
                    title: 'Vital Signs Recorded (OPD)',
                    description: `${v.systolicBp}/${v.diastolicBp} mmHg, ${v.heartRate} bpm, ${v.temperature}°${v.temperatureUnit}`,
                    doctorName: v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : 'N/A',
                    relatedId: v.id
                });
            });

            inpatientVitals.forEach(v => {
                timeline.push({
                    id: `ivs-${v.id}`,
                    date: v.recordedAt,
                    type: 'vitals',
                    title: 'Vital Signs Recorded (Inpatient)',
                    description: `${v.systolicBP}/${v.diastolicBP} mmHg, ${v.heartRate} bpm, ${v.temperature}°C`,
                    doctorName: v.recordedBy ? `${v.recordedBy.firstName} ${v.recordedBy.lastName}` : 'N/A',
                    relatedId: v.id
                });
            });

            timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return res.json({
                data: timeline.slice(0, Number(limit)),
                total: timeline.length
            });
        } catch (error) {
            console.error('Error fetching patient timeline:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getVitals = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { limit = 50 } = req.query;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            const [vitals, inpatientVitals] = await Promise.all([
                AppDataSource.getRepository(VitalSigns).find({
                    where: { patient: { id }, organization: { id: orgId } },
                    order: { recordedAt: 'DESC' },
                    take: Number(limit),
                    relations: ['recordedBy']
                }),
                AppDataSource.getRepository(InpatientVitalSign).find({
                    where: { admission: { patient: { id }, organization: { id: orgId } }, organization: { id: orgId } }, // Ensure Org filter on link too
                    order: { recordedAt: 'DESC' },
                    take: Number(limit),
                    relations: ['recordedBy']
                })
            ]);

            const allVitals = [...vitals, ...inpatientVitals].sort((a, b) =>
                new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
            );

            return res.json({ data: allVitals.slice(0, Number(limit)) });
        } catch (error) {
            console.error('Error fetching patient vitals:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getProcedures = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            const records = await AppDataSource.getRepository(MedicalRecord).find({
                where: {
                    patient: { id },
                    organization: { id: orgId },
                    type: RecordType.PROCEDURE
                },
                order: { recordDate: 'DESC' },
                relations: ['doctor']
            });

            const procedures = records.map(r => ({
                id: r.id,
                patientId: id,
                procedureDate: r.recordDate,
                procedureName: r.title,
                procedureType: r.type === RecordType.IMAGING ? 'diagnostic' : 'therapeutic',
                surgeonName: r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'N/A',
                findings: r.diagnosis,
                outcome: 'successful'
            }));

            return res.json({ data: procedures });
        } catch (error) {
            console.error('Error fetching patient procedures:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getDocuments = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            const records = await AppDataSource.getRepository(MedicalRecord).find({
                where: [
                    { patient: { id }, organization: { id: orgId }, type: RecordType.DOCUMENT },
                    { patient: { id }, organization: { id: orgId }, type: RecordType.DISCHARGE_SUMMARY },
                    { patient: { id }, organization: { id: orgId }, type: RecordType.IMAGING },
                    { patient: { id }, organization: { id: orgId }, type: RecordType.LAB_REPORT }
                ],
                order: { recordDate: 'DESC' }
            });

            const docs = records.filter(r => !!r.fileUrl).map(r => ({
                id: r.id,
                patientId: id,
                documentType: r.type,
                documentName: r.title,
                fileUrl: r.fileUrl,
                uploadedAt: r.createdAt
            }));

            return res.json({ data: docs });
        } catch (error) {
            console.error('Error fetching patient documents:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };

    static getClinicalNotes = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const user = (req as any).user;
            const orgId = (req as any).tenant?.id || user?.organizationId;

            if (!orgId) return res.status(400).json({ message: 'Organization context required' });
            if (user.role === 'patient' && user.id !== id) return res.status(403).json({ message: 'Access denied' });

            const records = await AppDataSource.getRepository(MedicalRecord).find({
                where: {
                    patient: { id },
                    type: RecordType.CONSULTATION,
                    organization: { id: orgId }
                },
                order: { recordDate: 'DESC' },
                relations: ['doctor']
            });

            const notes = records.map(r => ({
                id: r.id,
                patientId: id,
                noteDate: r.recordDate,
                authorName: r.doctor ? `Dr. ${r.doctor.firstName} ${r.doctor.lastName}` : 'N/A',
                authorRole: 'doctor',
                noteType: 'progress',
                content: r.description,
                assessment: r.diagnosis,
                plan: r.treatment
            }));

            return res.json({ data: notes });
        } catch (error) {
            console.error('Error fetching clinical notes:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }
    };
}
