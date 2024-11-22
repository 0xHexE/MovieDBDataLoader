export interface WikiItem {
  auxiliary_text: string[];
  category: string[];
  content_model: ContentModel;
  coordinates: Coordinate[];
  create_timestamp: Date;
  external_link: string[];
  heading: string[];
  incoming_links: number;
  language: Language;
  namespace: number;
  namespace_text: string;
  opening_text: null | string;
  outgoing_link: string[];
  page_id: number;
  popularity_score: number;
  redirect: Redirect[];
  source_text: string;
  template: string[];
  text: string;
  text_bytes: number;
  timestamp: Date;
  title: string;
  version: number;
  weighted_tags: string[];
  wiki: Wiki;
  wikibase_item: string;
  defaultsort?: string;
  score?: number;
  display_title?: null;
}

export enum ContentModel {
  Wikitext = "wikitext",
}

export interface Coordinate {
  coord: Coord;
  dim: number;
  globe: string;
  primary: boolean;
  country?: string;
  type?: string;
}

export interface Coord {
  lat: number;
  lon: number;
}

export enum Language {
  En = "en",
}

export interface Redirect {
  namespace: number;
  title: string;
}

export enum Wiki {
  Enwiki = "enwiki",
}
