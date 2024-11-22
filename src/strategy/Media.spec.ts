import test, { it } from 'node:test';
import fs from 'node:fs';
import { Media } from './Media.js';
import { WikiItem } from '../source.js';

test('media test', () => {
  it('should do simple parsing', () => {
    const content = fs
      .readFileSync('data/sample/results.json')
      .toString('utf-8');

    const parsed: WikiItem[] = JSON.parse(content);

    const media = new Media();

    const result = parsed.map((item) => {
      return media.parse(item);
    });

    console.log(
      JSON.stringify(
        result.map((item) => item),
        null,
        4,
      ),
    );
  });
});

test('should extract the archane', () => {
  const content = fs.readFileSync('data/sample/archane.json').toString('utf-8');

  const parsed: WikiItem = JSON.parse(content);

  const media = new Media();

  const result = media.parse(parsed);

  console.log(JSON.stringify(result, null, 4));
});
