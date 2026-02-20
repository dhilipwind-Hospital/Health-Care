
import { AppDataSource } from './src/config/database';
import { Admission } from './src/models/inpatient/Admission';
import { LabOrder } from './src/models/LabOrder';
import { Prescription } from './src/models/pharmacy/Prescription';
import { MedicalRecord } from './src/models/MedicalRecord';
import { User } from './src/models/User';

async function checkData() {
    try {
        await AppDataSource.initialize();
        console.log('Database connected');

        const patient = await AppDataSource.getRepository(User).findOne({ where: { email: 'patient@example.com' }, relations: ['organization'] });
        const orgId = patient?.organization?.id;
        const patientId = patient?.id;

        console.log(`Checking for Patient: ${patientId}, Org: ${orgId}`);

        if (patientId && orgId) {
            // Test EXACT Controller Queries

            // 1. Admission
            const admCount = await AppDataSource.getRepository(Admission).count({
                where: {
                    patient: { id: patientId },
                    organization: { id: orgId }
                }
            });
            console.log(`Admissions Count (Query Match): ${admCount}`);

            if (admCount === 0) {
                // Debug: Try without Org
                const admCountNoOrg = await AppDataSource.getRepository(Admission).count({ where: { patient: { id: patientId } } });
                console.log(`Admissions Count (No Org Filter): ${admCountNoOrg}`);
            }

            // 2. LabOrder
            const labCount = await AppDataSource.getRepository(LabOrder).count({
                where: {
                    patient: { id: patientId },
                    organization: { id: orgId }
                }
            });
            console.log(`Lab Orders Count (Query Match): ${labCount}`);

            // 3. Prescription
            const rxCount = await AppDataSource.getRepository(Prescription).count({
                where: {
                    patient: { id: patientId },
                    organization: { id: orgId }
                }
            });
            console.log(`Prescriptions Count (Query Match): ${rxCount}`);

            // 4. MedicalRecord
            const recCount = await AppDataSource.getRepository(MedicalRecord).count({
                where: {
                    patient: { id: patientId },
                    organization: { id: orgId }
                }
            });
            console.log(`Medical Records Count (Query Match): ${recCount}`);

            if (recCount === 0) {
                const recCountNoOrg = await AppDataSource.getRepository(MedicalRecord).count({ where: { patient: { id: patientId } } });
                console.log(`Medical Records Count (No Org Filter): ${recCountNoOrg}`);

                // Inspect one record
                const oneRec = await AppDataSource.getRepository(MedicalRecord).findOne({ where: { patient: { id: patientId } }, relations: ['organization'] });
                console.log('One Med Record:', oneRec ? `ID: ${oneRec.id}, Org: ${oneRec.organization?.id}` : 'None');
            }

        } else {
            console.log('Patient or Org ID missing');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkData();
