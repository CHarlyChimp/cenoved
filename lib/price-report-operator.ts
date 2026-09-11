export const PRICE_REPORT_STATUSES = ['OPEN', 'RESOLVED', 'DISMISSED', 'ALL'] as const;

export type PriceReportFilter = (typeof PRICE_REPORT_STATUSES)[number];

export type PriceReportOperatorCommand =
  | { action: 'list'; status: PriceReportFilter; limit: number; json: boolean }
  | { action: 'resolve' | 'dismiss'; id: string; note: string; json: boolean };

const REPORT_ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

function usage(): never {
  throw new Error([
    'Usage:',
    '  pnpm reports:manage -- list [--status open|resolved|dismissed|all] [--limit 20] [--json]',
    '  pnpm reports:manage -- resolve <report-id> --note <internal reason> [--json]',
    '  pnpm reports:manage -- dismiss <report-id> --note <internal reason> [--json]',
  ].join('\n'));
}

function parseFlags(argv: string[]) {
  const values = new Map<string, string>();
  let json = false;
  const positionals: string[] = [];
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === '--') continue;
    if (token === '--json') {
      if (json) throw new Error('--json may only be specified once');
      json = true;
      continue;
    }
    if (token.startsWith('--')) {
      if (!['--status', '--limit', '--note'].includes(token) || values.has(token)) usage();
      const value = argv[++index];
      if (!value || value.startsWith('--')) usage();
      values.set(token, value);
      continue;
    }
    positionals.push(token);
  }
  return { positionals, values, json };
}

export function parsePriceReportOperatorCommand(argv: string[]): PriceReportOperatorCommand {
  const { positionals, values, json } = parseFlags(argv);
  const action = positionals[0];
  if (action === 'list') {
    if (positionals.length !== 1 || values.has('--note')) usage();
    const status = (values.get('--status') || 'open').toUpperCase();
    if (!(PRICE_REPORT_STATUSES as readonly string[]).includes(status)) throw new Error('--status must be open, resolved, dismissed, or all');
    const limitText = values.get('--limit') || '20';
    if (!/^\d+$/.test(limitText)) throw new Error('--limit must be an integer from 1 to 100');
    const limit = Number(limitText);
    if (limit < 1 || limit > 100) throw new Error('--limit must be an integer from 1 to 100');
    return { action, status: status as PriceReportFilter, limit, json };
  }

  if (action === 'resolve' || action === 'dismiss') {
    if (positionals.length !== 2 || values.has('--status') || values.has('--limit')) usage();
    const id = positionals[1];
    if (!REPORT_ID_PATTERN.test(id)) throw new Error('report-id is invalid');
    const note = (values.get('--note') || '').trim();
    if (!note || note.length > 1000 || /[\r\n]/.test(note)) throw new Error('--note must contain 1 to 1000 characters on one line');
    return { action, id, note, json };
  }

  usage();
}
