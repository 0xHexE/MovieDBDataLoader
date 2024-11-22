import { Entity } from '../entity.js';

export interface Episode extends Entity {
  act?: string;
  data?: any;
  episodeNumber: string;
  episodeNumber2: string;
  title: string;
  directedBy: string;
  writtenBy: string;
  originalAirDate: string;
  shortSummary: string;
  linecolor?: string;
  seasonId: string; // Add seasonId
  background?: string;
  overall?: string;
  season?: string;
  director?: string;
  writer?: string;
  airdate?: string;
  released?: string;
}
