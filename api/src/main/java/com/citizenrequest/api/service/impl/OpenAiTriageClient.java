package com.citizenrequest.api.service.impl;

import com.citizenrequest.api.domain.Department;
import com.citizenrequest.api.domain.ServiceRequest;
import com.citizenrequest.api.dto.ai.AiDepartmentPrediction;
import com.citizenrequest.api.service.AiTriageClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import java.util.List;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@Primary
public class OpenAiTriageClient implements AiTriageClient {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Value("${ai.openai.api-key:}")
  private String apiKey;

  @Value("${ai.openai.model:gpt-4o-mini}")
  private String model;

  @Override
  public AiDepartmentPrediction classify(
      ServiceRequest request, List<Department> availableDepartments) {
    if (availableDepartments == null || availableDepartments.isEmpty()) {
      throw new RuntimeException("No departments available for AI triage.");
    }

    if (apiKey == null || apiKey.isBlank()) {
      log.warn("OpenAI API key not configured, falling back to first department.");
      return new AiDepartmentPrediction(availableDepartments.get(0).getId(), 0.0);
    }

    String departmentList =
        availableDepartments.stream()
            .map(
                d -> {
                  String entry = "- \"" + d.getName() + "\"";
                  if (d.getDescription() != null && !d.getDescription().isBlank()) {
                    entry += " (" + d.getDescription() + ")";
                  }
                  return entry;
                })
            .collect(Collectors.joining("\n"));

    String systemPrompt =
        "You are a municipal service dispatcher. Your ONLY task is to pick one department from the exact list provided. "
            + "You MUST choose a department name EXACTLY as it appears in the list. Do NOT invent or rephrase names. "
            + "Respond with ONLY a JSON object — no markdown, no code fences, no explanation. "
            + "Format: {\"departmentName\": \"<exact name from list>\", \"confidence\": <decimal 0.0-1.0>}";

    String userPrompt =
        String.format(
            """
            AVAILABLE DEPARTMENTS (use the exact name as written):
            %s

            Citizen complaint:
            Title: %s
            Description: %s
            """,
            departmentList, request.getTitle(), request.getDescription());

    try {
      OpenAIClient client = OpenAIOkHttpClient.builder().apiKey(apiKey).build();

      ChatCompletionCreateParams params =
          ChatCompletionCreateParams.builder()
              .model(model)
              .temperature(0.0)
              .addSystemMessage(systemPrompt)
              .addUserMessage(userPrompt)
              .build();

      ChatCompletion completion = client.chat().completions().create(params);

      String text = completion.choices().get(0).message().content().orElse("").trim();

      return parseResponse(text, availableDepartments);
    } catch (Exception e) {
      log.warn("OpenAI triage failed, falling back to first department: {}", e.getMessage());
      return new AiDepartmentPrediction(availableDepartments.get(0).getId(), 0.0);
    }
  }

  private AiDepartmentPrediction parseResponse(String text, List<Department> availableDepartments) {
    try {
      // Strip any markdown code fences if present
      text = text.replaceAll("(?s)```(?:json)?\\s*", "").trim();

      JsonNode parsed = objectMapper.readTree(text);
      String departmentName = parsed.path("departmentName").asText().trim();
      double confidence = parsed.path("confidence").asDouble(0.5);

      // Exact match (case-insensitive)
      return availableDepartments.stream()
          .filter(d -> d.getName().equalsIgnoreCase(departmentName))
          .findFirst()
          // Fuzzy fallback
          .or(
              () ->
                  availableDepartments.stream()
                      .filter(
                          d ->
                              d.getName().toLowerCase().contains(departmentName.toLowerCase())
                                  || departmentName
                                      .toLowerCase()
                                      .contains(d.getName().toLowerCase()))
                      .findFirst())
          .map(d -> new AiDepartmentPrediction(d.getId(), confidence))
          .orElseGet(
              () -> {
                log.warn(
                    "AI returned unknown department '{}', falling back to first.", departmentName);
                return new AiDepartmentPrediction(availableDepartments.get(0).getId(), 0.0);
              });
    } catch (Exception e) {
      log.warn("Failed to parse OpenAI response, falling back: {}", e.getMessage());
      return new AiDepartmentPrediction(availableDepartments.get(0).getId(), 0.0);
    }
  }
}
