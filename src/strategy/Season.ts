import { Entity } from '../entity.js';
import { WikiItem } from '../source.js';
import { Strategy } from '../strategy.js';
// @ts-ignore
import wtf, { Document, Section } from 'wtf_wikipedia';
import { MediaSection } from './Media.js';
import { extractSections } from '../utils/extract-sections.js';
import { SeasonEntity } from '../types/SeasonEntity.js';

export interface EpisodeEntity extends Entity {
  episodeNumber: string;
  episodeNumber2?: string;
  title?: string;
  directedBy?: string;
  writtenBy?: string;
  sections?: MediaSection[];
  originalAirDate?: string;
  shortSummary?: string;
}

export class Season implements Strategy {
  constructor(private parentId: string) {}

  static failed = 0;

  private createEmptyEpisodes(
    number: number,
    seasonNumber: number,
    input: WikiItem,
  ): EpisodeEntity[] {
    return Array.from({ length: number }).map((_, index) => {
      return {
        episodeNumber: index.toString(),
        id: `${this.parentId}-${seasonNumber}-ep-${index + 1}`,
        type: 'episode',
        lang: input.language,
        parentId: this.parentId + '-' + seasonNumber,
      } satisfies EpisodeEntity;
    });
  }

  private static extractNumbers(text: string = ''): number | undefined {
    const numberRegex = /-?\d+(\.\d+)?/g;
    const matches = text.match(numberRegex);

    return matches
      ? matches.map((num) => parseFloat(num)).find((res) => !isNaN(res))
      : undefined;
  }

  parse(input: WikiItem): Entity[] {
    const media = wtf(input.source_text);
    const section = media.section('Episodes') || media.section('Episode list');
    const sectionJson = section?.json();
    let episodes: EpisodeEntity[] = [];

    const infoBox = media.section('')?.infoboxes()?.[0]?.json();

    const seasonNumber: number =
      infoBox?.season_number?.number ??
      Season.extractNumbers(infoBox?.season_number?.text) ??
      1;
    const numEpisodes: number = infoBox?.num_episodes?.number;

    if (!sectionJson) {
      console.warn(
        `No "Episodes" section found or could not parse JSON. ${input.wikibase_item} ${media
          .sections()
          .map((res: Section) => res.title())
          .join(', ')}`,
      );

      if (numEpisodes) {
        const season = {
          parentId: this.parentId,
          type: 'season',
          id: this.parentId + '-' + seasonNumber,
          lang: input.language,
          seasonNumber: seasonNumber,
          title: seasonNumber?.toString(),
        } satisfies SeasonEntity;

        return [
          season,
          ...this.createEmptyEpisodes(+numEpisodes, seasonNumber, input),
        ];
      }

      Season.failed++;

      return episodes;
    }

    if (!seasonNumber) {
      console.warn(
        `Failed to parse ${input.wikibase_item} no season number ${JSON.stringify(infoBox, null, 4)}`,
      );
      if (numEpisodes) {
        return this.createEmptyEpisodes(+numEpisodes, 1, input);
      }
      Season.failed++;
      return episodes;
    }

    // Extract episodes
    const episodeTemplates = sectionJson.templates?.filter(
      (t: any) =>
        t.template === 'episode list/sublist' ||
        t.template === '#invoke:episode list' ||
        t.template === 'episode list',
    );

    if (episodeTemplates && episodeTemplates.length > 0) {
      episodes = episodeTemplates.map(
        (template: any) =>
          ({
            episodeNumber: template.episodenumber,
            episodeNumber2: template.episodenumber2,
            title: template.title,
            directedBy: template.directedby,
            writtenBy: template.writtenby,
            originalAirDate: template.originalairdate,
            shortSummary: template.shortsummary,
            parentId: this.parentId!,
            sections: extractSections(input, media),
            type: 'episode',
            lang: input.language,
            id: `${this.parentId}-${seasonNumber}-ep-${template.episodenumber}`,
          }) satisfies EpisodeEntity,
      );
    } else {
      console.warn(
        episodeTemplates,
        sectionJson?.templates?.map((res: any) => res.template),
        JSON.stringify(sectionJson, null, 4),
      );
      console.warn('No episode data found in the "Episodes" section.');
      Season.failed++;
    }

    return episodes;
  }
}
