import { Router } from 'express';
import {
    createSalesInquiry,
    getAllSalesInquiries,
    getSalesInquiryById,
    updateSalesInquiry,
    deleteSalesInquiry,
    getSalesInquiryStats
} from '../controllers/sales-inquiry.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';

const router = Router();

// PUBLIC route - anyone can submit an inquiry
router.post('/', createSalesInquiry);

// PROTECTED routes - super_admin only
router.get('/stats', authenticate, authorize(['super_admin']), getSalesInquiryStats);
router.get('/', authenticate, authorize(['super_admin']), getAllSalesInquiries);
router.get('/:id', authenticate, authorize(['super_admin']), getSalesInquiryById);
router.patch('/:id', authenticate, authorize(['super_admin']), updateSalesInquiry);
router.delete('/:id', authenticate, authorize(['super_admin']), deleteSalesInquiry);

export default router;
