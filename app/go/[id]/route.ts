import { getOffer,recordClick } from '@/lib/repository';
const allowedHosts=new Set(['www.dns-shop.ru','www.citilink.ru','www.mvideo.ru','www.ozon.ru','market.yandex.ru','www.eldorado.ru']);
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}) {
 const offer=await getOffer((await params).id);
 if(!offer)return Response.json({error:'Предложение не найдено'},{status:404});
 if(!offer.inStock||offer.isStale)return Response.json({error:'Предложение недоступно или устарело'},{status:410});
 let target:URL;try{target=new URL(offer.shopUrl);}catch{return Response.json({error:'Некорректная ссылка магазина'},{status:422});}
 if(target.protocol!=='https:'||!allowedHosts.has(target.hostname)||target.username||target.password||target.port)return Response.json({error:'Магазин не разрешён'},{status:422});
 try{await recordClick(offer.id);}catch{console.error('click_record_failed');}
 return new Response(null,{status:302,headers:{Location:target.href,'Cache-Control':'no-store','Referrer-Policy':'no-referrer','X-Robots-Tag':'noindex, nofollow'}});
}
