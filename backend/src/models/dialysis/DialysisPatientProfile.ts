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
import { Organization } from '../Organization';
import { User } from '../User';

@Entity('dialysis_patient_profiles')
export class DialysisPatientProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_id', type: 'uuid', unique: true })
  patientId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'varchar' })
  primaryDiagnosis!: string;

  @Column({ type: 'date' })
  dialysisStartDate!: Date;

  @Column({ type: 'varchar', length: 30 })
  accessType!: string;

  @Column({ type: 'varchar', nullable: true })
  accessSite?: string;

  @Column({ type: 'date', nullable: true })
  accessCreatedDate?: Date;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  dryWeight?: number;

  @Column({ type: 'varchar', nullable: true })
  prescribedFrequency?: string;

  @Column({ type: 'int', nullable: true })
  prescribedDuration?: number;

  @Column({ type: 'simple-array', nullable: true })
  allergies?: string[];

  @Column({ type: 'simple-array', nullable: true })
  comorbidities?: string[];

  @Column({ type: 'jsonb', nullable: true })
  currentMedications?: Array<{ drug: string; dose: string; frequency: string }>;

  @Column({ type: 'jsonb', nullable: true })
  hepatitisStatus?: { hbsag?: string; hcv?: string; hiv?: string };

  @Column({ type: 'int', default: 0 })
  totalSessions!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
