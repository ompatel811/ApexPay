# API Specifications & Documentation

This document describes the REST endpoints exposed by the ApexPay Backend application. All endpoints require `Content-Type: application/json` and standard JWT authorization.

---

## 1. Authentication Endpoints

### User Sign Up
*   **Method**: `POST`
*   **Path**: `/api/auth/register`
*   **Request Body**:
    ```json
    {
      "username": "customer1",
      "password": "Password123!",
      "email": "customer1@gmail.com"
    }
    ```
*   **Success Response** (`200 OK`):
    ```json
    {
      "message": "User registered successfully"
    }
    ```

### User Login
*   **Method**: `POST`
*   **Path**: `/api/auth/login`
*   **Request Body**:
    ```json
    {
      "username": "customer1",
      "password": "Password123!"
    }
    ```
*   **Success Response** (`200 OK`):
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "username": "customer1"
    }
    ```

---

## 2. Wallet & Payment Engine

### View Wallet Balance
*   **Method**: `GET`
*   **Path**: `/api/wallet/balance`
*   **Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Success Response** (`200 OK`):
    ```json
    {
      "id": "a90b4a45-6677-4488-99ee-001122334455",
      "balance": 1500.50,
      "currency": "INR",
      "accountNumber": "AP9028301823"
    }
    ```

### Transfer Funds (P2P)
*   **Method**: `POST`
*   **Path**: `/api/wallet/transfer`
*   **Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Request Body**:
    ```json
    {
      "recipientAccountNumber": "AP8738271839",
      "amount": 250.00,
      "remarks": "Groceries dinner split"
    }
    ```
*   **Success Response** (`200 OK`):
    ```json
    {
      "reference": "TXN_738291038192",
      "status": "SUCCESS",
      "amount": 250.00,
      "created_at": "2026-07-14T11:00:00Z"
    }
    ```

---

## 3. AI Financial Assistant

### Chat Prompt
*   **Method**: `POST`
*   **Path**: `/api/ai/chat`
*   **Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Request Body**:
    ```json
    {
      "message": "Should I invest my money?"
    }
    ```
*   **Success Response** (`200 OK`):
    ```json
    {
      "response": "Here is what I recommend based on your budget: Since you have a 35% savings rate this month, you can afford to invest..."
    }
    ```

### Financial Health Score
*   **Method**: `GET`
*   **Path**: `/api/ai/health`
*   **Headers**: `Authorization: Bearer <JWT_TOKEN>`
*   **Success Response** (`200 OK`):
    ```json
    {
      "score": 85,
      "savingsRate": 35.0,
      "budgetAdherence": 30.0,
      "investmentScore": 10.0,
      "fraudScore": 10.0
    }
    ```
