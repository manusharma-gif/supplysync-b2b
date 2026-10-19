import { Invoice, InvoiceCreationAttributes, Load, Bid, User } from '../models/index.js';

export class InvoiceRepository {
  public async create(data: InvoiceCreationAttributes): Promise<Invoice> {
    return await Invoice.create(data);
  }

  public async findById(id: number): Promise<Invoice | null> {
    return await Invoice.findByPk(id, {
      include: [
        {
          model: Load,
          as: 'load',
          include: [{ model: User, as: 'shipper' }],
        },
        {
          model: Bid,
          as: 'bid',
          include: [{ model: User, as: 'carrier' }],
        },
        { model: User, as: 'broker', attributes: ['id', 'name', 'company_name', 'gstin', 'state'] },
      ],
    });
  }

  public async findAll(): Promise<Invoice[]> {
    return await Invoice.findAll({
      include: [
        {
          model: Load,
          as: 'load',
          include: [{ model: User, as: 'shipper' }],
        },
        {
          model: Bid,
          as: 'bid',
          include: [{ model: User, as: 'carrier' }],
        },
        { model: User, as: 'broker', attributes: ['id', 'name', 'company_name', 'gstin'] },
      ],
      order: [['created_at', 'DESC']],
    });
  }
}
