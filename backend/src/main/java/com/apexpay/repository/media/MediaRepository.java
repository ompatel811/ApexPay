package com.apexpay.repository.media;

import com.apexpay.entity.media.MediaFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MediaRepository extends JpaRepository<MediaFile, UUID> {

    Optional<MediaFile> findByStoredName(String storedName);

    List<MediaFile> findByOriginalNameContainingIgnoreCase(String name);

    @Query("SELECT mf FROM MediaFile mf WHERE LOWER(mf.originalName) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(mf.extension) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<MediaFile> searchMedia(@Param("query") String query);
}
