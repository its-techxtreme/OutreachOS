'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { getSupabaseClient } from '@/lib/supabase-client';
import type { Lead, LeadStatus } from '@/types/database.types';

interface UseLeadsResult {
  leads: Lead[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  updateLeadStatus: (leadId: number, status: LeadStatus) => Promise<void>;
}

const REFETCH_INTERVAL_MS = 30_000;

export function useLeads(): UseLeadsResult {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMountedRef = useRef(true);

  const fetchLeads = useCallback(async () => {
    try {
      const response = await fetch('/api/leads');

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? 'Failed to fetch leads');
      }

      const payload = (await response.json()) as { leads: Lead[] };

      if (isMountedRef.current) {
        setLeads(payload.leads);
        setError(null);
      }
    } catch (fetchError) {
      if (isMountedRef.current) {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : 'Failed to fetch leads'
        );
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch on mount; subsequent polling handles refresh.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data hooks must fetch on mount
    void fetchLeads();

    const intervalId = window.setInterval(() => {
      void fetchLeads();
    }, REFETCH_INTERVAL_MS);

    let channel: ReturnType<ReturnType<typeof getSupabaseClient>['channel']> | null =
      null;
    let supabaseClient: ReturnType<typeof getSupabaseClient> | null = null;

    try {
      supabaseClient = getSupabaseClient();
      channel = supabaseClient
        .channel('leads_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'leads' },
          () => {
            void fetchLeads();
          }
        )
        .subscribe();
    } catch {
      // Real-time requires authenticated Supabase session; API polling remains active.
    }

    return () => {
      isMountedRef.current = false;
      window.clearInterval(intervalId);

      if (channel && supabaseClient) {
        void supabaseClient.removeChannel(channel);
      }
    };
  }, [fetchLeads]);

  const updateLeadStatus = useCallback(
    async (leadId: number, status: LeadStatus) => {
      const previous = leads.find((lead) => lead.id === leadId)?.status;

      setLeads((current) =>
        current.map((lead) =>
          lead.id === leadId ? { ...lead, status } : lead
        )
      );

      try {
        const response = await fetch(`/api/leads/${leadId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as { error?: string };
          throw new Error(payload.error ?? 'Failed to update status');
        }

        const payload = (await response.json()) as { lead?: Lead };
        if (payload.lead && isMountedRef.current) {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === payload.lead!.id ? payload.lead! : lead
            )
          );
        }
      } catch (updateError) {
        if (previous !== undefined && isMountedRef.current) {
          setLeads((current) =>
            current.map((lead) =>
              lead.id === leadId ? { ...lead, status: previous } : lead
            )
          );
        }
        throw updateError;
      }
    },
    [leads]
  );

  return {
    leads,
    loading,
    error,
    refetch: fetchLeads,
    updateLeadStatus,
  };
}
