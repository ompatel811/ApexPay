-- V4__Ledger_Transaction_Link_And_Idempotency.sql
-- Link ledger entries to transactions and implement database-backed idempotency tracking

-- 1. Modify wallet_ledgers table to link with transactions and define entry direction (DEBIT/CREDIT)
ALTER TABLE wallet_ledgers ADD COLUMN transaction_id UUID;
ALTER TABLE wallet_ledgers ADD COLUMN direction VARCHAR(10) NOT NULL DEFAULT 'DEBIT';

-- Add constraint to link transaction
ALTER TABLE wallet_ledgers 
ADD CONSTRAINT fk_ledger_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL;

-- 2. Create idempotency_keys table for API replay protection
CREATE TABLE idempotency_keys (
    key VARCHAR(255) PRIMARY KEY,
    response_body TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Add index to ledger for transaction_id
CREATE INDEX idx_ledger_transaction_id ON wallet_ledgers(transaction_id);
