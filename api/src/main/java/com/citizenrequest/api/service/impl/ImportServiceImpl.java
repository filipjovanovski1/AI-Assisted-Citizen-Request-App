package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.RequestStatus;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.domain.User;
import com.citizenrequest.api.domain.UserRole;
import com.citizenrequest.api.dto.request.ImportResultDto;
import com.citizenrequest.api.repository.ServiceRequestRepository;
import com.citizenrequest.api.repository.UserRepository;
import com.citizenrequest.api.service.ImportService;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ImportServiceImpl implements ImportService {

  private final ServiceRequestRepository serviceRequestRepository;
  private final UserRepository userRepository;

  @Override
  @Transactional
  public ImportResultDto importRequests(Long adminId, InputStream csvStream) {
    List<String> errors = new ArrayList<>();
    int imported = 0;
    int totalDataRows = 0;

    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(csvStream, StandardCharsets.UTF_8))) {

      List<String> lines = new ArrayList<>();
      String l;
      while ((l = reader.readLine()) != null) {
        lines.add(l);
      }

      // Detect single-request case export format (starts with "REQUEST CASE EXPORT")
      boolean isCaseExport =
          !lines.isEmpty() && lines.get(0).trim().startsWith("REQUEST CASE EXPORT");

      if (isCaseExport) {
        // Parse Field,Value rows: look for Title, Description, Address, Latitude, Longitude
        String title = null, description = null, address = null;
        Double latitude = null, longitude = null;
        for (String line : lines) {
          String[] parts = line.split(",", 2);
          if (parts.length < 2) continue;
          String field = parts[0].trim();
          String value = csvUnescape(parts[1].trim());
          switch (field) {
            case "Title" -> title = value;
            case "Description" -> description = value;
            case "Address" -> address = value;
            case "Latitude" -> latitude = parseDoubleSafe(value);
            case "Longitude" -> longitude = parseDoubleSafe(value);
          }
        }
        totalDataRows = 1;
        if (title == null || title.isBlank()) {
          errors.add("Row 1: title is required");
        } else if (description == null || description.isBlank()) {
          errors.add("Row 1: description is required");
        } else {
          ServiceRequest request =
              ServiceRequest.builder()
                  .title(title)
                  .description(description)
                  .address(address == null || address.isBlank() ? null : address)
                  .latitude(latitude)
                  .longitude(longitude)
                  .status(RequestStatus.NEW)
                  .build();
          serviceRequestRepository.save(request);
          imported++;
        }
      } else {
        // Standard bulk CSV: title,description,address,latitude,longitude
        boolean firstLine = true;
        for (String line : lines) {
          line = line.trim();
          if (line.isBlank()) continue;
          if (firstLine) {
            firstLine = false;
            if (line.toLowerCase().startsWith("title")) continue;
          }
          totalDataRows++;
          String[] parts = line.split(",", -1);
          String title = parts.length > 0 ? csvUnescape(parts[0].trim()) : "";
          String description = parts.length > 1 ? csvUnescape(parts[1].trim()) : "";
          String address = parts.length > 2 ? csvUnescape(parts[2].trim()) : null;
          Double latitude = parseDoubleSafe(parts.length > 3 ? parts[3].trim() : "");
          Double longitude = parseDoubleSafe(parts.length > 4 ? parts[4].trim() : "");
          if (title.isBlank()) {
            errors.add("Row " + totalDataRows + ": title is required");
            continue;
          }
          if (description.isBlank()) {
            errors.add("Row " + totalDataRows + ": description is required (column 2)");
            continue;
          }
          ServiceRequest request =
              ServiceRequest.builder()
                  .title(title)
                  .description(description)
                  .address(address == null || address.isBlank() ? null : address)
                  .latitude(latitude)
                  .longitude(longitude)
                  .status(RequestStatus.NEW)
                  .build();
          serviceRequestRepository.save(request);
          imported++;
        }
      }
    } catch (IOException e) {
      errors.add("Failed to read CSV file: " + e.getMessage());
    }

    return new ImportResultDto(totalDataRows, imported, totalDataRows - imported, errors);
  }

  /** Strip surrounding quotes and unescape doubled quotes (RFC 4180). */
  private String csvUnescape(String value) {
    if (value == null) return "";
    if (value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) {
      value = value.substring(1, value.length() - 1).replace("\"\"", "\"");
    }
    return value;
  }

  private Double parseDoubleSafe(String value) {
    if (value == null || value.isBlank()) return null;
    try {
      return Double.parseDouble(value);
    } catch (NumberFormatException e) {
      return null;
    }
  }

  @Override
  @Transactional
  public ImportResultDto importDepartmentRequests(Long employeeId, InputStream csvStream) {
    User employee =
        userRepository
            .findById(employeeId)
            .orElseThrow(() -> new RuntimeException("Employee not found."));

    if (employee.getRole() != UserRole.MUNICIPAL_EMPLOYEE) {
      throw new RuntimeException("Only municipal employees can import department requests.");
    }

    if (employee.getDepartment() == null) {
      throw new RuntimeException("Employee is not assigned to a department.");
    }

    List<String> errors = new ArrayList<>();
    int imported = 0;
    int totalDataRows = 0;

    try (BufferedReader reader =
        new BufferedReader(new InputStreamReader(csvStream, StandardCharsets.UTF_8))) {

      List<String> lines = new ArrayList<>();
      String l;
      while ((l = reader.readLine()) != null) {
        lines.add(l);
      }

      // Detect single-request case export format (starts with "REQUEST CASE EXPORT")
      boolean isCaseExport =
          !lines.isEmpty() && lines.get(0).trim().startsWith("REQUEST CASE EXPORT");

      if (isCaseExport) {
        String title = null, description = null, address = null;
        Double latitude = null, longitude = null;
        for (String line : lines) {
          String[] parts = line.split(",", 2);
          if (parts.length < 2) continue;
          String field = parts[0].trim();
          String value = csvUnescape(parts[1].trim());
          switch (field) {
            case "Title" -> title = value;
            case "Description" -> description = value;
            case "Address" -> address = value;
            case "Latitude" -> latitude = parseDoubleSafe(value);
            case "Longitude" -> longitude = parseDoubleSafe(value);
          }
        }
        totalDataRows = 1;
        if (title == null || title.isBlank()) {
          errors.add("Row 1: title is required");
        } else if (description == null || description.isBlank()) {
          errors.add("Row 1: description is required");
        } else {
          ServiceRequest request =
              ServiceRequest.builder()
                  .title(title)
                  .description(description)
                  .address(address == null || address.isBlank() ? null : address)
                  .latitude(latitude)
                  .longitude(longitude)
                  .status(RequestStatus.NEW)
                  .department(employee.getDepartment())
                  .build();
          serviceRequestRepository.save(request);
          imported++;
        }
      } else {
        // Standard bulk CSV: title,description,address,latitude,longitude,...
        boolean firstLine = true;
        for (String line : lines) {
          String trimmed = line.trim();
          if (trimmed.isBlank()) continue;
          if (firstLine) {
            firstLine = false;
            if (trimmed.toLowerCase().startsWith("title")) continue;
          }
          totalDataRows++;
          String[] parts = trimmed.split(",", -1);
          String title = parts.length > 0 ? csvUnescape(parts[0].trim()) : "";
          String description = parts.length > 1 ? csvUnescape(parts[1].trim()) : "";
          String address = parts.length > 2 ? csvUnescape(parts[2].trim()) : null;
          Double latitude = parseDoubleSafe(parts.length > 3 ? parts[3].trim() : "");
          Double longitude = parseDoubleSafe(parts.length > 4 ? parts[4].trim() : "");

          if (title.isBlank()) {
            errors.add("Row " + totalDataRows + ": title is required");
            continue;
          }
          if (description.isBlank()) {
            errors.add("Row " + totalDataRows + ": description is required");
            continue;
          }

          ServiceRequest request =
              ServiceRequest.builder()
                  .title(title)
                  .description(description)
                  .address(address == null || address.isBlank() ? null : address)
                  .latitude(latitude)
                  .longitude(longitude)
                  .status(RequestStatus.NEW)
                  .department(employee.getDepartment())
                  .build();
          serviceRequestRepository.save(request);
          imported++;
        }
      }
    } catch (IOException e) {
      errors.add("Failed to read CSV file: " + e.getMessage());
    }

    return new ImportResultDto(totalDataRows, imported, totalDataRows - imported, errors);
  }
}
