import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum FileStatus {
  PENDING = 'pending',
  SCANNED = 'scanned',
  INDEXED = 'indexed',
  ARCHIVED = 'archived'
}

export enum FileType {
  PRESCRIPTION = 'prescription',
  LAB_REPORT = 'lab_report',
  RADIOLOGY = 'radiology',
  DISCHARGE_SUMMARY = 'discharge_summary',
  CONSENT_FORM = 'consent_form',
  REFERRAL = 'referral',
  INSURANCE = 'insurance',
  ID_PROOF = 'id_proof',
  OTHER = 'other'
}

@Entity('medical_record_files')
export class MedicalRecordFile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'file_number', unique: true, length: 30 })
  fileNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'file_name', length: 255 })
  fileName!: string;

  @Column({ name: 'original_file_name', length: 255, nullable: true })
  originalFileName?: string;

  @Column({ type: 'enum', enum: FileType, default: FileType.OTHER })
  fileType!: FileType;

  @Column({ name: 'mime_type', length: 100, nullable: true })
  mimeType?: string;

  @Column({ name: 'file_size', type: 'int', nullable: true })
  fileSize?: number;

  @Column({ name: 'file_path', type: 'text', nullable: true })
  filePath?: string;

  @Column({ name: 'storage_location', length: 100, nullable: true })
  storageLocation?: string;

  @Column({ type: 'enum', enum: FileStatus, default: FileStatus.PENDING })
  status!: FileStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: any;

  @Column({ type: 'jsonb', nullable: true })
  tags?: string[];

  @Column({ name: 'document_date', type: 'date', nullable: true })
  documentDate?: Date;

  @Column({ name: 'scanned_at', type: 'timestamp', nullable: true })
  scannedAt?: Date;

  @Column({ name: 'scanned_by', nullable: true })
  scannedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'scanned_by' })
  scannedBy?: User;

  @Column({ name: 'indexed_at', type: 'timestamp', nullable: true })
  indexedAt?: Date;

  @Column({ name: 'uploaded_by' })
  uploadedById!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploadedBy!: User;

  @Column({ name: 'is_confidential', default: false })
  isConfidential!: boolean;

  @Column({ name: 'retention_period_years', type: 'int', nullable: true })
  retentionPeriodYears?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
