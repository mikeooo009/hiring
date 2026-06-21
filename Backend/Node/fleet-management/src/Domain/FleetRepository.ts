import { Fleet } from './Fleet';
import { FleetId } from './FleetId';

export interface FleetRepository {
  findById(id: FleetId): Promise<Fleet | null>;
  save(fleet: Fleet): Promise<void>;
}
