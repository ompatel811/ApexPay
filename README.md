# ApexPay - Next-Gen Digital Payment Platform

ApexPay is a production-ready, educational Digital Payment Platform inspired by Google Pay. It supports bank accounts integration, secure wallet settlements, QR codes generation, multi-device session checks, and automated audit logs.

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **UI / UX**: React 19, Tailwind CSS, Framer Motion, Lucide Icons
- **State & Data**: Zustand (local state), TanStack React Query (server cache), Axios (HTTP Client)
- **Forms & Validation**: React Hook Form, Zod

### Backend
- **Core**: Java 21, Spring Boot 3
- **Data Layer**: Spring Data JPA, PostgreSQL
- **Caching / Session**: Redis
- **Security**: Spring Security, JWT (stateless)
- **Migrations**: Flyway
- **Tooling**: Maven, Lombok, Spring Boot Actuator

### DevOps & Infrastructure
- **Containers**: Docker, Docker Compose
- **Network**: Custom bridge network

---

## Directory Structure

```text
payment-platform/
├── frontend/             # Next.js 15 client application
├── backend/              # Spring Boot 3 backend application
├── database/             # Persistent database schemas / SQL exports
├── docs/                 # Architecture, normalization and API docs
├── docker/               # Dockerfile configurations for front and back
├── nginx/                # Proxy/Web server config (if needed)
├── postman/              # API Collection exports for testing
├── scripts/              # Setup, database seeding, and utility scripts
├── .gitignore            # Multi-stack git exclusions
├── .editorconfig         # Code format guidelines
├── .prettierrc           # Prettier rules for frontend
├── docker-compose.yml    # Service orchestration (front, back, db, cache)
└── README.md             # Project documentation
```

---

## Getting Started

### Prerequisites
- [Docker & Docker Compose](https://www.docker.com/)
- [Java 21 JDK](https://adoptium.net/) (for local backend development)
- [Node.js 20 or later](https://nodejs.org/) (for local frontend development)
- [Maven 3.9+](https://maven.apache.org/) (optional, Maven wrapper is included)

---

## Running with Docker (Recommended)

To start the entire platform (PostgreSQL, Redis, Spring Boot Backend, Next.js Frontend) in one command:

```bash
docker-compose up --build
```

This will launch:
- **Frontend** at [http://localhost:3000](http://localhost:3000)
- **Backend API** at [http://localhost:8080](http://localhost:8080)
- **Swagger Documentation** at [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
- **PostgreSQL Database** at port `5432`
- **Redis Cache Store** at port `6379`

---

## Running Locally (Development Mode)

### 1. Spin up Database & Redis Services
Start only the PostgreSQL and Redis containers:
```bash
docker-compose up -d postgres redis
```

### 2. Run the Backend API
Navigate to the `backend` directory and start the Spring Boot application:
```bash
cd backend
mvn spring-boot:run
```

### 3. Run the Frontend Client
Navigate to the `frontend` directory, install packages, and start the development server:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Verification

To verify that the setup is fully operational, run:

```bash
# Check the backend status (PostgreSQL & Redis health probes)
curl http://localhost:8080/api/v1/health
```

Expected JSON response:
```json
{
  "status": "UP",
  "database": "UP",
  "redis": "UP"
}
```
