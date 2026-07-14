import { createClient } from '@supabase/supabase-js';

/**
 * Test utilities for Supabase operations
 * Provides helper functions for testing database operations
 */

// Test Supabase client with service role key for cleanup operations
export const testSupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_TEST || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY_TEST || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

/**
 * Mock lead data for testing
 */
export const mockLeadData = {
  name: 'Test Business',
  niche: 'Technology',
  country: 'United States',
  phone: '+1-555-0123',
  address: '123 Test Street, Test City, TC 12345',
  maps_url: 'https://maps.google.com/test-business-unique-id',
  status: 'New'
};

/**
 * Create test lead in database
 */
export async function createTestLead(leadData = mockLeadData) {
  const { data, error } = await testSupabaseClient
    .from('leads')
    .insert(leadData)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Delete test lead from database
 */
export async function deleteTestLead(leadId: number) {
  const { error } = await testSupabaseClient
    .from('leads')
    .delete()
    .eq('id', leadId);
  
  if (error) throw error;
}

/**
 * Clean up all test leads
 */
export async function cleanupTestLeads() {
  const { error } = await testSupabaseClient
    .from('leads')
    .delete()
    .like('name', 'Test%');
  
  if (error) throw error;
}

/**
 * Setup test database state
 */
export async function setupTestDatabase() {
  // Create test leads with various states
  const testLeads = [
    { ...mockLeadData, name: 'Test Business 1', status: 'New' },
    { ...mockLeadData, name: 'Test Business 2', status: 'Contacted', maps_url: 'https://maps.google.com/test-business-2' },
    { ...mockLeadData, name: 'Test Business 3', status: 'Replied', maps_url: 'https://maps.google.com/test-business-3' },
  ];
  
  const { data, error } = await testSupabaseClient
    .from('leads')
    .insert(testLeads)
    .select();
  
  if (error) throw error;
  return data;
}

/**
 * Test RLS policies
 */
export async function testRLSPolicies() {
  // Test with anon key (should fail)
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL_TEST || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  );
  
  const { data, error } = await anonClient
    .from('leads')
    .select('*');
  
  // Should return no data or error due to RLS
  return { data: data || [], error };
}

/**
 * Mock API request helper
 */
export function createMockApiRequest(method: string, body?: any, headers?: Record<string, string>) {
  return {
    method,
    headers: {
      'content-type': 'application/json',
      ...headers
    },
    json: async () => body,
    body: JSON.stringify(body)
  };
}

/**
 * Mock API response helper
 */
export function createMockApiResponse() {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis()
  };
  
  return response;
}