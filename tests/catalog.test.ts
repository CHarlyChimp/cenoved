import test from 'node:test';
import assert from 'node:assert/strict';
import { categories,products } from '../lib/seed-data';
import { currentPrice,filterProducts,validateComparison,type Filters } from '../lib/catalog';
const defaults:Filters={query:'',brands:[],min:0,max:200000,specs:{},sort:'popular',stock:true};
test('seed meets catalogue counts and history integrity',()=>{
 assert.equal(categories.length,2);for(const c of categories)assert.equal(products.filter(p=>p.categoryId===c.id).length,9);
 for(const p of products){assert.ok(p.offers.length>=3&&p.offers.length<=6);assert.ok(p.reviews.length>=2&&p.reviews.length<=4);assert.equal(p.history.length,90);assert.equal(new Set(p.history.map(h=>h.date)).size,90);assert.equal(p.history.at(-1)?.price,currentPrice(p));for(let i=1;i<90;i++)assert.equal(Date.parse(p.history[i].date)-Date.parse(p.history[i-1].date),86400000);}
});
test('unavailable low offer cannot undercut actual in-stock price',()=>{const p=structuredClone(products[0]);p.offers.push({...p.offers[0],id:'unavailable',price:1,inStock:false});assert.equal(currentPrice(p),currentPrice(products[0]));p.offers.forEach(o=>o.inStock=false);assert.equal(currentPrice(p),null);});
test('stale offer cannot undercut a fresh offer',()=>{const p=structuredClone(products[0]);p.offers.push({...p.offers[0],id:'stale',price:1,inStock:true,isStale:true});assert.equal(currentPrice(p),currentPrice(products[0]));});
test('filters combine category, brand, price and technical specification',()=>{const found=filterProducts(products,'laptops',{...defaults,brands:['Apple','ASUS'],max:100000,specs:{ram:['16']}});assert.equal(found.length,1);assert.equal(found[0].id,'asus-zenbook-14');assert.equal(filterProducts(products,undefined,{...defaults,query:'no such model'}).length,0);});
test('price sorting uses the minimum available offer',()=>{const found=filterProducts(products,'tvs',{...defaults,sort:'price-asc'});assert.equal(found[0].id,'xiaomi-a-pro-43');assert.ok(found.every((p,i)=>i===0||currentPrice(found[i-1])!<=currentPrice(p)!));});
test('comparison rejects missing IDs, mixed categories, and over four models',()=>{assert.equal(validateComparison(products.slice(0,2).map(p=>p.id),products).valid,true);assert.equal(validateComparison([products[0].id,products[9].id],products).valid,false);assert.equal(validateComparison(products.slice(0,5).map(p=>p.id),products).valid,false);assert.equal(validateComparison(['unknown'],products).valid,false);});
