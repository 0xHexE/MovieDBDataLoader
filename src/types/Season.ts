import { Entity } from '../entity.js';

export interface Season extends Entity {
  title?: string;
  seasonNumber?: number;
}
