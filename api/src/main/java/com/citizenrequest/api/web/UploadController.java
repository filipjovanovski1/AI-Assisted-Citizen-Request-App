package com.citizenrequest.api.web;

import com.citizenrequest.api.dto.upload.UploadedImageDto;
import com.citizenrequest.api.service.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {

  private final FileStorageService fileStorageService;

  @PostMapping("/request-image")
  public UploadedImageDto uploadRequestImage(@RequestParam("file") MultipartFile file) {
    return new UploadedImageDto(fileStorageService.storeRequestImage(file));
  }
}
