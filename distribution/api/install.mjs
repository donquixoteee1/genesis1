import {createHash,timingSafeEqual} from 'node:crypto';
import {readFile} from 'node:fs/promises';

export function validDownloadKey(authorization,hashes){
  if(typeof authorization!=='string'||!/^Bearer [A-Za-z0-9_-]{43}$/.test(authorization))return false;
  const actual=createHash('sha256').update(authorization.slice(7)).digest();
  return String(hashes||'').split(',').some(hash=>/^[a-f0-9]{64}$/.test(hash)&&timingSafeEqual(actual,Buffer.from(hash,'hex')));
}
export function installerHandler({keyHashes=()=>process.env.GENESIS_DOWNLOAD_KEY_HASHES,canonicalHost=()=>process.env.GENESIS_CANONICAL_HOST,load=()=>readFile(new URL('../payload/install.sh',import.meta.url),'utf8')}={}){
  return async function(req,res){
    res.setHeader('Cache-Control','private, no-store, max-age=0');
    res.setHeader('Vary','Authorization');
    res.setHeader('X-Robots-Tag','noindex, nofollow, nosnippet, noarchive');
    res.setHeader('X-Content-Type-Options','nosniff');
    if(req.url?.split('?')[0]!=='/api/install'||!canonicalHost()||req.headers?.host!==canonicalHost()||!['GET','HEAD'].includes(req.method)||!validDownloadKey(req.headers?.authorization,keyHashes())){
      res.statusCode=404;res.end('Not found');return;
    }
    try{
      const script=await load();
      res.setHeader('Content-Type','text/plain; charset=utf-8');
      res.setHeader('Content-Disposition','attachment; filename="genesis-install.sh"');
      res.statusCode=200;res.end(req.method==='HEAD'?'':script);
    }catch{
      res.statusCode=503;res.end('Installer unavailable');
    }
  };
}
export default installerHandler();
