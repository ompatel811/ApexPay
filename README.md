# ApexPay - Enterprise Digital Payment Platform

ApexPay is a production-grade, highly-available, and secure Digital Payment Platform inspired by Google Pay. It supports high-concurrency P2P wallet transfers, UPI and direct bank integrations, real-time fraud rules screening, dynamic encrypted QR codes, and an AI-powered financial advisory hub.

---

## 🚀 Key Modules Completed
*   **Module 1 – Project Setup**: Multi-tier architecture build configurations.
*   **Module 2 – Database Design**: Relational schemas, indexing, and Flyway database migrations.
*   **Module 3 – Authentication**: Spring Security state-aware JWT session authorization.
*   **Module 4 – Dashboard**: Glassmorphic Next.js interface with real-time stats feeds.
*   **Module 5 – Wallet Management**: Multi-currency ledger balances and deposits.
*   **Module 6 – Payment Engine**: Pessimistic database row locking for concurrent P2P transfers.
*   **Module 7 – QR Payments**: Encrypted dynamic QR payment code scanner.
*   **Module 8 – Bank & UPI**: UPI ID mapping and virtual bank routing.
*   **Module 9 – Notifications**: Real-time SSE audit updates and client notification feeds.
*   **Module 10 – Analytics**: Spend analytics reporting and PDF transaction exports.
*   **Module 11 – Merchant Platform**: Refund logic checkpoints and dynamic checkouts.
*   **Module 12 – Admin Platform**: Blacklist controls, transaction overrides, and system health checks.
*   **Module 13 – Fraud Detection**: Dynamic risk engine checks.
*   **Module 14 – AI Assistant**: Budget suggestions chatbot with FICO spending scores.
*   **Module 15 – DevOps & Cloud**: Automatic Docker containers, Kubernetes deployments, and cloud infrastructures.

---

## 🛠 Tech Stack & Tools

### Frontend Core
*   **Framework**: Next.js 14 / React (TypeScript)
*   **Styling**: Vanilla Tailwind CSS tokens
*   **Charts**: Recharts

### Backend Core
*   **Framework**: Java 21 / Spring Boot 3
*   **Data Persistence**: Hibernate JPA, PostgreSQL
*   **Caching & Rates**: Redis
*   **Security**: Spring Security + Stateless JWT auth

### DevOps & Monitoring
*   **Gateway**: Nginx reverse proxy with gzip compression & SSL termination
*   **CI/CD**: GitHub Actions pipelines
*   **Orchestration**: Kubernetes manifests (Deployments, Services, ConfigMaps, Secrets, Ingress, HPA)
*   **Cloud IaC**: Terraform VPC, RDS, and EKS configuration
*   **Metrics**: Prometheus & Grafana System dashboards
*   **Logging**: ELK Stack (Logstash, Elasticsearch, Kibana)

---

## 📂 Documentation & Manuals

A complete suite of architectural manuals and operational documents is available in the [docs/](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/) directory:

1.  [Complete Project Documentation](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/project_documentation.md)
2.  [Software Architecture Document](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/software_architecture.md)
3.  [Deployment Guide](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/deployment_guide.md)
4.  [API Documentation](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/api_documentation.md)
5.  [User Manual](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/user_manual.md)
6.  [Admin Manual](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/admin_manual.md)
7.  [Developer Guide](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/developer_guide.md)
8.  [Final ER Diagram](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/er_diagram.md)
9.  [Final System Architecture Diagram](file:///Users/ompatel/.gemini/antigravity-ide/scratch/apexpay/docs/system_architecture_diagram.md)

---

## 🏃 Running the Application

### Option 1: Running with Docker Compose (Recommended)
Launch all 5 containers (Postgres, Redis, Backend, Frontend, and Nginx secure gateway):
```bash
docker-compose up -d --build
```
Access the application securely at `https://localhost`.

### Option 2: Running Locally (Development Mode)
1.  Start Postgres & Redis services:
    ```bash
    docker-compose up -d postgres redis
    ```
2.  Launch Backend API:
    ```bash
    cd backend && mvn spring-boot:run
    ```
3.  Launch Frontend client:
    ```bash
    cd frontend && npm install && npm run dev
    ```
    Access at `http://localhost:3000`.
