import type { Category, Product, Offer, PricePoint } from './catalog';
export const SEED_DATE='2026-09-10T09:00:00.000Z';
export const categories:Category[]=[
 {id:'laptops',slug:'noutbuki',name:'Ноутбуки',description:'Для работы, творчества и всего между ними',attributes:[{key:'screen',label:'Диагональ экрана',type:'number',unit:'″',filter:true},{key:'ram',label:'Оперативная память',type:'number',unit:'ГБ',filter:true},{key:'storage',label:'Объём SSD',type:'number',unit:'ГБ',filter:true},{key:'display',label:'Тип экрана',type:'enum',filter:true},{key:'cpu',label:'Процессор',type:'string'},{key:'resolution',label:'Разрешение',type:'string'},{key:'weight',label:'Вес',type:'number',unit:'кг'},{key:'os',label:'Операционная система',type:'enum'}]},
 {id:'tvs',slug:'televizory',name:'Телевизоры',description:'Большой экран. Все детали перед глазами.',attributes:[{key:'screen',label:'Диагональ экрана',type:'number',unit:'″',filter:true},{key:'display',label:'Технология экрана',type:'enum',filter:true},{key:'refresh',label:'Частота обновления',type:'number',unit:'Гц',filter:true},{key:'resolution',label:'Разрешение',type:'string'},{key:'os',label:'Smart TV',type:'enum',filter:true},{key:'hdmi',label:'Порты HDMI',type:'number'},{key:'audio',label:'Мощность звука',type:'number',unit:'Вт'},{key:'year',label:'Модельный год',type:'number'}]}
];
type Row=[string,string,string,string,number,Record<string,string|number>];
const laptops:Row[]=[
 ['macbook-air-m2-256','Apple MacBook Air 13 M2','Apple','macbook',79990,{screen:13.6,ram:8,storage:256,display:'IPS',cpu:'Apple M2',resolution:'2560 × 1664',weight:1.24,os:'macOS'}],
 ['asus-zenbook-14','ASUS Zenbook 14 OLED','ASUS','asus',94990,{screen:14,ram:16,storage:512,display:'OLED',cpu:'Intel Core Ultra 5',resolution:'2880 × 1800',weight:1.28,os:'Windows 11'}],
 ['lenovo-ideapad-slim-5','Lenovo IdeaPad Slim 5','Lenovo','lenovo',64990,{screen:16,ram:16,storage:512,display:'IPS',cpu:'AMD Ryzen 5 7530U',resolution:'1920 × 1200',weight:1.89,os:'Windows 11'}],
 ['acer-swift-go-14','Acer Swift Go 14','Acer','acer',72990,{screen:14,ram:16,storage:512,display:'OLED',cpu:'Intel Core i5-13500H',resolution:'2880 × 1800',weight:1.25,os:'Windows 11'}],
 ['macbook-air-m2-512','Apple MacBook Air 13 M2 512 ГБ','Apple','macbook',96990,{screen:13.6,ram:8,storage:512,display:'IPS',cpu:'Apple M2',resolution:'2560 × 1664',weight:1.24,os:'macOS'}],
 ['asus-zenbook-14-1tb','ASUS Zenbook 14 OLED 1 ТБ','ASUS','asus',119990,{screen:14,ram:16,storage:1024,display:'OLED',cpu:'Intel Core Ultra 7',resolution:'2880 × 1800',weight:1.28,os:'Windows 11'}],
 ['lenovo-ideapad-slim-5-1tb','Lenovo IdeaPad Slim 5 1 ТБ','Lenovo','lenovo',77990,{screen:16,ram:16,storage:1024,display:'IPS',cpu:'AMD Ryzen 7 7730U',resolution:'1920 × 1200',weight:1.89,os:'Windows 11'}],
 ['acer-swift-go-14-32','Acer Swift Go 14 32 ГБ','Acer','acer',99990,{screen:14,ram:32,storage:1024,display:'OLED',cpu:'Intel Core Ultra 7',resolution:'2880 × 1800',weight:1.32,os:'Windows 11'}],
 ['macbook-air-m2-16','Apple MacBook Air 13 M2 16 ГБ','Apple','macbook',104990,{screen:13.6,ram:16,storage:512,display:'IPS',cpu:'Apple M2',resolution:'2560 × 1664',weight:1.24,os:'macOS'}]
];
const tvs:Row[]=[
 ['samsung-q70c-55','Samsung QLED 55 Q70C','Samsung','samsung',77990,{screen:55,display:'QLED',refresh:120,resolution:'3840 × 2160',os:'Tizen',hdmi:4,audio:20,year:2023}],
 ['lg-oled-c3-55','LG OLED 55 C3','LG','lg',119990,{screen:55,display:'OLED',refresh:120,resolution:'3840 × 2160',os:'webOS',hdmi:4,audio:40,year:2023}],
 ['tcl-c745-55','TCL QLED 55 C745','TCL','tcl',62990,{screen:55,display:'QLED',refresh:144,resolution:'3840 × 2160',os:'Google TV',hdmi:4,audio:30,year:2023}],
 ['xiaomi-a-pro-55','Xiaomi TV A Pro 55','Xiaomi','xiaomi',34990,{screen:55,display:'QLED',refresh:60,resolution:'3840 × 2160',os:'Google TV',hdmi:3,audio:20,year:2025}],
 ['samsung-q70c-65','Samsung QLED 65 Q70C','Samsung','samsung',99990,{screen:65,display:'QLED',refresh:120,resolution:'3840 × 2160',os:'Tizen',hdmi:4,audio:20,year:2023}],
 ['lg-oled-c3-65','LG OLED 65 C3','LG','lg',164990,{screen:65,display:'OLED',refresh:120,resolution:'3840 × 2160',os:'webOS',hdmi:4,audio:40,year:2023}],
 ['tcl-c745-65','TCL QLED 65 C745','TCL','tcl',83990,{screen:65,display:'QLED',refresh:144,resolution:'3840 × 2160',os:'Google TV',hdmi:4,audio:30,year:2023}],
 ['xiaomi-a-pro-43','Xiaomi TV A Pro 43','Xiaomi','xiaomi',27990,{screen:43,display:'QLED',refresh:60,resolution:'3840 × 2160',os:'Google TV',hdmi:3,audio:20,year:2025}],
 ['xiaomi-a-pro-65','Xiaomi TV A Pro 65','Xiaomi','xiaomi',47990,{screen:65,display:'QLED',refresh:60,resolution:'3840 × 2160',os:'Google TV',hdmi:3,audio:20,year:2025}]
];
const shops=[['DNS','https://www.dns-shop.ru/'],['Ситилинк','https://www.citilink.ru/'],['М.Видео','https://www.mvideo.ru/'],['Ozon','https://www.ozon.ru/'],['Яндекс Маркет','https://market.yandex.ru/'],['Эльдорадо','https://www.eldorado.ru/']];
const authors=['Алексей','Мария','Дмитрий','Анна'];
export function makeHistory(price:number,seed:number):PricePoint[] {return Array.from({length:90},(_,day)=>{const date=new Date(Date.parse(SEED_DATE)-(89-day)*86400000).toISOString().slice(0,10);const trend=(89-day)/89*(0.08+(seed%4)*0.015),wave=Math.sin(day*0.18+seed)*0.013+Math.sin(day*0.65)*0.005,dip=day>45&&day<56?-0.045:0;return {date,price:day===89?price:Math.round(price*(1+trend+wave+dip)/100)*100};});}
function product(row:Row,index:number,categoryId:string):Product {
 const [id,name,brand,img,price,specs]=row;
 const offers:Offer[]=Array.from({length:3+index%4},(_,j)=>({id:`${id}-offer-${j}`,productId:id,shopName:shops[(j+index)%6][0],shopUrl:shops[(j+index)%6][1],price:price+j*(900+(index%3)*700),currency:'RUB',inStock:!(j===4&&index%2===0),updatedAt:SEED_DATE,delivery:j%2?'Самовывоз в магазине':'Доставка по условиям магазина'}));
 return {id,slug:id,categoryId,name,brand,images:[`/products/${img}.webp`,`/products/${img}-2.webp`],imageCaption:'Изображение серии. Комплектация в демокаталоге условная.',specs,description:categoryId==='laptops'?`${name} — ноутбук для повседневной работы и творчества. Экран ${specs.screen} дюйма, ${specs.ram} ГБ оперативной памяти и SSD ${specs.storage} ГБ. Сравните комплектации и предложения перед покупкой.`:`${name} — телевизор с экраном ${specs.screen} дюймов и технологией ${specs.display}. Сравните частоту обновления, платформу Smart TV и предложения продавцов.`,popularity:100-index*3,offers,history:makeHistory(price,index),reviews:Array.from({length:2+index%3},(_,j)=>({id:`${id}-review-${j}`,author:authors[j],rating:(index+j)%4===0?4:5,text:categoryId==='laptops'?['Удобный экран для работы с документами, клавиатура понравилась.','Быстро включается, хватает для повседневных задач. Хотелось бы больше портов.','Понравились вес и качество сборки. Для поездок удобно.','Экран яркий, приложения работают плавно.'][j]:['Хорошая картинка в фильмах, настройка заняла несколько минут.','Для вечернего просмотра подошёл. Встроенного звука хватает для небольшой комнаты.','Удобно подключать консоль. Меню понятное.','Нравится цветопередача, но стоит настроить яркость под комнату.'][j],date:new Date(Date.parse(SEED_DATE)-(j*9+index+2)*86400000).toISOString()}))};
}
export const products:Product[]=[...laptops.map((r,i)=>product(r,i,'laptops')),...tvs.map((r,i)=>product(r,i+9,'tvs'))];
