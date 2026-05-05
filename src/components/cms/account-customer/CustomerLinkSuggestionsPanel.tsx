import React, { useEffect, useState } from 'react';
import { AlertCircle, GitBranch, Link2, RefreshCcw } from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { linkCustomerActivity, listCustomerLinkSuggestions } from './api';
import { formatDate } from './safe';
import type { CustomerLinkSuggestion } from './types';

type CustomerLinkSuggestionsPanelProps = {
  customerId: string;
  onLinked: () => void;
};

function confidenceVariant(confidence: number) {
  if (confidence >= 90) return 'default' as const;
  if (confidence >= 80) return 'secondary' as const;
  return 'outline' as const;
}

export function CustomerLinkSuggestionsPanel({ customerId, onLinked }: CustomerLinkSuggestionsPanelProps) {
  const [suggestions, setSuggestions] = useState<CustomerLinkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkingKey, setLinkingKey] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSuggestions = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);

    try {
      const rows = await listCustomerLinkSuggestions(customerId);
      setSuggestions(rows);
      setLoaded(true);
    } catch (err: any) {
      setSuggestions([]);
      setLoaded(true);
      setError(err.message ?? 'Failed to load mapping suggestions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSuggestions([]);
    setLoaded(false);
    setError(null);
    void loadSuggestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const linkSuggestion = async (suggestion: CustomerLinkSuggestion) => {
    const key = `${suggestion.activityType}-${suggestion.activityId}`;
    if (linkingKey) return;
    setLinkingKey(key);
    setError(null);

    try {
      await linkCustomerActivity(suggestion);
      setSuggestions((current) => current.filter((row) => `${row.activityType}-${row.activityId}` !== key));
      onLinked();
    } catch (err: any) {
      setError(err.message ?? 'Failed to link activity.');
    } finally {
      setLinkingKey(null);
    }
  };

  return (
    <div className="space-y-3 border-t pt-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-foreground">Mapping suggestions</h4>
        </div>
        <Button size="sm" variant="outline" onClick={loadSuggestions} disabled={loading}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border">
        {suggestions.length === 0 ? (
          <p className="px-3 py-4 text-sm text-muted-foreground">
            {loaded ? 'No unmapped booking, order, receipt, or rescue matches found.' : 'Loading mapping suggestions...'}
          </p>
        ) : suggestions.map((suggestion) => {
          const key = `${suggestion.activityType}-${suggestion.activityId}`;
          return (
            <div key={key} className="border-b px-3 py-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{suggestion.title}</span>
                    <Badge variant="outline">{suggestion.activityType}</Badge>
                    <Badge variant={confidenceVariant(suggestion.confidence)}>{suggestion.confidence}%</Badge>
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {suggestion.subtitle || 'No contact detail'} · {formatDate(suggestion.occurredAt)}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge variant="secondary">{suggestion.matchSource}</Badge>
                    {suggestion.customerVehicleId ? <Badge variant="outline">vehicle match</Badge> : null}
                  </div>
                </div>
                <Button size="sm" onClick={() => linkSuggestion(suggestion)} disabled={Boolean(linkingKey)}>
                  <Link2 className="mr-2 h-4 w-4" />
                  {linkingKey === key ? 'Linking...' : 'Link'}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
