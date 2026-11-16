import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GTAOPass} from 'three/addons/postprocessing/GTAOPass.js';
import {FXAAShader} from 'three/addons/shaders/FXAAShader.js';

// ======================================================================
// CONFIG
// ======================================================================
const VERSION='2.0';
const LS={get(k,d){try{const v=localStorage.getItem('rr.'+k);return v==null?d:v}catch(e){return d}},set(k,v){try{localStorage.setItem('rr.'+k,v)}catch(e){}}};
const Q=new URLSearchParams(location.search);
const CFG={
  channel:(Q.get('channel')||LS.get('channel','jhonnydrumond')).replace(/^#/,'').trim().toLowerCase(),
  bots:+(Q.get('bots')||0),lobby:+(Q.get('lobby')||30),lobbyNext:+(Q.get('lobbynext')||15),max:+(Q.get('max')||40),
  quality:Q.get('quality')||LS.get('quality','high'),
  rounds:+(Q.get('rodadas')||LS.get('rounds','5')),
};
const QP={
  ultra:{pr:2,shadow:4096,grass:110000,trees:1,seg:440,bloom:1,rays:1,msaa:4,post:1,ao:16,aoHalf:0,fxaa:1,drMin:.75},
  high:{pr:1.5,shadow:2048,grass:60000,trees:.85,seg:380,bloom:1,rays:1,msaa:4,post:1,ao:0,aoHalf:0,fxaa:1,drMin:.72},
  medium:{pr:1.15,shadow:2048,grass:26000,trees:.6,seg:300,bloom:1,rays:0,msaa:2,post:1,fxaa:1,drMin:.66},
  low:{pr:.85,shadow:1024,grass:0,trees:.4,seg:220,bloom:0,rays:0,msaa:0,post:0,drMin:.55},
};
if(!QP[CFG.quality])CFG.quality='high';
let QL=QP[CFG.quality];

// ======================================================================
// UTILS
// ======================================================================
const V3=THREE.Vector3;
const rand=(a=0,b=1)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const UP=new V3(0,1,0);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mulberry(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function makeNoise(rng){
  const perm=[...Array(256).keys()];
  for(let i=255;i>0;i--){const j=Math.floor(rng()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]]}
  const p=new Uint8Array(512);for(let i=0;i<512;i++)p[i]=perm[i&255];
  const gx=[1,-1,1,-1,1,-1,0,0],gy=[1,1,-1,-1,0,0,1,-1];
  const F2=.5*(Math.sqrt(3)-1),G2=(3-Math.sqrt(3))/6;
  return(x,y)=>{
    const s=(x+y)*F2,i=Math.floor(x+s),j=Math.floor(y+s),t=(i+j)*G2;
    const x0=x-(i-t),y0=y-(j-t),i1=x0>y0?1:0,j1=1-i1;
    const x1=x0-i1+G2,y1=y0-j1+G2,x2=x0-1+2*G2,y2=y0-1+2*G2,ii=i&255,jj=j&255;
    let n=0,t0=.5-x0*x0-y0*y0;
    if(t0>0){const g=p[ii+p[jj]]&7;t0*=t0;n+=t0*t0*(gx[g]*x0+gy[g]*y0)}
    let t1=.5-x1*x1-y1*y1;
    if(t1>0){const g=p[ii+i1+p[jj+j1]]&7;t1*=t1;n+=t1*t1*(gx[g]*x1+gy[g]*y1)}
    let t2=.5-x2*x2-y2*y2;
    if(t2>0){const g=p[ii+1+p[jj+1]]&7;t2*=t2;n+=t2*t2*(gx[g]*x2+gy[g]*y2)}
    return 70*n;
  };
}
function fbm(n,x,y,o=4){let a=1,f=1,s=0,m=0;for(let i=0;i<o;i++){s+=a*n(x*f,y*f);m+=a;a*=.5;f*=2.03}return s/m}
function ridged(n,x,y,o=5){let a=1,f=1,s=0,m=0,w=1;for(let i=0;i<o;i++){let v=1-Math.abs(n(x*f,y*f));v*=v*w;w=clamp(v*1.6,0,1);s+=v*a;m+=a;a*=.5;f*=2.07}return s/m}

