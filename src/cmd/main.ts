import { client, queryElasticsearchBatched } from '../utils.js';
import { getAllMovieAndSeriesIds } from '../get-list-of-movies-from-wikidata.js';
import { Media } from '../strategy/Media.js';

// @ts-ignore
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const parser = new Media();

const movies = await getAllMovieAndSeriesIds();

await queryElasticsearchBatched(
  movies,
  'en-wiki',
  'wikibase_item.keyword',
  10000,
  async (data) => {
    const movie = data
      .map((item) => {
          return parser.parse(item);
      })
      .flat();

    const operations = movie.flatMap((doc) => [
      { index: { _index: 'temp', _id: doc.id } },
      doc,
    ]);
    await client.bulk({ refresh: true, operations });
  },
);
