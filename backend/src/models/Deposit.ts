import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum DepositPurpose {
  ADMISSION = 'admission',
  SURGERY = 'surgery',
  ADVANCE = 'advance',
  SECURITY = 'security',
}

export enum DepositStatus {
  RECEIVED = 'received',
  ADJUSTED = 'adjusted',
  REFUNDED = 'refunded',
  PARTIALLY_REFUNDED = 'partially_refunded',
}

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid' })
  patientId!: string;

  @Column({ name: 'admission_id', type: 'uuid', nullable: true })
  admissionId?: string;

  @Column({ unique: true })
  receiptNumber!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ type: 'varchar', length: 30 })
  paymentMethod!: string;

  @Column({ type: 'varchar', nullable: true })
  transactionId?: string;

  @Column({ type: 'enum', enum: DepositPurpose, default: DepositPurpose.ADVANCE })
  purpose!: DepositPurpose;

  @Column({ type: 'enum', enum: DepositStatus, default: DepositStatus.RECEIVED })
  status!: DepositStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  adjustedAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundedAmount!: number;

  @Column({ name: 'adjusted_to_bill_id', type: 'uuid', nullable: true })
  adjustedToBillId?: string;

  @Column({ type: 'date', nullable: true })
  refundDate?: Date;

  @Column({ type: 'text', nullable: true })
  refundReason?: string;

  @Column({ name: 'refund_approved_by', type: 'uuid', nullable: true })
  refundApprovedBy?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'received_by' })
  receivedByUser!: User;

  @Column({ name: 'received_by', type: 'uuid' })
  receivedBy!: string;

  @Column({ type: 'timestamp' })
  receivedAt!: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
