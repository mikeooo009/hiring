Feature: Localize a vehicle

    In order to keep track of where my vehicle is
    As an application user
    I should be able to park or relocate my vehicle in one command

    Background:
        Given today is "2024-06-21"
        And my fleet
        And a vehicle
        And I have registered this vehicle into my fleet

    Scenario: I can relocate my vehicle to a new location
        And a first location
        And my vehicle has been parked at the first location
        And a second location
        When I localize my vehicle at the second location
        Then the known location of my vehicle should verify the second location

    Scenario: Localize parks the vehicle when it has never been parked
        And a location
        When I localize my vehicle at this location
        Then the known location of my vehicle should verify this location
