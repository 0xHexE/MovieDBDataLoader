export const indexes: Record<string, string> = {
  media: process.env.MEDIA_INDEX ?? 'media',
  episode: process.env.MEDIA_EPISODE ?? 'episode',
  season: process.env.MEDIA_SEASON ?? 'season',
};
