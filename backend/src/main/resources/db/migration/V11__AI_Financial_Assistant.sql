-- V11__AI_Financial_Assistant.sql
-- Create database schema for Module 14 AI Financial Assistant & Smart Insights

-- 1. Create chat_histories table
CREATE TABLE chat_histories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'USER', 'ASSISTANT'
    message TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_chat_histories_user_id ON chat_histories(user_id);
CREATE INDEX idx_chat_histories_created_at ON chat_histories(created_at);

-- 2. Create financial_insights table
CREATE TABLE financial_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'DAILY', 'WEEKLY', 'MONTHLY', 'SPENDING', 'GENERAL'
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_insight_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_financial_insights_user_id ON financial_insights(user_id);
CREATE INDEX idx_financial_insights_type ON financial_insights(type);

-- 3. Create budget_recommendations table
CREATE TABLE budget_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    category VARCHAR(50) NOT NULL,
    recommended_amount NUMERIC(15, 4) NOT NULL,
    current_spending NUMERIC(15, 4) NOT NULL,
    reasoning TEXT NOT NULL,
    is_applied BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_recommendation_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_budget_recommendations_user_id ON budget_recommendations(user_id);

-- 4. Create financial_scores table
CREATE TABLE financial_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    score INT NOT NULL,
    savings_rate NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    budget_adherence NUMERIC(15, 4) NOT NULL DEFAULT 0.0000,
    bill_payment_history VARCHAR(255) NOT NULL,
    factor_breakdown TEXT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_score_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_financial_scores_user_id ON financial_scores(user_id);
