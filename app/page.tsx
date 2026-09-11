import { Catalog } from '@/components/cenoved/catalog';
import { getCatalog } from '@/lib/repository';
export default async function Home({searchParams}:{searchParams:Promise<{q?:string}>}) {const [data,search]=await Promise.all([getCatalog(),searchParams]);return <Catalog {...data} initialQuery={typeof search.q==='string'?search.q:''}/>;}
