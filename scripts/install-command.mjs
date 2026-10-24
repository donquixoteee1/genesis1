import {readFileSync} from 'node:fs';
const network=readFileSync(new URL('./templates/network.sh',import.meta.url),'utf8').trim();
const quote=value=>"'"+value.replaceAll("'","'\"'\"'")+"'";
export function makeInstallCommand({url,key}){
 const endpoint=new URL(url);
 if(endpoint.protocol!=='https:'||endpoint.username||endpoint.password||endpoint.search||endpoint.hash||endpoint.pathname!=='/api/install'||!/^Bearer [A-Za-z0-9_-]{43}$/.test('Bearer '+key))throw new Error('Invalid installer endpoint or key');
 const body=`set -euo pipefail; ${network}; genesis_file="$(mktemp "\u0024{TMPDIR:-/tmp}/genesis-install.XXXXXX")"; trap 'rm -f "$genesis_file"' EXIT; curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 --connect-timeout 15 --max-time 180 --retry 2 --retry-delay 1 -H ${quote('Authorization: Bearer '+key)} -o "$genesis_file" ${quote(endpoint.href)}; bash "$genesis_file"`;
 return 'bash -c '+quote(body);
}
