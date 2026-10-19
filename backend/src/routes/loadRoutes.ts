import { Router } from 'express';
import { LoadController } from '../controllers/LoadController.js';
import { DispatchParserController } from '../controllers/DispatchParserController.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const loadController = new LoadController();
const parserController = new DispatchParserController();

// Anyone authenticated can view loads
router.get('/', authenticateToken, loadController.getLoads);
router.get('/:id', authenticateToken, loadController.getLoadById);

// Module 3: Parse unstructured WhatsApp/Email dispatch inquiry
router.post('/parse-inquiry', optionalAuth, parserController.parseInquiry);

// Only SHIPPER or BROKER can create loads
router.post('/', authenticateToken, requireRole(['SHIPPER', 'BROKER']), loadController.createLoad);

export default router;
