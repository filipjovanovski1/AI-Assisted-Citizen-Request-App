ALTER TABLE service_request ADD COLUMN IF NOT EXISTS created_at TIMESTAMP;

-- Back-fill from the earliest status history entry for existing requests
UPDATE service_request sr
SET created_at = (
    SELECT MIN(h.changed_at)
    FROM request_status_history h
    WHERE h.service_request_id = sr.id
      AND h.changed_at IS NOT NULL
)
WHERE sr.created_at IS NULL;

-- Any request still null (no history yet) defaults to now
UPDATE service_request SET created_at = NOW() WHERE created_at IS NULL;
