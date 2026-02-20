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
import { Surgery } from './Surgery';

export enum AnesthesiaRecordStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Entity('anesthesia_records')
export class AnesthesiaRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Surgery)
  @JoinColumn({ name: 'surgery_id' })
  surgery!: Surgery;

  @Column({ name: 'surgery_id', type: 'uuid', unique: true })
  surgeryId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'anesthetist_id' })
  anesthetist!: User;

  @Column({ name: 'anesthetist_id', type: 'uuid' })
  anesthetistId!: string;

  @Column({ type: 'jsonb', nullable: true })
  preOpAssessment?: {
    asaGrade?: string;
    mallampatiScore?: string;
    npoStatus?: string;
    lastMealTime?: string;
    airwayAssessment?: string;
    preExistingConditions?: string[];
    currentMedications?: string[];
    previousAnesthesia?: string;
    allergies?: string[];
  };

  @Column({ type: 'varchar', length: 30, nullable: true })
  anesthesiaType?: string;

  @Column({ type: 'timestamp', nullable: true })
  inductionTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  intubationTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  extubationTime?: Date;

  @Column({ type: 'timestamp', nullable: true })
  recoveryTime?: Date;

  @Column({ type: 'jsonb', nullable: true })
  drugsAdministered?: Array<{ drug: string; dose: string; route: string; time: string }>;

  @Column({ type: 'jsonb', nullable: true })
  vitalReadings?: Array<{ time: string; hr: number; bp: string; spo2: number; etco2?: number; temp?: number }>;

  @Column({ type: 'jsonb', nullable: true })
  fluidInput?: { crystalloids?: number; colloids?: number; blood?: number; total?: number };

  @Column({ type: 'jsonb', nullable: true })
  fluidOutput?: { urine?: number; bloodLoss?: number; drain?: number; total?: number };

  @Column({ type: 'text', nullable: true })
  complications?: string;

  @Column({ type: 'text', nullable: true })
  postOpInstructions?: string;

  @Column({ type: 'int', nullable: true })
  recoveryScore?: number;

  @Column({ type: 'enum', enum: AnesthesiaRecordStatus, default: AnesthesiaRecordStatus.PLANNED })
  status!: AnesthesiaRecordStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
