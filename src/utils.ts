import elastic from '@elastic/elasticsearch';
import { WikiItem } from './source.js';

interface SearchOptions {
  index: string;
  query: object;
  pageSize?: number;
  maxResults?: number;
}

export const client = new elastic.Client({
  node: process.env.ELASTIC_URL ?? 'https://localhost:9200',
  auth: {
    username: process.env.ELASTIC_USERNAME,
    password: process.env.ELASTIC_PASSWORD,
  },
});

export async function searchAllDocuments(
  options: SearchOptions,
  callback: (item: WikiItem[]) => void,
): Promise<void> {
  const { index, query, pageSize = 1000, maxResults = Infinity } = options;

  let searchAfter: any[] | undefined;
  let totalHitsProcessed = 0;
  let i = 0;

  const count = await client.count({
    query,
    index,
  });

  console.log('Total Items', count.count);

  let count_ = count.count;

  while (true) {
    const response = await client.search<WikiItem>({
      index,
      query,
      size: pageSize,
      _source_excludes: [
        'text',
        'outgoing_link',
        'heading',
        'content_model',
        'auxiliary_text',
      ],
      search_after: searchAfter,
      sort: [{ page_id: 'desc' }],
    });

    count_ -= pageSize;

    console.log(count_, 'Remaining');

    const hits = response.hits.hits;

    if (hits.length === 0) break;

    const processedHits: WikiItem[] = hits.map(
      (hit: { _source: WikiItem }) => hit._source,
    );

    totalHitsProcessed += hits.length;
    if (totalHitsProcessed >= maxResults) break;

    // Use the sort values of the last document for next page
    searchAfter = hits[hits.length - 1].sort;

    console.log(`Running ${i++}`);

    callback(processedHits);
  }
}

export async function queryElasticsearchBatched(
  stringArray: string[],
  indexName: string,
  fieldName: string,
  batchSize = 10000,
  onCallback: (items: WikiItem[]) => PromiseLike<void>,
) {
  let allResults: WikiItem[] = [];
  for (let i = 0; i < stringArray.length; i += batchSize) {
    const batch = stringArray.slice(i, i + batchSize);
    try {
      const { hits } = await client.search<WikiItem[]>({
        index: indexName,
        query: {
          terms: {
            [fieldName]: batch,
          },
        },
        size: 10000,
      });

      await onCallback(
        hits.hits.map((hit: { _source: WikiItem }) => hit._source),
      );
    } catch (error) {
      console.error('Error during Elasticsearch query:', error);
      throw error;
    }
  }
  return allResults;
}
