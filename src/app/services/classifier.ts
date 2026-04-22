import { Classification, RequestPriority } from '../models/triage.models';

interface CategoryRule {
  category: string;
  keywords: string[];
}

const CATEGORY_RULES: CategoryRule[] = [
  { category: 'Bug', keywords: ['bug', 'error', 'exception', 'crash', 'broken', 'fails', 'failing', 'stack trace', 'npe', 'null reference'] },
  { category: 'Data Request', keywords: ['report', 'dashboard', 'metric', 'kpi', 'export', 'extract', 'query', 'data pull', 'analytics'] },
  { category: 'Access Request', keywords: ['access', 'permission', 'login', 'credential', 'account', 'role', 'onboard', 'offboard'] },
  { category: 'Feature Request', keywords: ['feature', 'enhancement', 'add ', 'support for', 'could we', 'would like', 'new capability'] },
  { category: 'Integration', keywords: ['api', 'integration', 'webhook', 'endpoint', 'connector', 'sync', 'etl', 'pipeline'] },
  { category: 'Security', keywords: ['security', 'vulnerability', 'cve', 'password', 'secret', 'leak', 'phishing', 'breach'] },
  { category: 'Infrastructure', keywords: ['server', 'deploy', 'deployment', 'outage', 'cluster', 'cpu', 'memory', 'disk', 'network', 'latency'] },
  { category: 'Documentation', keywords: ['docs', 'documentation', 'readme', 'wiki', 'guide', 'how-to', 'how to'] }
];

const HIGH_PRIORITY_SIGNALS = [
  /\burgent\b/, /\basap\b/, /\bimmediately\b/, /\boutage\b/, /\bdown\b/,
  /\bblocker\b/, /\bblocking\b/, /\bcritical\b/, /\bp0\b/, /\bp1\b/, /\bprod(uction)?\b/
];
const MEDIUM_PRIORITY_SIGNALS = [
  /\bsoon\b/, /\bthis week\b/, /\bimportant\b/, /\bregression\b/, /\bp2\b/, /\bintermittent\b/
];

export interface ClassifierInput {
  title: string;
  description: string;
  context?: string;
}

export interface Classifier {
  name: string;
  classify(input: ClassifierInput): Promise<Classification>;
}

/**
 * Deterministic rule-based classifier. Matches the intent of the
 * `RuleBasedClassifier` described in the user story: keyword scoring
 * with regex normalisation, produces category / priority / summary / tags.
 */
export class RuleBasedClassifier implements Classifier {
  public readonly name = 'rule-based';

  async classify(input: ClassifierInput): Promise<Classification> {
    const text = `${input.title}\n${input.description}\n${input.context ?? ''}`.toLowerCase();

    const category = this.pickCategory(text);
    const priority = this.pickPriority(text);
    const summary = this.buildSummary(input.title, input.description);
    const tags = this.buildTags(text, category);

    return { category, priority, summary, tags };
  }

  private pickCategory(text: string): string {
    let best = { category: 'General', score: 0 };
    for (const rule of CATEGORY_RULES) {
      let score = 0;
      for (const kw of rule.keywords) {
        const re = new RegExp(`\\b${kw.trim().replace(/\s+/g, '\\s+')}\\b`, 'g');
        const matches = text.match(re);
        if (matches) {
          score += matches.length;
        }
      }
      if (score > best.score) {
        best = { category: rule.category, score };
      }
    }
    return best.category;
  }

  private pickPriority(text: string): RequestPriority {
    if (HIGH_PRIORITY_SIGNALS.some(re => re.test(text))) {
      return 'High';
    }
    if (MEDIUM_PRIORITY_SIGNALS.some(re => re.test(text))) {
      return 'Medium';
    }
    return 'Low';
  }

  private buildSummary(title: string, description: string): string {
    const firstSentence = (description || title).split(/(?<=[.!?])\s+/)[0] ?? title;
    const trimmed = firstSentence.trim().replace(/\s+/g, ' ');
    if (trimmed.length <= 140) {
      return trimmed;
    }
    return trimmed.slice(0, 137) + '...';
  }

  private buildTags(text: string, category: string): string[] {
    const tags = new Set<string>();
    tags.add(category.toLowerCase().replace(/\s+/g, '-'));

    const signalTags: Array<[RegExp, string]> = [
      [/\bprod(uction)?\b/, 'production'],
      [/\bstag(ing|e)\b/, 'staging'],
      [/\bdev(elopment)?\b/, 'development'],
      [/\bsql\b/, 'sql'],
      [/\bapi\b/, 'api'],
      [/\bui\b|\bfront-?end\b/, 'ui'],
      [/\bback-?end\b/, 'backend'],
      [/\bmobile\b|\bios\b|\bandroid\b/, 'mobile'],
      [/\bsecurity\b|\bvulnerab/, 'security'],
      [/\bperformance\b|\bslow\b|\blatenc/, 'performance']
    ];

    for (const [re, tag] of signalTags) {
      if (re.test(text) && tags.size < 5) {
        tags.add(tag);
      }
    }

    // Pad with salient nouns from the text if still under 3 tags.
    const words = text
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !STOPWORDS.has(w));
    for (const w of words) {
      if (tags.size >= 5) break;
      tags.add(w);
    }

    return Array.from(tags).slice(0, 5);
  }
}

const STOPWORDS = new Set([
  'about', 'after', 'again', 'because', 'before', 'being', 'below', 'between', 'could',
  'during', 'every', 'first', 'from', 'further', 'having', 'here', 'itself', 'other',
  'should', 'such', 'than', 'that', 'their', 'them', 'then', 'there', 'these', 'they',
  'this', 'those', 'through', 'under', 'until', 'very', 'were', 'what', 'when', 'where',
  'which', 'while', 'will', 'with', 'would', 'your', 'yours', 'please', 'cannot',
  'needs', 'need', 'want', 'looks', 'issue', 'request', 'thanks'
]);
