import test, { it } from 'node:test';
// @ts-ignore
import wtf from 'wtf_wikipedia';
import fs from 'node:fs';
import { WikiItem } from '../source.js';
import { SeasonExtractor } from './SeasonExtractor.js';

test('should handle archane', () => {
  const content = fs.readFileSync('data/sample/archane.json').toString('utf-8');
  const wiki: WikiItem = JSON.parse(content);

  const doc = wtf(wiki.source_text);

  const data = new SeasonExtractor();
  const item = data.extract(wiki, doc);

  console.log(JSON.stringify(item, null, 4));
});

test('should handle boys', () => {
  const content = fs
    .readFileSync('data/sample/the-boys.json')
    .toString('utf-8');
  const wiki: WikiItem = JSON.parse(content);

  const doc = wtf(wiki.source_text);

  const data = new SeasonExtractor();
  const item = data.extract(wiki, doc);

  console.log(JSON.stringify(item, null, 4));
});
