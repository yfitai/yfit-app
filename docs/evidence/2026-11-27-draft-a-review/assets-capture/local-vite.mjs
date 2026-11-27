import {build, preview} from './source/node_modules/vite/dist/node/index.js';
import react from './source/node_modules/@vitejs/plugin-react/dist/index.cjs';
import tailwindcss from './source/node_modules/@tailwindcss/vite/dist/index.mjs';
import path from 'node:path';
import fs from 'node:fs';
const root = path.resolve(new URL('./source', import.meta.url).pathname);
const output = path.resolve(new URL('./offline-web', import.meta.url).pathname);
const config = {root, configFile:false, plugins:[react(), tailwindcss()], resolve:{alias:{'@':path.join(root,'src')}}, cacheDir:path.resolve(new URL('./vite-cache',import.meta.url).pathname), build:{outDir:output, emptyOutDir:true, sourcemap:false, chunkSizeWarningLimit:3000}};
if (!fs.existsSync(path.join(output,'index.html'))) await build(config);
const server = await preview({...config, preview:{host:'127.0.0.1',port:Number(process.env.LOCAL_PORT || '5277'),strictPort:true,open:false}});
console.log('LOCAL_READY',server.resolvedUrls.local[0]);
let closing=false;
function stop() { if(closing)return;closing=true;server.httpServer.close(()=>process.exit(0));setTimeout(()=>process.exit(0),2000); }
process.on('SIGTERM',stop);process.on('SIGINT',stop);
setTimeout(stop,180000);
