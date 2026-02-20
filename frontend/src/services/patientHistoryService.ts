/**
 * Patient History Service
 * 
 * API service for fetching patient history data.
 * This is a NEW file - does not modify any existing code.
 */

import api from './api';
import {
    AdmissionHistory,
    VisitHistory,
    VitalSignsRecord,
    LabTestHistory,
    PrescriptionHistory,
    ProcedureHistory,
    BillingHistory,
    PatientDocument,
    ClinicalNote,
    PatientHistorySummary,
    PatientTimelineEntry
} from '../types/patientHistory';

const patientHistoryService = {
    // Get patient history summary (counts)
    getSummary: async (patientId: string): Promise<PatientHistorySummary> => {
        try {
            const response = await api.get(`/patients/${patientId}/history/summary`);
            return response.data;
        } catch (error) {
            console.error('Error fetching patient history summary:', error);
            // Return empty summary on error with valid patientId
            return {
                patientId,
                totalAdmissions: 0,
                totalVisits: 0,
                totalPrescriptions: 0,
                totalLabTests: 0,
                totalProcedures: 0,
                totalDocuments: 0,
                totalNotes: 0
            };
        }
    },

    // Get unified timeline
    getTimeline: async (patientId: string, limit = 20): Promise<PatientTimelineEntry[]> => {
        try {
            const response = await api.get(`/patients/${patientId}/history/timeline`, {
                params: { limit }
            });
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching patient timeline:', error);
            return [];
        }
    },

    // Get admission history
    getAdmissions: async (patientId: string): Promise<AdmissionHistory[]> => {
        try {
            const response = await api.get(`/inpatient/admissions`, {
                params: { patientId }
            });
            // Handle multiple response formats: { data: [...] }, { admissions: [...] }, or [...]
            const admissions = response.data?.data || response.data?.admissions || response.data || [];

            // Map to AdmissionHistory format
            return (Array.isArray(admissions) ? admissions : []).map((adm: any) => ({
                id: adm.id,
                patientId: adm.patientId,
                admissionDate: adm.admissionDateTime,
                dischargeDate: adm.dischargeDateTime,
                wardId: adm.bed?.room?.ward?.id,
                wardName: adm.bed?.room?.ward?.name,
                roomNumber: adm.bed?.room?.roomNumber,
                bedNumber: adm.bed?.bedNumber,
                admissionReason: adm.admissionReason,
                admissionType: adm.isEmergency ? 'emergency' : 'elective',
                attendingDoctorId: adm.admittingDoctorId,
                attendingDoctorName: adm.admittingDoctor ?
                    (adm.admittingDoctor.firstName.startsWith('Dr.') || adm.admittingDoctor.firstName.startsWith('Dr ')
                        ? `${adm.admittingDoctor.firstName} ${adm.admittingDoctor.lastName}`
                        : `Dr. ${adm.admittingDoctor.firstName} ${adm.admittingDoctor.lastName}`)
                    : undefined,
                status: adm.status,
                createdAt: adm.createdAt
            }));
        } catch (error) {
            console.error('Error fetching admission history:', error);
            return [];
        }
    },

    // Get visit history (from appointments that are completed)
    getVisits: async (patientId: string): Promise<VisitHistory[]> => {
        try {
            const response = await api.get(`/appointments`, {
                params: { patientId, status: 'completed' }
            });
            const appointments = response.data?.data || response.data || [];
            // Map appointments to visit history format
            return appointments.map((apt: any) => ({
                id: apt.id,
                patientId: apt.patientId,
                visitDate: apt.startTime || apt.appointmentDate,
                visitTime: apt.startTime,
                appointmentId: apt.id,
                departmentId: apt.departmentId,
                departmentName: apt.department?.name || apt.departmentName,
                doctorId: apt.doctorId,
                doctorName: apt.doctor ?
                    (apt.doctor.firstName.startsWith('Dr.') || apt.doctor.firstName.startsWith('Dr ')
                        ? `${apt.doctor.firstName} ${apt.doctor.lastName}`
                        : `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`)
                    : apt.doctorName,
                visitType: apt.type || 'follow_up',
                chiefComplaint: apt.reason || apt.notes || '',
                diagnosis: apt.diagnosis,
                notes: apt.notes,
                outcome: apt.status === 'completed' ? 'resolved' : 'ongoing',
                createdAt: apt.createdAt
            }));
        } catch (error) {
            console.error('Error fetching visit history:', error);
            return [];
        }
    },

    // Get vital signs history
    getVitals: async (patientId: string): Promise<VitalSignsRecord[]> => {
        try {
            const response = await api.get(`/patients/${patientId}/vitals`);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching vital signs:', error);
            return [];
        }
    },

    // Get lab test history - TRANSFORMED to match UI expectations with result details
    getLabTests: async (patientId: string): Promise<LabTestHistory[]> => {
        try {
            const response = await api.get(`/lab/orders`, {
                params: { patientId }
            });
            const orders = response.data?.data || response.data || [];

            // Flatten orders into individual tests for the UI
            const tests: LabTestHistory[] = [];

            if (Array.isArray(orders)) {
                orders.forEach((order: any) => {
                    if (order.items && Array.isArray(order.items)) {
                        order.items.forEach((item: any) => {
                            // Extract result data if available
                            const result = item.result;

                            tests.push({
                                id: item.id,
                                orderId: order.id,
                                orderDate: order.orderDate || order.createdAt,
                                testName: item.labTest?.name || 'Unknown Test',
                                testCategory: item.labTest?.category || 'other',
                                status: item.status,
                                overallStatus: item.status,
                                // Result details
                                resultValue: result?.resultValue || null,
                                resultUnits: result?.units || null,
                                referenceRange: result?.referenceRange || null,
                                resultFlag: result?.flag || null, // 'normal', 'abnormal', 'critical'
                                interpretation: result?.interpretation || null,
                                resultDate: result?.resultTime || null,
                                notes: item.notes || result?.comments
                            } as any);
                        });
                    }
                });
            }

            return tests;
        } catch (error) {
            console.error('Error fetching lab history:', error);
            return [];
        }
    },

    // Get prescription history - with medicine details
    getPrescriptions: async (patientId: string): Promise<PrescriptionHistory[]> => {
        try {
            const response = await api.get(`/pharmacy/prescriptions`, {
                params: { patientId }
            });
            const data = response.data?.data || response.data || [];
            const list = Array.isArray(data) ? data : data.prescriptions || [];

            return list.map((p: any) => {
                // Transform items to include medicine details
                const mappedItems = (p.items || []).map((item: any) => ({
                    id: item.id,
                    medicationName: item.medicine?.name || item.medicine?.brandName || 'Unknown Medicine',
                    genericName: item.medicine?.genericName || null,
                    brandName: item.medicine?.brandName || null,
                    strength: item.medicine?.strength || null,
                    dosageForm: item.medicine?.dosageForm || null,
                    dosage: item.dosage,
                    frequency: item.frequency,
                    duration: item.duration,
                    quantity: item.quantity,
                    instructions: item.instructions,
                    status: item.status
                }));

                // Create medications summary string for table display
                const medicationNames = mappedItems
                    .map((m: any) => `${m.medicationName}${m.strength ? ' ' + m.strength : ''}`)
                    .join(', ');

                return {
                    id: p.id,
                    prescribedDate: p.createdAt || p.prescriptionDate,
                    prescribedByName: p.doctor ?
                        (p.doctor.firstName.startsWith('Dr.') || p.doctor.firstName.startsWith('Dr ')
                            ? `${p.doctor.firstName} ${p.doctor.lastName}`
                            : `Dr. ${p.doctor.firstName} ${p.doctor.lastName}`)
                        : 'Unknown Doctor',
                    items: mappedItems,
                    medicationsSummary: medicationNames || 'No medications',
                    status: p.status,
                    notes: p.notes
                };
            });
        } catch (error) {
            console.error('Error fetching prescription history:', error);
            return [];
        }
    },

    // Get procedure history
    getProcedures: async (patientId: string): Promise<ProcedureHistory[]> => {
        try {
            const response = await api.get(`/patients/${patientId}/procedures`);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching procedure history:', error);
            return [];
        }
    },

    // Get billing history
    getBillingHistory: async (patientId: string): Promise<BillingHistory[]> => {
        try {
            const response = await api.get(`/billing/invoices`, {
                params: { patientId }
            });
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching billing history:', error);
            return [];
        }
    },

    // Get patient documents
    getDocuments: async (patientId: string): Promise<PatientDocument[]> => {
        try {
            const response = await api.get(`/patients/${patientId}/documents`);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching documents:', error);
            return [];
        }
    },

    // Get clinical notes
    getClinicalNotes: async (patientId: string): Promise<ClinicalNote[]> => {
        try {
            const response = await api.get(`/patients/${patientId}/notes`);
            return response.data?.data || response.data || [];
        } catch (error) {
            console.error('Error fetching clinical notes:', error);
            return [];
        }
    }
};

export default patientHistoryService;
