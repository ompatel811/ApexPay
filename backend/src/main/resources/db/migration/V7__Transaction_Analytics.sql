-- V7__Transaction_Analytics.sql
-- Add category to transactions table
ALTER TABLE transactions ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'OTHER';

-- Create budgets table
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    amount_limit NUMERIC(15, 4) NOT NULL,
    spent NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    month VARCHAR(7) NOT NULL, -- e.g. YYYY-MM
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_budget_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uq_budget_user_category_month UNIQUE (user_id, category, month)
);

CREATE INDEX idx_budgets_user_id ON budgets(user_id);
CREATE INDEX idx_budgets_user_month ON budgets(user_id, month);

-- Create financial_goals table
CREATE TABLE financial_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    target_amount NUMERIC(15, 4) NOT NULL,
    current_amount NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    target_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_financial_goal_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_financial_goals_user_id ON financial_goals(user_id);

-- Create report_history table
CREATE TABLE report_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    file_path VARCHAR(512),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_report_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_report_history_user ON report_history(user_id);

-- Create statement_history table
CREATE TABLE statement_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    statement_period VARCHAR(50) NOT NULL,
    opening_balance NUMERIC(15, 4) NOT NULL,
    closing_balance NUMERIC(15, 4) NOT NULL,
    credits NUMERIC(15, 4) NOT NULL,
    debits NUMERIC(15, 4) NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_statement_history_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_statement_history_user ON statement_history(user_id);
