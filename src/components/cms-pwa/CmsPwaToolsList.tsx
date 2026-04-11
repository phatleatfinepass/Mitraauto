import React from 'react';

export function CmsPwaToolsList({
  items,
}: {
  items: Array<{ title: string; note: string; status: string }>;
}) {
  return (
    <section className="mt-4 space-y-3">
      {items.map((tool) => (
        <article key={tool.title} className="rounded-2xl border border-white/10 bg-[#141922] p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold">{tool.title}</h3>
              <p className="mt-1 text-sm leading-6 text-white/60">{tool.note}</p>
            </div>
            <span className="rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1 text-[11px] text-white/55">{tool.status}</span>
          </div>
        </article>
      ))}
    </section>
  );
}
