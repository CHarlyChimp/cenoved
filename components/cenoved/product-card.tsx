'use client';
import Link from 'next/link';
import { Star, TrendingDown, ArrowUpRight } from 'lucide-react';
import { currentPrice,money,priceChange,rating,type Product } from '@/lib/catalog';
import { CompareButton } from './app-shell';
export function ProductCard({product:p}:{product:Product}) {
 const price=currentPrice(p),change=priceChange(p),count=p.offers.filter(o=>o.inStock).length;
 return <article className="product-card">
  <div className="card-image"><Link href={'/product/'+p.slug} tabIndex={-1} aria-hidden="true"><img src={p.images[0]} alt="" width="300" height="210" loading="lazy"/></Link><span className={'price-chip '+(change<0?'down':'')}>{change<0?<TrendingDown size={14}/>:null}{change<0?'Цена снизилась':'История цены'}</span></div>
  <div className="card-body"><div className="card-meta"><span>{p.brand}</span><span className="rating"><Star size={14} fill="currentColor"/>{rating(p).toFixed(1)} <span>({p.reviews.length})</span></span></div><Link className="product-title" href={'/product/'+p.slug}>{p.name}</Link><p className="card-specs">{p.specs.screen}″ · {p.specs.display} · {p.categoryId==='laptops'?`${p.specs.ram} ГБ / ${p.specs.storage} ГБ`:`4K · ${p.specs.refresh} Гц`}</p><div className="card-price"><div><small>{price!==null?'от':' '}</small><strong>{price!==null?money(price):'Нет в наличии'}</strong></div><span className="price-delta">{change>0?'+':''}{change}%<small>за 90 дней</small></span></div><Link className="offers-link" href={'/product/'+p.slug+'#offers'}>{count} предложения <ArrowUpRight size={15}/></Link><div className="card-actions"><Link className="details-button" href={'/product/'+p.slug}>Подробнее <ArrowUpRight size={16}/></Link><CompareButton product={p} compact/></div></div>
 </article>;
}
