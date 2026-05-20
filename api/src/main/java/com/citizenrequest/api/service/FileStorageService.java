package com.citizenrequest.api.service;

import org.springframework.web.multipart.MultipartFile;

public interface FileStorageService {

  String storeRequestImage(MultipartFile file);
}
