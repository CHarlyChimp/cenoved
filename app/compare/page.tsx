import { getCatalog } from '@/lib/repository';
import { Comparison } from '@/components/cenoved/comparison';
export const metadata={title:'Сравнение товаров'};
export default async function ComparePage({searchParams}:{searchParams:Promise<{ids?:string}>}) {const [data,search]=await Promise.all([getCatalog(),searchParams]);const ids=typeof search.ids==='string'?[...new Set(search.ids.split(',').filter(Boolean))]:[];return <Comparison {...data} initialIds={ids}/>;}
