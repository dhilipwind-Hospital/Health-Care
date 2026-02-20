import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';

export enum AssetType {
  MEDICAL_EQUIPMENT = 'medical_equipment',
  FURNITURE = 'furniture',
  IT_EQUIPMENT = 'it_equipment',
  VEHICLE = 'vehicle',
  BUILDING = 'building',
  OTHER = 'other'
}

export enum AssetStatus {
  ACTIVE = 'active',
  UNDER_MAINTENANCE = 'under_maintenance',
  DISPOSED = 'disposed',
  OUT_OF_ORDER = 'out_of_order'
}

@Entity('assets')
export class Asset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'asset_code', unique: true, length: 50 })
  assetCode!: string;

  @Column({ length: 200 })
  name!: string;

  @Column({ type: 'enum', enum: AssetType })
  type!: AssetType;

  @Column({ length: 100, nullable: true })
  manufacturer?: string;

  @Column({ length: 100, nullable: true })
  model?: string;

  @Column({ name: 'serial_number', length: 100, nullable: true })
  serialNumber?: string;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate?: Date;

  @Column({ name: 'purchase_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  purchasePrice?: number;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry?: Date;

  @Column({ type: 'enum', enum: AssetStatus, default: AssetStatus.ACTIVE })
  status!: AssetStatus;

  @Column({ length: 100, nullable: true })
  location?: string;

  @Column({ length: 100, nullable: true })
  department?: string;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
  lastMaintenanceDate?: Date;

  @Column({ name: 'next_maintenance_date', type: 'date', nullable: true })
  nextMaintenanceDate?: Date;

  @Column({ name: 'maintenance_frequency_days', type: 'int', nullable: true })
  maintenanceFrequencyDays?: number;

  @Column({ name: 'amc_vendor', length: 200, nullable: true })
  amcVendor?: string;

  @Column({ name: 'amc_expiry', type: 'date', nullable: true })
  amcExpiry?: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}

@Entity('asset_maintenance_logs')
export class AssetMaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'asset_id' })
  assetId!: string;

  @ManyToOne(() => Asset)
  @JoinColumn({ name: 'asset_id' })
  asset!: Asset;

  @Column({ name: 'maintenance_date', type: 'date' })
  maintenanceDate!: Date;

  @Column({ name: 'maintenance_type', length: 50 })
  maintenanceType!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'performed_by', length: 200, nullable: true })
  performedBy?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ name: 'next_due_date', type: 'date', nullable: true })
  nextDueDate?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
