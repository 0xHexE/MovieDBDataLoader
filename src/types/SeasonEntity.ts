import { Entity } from '../entity.js';
import { MediaSection } from './Media.js';

export interface SeasonEntity extends Entity {
  title?: string;
  seasonNumber?: number;
}

export interface EpisodeEntity extends Entity {
  episodeNumber: string;
  episodeNumber2?: string;
  title?: string;
  directedBy?: string;
  writtenBy?: string;
  sections?: MediaSection[];
  originalAirDate?: string;
  shortSummary?: string;
}
