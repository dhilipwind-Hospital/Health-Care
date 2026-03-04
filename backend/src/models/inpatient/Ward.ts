import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Department } from '../Department';
import { Room } from './Room';
import { Organization } from '../Organization';

@Entity('wards')
@Index(['organizationId', 'wardNumber'], { unique: true })
export class Ward {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization!: Organization;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column()
  name!: string;

  @Column()
  wardNumber!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToOne(() => Department)
  @JoinColumn({ name: 'department_id' })
  department!: Department;

  @Column({ name: 'department_id', type: 'uuid' })
  departmentId!: string;

  @Column('int')
  capacity!: number;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'text', nullable: true })
  location?: string;

  @OneToMany(() => Room, room => room.ward)
  rooms!: Room[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
