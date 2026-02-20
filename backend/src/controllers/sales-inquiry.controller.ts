import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { SalesInquiry, InquiryStatus, InquirySource } from '../models/SalesInquiry';

const salesInquiryRepo = () => AppDataSource.getRepository(SalesInquiry);

/**
 * Submit a new sales inquiry (PUBLIC - no auth required)
 * POST /api/sales-inquiry
 */
export const createSalesInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            fullName,
            email,
            phone,
            companyName,
            companySize,
            message,
            source = InquirySource.LANDING_PAGE,
            interestedPlan,
            country,
            city
        } = req.body;

        // Validate required fields
        if (!fullName || !email || !message) {
            return res.status(400).json({
                message: 'Full name, email, and message are required'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: 'Please provide a valid email address'
            });
        }

        // Create the inquiry
        const inquiry = salesInquiryRepo().create({
            fullName,
            email,
            phone,
            companyName,
            companySize,
            message,
            source,
            interestedPlan,
            country,
            city,
            status: InquiryStatus.NEW
        });

        await salesInquiryRepo().save(inquiry);

        return res.status(201).json({
            message: 'Thank you! Our sales team will contact you shortly.',
            id: inquiry.id
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get all sales inquiries (PROTECTED - super_admin only)
 * GET /api/sales-inquiry
 */
export const getAllSalesInquiries = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            status,
            source,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'DESC'
        } = req.query;

        const queryBuilder = salesInquiryRepo()
            .createQueryBuilder('inquiry')
            .leftJoinAndSelect('inquiry.assignedTo', 'assignedTo');

        // Apply filters
        if (status) {
            queryBuilder.andWhere('inquiry.status = :status', { status });
        }

        if (source) {
            queryBuilder.andWhere('inquiry.source = :source', { source });
        }

        // Apply sorting
        const allowedSortFields = ['createdAt', 'updatedAt', 'fullName', 'email', 'status'];
        const sortField = allowedSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
        queryBuilder.orderBy(`inquiry.${sortField}`, sortOrder === 'ASC' ? 'ASC' : 'DESC');

        // Apply pagination
        const skip = (Number(page) - 1) * Number(limit);
        queryBuilder.skip(skip).take(Number(limit));

        const [inquiries, total] = await queryBuilder.getManyAndCount();

        // Get status counts for dashboard
        const statusCounts = await salesInquiryRepo()
            .createQueryBuilder('inquiry')
            .select('inquiry.status', 'status')
            .addSelect('COUNT(*)', 'count')
            .groupBy('inquiry.status')
            .getRawMany();

        return res.json({
            data: inquiries,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            },
            statusCounts: statusCounts.reduce((acc: any, curr: any) => {
                acc[curr.status] = parseInt(curr.count);
                return acc;
            }, {})
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get a single sales inquiry by ID (PROTECTED - super_admin only)
 * GET /api/sales-inquiry/:id
 */
export const getSalesInquiryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const inquiry = await salesInquiryRepo().findOne({
            where: { id },
            relations: ['assignedTo']
        });

        if (!inquiry) {
            return res.status(404).json({ message: 'Sales inquiry not found' });
        }

        return res.json(inquiry);
    } catch (error) {
        next(error);
    }
};

/**
 * Update a sales inquiry (PROTECTED - super_admin only)
 * PATCH /api/sales-inquiry/:id
 */
export const updateSalesInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { status, notes, assignedToId } = req.body;

        const inquiry = await salesInquiryRepo().findOne({ where: { id } });

        if (!inquiry) {
            return res.status(404).json({ message: 'Sales inquiry not found' });
        }

        // Update fields
        if (status) {
            inquiry.status = status;

            // Track status change timestamps
            if (status === InquiryStatus.CONTACTED && !inquiry.contactedAt) {
                inquiry.contactedAt = new Date();
            }
            if (status === InquiryStatus.WON && !inquiry.convertedAt) {
                inquiry.convertedAt = new Date();
            }
        }

        if (notes !== undefined) {
            inquiry.notes = notes;
        }

        if (assignedToId !== undefined) {
            inquiry.assignedToId = assignedToId;
        }

        await salesInquiryRepo().save(inquiry);

        return res.json({
            message: 'Sales inquiry updated successfully',
            data: inquiry
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete a sales inquiry (PROTECTED - super_admin only)
 * DELETE /api/sales-inquiry/:id
 */
export const deleteSalesInquiry = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const inquiry = await salesInquiryRepo().findOne({ where: { id } });

        if (!inquiry) {
            return res.status(404).json({ message: 'Sales inquiry not found' });
        }

        await salesInquiryRepo().remove(inquiry);

        return res.json({ message: 'Sales inquiry deleted successfully' });
    } catch (error) {
        next(error);
    }
};

/**
 * Get sales inquiry statistics (PROTECTED - super_admin only)
 * GET /api/sales-inquiry/stats
 */
export const getSalesInquiryStats = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const totalInquiries = await salesInquiryRepo().count();

        const newInquiries = await salesInquiryRepo().count({
            where: { status: InquiryStatus.NEW }
        });

        const wonDeals = await salesInquiryRepo().count({
            where: { status: InquiryStatus.WON }
        });

        const lostDeals = await salesInquiryRepo().count({
            where: { status: InquiryStatus.LOST }
        });

        // Get inquiries from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentInquiries = await salesInquiryRepo()
            .createQueryBuilder('inquiry')
            .where('inquiry.created_at >= :sevenDaysAgo', { sevenDaysAgo })
            .getCount();

        // Conversion rate
        const closedDeals = wonDeals + lostDeals;
        const conversionRate = closedDeals > 0 ? Math.round((wonDeals / closedDeals) * 100) : 0;

        return res.json({
            totalInquiries,
            newInquiries,
            wonDeals,
            lostDeals,
            recentInquiries,
            conversionRate
        });
    } catch (error) {
        next(error);
    }
};
