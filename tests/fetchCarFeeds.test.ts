import { CAR_SOURCES } from '@/lib/carSources';
import { normalizeFeedItem } from '@/lib/fetchCarFeeds';
import { formatTelegramMessage } from '@/lib/telegram';

describe('normalizeFeedItem', () => {
  it('returns null when title or link is missing', () => {
    const source = CAR_SOURCES[0];
    expect(normalizeFeedItem({ link: 'https://example.com' }, source)).toBeNull();
    expect(normalizeFeedItem({ title: 'Hello world' }, source)).toBeNull();
  });

  it('strips HTML and normalises fields', () => {
    const source = CAR_SOURCES[1];
    const article = normalizeFeedItem(
      {
        title: 'Electric Supra announced',
        link: 'https://example.com/article',
        content: '<p><strong>Bold</strong> move for Toyota</p>'
      },
      source
    );

    expect(article).not.toBeNull();
    expect(article?.summary).toBe('Bold move for Toyota');
    expect(article?.sourceId).toBe(source.id);
    expect(article?.sourceName).toBe(source.name);
  });
});

describe('formatTelegramMessage', () => {
  it('builds markdown-safe list of articles', () => {
    const message = formatTelegramMessage([
      {
        id: '1',
        title: 'Porsche 911 GT3 RS Review',
        summary: '',
        link: 'https://example.com/gt3',
        sourceId: 'motor1',
        sourceName: 'Motor1',
        sourceColor: '#000',
        homepage: 'https://example.com',
        publishedAt: new Date().toISOString()
      }
    ]);

    expect(message).toContain('Automotive Intelligence Briefing');
    expect(message).toContain('[Porsche 911 GT3 RS Review](https://example.com/gt3)');
  });
});
