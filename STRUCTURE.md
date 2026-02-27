```
📦 AUTHENTICATION MODULE - COMPLETE FILE STRUCTURE
═══════════════════════════════════════════════════════════════════════════

PROJECT ROOT
│
├── 📄 .env.example
│   └─ Environment configuration template
│
├── 📄 QUICK_START.md ⭐ START HERE
│   └─ Fast track setup (3 steps)
│
├── 📄 SETUP_AUTH.md
│   └─ Detailed installation & troubleshooting
│
├── 📄 AUTH_MODULE.md
│   └─ Complete technical documentation
│
├── 📄 AUTH_README.md
│   └─ Overview & getting started
│
├── 📄 FILES_SUMMARY.md
│   └─ File inventory & statistics
│
├── 🗂️ src/
│   │
│   ├── 📄 app.module.ts ✅ UPDATED
│   │   └─ Now imports AuthModule & UsersModule
│   │
│   ├── 🗂️ auth/ 🔐 AUTHENTICATION MODULE
│   │   │
│   │   ├── 📄 auth.module.ts
│   │   │   └─ Module configuration with JWT & Passport
│   │   │      - JwtModule.registerAsync()
│   │   │      - PassportModule.register()
│   │   │      - Exports: AuthService, JwtAuthGuard, RolesGuard
│   │   │
│   │   ├── 📄 auth.service.ts
│   │   │   └─ Authentication business logic
│   │   │      - login(loginDto) → { access_token, refresh_token }
│   │   │      - generateTokens(admin, tokenVersion) → JWT pair
│   │   │      - getProfile(admin) → Admin profile
│   │   │      - refreshTokens(refreshToken) → Rotation with anti-replay
│   │   │
│   │   ├── 📄 auth.controller.ts
│   │   │   └─ API endpoints
│   │   │      - POST   /auth/login      (public)
│   │   │      - GET    /auth/profile    (protected)
│   │   │      - POST   /auth/refresh    (rotation enabled)
│   │   │
│   │   ├── 📄 jwt.strategy.ts
│   │   │   └─ Passport JWT strategy
│   │   │      - Validates JWT tokens
│   │   │      - Extracts payload
│   │   │      - Verifies admin is active
│   │   │      - Throws UnauthorizedException if invalid
│   │   │
│   │   ├── 🗂️ guards/
│   │   │   ├── 📄 jwt-auth.guard.ts
│   │   │   │   └─ Extends AuthGuard('jwt')
│   │   │   │      - Protects routes with token validation
│   │   │   │      - Returns: request.user = { id, email, role }
│   │   │   │
│   │   │   └── 📄 roles.guard.ts
│   │   │       └─ Role-based authorization
│   │   │          - Reads @Roles() metadata
│   │   │          - Enforces role matching
│   │   │          - Throws ForbiddenException if no match
│   │   │
│   │   ├── 🗂️ decorators/
│   │   │   └── 📄 roles.decorator.ts
│   │   │       └─ @Roles(AdminRole.ADMIN)
│   │   │          - Sets metadata for role checking
│   │   │          - Used with RolesGuard
│   │   │
│   │   └── 🗂️ dto/
│   │       └── 📄 login.dto.ts
│   │           └─ Login request validation
│   │              - @IsEmail()
│   │              - @MinLength(8)
│   │              - Custom error messages
│   │
│   ├── 🗂️ users/ 👥 USERS MODULE
│   │   │
│   │   ├── 📄 users.module.ts
│   │   │   └─ Module configuration
│   │   │      - Imports: TypeOrmModule.forFeature([Admin])
│   │   │      - Exports: UsersService
│   │   │
│   │   ├── 📄 users.service.ts
│   │   │   └─ User management
│   │   │      - createAdmin(email, password)
│   │   │      - findByEmail(email)
│   │   │      - findById(id)
│   │   │      - validatePassword(plain, hashed)
│   │   │      - isAdminActive(admin)
│   │   │
│   │   └── 🗂️ entities/
│   │       └── 📄 admin.entity.ts
│   │           └─ Admin database entity
│   │              - id: UUID (PrimaryGeneratedColumn)
│   │              - email: string (unique)
│   │              - password: string (hashed)
│   │              - role: AdminRole enum
│   │              - refreshToken: string | null (hashed, nullable)
│   │              - refreshTokenVersion: number (rotation version)
│   │              - isActive: boolean (default: true)
│   │              - createdAt: Date (auto)
│   │              - updatedAt: Date (auto)
│   │
│   ├── 🗂️ seeds/
│   │   └── 📄 admin.seed.ts
│   │       └─ Create initial admin user
│   │          - Email: admin@aromas-armonia.com
│   │          - Password: SecureAdminPassword123! (change in prod)
│   │          - Usage: npx ts-node src/seeds/admin.seed.ts
│   │
│   └── [other modules...]
│
├── 🗂️ scripts/
│   ├── 📄 setup-auth.sh
│   │   └─ Automated setup script
│   │      - Installs dependencies
│   │      - Creates .env file
│   │      - Displays next steps
│   │
│   └── 📄 test-auth-api.sh
│       └─ API testing with cURL
│          - Login test
│          - Profile access test
│          - Invalid credentials test
│          - Missing token test
│          - Invalid token test
│
└── [other files...]

═══════════════════════════════════════════════════════════════════════════

DEPENDENCY GRAPH
════════════════

app.module.ts
  ├── AuthModule
  │   ├── JwtModule (with ConfigService)
  │   ├── PassportModule
  │   ├── AuthService
  │   ├── AuthController
  │   ├── JwtStrategy
  │   ├── JwtAuthGuard
  │   ├── RolesGuard
  │   └── UsersModule
  │       ├── UsersService
  │       └── Admin Entity
  │
  ├── ConfigModule (global)
  │
  └── TypeOrmModule
      └── Admin Entity

═══════════════════════════════════════════════════════════════════════════

AUTHENTICATION FLOW
═══════════════════

LOGIN ENDPOINT [POST /auth/login]
  1. Request arrives with email & password
  2. LoginDto validation (class-validator)
  3. AuthController.login()
  4. AuthService.login()
     - Find admin by email (UsersService)
     - Check admin is active
     - Compare password with bcrypt
    - Generate and persist refresh session
    - Return { access_token, refresh_token }

PROTECTED ROUTE [GET /auth/profile]
  1. Request arrives with Authorization: Bearer <token>
  2. JwtAuthGuard extracts & validates token
  3. JwtStrategy validates payload & admin status
  4. RolesGuard checks @Roles() metadata
  5. request.user = { id, email, role }
  6. Route handler executes
  7. Response returned

═══════════════════════════════════════════════════════════════════════════

KEY TECHNOLOGY STACK
════════════════════

Framework:     NestJS 11
Database ORM:  TypeORM
Password Hash: bcrypt (10 salt rounds)
JWT Provider:  @nestjs/jwt
Auth Strategy: Passport with JWT
Config:        @nestjs/config
Validation:    class-validator

NPM PACKAGES TO INSTALL:
  @nestjs/jwt
  @nestjs/passport
  passport
  passport-jwt
  @types/passport-jwt
  bcrypt
  @types/bcrypt

═══════════════════════════════════════════════════════════════════════════

ENVIRONMENT VARIABLES
═════════════════════

REQUIRED:
  JWT_SECRET                 # Min 32 chars for production
  JWT_REFRESH_SECRET         # Different secret, min 32 chars
  DATABASE_HOST              # Postgres host
  DATABASE_PORT              # Postgres port (5432)
  DATABASE_USER              # Postgres user
  DATABASE_PASSWORD          # Postgres password
  DATABASE_NAME              # Database name

OPTIONAL:
  NODE_ENV                   # development/production
  PORT                       # Application port (3000)

═══════════════════════════════════════════════════════════════════════════

API ENDPOINTS
═════════════════════

PUBLIC ENDPOINTS:
  POST /auth/login
    Request:  { email, password }
    Response: { access_token, refresh_token }
    Status:   200 OK / 401 Unauthorized / 400 Bad Request

PROTECTED ENDPOINTS:
  GET /auth/profile
    Headers:  Authorization: Bearer <token>
    Response: { id, email, role }
    Status:   200 OK / 401 Unauthorized / 403 Forbidden

TOKEN ROTATION ENDPOINTS:
  POST /auth/refresh
    Request:  { refresh_token }
    Response: { access_token, refresh_token }
    Status:   Status: 200 OK / 401 Unauthorized

═══════════════════════════════════════════════════════════════════════════

SECURITY FEATURES
═════════════════════

✅ Password Security
   - Bcrypt hashing (10 salt rounds)
   - No plain passwords stored
   - Secure comparison using bcrypt.compare()

✅ Token Security
   - JWT with cryptographic signature
  - Access token: 1-hour expiration
  - Refresh token: 7-day expiration
  - Environment-based secrets (no hardcoding)
  - Refresh token rotation + replay protection

✅ Authorization
   - Guard-based route protection
   - Role-based access control
   - Decorator-based metadata
   - Active admin verification

✅ Input Validation
   - DTO validation with class-validator
   - Email format checking
   - Password strength requirements

✅ Error Handling
   - Generic error messages (no email enumeration)
   - Proper exception types
   - Comprehensive logging

═══════════════════════════════════════════════════════════════════════════

QUICK START COMMANDS
════════════════════

Install Dependencies:
  npm install @nestjs/jwt @nestjs/passport passport passport-jwt @types/passport-jwt bcrypt @types/bcrypt

Setup Environment:
  cp .env.example .env

Start Application:
  npm run start:dev

Create Admin User:
  npx ts-node src/seeds/admin.seed.ts

Test API:
  bash scripts/test-auth-api.sh

═══════════════════════════════════════════════════════════════════════════

FILE STATISTICS
═══════════════════

Source Files:        12
Documentation:        6
Total Files:         18

Total Code Lines:    457
Total Docs Lines:   2000+

Auth Module:        ~285 lines
Users Module:       ~132 lines
Seeds:              ~40 lines

═══════════════════════════════════════════════════════════════════════════

IMPLEMENTATION STATUS
═════════════════════════════════════════════════════════════════════════════

COMPLETED ✅
  [✅] Admin entity with all fields
  [✅] Users service with CRUD
  [✅] Bcrypt password hashing
  [✅] Password validation
  [✅] Email uniqueness
  [✅] JWT strategy
  [✅] JWT auth guard
  [✅] Roles guard
  [✅] Roles decorator
  [✅] Login DTO
  [✅] Auth service
  [✅] Auth controller
  [✅] Protected routes
  [✅] Error handling
  [✅] Module configuration
  [✅] Environment config
  [✅] Seed script
  [✅] Test script
  [✅] Setup script
  [✅] Documentation

FUTURE ⏳
  [ ] Refresh token implementation
  [ ] Two-factor authentication
  [ ] Account lockout
  [ ] Rate limiting
  [ ] Audit logging

═══════════════════════════════════════════════════════════════════════════

For detailed information, see QUICK_START.md or AUTH_MODULE.md

Made with ❤️ for production-ready NestJS applications
```
