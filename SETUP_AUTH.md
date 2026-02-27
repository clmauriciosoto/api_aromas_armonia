# Authentication Module - Setup Guide

## Prerequisites

Before using the authentication module, ensure you have the following dependencies installed.

## Required Dependencies

### Install All Authentication Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt @types/bcrypt
```

### Individual Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/jwt` | `^11.0.0` | JWT module for NestJS |
| `@nestjs/passport` | `^11.0.0` | Passport integration for NestJS |
| `passport` | `^0.7.0` | Authentication middleware |
| `passport-jwt` | `^4.0.0` | JWT strategy for Passport |
| `@types/passport-jwt` | `^3.0.0` | TypeScript types for passport-jwt |
| `bcrypt` | `^5.1.0` | Password hashing library |
| `@types/bcrypt` | `^5.0.0` | TypeScript types for bcrypt |

## Installation Steps

### 1. Install Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt @types/bcrypt
```

### 2. Configure Environment Variables

Create a `.env` file in the root of your project:

```bash
cp .env.example .env
```

Edit `.env` and set the required variables:

```
# JWT Configuration - Change this to a random string in production (min 32 chars)
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=aromas_armonia_db

# Application
NODE_ENV=development
PORT=3000
```

### 3. Generate JWT Secret

For production, generate a strong JWT secret:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Start the Application

```bash
npm run start:dev
```

### 5. Create the First Admin User

#### Option A: Using the Seed Script

```bash
npx ts-node src/seeds/admin.seed.ts
```

#### Option B: Using the Database

```sql
INSERT INTO admins (id, email, password, role, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'admin@aromas-armonia.com',
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  'admin',
  true,
  NOW(),
  NOW()
);
```

To generate a bcrypt hash, use Node.js:

```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('YourPassword123!', 10).then(hash => console.log(hash));"
```

### 6. Test Authentication

Make sure your server is running, then run the test script:

```bash
# Make the script executable
chmod +x scripts/test-auth-api.sh

# Run the test script
bash scripts/test-auth-api.sh
```

Or test manually:

```bash
# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aromas-armonia.com",
    "password": "YourPassword123!"
  }'

# Get access token from response, then:
# Access protected route
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json"
```

## Update package.json Scripts

### Optional: Add seed script to package.json

Add this to your `package.json` scripts:

```json
{
  "scripts": {
    "seed:admin": "ts-node src/seeds/admin.seed.ts",
    "test:auth": "bash scripts/test-auth-api.sh"
  }
}
```

Then run:

```bash
npm run seed:admin
npm run test:auth
```

## Verify Installation

### Check if dependencies are installed

```bash
npm list @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
```

### Test JWT functionality

```bash
node -e "
const jwt = require('@nestjs/jwt');
const bcrypt = require('bcrypt');
console.log('✅ @nestjs/jwt:', typeof jwt);
console.log('✅ bcrypt:', typeof bcrypt);
"
```

## Troubleshooting

### Error: Cannot find module '@nestjs/jwt'

**Solution**: Run `npm install @nestjs/jwt`

### Error: Cannot find module 'jsonwebtoken'

**Solution**: `passport-jwt` requires `jsonwebtoken`. Install it:
```bash
npm install jsonwebtoken @types/jsonwebtoken
```

### Error: 'bcrypt' not found

**Solution**: Run `npm install bcrypt @types/bcrypt`

### Port Already in Use

**Solution**: Change the port in `.env`:
```
PORT=3001
```

### Database Connection Error

**Solution**: Verify database credentials in `.env`:
```bash
# Test PostgreSQL connection
psql -h localhost -U postgres -d aromas_armonia_db
```

### seed:admin Script Error

**Solution**: Ensure dependencies are installed and database is running:
```bash
npm install
npm run start:dev
# In another terminal:
npm run seed:admin
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure environment variables
3. ✅ Start the application
4. ✅ Create admin user
5. ✅ Test authentication
6. 📖 Read [AUTH_MODULE.md](./AUTH_MODULE.md) for detailed documentation
7. 🛡️ Implement rate limiting on `/auth/login`
8. 🔐 Set strong JWT_SECRET in production
9. 📝 Add admin user management endpoints
10. ✅ Validate refresh token rotation and replay protection in your staging env

## Security Checklist for Production

- [ ] Change JWT_SECRET to a strong random value
- [ ] Change JWT_REFRESH_SECRET to a different strong random value
- [ ] Use HTTPS only (not HTTP)
- [ ] Set NODE_ENV=production
- [ ] Enable CORS with specific domains
- [ ] Add rate limiting to login endpoint
- [ ] Implement token refresh mechanism
- [ ] Set up audit logging
- [ ] Enable database SSL connections
- [ ] Use environment variables for all secrets
- [ ] Implement account lockout after failed attempts
- [ ] Set secure cookie flags if using cookies for tokens
- [ ] Add two-factor authentication
- [ ] Implement proper error logging

## Support

For detailed information about the authentication module, see:
- [AUTH_MODULE.md](./AUTH_MODULE.md) - Complete documentation
- [.env.example](./.env.example) - Example environment configuration
- [scripts/test-auth-api.sh](./scripts/test-auth-api.sh) - API testing script
- [src/seeds/admin.seed.ts](./src/seeds/admin.seed.ts) - Admin seed script

## Additional Resources

- [NestJS Documentation](https://docs.nestjs.com)
- [Passport.js Authentication](https://www.passportjs.org)
- [JWT Introduction](https://jwt.io/introduction)
- [Bcrypt Hash Algorithm](https://en.wikipedia.org/wiki/Bcrypt)
- [TypeORM Entity Relations](https://typeorm.io)
