import { Router } from 'express';
import { BidController } from '../controllers/BidController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const bidController = new BidController();

// Carrier places a bid
router.post('/', authenticateToken, requireRole(['CARRIER']), bidController.placeBid);

// Carrier views own bids
router.get('/my-bids', authenticateToken, requireRole(['CARRIER']), bidController.getMyBids);

// Scored & Ranked bids for a load (AI recommendation 70/30 composite score + net broker margin)
router.get('/load/:loadId/ranked', authenticateToken, bidController.getRankedBids);
router.get('/load/:loadId/scored', authenticateToken, bidController.getScoredBids);

// Broker accepts & dispatches a bid, auto-generating GST invoice
router.post('/:bidId/accept', authenticateToken, requireRole(['BROKER']), bidController.acceptBid);
router.post('/:bidId/approve', authenticateToken, requireRole(['BROKER']), bidController.approveBid);

export default router;
