import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { IsNotEmpty, IsOptional, IsString, IsEnum, IsDate, IsUUID } from 'class-validator';
import { User } from '../User';
import { PrescriptionItem } from './PrescriptionItem';
import { Organization } from '../Organization';

export enum PrescriptionStatus {
  PENDING = 'pending',
  DISPENSED = 'dispensed',
  PARTIALLY_DISPENSED = 'partially_dispensed',
  CANCELLED = 'cancelled'
}

@Entity('prescriptions')
export class Prescription {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'doctor_id', type: 'uuid' })
  @IsUUID()
  @IsNotEmpty()
  doctorId!: string;

  @Column({ type: 'text' })
  @IsString()
  @IsNotEmpty({ message: 'Diagnosis is required' })
  diagnosis!: string;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  notes?: string;

  @Column({ type: 'date' })
  @IsDate()
  prescriptionDate!: Date;

  @Column({
    type: 'enum',
    enum: PrescriptionStatus,
    default: PrescriptionStatus.PENDING
  })
  @IsEnum(PrescriptionStatus)
  status!: PrescriptionStatus;

  @OneToMany(() => PrescriptionItem, item => item.prescription, { cascade: true })
  items!: PrescriptionItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
