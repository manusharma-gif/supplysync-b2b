import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { UserRole } from '../models/index.js';

export class AuthController {
  private authService: AuthService;
  private userRepository: UserRepository;

  constructor() {
    this.authService = new AuthService();
    this.userRepository = new UserRepository();
  }

  public register = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, name, role, company_name, companyName, state, gstin } = req.body;
      const result = await this.authService.register({
        email,
        password,
        name,
        role: role as UserRole,
        company_name: company_name || companyName,
        state: state || 'Punjab',
        gstin,
      });
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  public login = async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message });
    }
  };

  public quickSwitch = async (req: Request, res: Response): Promise<void> => {
    try {
      const { role } = req.params;
      const result = await this.authService.quickRoleSwitch(String(role));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  public getDemoUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const shippers = await this.userRepository.findByRole('SHIPPER');
      const carriers = await this.userRepository.findByRole('CARRIER');
      const brokers = await this.userRepository.findByRole('BROKER');

      res.json({
        shipper: shippers[0] || null,
        carrier: carriers[0] || null,
        broker: brokers[0] || null,
        allCarriers: carriers,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
