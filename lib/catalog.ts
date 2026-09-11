export type Attribute = { key: string; label: string; type: 'number' | 'string' | 'enum'; unit?: string; filter?: boolean };
export type Category = { id: string; name: string; slug: string; description: string; attributes: Attribute[] };
export type Offer = { id: string; productId: string; shopName: string; shopUrl: string; price: number; currency: string; inStock: boolean; isStale?: boolean; sourceKind?: 'DEMO'|'MERCHANT_FEED'; updatedAt: string; delivery: string };
export type Review = { id: string; author: string; rating: number; text: string; date: string };
export type PricePoint = { date: string; price: number };
export type Product = { id: string; slug: string; categoryId: string; name: string; brand: string; images: string[]; imageCaption: string; description: string; specs: Record<string,string|number>; popularity: number; offers: Offer[]; history: PricePoint[]; historySource?: 'demo'|'merchant_feed'; reviews: Review[] };
export type CatalogData = { categories: Category[]; products: Product[]; demo: boolean };
export const money = (value: number) => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:0}).format(value);
export const currentPrice = (p: Product) => { const a=p.offers.filter(o=>o.inStock&&!o.isStale); return a.length?Math.min(...a.map(o=>o.price)):null; };
export const dateLabel = (s: string) => new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s));
export const rating = (p: Product) => p.reviews.length?p.reviews.reduce((n,r)=>n+r.rating,0)/p.reviews.length:0;
export const formatSpec = (value: string|number|undefined, attr?: Attribute) => value===undefined?'—':`${value}${attr?.unit?' '+attr.unit:''}`;
export const priceChange = (p: Product) => { const now=currentPrice(p),first=p.history[0]?.price; return now!==null&&first?Math.round((now-first)/first*100):0; };
export function validateComparison(ids: string[], products: Product[]) {
 const unique=[...new Set(ids)];
 if(unique.length>4) return {valid:false,reason:'Можно сравнить до четырёх товаров.'};
 const found=unique.map(id=>products.find(p=>p.id===id));
 if(found.some(p=>!p)) return {valid:false,reason:'Один из товаров не найден.'};
 if(new Set(found.map(p=>p!.categoryId)).size>1) return {valid:false,reason:'Выберите товары из одной категории.'};
 return {valid:true,reason:''};
}
export type Filters = { query: string; brands: string[]; min: number; max: number; specs: Record<string,string[]>; sort: string; stock: boolean };
export function filterProducts(products:Product[],categoryId:string|undefined,f:Filters) {
 const q=f.query.trim().toLocaleLowerCase('ru');
 return products.filter(p=>{const price=currentPrice(p);return (!categoryId||p.categoryId===categoryId)&&(!q||`${p.name} ${p.brand} ${Object.values(p.specs).join(' ')}`.toLocaleLowerCase('ru').includes(q))&&(!f.brands.length||f.brands.includes(p.brand))&&(!f.stock||price!==null)&&(price===null?!f.stock&&f.min===0:price>=f.min&&price<=f.max)&&Object.entries(f.specs).every(([k,vs])=>!vs.length||vs.includes(String(p.specs[k])));}).sort((a,b)=>f.sort==='price-asc'?(currentPrice(a)??Infinity)-(currentPrice(b)??Infinity):f.sort==='price-desc'?(currentPrice(b)??-Infinity)-(currentPrice(a)??-Infinity):b.popularity-a.popularity);
}
