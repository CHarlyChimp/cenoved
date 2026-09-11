import { identityCompatible, normalizeIdentifier, type FeedIdentity, type ProductMatchCandidate } from './feed-import/matching';

export type MatchReviewOperatorCommand =
  | { action: 'list'; merchantId?: string; limit: number; json: boolean }
  | { action: 'inspect'; id: string; json: boolean };

const ID_PATTERN = /^[A-Za-z0-9_-]{1,200}$/;

function usage(): never {
  throw new Error([
    'Usage:',
    '  pnpm matches:review -- list [--merchant <merchant-id>] [--limit 20] [--json]',
    '  pnpm matches:review -- inspect <identity-id> [--json]',
  ].join('\n'));
}

export function parseMatchReviewOperatorCommand(argv: string[]): MatchReviewOperatorCommand {
  const positionals: string[] = [];
  const values = new Map<string, string>();
  let json = false;
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (token === '--') continue;
    if (token === '--json') {
      if (json) throw new Error('--json may only be specified once');
      json = true;
    } else if (token.startsWith('--')) {
      if (!['--merchant', '--limit'].includes(token) || values.has(token)) usage();
      const value = argv[++index];
      if (!value || value.startsWith('--')) usage();
      values.set(token, value);
    } else positionals.push(token);
  }

  if (positionals[0] === 'list') {
    if (positionals.length !== 1) usage();
    const merchantId = values.get('--merchant');
    if (merchantId && !ID_PATTERN.test(merchantId)) throw new Error('merchant-id is invalid');
    const limitText = values.get('--limit') || '20';
    if (!/^\d+$/.test(limitText)) throw new Error('--limit must be an integer from 1 to 100');
    const limit = Number(limitText);
    if (limit < 1 || limit > 100) throw new Error('--limit must be an integer from 1 to 100');
    return { action: 'list', merchantId, limit, json };
  }

  if (positionals[0] === 'inspect') {
    if (positionals.length !== 2 || values.size) usage();
    const id = positionals[1];
    if (!ID_PATTERN.test(id)) throw new Error('identity-id is invalid');
    return { action: 'inspect', id, json };
  }

  usage();
}

export type MatchCandidateEvidence = ProductMatchCandidate & {
  identifierRule: 'GTIN' | 'BRAND_MPN';
  variantCompatible: boolean;
};

export function findIdentifierCandidates(identity: FeedIdentity, products: ProductMatchCandidate[]): MatchCandidateEvidence[] {
  const brand = normalizeIdentifier(identity.brand);
  const mpn = normalizeIdentifier(identity.manufacturerPartNumber);
  return products.flatMap(product => {
    if (product.categoryId !== identity.category) return [];
    const sameGtin = Boolean(identity.gtin && product.gtin === identity.gtin);
    const sameBrandMpn = normalizeIdentifier(product.brand) === brand
      && product.manufacturerPartNumber !== null
      && normalizeIdentifier(product.manufacturerPartNumber) === mpn;
    if (!sameGtin && !sameBrandMpn) return [];
    return [{
      ...product,
      identifierRule: sameGtin ? 'GTIN' as const : 'BRAND_MPN' as const,
      variantCompatible: identityCompatible(identity, product),
    }];
  });
}
