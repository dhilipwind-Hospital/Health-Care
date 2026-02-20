import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Organization } from '../Organization';
import { User } from '../User';
import { BloodInventory } from './BloodInventory';
import { CrossMatchRequest } from './CrossMatchRequest';

export enum TransfusionStatus {
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  STOPPED_REACTION = 'stopped_reaction',
  STOPPED_OTHER = 'stopped_other',
}

export enum ReactionType {
  FEBRILE = 'febrile',
  ALLERGIC = 'allergic',
  HEMOLYTIC = 'hemolytic',
  ANAPHYLACTIC = 'anaphylactic',
  TACO = 'taco',
  TRALI = 'trali',
  OTHER = 'other',
}

@Entity('transfusions')
export class Transfusion {
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

  @ManyToOne(() => BloodInventory)
  @JoinColumn({ name: 'blood_inventory_id' })
  bloodInventory!: BloodInventory;

  @Column({ name: 'blood_inventory_id', type: 'uuid' })
  bloodInventoryId!: string;

  @ManyToOne(() => CrossMatchRequest, { nullable: true })
  @JoinColumn({ name: 'cross_match_id' })
  crossMatch?: CrossMatchRequest;

  @Column({ name: 'cross_match_id', type: 'uuid', nullable: true })
  crossMatchId?: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'administered_by' })
  administeredByUser!: User;

  @Column({ name: 'administered_by', type: 'uuid' })
  administeredBy!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'supervised_by' })
  supervisedByUser!: User;

  @Column({ name: 'supervised_by', type: 'uuid' })
  supervisedBy!: string;

  @Column({ type: 'timestamp' })
  startTime!: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column({ type: 'int' })
  volumeTransfused!: number;

  @Column({ type: 'varchar', nullable: true })
  rate?: string;

  @Column({ type: 'jsonb', nullable: true })
  preVitals?: { bp?: string; hr?: number; temp?: number; spo2?: number };

  @Column({ type: 'jsonb', nullable: true })
  postVitals?: { bp?: string; hr?: number; temp?: number; spo2?: number };

  @Column({ type: 'boolean', default: false })
  reaction!: boolean;

  @Column({ type: 'enum', enum: ReactionType, nullable: true })
  reactionType?: ReactionType;

  @Column({ type: 'text', nullable: true })
  reactionDetails?: string;

  @Column({ type: 'timestamp', nullable: true })
  reactionTime?: Date;

  @Column({ type: 'text', nullable: true })
  reactionManagement?: string;

  @Column({ type: 'enum', enum: TransfusionStatus, default: TransfusionStatus.IN_PROGRESS })
  status!: TransfusionStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
