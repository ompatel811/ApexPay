package com.apexpay.service.media.impl;

import com.apexpay.service.media.ThumbnailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class ThumbnailServiceImpl implements ThumbnailService {

    @Override
    public String generateThumbnail(MultipartFile file, String storedName) {
        if (file.getContentType() == null || !file.getContentType().startsWith("image/")) {
            return null;
        }

        try {
            BufferedImage original = ImageIO.read(file.getInputStream());
            if (original == null) return null;

            int targetWidth = 200;
            int targetHeight = (int) (((double) original.getHeight() / original.getWidth()) * targetWidth);

            BufferedImage resized = new BufferedImage(targetWidth, Math.max(1, targetHeight), BufferedImage.TYPE_INT_RGB);
            Graphics2D g = resized.createGraphics();
            g.drawImage(original, 0, 0, targetWidth, targetHeight, null);
            g.dispose();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(resized, "jpg", baos);
            return "/api/media/thumbnail/" + storedName;
        } catch (Exception e) {
            log.error("Failed to generate thumbnail for {}", storedName, e);
            return null;
        }
    }

    @Override
    public Map<String, Integer> extractDimensions(MultipartFile file) {
        Map<String, Integer> dims = new HashMap<>();
        if (file.getContentType() != null && file.getContentType().startsWith("image/")) {
            try {
                BufferedImage original = ImageIO.read(file.getInputStream());
                if (original != null) {
                    dims.put("width", original.getWidth());
                    dims.put("height", original.getHeight());
                }
            } catch (IOException e) {
                log.warn("Could not extract image dimensions", e);
            }
        }
        return dims;
    }
}
