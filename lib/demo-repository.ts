import { categories, products } from './seed-data';
export async function getCatalog() { return {categories,products,demo:true}; }
export async function getProduct(slug:string) { return products.find(p=>p.slug===slug)??null; }
export async function getOffer(id:string) { return products.flatMap(p=>p.offers).find(o=>o.id===id)??null; }
export async function recordClick(_offerId:string) { return false; }
