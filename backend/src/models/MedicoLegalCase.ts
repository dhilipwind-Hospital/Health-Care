import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { Organization } from './Organization';

export enum MlcStatus {
  REGISTERED = 'registered',
  UNDER_TREATMENT = 'under_treatment',
  DISCHARGED = 'discharged',
  REFERRED = 'referred',
  DECEASED = 'deceased',
  ABSCONDED = 'absconded'
}

export enum InjuryNature {
  ROAD_ACCIDENT = 'road_accident',
  ASSAULT = 'assault',
  FALL = 'fall',
  BURN = 'burn',
  POISONING = 'poisoning',
  ANIMAL_BITE = 'animal_bite',
  FIREARM = 'firearm',
  STAB_WOUND = 'stab_wound',
  HANGING = 'hanging',
  DROWNING = 'drowning',
  ELECTROCUTION = 'electrocution',
  INDUSTRIAL = 'industrial',
  DOMESTIC_VIOLENCE = 'domestic_violence',
  SEXUAL_ASSAULT = 'sexual_assault',
  SELF_INFLICTED = 'self_inflicted',
  UNKNOWN = 'unknown',
  OTHER = 'other'
}

@Entity('medico_legal_cases')
export class MedicoLegalCase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'mlc_number', unique: true })
  mlcNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'date_time', type: 'timestamp' })
  dateTime!: Date;

  @Column({ name: 'brought_by', nullable: true, length: 200 })
  broughtBy?: string;

  @Column({ name: 'brought_by_relation', nullable: true, length: 50 })
  broughtByRelation?: string;

  @Column({ name: 'brought_by_address', type: 'text', nullable: true })
  broughtByAddress?: string;

  @Column({ name: 'brought_by_phone', nullable: true, length: 20 })
  broughtByPhone?: string;

  @Column({ name: 'police_station', nullable: true, length: 100 })
  policeStation?: string;

  @Column({ name: 'officer_name', nullable: true, length: 100 })
  officerName?: string;

  @Column({ name: 'officer_badge_number', nullable: true, length: 50 })
  officerBadgeNumber?: string;

  @Column({ name: 'officer_phone', nullable: true, length: 20 })
  officerPhone?: string;

  @Column({ name: 'fir_number', nullable: true, length: 50 })
  firNumber?: string;

  @Column({
    name: 'nature_of_injury',
    type: 'enum',
    enum: InjuryNature,
    default: InjuryNature.UNKNOWN
  })
  natureOfInjury: InjuryNature = InjuryNature.UNKNOWN;

  @Column({ name: 'injury_description', type: 'text', nullable: true })
  injuryDescription?: string;

  @Column({ name: 'weapon_used', nullable: true, length: 100 })
  weaponUsed?: string;

  @Column({ name: 'foul_play_suspected', default: false })
  foulPlaySuspected: boolean = false;

  @Column({ name: 'alcohol_smell', default: false })
  alcoholSmell: boolean = false;

  @Column({ name: 'consciousness_level', nullable: true, length: 50 })
  consciousnessLevel?: string;

  @Column({ name: 'gcs_score', type: 'int', nullable: true })
  gcsScore?: number;

  @Column({ name: 'gcs_eye', type: 'int', nullable: true })
  gcsEye?: number;

  @Column({ name: 'gcs_verbal', type: 'int', nullable: true })
  gcsVerbal?: number;

  @Column({ name: 'gcs_motor', type: 'int', nullable: true })
  gcsMotor?: number;

  @Column({ name: 'iss_score', type: 'int', nullable: true })
  issScore?: number;

  @Column({ name: 'police_intimation_sent', default: false })
  policeIntimationSent: boolean = false;

  @Column({ name: 'police_intimation_date', type: 'timestamp', nullable: true })
  policeIntimationDate?: Date;

  @Column({ name: 'police_intimation_letter', type: 'text', nullable: true })
  policeIntimationLetter?: string;

  @Column({ name: 'is_doa', default: false })
  isDoa: boolean = false;

  @Column({ name: 'death_date_time', type: 'timestamp', nullable: true })
  deathDateTime?: Date;

  @Column({ name: 'cause_of_death', type: 'text', nullable: true })
  causeOfDeath?: string;

  @Column({ name: 'body_handover_to', nullable: true, length: 200 })
  bodyHandoverTo?: string;

  @Column({ name: 'body_handover_date', type: 'timestamp', nullable: true })
  bodyHandoverDate?: Date;

  @Column({ name: 'body_handover_witness', nullable: true, length: 200 })
  bodyHandoverWitness?: string;

  @Column({ name: 'attending_doctor_id', nullable: true })
  attendingDoctorId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'attending_doctor_id' })
  attendingDoctor?: User;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ name: 'clinical_findings', type: 'text', nullable: true })
  clinicalFindings?: string;

  @Column({ name: 'treatment_given', type: 'text', nullable: true })
  treatmentGiven?: string;

  @Column({
    type: 'enum',
    enum: MlcStatus,
    default: MlcStatus.REGISTERED
  })
  status: MlcStatus = MlcStatus.REGISTERED;

  @Column({ name: 'emergency_request_id', nullable: true })
  emergencyRequestId?: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
