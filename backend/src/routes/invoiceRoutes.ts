import { Router } from 'express';
import { InvoiceController } from '../controllers/InvoiceController.js';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';

const router = Router();
const invoiceController = new InvoiceController();

// View invoices
router.get('/', authenticateToken, invoiceController.getAllInvoices);
router.get('/load/:loadId', authenticateToken, invoiceController.getInvoiceByLoadId);
router.get('/:id', authenticateToken, invoiceController.getInvoiceById);

// Update payment status (BROKER only)
router.patch('/:id/paid', authenticateToken, requireRole(['BROKER']), invoiceController.markAsPaid);

export default router;
