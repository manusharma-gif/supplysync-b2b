import { Request, Response } from 'express';
import { InvoiceService } from '../services/InvoiceService.js';

export class InvoiceController {
  private invoiceService: InvoiceService;

  constructor() {
    this.invoiceService = new InvoiceService();
  }

  public getInvoiceById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const invoice = await this.invoiceService.getInvoiceById(id);
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found' });
        return;
      }
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getInvoiceByLoadId = async (req: Request, res: Response): Promise<void> => {
    try {
      const loadId = parseInt(String(req.params.loadId), 10);
      const invoice = await this.invoiceService.getInvoiceByLoadId(loadId);
      if (!invoice) {
        res.status(404).json({ error: 'Invoice not found for this load' });
        return;
      }
      res.json(invoice);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public getAllInvoices = async (req: Request, res: Response): Promise<void> => {
    try {
      const invoices = await this.invoiceService.getAllInvoices();
      res.json(invoices);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  public markAsPaid = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = parseInt(String(req.params.id), 10);
      await this.invoiceService.markAsPaid(id);
      res.json({ message: 'Invoice marked as paid' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };
}
