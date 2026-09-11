import type { Category, Product, Offer, CatalogData } from './catalog';
import * as demo from './demo-repository';

function databaseMode(){const mode=process.env.DATA_SOURCE||'demo';if(!['demo','postgres'].includes(mode))throw new Error('DATA_SOURCE must be demo or postgres');if(mode==='postgres'&&!process.env.DATABASE_URL)throw new Error('DATABASE_URL required');return mode==='postgres';}
async function db(){return (await import('./prisma')).prisma;}
const include={offers:{orderBy:{price:'asc' as const}},history:{orderBy:{date:'asc' as const}},reviews:{orderBy:{date:'desc' as const}}};
function serializeProduct(raw:unknown):Product {const p=JSON.parse(JSON.stringify(raw)) as Product;const history=p.history as (Product['history'][number]&{sourceKind?:string})[],realHistory=history.filter(h=>h.sourceKind==='MERCHANT_FEED');p.offers=p.offers.map(o=>({...o,inStock:o.inStock&&!o.isStale,updatedAt:String((o as Offer&{observedAt?:string|null}).observedAt||o.updatedAt)}));p.historySource=realHistory.length?'merchant_feed':'demo';p.history=(realHistory.length?realHistory:history.filter(h=>h.sourceKind!=='MERCHANT_FEED')).map(h=>({date:h.date.slice(0,10),price:h.price}));(p.history as Product['history']&{source?:'demo'|'merchant_feed'}).source=p.historySource;return p;}
export async function getCatalog():Promise<CatalogData>{
 if(!databaseMode())return demo.getCatalog();
 const prisma=await db();const [categories,products]=await Promise.all([prisma.category.findMany({orderBy:{name:'asc'}}),prisma.product.findMany({include,orderBy:{popularity:'desc'}})]);
 return {categories:categories as unknown as Category[],products:products.map(serializeProduct),demo:true};
}
export async function getProduct(slug:string):Promise<Product|null>{if(!databaseMode())return demo.getProduct(slug);const p=await (await db()).product.findUnique({where:{slug},include});return p?serializeProduct(p):null;}
export async function getOffer(id:string):Promise<Offer|null>{if(!databaseMode())return demo.getOffer(id);const o=await (await db()).offer.findUnique({where:{id}});return o?{...o,updatedAt:o.updatedAt.toISOString()}:null;}
export async function recordClick(offerId:string){if(!databaseMode())return false;await(await db()).click.create({data:{offerId}});return true;}
