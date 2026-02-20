import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    Index
} from 'typeorm';
import { IsNotEmpty, IsString, IsOptional, IsBoolean } from 'class-validator';
import { Organization } from './Organization';

/**
 * Location Entity - Represents a physical branch/location of an organization
 * 
 * This allows organizations to have multiple locations (branches) while
 * maintaining a single organizational identity.
 * 
 * Example:
 * - Organization: "Tamil Nadu Hospital Network"
 *   - Location 1: "Chennai Branch" (code: CHN)
 *   - Location 2: "Delhi Branch" (code: DEL)
 *   - Location 3: "Bangalore Branch" (code: BLR)
 */
@Entity('locations')
@Index(['organizationId', 'code'], { unique: true })
@Index(['organizationId', 'isActive'])
export class Location {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => Organization, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'organization_id' })
    organization!: Organization;

    @Column({ name: 'organization_id', type: 'uuid' })
    organizationId!: string;

    @Column()
    @IsNotEmpty()
    @IsString()
    name!: string; // "Chennai Branch", "Delhi Branch"

    @Column({ length: 10 })
    @IsNotEmpty()
    @IsString()
    code!: string; // "CHN", "DEL", "BLR" - Short unique identifier

    @Column({ type: 'text', nullable: true })
    @IsOptional()
    @IsString()
    address?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsOptional()
    @IsString()
    city?: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    @IsOptional()
    @IsString()
    state?: string;

    @Column({ type: 'varchar', length: 100, nullable: true, default: 'India' })
    @IsOptional()
    @IsString()
    country?: string;

    @Column({ type: 'varchar', length: 20, nullable: true })
    @IsOptional()
    @IsString()
    phone?: string;

    @Column({ type: 'varchar', length: 255, nullable: true })
    @IsOptional()
    @IsString()
    email?: string;

    @Column({ name: 'is_main_branch', type: 'boolean', default: false })
    @IsBoolean()
    isMainBranch!: boolean;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    @IsBoolean()
    isActive!: boolean;

    @Column({ type: 'jsonb', default: {} })
    settings!: {
        operatingHours?: {
            monday?: { open: string; close: string };
            tuesday?: { open: string; close: string };
            wednesday?: { open: string; close: string };
            thursday?: { open: string; close: string };
            friday?: { open: string; close: string };
            saturday?: { open: string; close: string };
            sunday?: { open: string; close: string };
        };
        capacity?: {
            beds?: number;
            opds?: number;
            emergencyBeds?: number;
        };
        features?: {
            hasPharmacy?: boolean;
            hasLaboratory?: boolean;
            hasEmergency?: boolean;
            hasRadiology?: boolean;
        };
    };

    @CreateDateColumn({ name: 'created_at' })
    createdAt!: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt!: Date;

    // ===== HELPER METHODS =====

    /**
     * Get display name with city
     */
    getDisplayName(): string {
        return this.city ? `${this.name} (${this.city})` : this.name;
    }

    /**
     * Get full address
     */
    getFullAddress(): string {
        const parts = [this.address, this.city, this.state, this.country].filter(Boolean);
        return parts.join(', ');
    }
}
