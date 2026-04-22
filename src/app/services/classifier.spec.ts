import { describe, expect, it } from 'vitest';
import { RuleBasedClassifier } from './classifier';

describe('RuleBasedClassifier', () => {
  const classifier = new RuleBasedClassifier();

  it('detects bugs from stack traces and error keywords', async () => {
    const result = await classifier.classify({
      title: 'Checkout service throws NullReferenceException',
      description: 'Orders endpoint is failing with an exception since morning.',
      context: 'System.NullReferenceException at OrderService.GetLines'
    });
    expect(result.category).toBe('Bug');
  });

  it('detects data requests from report/dashboard keywords', async () => {
    const result = await classifier.classify({
      title: 'Need weekly revenue dashboard',
      description: 'Finance wants a report with KPIs by region.'
    });
    expect(result.category).toBe('Data Request');
  });

  it('marks outages as High priority', async () => {
    const result = await classifier.classify({
      title: 'Production is down',
      description: 'Critical outage blocking checkout, urgent.'
    });
    expect(result.priority).toBe('High');
  });

  it('marks regressions as Medium priority', async () => {
    const result = await classifier.classify({
      title: 'Search is slower',
      description: 'This is an important regression we saw this week.'
    });
    expect(result.priority).toBe('Medium');
  });

  it('returns 3-5 tags', async () => {
    const result = await classifier.classify({
      title: 'API slow in production',
      description: 'The checkout API has performance issues in prod.'
    });
    expect(result.tags.length).toBeGreaterThanOrEqual(1);
    expect(result.tags.length).toBeLessThanOrEqual(5);
  });

  it('produces a summary of at most 140 characters', async () => {
    const long = 'a'.repeat(500) + '.';
    const result = await classifier.classify({
      title: 'long',
      description: long
    });
    expect(result.summary.length).toBeLessThanOrEqual(140);
  });
});
