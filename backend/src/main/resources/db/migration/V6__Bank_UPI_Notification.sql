-- V6__Bank_UPI_Notification.sql
-- Add branch and masked_account_number to bank_accounts table
ALTER TABLE bank_accounts ADD COLUMN branch VARCHAR(150);
ALTER TABLE bank_accounts ADD COLUMN masked_account_number VARCHAR(100);

-- Create UPI IDs table
CREATE TABLE upi_ids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    upi_id VARCHAR(100) NOT NULL UNIQUE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_upi_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_upi_ids_user_id ON upi_ids(user_id);
CREATE INDEX idx_upi_ids_upi_id ON upi_ids(upi_id);

-- Create UPI Requests (Collect) table
CREATE TABLE upi_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL,
    payer_id UUID NOT NULL,
    requester_upi VARCHAR(100) NOT NULL,
    payer_upi VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 4) NOT NULL,
    remarks VARCHAR(255),
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_upi_request_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_upi_request_payer FOREIGN KEY (payer_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_upi_requests_requester ON upi_requests(requester_id);
CREATE INDEX idx_upi_requests_payer ON upi_requests(payer_id);
