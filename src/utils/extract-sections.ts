import { WikiItem } from '../source.js';
import { Document } from 'wtf_wikipedia';
import { MediaSection } from '../strategy/Media.js';

const IGNORE_SECTIONS = [
  'Casting',
  'References',
  'External links',
  'Cast',
  'See also',
  '',
];

export function extractSections(_wiki: WikiItem, media: Document): MediaSection[] {
  return media
    .sections()
    .filter((item) => {
      const s = item.title();

      return IGNORE_SECTIONS.indexOf(s) === -1;
    })
    .map((res) => {
      return {
        content: (res.text({}) || res.wikitext() || undefined)?.trim()!,
        originalTitle: res.title(),
        title: res.title(),
      };
    })
    .filter((res) => res.content);
}
