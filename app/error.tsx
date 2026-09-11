'use client';
export default function ErrorPage({reset}:{error:Error;reset:()=>void}){return <main id="main" className="container not-found"><h1>Не удалось загрузить данные</h1><p>Попробуйте ещё раз. Если ошибка повторяется, вернитесь позже.</p><button className="primary-button" onClick={reset}>Попробовать снова</button></main>;}
