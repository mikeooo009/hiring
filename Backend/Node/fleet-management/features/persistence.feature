Feature: Persistence

    @persistence @critical
    Scenario: I can register a vehicle with postgres
        Given today is "2024-06-21"
        And my fleet
        And a vehicle
        When I register this vehicle into my fleet
        Then this vehicle should be part of my vehicle fleet
        And the registration date of my vehicle should be "2024-06-21"

    @persistence @critical
    Scenario: Successfully park a vehicle with postgres
        Given today is "2024-06-21"
        And my fleet
        And a vehicle
        And I have registered this vehicle into my fleet
        And a location
        When I park my vehicle at this location
        Then the known location of my vehicle should verify this location
        And the parking date of my vehicle should be "2024-06-21"
