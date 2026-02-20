
import { AppDataSource } from './src/config/database';
import { Admission } from './src/models/inpatient/Admission';
import { LabOrder } from './src/models/LabOrder';
import { Prescription } from './src/models/pharmacy/Prescription';
import { User } from './src/models/User';

async function checkData() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const patient = await AppDataSource.getRepository(User).findOne({ where: { email: 'patient@example.com' }, relations: ['organization'] });
        console.log('Patient:', patient ? `${patient.firstName} ${patient.lastName} (${patient.id})` : 'Not found');
        console.log('Patient Org:', patient?.organization?.id);
        const orgId = patient?.organization?.id;

        if (patient) {
            // Check Admissions
            const admissions = await AppDataSource.getRepository(Admission).find({
                where: { patient: { id: patient.id } },
                relations: ['organization']
            });
            console.log(`Admissions found: ${admissions.length}`);
            admissions.forEach((a: any) => console.log(` - Adm ID: ${a.id}, OrgID (relation): ${a.organization?.id}, OrgID (col): ${a.organizationId}`));

            // Check Lab Orders
            const labs = await AppDataSource.getRepository(LabOrder).find({
                where: { patient: { id: patient.id } },
                relations: ['organization']
            });
            console.log(`Lab Orders found: ${labs.length}`);
            labs.forEach((l: any) => console.log(` - Lab ID: ${l.id}, OrgID (relation): ${l.organization?.id}, OrgID (col): ${l.organizationId}`));

            // Check Prescriptions
            const rx = await AppDataSource.getRepository(Prescription).find({
                where: { patient: { id: patient.id } },
                relations: ['organization']
            });
            console.log(`Prescriptions found: ${rx.length}`);
            rx.forEach((p: any) => console.log(` - Rx ID: ${p.id}, OrgID (relation): ${p.organization?.id}, OrgID (col): ${p.organizationId}`));
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
