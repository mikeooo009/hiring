Feature: Edge cases

    Background:
        Given today is "2024-06-21"
        And my fleet

    Scenario: I can't park a vehicle that is not registered in my fleet
        And a vehicle
        And a location
        When I try to park my vehicle at this location
        Then I should be informed that my vehicle is not registered in this fleet

    Scenario: Vehicle location is unknown when the vehicle has never been parked
        And a vehicle
        And I have registered this vehicle into my fleet
        When I query the location of my vehicle
        Then no location should be known for my vehicle

    Scenario: Plate numbers are normalized
        And a vehicle with plate " abc-123 "
        When I register this vehicle into my fleet
        Then this vehicle with plate "ABC-123" should be part of my fleet

    Scenario: Invalid coordinates are rejected
        When I try to create an invalid location
        Then I should be informed that the location is invalid

    Scenario: I can't access another user's fleet
        And the fleet of another user
        And a vehicle
        And I have registered this vehicle into my fleet
        And a location
        When the intruder tries to park my vehicle at this location
        Then I should be informed that access to the fleet is denied
