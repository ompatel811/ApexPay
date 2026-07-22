-- V13__RealTime_Chat_Messaging.sql
-- Module 16: Real-Time Chat & Messaging Platform Schema

-- 1. Conversations Table
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL, -- PRIVATE, MERCHANT, CUSTOMER_SUPPORT, GROUP
    title VARCHAR(255),
    avatar_url VARCHAR(512),
    last_message_content TEXT,
    last_message_time TIMESTAMP WITHOUT TIME ZONE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- 2. Conversation Participants Table
CREATE TABLE conversation_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'MEMBER', -- MEMBER, ADMIN, SUPPORT_AGENT
    muted BOOLEAN NOT NULL DEFAULT FALSE,
    archived BOOLEAN NOT NULL DEFAULT FALSE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    joined_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    last_read_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_participant_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_participant_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_conversation_user UNIQUE (conversation_id, user_id)
);

-- 3. Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL,
    sender_id UUID NOT NULL,
    message_type VARCHAR(50) NOT NULL DEFAULT 'TEXT', -- TEXT, SYSTEM
    content TEXT NOT NULL,
    reply_to_id UUID,
    edited BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_for_everyone BOOLEAN NOT NULL DEFAULT FALSE,
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    starred BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_message_conversation FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_message_reply FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL
);

-- 4. Message Statuses Table (For tracking delivery and read receipts)
CREATE TABLE message_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    delivered BOOLEAN NOT NULL DEFAULT FALSE,
    delivered_at TIMESTAMP WITHOUT TIME ZONE,
    seen BOOLEAN NOT NULL DEFAULT FALSE,
    seen_at TIMESTAMP WITHOUT TIME ZONE,
    hidden_for_user BOOLEAN NOT NULL DEFAULT FALSE, -- For "Delete for Me"
    CONSTRAINT fk_status_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_status_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_message_user UNIQUE (message_id, user_id)
);

-- 5. Message Reactions Table
CREATE TABLE message_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    user_id UUID NOT NULL,
    reaction VARCHAR(50) NOT NULL, -- e.g. 👍, ❤️, 😂, 😮, 😢, 🙏
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_reaction_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_reaction_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_reaction_message_user UNIQUE (message_id, user_id)
);

-- 6. Blocked Users Table
CREATE TABLE blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    blocked_user_id UUID NOT NULL,
    reason VARCHAR(255),
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_blocked_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_blocked_target FOREIGN KEY (blocked_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT uk_user_blocked_target UNIQUE (user_id, blocked_user_id)
);

-- Performance Indexes
CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conv_created ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_statuses_msg ON message_statuses(message_id);
CREATE INDEX idx_statuses_user ON message_statuses(user_id);
CREATE INDEX idx_reactions_msg ON message_reactions(message_id);
CREATE INDEX idx_blocked_user ON blocked_users(user_id);
