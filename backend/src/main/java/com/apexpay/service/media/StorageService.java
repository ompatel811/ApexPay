package com.apexpay.service.media;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Path;

public interface StorageService {

    String storeFile(MultipartFile file, String storedName);

    InputStream loadFileAsInputStream(String storagePath);

    Path loadFileAsPath(String storagePath);

    void deleteFile(String storagePath);

    String calculateChecksum(MultipartFile file);
}
