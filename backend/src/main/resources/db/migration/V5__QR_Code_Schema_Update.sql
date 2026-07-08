-- V5__QR_Code_Schema_Update.sql
-- Modify qr_codes table to store additional payment-related fields

ALTER TABLE qr_codes ADD COLUMN qr_data TEXT;
ALTER TABLE qr_codes ADD COLUMN reference_number VARCHAR(100);
ALTER TABLE qr_codes ADD COLUMN wallet_id UUID;
ALTER TABLE qr_codes ADD COLUMN amount NUMERIC(15, 4);
ALTER TABLE qr_codes ADD COLUMN currency VARCHAR(10);
ALTER TABLE qr_codes ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE';

-- Add constraints
ALTER TABLE qr_codes 
ADD CONSTRAINT fk_qrcode_wallet FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE SET NULL;

-- Add index
CREATE INDEX idx_qrcodes_reference ON qr_codes(reference_number);
