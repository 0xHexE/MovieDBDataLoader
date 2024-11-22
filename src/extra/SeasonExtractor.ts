import { ExtraSectionHandler } from './ExtraSectionHandler.js';
import { Entity } from '../entity.js';
import { WikiItem } from '../source.js';
import { Document } from 'wtf_wikipedia';
import { SeasonEntity } from '../types/SeasonEntity.js';
import { Episode } from '../types/Episode.js';

export class SeasonExtractor implements ExtraSectionHandler<Entity> {
  seasonSectionTitles = [
    /^Season (\d+)/i, // Matches "Season 1", "Season 2", etc. (case-insensitive)
    /^Series (\d+)/i, // Matches "Series 1", "Series 2", etc. (case-insensitive)
    /^\d+ (season|series)/i, // Matches "1 Season", "2 Series", etc. (case-insensitive)
  ];

  hasSupport(modules: string[]) {
    const supported = ['Module:Episode table/styles.css'];

    return (
      modules.findIndex((item) => {
        return supported.indexOf(item) !== -1;
      }) !== -1
    );
  }

  extract(data: WikiItem, media: Document): Entity[] {
    const entities: Entity[] = [];
    const sections = media.sections();

    for (const section of sections) {
      const seasonNumber = this.getSeasonNumber(section.title());
      if (seasonNumber !== null) {
        const seasonId = `${data.page_id}-${seasonNumber}`;
        const season: SeasonEntity = {
          id: seasonId,
          lang: data.language,
          type: 'season',
          title: section.title(),
          seasonNumber: seasonNumber,
        };

        entities.push(season); // Add season directly to entities

        let currentEpisode: Partial<Episode> = {};

        for (const template of ((
          section.json({}) as never as { templates: { template: string }[] }
        ).templates || [])) {
          if (template.template === 'episode list') {
            currentEpisode = {
              ...currentEpisode,
              ...template,
            };

            const map: Record<string, keyof Episode> = {
              shortsummary: 'shortSummary',
              episodenumber: 'episodeNumber',
              episodenumber2: 'episodeNumber2',
              directedby: 'directedBy',
              writtenby: 'writtenBy',
              originalairdate: 'originalAirDate',
            };

            const deleteColumns = ['c', 'template', 'linecolor'];
            const dateColumns = ['originalAirDate'];

            for (const item in currentEpisode) {
              if (map[item]) {
                // @ts-ignore
                currentEpisode[map[item]] = currentEpisode[item];
                // @ts-ignore
                delete currentEpisode[item];
              }
              if (deleteColumns.indexOf(item) !== -1) {
                // @ts-ignore
                delete currentEpisode[item];
              }
            }

            for (const item in currentEpisode) {
              if (dateColumns.indexOf(item) !== -1) {
                // @ts-ignore
                currentEpisode[item] = new Date(currentEpisode[item]);
              }
            }

            const episode: Episode = currentEpisode as Episode;
            episode.seasonId = seasonId;

            episode.id = `${seasonId}-ep-${episode.episodeNumber}`;
            episode.type = 'episode';

            entities.push(episode);
            currentEpisode = {};
          } else if (
            template.template === 'date' ||
            template.template === 'episode table/part'
          ) {
            currentEpisode = { ...currentEpisode, ...template };
          }
        }
      }
    }
    return entities;
  }

  getSeasonNumber(title: string | undefined): number | null {
    if (!title) return null;

    for (const regex of this.seasonSectionTitles) {
      const match = title.match(regex);
      if (match) {
        // If the regex has a capturing group (e.g., "Season (\d+)"), use that
        if (match.length > 1) {
          return parseInt(match[1], 10);
        } else {
          // Otherwise, just use the whole match (for purely numeric titles)
          return parseInt(match[0], 10);
        }
      }
    }
    return null; // No season match found
  }
}
