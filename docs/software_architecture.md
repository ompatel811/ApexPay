# Software Architecture Document

This document describes the architectural patterns, software components, and code layers implemented within the ApexPay Digital Payment Platform.

---

## 1. Architectural Styles & Design Patterns

ApexPay follows the **Clean Layered Architecture** pattern, enforcing strict separation of concerns between raw HTTP controllers, business services, and database data persistence.

```
+-------------------------------------------------------------+
|                     Client View Layer (Next.js)             |
+-------------------------------------------------------------+
                              |
                              v  HTTP REST / WebSockets
+-------------------------------------------------------------+
|                  Controller Layer (Spring REST)             |
+-------------------------------------------------------------+
                              |
                              v  Method calls (DTOs)
+-------------------------------------------------------------+
|                   Business Service Layer                    |
|             (P2P Engine, Risk Engine, AI Advice)            |
+-------------------------------------------------------------+
                              |
                              v  JPA Repositories
+-------------------------------------------------------------+
|             Database Persistence Layer (PostgreSQL)         |
+-------------------------------------------------------------+
```

### Core Design Patterns
1.  **Pessimistic Locking Pattern**: Implemented at database level to ensure atomic transfers:
    *   Locks sender and receiver wallet entities sequentially.
    *   Prevents race conditions (double-spend) when transfers occur concurrently.
2.  **DTO Pattern (Data Transfer Objects)**: All controllers interact using immutable records as DTOs (e.g., `ChatRequest`, `ChatResponse`), isolating database JPA entities.
3.  **Strategy Pattern**: Used inside the Fraud Risk Engine to run dynamic validation rules against transactions.
4.  **Observer Pattern**: Implemented via Spring Event Publisher and SSE (Server-Sent Events) to push notifications to active frontend sessions.

---

## 2. Package and Directory Structure

### Backend Package Layout (`com.apexpay`)
*   `config/`: Setup configurations for CORS, JWT, database connection pool, Spring Security rules.
*   `controller/`: REST endpoints exposing wallet, analytics, UPI, and AI services.
*   `dto/`: Request/Response records and payload schema.
*   `entity/`: JPA database mapping classes (Hibernate annotations).
*   `exception/`: Global Exception Handler mapping exceptions to HTTP error status codes.
*   `repository/`: Database JPA interfaces mapping CRUD queries to tables.
*   `service/`: Interface declarations for business operations.
*   `service/impl/`: Business logic implementations.

---

## 3. Data Integrity & Concurrency Controls
To guarantee financial transaction consistency, ApexPay adopts ACID transactions:
*   `@Transactional(isolation = Isolation.READ_COMMITTED)` is applied to payment service operations.
*   The system uses Hibernate `@Lock(LockModeType.PESSIMISTIC_WRITE)` to lock resource rows.
*   The transaction order is sorted alphabetically by account UUIDs before locking, which mathematically eliminates deadlock possibilities under concurrent updates.
