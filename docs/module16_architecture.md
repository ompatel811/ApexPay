# ApexPay Module 16 – Real-Time Chat & Messaging Architecture

This document presents the detailed architectural specifications, ER diagrams, sequence diagrams, and class diagrams for Module 16: **Real-Time Chat & Messaging Platform**.

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ conversation_participants : participates
    users ||--o{ messages : sends
    users ||--o{ message_statuses : tracks_status
    users ||--o{ message_reactions : reacts
    users ||--o{ blocked_users : blocks

    conversations ||--o{ conversation_participants : includes
    conversations ||--o{ messages : contains

    messages ||--o{ message_statuses : status_records
    messages ||--o{ message_reactions : reaction_records
    messages ||--o| messages : replies_to

    conversations {
        UUID id PK
        VARCHAR type "PRIVATE, MERCHANT, CUSTOMER_SUPPORT, GROUP"
        VARCHAR title
        VARCHAR avatar_url
        TEXT last_message_content
        TIMESTAMP last_message_time
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    conversation_participants {
        UUID id PK
        UUID conversation_id FK
        UUID user_id FK
        VARCHAR role "MEMBER, ADMIN, SUPPORT_AGENT"
        BOOLEAN muted
        BOOLEAN archived
        BOOLEAN pinned
        TIMESTAMP joined_at
        TIMESTAMP last_read_at
    }

    messages {
        UUID id PK
        UUID conversation_id FK
        UUID sender_id FK
        VARCHAR message_type "TEXT, SYSTEM"
        TEXT content
        UUID reply_to_id FK
        BOOLEAN edited
        BOOLEAN deleted_for_everyone
        BOOLEAN pinned
        BOOLEAN starred
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    message_statuses {
        UUID id PK
        UUID message_id FK
        UUID user_id FK
        BOOLEAN delivered
        TIMESTAMP delivered_at
        BOOLEAN seen
        TIMESTAMP seen_at
        BOOLEAN hidden_for_user
    }

    message_reactions {
        UUID id PK
        UUID message_id FK
        UUID user_id FK
        VARCHAR reaction
        TIMESTAMP created_at
    }

    blocked_users {
        UUID id PK
        UUID user_id FK
        UUID blocked_user_id FK
        VARCHAR reason
        TIMESTAMP created_at
    }
```

---

## 2. Real-Time WebSockets Architecture

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A (Sender)
    participant WS as STOMP / WebSocket (/ws)
    participant Controller as ChatWebSocketController
    participant MessageSvc as MessageServiceImpl
    participant DB as PostgreSQL DB
    participant Broker as SimpMessagingTemplate
    actor UserB as User B (Recipient)

    UserA->>WS: CONNECT with Bearer JWT Token
    WS->>WS: Validate JWT with WebSocketAuthInterceptor
    UserA->>WS: SEND /app/chat.sendMessage
    WS->>Controller: @MessageMapping("/chat.sendMessage")
    Controller->>MessageSvc: sendMessage(senderId, request)
    MessageSvc->>DB: Save Message & MessageStatus
    MessageSvc->>Broker: convertAndSend("/topic/conversation.{id}", response)
    Broker->>UserA: MESSAGE delivered to topic
    Broker->>UserB: MESSAGE delivered to topic
```

---

## 3. Sequence Diagram – Typing Indicator & Read Receipts

```mermaid
sequenceDiagram
    autonumber
    actor UserA as User A
    participant WS as WebSocket Interceptor
    participant Controller as ChatWebSocketController
    participant ChatSvc as ChatServiceImpl
    participant Broker as STOMP Broker
    actor UserB as User B

    UserA->>WS: Send Typing Event (/app/chat.typing)
    WS->>Controller: handleTyping(typingDTO)
    Controller->>ChatSvc: handleTypingIndicator(userId, typingDTO)
    ChatSvc->>Broker: convertAndSend("/topic/conversation.{id}.typing", typingDTO)
    Broker->>UserB: Typing Indicator displayed

    UserB->>WS: Open Chat / Read Receipts (/app/chat.readReceipt)
    WS->>Controller: handleReadReceipt(readReceiptDTO)
    Controller->>ChatSvc: handleReadReceipt(userId, readReceiptDTO)
    ChatSvc->>Broker: Broadcast Read Receipt Event
    Broker->>UserA: Checkmarks updated to Seen (Blue Check)
```

---

## 4. Class Diagram

```mermaid
classDiagram
    class ConversationController {
        +createConversation()
        +getUserConversations()
        +getConversationById()
        +archiveConversation()
        +muteConversation()
        +pinConversation()
        +deleteConversation()
    }

    class MessageController {
        +sendMessage()
        +getMessages()
        +editMessage()
        +deleteMessageForMe()
        +deleteMessageForEveryone()
        +addReaction()
        +pinMessage()
        +starMessage()
    }

    class ChatWebSocketController {
        +sendMessage()
        +handleTyping()
        +handleReadReceipt()
    }

    class ConversationService {
        <<interface>>
        +createConversation()
        +getUserConversations()
        +getConversationById()
    }

    class MessageService {
        <<interface>>
        +sendMessage()
        +getMessages()
        +editMessage()
        +addReaction()
    }

    class PresenceService {
        <<interface>>
        +markUserOnline()
        +markUserOffline()
        +isUserOnline()
    }

    ConversationController --> ConversationService
    MessageController --> MessageService
    ChatWebSocketController --> MessageService
    ChatWebSocketController --> PresenceService
```
