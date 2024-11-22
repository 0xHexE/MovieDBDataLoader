import fs from 'fs/promises';
import path from 'path';

interface WikidataResult {
  results: {
    bindings: {
      item: {
        value: string;
      };
    }[];
  };
}

interface PartOfSeriesResult {
  results: {
    bindings: {
      item: {
        value: string;
        type: string;
      };
      partOfSeries: {
        value: string;
        type: string;
      };
    }[];
  };
}

const CACHE_FILE =
  process.env.CACHE_FILE || path.join(import.meta.dirname, '..');
const CACHE_VALIDITY_MS = 24 * 60 * 60 * 1000;

export async function getSeries(useCache = true) {
  const query = `
    SELECT DISTINCT ?item ?partOfSeries WHERE {
     ?item wdt:P31 wd:Q3464665.
     ?item wdt:P179 ?partOfSeries
    }
  `;

  const result = await runWikiQuery<PartOfSeriesResult>(useCache, query);

  return result.results.bindings.map((res) => {
    const partSeries = res.partOfSeries.value.split('/')[4];
    const value = res.item.value.split('/')[4];

    return {
      id: value,
      partSeries,
    };
  });
}

export async function getAllMovieAndSeriesIds(
  useCache = true,
): Promise<string[]> {
  const query = `
    SELECT DISTINCT ?item WHERE {
        { ?item wdt:P31 wd:Q11424. }
        UNION
        { ?item wdt:P31 wd:Q5398426. }
        UNION
        { ?item wdt:P31 wd:Q117467246. }
        UNION
        { ?item wdt:P31 wd:Q506240. }
        UNION
        { ?item wdt:P31 wd:Q24862. }
        UNION
        { ?item wdt:P31 wd:Q93204. }
        UNION
        { ?item wdt:P31 wd:Q1259759. }
        UNION
        { ?item wdt:P31 wd:Q15416. }
        UNION
        { ?item wdt:P31 wd:Q18011172. }
    }
`;
  const items = await runWikiQuery<WikidataResult>(useCache, query);

  return items.results.bindings
    .map((binding) => binding.item.value)
    .map((res) => res.split('/')[4]);
}

export async function runWikiQuery<T>(
  useCache = true,
  query: string,
): Promise<T> {
  const id = query.length + '';

  if (useCache) {
    const cachedData = await getCachedData<T>(id);
    if (cachedData) {
      console.log('Returning data from cache.' + CACHE_FILE);
      return cachedData;
    }
  }

  console.log('Fetching data from Wikidata.');
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: 'application/sparql-results+json',
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent':
          'Mozilla/5.0 (X11; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Wikidata query failed with status ${response.status}`);
    }

    const items = await response.json();

    await saveDataToCache<T>(id, items);

    return items;
  } catch (error) {
    console.error('Error fetching data from Wikidata:', error);
    throw error;
  }
}

async function getCachedData<T>(id: string): Promise<T | null> {
  try {
    const data = await fs.readFile(
      path.join(CACHE_FILE, `data_${id}.json`),
      'utf-8',
    );
    const { timestamp, ids }: { timestamp: number; ids: T } = JSON.parse(data);

    if (Date.now() - timestamp < CACHE_VALIDITY_MS) {
      return ids;
    } else {
      console.log('Cache expired.');
      return null;
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      console.log('Cache file not found.');
      return null;
    } else {
      console.error('Error reading cache file:', error);
      return null;
    }
  }
}

async function saveDataToCache<T>(id: string, data: T): Promise<void> {
  try {
    await fs.writeFile(
      path.join(CACHE_FILE, `data_${id}.json`),
      JSON.stringify({ timestamp: Date.now(), ids: data }),
    );
    console.log('Data saved to cache.');
  } catch (error) {
    console.error('Error saving data to cache:', error);
  }
}
