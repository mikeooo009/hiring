Feature: Park a vehicle

    In order to not forget where I've parked my vehicle
    As an application user
    I should be able to indicate my vehicle location

    Background:
        Given today is "2024-06-21"
        And my fleet
        And a vehicle
        And I have registered this vehicle into my fleet

    @critical
    Scenario: Successfully park a vehicle
        And a location
        When I park my vehicle at this location
        Then the known location of my vehicle should verify this location

    Scenario: Can't localize my vehicle to the same location two times in a row
        And a location
        And my vehicle has been parked into this location
        When I try to park my vehicle at this location
        Then I should be informed that my vehicle is already parked at this location

    Scenario: I can't park a vehicle with a future date
        And a location
        And the action date is "2024-06-22"
        When I try to park my vehicle at this location
        Then I should be informed that the action date cannot be in the future

    Scenario: I can't park a vehicle before its registration date
        And a location
        And the action date is "2024-06-20"
        When I try to park my vehicle at this location
        Then I should be informed that the action date cannot be before the registration date

    Scenario: I can't park at a location already used by another vehicle in my fleet
        And another vehicle registered in my fleet
        And a location
        And the other vehicle has been parked at this location
        When I try to park my vehicle at this location
        Then I should be informed that this location is already occupied by another vehicle

    Scenario: I can't park at a location already used by a vehicle from another fleet
        And the fleet of another user
        And another vehicle registered in the other fleet
        And a location
        And the other fleet vehicle has been parked at this location
        When I try to park my vehicle at this location
        Then I should be informed that this location is already occupied by another vehicle
