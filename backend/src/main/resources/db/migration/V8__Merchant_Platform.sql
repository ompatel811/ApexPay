-- V8__Merchant_Platform.sql
-- Create database schema for Module 11 Merchant Platform

-- 1. Create merchant_roles table
CREATE TABLE merchant_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE
);

-- Seed merchant roles
INSERT INTO merchant_roles (name) VALUES ('MERCHANT_OWNER'), ('MERCHANT_ADMIN'), ('MANAGER'), ('CASHIER'), ('VIEWER');

-- 2. Create merchants table
CREATE TABLE merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    business_type VARCHAR(100) NOT NULL,
    business_email VARCHAR(150) NOT NULL UNIQUE,
    business_mobile VARCHAR(20) NOT NULL UNIQUE,
    gst_number VARCHAR(50) UNIQUE,
    pan_number VARCHAR(50) UNIQUE,
    owner_id UUID NOT NULL,
    business_address TEXT NOT NULL,
    business_logo VARCHAR(512),
    verification_status VARCHAR(50) NOT NULL,
    rejected_reason VARCHAR(512),
    approved_date TIMESTAMP WITHOUT TIME ZONE,
    pan_upload VARCHAR(512),
    gst_upload VARCHAR(512),
    business_proof VARCHAR(512),
    identity_proof VARCHAR(512),
    address_proof VARCHAR(512),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_merchant_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Create merchant_wallets table
CREATE TABLE merchant_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL UNIQUE,
    wallet_number VARCHAR(50) NOT NULL UNIQUE,
    balance NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    wallet_status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_merchant_wallet_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

-- 4. Create merchant_employees table
CREATE TABLE merchant_employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_merchant_employee_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    CONSTRAINT fk_merchant_employee_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_merchant_employee_role FOREIGN KEY (role_id) REFERENCES merchant_roles(id),
    CONSTRAINT uq_merchant_employee UNIQUE (merchant_id, user_id)
);

-- 5. Create payment_links table
CREATE TABLE payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(15, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    expiry TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    description VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    customer_email VARCHAR(150),
    customer_mobile VARCHAR(20),
    transaction_id UUID,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_payment_link_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_link_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
);

-- 6. Create refunds table
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    transaction_id UUID NOT NULL,
    amount NUMERIC(15, 4) NOT NULL,
    reason VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    rejected_reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_refund_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE,
    CONSTRAINT fk_refund_transaction FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
);

-- 7. Create settlements table
CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    merchant_id UUID NOT NULL,
    reference_number VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(15, 4) NOT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'USD',
    settlement_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    settled_at TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_settlement_merchant FOREIGN KEY (merchant_id) REFERENCES merchants(id) ON DELETE CASCADE
);

-- Create performance indexes
CREATE INDEX idx_merchants_email ON merchants(business_email);
CREATE INDEX idx_merchants_mobile ON merchants(business_mobile);
CREATE INDEX idx_merchant_wallets_number ON merchant_wallets(wallet_number);
CREATE INDEX idx_payment_links_reference ON payment_links(reference_number);
CREATE INDEX idx_settlements_reference ON settlements(reference_number);
CREATE INDEX idx_refunds_transaction ON refunds(transaction_id);

-- Create foreign key indexes
CREATE INDEX idx_merchants_owner ON merchants(owner_id);
CREATE INDEX idx_merchant_wallets_merchant ON merchant_wallets(merchant_id);
CREATE INDEX idx_merchant_employees_merchant ON merchant_employees(merchant_id);
CREATE INDEX idx_merchant_employees_user ON merchant_employees(user_id);
CREATE INDEX idx_payment_links_merchant ON payment_links(merchant_id);
CREATE INDEX idx_refunds_merchant ON refunds(merchant_id);
CREATE INDEX idx_settlements_merchant ON settlements(merchant_id);
