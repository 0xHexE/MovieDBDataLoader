import test from 'node:test';
import { Season } from './Season.js';
import fs from 'node:fs';
import { WikiItem } from '../source.js';

test('Should work on the boys s1', () => {
  const parser = new Season('test');
  const content = fs
    .readFileSync('data/sample/the-boys-season-1.json')
    .toString('utf-8');

  const parsed: WikiItem = JSON.parse(content);

  const items = parser.parse(parsed);
  console.log(items);
});
