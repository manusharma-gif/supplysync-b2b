import { User, UserAttributes, UserCreationAttributes } from '../models/index.js';

export class UserRepository {
  public async findById(id: number): Promise<User | null> {
    return await User.findByPk(id);
  }

  public async findByEmail(email: string): Promise<User | null> {
    return await User.findOne({ where: { email } });
  }

  public async findByRole(role: string): Promise<User[]> {
    return await User.findAll({ where: { role } });
  }

  public async create(data: UserCreationAttributes): Promise<User> {
    return await User.create(data);
  }

  public async updateRating(userId: number, rating: number): Promise<void> {
    await User.update({ reliability_score: rating }, { where: { id: userId } });
  }
}
