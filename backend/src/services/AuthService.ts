import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository.js';
import { User, UserCreationAttributes, UserRole } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'supplysync_b2b_secret_key_2026';

export interface AuthTokens {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    company_name: string;
    state?: string;
    gstin?: string;
    reliability_score: number;
  };
}

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  public async register(
    data: Omit<UserCreationAttributes, 'password_hash'> & { password: string }
  ): Promise<AuthTokens> {
    const existing = await this.userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('User already exists with this email');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(data.password, salt);

    const user = await this.userRepository.create({
      ...data,
      password_hash,
    });

    return this.generateAuthResponse(user);
  }

  public async login(email: string, password: string): Promise<AuthTokens> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    return this.generateAuthResponse(user);
  }

  public async quickRoleSwitch(roleStr: string): Promise<AuthTokens> {
    const roleUpper = (roleStr || '').toUpperCase();

    // 1. Specific demo account lookups for 1-click persona switching
    if (roleUpper === 'CARRIER_A') {
      const carrierA = await this.userRepository.findByEmail('carrier1@supplysync.com');
      if (carrierA) return this.generateAuthResponse(carrierA);
    } else if (roleUpper === 'CARRIER_B') {
      const carrierB = await this.userRepository.findByEmail('carrier2@supplysync.com');
      if (carrierB) return this.generateAuthResponse(carrierB);
    } else if (roleUpper === 'SHIPPER') {
      const shipper = await this.userRepository.findByEmail('shipper@supplysync.com');
      if (shipper) return this.generateAuthResponse(shipper);
    } else if (roleUpper === 'BROKER') {
      const broker = await this.userRepository.findByEmail('broker@supplysync.com');
      if (broker) return this.generateAuthResponse(broker);
    }

    // 2. Generic fallback by role
    const role =
      roleUpper === 'CARRIER_A' || roleUpper === 'CARRIER_B'
        ? 'CARRIER'
        : (roleUpper as UserRole);

    const users = await this.userRepository.findByRole(role);
    if (users.length === 0) {
      throw new Error(`No user found for role ${roleStr}`);
    }
    return this.generateAuthResponse(users[0]);
  }

  public generateToken(user: User): string {
    const u: any = (user as any).get ? (user as any).get({ plain: true }) : user;
    return jwt.sign(
      {
        id: u.id,
        email: u.email,
        role: u.role,
        name: u.name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
  }

  public verifyToken(token: string): any {
    return jwt.verify(token, JWT_SECRET);
  }

  private generateAuthResponse(user: User): AuthTokens {
    const u: any = (user as any).get ? (user as any).get({ plain: true }) : user;
    const token = this.generateToken(user);
    return {
      token,
      user: {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        company_name: u.company_name,
        state: u.state,
        gstin: u.gstin,
        reliability_score: u.reliability_score,
      },
    };
  }
}
