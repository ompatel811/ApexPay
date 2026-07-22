package com.apexpay.service.media.impl;

import com.apexpay.exception.BusinessException;
import com.apexpay.service.media.StorageService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Slf4j
@Service
public class StorageServiceImpl implements StorageService {

    private final Path fileStorageLocation;

    public StorageServiceImpl(@Value("${file.upload-dir:./uploads}") String uploadDir) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            throw new BusinessException("Could not create directory for file storage: " + ex.getMessage());
        }
    }

    @Override
    public String storeFile(MultipartFile file, String storedName) {
        try {
            if (file.isEmpty()) {
                throw new BusinessException("Failed to store empty file.");
            }
            Path targetLocation = this.fileStorageLocation.resolve(storedName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            return targetLocation.toString();
        } catch (IOException ex) {
            throw new BusinessException("Could not store file " + storedName + ": " + ex.getMessage());
        }
    }

    @Override
    public InputStream loadFileAsInputStream(String storagePath) {
        try {
            Path path = Paths.get(storagePath);
            return Files.newInputStream(path);
        } catch (IOException ex) {
            throw new BusinessException("File not found or unreadable: " + storagePath + ": " + ex.getMessage());
        }
    }

    @Override
    public Path loadFileAsPath(String storagePath) {
        return Paths.get(storagePath);
    }

    @Override
    public void deleteFile(String storagePath) {
        try {
            Path path = Paths.get(storagePath);
            Files.deleteIfExists(path);
        } catch (IOException ex) {
            log.error("Could not delete file at {}", storagePath, ex);
        }
    }

    @Override
    public String calculateChecksum(MultipartFile file) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(file.getBytes());
            StringBuilder sb = new StringBuilder();
            for (byte b : bytes) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException | IOException ex) {
            return "SHA256-FALLBACK-" + System.currentTimeMillis();
        }
    }
}
