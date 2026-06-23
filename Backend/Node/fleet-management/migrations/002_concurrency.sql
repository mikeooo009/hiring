-- A vehicle can only be parked once across all fleets.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fleet_vehicles_parked_plate
    ON fleet_vehicles (plate_number)
    WHERE parked_latitude IS NOT NULL;

-- A parking spot (rounded to ~0.11 m) can only host one vehicle.
CREATE UNIQUE INDEX IF NOT EXISTS idx_fleet_vehicles_parked_location
    ON fleet_vehicles (
        round(parked_latitude::numeric, 6),
        round(parked_longitude::numeric, 6)
    )
    WHERE parked_latitude IS NOT NULL;
