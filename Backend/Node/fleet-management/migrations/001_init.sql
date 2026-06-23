CREATE TABLE IF NOT EXISTS fleets (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fleet_vehicles (
    fleet_id VARCHAR(255) NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    plate_number VARCHAR(50) NOT NULL,
    registered_at DATE NOT NULL,
    parked_latitude DOUBLE PRECISION,
    parked_longitude DOUBLE PRECISION,
    parked_on DATE,
    PRIMARY KEY (fleet_id, plate_number)
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_fleet_id
    ON fleet_vehicles (fleet_id);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_location
    ON fleet_vehicles (parked_latitude, parked_longitude)
    WHERE parked_latitude IS NOT NULL;
