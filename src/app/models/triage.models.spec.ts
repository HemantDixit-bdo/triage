import { describe, expect, it } from 'vitest';
import { STATUS_TRANSITIONS, STATUSES } from './triage.models';

describe('STATUS_TRANSITIONS', () => {
  it('starts at New and ends at Closed', () => {
    expect(STATUSES[0]).toBe('New');
    expect(STATUSES[STATUSES.length - 1]).toBe('Closed');
  });

  it('allows the happy-path progression', () => {
    expect(STATUS_TRANSITIONS['New']).toContain('In Review');
    expect(STATUS_TRANSITIONS['In Review']).toContain('In Progress');
    expect(STATUS_TRANSITIONS['In Progress']).toContain('Resolved');
    expect(STATUS_TRANSITIONS['Resolved']).toContain('Closed');
  });

  it('is terminal at Closed', () => {
    expect(STATUS_TRANSITIONS['Closed']).toEqual([]);
  });

  it('does not allow skipping steps', () => {
    expect(STATUS_TRANSITIONS['New']).not.toContain('In Progress');
    expect(STATUS_TRANSITIONS['New']).not.toContain('Resolved');
    expect(STATUS_TRANSITIONS['In Review']).not.toContain('Resolved');
  });

  it('supports limited backward transitions for review/progress states', () => {
    expect(STATUS_TRANSITIONS['In Review']).toContain('New');
    expect(STATUS_TRANSITIONS['In Progress']).toContain('In Review');
  });
});
