# ApexPay Backend - Authentication & Profile Management System

This is the backend service for the ApexPay next-generation digital payment platform. It is built using Java 21, Spring Boot 3, Spring Security, PostgreSQL, and Redis.

## Modules Implemented

### Module 3 - Authentication & Authorization System
- **User Onboarding**: Secure registration endpoint (`/api/auth/register`) with uniqueness checks for username, email, and mobile number.
- **Credential Verification**: Dual-login interface supporting both (Email + Password) and (Mobile + Password) via `/api/auth/login`.
- **JWT Token Management**: Stateless session tokens with Access Tokens (short-lived) and Refresh Tokens (long-lived) using rotation logic.
- **Secure Password Hashing**: Passwords processed and checked using BCrypt encryption.
- **Method Security**: Role-based routing authorization using `@PreAuthorize("isAuthenticated()")` and predefined roles like `ROLE_USER` and `ROLE_ADMIN`.
- **Centralized Auditing**: JPA listeners that record transactions, session updates, and security occurrences to database audit tables.

### Module 4 - User Profile & Session Dashboard
- **Profile Queries**: Returns current authenticated user metadata via `/api/users/me`.
- **Profile Updates**: Modifies Full Name and Date of Birth details via `/api/users/profile`.
- **Profile Photo Uploads**: Multi-part image file processing storing files locally under `/uploads/**` with extension and size checks (max 5MB).
- **Interactive Timeline**: Accesses system logs of actions performed by this user via `/api/users/activity`.
- **Device Sessions**: Displays active sessions with browser, OS, and client IP mappings, with endpoints to revoke individual device sessions (`DELETE /api/users/sessions/{id}`).

---

## Technology Stack
- **Language**: Java 21 (compatible with JDK 24 runtime environments)
- **Framework**: Spring Boot 3.4.3
- **Security**: Spring Security & JSON Web Tokens (JJWT)
- **Data Layer**: Spring Data JPA & Hibernate
- **Database**: PostgreSQL 16
- **Cache / Session Store**: Redis 7
- **Database Migrations**: Flyway
- **Tooling**: Apache Maven 3.9+, Lombok

---

## API Endpoints

### Authentication Group (`/api/auth/**`)
- `POST /api/auth/register` - Create new user account.
- `POST /api/auth/login` - Authenticate credentials and return tokens.
- `POST /api/auth/logout` - Revoke current refresh token.
- `POST /api/auth/refresh` - Request new access/refresh tokens.
- `POST /api/auth/forgot-password` - Request a password reset token.
- `POST /api/auth/reset-password` - Update password using token.
- `PUT /api/auth/change-password` - Modify password for authenticated user.

### User Group (`/api/users/**`) (Secured)
- `GET /api/users/me` - Fetch authenticated user profile.
- `PUT /api/users/profile` - Update profile personal information.
- `POST /api/users/profile/photo` - Upload a new profile picture.
- `DELETE /api/users/profile/photo` - Remove profile picture.
- `GET /api/users/activity` - Fetch user action timeline.
- `GET /api/users/sessions` - Fetch list of login device sessions.
- `DELETE /api/users/sessions/{id}` - Terminate an active device session.

---

## Running the Application

### Running with Docker (Entire stack)
To start database, cache, backend and Next.js frontend services:
```bash
docker-compose up --build
```

### Running Locally (Backend Only)
1. Launch PostgreSQL and Redis:
   ```bash
   docker-compose up -d postgres redis
   ```
2. Run backend compilation:
   ```bash
   mvn spring-boot:run
   ```

---

## Testing
To run the mock JUnit 5 unit test suite:
```bash
mvn test
```
The test suite validates password strength checks, authentication flows, token issuance, and user manager profile endpoints.
