import { Router } from 'express';
import { CorridorController } from '../controllers/CorridorController.js';

const router = Router();
const corridorController = new CorridorController();

router.get('/', corridorController.getCorridors);

export default router;
