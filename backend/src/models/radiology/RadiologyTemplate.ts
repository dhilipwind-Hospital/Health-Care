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
import { ModalityType } from './RadiologyOrder';

@Entity('radiology_templates')
export class RadiologyTemplate {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: ModalityType })
  modalityType!: ModalityType;

  @Column({ type: 'varchar' })
  bodyPart!: string;

  @Column({ type: 'text' })
  findingsTemplate!: string;

  @Column({ type: 'text' })
  impressionTemplate!: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User;

  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
