import { NestFactory } from '@nestjs/core';
import { AppModule } from 'src/app.module';
import { UsersService } from 'src/users/users.service';

/**
 * ADMIN SEED SCRIPT
 * 
 * This script creates an initial admin user for the system.
 * Run this after the application is fully configured with the database.
 * 
 * Usage:
 *   npx ts-node src/seeds/admin.seed.ts
 * 
 * Or add to package.json:
 *   "seed:admin": "ts-node src/seeds/admin.seed.ts"
 */
async function seedAdmin() {
  const app = await NestFactory.create(AppModule);
  const usersService = app.get(UsersService);

  try {
    // Change these credentials for your deployment
    const email = 'admin@aromas-armonia.com';
    const password = 'SecureAdminPassword123!'; // Change this in production

    console.log('🌱 Starting admin user seeding...');
    console.log(`📧 Email: ${email}`);

    const admin = await usersService.createAdmin(email, password);

    console.log('✅ Admin user created successfully!');
    console.log('Admin details:', {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      createdAt: admin.createdAt,
    });

    console.log('\n📝 You can now login with:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  Make sure to change the password in production!');

    await app.close();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('❌ Error seeding admin user:', errorMessage);
    await app.close();
    process.exit(1);
  }
}

void seedAdmin();
