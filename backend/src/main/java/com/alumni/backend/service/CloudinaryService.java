package com.alumni.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.Map;
import java.util.Objects;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);

    private final Cloudinary cloudinary;

    public CloudinaryService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
    }

    public String uploadFile(MultipartFile multipartFile, String folderName) {
        try {
            logger.info("Starting Cloudinary upload process for file: {}", multipartFile.getOriginalFilename());
            File file = convertMultiPartToFile(multipartFile);
            logger.debug("Temporary file created at: {}", file.getAbsolutePath());

            Map uploadResult = cloudinary.uploader().upload(file, ObjectUtils.asMap("folder", folderName));
            String secureUrl = uploadResult.get("secure_url").toString();
            logger.info("Cloudinary upload successful. URL: {}", secureUrl);

            boolean isDeleted = file.delete();
            if (!isDeleted) {
                logger.warn("Temporary file could not be deleted after upload: {}", file.getAbsolutePath());
            }
            return secureUrl;
        } catch (IOException e) {
            logger.error("IOException during file conversion or Cloudinary upload for {}: {}", multipartFile.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Image/File upload failed due to I/O error: " + e.getMessage(), e);
        } catch (Exception e) { // Catch any other unexpected exceptions
            logger.error("Unexpected exception during Cloudinary upload for {}: {}", multipartFile.getOriginalFilename(), e.getMessage(), e);
            throw new RuntimeException("Image/File upload failed unexpectedly: " + e.getMessage(), e);
        }
    }

    private File convertMultiPartToFile(MultipartFile file) throws IOException {
        logger.debug("Converting MultipartFile to File: {}", file.getOriginalFilename());
        // Use the system's temporary directory for better permissions handling
        File convFile = new File(System.getProperty("java.io.tmpdir"), Objects.requireNonNull(file.getOriginalFilename()));
        try (FileOutputStream fos = new FileOutputStream(convFile)) {
            fos.write(file.getBytes());
        }
        logger.debug("File converted to: {}", convFile.getAbsolutePath());
        return convFile;
    }
}