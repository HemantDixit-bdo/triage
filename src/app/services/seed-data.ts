export interface SeedRequest {
  title: string;
  description: string;
  requesterName: string;
  businessUnit: string;
  context?: string;
}

/** 18 example requests so the inbox is never empty on first open. */
export const SEED_REQUESTS: SeedRequest[] = [
  {
    title: 'Production API returning 500 on /orders',
    description: 'The orders endpoint is throwing NullReferenceException for about 5% of requests since this morning. This is blocking checkout in production.',
    requesterName: 'Alice Chen',
    businessUnit: 'Retail Engineering',
    context: 'Stack trace: System.NullReferenceException at OrderService.GetLines(...)'
  },
  {
    title: 'Need weekly revenue dashboard by region',
    description: 'Finance would like a dashboard that shows revenue by region broken down weekly, with an export to Excel.',
    requesterName: 'Priya Natarajan',
    businessUnit: 'Finance'
  },
  {
    title: 'Grant access to Snowflake prod for new analyst',
    description: 'Please onboard Marcus Webb with read access to the prod analytics warehouse.',
    requesterName: 'HR Operations',
    businessUnit: 'People Ops'
  },
  {
    title: 'Feature request: dark mode for admin portal',
    description: 'Would like to add dark mode support to the internal admin portal. Several users have asked for it.',
    requesterName: 'Jordan Smith',
    businessUnit: 'Internal Tools'
  },
  {
    title: 'Integrate Salesforce with billing system',
    description: 'We need an integration that syncs closed-won opportunities from Salesforce into the billing system via the REST API.',
    requesterName: 'Dana Lopez',
    businessUnit: 'RevOps'
  },
  {
    title: 'Suspicious login attempts from foreign IPs',
    description: 'Security sees a spike in failed login attempts from unknown IPs against the customer portal. Please investigate urgently.',
    requesterName: 'SecOps Team',
    businessUnit: 'Security'
  },
  {
    title: 'Staging cluster high memory usage',
    description: 'The staging Kubernetes cluster is hitting 95% memory. Deploys are getting evicted intermittently.',
    requesterName: 'Raj Patel',
    businessUnit: 'Platform'
  },
  {
    title: 'Update README for payments SDK',
    description: 'The payments SDK docs are out of date — the examples reference the v1 API. Please refresh the quickstart guide.',
    requesterName: 'Sam Ortiz',
    businessUnit: 'Developer Experience'
  },
  {
    title: 'Invoice PDF rendering cuts off long line items',
    description: 'When an invoice has more than 20 line items, the last page cuts off the total row. Reproducible in staging.',
    requesterName: 'Lena Fischer',
    businessUnit: 'Billing'
  },
  {
    title: 'New KPI: customer health score',
    description: 'Product wants a customer health score metric combining usage frequency, NPS, and support ticket volume. Please add to the exec dashboard.',
    requesterName: 'Chris Walker',
    businessUnit: 'Product Analytics'
  },
  {
    title: 'Password reset emails going to spam',
    description: 'Multiple users report that password reset emails end up in spam. Please check SPF/DKIM configuration.',
    requesterName: 'Support Desk',
    businessUnit: 'Customer Support'
  },
  {
    title: 'Add webhook for user-created event',
    description: 'Please add a webhook endpoint that fires when a new user is created so we can sync to marketing tools.',
    requesterName: 'Nina Rossi',
    businessUnit: 'Marketing Ops'
  },
  {
    title: 'Slow query on customer search',
    description: 'Searching by last name on the customers table is taking 8+ seconds. Performance regression since last deploy.',
    requesterName: 'Ops Team',
    businessUnit: 'Customer Success'
  },
  {
    title: 'Revoke access for departing contractor',
    description: 'Offboard contractor account john.doe@vendor.com — remove all repo and VPN access today.',
    requesterName: 'IT Helpdesk',
    businessUnit: 'IT'
  },
  {
    title: 'CSV export missing timezone info',
    description: 'The data export feature outputs timestamps without timezone, causing confusion for international users. Please include ISO 8601 with offset.',
    requesterName: 'Mia Tanaka',
    businessUnit: 'Data Platform'
  },
  {
    title: 'Mobile app crashes on iOS 18',
    description: 'Several users report the mobile app crashes at launch after updating to iOS 18. Critical — blocking mobile usage.',
    requesterName: 'Mobile QA',
    businessUnit: 'Mobile Engineering'
  },
  {
    title: 'Add SSO support to internal wiki',
    description: 'Would like to support Okta SSO for the internal wiki so users do not have to maintain separate passwords.',
    requesterName: 'Taylor Reid',
    businessUnit: 'IT'
  },
  {
    title: 'Pipeline failing nightly ETL from CRM',
    description: 'Our nightly ETL from the CRM has failed the past 3 nights with a timeout. Data team is blocked on morning refresh.',
    requesterName: 'Omar Haddad',
    businessUnit: 'Data Engineering',
    context: 'Error: Timeout expired after 300s on stage_crm_accounts'
  }
];
