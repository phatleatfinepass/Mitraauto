import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Clock3, IdCard, MapPin, Phone, User } from 'lucide-react';

type BriefingTone = 'critical' | 'warning' | 'normal' | 'done';

export interface BriefingAction {
  label: string;
  kind?: 'primary' | 'secondary' | 'danger';
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
}

export interface BriefingItem {
  id: string;
  title: string;
  subtitle: string;
  status: string;
  time: string;
  tone: BriefingTone;
  details: string[];
  secondaryStatus?: string;
  licensePlate?: string;
  createdAtLabel?: string;
  location?: string;
  phone?: string;
  owner?: string;
  actions: BriefingAction[];
}

interface CmsPwaBriefingCardProps {
  item: BriefingItem;
}

function toneClasses(tone: BriefingTone) {
  if (tone === 'critical') {
    return 'border-[#E5484D]/40 bg-[#2A1417]';
  }

  if (tone === 'warning') {
    return 'border-[#D97706]/35 bg-[#271A10]';
  }

  if (tone === 'done') {
    return 'border-emerald-500/25 bg-[#14211A]';
  }

  return 'border-white/10 bg-[#141922]';
}

function ToneIcon({ tone }: { tone: BriefingTone }) {
  if (tone === 'critical') {
    return <AlertCircle className="h-4 w-4 text-[#E5484D]" />;
  }

  if (tone === 'done') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }

  return <Clock3 className="h-4 w-4 text-[#FF6B35]" />;
}

export function CmsPwaBriefingCard({ item }: CmsPwaBriefingCardProps) {
  const [expanded, setExpanded] = useState(false);
  const metaRows = [
    { key: 'time', icon: Clock3, value: item.time },
    { key: 'owner', icon: User, value: item.owner },
    { key: 'phone', icon: Phone, value: item.phone },
    { key: 'location', icon: MapPin, value: item.location },
  ].filter((row) => Boolean(row.value));

  return (
    <article className={`rounded-2xl border p-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] ${toneClasses(item.tone)}`}>
      <button
        type="button"
        onClick={() => setExpanded((current) => !current)}
        className="flex w-full items-start justify-between gap-4 text-left"
        aria-expanded={expanded}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ToneIcon tone={item.tone} />
            <p className="text-xs font-medium text-white/55">{item.status}</p>
          </div>
          {expanded && item.secondaryStatus ? (
            <p className="mt-1 text-xs text-[#FFD2C3]">{item.secondaryStatus}</p>
          ) : null}
          <h3 className="mt-2 text-base font-semibold text-white">{item.title}</h3>
          {item.licensePlate ? (
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-white/72">
              <IdCard className="h-3.5 w-3.5" />
              {item.licensePlate}
            </p>
          ) : (
            <p className="mt-1 text-sm text-white/65">{item.subtitle}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/45">
            {metaRows.map((row) => {
              const Icon = row.icon;
              return (
                <span key={`${item.id}-${row.key}`} className="inline-flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5" />
                  {row.value}
                </span>
              );
            })}
          </div>
        </div>
        <span className="mt-1 inline-flex h-8 w-8 flex-none items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/70">
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>

      {expanded ? (
        <div className="mt-4 border-t border-white/8 pt-4">
          {item.createdAtLabel ? (
            <p className="mb-3 text-xs text-white/45">{item.createdAtLabel}</p>
          ) : null}
          <ul className="space-y-2">
            {item.details.map((detail, index) => (
              <li key={`${item.id}-detail-${index}`} className="text-sm leading-6 text-white/72">
                {detail}
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap gap-2">
            {item.actions.map((action) => {
              const className = `inline-flex min-h-11 items-center justify-center rounded-xl border px-3 py-2 text-sm font-medium ${
                action.kind === 'primary'
                  ? 'border-[#FF6B35] bg-[#FF6B35] text-[#11141A]'
                  : action.kind === 'danger'
                    ? 'border-[#E5484D]/40 bg-[#E5484D]/12 text-[#FFB4B4]'
                    : 'border-white/10 bg-white/[0.03] text-white/80'
              }`;

              if (action.href) {
                return (
                  <a
                    key={`${item.id}-${action.label}-${action.href}`}
                    href={action.href}
                    target={action.target}
                    rel={action.rel}
                    aria-disabled={action.disabled ? 'true' : undefined}
                    onClick={action.disabled ? (event) => event.preventDefault() : undefined}
                    className={`${className} ${action.disabled ? 'pointer-events-none opacity-45' : ''}`}
                  >
                    {action.label}
                  </a>
                );
              }

              return (
                <button
                  key={`${item.id}-${action.label}`}
                  type="button"
                  disabled={action.disabled}
                  className={`${className} ${action.disabled ? 'cursor-not-allowed opacity-45' : ''}`}
                >
                  {action.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}
