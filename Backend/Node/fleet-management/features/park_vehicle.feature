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
        And the parking date of my vehicle should be "2024-06-21"

    Scenario: Parking date is stored from the action date
        And the action date is "2024-06-15"
        And another vehicle registered in my fleet
        And a location
        And the action date is "2024-06-18"
        When I park the other vehicle at this location
        Then the parking date of the other vehicle should be "2024-06-18"

    Scenario: I can't park a vehicle in an unknown fleet
        And an unknown fleet
        And a location
        When I try to park my vehicle in the unknown fleet at this location
        Then I should be informed that the fleet was not found

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

    Scenario: I can't park my vehicle at another location while it is already parked elsewhere
        And a first location
        And my vehicle has been parked at the first location
        And a second location
        When I try to park my vehicle at the second location
        Then I should be informed that my vehicle is already parked at another location

    Scenario: I can't park the same vehicle in two locations at the same time across fleets
        And the fleet of another user
        And this vehicle has been registered into the other user's fleet
        And a first location
        And my vehicle has been parked at the first location
        And a second location
        When I try to park this vehicle in the other fleet at the second location
        Then I should be informed that my vehicle is already parked at another location
