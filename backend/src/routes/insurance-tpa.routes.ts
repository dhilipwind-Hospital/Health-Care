import { Router } from 'express';
import { InsuranceTpaController } from '../controllers/insurance-tpa.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Metadata
router.get('/claim-types', authenticate, InsuranceTpaController.getClaimTypes);
router.get('/claim-statuses', authenticate, InsuranceTpaController.getClaimStatuses);
router.get('/dashboard', authenticate, InsuranceTpaController.getDashboard);

// Companies
router.get('/companies', authenticate, InsuranceTpaController.listCompanies);
router.post('/companies', authenticate, InsuranceTpaController.createCompany);
router.put('/companies/:id', authenticate, InsuranceTpaController.updateCompany);

// Claims
router.get('/claims', authenticate, InsuranceTpaController.listClaims);
router.post('/claims', authenticate, InsuranceTpaController.createClaim);
router.put('/claims/:id', authenticate, InsuranceTpaController.updateClaim);
router.post('/claims/:id/submit', authenticate, InsuranceTpaController.submitClaim);
router.patch('/claims/:id/status', authenticate, InsuranceTpaController.updateClaimStatus);

export default router;
