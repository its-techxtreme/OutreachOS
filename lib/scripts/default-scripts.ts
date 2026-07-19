export const SCRIPT_PLACEHOLDERS = [
  '{business}',
  '{niche}',
  '{location}',
  '{phone}',
] as const;

export const GENERAL_SCRIPT_KEY = 'general';

export const GENERAL_DEFAULT_SCRIPT = `Hi, is this {business}?

Quick intro — I'm reaching out because I work with {niche} businesses in {location}. I had a short idea that might help with getting more of the right customers without adding busywork.

Do you have 30 seconds, or is there a better time to call back?

[If busy]
No problem — I'll try you another time. Thanks!`;

export const NICHE_DEFAULT_SCRIPTS: Record<string, string> = {
  cafe: `Hi, is this {business}?

I help cafes in {location} fill quieter slots and get more walk-ins from people already nearby. Not a long pitch — just curious how you're handling new customers this month.

Got 30 seconds?

[If busy]
Totally fine — I'll call back. Cheers!`,
  coffee: `Hi, is this {business}?

Quick one for coffee shops in {location} — I work on simple ways to pull in more regulars without fancy ads. Worth a 30-second chat?

[If busy]
No worries — catch you later.`,
  pet: `Hi, is this {business}?

I work with pet businesses in {location} on booking and follow-up so fewer leads go cold. Open to a quick 30-second idea?

[If busy]
All good — I'll try again another time.`,
  groomer: `Hi, is this {business}?

Calling pet groomers in {location} — curious how you handle new bookings and no-shows. Got half a minute?

[If busy]
Understood — I'll call back.`,
  salon: `Hi, is this {business}?

I help salons in {location} fill open chairs with the right clients. Super short — 30 seconds?

[If busy]
No problem. Talk soon.`,
  saas: `Hi, is this {business}?

I reach out to {niche} teams in {location} about a focused outreach workflow — not a spray-and-pray tool. Open for 30 seconds?

[If busy]
Happy to reschedule. Thanks.`,
  restaurant: `Hi, is this {business}?

Quick question for restaurants in {location} about filling seats on slower days. Got 30 seconds?

[If busy]
Totally fine — I'll try later.`,
  dental: `Hi, is this {business}?

I work with dental practices in {location} on patient outreach that feels personal, not spammy. Half a minute?

[If busy]
Understood — I'll call back.`,
};

export const GENERIC_NICHE_DEFAULT_SCRIPT = `Hi, is this {business}?

I'm calling {niche} businesses in {location} with a short idea that might help you reach more of the right people. Do you have 30 seconds?

[If busy]
No problem — I'll try you another time. Thanks!`;

export function nicheToScriptKey(niche: string): string {
  return niche
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'general';
}

export function matchNicheDefaultKey(niche: string): string | null {
  const key = nicheToScriptKey(niche);
  if (NICHE_DEFAULT_SCRIPTS[key]) {
    return key;
  }
  const tokens = key.split('-');
  for (const token of tokens) {
    if (NICHE_DEFAULT_SCRIPTS[token]) {
      return token;
    }
  }
  for (const preset of Object.keys(NICHE_DEFAULT_SCRIPTS)) {
    if (key.includes(preset)) {
      return preset;
    }
  }
  return null;
}

export function getDefaultScriptBody(scriptKey: string): string {
  if (scriptKey === GENERAL_SCRIPT_KEY) {
    return GENERAL_DEFAULT_SCRIPT;
  }
  if (NICHE_DEFAULT_SCRIPTS[scriptKey]) {
    return NICHE_DEFAULT_SCRIPTS[scriptKey]!;
  }
  const matched = matchNicheDefaultKey(scriptKey);
  if (matched && NICHE_DEFAULT_SCRIPTS[matched]) {
    return NICHE_DEFAULT_SCRIPTS[matched]!;
  }
  return GENERIC_NICHE_DEFAULT_SCRIPT;
}

export function listPresetNicheKeys(): string[] {
  return Object.keys(NICHE_DEFAULT_SCRIPTS);
}
