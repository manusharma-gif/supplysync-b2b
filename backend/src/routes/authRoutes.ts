import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/quick-switch/:role', authController.quickSwitch);
router.get('/demo-users', authController.getDemoUsers);

export default router;
