# Developer Guide - Core Extension Guide

This guide assists engineers in setting up, testing, extending, and debugging the ApexPay codebase.

---

## 1. Project Build Requirements
*   **Java Development Kit (JDK) 21**
*   **Node.js v20 (npm v10+)**
*   **Apache Maven 3.9+**
*   **Docker & Compose**

---

## 2. Setting Up Local Environment

### Database Configuration
Ensure a PostgreSQL database instance is running on port 5432. Connect and run:
```sql
CREATE DATABASE payment_platform;
```
When the Spring Boot application starts, **Flyway** will automatically execute database migrations matching the schema under `backend/src/main/resources/db/migration/`.

### Properties File (`application.yml`)
Key developer properties config can be found in `backend/src/main/resources/application.yml`:
```yaml
spring:
  datasource:
    url: ${SPRING_DATASOURCE_URL:jdbc:postgresql://localhost:5432/payment_platform}
    username: ${SPRING_DATASOURCE_USERNAME:postgres}
    password: ${SPRING_DATASOURCE_PASSWORD:postgres}
  data:
    redis:
      host: ${SPRING_DATA_REDIS_HOST:localhost}
      port: ${SPRING_DATA_REDIS_PORT:6379}
```

---

## 3. Running and Compiling Code

### Running Tests
Execute unit tests for the core payment engine, AI services, and controller endpoints:
```bash
cd backend
mvn test
```

### Local Dev Launch
Launch Backend API:
```bash
cd backend
mvn spring-boot:run
```

Launch Frontend Next.js Client:
```bash
cd frontend
npm run dev
```
Reaches frontend client at `http://localhost:3000`.

---

## 4. Troubleshooting & Debugging

### Database Lock Issues
If transactions are hanging, check database lock status:
```sql
SELECT pid, query, state, age(clock_timestamp(), query_start) 
FROM pg_stat_activity 
WHERE state != 'idle';
```
Look for `SELECT ... FOR UPDATE` query signatures that may indicate persistent deadlock conditions.
