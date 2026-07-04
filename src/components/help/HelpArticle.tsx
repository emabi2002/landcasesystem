'use client';

import {
  Target,
  UserCircle,
  ListChecks,
  FormInput,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  PlayCircle,
  Link2,
  BadgeInfo,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  getRelatedTopics,
  getTourForTopic,
  type HelpRole,
  type HelpTopic,
} from '@/help/help-content';

interface HelpArticleProps {
  topic: HelpTopic;
  role: HelpRole | 'all';
  onSelectTopic: (topicId: string) => void;
  onStartTour: (tourId: string) => void;
  /** Compact spacing for the drawer. */
  compact?: boolean;
}

function SectionHeading({
  icon: Icon,
  children,
  tone = 'slate',
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  tone?: 'slate' | 'amber' | 'emerald' | 'purple';
}) {
  const toneMap = {
    slate: 'text-slate-700 bg-slate-100',
    amber: 'text-amber-700 bg-amber-100',
    emerald: 'text-emerald-700 bg-emerald-100',
    purple: 'text-dlpp-purple bg-dlpp-purple/10',
  } as const;
  return (
    <div className="mb-2 flex items-center gap-2">
      <span className={cn('flex h-7 w-7 items-center justify-center rounded-md', toneMap[tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-800">
        {children}
      </h4>
    </div>
  );
}

export function HelpArticle({
  topic,
  role,
  onSelectTopic,
  onStartTour,
  compact = false,
}: HelpArticleProps) {
  const related = getRelatedTopics(topic);
  const tour = getTourForTopic(topic.id);
  const roleNote =
    role !== 'all' && topic.roleNotes ? topic.roleNotes[role] : undefined;

  return (
    <article className={cn('space-y-6', compact ? 'text-sm' : 'text-[15px]')}>
      {/* Purpose */}
      <section>
        <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 leading-relaxed text-slate-700">
          {topic.purpose}
        </p>
      </section>

      {/* Start tour */}
      {tour && (
        <Button
          onClick={() => onStartTour(tour.id)}
          className="w-full gap-2 bg-dlpp-purple text-white hover:bg-dlpp-purple-dark"
        >
          <PlayCircle className="h-4 w-4" />
          Start Guided Tour
        </Button>
      )}

      {/* Role-specific note */}
      {roleNote && (
        <section className="rounded-lg border border-dlpp-purple/20 bg-dlpp-purple/5 p-3">
          <div className="mb-1 flex items-center gap-2 text-dlpp-purple">
            <BadgeInfo className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              For {role}
            </span>
          </div>
          <p className="leading-relaxed text-slate-700">{roleNote}</p>
        </section>
      )}

      {/* Who should use */}
      <section>
        <SectionHeading icon={UserCircle} tone="purple">
          Who should use this
        </SectionHeading>
        <p className="leading-relaxed text-slate-600">{topic.whoShouldUse}</p>
      </section>

      {/* Steps */}
      <section>
        <SectionHeading icon={ListChecks} tone="purple">
          Step by step
        </SectionHeading>
        <ol className="space-y-2">
          {topic.steps.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-dlpp-purple text-[11px] font-semibold text-white">
                {i + 1}
              </span>
              <span className="leading-relaxed text-slate-600">{step}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* Required fields */}
      {topic.requiredFields && topic.requiredFields.length > 0 && (
        <section>
          <SectionHeading icon={FormInput} tone="slate">
            Fields
          </SectionHeading>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            {topic.requiredFields.map((field, i) => (
              <div
                key={field.name}
                className={cn(
                  'flex flex-col gap-0.5 p-2.5',
                  i > 0 && 'border-t border-slate-100',
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-800">{field.name}</span>
                  {field.required ? (
                    <Badge className="bg-dlpp-red/10 text-dlpp-red hover:bg-dlpp-red/10">
                      Required
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-slate-500">
                      Optional
                    </Badge>
                  )}
                </div>
                <span className="text-sm leading-relaxed text-slate-500">
                  {field.description}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Common mistakes */}
      <section>
        <SectionHeading icon={AlertTriangle} tone="amber">
          Common mistakes
        </SectionHeading>
        <ul className="space-y-1.5">
          {topic.commonMistakes.map((m, i) => (
            <li key={i} className="flex gap-2 leading-relaxed text-slate-600">
              <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber-400" />
              {m}
            </li>
          ))}
        </ul>
      </section>

      {/* Best practices */}
      <section>
        <SectionHeading icon={Lightbulb} tone="emerald">
          Best practice tips
        </SectionHeading>
        <ul className="space-y-1.5">
          {topic.bestPractices.map((b, i) => (
            <li key={i} className="flex gap-2 leading-relaxed text-slate-600">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
              {b}
            </li>
          ))}
        </ul>
      </section>

      {/* After saving */}
      <section>
        <SectionHeading icon={Target} tone="purple">
          What happens after saving
        </SectionHeading>
        <ul className="space-y-1.5">
          {topic.afterSaving.map((a, i) => (
            <li key={i} className="flex gap-2 leading-relaxed text-slate-600">
              <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-dlpp-purple" />
              {a}
            </li>
          ))}
        </ul>
      </section>

      {/* Related topics */}
      {related.length > 0 && (
        <section className="border-t border-slate-200 pt-4">
          <div className="mb-2 flex items-center gap-2 text-slate-500">
            <Link2 className="h-4 w-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">
              Related help topics
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {related.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectTopic(r.id)}
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600 transition-colors hover:border-dlpp-purple/40 hover:bg-dlpp-purple/5 hover:text-dlpp-purple"
              >
                {r.title}
                <ArrowRight className="h-3 w-3" />
              </button>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
