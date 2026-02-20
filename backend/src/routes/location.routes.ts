import { Router } from 'express';
import {
    createLocation,
    listLocations,
    listAllLocations,
    getLocation,
    updateLocation,
    deleteLocation,
    getLocationStats
} from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';
import { tenantContext } from '../middleware/tenant.middleware';
import { errorHandler } from '../middleware/error.middleware';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Locations
 *   description: Organization location/branch management
 */

// All routes require authentication and tenant context
router.use(authenticate);
router.use(tenantContext);

/**
 * @swagger
 * /locations:
 *   get:
 *     summary: List all locations for the organization
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: includeInactive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Include inactive locations
 *     responses:
 *       200:
 *         description: List of locations
 */
router.get('/', errorHandler(listLocations));

/**
 * @swagger
 * /locations/all:
 *   get:
 *     summary: List all locations across all organizations (Super Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All locations grouped by organization
 *       403:
 *         description: Only super admins can access
 */
router.get('/all', errorHandler(listAllLocations));

/**
 * @swagger
 * /locations:
 *   post:
 *     summary: Create a new location (Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - code
 *             properties:
 *               name:
 *                 type: string
 *                 description: Location name (e.g., "Chennai Branch")
 *               code:
 *                 type: string
 *                 description: Short code (e.g., "CHN")
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *                 default: India
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               isMainBranch:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Location created successfully
 *       400:
 *         description: Invalid input or duplicate code
 *       403:
 *         description: Only admins can create locations
 */
router.post('/', errorHandler(createLocation));

/**
 * @swagger
 * /locations/{id}:
 *   get:
 *     summary: Get location details
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location details
 *       404:
 *         description: Location not found
 */
router.get('/:id', errorHandler(getLocation));

/**
 * @swagger
 * /locations/{id}:
 *   put:
 *     summary: Update location (Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               code:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               isMainBranch:
 *                 type: boolean
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Location updated successfully
 *       404:
 *         description: Location not found
 *       403:
 *         description: Only admins can update locations
 */
router.put('/:id', errorHandler(updateLocation));

/**
 * @swagger
 * /locations/{id}:
 *   delete:
 *     summary: Deactivate location (Admin only)
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location deactivated successfully
 *       400:
 *         description: Cannot delete main branch
 *       404:
 *         description: Location not found
 */
router.delete('/:id', errorHandler(deleteLocation));

/**
 * @swagger
 * /locations/{id}/stats:
 *   get:
 *     summary: Get location statistics
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Location statistics
 *       404:
 *         description: Location not found
 */
router.get('/:id/stats', errorHandler(getLocationStats));

export default router;
