import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';
import { Appointment } from './Appointment';

export enum ConsultationStatus {
  SCHEDULED = 'scheduled',
  WAITING = 'waiting',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show'
}

export enum ConsultationType {
  VIDEO = 'video',
  AUDIO = 'audio',
  CHAT = 'chat'
}

@Entity('telemedicine_consultations')
export class TelemedicineConsultation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'consultation_number', unique: true, length: 30 })
  consultationNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'appointment_id', nullable: true })
  appointmentId?: string;

  @ManyToOne(() => Appointment, { nullable: true })
  @JoinColumn({ name: 'appointment_id' })
  appointment?: Appointment;

  @Column({ type: 'enum', enum: ConsultationType, default: ConsultationType.VIDEO })
  consultationType!: ConsultationType;

  @Column({ type: 'enum', enum: ConsultationStatus, default: ConsultationStatus.SCHEDULED })
  status!: ConsultationStatus;

  @Column({ name: 'scheduled_at', type: 'timestamp' })
  scheduledAt!: Date;

  @Column({ name: 'started_at', type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ name: 'ended_at', type: 'timestamp', nullable: true })
  endedAt?: Date;

  @Column({ name: 'duration_minutes', type: 'int', nullable: true })
  durationMinutes?: number;

  @Column({ name: 'meeting_link', length: 500, nullable: true })
  meetingLink?: string;

  @Column({ name: 'meeting_id', length: 100, nullable: true })
  meetingId?: string;

  @Column({ name: 'chief_complaint', type: 'text', nullable: true })
  chiefComplaint?: string;

  @Column({ type: 'text', nullable: true })
  diagnosis?: string;

  @Column({ type: 'text', nullable: true })
  prescription?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'follow_up_date', type: 'date', nullable: true })
  followUpDate?: Date;

  @Column({ name: 'patient_consent', default: false })
  patientConsent!: boolean;

  @Column({ name: 'consent_timestamp', type: 'timestamp', nullable: true })
  consentTimestamp?: Date;

  @Column({ name: 'recording_url', length: 500, nullable: true })
  recordingUrl?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee?: number;

  @Column({ name: 'is_paid', default: false })
  isPaid!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
