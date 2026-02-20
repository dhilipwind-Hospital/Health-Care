import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Surgery } from './Surgery';

export enum ChecklistStatus {
  NOT_STARTED = 'not_started',
  SIGN_IN_DONE = 'sign_in_done',
  TIME_OUT_DONE = 'time_out_done',
  COMPLETED = 'completed',
}

@Entity('surgical_checklists')
export class SurgicalChecklist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Surgery)
  @JoinColumn({ name: 'surgery_id' })
  surgery!: Surgery;

  @Column({ name: 'surgery_id', type: 'uuid', unique: true })
  surgeryId!: string;

  // Sign In (Before Anesthesia)
  @Column({ type: 'jsonb', nullable: true })
  signIn?: {
    patientIdentityConfirmed?: boolean;
    siteMarked?: boolean;
    anesthesiaMachineChecked?: boolean;
    pulseOximeterAttached?: boolean;
    knownAllergies?: boolean;
    allergyDetails?: string;
    difficultAirway?: boolean;
    riskOfBloodLoss?: boolean;
    bloodAvailable?: boolean;
    completedBy?: string;
    completedAt?: string;
  };

  // Time Out (Before Skin Incision)
  @Column({ type: 'jsonb', nullable: true })
  timeOut?: {
    teamIntroduced?: boolean;
    patientNameConfirmed?: boolean;
    procedureConfirmed?: boolean;
    siteConfirmed?: boolean;
    antibioticGiven?: boolean;
    antibioticTime?: string;
    anticipatedCriticalEvents?: boolean;
    surgeonConcerns?: string;
    anesthesiaConcerns?: string;
    nursingConcerns?: string;
    imagingDisplayed?: boolean;
    completedBy?: string;
    completedAt?: string;
  };

  // Sign Out (Before Patient Leaves OT)
  @Column({ type: 'jsonb', nullable: true })
  signOut?: {
    procedureRecorded?: boolean;
    instrumentCountCorrect?: boolean;
    spongeCountCorrect?: boolean;
    needleCountCorrect?: boolean;
    specimenLabeled?: boolean;
    equipmentIssues?: boolean;
    equipmentIssueDetails?: string;
    recoveryPlanDiscussed?: boolean;
    completedBy?: string;
    completedAt?: string;
  };

  @Column({ type: 'enum', enum: ChecklistStatus, default: ChecklistStatus.NOT_STARTED })
  status!: ChecklistStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
