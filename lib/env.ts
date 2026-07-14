const requiredServerEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'AGENT_SECRET',
] as const;

export type ServerEnvVar = (typeof requiredServerEnvVars)[number];

export function getEnvVar(name: ServerEnvVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function validateServerEnv(): void {
  for (const name of requiredServerEnvVars) {
    getEnvVar(name);
  }
}

export function isServerEnvConfigured(): boolean {
  return requiredServerEnvVars.every((name) => Boolean(process.env[name]));
}
