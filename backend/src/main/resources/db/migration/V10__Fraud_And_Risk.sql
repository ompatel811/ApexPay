-- V10__Fraud_And_Risk.sql
-- Create database schema for Module 13 Fraud Detection & Risk Engine

-- 1. Create fraud_rules table
CREATE TABLE fraud_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    threshold_value VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL
);

-- Seed default fraud rules
INSERT INTO fraud_rules (rule_key, name, description, is_enabled, threshold_value, action) VALUES
('TX_LIMIT', 'Transaction Limit Rule', 'Flags transactions exceeding a specific single payment threshold', TRUE, '50000.00', 'BLOCK'),
('TX_VELOCITY_30S', 'High Frequency Rule', 'Flags users executing 5 or more transactions in 30 seconds', TRUE, '5', 'BLOCK'),
('FAILED_PAYMENTS', 'Multiple Failed Payments Rule', 'Flags users attempting 3 or more failed payments within a short window', TRUE, '3', 'REVIEW'),
('BALANCE_ANOMALY', 'Wallet Balance Anomaly Rule', 'Flags transactions larger than 10 times the average transaction size in 30 days', TRUE, '10.0', 'REVIEW'),
('QR_REUSE', 'QR Replay Attack Rule', 'Flags same QR code used more than 5 times in 1 minute', TRUE, '5', 'BLOCK'),
('DUPLICATE_REFERENCE', 'Duplicate Transaction Reference', 'Flags attempts to submit the same transaction reference', TRUE, '1', 'BLOCK'),
('BLACKLISTED_IP', 'Blacklisted IP Address Rule', 'Blocks requests originating from blacklisted IPs', TRUE, '1', 'FREEZE_USER'),
('BLACKLISTED_DEVICE', 'Blacklisted Device Rule', 'Blocks requests originating from blacklisted device names/fingerprints', TRUE, '1', 'FREEZE_USER');

-- 2. Create blacklists table
CREATE TABLE blacklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'IP', 'DEVICE', 'USER', 'WALLET', 'MERCHANT', 'UPI'
    item_value VARCHAR(255) NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Seed some test blacklist values
INSERT INTO blacklists (type, item_value, reason) VALUES
('IP', '198.51.100.42', 'Attempted brute force attacks on auth API'),
('DEVICE', 'HackerOS Emulator', 'Simulated fingerprint mapping multiple user logs');

-- 3. Create whitelists table
CREATE TABLE whitelists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- 'WALLET', 'MERCHANT', 'DEVICE'
    item_value VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create fraud_alerts table
CREATE TABLE fraud_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID,
    wallet_id UUID,
    user_id UUID,
    merchant_id UUID,
    risk_score INT NOT NULL,
    risk_level VARCHAR(50) NOT NULL, -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    reason VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL DEFAULT 'ALLOW',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW', -- 'PENDING_REVIEW', 'INVESTIGATING', 'CLOSED_RESOLVED', 'CLOSED_FALSE_POSITIVE'
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_fa_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
    CONSTRAINT fk_fa_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
    CONSTRAINT fk_fa_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_fa_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
);

-- 5. Create investigations table
CREATE TABLE investigations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE'
    assigned_to VARCHAR(150),
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_alert FOREIGN KEY (alert_id) REFERENCES fraud_alerts(id) ON DELETE CASCADE
);

-- Seed Permission for Fraud Management
INSERT INTO admin_permissions (name, description) VALUES
('Manage Fraud', 'Can view, review, block, freeze, or whitelist for fraud prevention');

-- Map Permission to Roles (SUPER_ADMIN, PLATFORM_ADMIN, OPERATIONS_MANAGER)
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.name IN ('SUPER_ADMIN', 'PLATFORM_ADMIN', 'OPERATIONS_MANAGER') AND p.name = 'Manage Fraud';

-- Create performance indexes
CREATE INDEX idx_fraud_rules_key ON fraud_rules(rule_key);
CREATE INDEX idx_blacklists_type_val ON blacklists(type, item_value);
CREATE INDEX idx_whitelists_type_val ON whitelists(type, item_value);
CREATE INDEX idx_fraud_alerts_status ON fraud_alerts(status);
CREATE INDEX idx_fraud_alerts_risk_level ON fraud_alerts(risk_level);
CREATE INDEX idx_investigations_status ON investigations(status);
