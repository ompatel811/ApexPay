# Deployment Guide & Runbook

This guide covers step-by-step instructions for deploying ApexPay locally, to a Kubernetes cluster, or onto Amazon Web Services (AWS) using production standards.

---

## 1. Local Deployment with Docker Compose

Ensure you have **Docker** and **Docker Compose** installed on your machine.

### Step 1: Clone and Build
Build the platform jars locally before launching:
```bash
# Compile backend
cd backend
mvn clean package -DskipTests
cd ..
```

### Step 2: Launch the Services
Launch the fully-orchestrated stack (Postgres, Redis, Backend, Frontend, and Nginx proxy):
```bash
docker-compose up -d --build
```

### Step 3: Verify Running Services
Verify container states:
```bash
docker-compose ps
```
The services will be reachable at:
*   **Secure Gateway**: `https://localhost` (Nginx handles proxying to frontend/backend).
*   **Direct Frontend**: `http://localhost:3000`
*   **Direct Backend Health**: `http://localhost:8080/api/v1/health`

---

## 2. Kubernetes EKS Cluster Deployment

To deploy onto a Kubernetes environment (like Minikube, kind, or AWS EKS):

### Step 1: Create Namespace and Storage
```bash
kubectl create namespace apexpay-prod
kubectl apply -f kubernetes/pv-pvc.yaml -n apexpay-prod
```

### Step 2: Apply Configs & Secrets
```bash
kubectl apply -f kubernetes/configmap.yaml -n apexpay-prod
kubectl apply -f kubernetes/secrets.yaml -n apexpay-prod
```

### Step 3: Launch Pods and Databases
```bash
kubectl apply -f kubernetes/postgres-deployment.yaml -n apexpay-prod
kubectl apply -f kubernetes/redis-deployment.yaml -n apexpay-prod
kubectl apply -f kubernetes/backend-deployment.yaml -n apexpay-prod
kubectl apply -f kubernetes/frontend-deployment.yaml -n apexpay-prod
```

### Step 4: Apply Traffic Ingress and Autoscalers
```bash
kubectl apply -f kubernetes/ingress.yaml -n apexpay-prod
kubectl apply -f kubernetes/hpa.yaml -n apexpay-prod
```

---

## 3. AWS Enterprise-Grade Deployment architecture

The production AWS design relies on the Terraform infrastructure configurations:

```
                  +-------------------------+
                  |    Route 53 (DNS)       |
                  +-------------------------+
                               |
                               v
                  +-------------------------+
                  |  CloudFront CDN         |
                  +-------------------------+
                    |                     |
                    v (Dynamic API)       v (Static Media)
            +--------------+        +---------------+
            | AL Load Bal. |        |  S3 Bucket    |
            +--------------+        +---------------+
                    |
                    v
            +---------------------------------------+
            |      AWS EKS Kubernetes Cluster       |
            |      [Backend Pods / Frontend Pods]   |
            +---------------------------------------+
              |                                   |
              v (Private Subnet)                  v (Private Subnet)
            +---------------+               +--------------------+
            | RDS Postgres  |               | ElastiCache Redis  |
            +---------------+               +--------------------+
```

### Infrastructure Provisioning Steps
1.  **Initialize Terraform**:
    ```bash
    cd terraform
    terraform init
    ```
2.  **Plan changes**:
    ```bash
    terraform plan -out=tfplan
    ```
3.  **Apply and Deploy resources**:
    ```bash
    terraform apply tfplan
    ```
