# NestJS Authentication Module - Complete Implementation Guide

## 📋 Module Overview

A production-ready JWT-based authentication module for NestJS with support for ADMIN users only. This module implements email/password login, role-based access control, and secure password hashing with bcrypt.

### ✨ Key Features

- ✅ JWT-based stateless authentication
- ✅ Email + password login
- ✅ Bcrypt password hashing with 10 salt rounds
- ✅ Role-based access control (ADMIN only)
- ✅ Environment-based JWT secrets (no hardcoding)
- ✅ Configurable access token expiration via JWT_EXPIRATION
- ✅ Configurable refresh token expiration via JWT_REFRESH_EXPIRATION
- ✅ Guard-based route protection
- ✅ Decorator-based role validation
- ✅ Comprehensive error handling
- ✅ Admin status verification
- ✅ Separate, configurable token lifetimes
- ✅ Scalable modular architecture
- ✅ TypeORM integration
- ✅ DTO validation
- ✅ Refresh token rotation (anti-replay)

---

## 📁 Complete File Structure

```
src/
├── auth/
│   ├── auth.module.ts              ✅ Auth module configuration
│   ├── auth.service.ts             ✅ Authentication business logic
│   ├── auth.controller.ts          ✅ API endpoints
│   ├── jwt.strategy.ts             ✅ JWT validation strategy
│   ├── dto/
│   │   └── login.dto.ts            ✅ Login request validation
│   ├── guards/
│   │   ├── jwt-auth.guard.ts       ✅ JWT authentication guard
│   │   └── roles.guard.ts          ✅ Role-based authorization
│   └── decorators/
│       └── roles.decorator.ts      ✅ Role metadata decorator
│
├── users/
│   ├── users.module.ts             ✅ Users module
│   ├── users.service.ts            ✅ User management
│   └── entities/
│       └── admin.entity.ts         ✅ Admin database entity
│
├── app.module.ts                   ✅ Updated with auth imports
├── main.ts
├── seeds/
│   └── admin.seed.ts               ✅ Admin creation script
│
├── .env.example                    ✅ Environment template
├── AUTH_MODULE.md                  ✅ Complete documentation
├── SETUP_AUTH.md                   ✅ Installation guide
├── README.md                        ✅ Quick reference
│
└── scripts/
    ├── test-auth-api.sh            ✅ API testing script
    └── setup-auth.sh               ✅ Automated setup
```

---

## 🚀 Quick Start (5 minutes)

### 1. Install Dependencies

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt @types/bcrypt
```

Or use the automated script:

```bash
bash scripts/setup-auth.sh
```

### 2. Configure Environment

```bash
cp .env.example .env

# Edit .env and set:
# JWT_SECRET=your-super-secret-key-min-32-characters
# DATABASE_HOST=localhost
# DATABASE_USER=postgres
# DATABASE_PASSWORD=postgres
# DATABASE_NAME=aromas_armonia_db
```

### 3. Start Application

```bash
npm run start:dev
```

### 4. Create Admin User

```bash
npx ts-node src/seeds/admin.seed.ts
```

### 5. Test Authentication

```bash
bash scripts/test-auth-api.sh
```

---

## 🔐 Authentication Endpoints

### Login Endpoint
**POST** `/auth/login`

Request:
```json
{
  "email": "admin@aromas-armonia.com",
  "password": "SecureAdminPassword123!"
}
```

Response:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Refresh Endpoint
**POST** `/auth/refresh`

Request:
```json
{
  "refresh_token": "<refresh-token>"
}
```

Response:
```json
{
  "access_token": "<new-access-token>",
  "refresh_token": "<new-refresh-token>"
}
```

### Get Profile Endpoint
**GET** `/auth/profile`

Header:
```
Authorization: Bearer <access_token>
```

Response:
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@aromas-armonia.com",
  "role": "admin"
}
```

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| [SETUP_AUTH.md](./SETUP_AUTH.md) | Installation & configuration guide |
| [AUTH_MODULE.md](./AUTH_MODULE.md) | Complete technical documentation |
| [.env.example](./.env.example) | Environment variable template |
| [scripts/test-auth-api.sh](./scripts/test-auth-api.sh) | API testing examples |
| [src/seeds/admin.seed.ts](./src/seeds/admin.seed.ts) | Admin user creation script |

---

## 🛡️ Security Features

### Password Security
- Bcrypt hashing with 10 salt rounds
- Passwords never stored in plain text
- Passwords never logged
- Secure comparison using `bcrypt.compare()`

### JWT Security
- Secrets from environment variables (no hardcoding)
- Configurable access token lifetime via `JWT_EXPIRATION` (default: 1 hour)
- Configurable refresh token lifetime via `JWT_REFRESH_EXPIRATION` (default: 7 days)
- Payload verification on each request
- Token re-validation checks admin active status

### Authorization
- JwtAuthGuard validates token
- RolesGuard enforces admin role
- Active admin verification
- Generic error messages (don't reveal email existence)

---

## 💻 Code Examples

### Using Authentication in Routes

```typescript
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { AdminRole } from './users/entities/admin.entity';

@Controller('admin')
export class AdminController {
  // Protected route - requires JWT
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  getDashboard(@Request() req) {
    console.log('Admin:', req.user);
    return { message: 'Welcome to admin dashboard' };
  }

  // Protected route - requires JWT and ADMIN role
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.ADMIN)
  getUsers(@Request() req) {
    return { message: 'Admin users list' };
  }
}
```

### Creating Admin Programmatically

```typescript
import { UsersService } from './users/users.service';

@Injectable()
export class OnboardingService {
  constructor(private usersService: UsersService) {}

  async setupFirstAdmin() {
    try {
      const admin = await this.usersService.createAdmin(
        'admin@company.com',
        'SecurePassword123!'
      );
      console.log('Admin created:', admin.email);
    } catch (error) {
      console.error('Failed to create admin:', error.message);
    }
  }
}
```

### Testing Login

**Using cURL:**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aromas-armonia.com",
    "password": "SecureAdminPassword123!"
  }'
```

**Using Node.js/Fetch:**
```typescript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@aromas-armonia.com',
    password: 'SecureAdminPassword123!'
  })
});

const { access_token } = await response.json();

// Use token for subsequent requests
const profileResponse = await fetch('http://localhost:3000/auth/profile', {
  headers: { Authorization: `Bearer ${access_token}` }
});
```

---

## 🔧 Configuration Details

### JWT Configuration

```typescript
// In auth.module.ts
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '1h' },
  }),
})
```

**JWT Payload:**
```typescript
{
  sub: string;        // Admin ID
  email: string;      // Admin email
  role: AdminRole;    // Admin role
  iat: number;        // Issued at (auto)
  exp: number;        // Expires at (auto)
}
```

### Environment Variables

```bash
# Required for JWT
JWT_SECRET=your-32-character-minimum-secret-key

# Database connection
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=aromas_armonia_db

# Application
NODE_ENV=development
PORT=3000
```

---

## 🧪 Testing Guide

### Unit Tests Example

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return access token for valid credentials', async () => {
      const loginDto = { email: 'admin@test.com', password: 'password123' };
      const result = await authService.login(loginDto);
      
      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      const loginDto = { email: 'admin@test.com', password: 'wrong' };
      
      await expect(authService.login(loginDto))
        .rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Integration Tests Example

```typescript
describe('Auth E2E', () => {
  it('POST /auth/login - should return token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('access_token');
  });

  it('GET /auth/profile - should require token', async () => {
    const response = await request(app.getHttpServer())
      .get('/auth/profile');

    expect(response.status).toBe(401);
  });
});
```

---

## 🚨 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `Cannot find module '@nestjs/jwt'` | Run `npm install @nestjs/jwt` |
| `403 Forbidden` on /auth/profile | Ensure token has ADMIN role |
| `401 Unauthorized` - invalid token | Token expired or tampered |
| `Invalid email or password` | Check email exists and password matches |
| Bcrypt hash mismatch | Ensure same salt rounds used (10) |
| JWT_SECRET undefined | Add to .env file |
| Database table not created | Check TypeORM autoLoadEntities and synchronize |

---

## 📈 Future Enhancements

The module structure is designed to support:

1. **Refresh Token Flow** - Implemented with rotation and replay protection
  - Separate refresh token with 7-day expiration (`JWT_REFRESH_SECRET`)
  - Hashed refresh token persisted in database
  - Rotation on each `/auth/refresh` request

2. **Additional Features**
   - Two-factor authentication (2FA/OTP)
   - Account lockout after failed attempts
   - Audit logging for authentication events
   - API key authentication
   - OAuth 2.0 integration
   - Password reset flow
   - Session management

3. **Enhancements**
   - Rate limiting on login endpoint
   - Email verification
   - Activity logging
   - Admin user management endpoints
   - Role hierarchy system

---

## 📖 Additional Resources

- [NestJS Authentication Docs](https://docs.nestjs.com/techniques/authentication)
- [Passport.js Documentation](https://www.passportjs.org)
- [JWT Introduction](https://jwt.io/introduction)
- [Bcrypt Wikipedia](https://en.wikipedia.org/wiki/Bcrypt)
- [TypeORM Entities](https://typeorm.io/entities)

---

## ✅ Verification Checklist

- [ ] Dependencies installed (`npm list @nestjs/jwt`)
- [ ] .env file configured with JWT_SECRET
- [ ] Database running and accessible
- [ ] Application starts without errors (`npm run start:dev`)
- [ ] Admin user created (`npx ts-node src/seeds/admin.seed.ts`)
- [ ] Login endpoint returns token
- [ ] Profile endpoint accessible with token
- [ ] Invalid credentials return 401
- [ ] Invalid token returns 401
- [ ] Missing authorization header returns 401

---

## 🔒 Production Checklist

- [ ] JWT_SECRET is strong (32+ characters)
- [ ] NODE_ENV set to 'production'
- [ ] HTTPS enabled (never HTTP)
- [ ] CORS configured for specific domains
- [ ] Rate limiting on /auth/login
- [ ] Audit logging enabled
- [ ] Error logging configured
- [ ] Database SSL enabled
- [ ] Secrets in environment variables only
- [ ] Account lockout implemented
- [ ] 2FA or MFA enabled
- [ ] Regular security updates

---

## 📞 Support

For detailed information:
1. Review [AUTH_MODULE.md](./AUTH_MODULE.md) for complete documentation
2. Check [SETUP_AUTH.md](./SETUP_AUTH.md) for installation help
3. Run test script: `bash scripts/test-auth-api.sh`
4. Check logs: `npm run start:dev`

---

## 📄 License

This authentication module is part of the Aromas Armonia ecommerce API and follows the project's license terms.

**Last Updated**: February 2026

---

Made with ❤️ for production-ready NestJS applications
