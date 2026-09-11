'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight,ArrowUpRight,ChevronRight,Star,Info,TrendingDown } from 'lucide-react';
import { Tabs,TabsList,TabsTrigger,TabsContent } from '@/components/ui/tabs';
import { Table,TableBody,TableRow,TableHead,TableCell } from '@/components/ui/table';
import { currentPrice,money,dateLabel,formatSpec,priceChange,rating,type Product,type Category } from '@/lib/catalog';
import { CompareButton } from './app-shell';
import { PriceChart } from './price-chart';
import { PriceReportButton } from './price-report';

export function ProductDetail({product:p,category}:{product:Product;category:Category}) {
 const [tab,setTab]=useState('offers'),[photo,setPhoto]=useState(0);
 const price=currentPrice(p),offers=[...p.offers].sort((a,b)=>Number(b.inStock)-Number(a.inStock)||a.price-b.price),change=priceChange(p);
 const hasRealOffers=offers.some(offer=>offer.sourceKind==='MERCHANT_FEED');
 function openSection(id:string){setTab(id);setTimeout(()=>document.getElementById('detail-tabs')?.scrollIntoView({behavior:'smooth',block:'start'}),30);}
 const offersSection=<section className="white-panel" id="offers">
  <div className="panel-title"><h2>Предложения магазинов</h2><span>Всего: {offers.length}</span></div>
  {offers.map((offer,index)=><div className={'offer-row '+(!offer.inStock?'unavailable':'')} key={offer.id}>
   <div>
    <div className="offer-store"><span className="shop-avatar">{offer.shopName.slice(0,2)}</span><div><strong>{offer.shopName}</strong>{index===0&&offer.inStock&&<b className="shop-best">Лучшая цена</b>}<span>{offer.inStock?offer.delivery:'Нет в наличии'}</span></div></div>
    <div className="offer-meta">{offer.sourceKind==='MERCHANT_FEED'?'Получено из фида':'Демонстрационные данные'} · {dateLabel(offer.updatedAt)}</div>
   </div>
   <div>
    <div className="offer-price">{money(offer.price)}</div>
    <div className="offer-action">{offer.inStock?<a href={'/go/'+encodeURIComponent(offer.id)} target="_blank" rel="noopener noreferrer nofollow">Перейти в магазин <ArrowUpRight size={14}/></a>:<span className="availability">Недоступно</span>}</div>
    <PriceReportButton offerId={offer.id} enabled={offer.sourceKind==='MERCHANT_FEED'}/>
   </div>
  </div>)}
  <p className="history-note">{hasRealOffers?'Сортировка по цене товара без доставки. Данные из фида отражают состояние на указанное время; окончательную цену подтвердите у продавца.':'Все предложения и ссылки в текущем каталоге демонстрационные; цены у продавцов не подтверждены.'}</p>
 </section>;
 const specs=<section className="white-panel"><div className="panel-title"><h2>Характеристики</h2></div><p className="description-text">{p.description}</p><Table className="spec-table"><TableBody>{category.attributes.map(attribute=><TableRow key={attribute.key}><TableHead scope="row">{attribute.label}</TableHead><TableCell>{formatSpec(p.specs[attribute.key],attribute)}</TableCell></TableRow>)}</TableBody></Table></section>;
 const reviews=<section className="white-panel"><div className="panel-title"><h2>Отзывы покупателей</h2><span>Демонстрационные</span></div><div className="review-grid">{p.reviews.map(review=><article className="review-card" key={review.id}><div><strong>{review.author}</strong><time dateTime={review.date}>{dateLabel(review.date)}</time></div><div className="review-stars" aria-label={`${review.rating} из 5`}>{Array.from({length:5},(_,index)=><Star key={index} size={14} fill={index<review.rating?'currentColor':'none'}/>)}</div><p>{review.text}</p></article>)}</div></section>;
 return <main id="main" className="container detail-main">
  <div className="breadcrumb"><Link href="/">Главная</Link><ChevronRight size={13}/><Link href={'/category/'+category.slug}>{category.name}</Link><ChevronRight size={13}/><span>{p.brand}</span></div>
  <div className="detail-heading"><div><h1>{p.name}</h1><div className="product-subline"><span className="rating"><Star size={15} fill="currentColor"/>{rating(p).toFixed(1)}</span><button className="text-button" onClick={()=>openSection('reviews')}>{p.reviews.length} демоотзыва</button><span>·</span><span>{p.brand}</span><span>·</span><span>Код: {p.id}</span></div></div><CompareButton product={p}/></div>
  <div className="detail-overview"><div className="product-gallery"><img className="main-product-image" src={p.images[photo]} alt={p.name+' — фото '+(photo+1)} width="600" height="400"/><div className="gallery-thumbs">{p.images.map((src,index)=><button aria-label={'Показать фото '+(index+1)} aria-pressed={photo===index} key={src} className={photo===index?'active':''} onClick={()=>setPhoto(index)}><img src={src} alt=""/></button>)}</div><p className="gallery-caption">{p.imageCaption}</p></div><section className="quick-specs"><h2>Главное о модели</h2><dl>{category.attributes.slice(0,6).map(attribute=><div className="spec-line" key={attribute.key}><dt>{attribute.label}</dt><dd>{formatSpec(p.specs[attribute.key],attribute)}</dd></div>)}</dl><button className="inline-link" onClick={()=>openSection('specs')}>Все характеристики <ArrowRight size={14}/></button></section><aside className="price-summary"><span className="summary-label">Лучшая цена из {offers.filter(offer=>offer.inStock).length} предложений</span><strong className="big-price">{price!==null?money(price):'Нет в наличии'}</strong><div className="history-mini"><TrendingDown size={17}/>{change<0?`На ${Math.abs(change)}% ниже, чем 90 дней назад`:`Изменение за 90 дней: ${change}%`}</div><button className="primary-button" onClick={()=>openSection('offers')}>Сравнить предложения <ArrowRight size={16}/></button><p>Цена без доставки. Наличие и окончательную стоимость уточняйте у продавца.</p></aside></div>
  <div className="demo-notice"><Info size={16}/><span>{hasRealOffers?'Предложения из фида отмечены отдельно. Характеристики, изображения, история без фактических наблюдений и отзывы могут оставаться демонстрационными.':'Демоверсия: цены, комплектации, наличие, история и отзывы сгенерированы. Реальные магазины пока не передают данные в ЦеноВед.'}</span></div>
  <Tabs id="detail-tabs" value={tab} onValueChange={setTab} className="detail-tabs"><TabsList className="detail-tab-list" variant="line"><TabsTrigger value="offers">Цены <span style={{color:'#929bac',marginLeft:3}}>{offers.length}</span></TabsTrigger><TabsTrigger value="specs">Характеристики</TabsTrigger><TabsTrigger value="history">История цены</TabsTrigger><TabsTrigger value="reviews">Отзывы {p.reviews.length}</TabsTrigger></TabsList><TabsContent value="offers"><div className="detail-content-grid">{offersSection}<section className="white-panel"><PriceChart history={p.history}/></section></div></TabsContent><TabsContent value="specs">{specs}</TabsContent><TabsContent value="history"><section className="white-panel" style={{maxWidth:900}}><PriceChart history={p.history}/></section></TabsContent><TabsContent value="reviews">{reviews}</TabsContent></Tabs>
 </main>;
}
