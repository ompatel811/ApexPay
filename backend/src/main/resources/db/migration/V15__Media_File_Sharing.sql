-- V15__Media_File_Sharing.sql
-- Module 18: Media & File Sharing Platform Schema

-- 1. Media Files Table
CREATE TABLE media_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_name VARCHAR(255) NOT NULL,
    stored_name VARCHAR(255) NOT NULL UNIQUE,
    mime_type VARCHAR(150) NOT NULL,
    extension VARCHAR(50) NOT NULL,
    size BIGINT NOT NULL,
    checksum VARCHAR(100) NOT NULL,
    storage_path VARCHAR(512) NOT NULL,
    thumbnail_path VARCHAR(512),
    width INT,
    height INT,
    duration INT,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL
);

-- 2. Message Attachments Table
CREATE TABLE message_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message_id UUID NOT NULL,
    media_file_id UUID NOT NULL,
    uploader_id UUID NOT NULL,
    attachment_type VARCHAR(50) NOT NULL, -- IMAGE, VIDEO, DOCUMENT, SPREADSHEET, PRESENTATION, ARCHIVE
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    CONSTRAINT fk_att_message FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_media FOREIGN KEY (media_file_id) REFERENCES media_files(id) ON DELETE CASCADE,
    CONSTRAINT fk_att_uploader FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. Upload Sessions Table
CREATE TABLE upload_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'STARTED', -- STARTED, IN_PROGRESS, COMPLETED, FAILED
    progress INT NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITHOUT TIME ZONE NOT NULL,
    completed_at TIMESTAMP WITHOUT TIME ZONE,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Performance Indexes
CREATE INDEX idx_media_mime ON media_files(mime_type);
CREATE INDEX idx_media_ext ON media_files(extension);
CREATE INDEX idx_att_message ON message_attachments(message_id);
CREATE INDEX idx_att_uploader ON message_attachments(uploader_id);
CREATE INDEX idx_session_user ON upload_sessions(user_id);
