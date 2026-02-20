import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import { UserRole } from '../types/roles';
import { DeathCertificateController } from '../controllers/death-certificate.controller';

const router = Router();

const isStaff = authorize({ requireRole: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.DOCTOR] });

router.get('/', authenticate, isStaff, DeathCertificateController.list);
router.get('/:id', authenticate, isStaff, DeathCertificateController.getById);
router.post('/', authenticate, isStaff, DeathCertificateController.create);
router.put('/:id', authenticate, isStaff, DeathCertificateController.update);
router.patch('/:id/certify', authenticate, isStaff, DeathCertificateController.certify);
router.patch('/:id/handover', authenticate, isStaff, DeathCertificateController.recordHandover);

export default router;
