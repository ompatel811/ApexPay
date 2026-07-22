# ApexPay Module 18 – Media & File Sharing Platform Architecture

This document presents the detailed architectural specifications, ER diagrams, sequence diagrams, and class diagrams for Module 18: **Media & File Sharing Platform**.

---

## 1. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    users ||--o{ message_attachments : uploads
    users ||--o{ upload_sessions : initiates
    messages ||--o{ message_attachments : attaches
    media_files ||--o{ message_attachments : contains

    media_files {
        UUID id PK
        VARCHAR original_name
        VARCHAR stored_name UK
        VARCHAR mime_type
        VARCHAR extension
        BIGINT size
        VARCHAR checksum
        VARCHAR storage_path
        VARCHAR thumbnail_path
        INT width
        INT height
        INT duration
        TIMESTAMP created_at
        TIMESTAMP updated_at
    }

    message_attachments {
        UUID id PK
        UUID message_id FK
        UUID media_file_id FK
        UUID uploader_id FK
        VARCHAR attachment_type "IMAGE, VIDEO, DOCUMENT, SPREADSHEET, PRESENTATION, ARCHIVE"
        TIMESTAMP created_at
    }

    upload_sessions {
        UUID id PK
        UUID user_id FK
        VARCHAR status "STARTED, IN_PROGRESS, COMPLETED, FAILED"
        INT progress
        TIMESTAMP started_at
        TIMESTAMP completed_at
    }
```

---

## 2. File Upload Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as User Client
    participant Controller as MediaController
    participant UploadSvc as UploadServiceImpl
    participant StorageSvc as StorageServiceImpl
    participant ThumbSvc as ThumbnailServiceImpl
    participant DB as PostgreSQL DB

    User->>Controller: POST /api/media/upload (Multipart file)
    Controller->>UploadSvc: uploadSingleFile(userId, file, conversationId, messageId)
    UploadSvc->>UploadSvc: validateFile(size, mimeType)
    UploadSvc->>StorageSvc: calculateChecksum(file)
    UploadSvc->>StorageSvc: storeFile(file, storedName)
    alt is Image
        UploadSvc->>ThumbSvc: generateThumbnail(file, storedName)
        UploadSvc->>ThumbSvc: extractDimensions(file)
    end
    UploadSvc->>DB: Save MediaFile & MessageAttachment
    UploadSvc->>Controller: Return UploadResponse DTO
    Controller->>User: 201 Created (File URL & Thumbnail)
```
