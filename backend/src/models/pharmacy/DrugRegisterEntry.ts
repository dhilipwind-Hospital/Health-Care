import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../Organization';
import { User } from '../User';
import { Medicine } from './Medicine';

export enum DrugScheduleType {
  SCHEDULE_H = 'schedule_h',
  SCHEDULE_H1 = 'schedule_h1',
  SCHEDULE_X = 'schedule_x'
}

@Entity('drug_register_entries')
export class DrugRegisterEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'medicine_id' })
  medicineId!: string;

  @ManyToOne(() => Medicine)
  @JoinColumn({ name: 'medicine_id' })
  medicine!: Medicine;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'prescription_id', nullable: true })
  prescriptionId?: string;

  @Column({ name: 'dispensed_by_id', nullable: true })
  dispensedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'dispensed_by_id' })
  dispensedBy?: User;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'batch_number', nullable: true, length: 50 })
  batchNumber?: string;

  @Column({ type: 'date' })
  date!: Date;

  @Column({ name: 'patient_name', length: 200 })
  patientName!: string;

  @Column({ name: 'patient_address', type: 'text', nullable: true })
  patientAddress?: string;

  @Column({ name: 'patient_age', nullable: true })
  patientAge?: string;

  @Column({ name: 'doctor_name', length: 200 })
  doctorName!: string;

  @Column({ name: 'doctor_license_number', nullable: true, length: 50 })
  doctorLicenseNumber?: string;

  @Column({ name: 'prescription_date', type: 'date', nullable: true })
  prescriptionDate?: Date;

  @Column({
    name: 'schedule_type',
    type: 'enum',
    enum: DrugScheduleType
  })
  scheduleType!: DrugScheduleType;

  @Column({ name: 'medicine_name', length: 200 })
  medicineName!: string;

  @Column({ name: 'medicine_strength', nullable: true, length: 50 })
  medicineStrength?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
