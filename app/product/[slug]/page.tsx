import { notFound } from 'next/navigation';
import { getCatalog, getProduct } from '@/lib/repository';
import { ProductDetail } from '@/components/cenoved/product-detail';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}) {const p=await getProduct((await params).slug);return {title:p?.name||'Товар не найден',description:p?.description};}
export default async function ProductPage({params}:{params:Promise<{slug:string}>}) {const p=await getProduct((await params).slug);if(!p)notFound();const {categories}=await getCatalog();const category=categories.find(c=>c.id===p.categoryId);if(!category)notFound();return <ProductDetail product={p} category={category}/>;}
