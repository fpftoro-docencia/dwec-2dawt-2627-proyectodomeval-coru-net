// Copia a dist/ lo que se publica: las páginas HTML de la raíz, las carpetas de la web y el CSS de
// Bootstrap, en la misma ruta en la que lo enlazan las páginas (node_modules/bootstrap/dist/css/).
// Lo usa Vercel (`npm run build`) y no hace falta modificarlo. Si tu web tiene otra carpeta
// (por ejemplo, fuentes/), añádela a CARPETAS.
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';

const DESTINO = 'dist';
const CARPETAS = ['css', 'js', 'img'];
const BOOTSTRAP = 'node_modules/bootstrap/dist/css/bootstrap.min.css';

rmSync(DESTINO, { recursive: true, force: true });
mkdirSync(DESTINO, { recursive: true });
for (const pagina of readdirSync('.').filter((nombre) => nombre.endsWith('.html'))) {
  cpSync(pagina, `${DESTINO}/${pagina}`);
}
for (const carpeta of CARPETAS.filter((nombre) => existsSync(nombre))) {
  cpSync(carpeta, `${DESTINO}/${carpeta}`, { recursive: true });
}
if (!existsSync(BOOTSTRAP)) {
  console.error('❌ Falta Bootstrap: ejecuta npm ci (o npm install) antes de construir');
  process.exit(1);
}
mkdirSync(`${DESTINO}/node_modules/bootstrap/dist/css`, { recursive: true });
cpSync(BOOTSTRAP, `${DESTINO}/${BOOTSTRAP}`);

console.log(`✅ Web lista en ${DESTINO}/: ${readdirSync(DESTINO).sort().join(', ')}`);
