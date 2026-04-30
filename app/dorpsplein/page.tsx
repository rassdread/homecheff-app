import { redirect } from 'next/navigation';

/** Dorpsplein staat samen met inspiratie op `/inspiratie?bron=dorpsplein` (één ontdek-pagina). */
export default function DorpspleinRedirectPage() {
  redirect('/inspiratie?bron=dorpsplein');
}
