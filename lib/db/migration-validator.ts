import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getEnvVar } from '@/lib/env';
import { logger } from '@/lib/logger';

export interface MigrationValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  statistics: Record<string, unknown>;
}

const REQUIRED_TABLES = ['leads', 'api_keys', 'audit_logs'] as const;

const REQUIRED_LEAD_INDEXES = [
  'idx_leads_niche',
  'idx_leads_country',
  'idx_leads_status',
  'idx_leads_created_at',
  'idx_leads_name_gin',
] as const;

const REQUIRED_RLS_POLICIES = [
  'Admin full access',
  'Service role access',
  'Deny anonymous access',
] as const;

function createServiceClient(): SupabaseClient {
  return createClient(
    getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export class ProductionMigrationValidator {
  private supabase: SupabaseClient;

  constructor(client?: SupabaseClient) {
    this.supabase = client ?? createServiceClient();
  }

  async validateMigration(): Promise<MigrationValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let statistics: Record<string, unknown> = {};

    try {
      await this.validateTableStructure(errors);
      await this.validateIndexes(errors, warnings);
      await this.validateRLSPolicies(errors, warnings);
      await this.validateConstraints(errors, warnings);
      statistics = await this.collectStatistics(warnings);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      errors.push(`Migration validation failed: ${message}`);
      logger.error('Migration validation error', {
        message,
        stack: error instanceof Error ? error.stack : undefined,
      });
    }

    const success = errors.length === 0;

    logger.info('Production migration validation completed', {
      success,
      errorCount: errors.length,
      warningCount: warnings.length,
      statistics,
    });

    return { success, errors, warnings, statistics };
  }

  private async validateTableStructure(errors: string[]): Promise<void> {
    const { data, error } = await this.supabase.rpc('get_rls_policies', {
      table_name: 'leads',
    });

    // Prefer direct table probes — works even if helper RPC is missing.
    const missing: string[] = [];

    for (const table of REQUIRED_TABLES) {
      const probe = await this.supabase.from(table).select('*').limit(1);
      if (probe.error && /relation|does not exist|schema cache/i.test(probe.error.message)) {
        missing.push(table);
      }
    }

    if (missing.length > 0) {
      errors.push(`Missing required tables: ${missing.join(', ')}`);
    }

    // If RPC exists but returned an error unrelated to missing function, record it.
    if (error && !/function|does not exist/i.test(error.message) && missing.length === 0) {
      // Non-fatal — table probe already ran.
    }

    void data;
  }

  private async validateIndexes(
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { data, error } = await this.supabase.rpc('get_rls_policies', {
      table_name: 'leads',
    });

    // Index introspection via SQL is preferred; fall back to warning if unavailable.
    const { data: indexRows, error: indexError } = await this.supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (indexError) {
      warnings.push(`Could not probe leads table for index validation: ${indexError.message}`);
      return;
    }

    void indexRows;
    void data;

    if (error && /function|does not exist/i.test(error.message)) {
      warnings.push(
        `Index/RLS helper RPC unavailable; ensure migration 003 is applied. Expected indexes: ${REQUIRED_LEAD_INDEXES.join(', ')}`
      );
      return;
    }

    // Soft check: we cannot query pg_indexes via PostgREST without a view/RPC.
    // Record expectation for operators.
    warnings.push(
      `Verify lead indexes exist in SQL editor: ${REQUIRED_LEAD_INDEXES.join(', ')}`
    );
  }

  private async validateRLSPolicies(
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    const { data, error } = await this.supabase.rpc('get_rls_policies', {
      table_name: 'leads',
    });

    if (error) {
      warnings.push(`Could not validate RLS policies via RPC: ${error.message}`);
      return;
    }

    const existingPolicies = (data as Array<{ policyname: string }> | null)?.map(
      (row) => row.policyname
    ) ?? [];

    const missingPolicies = REQUIRED_RLS_POLICIES.filter(
      (policy) => !existingPolicies.includes(policy)
    );

    if (missingPolicies.length > 0) {
      errors.push(`Missing RLS policies: ${missingPolicies.join(', ')}`);
    }
  }

  private async validateConstraints(
    errors: string[],
    warnings: string[]
  ): Promise<void> {
    // Unique maps_url — attempt duplicate insert of a throwaway URL then clean up.
    const probeUrl = `https://maps.google.com/migration-validator-probe-${Date.now()}`;

    const insert1 = await this.supabase.from('leads').insert({
      name: 'Migration Validator Probe',
      niche: 'Testing',
      country: 'Test',
      maps_url: probeUrl,
      status: 'New',
    });

    if (insert1.error) {
      warnings.push(`Constraint probe insert failed: ${insert1.error.message}`);
      return;
    }

    const insert2 = await this.supabase.from('leads').insert({
      name: 'Migration Validator Probe Dup',
      niche: 'Testing',
      country: 'Test',
      maps_url: probeUrl,
      status: 'New',
    });

    if (!insert2.error) {
      errors.push('Missing unique constraint on maps_url (duplicate insert succeeded)');
    } else if (insert2.error.code !== '23505') {
      warnings.push(
        `Unexpected duplicate insert error (expected 23505): ${insert2.error.message}`
      );
    }

    await this.supabase.from('leads').delete().eq('maps_url', probeUrl);
  }

  private async collectStatistics(
    warnings: string[]
  ): Promise<Record<string, unknown>> {
    const { data, error } = await this.supabase.from('lead_stats').select('*').single();

    if (error) {
      warnings.push(`Could not collect lead_stats: ${error.message}`);
      const { count } = await this.supabase
        .from('leads')
        .select('*', { count: 'exact', head: true });
      return { total_leads: count ?? 0 };
    }

    return (data as Record<string, unknown>) ?? {};
  }
}

export async function validateProductionMigration(): Promise<MigrationValidationResult> {
  const validator = new ProductionMigrationValidator();
  return validator.validateMigration();
}
