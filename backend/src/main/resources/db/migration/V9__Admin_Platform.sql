-- V9__Admin_Platform.sql
-- Create database schema for Module 12 Admin Platform

-- 1. Create admin_permissions table
CREATE TABLE admin_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Seed permissions
INSERT INTO admin_permissions (name, description) VALUES
('Manage Users', 'Can view, suspend, activate, reset passwords, or delete users'),
('Manage Merchants', 'Can view, approve, reject, or suspend merchants and KYC'),
('Manage Wallets', 'Can view, freeze, unfreeze, or adjust wallet balances'),
('Manage Transactions', 'Can view, approve, reverse, or cancel transactions'),
('Manage QR', 'Can view, deactivate, or delete QR codes'),
('Manage Notifications', 'Can view, delete, schedule, or send announcements'),
('Manage Reports', 'Can generate and export system transaction reports'),
('Manage Settings', 'Can modify global settings and limits');

-- 2. Create admin_roles table
CREATE TABLE admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(255)
);

-- Seed roles
INSERT INTO admin_roles (name, description) VALUES
('SUPER_ADMIN', 'Super administrator with full system controls'),
('PLATFORM_ADMIN', 'Platform administrator managing operations and settings'),
('OPERATIONS_MANAGER', 'Manager focused on users, merchants, and wallets'),
('SUPPORT_AGENT', 'Customer support assisting users and transactions'),
('AUDITOR', 'Financial auditor reading logs and reports'),
('READ_ONLY_ADMIN', 'Read-only access across the admin dashboard');

-- 3. Create admin_role_permissions join table
CREATE TABLE admin_role_permissions (
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_arp_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_arp_permission FOREIGN KEY (permission_id) REFERENCES admin_permissions(id) ON DELETE CASCADE
);

-- Associate permissions to roles
-- SUPER_ADMIN & PLATFORM_ADMIN get all permissions
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.name IN ('SUPER_ADMIN', 'PLATFORM_ADMIN');

-- OPERATIONS_MANAGER gets Users, Merchants, Wallets, Transactions, QR, Reports
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.name = 'OPERATIONS_MANAGER' AND p.name IN ('Manage Users', 'Manage Merchants', 'Manage Wallets', 'Manage Transactions', 'Manage QR', 'Manage Reports');

-- SUPPORT_AGENT gets Users, Wallets, Transactions, QR
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.name = 'SUPPORT_AGENT' AND p.name IN ('Manage Users', 'Manage Wallets', 'Manage Transactions', 'Manage QR');

-- AUDITOR gets Reports
INSERT INTO admin_role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM admin_roles r, admin_permissions p
WHERE r.name = 'AUDITOR' AND p.name IN ('Manage Reports');

-- READ_ONLY_ADMIN gets no permissions since all are "Manage" permissions; views are default

-- 4. Create admin_users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Seed a default Super Admin (Password: AdminPassword123!)
INSERT INTO admin_users (id, full_name, username, email, password_hash, status, created_at, updated_at)
VALUES (
    'a3e0b2e7-8b5e-4c7a-9a1b-c6d8e0f1a2b3',
    'ApexPay Super Admin',
    'admin',
    'admin@apexpay.com',
    '$2a$10$tZ921bI0D1J3cEqeI0fFxe4f49sE8J6U4oI45vM8bQeF7tHzeCgqy',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 5. Create admin_user_roles join table
CREATE TABLE admin_user_roles (
    admin_user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    PRIMARY KEY (admin_user_id, role_id),
    CONSTRAINT fk_aur_user FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    CONSTRAINT fk_aur_role FOREIGN KEY (role_id) REFERENCES admin_roles(id) ON DELETE CASCADE
);

-- Assign SUPER_ADMIN role to default admin user
INSERT INTO admin_user_roles (admin_user_id, role_id)
SELECT 'a3e0b2e7-8b5e-4c7a-9a1b-c6d8e0f1a2b3', id FROM admin_roles WHERE name = 'SUPER_ADMIN';

-- 6. Create platform_settings table
CREATE TABLE platform_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_by VARCHAR(150)
);

-- Seed platform settings
INSERT INTO platform_settings (setting_key, setting_value, description, updated_at, updated_by) VALUES
('PLATFORM_NAME', 'ApexPay', 'The name of the digital wallet platform', CURRENT_TIMESTAMP, 'SYSTEM'),
('PLATFORM_LOGO', '/images/logo.png', 'Logo path/URL for the platform header', CURRENT_TIMESTAMP, 'SYSTEM'),
('MAINTENANCE_MODE', 'false', 'Enable/disable platform-wide maintenance mode', CURRENT_TIMESTAMP, 'SYSTEM'),
('TRANSACTION_LIMIT_PER_TX', '50000.00', 'Maximum limit for a single wallet transaction', CURRENT_TIMESTAMP, 'SYSTEM'),
('TRANSACTION_LIMIT_DAILY', '100000.00', 'Maximum total daily limit for wallet transactions', CURRENT_TIMESTAMP, 'SYSTEM'),
('WALLET_LIMIT_MAX_BALANCE', '200000.00', 'Maximum allowed balance inside a user wallet', CURRENT_TIMESTAMP, 'SYSTEM'),
('NOTIFICATION_EMAIL_ENABLED', 'true', 'Enable email delivery for transactions', CURRENT_TIMESTAMP, 'SYSTEM'),
('SECURITY_JWT_EXPIRATION_MS', '900000', 'Access token validity duration in milliseconds', CURRENT_TIMESTAMP, 'SYSTEM');

-- 7. Create system_health table
CREATE TABLE system_health (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cpu_usage NUMERIC(5, 2) NOT NULL,
    memory_usage NUMERIC(5, 2) NOT NULL,
    api_response_time_ms INT NOT NULL,
    database_status VARCHAR(50) NOT NULL,
    redis_status VARCHAR(50) NOT NULL,
    application_health VARCHAR(50) NOT NULL,
    websocket_status VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- Create performance indexes
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_platform_settings_key ON platform_settings(setting_key);
CREATE INDEX idx_system_health_timestamp ON system_health(timestamp);
