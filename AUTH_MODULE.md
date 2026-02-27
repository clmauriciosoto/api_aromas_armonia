# Authentication Module Documentation

## Overview

This is a production-ready authentication module for the NestJS ecommerce admin panel. It implements JWT-based authentication with bcrypt password hashing, supporting only ADMIN users. The module follows enterprise-level architecture patterns and best practices.

## Architecture

### Technology Stack
- **NestJS**: Framework for building scalable server-side applications
- **JWT (JSON Web Tokens)**: Stateless authentication mechanism
- **Passport.js**: Authentication middleware with JWT strategy
- **bcrypt**: Advanced password hashing algorithm
- **TypeORM**: Object-Relational Mapping for database persistence
- **class-validator**: DTO validation
- **ConfigModule**: Environment-based configuration management

### Module Structure

```
src/
├── auth/
│   ├── auth.module.ts           # Auth module configuration
│   ├── auth.service.ts          # Authentication business logic
│   ├── auth.controller.ts       # API endpoints
│   ├── jwt.strategy.ts          # JWT validation strategy
│   ├── dto/
│   │   └── login.dto.ts        # Login request DTO
│   ├── guards/
│   │   ├── jwt-auth.guard.ts   # JWT authentication guard
│   │   └── roles.guard.ts      # Role-based authorization guard
│   └── decorators/
│       └── roles.decorator.ts   # Role metadata decorator
│
└── users/
    ├── users.module.ts          # Users module
    ├── users.service.ts         # User management service
    └── entities/
        └── admin.entity.ts      # Admin database entity
```

## Admin Entity

### Fields

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | UUID | Primary Key, Auto-generated | Unique identifier |
| `email` | String(255) | Unique, Required | Admin email address |
| `password` | String(255) | Required | Bcrypt hashed password |
| `role` | Enum | Default: ADMIN | User role (currently only ADMIN) |
| `isActive` | Boolean | Default: true | Account activation status |
| `createdAt` | Timestamp | Auto-generated | Record creation time |
| `updatedAt` | Timestamp | Auto-generated | Last update time |

### Admin Role Enum

```typescript
enum AdminRole {
  ADMIN = 'admin'
}
```

## API Endpoints

### 1. Login

**Endpoint**: `POST /auth/login`

**Request Body**:
```json
{
  "email": "admin@aromas-armonia.com",
  "password": "SecureAdminPassword123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Responses**:
- `400 Bad Request`: Invalid email format or password too short
- `401 Unauthorized`: Invalid email or password, or admin account inactive
- `422 Unprocessable Entity`: DTO validation failed

**Validation Rules**:
- Email must be a valid email format
- Password must be at least 8 characters
- Admin account must be active
- Credentials must match a record in the database

### 2. Get Admin Profile

**Endpoint**: `GET /auth/profile`

**Headers**:
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "admin@aromas-armonia.com",
  "role": "admin"
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid JWT token
- `403 Forbidden`: User doesn't have ADMIN role

**Protection**: 
- Requires valid JWT token (JwtAuthGuard)
- Requires ADMIN role (RolesGuard)

### 3. Refresh Token Rotation

**Endpoint**: `POST /auth/refresh`

**Request Body**:
```json
{
  "refresh_token": "<refresh-token>"
}
```

**Response** (200 OK):
```json
{
  "access_token": "<new-access-token>",
  "refresh_token": "<new-refresh-token>"
}
```

**Security Behavior**:
- Verifies refresh JWT signature using `JWT_REFRESH_SECRET`
- Compares incoming token against stored bcrypt hash
- Rotates refresh token on every successful refresh
- Rejects reused/old refresh tokens with `401 Unauthorized`

## Authentication Flow

### Login Flow Diagram

```
User Input (email + password)
    ↓
POST /auth/login
    ↓
AuthController.login()
    ↓
AuthService.login(loginDto)
    ↓
1. Find admin by email
    ↓
2. Validate admin is active
    ↓
3. Compare password with bcrypt
    ↓
4. Generate access and refresh tokens
    ↓
Store hashed refresh token and return token pair
```

### Protected Route Flow Diagram

```
HTTP Request + Authorization: Bearer <token>
    ↓
JwtAuthGuard (validates token signature and expiration)
    ↓
JwtStrategy.validate() (extracts payload, verifies admin is active)
    ↓
RolesGuard (checks if admin has required role)
    ↓
@Roles(AdminRole.ADMIN) Decorator (defines required roles)
    ↓
Route Handler (receives request.user with admin data)
```

## Security Features

### Password Security
1. **Bcrypt Hashing**: Passwords are hashed with 10 salt rounds
2. **Never Stored**: Plain passwords are never stored or logged
3. **Bcrypt Validation**: Password comparison uses `bcrypt.compare()` for secure matching
4. **Strength Validation**: Passwords must be at least 8 characters

### JWT Security
1. **Environment-Based Secrets**: `JWT_SECRET` and `JWT_REFRESH_SECRET` loaded from environment variables
2. **No Hardcoded Secrets**: All secrets are externalized
3. **Configurable Token Lifetimes**: 
   - Access token lifetime via `JWT_EXPIRATION` (default: 1 hour)
   - Refresh token lifetime via `JWT_REFRESH_EXPIRATION` (default: 7 days)
4. **Payload Verification**: Token requests re-validate admin status
5. **Replay Protection**: Refresh token rotation and version checks prevent reuse

### Authorization
1. **JwtAuthGuard**: Verifies token validity
2. **RolesGuard**: Enforces role-based access control
3. **Active Admin Check**: Only active admins can use valid tokens

### Error Handling
1. **Generic Messages**: Login errors don't reveal whether email exists
2. **Exception Handling**: Proper exception types (UnauthorizedException, BadRequestException)
3. **Validation**: DTO validation prevents malformed requests

## Implementation Details

### Password Hashing (UsersService)

```typescript
// During admin creation
const hashedPassword = await bcrypt.hash(password, 10);
admin.password = hashedPassword;
await adminRepository.save(admin);
```

**Why 10 salt rounds?**
- Provides strong security while maintaining reasonable performance
- Recommended for most applications
- Takes ~100ms per hash operation (acceptable for login)

### JWT Payload Structure

```typescript
interface JwtPayload {
  sub: string;        // Admin ID (subject)
  email: string;      // Admin email
  role: AdminRole;    // Admin role
  iat: number;        // Issued at timestamp (auto-added by JWT)
  exp: number;        // Expiration timestamp (auto-added by JWT)
}
```

### Configuration

**auth.service.ts** - Token generation with separate expiration times:
```typescript
private async generateTokens(admin: Admin, tokenVersion: number) {
  const accessExpiration = this.configService.get<string>(
    'JWT_EXPIRATION',
    '1h'
  );
  const refreshExpiration = this.configService.get<string>(
    'JWT_REFRESH_EXPIRATION',
    '7d'
  );

  const [accessToken, refreshToken] = await Promise.all([
    this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiration,  // Configurable access token lifetime
    }),
    this.jwtService.signAsync(refreshPayload, {
      secret: refreshSecret,
      expiresIn: refreshExpiration, // Configurable refresh token lifetime
    }),
  ]);
  
  return { access_token: accessToken, refresh_token: refreshToken };
}
```

This ensures:
- Access and refresh tokens have independent, configurable lifetimes
- Secrets are not hardcoded
- Configuration is loaded from environment variables
- Defaults are sensible (1h access, 7d refresh)

## Environment Configuration

### Required Variables

```
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-min-32-chars
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=aromas_armonia_db

# Application Configuration
NODE_ENV=development
PORT=3000
```

**JWT Configuration Details:**

| Variable | Default | Description | Examples |
|----------|---------|-------------|----------|
| `JWT_SECRET` | *(required)* | Access token secret key (min 32 chars) | `your-random-secret-min-32-chars` |
| `JWT_REFRESH_SECRET` | *(required)* | Refresh token secret key (min 32 chars) | `your-random-secret-min-32-chars` |
| `JWT_EXPIRATION` | `1h` | **Access token** lifetime | `15m`, `1h`, `4h`, `8h` |
| `JWT_REFRESH_EXPIRATION` | `7d` | **Refresh token** lifetime | `7d`, `14d`, `30d`, `90d` |

### Security Notes for Production

1. **JWT_SECRET / JWT_REFRESH_SECRET**: Must be different, random, and at least 32 characters
2. **NODE_ENV**: Set to `production` in production
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS appropriately for your frontend domain
5. **Rate Limiting**: Implement rate limiting on `/auth/login` endpoint
6. **Token in Cookies**: Consider storing tokens in HTTP-only cookies instead of headers

## Usage Examples

### Creating an Admin User

#### Via Seed Script

```bash
# Copy the seed script and run it
cp src/seeds/admin.seed.ts .
npx ts-node admin.seed.ts
```

#### Programmatically

```typescript
import { UsersService } from './users/users.service';

constructor(private usersService: UsersService) {}

async createAdminUser() {
  const admin = await this.usersService.createAdmin(
    'admin@aromas-armonia.com',
    'SecureAdminPassword123!'
  );
  console.log('Admin created:', admin);
}
```

### Testing Login Endpoint

#### cURL

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@aromas-armonia.com",
    "password": "SecureAdminPassword123!"
  }'
```

#### JavaScript/Fetch

```typescript
const response = await fetch('http://localhost:3000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@aromas-armonia.com',
    password: 'SecureAdminPassword123!'
  })
});

const data = await response.json();
const accessToken = data.access_token;
```

### Using the Access Token

#### cURL

```bash
curl -X GET http://localhost:3000/auth/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json"
```

#### JavaScript/Fetch

```typescript
const response = await fetch('http://localhost:3000/auth/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  }
});

const profile = await response.json();
console.log('Admin profile:', profile);
```

### Protecting Routes with AuthGuard

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { Roles } from './auth/decorators/roles.decorator';
import { AdminRole } from './users/entities/admin.entity';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
  @Get('dashboard')
  @Roles(AdminRole.ADMIN)
  getDashboard(@Request() req) {
    // Only authenticated admins can access this
    console.log('Admin:', req.user);
  }
}
```

## Error Handling

### Common Error Scenarios

| Scenario | Status | Message | Reason |
|----------|--------|---------|--------|
| Valid login | 200 | Token returned | Success |
| Wrong password | 401 | "Invalid email or password" | Failed bcrypt comparison |
| Non-existent email | 401 | "Invalid email or password" | Admin not found |
| Inactive admin | 401 | "This admin account is not active" | isActive = false |
| Invalid token | 401 | "Unauthorized" | Token expired or tampered |
| Missing token | 401 | "Unauthorized" | No Authorization header |
| Wrong role | 403 | "User with role ... is not authorized" | Missing ADMIN role |

### Exception Handling Strategy

```typescript
try {
  // Authentication logic
} catch (error) {
  if (error instanceof UnauthorizedException) {
    throw error; // Re-throw auth errors
  }
  throw new InternalServerErrorException('Error during login');
}
```

This ensures:
- Expected security errors are properly thrown
- Unexpected errors are logged but don't leak details
- All errors follow NestJS exception format

## Testing

### Unit Testing Example

```typescript
describe('AuthService', () => {
  it('should login with valid credentials', async () => {
    const loginDto = {
      email: 'admin@test.com',
      password: 'password123'
    };

    const result = await authService.login(loginDto);

    expect(result).toHaveProperty('access_token');
    expect(result).toHaveProperty('refresh_token');
  });

  it('should throw UnauthorizedException for invalid password', async () => {
    const loginDto = {
      email: 'admin@test.com',
      password: 'wrongpassword'
    };

    expect(() => authService.login(loginDto)).rejects.toThrow(
      UnauthorizedException
    );
  });
});
```

### Integration Testing Example

```typescript
describe('Auth (e2e)', () => {
  it('/auth/login (POST) - should return access token', () => {
    return request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password123'
      })
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('access_token');
      });
  });

  it('/auth/profile (GET) - should return admin profile', () => {
    const token = generateValidToken();
    
    return request(app.getHttpServer())
      .get('/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('email');
        expect(res.body.role).toBe('admin');
      });
  });
});
```

## Future Enhancements

### Refresh Token Implementation

Refresh token mechanism is implemented with rotation and replay protection:

1. **Generate Refresh Token**: Separate token signed with `JWT_REFRESH_SECRET` (7 days)
2. **Store Hash Only**: Persist only bcrypt hash in `admins.refreshToken`
3. **Rotate per Use**: Refreshing issues new refresh token and invalidates previous one
4. **Atomic Version Check**: `refreshTokenVersion` prevents concurrent replay races

### Additional Enhancements

1. **Two-Factor Authentication**: Add OTP/2FA support
2. **Account Lockout**: Lock account after failed login attempts
3. **Audit Logging**: Log all authentication events
4. **API Key Authentication**: Support API key-based authentication for integrations
5. **OAuth Integration**: Support OAuth 2.0 providers
6. **Session Management**: Track active sessions and allow logout
7. **Password Reset**: Implement secure password reset flow

## Troubleshooting

### Common Issues

**Issue**: `401 Unauthorized` on `/auth/profile`

**Solutions**:
1. Check token is valid: `jwt.io`
2. Verify header format: `Authorization: Bearer <token>`
3. Ensure JWT_SECRET and JWT_REFRESH_SECRET are configured and different
4. Check token expiration (valid for 1 hour)

**Issue**: `Invalid email or password` on login

**Solutions**:
1. Verify admin exists: Check database directly
2. Verify admin is active: Check `isActive` field
3. Verify email is correct: Case-sensitive check
4. Check password: Ensure correct password is used

**Issue**: `JwtModule not found`

**Solutions**:
1. Install dependencies: `npm install @nestjs/jwt passport-jwt @types/passport-jwt`
2. Import AuthModule in AppModule
3. Verify JWT_SECRET and JWT_REFRESH_SECRET environment variables are set

### Performance Considerations

- **Bcrypt Hashing**: ~100ms per hash (acceptable for login)
- **Token Validation**: <1ms per request (minimal overhead)
- **Database Queries**: Use database indexing on email field
- **Caching**: Consider caching admin roles if needed

## Best Practices Applied

✅ **Security**
- No plaintext passwords
- Bcrypt hashing with salt rounds
- JWT expiration
- Environment-based secrets

✅ **Architecture**
- Modular structure
- Separation of concerns
- Guard-based authorization
- Decorator-based metadata

✅ **Code Quality**
- Strong typing (TypeScript)
- Exception handling
- DTO validation
- Clean code principles

✅ **Production Readiness**
- Scalable module design
- Proper configuration management
- Error logging
- Prepared for enhancements

## Support & Questions

For issues or questions regarding this authentication module, refer to:
- NestJS Documentation: https://docs.nestjs.com
- Passport.js Documentation: https://www.passportjs.org
- JWT Documentation: https://jwt.io
- TypeORM Documentation: https://typeorm.io
