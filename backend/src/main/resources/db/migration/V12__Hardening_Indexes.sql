-- V12__Hardening_Indexes.sql
-- Performance optimization: Additional indexes for risk rules, status queries, and transaction counts

-- 1. Composite indexes to optimize high frequency velocity rules and ledger query lookups
CREATE INDEX IF NOT EXISTS idx_transactions_sender_status_created ON transactions(sender_wallet_id, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_receiver_status_created ON transactions(receiver_wallet_id, payment_status, created_at);
CREATE INDEX IF NOT EXISTS idx_transactions_category_created ON transactions(category, created_at);

-- 2. Foreign Key Indexes on Fraud Alerts table for faster audit lookup
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_user_id ON fraud_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_wallet_id ON fraud_alerts(wallet_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_transaction_id ON fraud_alerts(transaction_id);
CREATE INDEX IF NOT EXISTS idx_fraud_alerts_merchant_id ON fraud_alerts(merchant_id);
