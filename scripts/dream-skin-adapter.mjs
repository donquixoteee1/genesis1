import {Script} from 'node:vm';
const marker='/* GENESIS local adapter v1 */';
const anchor='  const THEME = themeConfig && typeof themeConfig === "object" ? themeConfig : {};';
export function adaptTemplate(original,extension,css){
  if(original.includes(marker))throw new Error('GENESIS adapter is already installed');
  if(original.split(anchor).length!==2)throw new Error('Unsupported Dream Skin renderer layout');
  const adapted=original.replace(anchor,()=>anchor+'\n'+marker+'\n  if(THEME.id === "genesis") cssText = '+JSON.stringify(css)+';')+'\n;'+extension+'\n';
  new Script(adapted,{filename:'genesis-dream-skin-payload.js'});
  return adapted;
}
