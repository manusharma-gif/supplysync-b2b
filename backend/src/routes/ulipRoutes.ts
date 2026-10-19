import { Router } from 'express';
import { UlipController } from '../controllers/UlipController.js';

const router = Router();
const ulipController = new UlipController();

/**
 * GET /api/ulip/verify-vehicle/:vehicleNumber
 * Query params (optional): originCity, destCity
 */
router.get('/verify-vehicle/:vehicleNumber', ulipController.verifyVehicle);

export default router;
