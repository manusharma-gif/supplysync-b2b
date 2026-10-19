import { InvoiceGeneratorService, type InvoiceGenerationParams } from './InvoiceGeneratorService.js';

export type { InvoiceGenerationParams };
export { InvoiceGeneratorService };

/**
 * InvoiceService: Extends InvoiceGeneratorService for full backward and forward compatibility.
 * Implements Module 3 GST-compliant Freight Invoice generation under GTA Forward-Charge (12%).
 */
export class InvoiceService extends InvoiceGeneratorService {}
