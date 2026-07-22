package com.apexpay.repository.media;

import com.apexpay.entity.media.UploadSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UploadSessionRepository extends JpaRepository<UploadSession, UUID> {

    List<UploadSession> findByUserIdOrderByStartedAtDesc(UUID userId);
}
