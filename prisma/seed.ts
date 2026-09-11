import { PrismaClient } from '@prisma/client';
import { categories, products } from '../lib/seed-data';
const db=new PrismaClient();
async function main(){
 await db.$transaction(async tx=>{
  for(const c of categories)await tx.category.upsert({where:{id:c.id},create:c,update:c});
  for(const p of products){
   const {offers,history,reviews,...core}=p;
   await tx.product.upsert({where:{id:p.id},create:core,update:core});
   for(const offer of offers)await tx.offer.upsert({where:{id:offer.id},create:{...offer,updatedAt:new Date(offer.updatedAt)},update:{...offer,updatedAt:new Date(offer.updatedAt)}});
   for(const h of history){const date=new Date(h.date+'T00:00:00Z');await tx.priceHistory.upsert({where:{productId_date_sourceKind:{productId:p.id,date,sourceKind:'DEMO'}},create:{productId:p.id,price:h.price,date,sourceKind:'DEMO'},update:{price:h.price}});}
   for(const r of reviews){const data={...r,productId:p.id,date:new Date(r.date)};await tx.review.upsert({where:{id:r.id},create:data,update:data});}
  }
 },{timeout:60000});
 console.log(`Seed complete: ${categories.length} categories, ${products.length} products, ${products.reduce((n,p)=>n+p.offers.length,0)} offers, ${products.length*90} daily prices.`);
}
main().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>db.$disconnect());
