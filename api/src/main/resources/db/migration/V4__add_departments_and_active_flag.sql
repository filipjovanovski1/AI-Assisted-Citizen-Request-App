-- Add active flag to department table
ALTER TABLE department ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;

-- Insert missing departments from spec (idempotent)
INSERT INTO department (name, description, contact_email, active)
SELECT 'Parks and Greenery', 'Maintenance of parks, green spaces, and urban vegetation.', 'parks@city.gov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Parks and Greenery');

INSERT INTO department (name, description, contact_email, active)
SELECT 'Parking Services', 'Parking enforcement, parking zones, and parking infrastructure.', 'parking@city.gov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Parking Services');

INSERT INTO department (name, description, contact_email, active)
SELECT 'Public Transport', 'Bus and tram lines, stops, schedules, and public transit issues.', 'transport@city.gov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Public Transport');

INSERT INTO department (name, description, contact_email, active)
SELECT 'Communal Hygiene', 'Street cleaning, public sanitation, and hygiene infrastructure.', 'hygiene@city.gov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Communal Hygiene');

INSERT INTO department (name, description, contact_email, active)
SELECT 'Animal Welfare', 'Stray animals, animal control, and welfare concerns.', 'animals@city.gov', TRUE
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Animal Welfare');

-- Seed staff accounts for new departments (password: parks123)
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000004',
    'MUNICIPAL_EMPLOYEE',
    'parks.officer',
    'Ana',
    'Stojanovic',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3SvWW',
    d.id
FROM department d
WHERE d.name = 'Parks and Greenery'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'parks.officer');

-- Seed staff accounts for new departments (password: parking123)
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000005',
    'MUNICIPAL_EMPLOYEE',
    'parking.officer',
    'Boris',
    'Nikolov',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3SvWW',
    d.id
FROM department d
WHERE d.name = 'Parking Services'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'parking.officer');

-- Seed staff accounts for new departments (password: transport123)
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000006',
    'MUNICIPAL_EMPLOYEE',
    'transport.officer',
    'Ivana',
    'Blazevska',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3SvWW',
    d.id
FROM department d
WHERE d.name = 'Public Transport'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'transport.officer');

-- Seed staff accounts for new departments (password: hygiene123)
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000007',
    'MUNICIPAL_EMPLOYEE',
    'hygiene.officer',
    'Stefan',
    'Dimov',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3SvWW',
    d.id
FROM department d
WHERE d.name = 'Communal Hygiene'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'hygiene.officer');

-- Seed staff accounts for new departments (password: animals123)
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000008',
    'MUNICIPAL_EMPLOYEE',
    'animals.officer',
    'Maja',
    'Ristova',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.ucrm3SvWW',
    d.id
FROM department d
WHERE d.name = 'Animal Welfare'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'animals.officer');
