import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Appointment } from './Appointment';
import { Organization } from './Organization';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsEnum } from 'class-validator';

export enum BillStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
  PARTIALLY_PAID = 'partially_paid',
  REFUNDED = 'refunded',
  WRITTEN_OFF = 'written_off',
  CREDIT = 'credit'
}

export enum PaymentMethod {
  CASH = 'cash',
  CARD = 'card',
  INSURANCE = 'insurance',
  ONLINE = 'online',
  UPI = 'upi',
  NET_BANKING = 'net_banking',
  CHEQUE = 'cheque',
  WALLET = 'wallet'
}

export enum BillType {
  OPD = 'opd',
  IPD = 'ipd',
  PHARMACY = 'pharmacy',
  LAB = 'lab',
  RADIOLOGY = 'radiology',
  OT = 'ot',
  EMERGENCY = 'emergency',
  PACKAGE = 'package'
}

@Entity('bills')
export class Bill {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  @IsNotEmpty()
  organizationId!: string;

  @Column()
  @IsNotEmpty()
  @IsString()
  billNumber!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  @IsNotEmpty()
  @IsNumber()
  amount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  @IsOptional()
  @IsNumber()
  paidAmount: number = 0;

  @Column({
    type: 'enum',
    enum: BillStatus,
    default: BillStatus.PENDING
  })
  @IsEnum(BillStatus)
  status: BillStatus = BillStatus.PENDING;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true
  })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  @IsString()
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  @IsOptional()
  itemDetails?: Array<{
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;

  @Column({ type: 'date' })
  @IsNotEmpty()
  billDate!: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  dueDate?: Date;

  @Column({ type: 'date', nullable: true })
  @IsOptional()
  paidDate?: Date;

  // Location scoping
  @Column({ name: 'location_id', type: 'uuid', nullable: true })
  locationId?: string;

  // Bill type
  @Column({ type: 'varchar', length: 20, nullable: true })
  billType?: string;

  // GST Fields
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  subtotal?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  cgstRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cgstAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  sgstRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  sgstAmount?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  igstRate?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  igstAmount?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalTax?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  grandTotal?: number;

  @Column({ type: 'varchar', length: 20, nullable: true })
  hsnSacCode?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstinOrg?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gstinPatient?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  placeOfSupply?: string;

  @Column({ type: 'varchar', length: 10, nullable: true })
  invoiceType?: string;

  // Discount & Waiver
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number = 0;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  discountPercent?: number;

  @Column({ type: 'text', nullable: true })
  discountReason?: string;

  @Column({ name: 'discount_approved_by', type: 'uuid', nullable: true })
  discountApprovedBy?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  waiverAmount: number = 0;

  @Column({ type: 'text', nullable: true })
  waiverReason?: string;

  @Column({ name: 'waiver_approved_by', type: 'uuid', nullable: true })
  waiverApprovedBy?: string;

  // Deposit & Advance
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  depositAmount: number = 0;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  advanceAmount: number = 0;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  refundAmount: number = 0;

  @Column({ type: 'date', nullable: true })
  refundDate?: Date;

  @Column({ type: 'text', nullable: true })
  refundReason?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  balanceDue?: number;

  // Payment Details
  @Column({ type: 'varchar', length: 100, nullable: true })
  transactionId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  receiptNumber?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  paymentGateway?: string;

  // Insurance
  @Column({ name: 'insurance_claim_id', type: 'uuid', nullable: true })
  insuranceClaimId?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  insuranceCoverage?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  patientResponsibility?: number;

  // Credit
  @Column({ type: 'boolean', default: false })
  isCreditBill: boolean = false;

  @Column({ name: 'credit_approved_by', type: 'uuid', nullable: true })
  creditApprovedBy?: string;

  @Column({ type: 'date', nullable: true })
  creditDueDate?: Date;

  @Column({ type: 'date', nullable: true })
  creditSettledDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
