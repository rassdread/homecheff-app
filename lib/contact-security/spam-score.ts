/**
 * Lightweight spam content scoring for contact submissions.
 * Reject only above threshold — legitimate users unaffected.
 */

export const SPAM_SCORE_REJECT_THRESHOLD = 12;

const SPAM_KEYWORDS = [
  'crypto',
  'casino',
  'viagra',
  'cialis',
  'seo service',
  'backlink',
  'guest post',
  'make money fast',
  'click here',
  'bitcoin',
  'forex',
  'lottery',
  'prize winner',
];

function shannonEntropy(s: string): number {
  if (!s.length) return 0;
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) || 0) + 1);
  let h = 0;
  for (const c of freq.values()) {
    const p = c / s.length;
    h -= p * Math.log2(p);
  }
  return h;
}

function hasRepeatedRun(s: string, minRun = 6): boolean {
  return /(.)\1{5,}/i.test(s) || minRun > 0 && /(.)\1{5,}/.test(s);
}

function looksLikeGibberishToken(token: string): boolean {
  if (token.length < 8) return false;
  // Mostly consonants or random mix without vowels pattern
  const vowels = (token.match(/[aeiouy]/gi) || []).length;
  const letters = (token.match(/[a-z]/gi) || []).length;
  if (letters < 8) return false;
  if (vowels / letters < 0.15) return true;
  // High entropy short tokens (random)
  if (token.length >= 10 && shannonEntropy(token) > 3.8 && vowels / letters < 0.25) {
    return true;
  }
  return false;
}

export type SpamScoreResult = {
  score: number;
  signals: string[];
  reject: boolean;
};

export function scoreContactSpam(params: {
  name: string;
  email: string;
  message: string;
  subject: string;
  softTimingPenalty?: boolean;
}): SpamScoreResult {
  const signals: string[] = [];
  let score = 0;

  const name = params.name.trim();
  const message = params.message.trim();
  const emailLocal = params.email.split('@')[0] || '';

  if (message.length < 8) {
    score += 4;
    signals.push('message_too_short');
  }
  if (name.length < 2) {
    score += 3;
    signals.push('name_too_short');
  }
  if (hasRepeatedRun(message) || hasRepeatedRun(name)) {
    score += 4;
    signals.push('repeated_chars');
  }

  const urlMatches = message.match(/https?:\/\/|www\./gi) || [];
  if (urlMatches.length >= 2) {
    score += 5;
    signals.push('multiple_urls');
  } else if (urlMatches.length === 1) {
    score += 2;
    signals.push('has_url');
  }

  const lowerMsg = message.toLowerCase();
  for (const kw of SPAM_KEYWORDS) {
    if (lowerMsg.includes(kw)) {
      score += 3;
      signals.push(`keyword:${kw}`);
      break;
    }
  }

  const tokens = `${name} ${message}`.split(/\s+/).filter(Boolean);
  let gibberishTokens = 0;
  for (const t of tokens) {
    if (looksLikeGibberishToken(t)) gibberishTokens += 1;
  }
  if (gibberishTokens >= 2) {
    score += 5;
    signals.push('gibberish_tokens');
  } else if (gibberishTokens === 1) {
    score += 2;
    signals.push('gibberish_token');
  }

  // Random-looking local-part (long alphanumeric)
  if (/^[a-z0-9]{18,}$/i.test(emailLocal)) {
    score += 3;
    signals.push('random_email_local');
  }

  // Name equals random string similar to email local
  if (name.length >= 10 && /^[a-z0-9]+$/i.test(name) && looksLikeGibberishToken(name)) {
    score += 3;
    signals.push('random_name');
  }

  const entropy = shannonEntropy(message.replace(/\s/g, ''));
  if (message.length > 40 && entropy > 4.5) {
    score += 2;
    signals.push('high_entropy');
  }

  if (params.softTimingPenalty) {
    score += 3;
    signals.push('timing_soft');
  }

  // Subject must be from known set — invalid already rejected; generic "other" alone is fine
  if (!params.subject) {
    score += 2;
    signals.push('missing_subject');
  }

  return {
    score,
    signals,
    reject: score >= SPAM_SCORE_REJECT_THRESHOLD,
  };
}
