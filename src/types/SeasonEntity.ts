import { Entity } from '../entity.js';

export interface SeasonEntity extends Entity {
  title?: string;
  seasonNumber?: number;
}
