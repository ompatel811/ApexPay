package com.apexpay.service.media;

import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

public interface ThumbnailService {

    String generateThumbnail(MultipartFile file, String storedName);

    Map<String, Integer> extractDimensions(MultipartFile file);
}
