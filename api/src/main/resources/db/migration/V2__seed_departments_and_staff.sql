INSERT INTO department (name, description, contact_email)
SELECT 'Roads & Streets', 'Maintenance of roads, potholes, and street markings.', 'roads@city.gov'
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Roads & Streets');

INSERT INTO department (name, description, contact_email)
SELECT 'Public Lighting', 'Streetlight maintenance and electrical public infrastructure.', 'lighting@city.gov'
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Public Lighting');

INSERT INTO department (name, description, contact_email)
SELECT 'Waste Management', 'Garbage collection, illegal dumping, and sanitation issues.', 'waste@city.gov'
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Waste Management');

INSERT INTO department (name, description, contact_email)
SELECT 'Water & Sewage', 'Water leaks, sewage overflow, and drainage infrastructure.', 'water@city.gov'
WHERE NOT EXISTS (SELECT 1 FROM department WHERE name = 'Water & Sewage');

-- Default admin account
-- username: admin
-- password: admin123
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000001',
    'ADMIN',
    'admin',
    'System',
    'Admin',
    '$2y$10$cNVjj14l4BBd9eDgrEAeDOmbSv5DxXuMG6gFyy/MLCJ7Z3aJPUoQm',
    NULL
WHERE NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'admin');

-- Department employee: Roads & Streets
-- username: roads.officer
-- password: roads123
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000002',
    'MUNICIPAL_EMPLOYEE',
    'roads.officer',
    'Elena',
    'Petrova',
    '$2y$10$RU2EkjxVtOskmbCdxp///.rWZwGYSCH2wtdwP2Ae.DIKgup98mtJC',
    d.id
FROM department d
WHERE d.name = 'Roads & Streets'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'roads.officer');

-- Department employee: Waste Management
-- username: sanitation.officer
-- password: sanitation123
INSERT INTO "user" (embg, role, username, first_name, last_name, password, department_id)
SELECT
    '9000000000003',
    'MUNICIPAL_EMPLOYEE',
    'sanitation.officer',
    'Marko',
    'Iliev',
    '$2y$10$QGeryx/FyYTCMNHsfhUvO.cahSy6YlmQHPOc9tFNft5b6miYBPWcm',
    d.id
FROM department d
WHERE d.name = 'Waste Management'
  AND NOT EXISTS (SELECT 1 FROM "user" WHERE username = 'sanitation.officer');
