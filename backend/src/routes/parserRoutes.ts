import { Router } from 'express';
import { DispatchParserController } from '../controllers/DispatchParserController.js';
import { authenticateToken, optionalAuth, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const parserController = new DispatchParserController();

// Parse unstructured WhatsApp/Email text
router.post('/parse', optionalAuth, parserController.parseInquiry);

// Convert parsed text directly to an open load (SHIPPER or BROKER)
router.post(
  '/create-load',
  authenticateToken,
  requireRole(['SHIPPER', 'BROKER']),
  parserController.createLoadFromParsed
);

export default router;
