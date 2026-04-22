import { SimilarResult, TriageRequest } from '../models/triage.models';

/**
 * In-process TF‑IDF cosine similarity. Chosen because it needs no external
 * dependencies, is deterministic, and performs well for short request
 * descriptions. See README for trade-offs vs. embeddings.
 */
export class TfIdfSimilarity {
  findSimilar(target: TriageRequest, corpus: TriageRequest[], topN = 3): SimilarResult[] {
    const others = corpus.filter(r => r.id !== target.id);
    if (others.length === 0) {
      return [];
    }

    const docs = [target, ...others].map(r =>
      tokenize(`${r.title} ${r.description} ${r.context ?? ''}`)
    );

    const df = new Map<string, number>();
    for (const doc of docs) {
      for (const term of new Set(doc)) {
        df.set(term, (df.get(term) ?? 0) + 1);
      }
    }
    const N = docs.length;

    const vectors = docs.map(doc => this.tfIdfVector(doc, df, N));
    const targetVec = vectors[0];

    const results: SimilarResult[] = [];
    for (let i = 1; i < vectors.length; i++) {
      const score = cosine(targetVec, vectors[i]);
      if (score <= 0) continue;
      const overlap = sharedTerms(docs[0], docs[i], df, 3);
      results.push({
        request: others[i - 1],
        score,
        reasoning: overlap.length
          ? `Shared key terms: ${overlap.join(', ')}`
          : 'Overlap in general wording'
      });
    }

    return results.sort((a, b) => b.score - a.score).slice(0, topN);
  }

  private tfIdfVector(doc: string[], df: Map<string, number>, N: number): Map<string, number> {
    const tf = new Map<string, number>();
    for (const term of doc) {
      tf.set(term, (tf.get(term) ?? 0) + 1);
    }
    const vec = new Map<string, number>();
    for (const [term, count] of tf) {
      const dfv = df.get(term) ?? 1;
      // Smoothed IDF: +1 in numerator and denominator to avoid div-by-zero
      // and dampen the effect of extremely rare terms on short corpora.
      const idf = Math.log((N + 1) / (dfv + 1)) + 1;
      vec.set(term, (count / doc.length) * idf);
    }
    return vec;
  }
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP.has(w));
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const [, v] of a) na += v * v;
  for (const [, v] of b) nb += v * v;
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  for (const [term, v] of small) {
    const other = large.get(term);
    if (other !== undefined) {
      dot += v * other;
    }
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function sharedTerms(a: string[], b: string[], df: Map<string, number>, top: number): string[] {
  const setB = new Set(b);
  const shared = Array.from(new Set(a.filter(t => setB.has(t))));
  shared.sort((x, y) => (df.get(x) ?? 0) - (df.get(y) ?? 0));
  return shared.slice(0, top);
}

const STOP = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'but', 'not', 'you', 'our', 'can', 'has',
  'have', 'this', 'that', 'with', 'from', 'they', 'them', 'their', 'when', 'what',
  'into', 'been', 'will', 'would', 'could', 'should', 'about', 'please', 'there',
  'which', 'while', 'after', 'before', 'some', 'also', 'because', 'just'
]);
