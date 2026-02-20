import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Organization } from './Organization';
import { User } from './User';

@Entity('pcpndt_form_f')
export class PcpndtFormF {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'form_number', unique: true, length: 30 })
  formNumber!: string;

  @Column({ name: 'patient_id' })
  patientId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @Column({ name: 'patient_name', length: 200 })
  patientName!: string;

  @Column({ name: 'patient_age', type: 'int' })
  patientAge!: number;

  @Column({ name: 'husband_name', length: 200 })
  husbandName!: string;

  @Column({ type: 'text' })
  address!: string;

  @Column({ name: 'referred_by', length: 200, nullable: true })
  referredBy?: string;

  @Column({ name: 'self_referral', default: false })
  selfReferral!: boolean;

  @Column({ name: 'lmp_date', type: 'date' })
  lmpDate!: Date;

  @Column({ name: 'gestational_weeks', type: 'int' })
  gestationalWeeks!: number;

  @Column({ name: 'gravida', type: 'int', nullable: true })
  gravida?: number;

  @Column({ name: 'para', type: 'int', nullable: true })
  para?: number;

  @Column({ name: 'living_children', type: 'int', nullable: true })
  livingChildren?: number;

  @Column({ name: 'abortion_count', type: 'int', nullable: true })
  abortionCount?: number;

  @Column({ name: 'procedure_date', type: 'date' })
  procedureDate!: Date;

  @Column({ name: 'indication_for_test', type: 'text' })
  indicationForTest!: string;

  @Column({ name: 'previous_usg_reports', type: 'text', nullable: true })
  previousUsgReports?: string;

  @Column({ name: 'history_of_genetic_disease', type: 'text', nullable: true })
  historyOfGeneticDisease?: string;

  @Column({ name: 'doctor_id' })
  doctorId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'doctor_id' })
  doctor!: User;

  @Column({ name: 'doctor_registration_number', length: 50 })
  doctorRegistrationNumber!: string;

  @Column({ name: 'declaration_signed', default: false })
  declarationSigned!: boolean;

  @Column({ name: 'declaration_date', type: 'date', nullable: true })
  declarationDate?: Date;

  @Column({ name: 'patient_signature', type: 'text', nullable: true })
  patientSignature?: string;

  @Column({ name: 'doctor_signature', type: 'text', nullable: true })
  doctorSignature?: string;

  @Column({ name: 'witness_name', length: 200, nullable: true })
  witnessName?: string;

  @Column({ name: 'witness_signature', type: 'text', nullable: true })
  witnessSignature?: string;

  @Column({ type: 'text', nullable: true })
  remarks?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
