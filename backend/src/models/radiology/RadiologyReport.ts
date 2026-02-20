import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../User';
import { RadiologyOrder } from './RadiologyOrder';

export enum ReportStatus {
  DRAFT = 'draft',
  PRELIMINARY = 'preliminary',
  FINAL = 'final',
  ADDENDUM = 'addendum',
  AMENDED = 'amended',
}

@Entity('radiology_reports')
export class RadiologyReport {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => RadiologyOrder)
  @JoinColumn({ name: 'order_id' })
  order!: RadiologyOrder;

  @Column({ name: 'order_id', type: 'uuid', unique: true })
  orderId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'radiologist_id' })
  radiologist!: User;

  @Column({ name: 'radiologist_id', type: 'uuid' })
  radiologistId!: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'verified_by' })
  verifiedByUser?: User;

  @Column({ name: 'verified_by', type: 'uuid', nullable: true })
  verifiedBy?: string;

  @Column({ type: 'text' })
  findings!: string;

  @Column({ type: 'text' })
  impression!: string;

  @Column({ type: 'text', nullable: true })
  recommendation?: string;

  @Column({ type: 'boolean', default: false })
  criticalFinding!: boolean;

  @Column({ type: 'text', nullable: true })
  criticalFindingDetails?: string;

  @Column({ name: 'critical_finding_notified_to', type: 'uuid', nullable: true })
  criticalFindingNotifiedTo?: string;

  @Column({ type: 'timestamp', nullable: true })
  criticalFindingNotifiedAt?: Date;

  @Column({ type: 'varchar', nullable: true })
  templateUsed?: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT })
  reportStatus!: ReportStatus;

  @Column({ type: 'timestamp' })
  reportedAt!: Date;

  @Column({ type: 'timestamp', nullable: true })
  verifiedAt?: Date;

  @Column({ type: 'text', nullable: true })
  addendumNotes?: string;

  @Column({ type: 'timestamp', nullable: true })
  addendumDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
