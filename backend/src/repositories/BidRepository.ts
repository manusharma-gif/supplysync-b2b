import { Bid, BidCreationAttributes, BidStatus, Load, User } from '../models/index.js';

export class BidRepository {
  public async create(data: BidCreationAttributes): Promise<Bid> {
    return await Bid.create(data);
  }

  public async findById(id: number): Promise<Bid | null> {
    return await Bid.findByPk(id, {
      include: [
        { model: Load, as: 'load', include: [{ model: User, as: 'shipper' }] },
        { model: User, as: 'carrier', attributes: ['id', 'name', 'company_name', 'reliability_score'] },
      ],
    });
  }

  public async findByLoadId(load_id: number): Promise<Bid[]> {
    return await Bid.findAll({
      where: { load_id },
      include: [{ model: User, as: 'carrier', attributes: ['id', 'name', 'company_name', 'reliability_score'] }],
      order: [['bid_amount_paise', 'ASC']],
    });
  }

  public async findByCarrierId(carrier_id: number): Promise<Bid[]> {
    return await Bid.findAll({
      where: { carrier_id },
      include: [
        {
          model: Load,
          as: 'load',
          include: [{ model: User, as: 'shipper', attributes: ['id', 'name', 'company_name'] }],
        },
      ],
      order: [['created_at', 'DESC']],
    });
  }

  public async updateStatus(id: number, status: BidStatus): Promise<void> {
    await Bid.update({ status }, { where: { id } });
  }

  public async rejectOtherBidsForLoad(load_id: number, acceptedBidId: number): Promise<void> {
    const { Op } = await import('sequelize');
    await Bid.update(
      { status: 'REJECTED' },
      {
        where: {
          load_id,
          id: { [Op.ne]: acceptedBidId },
          status: 'PENDING',
        },
      }
    );
  }
}
