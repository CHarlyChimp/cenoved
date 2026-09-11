'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Search, ChartNoAxesColumnIncreasing, ArrowRight, X, Laptop, Tv, ShieldCheck, Check } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import type { Product } from '@/lib/catalog';

export type Selected = Pick<Product,'id'|'categoryId'|'name'|'images'>;
type CompareState = { selected:Selected[]; toggle:(p:Selected)=>void; replace:(p:Selected[])=>void; clear:()=>void; href:string; ready:boolean };
const CompareContext=createContext<CompareState|null>(null);
export function useComparison(){const c=useContext(CompareContext);if(!c)throw new Error('Missing comparison context');return c;}
function validSelected(v:unknown):v is Selected {if(!v||typeof v!=='object')return false;const p=v as Selected;return typeof p.id==='string'&&typeof p.name==='string'&&typeof p.categoryId==='string'&&Array.isArray(p.images)&&p.images.every(x=>typeof x==='string'&&x.startsWith('/products/'));}
export function AppShell({children}:{children:ReactNode}) {
 const [selected,setSelected]=useState<Selected[]>([]),[ready,setReady]=useState(false),[query,setQuery]=useState('');
 const router=useRouter(),pathname=usePathname();
 useEffect(()=>{try{const v=JSON.parse(localStorage.getItem('cenoved-compare-v1')||'[]');if(Array.isArray(v)){const safe=v.filter(validSelected).slice(0,4);if(new Set(safe.map(p=>p.categoryId)).size<=1)setSelected(safe);}}catch{}setReady(true);},[]);
 useEffect(()=>{if(ready)try{localStorage.setItem('cenoved-compare-v1',JSON.stringify(selected));}catch{}},[selected,ready]);
 function toggle(p:Selected){
  if(selected.some(x=>x.id===p.id)){setSelected(selected.filter(x=>x.id!==p.id));return;}
  if(selected.length&&selected[0].categoryId!==p.categoryId){toast('Сравнивать можно товары одной категории',{description:'Заменить текущий список выбранным товаром?',action:{label:'Заменить',onClick:()=>setSelected([p])}});return;}
  if(selected.length===4){toast('В сравнении уже четыре товара',{description:'Уберите один, чтобы добавить новый.'});return;}
  setSelected([...selected,{id:p.id,categoryId:p.categoryId,name:p.name,images:p.images}]);
 }
 const href='/compare'+(selected.length?'?ids='+selected.map(p=>encodeURIComponent(p.id)).join(','):'');
 const value={selected,toggle,replace:setSelected,clear:()=>setSelected([]),href,ready};
 return <CompareContext.Provider value={value}>
  <a className="skip-link" href="#main">К содержимому</a>
  <header className="site-header"><div className="header-inner">
   <Link href="/" className="brand" aria-label="ЦеноВед — на главную"><img src="/favicon.svg" alt="" width="37" height="37"/><span>Цено<span className="brand-blue">Вед</span></span></Link>
   <form className="global-search" role="search" onSubmit={e=>{e.preventDefault();router.push('/?q='+encodeURIComponent(query.trim()));}}><Search size={20}/><input aria-label="Поиск товара" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Какую технику ищем?"/><button type="submit">Найти <ArrowRight size={16}/></button></form>
   <Link href={href} className="header-compare"><ChartNoAxesColumnIncreasing size={23}/><span>Сравнение</span><b>{selected.length}</b></Link>
  </div></header>
  <div className="subnav"><nav className="container"><Link href="/category/noutbuki" className={pathname.includes('noutbuki')?'active':''}><Laptop size={17}/>Ноутбуки</Link><Link href="/category/televizory" className={pathname.includes('televizory')?'active':''}><Tv size={17}/>Телевизоры</Link><span className="nav-divider"/><Dialog><DialogTrigger className="about-trigger"><ShieldCheck size={17}/>Как мы сравниваем</DialogTrigger><DialogContent><DialogHeader><DialogTitle>Выбор начинается с фактов</DialogTitle><DialogDescription>ЦеноВед сравнивает предложения и не продаёт товары.</DialogDescription></DialogHeader><div className="about-copy"><p><strong>Прозрачный порядок.</strong> Доступные предложения упорядочены по цене товара. Стоимость доставки уточняется у продавца.</p><p><strong>Наблюдаемая история.</strong> График показывает минимальную цену доступных предложений по дням. Цена сама по себе не доказывает, что продавец создаёт фиктивную скидку.</p><p><strong>Сейчас это демоверсия.</strong> Все цены, комплектации, наличие и отзывы — учебные данные. Магазины не подключены. Внешняя ссылка открывает главную страницу магазина.</p></div></DialogContent></Dialog><span className="demo-pill">Демо · 18 моделей</span></nav></div>
  {children}
  <footer className="site-footer container"><div className="footer-brand">ЦеноВед<span>Выбор за вами.</span></div><p>Демонстрационные цены, характеристики и отзывы.<br/>Данные не являются предложением о продаже.</p><span className="footer-year">2026 · MVP</span></footer>
  {!!selected.length&&!pathname.startsWith('/compare')&&<div className="compare-tray"><div className="tray-label"><ChartNoAxesColumnIncreasing size={23}/><div><strong>Сравним в деталях</strong><span>{selected.length} из 4 товаров</span></div></div><div className="tray-items">{selected.map(p=><div className="tray-item" key={p.id}><img src={p.images[0]} alt={p.name}/><button aria-label={'Убрать '+p.name} onClick={()=>toggle(p)}><X size={12}/></button></div>)}</div><Link href={href} className="primary-button">Сравнить <ArrowRight size={16}/></Link><button className="icon-button tray-clear" aria-label="Очистить сравнение" onClick={()=>setSelected([])}><X size={19}/></button></div>}
  <Toaster position="bottom-right" richColors closeButton/>
 </CompareContext.Provider>;
}
export function CompareButton({product,compact=false}:{product:Selected;compact?:boolean}) {const {selected,toggle}=useComparison(),active=selected.some(p=>p.id===product.id);return <button type="button" className={'compare-button '+(active?'is-selected ':'')+(compact?'compact':'')} onClick={()=>toggle(product)} aria-label={(active?'Убрать из сравнения: ':'Сравнить: ')+product.name} aria-pressed={active}>{active?<Check size={17}/>:<ChartNoAxesColumnIncreasing size={17}/>}<span>{active?'В сравнении':'Сравнить'}</span></button>;}
