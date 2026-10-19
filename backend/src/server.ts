import { app } from './app.js';
import { sequelize } from './config/database.js';
import { SeedService } from './services/SeedService.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('=======================================================');
    console.log('🚀 Initializing SupplySync B2B Enterprise Engine...');
    console.log('=======================================================');
    console.log('1. Connecting to SQLite database...');
    await sequelize.authenticate();
    console.log('   Database connected.');

    console.log('2. Running automatic database schema migrations (DDL)...');
    await sequelize.sync();
    console.log('   Database schema synchronized.');

    console.log('3. Checking and executing auto-seed sequence...');
    const seedService = new SeedService();
    await seedService.seedAll();

    app.listen(PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 SupplySync B2B Cloud Server running on Port ${PORT}`);
      console.log(`🌐 Web Portal & API Active: http://localhost:${PORT}`);
      console.log(`📌 Indian Freight Standards Active (12% GTA GST & Paise Math)`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
