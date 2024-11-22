import { WikiItem } from '../source.js';
import { Document } from 'wtf_wikipedia';
import { Entity } from '../entity.js';

export interface ExtraSectionHandler<T = Entity> {
  hasSupport(modules: string[]): boolean;
  extract(data: WikiItem, media: Document): T[];
}
