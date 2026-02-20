/**
 * Patient History Types
 * 
 * These interfaces define the structure for tracking patient history
 * including admissions, visits, vitals, labs, prescriptions, etc.
 * 
 * This is a NEW file - does not modify any existing code.
 */

// ============================================
// 1. Admission History (Inpatient)
// ============================================
export interface AdmissionHistory {
    id: string;
    patientId: string;
    admissionDate: string;
    dischargeDate?: string;
    wardId?: string;
    wardName?: string;
    roomNumber?: string;
    bedNumber?: string;
    admissionReason: string;
    admissionType: 'emergency' | 'elective' | 'transfer';
    primaryDiagnosis?: string;
    secondaryDiagnoses?: string[];
    attendingDoctorId: string;
    attendingDoctorName?: string;
    consultingDoctorIds?: string[];
    totalDays?: number;
    dischargeSummary?: string;
    dischargeStatus?: 'recovered' | 'improved' | 'unchanged' | 'transferred' | 'deceased' | 'left_ama';
    followUpDate?: string;
    status: 'admitted' | 'discharged' | 'transferred';
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// 2. Visit History (OPD - Outpatient)
// ============================================
export interface VisitHistory {
    id: string;
    patientId: string;
    visitDate: string;
    visitTime?: string;
    appointmentId?: string;
    departmentId?: string;
    departmentName?: string;
    doctorId: string;
    doctorName?: string;
    visitType: 'new' | 'follow_up' | 'routine_checkup' | 'emergency';
    chiefComplaint: string;
    symptoms?: string[];
    diagnosis?: string;
    treatmentGiven?: string;
    prescriptionId?: string;
    labOrderIds?: string[];
    vitalSignsId?: string;
    followUpDate?: string;
    notes?: string;
    outcome?: 'resolved' | 'ongoing' | 'referred' | 'admitted';
    createdAt: string;
}

// ============================================
// 3. Vital Signs Record
// ============================================
export interface VitalSignsRecord {
    id: string;
    patientId: string;
    recordedAt: string;
    recordedById?: string;
    recordedByName?: string;
    visitId?: string;
    admissionId?: string;

    // Core Vitals
    temperature?: number;
    temperatureUnit?: 'fahrenheit' | 'celsius';
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
    heartRate?: number;
    respiratoryRate?: number;
    oxygenSaturation?: number;

    // Body Measurements
    weight?: number;
    height?: number;
    bmi?: number;

    // Additional
    bloodGlucose?: number;
    painLevel?: number;

    notes?: string;
}

// ============================================
// 4. Lab Test History
// ============================================
export interface LabTestResult {
    parameter: string;
    value: string;
    unit: string;
    referenceRange?: string;
    status: 'normal' | 'abnormal_low' | 'abnormal_high' | 'critical';
}

export interface LabTestHistory {
    id: string;
    patientId: string;
    orderId?: string;
    orderDate: string;
    testDate?: string;
    resultDate?: string;
    orderedById?: string;
    orderedByName?: string;
    testName: string;
    testCategory: 'blood' | 'urine' | 'imaging' | 'pathology' | 'microbiology' | 'other';
    sampleType?: string;
    results?: LabTestResult[];
    overallStatus: 'pending' | 'sample_collected' | 'processing' | 'completed' | 'cancelled';
    interpretation?: string;
    reportUrl?: string;
    notes?: string;
}

// ============================================
// 5. Prescription History
// ============================================
export interface PrescriptionItem {
    medicationName: string;
    genericName?: string;
    dosage: string;
    frequency: string;
    duration: string;
    route: 'oral' | 'topical' | 'injection' | 'inhalation' | 'iv' | 'other';
    instructions?: string;
    quantity?: number;
}

export interface PrescriptionHistory {
    id: string;
    patientId: string;
    visitId?: string;
    admissionId?: string;
    prescribedDate: string;
    prescribedById: string;
    prescribedByName?: string;
    diagnosis?: string;
    items: PrescriptionItem[];
    status: 'active' | 'completed' | 'discontinued' | 'expired';
    dispensedDate?: string;
    dispensedById?: string;
    refillsRemaining?: number;
    notes?: string;
}

// ============================================
// 6. Procedure/Surgery History
// ============================================
export interface ProcedureHistory {
    id: string;
    patientId: string;
    admissionId?: string;
    procedureDate: string;
    procedureName: string;
    procedureCode?: string;
    procedureType: 'diagnostic' | 'therapeutic' | 'surgical' | 'cosmetic';
    surgeonId?: string;
    surgeonName?: string;
    assistantIds?: string[];
    anesthesiaType?: 'none' | 'local' | 'regional' | 'general' | 'sedation';
    anesthesiologistId?: string;
    duration?: number;
    location?: string;
    preOpDiagnosis?: string;
    postOpDiagnosis?: string;
    findings?: string;
    complications?: string;
    outcome: 'successful' | 'partial' | 'unsuccessful' | 'complications';
    operativeNotes?: string;
    postOpInstructions?: string;
    followUpDate?: string;
}

// ============================================
// 7. Billing History
// ============================================
export interface BillingItem {
    description: string;
    category: 'consultation' | 'procedure' | 'lab' | 'medication' | 'room' | 'other';
    quantity: number;
    unitPrice: number;
    discount?: number;
    total: number;
}

export interface PaymentRecord {
    paymentDate: string;
    amount: number;
    method: 'cash' | 'card' | 'insurance' | 'bank_transfer' | 'upi' | 'other';
    reference?: string;
}

export interface BillingHistory {
    id: string;
    patientId: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate?: string;
    visitId?: string;
    admissionId?: string;
    items: BillingItem[];
    subtotal: number;
    taxAmount?: number;
    discountAmount?: number;
    totalAmount: number;
    insuranceCovered?: number;
    patientResponsibility: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid' | 'overdue' | 'waived';
    payments: PaymentRecord[];
    insuranceClaimId?: string;
    notes?: string;
}

// ============================================
// 8. Patient Documents
// ============================================
export interface PatientDocument {
    id: string;
    patientId: string;
    documentType: 'lab_report' | 'xray' | 'mri' | 'ct_scan' | 'discharge_summary' |
    'insurance_card' | 'id_proof' | 'consent_form' | 'referral' |
    'external_report' | 'prescription' | 'other';
    documentName: string;
    fileName: string;
    fileUrl: string;
    fileSize?: number;
    mimeType?: string;
    uploadedAt: string;
    uploadedById?: string;
    sourceType?: 'internal' | 'external';
    relatedVisitId?: string;
    relatedAdmissionId?: string;
    description?: string;
    tags?: string[];
    isConfidential?: boolean;
}

// ============================================
// 9. Clinical Notes
// ============================================
export interface ClinicalNote {
    id: string;
    patientId: string;
    visitId?: string;
    admissionId?: string;
    noteDate: string;
    noteTime?: string;
    authorId: string;
    authorName?: string;
    authorRole: 'doctor' | 'nurse' | 'specialist' | 'therapist';
    noteType: 'progress' | 'soap' | 'admission' | 'discharge' |
    'consultation' | 'procedure' | 'nursing' | 'telephone';

    // SOAP Format
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;

    // Free-form
    content?: string;

    attachments?: string[];
    isAddendum?: boolean;
    parentNoteId?: string;
    isConfidential?: boolean;
    createdAt: string;
    updatedAt?: string;
}

// ============================================
// Combined Patient History Response
// ============================================
export interface PatientHistorySummary {
    patientId: string;
    totalAdmissions: number;
    totalVisits: number;
    totalPrescriptions: number;
    totalLabTests: number;
    totalProcedures: number;
    totalDocuments: number;
    totalNotes: number;
    lastAdmissionDate?: string;
    lastVisitDate?: string;
    recentVitals?: VitalSignsRecord;
}

// Timeline Entry for unified history view
export interface PatientTimelineEntry {
    id: string;
    date: string;
    type: 'admission' | 'discharge' | 'visit' | 'vitals' | 'lab' | 'prescription' | 'procedure' | 'note' | 'document';
    title: string;
    description?: string;
    doctorName?: string;
    department?: string;
    status?: string;
    relatedId: string; // ID of the related entity
}
