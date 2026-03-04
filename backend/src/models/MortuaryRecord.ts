import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

export enum MortuaryStatus {
  ADMITTED = 'admitted',
  STORED = 'stored',
  POST_MORTEM = 'post_mortem',
  READY_FOR_RELEASE = 'ready_for_release',
  RELEASED = 'released'
}

export enum PreservationType {
  REFRIGERATION = 'refrigeration',
  EMBALMING = 'embalming',
  NONE = 'none'
}

@Entity('mortuary_records')
export class MortuaryRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'record_number', length: 30 })
  recordNumber!: string;

  @Column({ name: 'patient_id', nullable: true })
  patientId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'patient_id' })
  patient?: User;

  @Column({ name: 'deceased_name', length: 100 })
  deceasedName!: string;

  @Column({ name: 'admission_id', nullable: true })
  admissionId?: string;

  @Column({ name: 'date_of_death', type: 'date' })
  dateOfDeath!: Date;

  @Column({ name: 'time_of_death', type: 'time', nullable: true })
  timeOfDeath?: string;

  @Column({ name: 'cause_of_death', type: 'text', nullable: true })
  causeOfDeath?: string;

  @Column({ name: 'death_certificate_id', nullable: true })
  deathCertificateId?: string;

  @Column({ name: 'chamber_number', length: 20, nullable: true })
  chamberNumber?: string;

  @Column({ name: 'storage_start_time', type: 'timestamp', nullable: true })
  storageStartTime?: Date;

  @Column({ name: 'storage_end_time', type: 'timestamp', nullable: true })
  storageEndTime?: Date;

  @Column({ name: 'body_condition', length: 100, nullable: true })
  bodyCondition?: string;

  @Column({ name: 'preservation_type', type: 'enum', enum: PreservationType, default: PreservationType.REFRIGERATION })
  preservationType!: PreservationType;

  @Column({ name: 'released_to', length: 100, nullable: true })
  releasedTo?: string;

  @Column({ name: 'released_to_relation', length: 50, nullable: true })
  releasedToRelation?: string;

  @Column({ name: 'released_to_id_type', length: 30, nullable: true })
  releasedToIdType?: string;

  @Column({ name: 'released_to_id_number', length: 50, nullable: true })
  releasedToIdNumber?: string;

  @Column({ name: 'released_at', type: 'timestamp', nullable: true })
  releasedAt?: Date;

  @Column({ name: 'release_authorized_by_id', nullable: true })
  releaseAuthorizedById?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'release_authorized_by_id' })
  releaseAuthorizedBy?: User;

  @Column({ name: 'police_notified', type: 'boolean', default: false })
  policeNotified!: boolean;

  @Column({ name: 'post_mortem_required', type: 'boolean', default: false })
  postMortemRequired!: boolean;

  @Column({ name: 'post_mortem_completed', type: 'boolean', default: false })
  postMortemCompleted!: boolean;

  @Column({ name: 'post_mortem_report', type: 'text', nullable: true })
  postMortemReport?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'enum', enum: MortuaryStatus, default: MortuaryStatus.ADMITTED })
  status!: MortuaryStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
