import { Skeleton } from '@/components/ui/skeleton';
export default function Loading(){return <main className="container" id="main" aria-busy="true" aria-label="Загружаем каталог"><div className="loading-grid">{Array.from({length:6},(_,i)=><Skeleton key={i} className="loading-card"/>)}</div></main>;}
