# Complete Project Documentation - ApexPay

Welcome to the project documentation of **ApexPay**, an enterprise-grade, high-performance, and secure Digital Payment Platform inspired by Google Pay. 

---

## 1. Executive Summary
ApexPay is designed to handle retail wallet transactions, QR code payments, bank accounts, UPI transfers, instant notifications, automated budget management, AI financial advice, real-time risk evaluation, and fraud protection. It is built as a cloud-native, scalable micro-application architecture leveraging Spring Boot, Next.js, PostgreSQL, and Redis.

---

## 2. Platform Modules List
The platform consists of 15 fully-integrated modules:

| Module # | Module Name | Core Capabilities |
| :--- | :--- | :--- |
| **Module 1** | Project Setup | Multi-tier project layout, Maven builds, database setup with Flyway, Next.js template. |
| **Module 2** | Database Design | Schema normalization, indexes, foreign keys, audit log schema. |
| **Module 3** | Authentication | JWT authentication, Spring Security integration, refresh tokens, role checks. |
| **Module 4** | Dashboard | Glassmorphic visual dashboard, stats metrics, visual transactions feed. |
| **Module 5** | Wallet Management | Multi-currency wallet balance ledger, instant deposits, transfers, withdrawals. |
| **Module 6** | Payment Engine | High-concurrency peer-to-peer (P2P) transfers, pessimistic locking, rollbacks. |
| **Module 7** | QR Payments | Dynamic QR code generator, payment scanner, secure payload decryption. |
| **Module 8** | Bank & UPI | UPI ID creation, virtual accounts mapping, direct bank transfers. |
| **Module 9** | Notifications | Real-time SSE notifications, audit notifications feed, alert rules. |
| **Module 10** | Analytics | Transaction analytics, interactive charts, PDF statement exports. |
| **Module 11** | Merchant Platform | Merchant verification workflows, refund management, QR checkouts. |
| **Module 12** | Admin Platform | System metrics, user suspension, blacklist controls, transaction overrides. |
| **Module 13** | Fraud Detection | Real-time rules engine, blacklist screening, risk evaluations. |
| **Module 14** | AI Assistant | Chat bot assistant, budget advisory scoring, transaction category parsing. |
| **Module 15** | Production & DevOps | CI/CD pipelines, Kubernetes config, AWS deployment setups, backups, monitoring. |

---

## 3. Technology Stack

### Backend
*   **Java 21 / Spring Boot 3**: Principal framework for REST API development.
*   **Spring Security**: Stateful authentication with secure JWT tokens.
*   **Spring Data JPA**: Database ORM with Hibernate integration.
*   **Flyway**: Continuous relational database schema migrations.
*   **PostgreSQL**: Relational database storage.
*   **Redis**: Caching store, session storage, and rate-limiting.

### Frontend
*   **Next.js 14 / React**: Component rendering and dashboard logic.
*   **TypeScript**: Static type safety checks.
*   **Tailwind CSS**: Modern Glassmorphic styling tokens.
*   **Recharts / Lucide-React**: Interactive charting widgets and UI icons.

---

## 4. Key Security Accomplishments
1.  **Pessimistic Locking**: Prevents double-spending attacks during rapid consecutive transfers.
2.  **Audit Logs**: Tracks all sensitive activities (logins, risk rule modifications, wallet changes) in a central database audit table.
3.  **Real-Time Fraud Blocking**: Evaluates transactions against active risk rules (e.g. transaction speed limit, volume bounds, location discrepancies).
4.  **Credential Rotation**: Support for environment-variable-injected keys ensuring zero hardcoded secrets.
