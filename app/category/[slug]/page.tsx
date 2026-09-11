import { notFound } from 'next/navigation';
import { getCatalog } from '@/lib/repository';
import { Catalog } from '@/components/cenoved/catalog';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const {slug}=await params;const data=await getCatalog();return {title:data.categories.find(c=>c.slug===slug)?.name||'Категория не найдена'};}
export default async function CategoryPage({params,searchParams}:{params:Promise<{slug:string}>;searchParams:Promise<{q?:string}>}) {const [{slug},search,data]=await Promise.all([params,searchParams,getCatalog()]);const category=data.categories.find(c=>c.slug===slug);if(!category)notFound();return <Catalog {...data} category={category} initialQuery={typeof search.q==='string'?search.q:''}/>;}
