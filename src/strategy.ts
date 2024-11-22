import { Entity } from './entity.js';
import { WikiItem } from './source.js';

export interface Strategy {
  parse(input: WikiItem): Entity | Entity[];
}

export interface StrategyParseResult {
  data: Entity;
  original: WikiItem;
  fetchIds: string[];
}
