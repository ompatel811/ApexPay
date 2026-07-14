# Entity-Relationship (ER) Diagram

The following diagram illustrates the PostgreSQL database schema for the ApexPay payment platform, depicting the relationships between authentication, wallet engine, transaction log, fraud risk engine, and the AI financial assistant.

```mermaid
erDiagram
    USER ||--o| WALLET : "owns"
    USER ||--o{ BUDGET : "sets"
    USER ||--o{ FINANCIAL_GOAL : "targets"
    USER ||--o{ CHAT_HISTORY : "chats"
    USER ||--o{ FINANCIAL_INSIGHT : "receives"
    USER ||--o{ BUDGET_RECOMMENDATION : "receives"
    USER ||--o| FINANCIAL_SCORE : "has"
    
    WALLET ||--o{ TRANSACTION : "sends/receives"
    
    TRANSACTION ||--o| FRAUD_ALERT : "triggers"
    
    %% Entity Definitions
    USER {
        uuid id PK
        string username
        string password
        string email
        string role
        timestamp created_at
    }
    
    WALLET {
        uuid id PK
        uuid user_id FK
        numeric balance
        string currency
        string account_number
    }
    
    TRANSACTION {
        uuid id PK
        string reference
        uuid sender_wallet_id FK
        uuid receiver_wallet_id FK
        numeric amount
        string status
        string type
        string category
        string remarks
        timestamp created_at
    }
    
    FRAUD_ALERT {
        uuid id PK
        uuid transaction_id FK
        numeric risk_score
        string reason
        string status
        string action_taken
        timestamp created_at
    }
    
    BUDGET {
        uuid id PK
        uuid user_id FK
        string category
        numeric amount_limit
        numeric current_spent
        numeric alert_threshold
    }
    
    FINANCIAL_GOAL {
        uuid id PK
        uuid user_id FK
        string name
        numeric target_amount
        numeric current_amount
        date deadline
    }
    
    CHAT_HISTORY {
        uuid id PK
        uuid user_id FK
        text message
        text response
        timestamp created_at
    }
    
    FINANCIAL_INSIGHT {
        uuid id PK
        uuid user_id FK
        string title
        text content
        string type
        timestamp created_at
    }
    
    BUDGET_RECOMMENDATION {
        uuid id PK
        uuid user_id FK
        string category
        numeric current_spending
        numeric recommended_limit
        numeric potential_savings
        timestamp created_at
    }
    
    FINANCIAL_SCORE {
        uuid id PK
        uuid user_id FK
        integer score
        numeric savings_rate
        numeric budget_adherence
        numeric investment_score
        numeric fraud_score
        timestamp calculated_at
    }
    
    BLACKLIST {
        uuid id PK
        string entity_type
        string entity_value
        string reason
        timestamp created_at
    }
    
    FRAUD_RULE {
        uuid id PK
        string name
        string type
        string expression
        numeric threshold
        boolean is_active
    }
```
