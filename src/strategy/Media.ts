import { Strategy } from '../strategy.js';
// @ts-ignore
import wtf, { Document } from 'wtf_wikipedia';
import { Entity } from '../entity.js';
import { WikiItem } from '../source.js';
import { SeasonExtractor } from '../extra/SeasonExtractor.js';
import { ExtraSectionHandler } from '../extra/ExtraSectionHandler.js';
import { extractSections } from '../utils/extract-sections.js';
import {
  Award,
  ExternalIds,
  MediaEntity,
  MediaMeta,
  MediaType,
  RelatedMedia,
} from '../types/Media.js';

export class Media implements Strategy {
  private static CREW_ROLES = [
    'directed by',
    'produced by',
    'written by',
    'screenplay by',
    'story by',
    'music by',
    'cinematography by',
    'edited by',
  ];

  private static PERSON_LINK_REGEX = /\[\[([^|]+)\|([^\]]+)]]/g;

  private static ExtraSectionHandler: ExtraSectionHandler[] = [
    new SeasonExtractor(),
  ];

  parse(input: WikiItem): Entity[] {
    const media = wtf(input.source_text);

    const items = Media.ExtraSectionHandler.filter((res) =>
      res.hasSupport(input.template),
    )
      .map((res) => {
        return res.extract(input, media);
      })
      .flat();

    return [
      ...items,
      {
        id: input.wikibase_item,
        title: media.title() ?? undefined,
        meta: this.extractMeta(input, media),
        type: 'media',
        externalIds: this.extractExternalIds(input, media),
        links: input.external_link,
        description: media.section('')?.text({}),
        mediaType: this.extractType(input, media),
        sections: extractSections(input, media),
        originalTitle: input.title,
        region:
          this.extractRegion(input)?.map((res) => ({
            continent: res[0],
            region: res[1],
          })) ?? [],
        lang: input.language,
        popularity: {
          wiki: input.popularity_score,
        },
        urls: input.redirect.map((res) => res.title),
        director: this.extractCrew(media, 'directed by'),
        producer: this.extractCrew(media, ['produced by']),
        writer: this.extractCrew(media, [
          'written by',
          'screenplay by',
          'story by',
        ]),
        crew: this.extractCrew(media, Media.CREW_ROLES),
        genre: this.extractGenres(media),
        budget: this.extractBudget(media),
        runningTime: this.extractRunningTime(media),
        plotSummary: this.extractPlotSummary(media),
        awards: this.extractAwards(media),
        relatedMedia: this.extractRelatedMedia(media),
        posterImage: this.extractPosterImage(media),
        trailers: this.extractTrailers(input),
      } as MediaEntity,
    ];
  }

  private extractPosterImage(media: Document): string | undefined {
    let image = JSON.stringify(
      (media.infobox()?.get('image') as Document)?.json(),
    );

    if (image) {
      const fileMatch = image.match(/File:(.+)/);
      if (fileMatch) {
        const fileName = fileMatch[1];
        return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replace('%20', '_')}`;
      }
    }

    // If not in infobox, try the "Images" section
    const imagesSection = media
      .sections()
      .find((s) => s.title()?.toLowerCase() === 'images');
    if (imagesSection) {
      const fileLinks = imagesSection.wikitext().match(/File:([^|]+)/g);
      if (fileLinks && fileLinks.length > 0) {
        const fileName = fileLinks[0].substring(5); // Remove "File:" prefix
        return `https://en.wikipedia.org/wiki/Special:FilePath/${encodeURIComponent(fileName).replace('%20', '_')}`;
      }
    }
    return undefined;
  }

  private extractTrailers(wiki: WikiItem): string[] {
    const trailers: string[] = [];

    // Look for trailers in external links
    for (const link of wiki.external_link) {
      const lowerCaseLink = link.toLowerCase();
      if (
        lowerCaseLink.includes('trailer') ||
        lowerCaseLink.includes('preview') ||
        lowerCaseLink.includes('youtube') ||
        lowerCaseLink.includes('vimeo')
      ) {
        trailers.push(link);
      }
    }
    const media = wtf(wiki.source_text);
    const infobox = media.infobox();
    if (infobox) {
      const trailer = infobox.get('trailer')?.links(0).href;
      if (trailer) {
        trailers.push(trailer);
      }
    }

    return trailers;
  }

  private extractRegion(item: WikiItem) {
    return item.weighted_tags
      ?.filter((res) =>
        res?.startsWith('classification.ores.articletopic/Geography.Regions'),
      )
      ?.map((res) => {
        return res
          .replace('classification.ores.articletopic/Geography.Regions', '')
          .replaceAll('*', '')
          .split('|')?.[0]
          ?.split('.')
          .filter((res) => Boolean(res));
      });
  }

  private extractCrew(media: Document, roles: string | string[]): string[] {
    const infobox = media.infobox();
    if (!infobox) return [];

    const crew: string[] = [];
    const rolesArray = Array.isArray(roles) ? roles : [roles];

    rolesArray.forEach((role) => {
      const data = infobox.get(role) as Document;
      if (data) {
        const value = data.text();
        if (value) {
          // Handle cases with multiple people separated by commas or line breaks
          const people = value
            .split(/[,<br>]|\n/)
            .map((p) => p.trim())
            .filter((p) => p);
          crew.push(...people);
        }
      }
    });

    // Remove any wiki markup and handle cases like "and" or "&"
    return crew.flatMap((person) => {
      // Match and extract both link text and display text if available
      const matches = [...person.matchAll(Media.PERSON_LINK_REGEX)];
      if (matches.length > 0) {
        return matches.map((match) => match[2].trim()); // Use display text from the link
      }
      // If no links, just clean up the text and handle conjunctions
      return person
        .split(/\s*(?:and|&)\s*/)
        .map((p) => p.trim())
        .filter((p) => p);
    });
  }

  private extractGenres(media: Document): string[] {
    const infobox = media.infobox();
    if (!infobox) return [];

    const genreData = infobox.get('genre');
    if (!genreData) return [];

    const genreText = (genreData as Document).text();
    if (!genreText) return [];

    return genreText
      .split(/[,&]|\n/)
      .map((g) => g.trim().replace(/\[\[|]]/g, ''))
      .filter((g) => g);
  }

  private extractBudget(media: Document): string | undefined {
    const infobox = media.infobox();
    if (!infobox) return undefined;

    const budgetData = infobox.get('budget');
    return (budgetData as Document)?.text() || undefined;
  }

  private extractRunningTime(media: Document): string | undefined {
    const infobox = media.infobox();
    if (!infobox) return undefined;

    const runningTimeData = infobox.get('runtime');
    if (runningTimeData) {
      return (runningTimeData as Document)?.text() || undefined;
    }

    const runningTimeData2 = infobox.get('running_time');
    return (runningTimeData2 as Document)?.text() || undefined;
  }

  private extractPlotSummary(media: Document): string | undefined {
    const section = media.section(''); // Assuming plot summary is in the lead section
    if (!section) return undefined;

    // Try to get the first paragraph as the plot summary
    const firstParagraph = section.paragraphs();
    const obj = Array.isArray(firstParagraph)
      ? firstParagraph[0]
      : firstParagraph;

    if (obj) {
      return obj.text();
    }

    return section?.text({}) || undefined;
  }

  private extractAwards(media: Document): Award[] {
    const awardsSection = media
      .sections()
      .find((s) => s.title()?.toLowerCase() === 'awards');
    if (!awardsSection) return [];

    const awards: Award[] = [];
    const templates = awardsSection.templates();

    (Array.isArray(templates) ? templates : [templates]).forEach((template) => {
      if (template.template === 'award') {
        const award: Award = {
          name: template.name || '',
          nameIds: [], // You'd need to extract these from the template if available
          nominee: template.nominee || '',
          nomineeIds: [], // Similarly, extract if available
          result: template.result || '',
        };
        awards.push(award);
      }
    });
    return awards;
  }

  private extractRelatedMedia(media: Document): RelatedMedia | undefined {
    const relatedMedia: RelatedMedia = {};
    const infobox = media.infobox();

    if (!infobox) {
      return undefined;
    }

    const followedBy = (infobox.get('followed_by') as Document)?.text();
    if (followedBy) {
      relatedMedia.followedBy = followedBy.replace(/\[\[|]]/g, '');
    }

    const precededBy = (infobox.get('preceded_by') as Document)?.text();
    if (precededBy) {
      relatedMedia.precededBy = precededBy.replace(/\[\[|]]/g, '');
    }

    return Object.keys(relatedMedia).length > 0 ? relatedMedia : undefined;
  }

  private extractMeta(_input: WikiItem, media: Document): MediaMeta {
    const infobox = media.infobox();
    if (!infobox) {
      return {};
    }
    const meta: MediaMeta = {};
    const objectItem = infobox.json() as Record<
      string,
      {
        text: string;
        number?: number;
        links?: {
          type: 'internal';
          page: string;
          text: string;
        }[];
      }
    >;

    Object.keys(objectItem).forEach((item) => {
      const text = objectItem[item].text.split('\n').map((item) => {
        if (item.startsWith('*')) {
          return item.substring(1);
        }
        return item;
      });

      let date: Date | undefined = undefined;

      if (text.length === 0) {
        const _date = Date.parse(text[0]);

        if (_date !== Infinity) {
          date = new Date(_date);
        }
      }

      if (item === 'caption' && meta.image) {
        // @ts-expect-error this is error happening
        meta.image['caption'] = text[0];
      } else {
        meta[item] = {
          text,
          date,
          links: objectItem[item].links?.map((res) => ({
            ...res,
            type: undefined,
          })),
          number: objectItem[item].number,
        };
      }
    });

    return meta;
  }

  private extractExternalIds(wiki: WikiItem, _media: Document): ExternalIds {
    const data: ExternalIds = {};

    const imdb = wiki.external_link.find(
      (res: string) =>
        res.startsWith('https://www.imdb.com/title') ||
        res.startsWith('https://imdb.com/title'),
    );

    if (imdb) {
      data['imdbID'] = new URL(imdb).pathname.split('/')[2];
    }

    const allMovie = wiki.external_link.find((res) =>
      res.startsWith('https://www.allmovie.com/'),
    );

    if (allMovie) {
      data.allmovieID = new URL(
        'https://www.allmovie.com/movie/v412810',
      ).pathname.split('/')[2];
    }

    const tvguide = wiki.external_link.find((res) =>
      res.startsWith('https://www.tvguide.com/tvshows/ghost-cat/286823'),
    );

    if (tvguide) {
      data.tvguide = new URL(tvguide).pathname;
    }

    return data;
  }

  private extractType(wiki: WikiItem, _media: Document): MediaType {
    const isTV = wiki.weighted_tags?.find((res) =>
      res.startsWith(
        'classification.ores.articletopic/Culture.Media.Television',
      ),
    );

    if (isTV) {
      return MediaType.SERIES;
    }

    return MediaType.MOVIE;
  }
}
