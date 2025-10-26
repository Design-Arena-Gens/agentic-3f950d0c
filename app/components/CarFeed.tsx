'use client';

import { useMemo, useState } from 'react';

import type { CarArticle } from '@/lib/types';
import { formatTelegramMessage } from '@/lib/telegram';

import TelegramPanel from './TelegramPanel';

type Props = {
  initialArticles: CarArticle[];
};

const formatDate = (iso: string) => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
};

export default function CarFeed({ initialArticles }: Props) {
  const [articles, setArticles] = useState<CarArticle[]>(initialArticles);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const sourceOptions = useMemo(() => {
    const map = new Map<string, { name: string; color: string }>();
    for (const article of articles) {
      if (!map.has(article.sourceId)) {
        map.set(article.sourceId, {
          name: article.sourceName,
          color: article.sourceColor
        });
      }
    }
    return Array.from(map.entries()).map(([id, value]) => ({ id, ...value }));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      const matchesSearch = searchTerm
        ? article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          article.summary.toLowerCase().includes(searchTerm.toLowerCase())
        : true;
      const matchesSource = selectedSources.length
        ? selectedSources.includes(article.sourceId)
        : true;
      return matchesSearch && matchesSource;
    });
  }, [articles, searchTerm, selectedSources]);

  const selectedArticles = useMemo(() => {
    return articles.filter((article) => selectedIds.has(article.id));
  }, [articles, selectedIds]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      const response = await fetch('/api/sources');
      if (!response.ok) {
        throw new Error('Failed to refresh feeds');
      }
      const data = (await response.json()) as { articles: CarArticle[] };
      setArticles(data.articles);
      setLastUpdated(new Date());
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const toggleSource = (id: string) => {
    setSelectedSources((prev) =>
      prev.includes(id) ? prev.filter((source) => source !== id) : [...prev, id]
    );
  };

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const resetSelection = () => setSelectedIds(new Set());

  return (
    <div className="grid" style={{ gap: '2rem' }}>
      <section className="glass-panel" style={{ padding: '2rem' }}>
        <header style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '2rem' }}>Automotive Intelligence Agent</h1>
              <p className="muted" style={{ marginTop: '0.4rem' }}>
                Aggregated stories from leading automotive publishers. Select highlights and dispatch them directly to your Telegram audience.
              </p>
            </div>
            <button className="button-secondary" onClick={handleRefresh} disabled={isRefreshing}>
              {isRefreshing ? 'Refreshing…' : 'Refresh data'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <input
              type="search"
              placeholder="Search vehicles, brands, or topics…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              {sourceOptions.map((source) => (
                <button
                  key={source.id}
                  type="button"
                  className="pill"
                  style={{
                    borderColor: selectedSources.includes(source.id)
                      ? source.color
                      : 'rgba(148, 163, 184, 0.25)',
                    background: selectedSources.includes(source.id)
                      ? `${source.color}22`
                      : undefined
                  }}
                  onClick={() => toggleSource(source.id)}
                >
                  <span
                    className="source-dot"
                    style={{ backgroundColor: source.color }}
                    aria-hidden
                  />
                  {source.name}
                </button>
              ))}
            </div>
          </div>
          <div className="muted" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span>Stories: {filteredArticles.length}</span>
            <span>Selected: {selectedArticles.length}</span>
            <span>Updated: {formatDate(lastUpdated.toISOString())}</span>
          </div>
          {error ? (
            <div
              style={{
                background: 'rgba(248, 113, 113, 0.12)',
                border: '1px solid rgba(248, 113, 113, 0.4)',
                borderRadius: '0.75rem',
                padding: '0.75rem 1rem',
                color: 'rgba(248, 113, 113, 0.9)'
              }}
            >
              {error}
            </div>
          ) : null}
        </header>
      </section>

      <section className="grid two-columns">
        {filteredArticles.map((article) => (
          <article
            key={article.id}
            className={`card${selectedIds.has(article.id) ? ' selected' : ''}`}
            onClick={() => toggleSelection(article.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                toggleSelection(article.id);
              }
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem' }}>
              <div>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: '1.1rem', fontWeight: 600 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  {article.title}
                </a>
                <p className="muted" style={{ marginTop: '0.5rem' }}>
                  {article.summary || 'No summary available.'}
                </p>
              </div>
              <span
                className="pill"
                style={{
                  borderColor: article.sourceColor,
                  background: `${article.sourceColor}22`
                }}
              >
                {article.sourceName}
              </span>
            </div>
            <footer
              style={{
                marginTop: '1rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.5rem',
                flexWrap: 'wrap'
              }}
            >
              <span className="muted">Published {formatDate(article.publishedAt)}</span>
              <a
                className="muted"
                href={article.homepage}
                target="_blank"
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
              >
                Visit source ↗
              </a>
            </footer>
          </article>
        ))}
      </section>

      <TelegramPanel
        selectedCount={selectedArticles.length}
        messagePreview={formatTelegramMessage(selectedArticles)}
        resetSelection={resetSelection}
      />
    </div>
  );
}
