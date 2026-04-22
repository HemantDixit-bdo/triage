import { describe, expect, it } from 'vitest';
import { TriageRequest } from '../models/triage.models';
import { TfIdfSimilarity } from './similarity';

function mkRequest(id: string, title: string, description: string): TriageRequest {
  return {
    id,
    title,
    description,
    requesterName: 'X',
    businessUnit: 'Y',
    status: 'New',
    createdAt: new Date().toISOString(),
    classifying: false,
    history: []
  };
}

describe('TfIdfSimilarity', () => {
  const sim = new TfIdfSimilarity();

  it('ranks requests with shared terms above unrelated ones', () => {
    const target = mkRequest('t', 'Production API returning 500', 'The orders API is failing in production');
    const corpus = [
      target,
      mkRequest('a', 'Checkout API 500 errors in production', 'The orders endpoint is failing'),
      mkRequest('b', 'Dark mode for admin portal', 'Add dark mode to internal portal'),
      mkRequest('c', 'Revenue dashboard by region', 'Weekly revenue report')
    ];
    const top = sim.findSimilar(target, corpus, 3);
    expect(top[0].request.id).toBe('a');
    expect(top[0].score).toBeGreaterThan(0);
  });

  it('returns at most topN results', () => {
    const target = mkRequest('t', 'Test', 'hello world');
    const corpus = [
      target,
      mkRequest('a', 'Hello', 'world'),
      mkRequest('b', 'World', 'hello'),
      mkRequest('c', 'Unrelated', 'xyz abc'),
      mkRequest('d', 'Hello again', 'world again')
    ];
    expect(sim.findSimilar(target, corpus, 2).length).toBeLessThanOrEqual(2);
  });

  it('returns an empty list when the corpus is only the target', () => {
    const target = mkRequest('t', 'Only one', 'alone');
    expect(sim.findSimilar(target, [target])).toEqual([]);
  });

  it('provides human-readable reasoning', () => {
    const target = mkRequest('t', 'Snowflake prod access', 'grant access to Snowflake warehouse');
    const corpus = [
      target,
      mkRequest('a', 'Snowflake access for analyst', 'please grant read access to Snowflake')
    ];
    const [first] = sim.findSimilar(target, corpus, 1);
    expect(first.reasoning).toMatch(/shared|overlap/i);
  });
});
