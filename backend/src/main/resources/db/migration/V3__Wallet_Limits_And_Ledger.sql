-- V3__Wallet_Limits_And_Ledger.sql
-- Add limits to wallets table and create wallet ledgers table

-- 1. Add limit columns to wallets table
ALTER TABLE wallets ADD COLUMN daily_transfer_limit NUMERIC(15, 4) NOT NULL DEFAULT 1000.0000;
ALTER TABLE wallets ADD COLUMN daily_withdrawal_limit NUMERIC(15, 4) NOT NULL DEFAULT 500.0000;
ALTER TABLE wallets ADD COLUMN monthly_transfer_limit NUMERIC(15, 4) NOT NULL DEFAULT 5000.0000;
ALTER TABLE wallets ADD COLUMN monthly_withdrawal_limit NUMERIC(15, 4) NOT NULL DEFAULT 2500.0000;

-- 2. Create wallet ledger table
CREATE TABLE wallet_ledgers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID NOT NULL,
    reference_number VARCHAR(100) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount NUMERIC(15, 4) NOT NULL,
    balance_before NUMERIC(15, 4) NOT NULL,
    balance_after NUMERIC(15, 4) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    remarks VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    CONSTRAINT fk_ledger_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE
);

-- 3. Indexes for performance
CREATE INDEX idx_ledger_wallet_id ON wallet_ledgers(wallet_id);
CREATE INDEX idx_ledger_timestamp ON wallet_ledgers(timestamp);
CREATE INDEX idx_ledger_reference ON wallet_ledgers(reference_number);
