package com.apexpay.entity.media;

import com.apexpay.entity.BaseEntity;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "media_files")
public class MediaFile extends BaseEntity {

    @NotBlank
    @Column(name = "original_name", nullable = false)
    private String originalName;

    @NotBlank
    @Column(name = "stored_name", nullable = false, unique = true)
    private String storedName;

    @NotBlank
    @Column(name = "mime_type", nullable = false, length = 150)
    private String mimeType;

    @NotBlank
    @Column(name = "extension", nullable = false, length = 50)
    private String extension;

    @NotNull
    @Column(name = "size", nullable = false)
    private Long size;

    @NotBlank
    @Column(name = "checksum", nullable = false, length = 100)
    private String checksum;

    @NotBlank
    @Column(name = "storage_path", nullable = false, length = 512)
    private String storagePath;

    @Column(name = "thumbnail_path", length = 512)
    private String thumbnailPath;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "duration")
    private Integer duration;
}
