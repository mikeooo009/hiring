import { coordinatesEqual } from './coordinates';
import { InvalidLocationError } from './errors/InvalidLocationError';

export class Location {
  constructor(readonly latitude: number, readonly longitude: number) {
    if (latitude < -90 || latitude > 90) {
      throw new InvalidLocationError('Latitude must be between -90 and 90');
    }
    if (longitude < -180 || longitude > 180) {
      throw new InvalidLocationError('Longitude must be between -180 and 180');
    }
  }

  equals(other: Location): boolean {
    return (
      coordinatesEqual(this.latitude, other.latitude) &&
      coordinatesEqual(this.longitude, other.longitude)
    );
  }
}
