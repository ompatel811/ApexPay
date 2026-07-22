# ApexPay Module 17 – Payment Conversations & Financial Messaging Architecture

This document presents the detailed architectural specifications, ER diagrams, sequence diagrams, and class diagrams for Module 17: **Payment Conversations & Financial Messaging**.

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    conversations ||--o| payment_conversations : maintains_summary
    conversations ||--o{ payment_messages : records_transfers
    conversations ||--o{ payment_requests : manages_requests
    conversations ||--o{ shared_qrs : shares_qr
    conversations ||--o{ shared_receipts : shares_receipts

    users ||--o{ payment_messages : sends_or_receives
    users ||--o{ payment_requests : requests_or_receives

    transactions ||--o| payment_messages : linked_transaction
    transactions ||--o| shared_receipts : receipt_transaction

    payment_conversations {
        UUID id PK
        UUID conversation_id FK
        UUID last_payment_id
        VARCHAR last_payment_status
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    payment_messages {
        UUID id PK
        UUID conversation_id FK
        UUID transaction_id FK
        UUID sender_id FK
        UUID receiver_id FK
        NUMERIC amount
        VARCHAR currency
        VARCHAR payment_method
        VARCHAR status
        VARCHAR reference_number
        VARCHAR receipt_url
        TIMESTAMP created_at
    }

    payment_requests {
        UUID id PK
        UUID conversation_id FK
        UUID requester_id FK
        UUID receiver_id FK
        NUMERIC amount
        VARCHAR reason
        VARCHAR status "PENDING, ACCEPTED, REJECTED, CANCELLED, EXPIRED"
        TIMESTAMP expires_at
        TIMESTAMP created_at
    }

    shared_qrs {
        UUID id PK
        UUID conversation_id FK
        TEXT qr_code_content
        UUID sender_id FK
        UUID receiver_id FK
        TIMESTAMP created_at
    }

    shared_receipts {
        UUID id PK
        UUID conversation_id FK
        UUID transaction_id FK
        VARCHAR receipt_url
        UUID sender_id FK
        UUID receiver_id FK
        TIMESTAMP created_at
    }
```

---

## 2. Payment Execution & Real-Time Flow

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Sender)
    participant Controller as PaymentConversationController
    participant PaySvc as PaymentConversationServiceImpl
    participant Module6 as Module 6 Payment Engine
    participant DB as PostgreSQL DB
    participant Broker as SimpMessagingTemplate
    actor UserB as User B (Recipient)

    UserA->>Controller: POST /api/chat/payment/send
    Controller->>PaySvc: sendMoneyInChat(senderId, request)
    PaySvc->>Module6: processTransfer(senderId, transferReq)
    Module6->>DB: Execute Wallet Ledger Transfer
    PaySvc->>DB: Save PaymentMessage & update PaymentConversation
    PaySvc->>Broker: convertAndSend("/topic/conversation.{id}.payment", response)
    Broker->>UserA: Payment Card (Sent) rendered
    Broker->>UserB: Payment Card (Received) rendered
```

---

## 3. Money Request & Accept Sequence

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Requester)
    actor UserB as User B (Payer)
    participant Controller as PaymentConversationController
    participant ReqSvc as PaymentRequestServiceImpl
    participant PaySvc as PaymentConversationServiceImpl
    participant DB as PostgreSQL DB
    participant Broker as SimpMessagingTemplate

    UserA->>Controller: POST /api/chat/payment/request ($25.00)
    Controller->>ReqSvc: createRequest(requesterId, request)
    ReqSvc->>DB: Save PaymentRequest (status=PENDING)
    ReqSvc->>Broker: Broadcast Payment Request Card
    Broker->>UserB: Payment Request Card displayed with Accept / Reject

    UserB->>Controller: POST /api/chat/payment/accept/{id}
    Controller->>ReqSvc: acceptRequest(payerId, requestId)
    ReqSvc->>PaySvc: sendMoneyInChat(payerId, SendPaymentChatRequest)
    PaySvc->>DB: Process wallet transfer & save PaymentMessage
    ReqSvc->>DB: Update PaymentRequest status = ACCEPTED
    ReqSvc->>Broker: Broadcast Request ACCEPTED & Payment Sent Cards
```
