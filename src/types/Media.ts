import { Entity, IdType } from '../entity.js';

export interface MediaEntity extends Entity {
  id: IdType;
  type: 'media';
  title?: string;
  description?: string;
  originalTitle?: string;
  sections: MediaSection[];
  mediaType: MediaType;
  meta: MediaMeta;
  externalIds: ExternalIds;
  links: string[];
  region?: MediaRegion[];
  popularity: MediaPopularity;
  urls: MediaWikiUrls[];
  relatedMedia?: RelatedMedia;
  posterImage?: string;
  trailers?: string[];
  director?: string[];
  producer?: string[];
  writer?: string[];
  crew?: string[];
  starring?: string[];
  genre?: string[];
  budget?: string;
  runningTime?: string;
  plotSummary?: string;
  awards?: Award[];
}

export interface RelatedMedia {
  sequels?: string[];
  prequels?: string[];
  followedBy?: string;
  precededBy?: string;
}

export interface Award {
  name?: string;
  year?: number;
  category?: string;
  result: string;
  recipient?: string;
  nameIds: string[];
  nominee?: string;
  nomineeIds: string[];
}

export type MediaWikiUrls = string;

export interface MediaPopularity {
  wiki?: number;
}

export interface MediaRegion {
  continent: string;
  region: string;
}

export interface ExternalIds {
  imdbID?: string;
  tvguide?: string;
  allmovieID?: string;
}

export interface MediaMeta {
  [record: string]: {
    text?: string[];
    number?: number;
    date?: Date;
    links?: {
      page?: string;
      text?: string;
    }[];
  };
}

export interface MediaSection {
  title: string;
  originalTitle: string;
  content: string;
}

export interface Cast {
  actorId?: string;
  character?: string;
}

export enum MediaType {
  MOVIE = 'movie',
  SERIES = 'series',
  ANIME = 'anime',
  DOCUMENTARY = 'documentary',
  TV_SPECIAL = 'tv-special',
  SHORT_FILM = 'short-film',
}
