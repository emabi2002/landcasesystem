'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  ChevronLeft,
  LifeBuoy,
  ChevronRight,
  BookOpen,
  Compass,
  PlayCircle,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  HELP_CATEGORIES,
  HELP_ROLES,
  HELP_TOPICS,
  WELCOME_TOUR_ID,
  getTopicById,
  searchTopics,
  type HelpCategory,
  type HelpRole,
  type HelpTopic,
} from '@/help/help-content';
import { useHelp } from './HelpProvider';
import { HelpArticle } from './HelpArticle';
import { HelpTopicIcon } from './HelpTopicIcon';

export function HelpCentre() {
  const { role, setRole, startTour } = useHelp();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Deep-link support: /help?topic=case-details
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const topic = params.get('topic');
    if (topic && getTopicById(topic)) {
      setSelectedId(topic);
    }
  }, []);

  const results = useMemo(() => searchTopics(query, role), [query, role]);

  const grouped = useMemo(() => {
    const map = new Map<HelpCategory, HelpTopic[]>();
    for (const t of results) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return map;
  }, [results]);

  const selectedTopic = getTopicById(selectedId);

  return (
    <div className="min-h-full bg-slate-50">
      {/* Hero */}
      <div className="relative overflow-hidden bg-dlpp-purple">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px, 64px 64px',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="flex items-center gap-2 text-sm font-medium text-white/70">
            <LifeBuoy className="h-4 w-4" />
            DLPP Legal Case Management System
          </div>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            How can we help you?
          </h1>
          <p className="mt-2 max-w-2xl text-white/80">
            Clear, step-by-step guidance for every part of the system — written for
            registry officers, legal officers, managers and executives.
          </p>

          <div className="relative mt-6 max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedId(null);
              }}
              placeholder="Search for a module, task, document, report or role..."
              className="h-12 rounded-xl border-0 bg-white pl-12 text-base shadow-lg focus-visible:ring-2 focus-visible:ring-dlpp-gold"
            />
          </div>

          <button
            type="button"
            onClick={() => startTour(WELCOME_TOUR_ID)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/25"
          >
            <PlayCircle className="h-4 w-4" />
            Take the welcome tour
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {selectedTopic ? (
          <ArticleReader
            topic={selectedTopic}
            role={role}
            onBack={() => setSelectedId(null)}
            onSelectTopic={setSelectedId}
            onStartTour={startTour}
          />
        ) : (
          <>
            {/* Role filter */}
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-500">
                <Compass className="h-4 w-4" />
                Filter guidance by your role
              </div>
              <div className="flex flex-wrap gap-2">
                <RolePill
                  active={role === 'all'}
                  onClick={() => setRole('all')}
                  label="All roles"
                />
                {HELP_ROLES.map((r) => (
                  <RolePill
                    key={r}
                    active={role === r}
                    onClick={() => setRole(r)}
                    label={r}
                  />
                ))}
              </div>
            </div>

            {grouped.size === 0 && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">No matching help topics</p>
                <p className="text-sm text-slate-500">
                  Try another keyword, or clear the search to see everything.
                </p>
              </div>
            )}

            {/* Category sections */}
            <div className="space-y-10">
              {HELP_CATEGORIES.filter((c) => grouped.has(c)).map((category) => (
                <section key={category}>
                  <div className="mb-4 flex items-center gap-3">
                    <h2 className="text-lg font-bold text-slate-900">{category}</h2>
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {grouped.get(category)!.length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {grouped.get(category)!.map((topic) => (
                      <TopicCard
                        key={topic.id}
                        topic={topic}
                        onClick={() => setSelectedId(topic.id)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RolePill({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-dlpp-purple bg-dlpp-purple text-white'
          : 'border-slate-200 bg-white text-slate-600 hover:border-dlpp-purple/40 hover:text-dlpp-purple',
      )}
    >
      {label}
    </button>
  );
}

function TopicCard({
  topic,
  onClick,
}: {
  topic: HelpTopic;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-dlpp-purple/30 hover:shadow-md"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-dlpp-purple/10 text-dlpp-purple transition-colors group-hover:bg-dlpp-purple group-hover:text-white">
          <HelpTopicIcon name={topic.icon} className="h-5 w-5" />
        </span>
        <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-dlpp-purple" />
      </div>
      <h3 className="font-semibold text-slate-900">{topic.title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-slate-500">{topic.summary}</p>
    </button>
  );
}

function ArticleReader({
  topic,
  role,
  onBack,
  onSelectTopic,
  onStartTour,
}: {
  topic: HelpTopic;
  role: HelpRole | 'all';
  onBack: () => void;
  onSelectTopic: (id: string) => void;
  onStartTour: (tourId: string) => void;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1 text-sm font-medium text-dlpp-purple transition-colors hover:text-dlpp-purple-dark"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Help Centre
      </button>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex items-center gap-4 border-b border-slate-100 pb-6">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-dlpp-purple/10 text-dlpp-purple">
            <HelpTopicIcon name={topic.icon} className="h-7 w-7" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {topic.category}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{topic.title}</h1>
            <p className="mt-0.5 text-sm text-slate-500">{topic.summary}</p>
          </div>
        </div>

        <HelpArticle
          topic={topic}
          role={role}
          onSelectTopic={onSelectTopic}
          onStartTour={onStartTour}
        />
      </div>
    </div>
  );
}
