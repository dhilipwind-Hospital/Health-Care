import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Appointment } from '../models/Appointment';
import { Organization } from '../models/Organization';

async function testFetch() {
    try {
        await AppDataSource.initialize();
        const apptRepo = AppDataSource.getRepository(Appointment);
        const orgRepo = AppDataSource.getRepository(Organization);

        const org = await orgRepo.findOne({ where: { subdomain: 'apple' } });
        if (!org) return console.log('No org');

        console.log('Fetching for org:', org.id);

        const qb = apptRepo.createQueryBuilder('appointment')
            .leftJoinAndSelect('appointment.service', 'service')
            .leftJoinAndSelect('service.department', 'department')
            .leftJoinAndSelect('appointment.doctor', 'doctor')
            .leftJoinAndSelect('appointment.patient', 'patient')
            .where('appointment.organization_id = :orgId', { orgId: org.id })
            .take(5);

        const items = await qb.getMany();

        console.log('Found items:', items.length);
        if (items.length > 0) {
            const first = items[0];
            // Access internal column if accessible, or casting
            console.log('Raw ID:', (first as any).id);
            console.log('PatientID column:', (first as any).patientId);
            console.log('Full Object Keys:', Object.keys(first));

            if ((first as any).patientId) {
                const user = await AppDataSource.getRepository('User').findOne({ where: { id: (first as any).patientId } });
                console.log('Patient lookup via ID:', user ? 'Found' : 'Not Found');
            }

            console.log('Patient Relation:', first.patient ? 'Found' : 'Missing');

            console.log('Doctor:', first.doctor ? 'Found' : 'Missing');
            if (first.doctor) console.log('Doctor Name:', first.doctor.firstName);

            console.log('Service:', first.service ? 'Found' : 'Missing');
            if (first.service) {
                console.log('Service Name:', first.service.name);
                console.log('Department:', (first.service as any).department ? 'Found' : 'Missing');
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await AppDataSource.destroy();
    }
}

testFetch();
