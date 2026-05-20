package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.service.FileStorageService;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageServiceImpl implements FileStorageService {

  private static final long MAX_IMAGE_SIZE_BYTES = 5L * 1024 * 1024;
  private static final Set<String> ALLOWED_EXTENSIONS =
      Set.of(".jpg", ".jpeg", ".png", ".gif", ".webp");

  @Value("${app.upload-dir}")
  private String uploadDir;

  @Override
  public String storeRequestImage(MultipartFile file) {
    validateImage(file);

    String extension = resolveExtension(file.getOriginalFilename());
    String filename = UUID.randomUUID() + extension;

    Path requestImagesDirectory =
        Paths.get(uploadDir).toAbsolutePath().normalize().resolve("requests");

    try {
      Files.createDirectories(requestImagesDirectory);
      Path targetPath = requestImagesDirectory.resolve(filename).normalize();

      try (InputStream inputStream = file.getInputStream()) {
        Files.copy(inputStream, targetPath, StandardCopyOption.REPLACE_EXISTING);
      }
    } catch (IOException e) {
      throw new RuntimeException("Failed to store uploaded image.", e);
    }

    return "/uploads/requests/" + filename;
  }

  private void validateImage(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new RuntimeException("Please select an image to upload.");
    }

    if (file.getSize() > MAX_IMAGE_SIZE_BYTES) {
      throw new RuntimeException("Image must be 5 MB or smaller.");
    }

    String contentType = file.getContentType();
    if (contentType == null || !contentType.startsWith("image/")) {
      throw new RuntimeException("Only image uploads are allowed.");
    }

    String extension = resolveExtension(file.getOriginalFilename());
    if (!ALLOWED_EXTENSIONS.contains(extension)) {
      throw new RuntimeException("Supported image types are JPG, PNG, GIF, and WebP.");
    }
  }

  private String resolveExtension(String originalFilename) {
    if (originalFilename == null || originalFilename.isBlank()) {
      throw new RuntimeException("Uploaded image must have a filename.");
    }

    int lastDotIndex = originalFilename.lastIndexOf('.');
    if (lastDotIndex < 0 || lastDotIndex == originalFilename.length() - 1) {
      throw new RuntimeException("Uploaded image must include a file extension.");
    }

    return originalFilename.substring(lastDotIndex).toLowerCase();
  }
}
