import { client, queryElasticsearchBatched } from '../utils.js';
import {
  getAllMovieAndSeriesIds,
  getSeries,
} from '../get-list-of-movies-from-wikidata.js';
import { Season } from '../strategy/Season.js';
import { indexes } from '../data/indexes.js';

// @ts-ignore
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const movies = await getSeries();

await queryElasticsearchBatched(
  movies.map((res) => res.id),
  'en-wiki',
  'wikibase_item.keyword',
  10000,
  async (data) => {
    const movie = data
      .map((item) => {
        const series = movies.find((res) => res.id === item.wikibase_item);

        if (!series?.partSeries) {
          throw new Error('Part series not found' + item.wikibase_item);
        }

        const parser = new Season(series?.partSeries);
        return parser.parse(item);
      })
      .flat();

    const operations = movie.flatMap((doc) => [
      { index: { _index: indexes[doc.type], _id: doc.id } },
      doc,
    ]);

    await client.bulk({ refresh: true, operations });
  },
);

console.log(Season.failed, 'Total failed');
