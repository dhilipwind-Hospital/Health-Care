import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from '../Organization';
import { User } from '../User';
import { Medicine } from './Medicine';

export enum NdpsTransactionType {
  OPENING_BALANCE = 'opening_balance',
  RECEIVED = 'received',
  DISPENSED = 'dispensed',
  ADJUSTMENT = 'adjustment',
  EXPIRED = 'expired',
  DESTROYED = 'destroyed'
}

@Entity('ndps_register_entries')
export class NdpsRegisterEntry {
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

  @Column({ type: 'date' })
  date!: Date;

  @Column({
    name: 'transaction_type',
    type: 'enum',
    enum: NdpsTransactionType
  })
  transactionType!: NdpsTransactionType;

  @Column({ name: 'opening_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  openingBalance: number = 0;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  received: number = 0;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  dispensed: number = 0;

  @Column({ name: 'closing_balance', type: 'decimal', precision: 10, scale: 2, default: 0 })
  closingBalance: number = 0;

  @Column({ name: 'patient_id', nullable: true })
  patientId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: User;

  @Column({ name: 'patient_name', nullable: true, length: 200 })
  patientName?: string;

  @Column({ name: 'doctor_id', nullable: true })
  doctorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'doctor_id' })
  doctor?: User;

  @Column({ name: 'doctor_name', nullable: true, length: 200 })
  doctorName?: string;

  @Column({ name: 'prescription_id', nullable: true })
  prescriptionId?: string;

  @Column({ name: 'batch_number', nullable: true, length: 50 })
  batchNumber?: string;

  @Column({ name: 'supplier_name', nullable: true, length: 200 })
  supplierName?: string;

  @Column({ name: 'invoice_number', nullable: true, length: 50 })
  invoiceNumber?: string;

  @Column({ name: 'recorded_by_id', nullable: true })
  recordedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'recorded_by_id' })
  recordedBy?: User;

  @Column({ name: 'witness_name', nullable: true, length: 200 })
  witnessName?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
