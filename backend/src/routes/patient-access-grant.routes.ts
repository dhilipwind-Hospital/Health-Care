import { Router } from 'express';
import { PatientAccessGrantController } from '../controllers/patient-access-grant.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Patient Access Grants
 *   description: Cross-location patient record access management
 */

// ============================================================
// PUBLIC ENDPOINTS (for email link approval/rejection)
// ============================================================

/**
 * @swagger
 * /access-grants/approve/{requestId}/{token}:
 *   get:
 *     summary: Approve access request (via email link)
 *     tags: [Patient Access Grants]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access approved successfully
 *       404:
 *         description: Request not found or already processed
 */
router.get(
    '/approve/:requestId/:token',
    errorHandler(PatientAccessGrantController.approveAccess)
);

/**
 * @swagger
 * /access-grants/reject/{requestId}/{token}:
 *   get:
 *     summary: Reject access request (via email link)
 *     tags: [Patient Access Grants]
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access rejected successfully
 *       404:
 *         description: Request not found or already processed
 */
router.get(
    '/reject/:requestId/:token',
    errorHandler(PatientAccessGrantController.rejectAccess)
);

// ============================================================
// AUTHENTICATED ENDPOINTS
// ============================================================

// Apply authentication middleware for all routes below
router.use(authenticate);
router.use(tenantContext);

// ----- DOCTOR ENDPOINTS -----

/**
 * @swagger
 * /access-grants/search-patient:
 *   get:
 *     summary: Search for patients across organizations (Doctors only)
 *     tags: [Patient Access Grants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term (minimum 3 characters)
 *       - in: query
 *         name: searchType
 *         schema:
 *           type: string
 *           enum: [id, email, phone, name]
 *           default: id
 *     responses:
 *       200:
 *         description: List of matching patients (masked info)
 *       403:
 *         description: Only doctors can search
 */
router.get(
    '/search-patient',
    errorHandler(PatientAccessGrantController.searchPatientCrossOrg)
);

/**
 * @swagger
 * /access-grants/request:
 *   post:
 *     summary: Request access to a patient's records (Doctors only)
 *     tags: [Patient Access Grants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - reason
 *             properties:
 *               patientId:
 *                 type: string
 *                 description: Patient's UUID
 *               reason:
 *                 type: string
 *                 description: Reason for access request (minimum 10 characters)
 *               duration:
 *                 type: string
 *                 enum: [24_hours, 3_days, 1_week]
 *                 default: 24_hours
 *               urgencyLevel:
 *                 type: string
 *                 enum: [emergency, urgent, normal]
 *                 default: normal
 *     responses:
 *       201:
 *         description: Access request created and email sent
 *       400:
 *         description: Invalid request or duplicate request
 *       403:
 *         description: Only doctors can request access
 */
router.post(
    '/request',
    errorHandler(PatientAccessGrantController.requestAccess)
);

/**
 * @swagger
 * /access-grants/my-requests:
 *   get:
 *     summary: Get doctor's access requests (pending and active)
 *     tags: [Patient Access Grants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, expired, revoked]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of access requests
 */
router.get(
    '/my-requests',
    errorHandler(PatientAccessGrantController.getDoctorRequests)
);

// ----- PATIENT ENDPOINTS -----

/**
 * @swagger
 * /access-grants/who-has-access:
 *   get:
 *     summary: Get list of who has access to patient's records
 *     tags: [Patient Access Grants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeExpired
 *         schema:
 *           type: string
 *           enum: [true, false]
 *           default: false
 *         description: Include expired/revoked grants
 *     responses:
 *       200:
 *         description: List of access grants with summary
 */
router.get(
    '/who-has-access',
    errorHandler(PatientAccessGrantController.getPatientAccessGrants)
);

/**
 * @swagger
 * /access-grants/{requestId}/revoke:
 *   post:
 *     summary: Revoke an active access grant (Patients only)
 *     tags: [Patient Access Grants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access revoked successfully
 *       404:
 *         description: Access grant not found
 */
router.post(
    '/:requestId/revoke',
    errorHandler(PatientAccessGrantController.revokeAccess)
);

export default router;
