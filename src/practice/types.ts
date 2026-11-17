/**
 * Saved lessons and the answers to "How did that feel?", kept on the phone under ywm:practice:v1.
 *
 * The words of a reaction are the same as in the database (supabase/migrations/20261116000000_init.sql),
 * because Phase 9 sends the reactions as they are. Until then `sent` stays false.
 */
export type Difficulty = 'gentle' | 'right' | 'much';
export type Feeling = 'calmer' | 'energised' | 'stronger' | 'tired';
export const difficulties: readonly Difficulty[] = ['gentle', 'right', 'much'];
export const feelings: readonly Feeling[] = ['calmer', 'energised', 'stronger', 'tired'];

export type Reaction = { difficulty: Difficulty; feeling?: Feeling; at: string; sent: boolean };

export type Practice = {
  /** Lesson slugs, the most recently saved first. */
  saved: string[];
  /** By lesson slug. A new answer replaces the old one. */
  reactions: Record<string, Reaction>;
};

export const emptyPractice: Practice = { saved: [], reactions: {} };

/**
 * What was saved, read back from the phone. Anything broken is left out instead of breaking the
 * app; fields this version does not know are ignored.
 */
export function parsePractice(raw: unknown): Practice {
  if (typeof raw !== 'object' || raw === null) return emptyPractice;
  const r = raw as Record<string, unknown>;
  const saved = Array.isArray(r.saved)
    ? [...new Set(r.saved.filter((s): s is string => typeof s === 'string' && s.length > 0))]
    : [];
  const reactions: Record<string, Reaction> = {};
  if (typeof r.reactions === 'object' && r.reactions !== null && !Array.isArray(r.reactions)) {
    for (const [slug, value] of Object.entries(r.reactions as Record<string, unknown>)) {
      if (typeof value !== 'object' || value === null) continue;
      const v = value as Record<string, unknown>;
      if (!(difficulties as readonly unknown[]).includes(v.difficulty) || typeof v.at !== 'string') continue;
      const feeling = (feelings as readonly unknown[]).includes(v.feeling) ? (v.feeling as Feeling) : undefined;
      reactions[slug] = {
        difficulty: v.difficulty as Difficulty,
        ...(feeling ? { feeling } : null),
        at: v.at,
        sent: v.sent === true,
      };
    }
  }
  return { saved, reactions };
}

/** Saves or unsaves a lesson. A newly saved lesson goes first. */
export function toggled(saved: readonly string[], slug: string): string[] {
  return saved.includes(slug) ? saved.filter((s) => s !== slug) : [slug, ...saved];
}
