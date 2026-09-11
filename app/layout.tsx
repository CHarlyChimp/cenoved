import type { Metadata } from 'next';
import { AppShell } from '@/components/cenoved/app-shell';
import './globals.css';
export const metadata: Metadata = {
 title: { default: 'ЦеноВед — сравнение цен на технику', template: '%s · ЦеноВед' },
 description: 'Сравнивайте телевизоры и ноутбуки по характеристикам, предложениям магазинов и истории цен. Демонстрационная версия.',
 robots: { index: false, follow: false }, icons: { icon: '/favicon.svg' },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
 return <html lang="ru"><body><AppShell>{children}</AppShell></body></html>;
}
