package com.apexpay.service.impl;

import com.apexpay.exception.BusinessException;
import com.apexpay.service.QRScannerService;
import com.google.zxing.BinaryBitmap;
import com.google.zxing.MultiFormatReader;
import com.google.zxing.Result;
import com.google.zxing.client.j2se.BufferedImageLuminanceSource;
import com.google.zxing.common.HybridBinarizer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;

@Slf4j
@Service
public class QRScannerServiceImpl implements QRScannerService {

    @Override
    public String decodeQRCodeText(String qrString) {
        if (qrString == null || qrString.trim().isEmpty()) {
            throw new BusinessException("Scanned QR code content is empty.");
        }
        return qrString.trim();
    }

    @Override
    public String decodeQRCodeImage(byte[] imageBytes) throws Exception {
        log.info("Decoding QR Code from uploaded image file. Bytes size: {}", imageBytes.length);
        try {
            ByteArrayInputStream bis = new ByteArrayInputStream(imageBytes);
            BufferedImage bufferedImage = ImageIO.read(bis);
            if (bufferedImage == null) {
                throw new BusinessException("Could not read uploaded image. Make sure it is a valid format.");
            }

            BufferedImageLuminanceSource source = new BufferedImageLuminanceSource(bufferedImage);
            HybridBinarizer binarizer = new HybridBinarizer(source);
            BinaryBitmap bitmap = new BinaryBitmap(binarizer);

            Result result = new MultiFormatReader().decode(bitmap);
            log.info("Successfully decoded QR Code text from image: {}", result.getText());
            return result.getText();
        } catch (Exception e) {
            log.error("Failed to decode QR code from image bytes", e);
            throw new BusinessException("Failed to decode QR code image. Ensure the QR is clear and centered.");
        }
    }
}
