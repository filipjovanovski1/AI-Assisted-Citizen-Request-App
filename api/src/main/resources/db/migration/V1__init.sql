CREATE TABLE department (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description VARCHAR(255),
    contact_email VARCHAR(255)
);

CREATE TABLE "user" (
    id            BIGSERIAL PRIMARY KEY,
    embg          VARCHAR(255) UNIQUE,
    role          VARCHAR(50),
    username      VARCHAR(255) NOT NULL UNIQUE,
    first_name    VARCHAR(255),
    last_name     VARCHAR(255),
    password      VARCHAR(255),
    department_id BIGINT REFERENCES department (id)
);

CREATE TABLE service_request (
    id                   BIGSERIAL PRIMARY KEY,
    title                VARCHAR(50)  NOT NULL,
    status               VARCHAR(50),
    description          VARCHAR(300) NOT NULL,
    citizen_id           BIGINT REFERENCES "user" (id),
    address              VARCHAR(255),
    latitude             DOUBLE PRECISION,
    longitude            DOUBLE PRECISION,
    image_url            VARCHAR(255),
    department_id        BIGINT REFERENCES department (id),
    anonymous_submission BOOLEAN,
    guest_display_name   VARCHAR(255)
);

CREATE TABLE ai_triage_result (
    id                    BIGSERIAL PRIMARY KEY,
    service_request_id    BIGINT NOT NULL REFERENCES service_request (id),
    suggested_department_id BIGINT REFERENCES department (id),
    confidence            DOUBLE PRECISION,
    admin_revised         BOOLEAN,
    accepted              BOOLEAN,
    misclassification     BOOLEAN
);

CREATE TABLE request_comment (
    id         BIGSERIAL PRIMARY KEY,
    body       TEXT   NOT NULL,
    request_id BIGINT NOT NULL REFERENCES service_request (id),
    author_id  BIGINT NOT NULL REFERENCES "user" (id)
);

CREATE TABLE request_status_history (
    id                 BIGSERIAL PRIMARY KEY,
    service_request_id BIGINT NOT NULL REFERENCES service_request (id),
    old_status         VARCHAR(50),
    new_status         VARCHAR(50),
    old_department_id  BIGINT REFERENCES department (id),
    new_department_id  BIGINT REFERENCES department (id),
    changed_by_id      BIGINT REFERENCES "user" (id),
    note               VARCHAR(255),
    changed_at         TIMESTAMP
);

CREATE TABLE request_vote (
    id         BIGSERIAL PRIMARY KEY,
    request_id BIGINT NOT NULL REFERENCES service_request (id),
    user_id    BIGINT NOT NULL REFERENCES "user" (id),
    UNIQUE (user_id, request_id)
);
