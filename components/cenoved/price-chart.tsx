'use client';
import { useId, useState } from 'react';
import { AreaChart,Area,ResponsiveContainer,CartesianGrid,XAxis,YAxis,Tooltip } from 'recharts';
import { money,dateLabel,type PricePoint } from '@/lib/catalog';

export function PriceChart({history,source='demo'}:{history:PricePoint[];source?:'demo'|'merchant_feed'}) {
 const [period,setPeriod]=useState(90),id=useId().replaceAll(':',''),data=history.slice(-period),prices=data.map(p=>p.price);
 const historySource=(history as PricePoint[]&{source?:'demo'|'merchant_feed'}).source||source;
 const note=historySource==='merchant_feed'
  ?'Фактические дневные наблюдения фида; дни без наблюдений не заполняются. Доставка не включена.'
  :'Минимальная цена доступных предложений за день. Доставка не включена. История сгенерирована для демоверсии.';
 return <div>
  <div className="chart-heading"><div className="panel-title" style={{margin:0}}><h2>История цены</h2></div><div className="period-picker" aria-label="Период истории">{[30,60,90].map(n=><button key={n} aria-pressed={period===n} className={period===n?'active':''} onClick={()=>setPeriod(n)}>{n} дней</button>)}</div></div>
  <div className="chart-box" role="img" aria-label={`Минимальная цена по дням за ${period} дней. Минимум ${prices.length?money(Math.min(...prices)):'неизвестен'}. Таблица значений доступна ниже.`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{top:15,right:4,left:-8,bottom:0}}><defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#536cf3" stopOpacity={.19}/><stop offset="95%" stopColor="#536cf3" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#edf0f5" strokeDasharray="3 4"/><XAxis dataKey="date" tickFormatter={dateLabel} minTickGap={45} axisLine={false} tickLine={false} tick={{fill:'#959eae',fontSize:11}} dy={8}/><YAxis domain={['auto','auto']} tickFormatter={v=>Math.round(Number(v)/1000)+' тыс.'} width={64} axisLine={false} tickLine={false} tick={{fill:'#959eae',fontSize:11}} tickCount={4}/><Tooltip labelFormatter={v=>dateLabel(String(v))} formatter={v=>[money(Number(v)),'Минимальная цена']} contentStyle={{borderRadius:9,border:'1px solid #e1e6ef',fontSize:12}}/><Area type="stepAfter" dataKey="price" stroke="#4c63ed" strokeWidth={2.5} fill={`url(#${id})`} isAnimationActive={false} dot={false} activeDot={{r:5,stroke:'#fff',strokeWidth:3}}/></AreaChart></ResponsiveContainer></div>
  <div className="history-summary"><div><span>Минимум за период</span><strong>{prices.length?money(Math.min(...prices)):'—'}</strong></div><div><span>Средняя цена</span><strong>{prices.length?money(Math.round(prices.reduce((a,b)=>a+b,0)/prices.length)):'—'}</strong></div></div>
  <p className="history-note">{note}</p>
  <details className="history-note"><summary>Посмотреть цены в таблице</summary><div style={{maxHeight:220,overflow:'auto',marginTop:12}}><table className="spec-table"><thead><tr><th>Дата</th><th>Цена</th></tr></thead><tbody>{data.map(p=><tr key={p.date}><td>{dateLabel(p.date)}</td><td>{money(p.price)}</td></tr>)}</tbody></table></div></details>
 </div>;
}
