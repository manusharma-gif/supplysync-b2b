import { Load, LoadCreationAttributes, LoadStatus, User, Bid } from '../models/index.js';

export class LoadRepository {
  public async create(data: LoadCreationAttributes): Promise<Load> {
    return await Load.create(data);
  }

  public async findById(id: number): Promise<Load | null> {
    return await Load.findByPk(id, {
      include: [
        { model: User, as: 'shipper', attributes: ['id', 'name', 'company_name', 'state', 'gstin'] },
        {
          model: Bid,
          as: 'bids',
          include: [{ model: User, as: 'carrier', attributes: ['id', 'name', 'company_name', 'reliability_score'] }],
        },
      ],
    });
  }

  public async findAll(filter?: { shipper_id?: number; status?: LoadStatus }): Promise<Load[]> {
    const whereClause: any = {};
    if (filter?.shipper_id) whereClause.shipper_id = filter.shipper_id;
    if (filter?.status) whereClause.status = filter.status;

    return await Load.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'shipper', attributes: ['id', 'name', 'company_name', 'state'] },
        {
          model: Bid,
          as: 'bids',
          include: [{ model: User, as: 'carrier', attributes: ['id', 'name', 'company_name', 'reliability_score'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public async updateStatus(id: number, status: LoadStatus): Promise<void> {
    await Load.update({ status }, { where: { id } });
  }
}
