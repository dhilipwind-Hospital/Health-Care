/**
 * Medical History PDF Export Utility
 * Generates comprehensive PDF reports of patient medical history
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import {
    AdmissionHistory,
    VisitHistory,
    VitalSignsRecord,
    LabTestHistory,
    PrescriptionHistory,
    ProcedureHistory,
    PatientDocument,
    ClinicalNote
} from '../types/patientHistory';

interface ExportData {
    patientName?: string;
    patientId?: string;
    admissions?: AdmissionHistory[];
    visits?: VisitHistory[];
    vitals?: VitalSignsRecord[];
    labs?: LabTestHistory[];
    prescriptions?: PrescriptionHistory[];
    procedures?: ProcedureHistory[];
    documents?: PatientDocument[];
    notes?: ClinicalNote[];
}

interface ExportOptions {
    includeAdmissions?: boolean;
    includeVisits?: boolean;
    includeVitals?: boolean;
    includeLabs?: boolean;
    includePrescriptions?: boolean;
    includeProcedures?: boolean;
    includeNotes?: boolean;
}

export const exportMedicalHistoryToPDF = async (
    data: ExportData,
    options: ExportOptions = {
        includeAdmissions: true,
        includeVisits: true,
        includeVitals: true,
        includeLabs: true,
        includePrescriptions: true,
        includeProcedures: true,
        includeNotes: true
    }
): Promise<void> => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = '#e91e63';
    const headerBg = '#f5f5f5';

    let yPos = 20;

    // Header
    doc.setFillColor(233, 30, 99); // Primary pink
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Medical History Report', 105, 18, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Patient: ${data.patientName || 'N/A'}`, 105, 28, { align: 'center' });
    doc.text(`Generated: ${dayjs().format('MMMM D, YYYY h:mm A')}`, 105, 35, { align: 'center' });

    yPos = 50;

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Summary Section
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Summary', 14, yPos);
    yPos += 8;

    const summaryItems = [
        { label: 'Admissions', count: data.admissions?.length || 0 },
        { label: 'Visits', count: data.visits?.length || 0 },
        { label: 'Vitals Records', count: data.vitals?.length || 0 },
        { label: 'Lab Tests', count: data.labs?.length || 0 },
        { label: 'Prescriptions', count: data.prescriptions?.length || 0 },
        { label: 'Procedures', count: data.procedures?.length || 0 }
    ];

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    summaryItems.forEach((item, index) => {
        const x = 14 + (index % 3) * 65;
        const y = yPos + Math.floor(index / 3) * 8;
        doc.text(`${item.label}: ${item.count}`, x, y);
    });

    yPos += 20;

    // Admissions
    if (options.includeAdmissions && data.admissions && data.admissions.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 30, 99);
        doc.text('🏥 Admissions', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Reason', 'Ward', 'Doctor', 'Status']],
            body: data.admissions.map(a => [
                dayjs(a.admissionDate).format('MMM D, YYYY'),
                a.admissionReason || '-',
                a.wardName || '-',
                a.attendingDoctorName || '-',
                a.status || '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] },
            margin: { left: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Lab Tests
    if (options.includeLabs && data.labs && data.labs.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 30, 99);
        doc.text('🧪 Lab Tests', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Test', 'Result', 'Reference', 'Status']],
            body: data.labs.map(l => [
                dayjs(l.orderDate).format('MMM D, YYYY'),
                l.testName || '-',
                `${(l as any).resultValue || 'Pending'} ${(l as any).resultUnits || ''}`,
                (l as any).referenceRange || '-',
                ((l as any).resultFlag || l.overallStatus || '-').toUpperCase()
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] },
            margin: { left: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Prescriptions
    if (options.includePrescriptions && data.prescriptions && data.prescriptions.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 30, 99);
        doc.text('💊 Prescriptions', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Doctor', 'Medications', 'Status']],
            body: data.prescriptions.map(p => [
                dayjs(p.prescribedDate).format('MMM D, YYYY'),
                p.prescribedByName || '-',
                (p as any).medicationsSummary || `${p.items?.length || 0} items`,
                (p.status || '-').toUpperCase()
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] },
            margin: { left: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Vitals (Recent 10)
    if (options.includeVitals && data.vitals && data.vitals.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 30, 99);
        doc.text('❤️ Recent Vitals', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        const recentVitals = data.vitals.slice(0, 10);

        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'BP', 'HR', 'Temp', 'SpO2', 'Weight']],
            body: recentVitals.map(v => [
                dayjs(v.recordedAt).format('MMM D, YYYY'),
                v.bloodPressureSystolic && v.bloodPressureDiastolic
                    ? `${v.bloodPressureSystolic}/${v.bloodPressureDiastolic}`
                    : '-',
                v.heartRate ? `${v.heartRate} bpm` : '-',
                v.temperature ? `${v.temperature}°F` : '-',
                v.oxygenSaturation ? `${v.oxygenSaturation}%` : '-',
                v.weight ? `${v.weight} kg` : '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] },
            margin: { left: 14 }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;
    }

    // Procedures
    if (options.includeProcedures && data.procedures && data.procedures.length > 0) {
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 30, 99);
        doc.text('✂️ Procedures', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 5;

        autoTable(doc, {
            startY: yPos,
            head: [['Date', 'Procedure', 'Surgeon', 'Diagnosis']],
            body: data.procedures.map(p => [
                dayjs(p.procedureDate).format('MMM D, YYYY'),
                p.procedureName || '-',
                p.surgeonName || '-',
                p.preOpDiagnosis || '-'
            ]),
            theme: 'striped',
            headStyles: { fillColor: [233, 30, 99] },
            margin: { left: 14 }
        });
    }

    // Footer on each page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(128, 128, 128);
        doc.text(
            `Page ${i} of ${pageCount} | Generated by Hospital Management System`,
            105,
            290,
            { align: 'center' }
        );
    }

    // Save
    const filename = `medical_history_${data.patientName?.replace(/\s+/g, '_') || 'patient'}_${dayjs().format('YYYYMMDD')}.pdf`;
    doc.save(filename);
};

export default exportMedicalHistoryToPDF;
