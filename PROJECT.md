# AI-Assisted Municipal Citizen Request Platform

An AI-assisted web platform for reporting, routing, and tracking municipal issues.

## Overview

The AI-Assisted Municipal Citizen Request Platform is a public-facing web application designed to improve communication between citizens and municipal institutions. Citizens can report local issues such as potholes, broken street lights, overflowing bins, damaged sidewalks, water leaks, or other public-service problems through a simple digital workflow.

Each request includes a description, a location selected on a map or entered as an address, and optional image attachments. After submission, the platform uses AI as an advisory layer to analyze the request, classify and recommend the most appropriate department for handling it. Municipal staff then review the suggestion, confirm or adjust it, and continue the case through its lifecycle.

The platform is designed around two goals:

- **better citizen experience**, through easier reporting and clear status tracking
- **better municipal efficiency**, through smarter intake, assignment, and resolution workflows

It also supports public transparency by allowing non-sensitive issues to be displayed on a public map or list with visible progress updates.

## Problem the application solves

In many cities, reporting public issues is slow, fragmented, and unclear. Citizens often do not know which department is responsible, submissions are misplaced, and there is little visibility into what happens after a complaint is submitted.

This platform addresses that problem by:

- giving citizens a single place to report issues
- using location-based reporting to make submissions more precise
- helping classify requests automatically with AI
- routing requests toward the correct municipal department
- allowing users to track request progress over time
- improving transparency through public status visibility for non-sensitive issues

## What makes this application different

This is not just a form submission system. The application is planned as a full request-management workflow with:

- **citizen reporting** through a map-based interface
- **AI-assisted categorization and routing**
- **municipal back-office processing**
- **status history and accountability tracking**
- **public transparency features**
- **import/export support** for reporting and administration

The AI is intended to be **advisory, not fully autonomous**. It helps staff work faster, but final control remains with human users.

## Core workflow

1. A citizen opens the application and reports a public issue.
2. The request includes a title, description, location, and optional attachments.
3. The system stores the request and runs AI-assisted analysis.
4. AI suggests a department, and priority.
5. Municipal staff review the request and confirm or override the AI result.
6. The request is assigned to the responsible department.
7. Staff update the request as work progresses.
8. The citizen can track the request through its status lifecycle.
9. Non-sensitive requests may also appear publicly on a map or list for transparency.

## Planned status lifecycle

The platform is planned to support a structured lifecycle for service requests:

- New
- In Review
- Assigned
- In Progress
- Resolved
- Closed


This allows the public interface to stay simple while the administrative side remains detailed enough for real municipal operations.

## Main features

### Citizen-facing features

- Account registration and login
- Profile management
- Submission of complaints and service requests
- Location selection using a map or address input
- Optional image and attachment upload
- Tracking of personal requests and updates
- Public browsing of non-sensitive requests
- Filtering and search by status, department, and date

### Municipal back-office features

- Administrative dashboard with request statistics
- Review of incoming requests
- Department assignment and reassignment
- Request editing and lifecycle updates
- Internal notes and comments
- Assignment history and audit trail
- Department management
- Reporting and export tools

### AI-assisted features

- Automatic issue classification
- Suggested department routing
- Structured AI output for consistent processing
- Human review and override of AI recommendations
- Future-ready support for duplicate detection and smarter prioritization

## Planned user roles

The application is designed around multiple user roles:

- **Public visitor** – can browse public, non-sensitive issues
- **Citizen** – can create and track requests
- **Department staff** – can process requests assigned to their department
- **Department supervisor** – can oversee departmental workload and reassignment
- **Administrator** – can manage users, departments, assignments, reports, and system settings

## Example issue categories / departments

The project is intended for a municipal context such as the City of Skopje and may include departments such as:

- Parks and Greenery
- Parking Services
- Roads and Streets
- Public Transport
- Communal Hygiene
- Water and Sewage
- Waste Management
- Animal Welfare

These departments can initially be managed internally and later synchronized with official datasets if needed.

## Public transparency

A major goal of the platform is transparency.

For non-sensitive cases, the public interface may show:

- issue description
- location
- assigned department
- current status
- history of updates

If a request is submitted anonymously or contains sensitive content, personal information is hidden from public view.

## Import and export support

The project also plans to support administrative import/export workflows.

### Import

Administrators can import historical or demo complaints using formats such as:

- CSV
- XLSX

This makes it possible to preload realistic data for dashboards, reports, and demonstrations.

### Export

Planned exports include:

- public filtered CSV exports
- monthly administrative reports
- single-request case exports

These exports are intended to support transparency, auditability, and management reporting.

## Planned interface structure

The application is planned around the following key screens:

- Welcome screen
- Main dashboard with interactive map
- Expanded statistics panel
- Report submission form
- My Reports overview
- Detailed report view
- Administrative back-office dashboard

The overall design goal is to keep the citizen experience simple while providing staff with the detailed operational tools they need.

## Planned technology stack

The current planned stack is:

- **Frontend:** React + TypeScript
- **Backend:** Spring Boot
- **Security / Auth:** Spring Security
- **Database:** PostgreSQL
- **ORM / Persistence:** JPA / Hibernate
- **AI integration:** Spring AI or OpenAI Java SDK
- **Maps / Geolocation:** OpenStreetMap-based geocoding or Google-based geocoding/maps
- **Containerization:** Docker / Docker Compose

## Hosting approach

The project is planned as a containerized application.

### Backend

The backend API is intended to run in Docker containers and be deployable to a cloud-hosted virtual machine or similar environment.

### Frontend

The frontend React application is intended to be built into a production-ready distribution and deployed separately as a static web application.

### Deployment idea

A lightweight initial deployment plan includes:

- backend deployed on a cloud VM
- frontend deployed as a static app
- frontend connected to backend API through a public URL
- optional CI/CD pipeline for future automated deployment

## Why this project matters

This project combines civic technology, workflow automation, and practical AI in a realistic public administration use case. Instead of applying AI in an abstract way, it focuses on improving a real service that people use in everyday life.

By reducing friction for citizens and improving routing for institutions, the platform aims to support:

- faster issue resolution
- clearer communication
- greater public trust
- more organized municipal operations

## Project status

This repository currently represents the **planning and specification stage** of the application.

The goal is to build a functional prototype that demonstrates:

- citizen issue reporting
- municipal workflow management
- AI-assisted classification
- public transparency features
- practical deployment architecture

## Future improvements

Possible future enhancements include:

- mobile-friendly or PWA version
- notification system for citizens and staff
- SLA tracking and overdue-case analytics
- duplicate request detection
- integration with official public datasets
- richer reporting dashboards
- multilingual support
- document and evidence management improvements

## License

This project is currently under development. License details can be added once the implementation phase begins.
