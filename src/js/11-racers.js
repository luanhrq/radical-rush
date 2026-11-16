// ======================================================================
// RACERS
// ======================================================================
const racers=new Map(),pending=new Map(),session=new Map();
const hazGroup=new THREE.Group();scene.add(hazGroup);
let hazards=[],missiles=[];
function fixColor(c){const col=new THREE.Color(/^#[0-9a-f]{6}$/i.test(c||'')?c:new THREE.Color().setHSL(Math.random(),.85,.55));const h={};col.getHSL(h);if(h.l<.4)h.l=.45;if(h.l>.72)h.l=.68;if(h.s<.45)h.s=.7;col.setHSL(h.h,h.s,h.l);return'#'+col.getHexString()}
const avatarCache=new Map();
function loadImg(url){return new Promise((res,rej)=>{const i=new Image();i.crossOrigin='anonymous';const to=setTimeout(()=>rej('timeout'),9000);i.onload=()=>{clearTimeout(to);res(i)};i.onerror=e=>{clearTimeout(to);rej(e)};i.src=url})}
const AVSTAT={ok:0,html:0,fail:0};
function getAvatar(login){
  if(avatarCache.has(login))return avatarCache.get(login);
  const p=(async()=>{
    // 1) decapi devolve o endereço da foto de perfil da Twitch
    let url=null;
    try{const r=await fetch('https://decapi.me/twitch/avatar/'+encodeURIComponent(login));const u=(await r.text()).trim();if(/^https:\/\//.test(u))url=u}catch(e){console.info('[foto]',login,'decapi falhou',e&&e.message)}
    // 2) tenta a imagem direto, depois por um proxy de imagens com CORS, depois o unavatar
    const tries=[];if(url){tries.push(url,'https://images.weserv.nl/?url='+encodeURIComponent(url)+'&w=256&h=256&fit=cover')}
    tries.push('https://unavatar.io/twitch/'+encodeURIComponent(login)+'?fallback=false');
    for(const u of tries){try{const img=await loadImg(u);AVSTAT.ok++;console.info('[foto]',login,'ok',u);return{img,url:u}}catch(e){}}
    // 3) sem CORS: a foto ainda aparece no placar (HTML), e o boneco usa as iniciais
    if(url){AVSTAT.html++;console.info('[foto]',login,'só no placar',url);return{img:null,url}}
    AVSTAT.fail++;console.info('[foto]',login,'sem foto');return null})();
  avatarCache.set(login,p);return p;
}
function botAvatar(name,color){const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createLinearGradient(0,0,128,128);g.addColorStop(0,color);g.addColorStop(1,new THREE.Color(color).offsetHSL(.12,0,-.2).getStyle());x.fillStyle=g;x.fillRect(0,0,128,128);
  x.fillStyle='rgba(255,255,255,.18)';for(let i=-128;i<128;i+=28){x.beginPath();x.moveTo(i,128);x.lineTo(i+128,0);x.lineTo(i+142,0);x.lineTo(i+14,128);x.fill()}
  x.font='800 60px Rubik, sans-serif';x.fillStyle='#fff';x.textAlign='center';x.textBaseline='middle';x.fillText(name.slice(0,2).toUpperCase(),64,68);return c}
function dominantColor(img){try{const c=document.createElement('canvas');c.width=c.height=24;const x=c.getContext('2d');drawCover(x,img,0,0,24,24);const d=x.getImageData(0,0,24,24).data;
  let best=null,bs=-1,ar=0,ag=0,ab=0;const col=new THREE.Color(),h={};
  for(let i=0;i<d.length;i+=4){col.setRGB(d[i]/255,d[i+1]/255,d[i+2]/255,THREE.SRGBColorSpace);col.getHSL(h,THREE.SRGBColorSpace);const sc=h.s*(1-Math.abs(h.l-.5)*1.6);ar+=d[i];ag+=d[i+1];ab+=d[i+2];if(sc>bs){bs=sc;best=[d[i],d[i+1],d[i+2]]}}
  const n=d.length/4;const pk=bs>.25?best:[ar/n,ag/n,ab/n];return'#'+new THREE.Color().setRGB(pk[0]/255,pk[1]/255,pk[2]/255,THREE.SRGBColorSpace).getHexString(THREE.SRGBColorSpace)}catch(e){return null}}
function circleCanvas(img){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');x.beginPath();x.arc(128,128,128,0,Math.PI*2);x.clip();drawCover(x,img,0,0,256,256);return c}
function recolor(r,color){r.color=color;const m=r.m,c1=new THREE.Color(color);m.helmMat.color.copy(c1);m.paintMat.color.copy(c1);m.skiMat.color.copy(c1);m.wingMat.color.copy(c1).offsetHSL(0,0,-.08);
  // body vertex colors: rebuild by swapping hue on colored verts is complex; tint via material color instead
  m.bodyMat.color.set(0xffffff).lerp(c1,.0)}
// rosto: a foto do perfil vira o rosto do piloto (com borda que se funde na pele); sem foto, um rosto desenhado
function faceCanvas(img,skinHex){const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d');const sk=new THREE.Color(skinHex);const ss='#'+sk.getHexString();x.fillStyle=ss;x.fillRect(0,0,256,256);
  if(img){x.save();x.beginPath();x.ellipse(128,128,96,108,0,0,7);x.clip();drawCover(x,img,26,14,204,232);x.restore();
    const g=x.createRadialGradient(128,128,78,128,128,118);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,ss);x.fillStyle=g;x.fillRect(0,0,256,256)}
  else{const dk=sk.clone().multiplyScalar(.72),dd='#'+dk.getHexString();x.fillStyle='rgba(255,255,255,.07)';x.beginPath();x.ellipse(128,92,70,40,0,0,7);x.fill();
    for(const ex of[92,164]){x.fillStyle='#f6f3ee';x.beginPath();x.ellipse(ex,122,15,9,0,0,7);x.fill();x.fillStyle='#3a2a1e';x.beginPath();x.arc(ex+2,123,6.5,0,7);x.fill();x.fillStyle='#0b0b0b';x.beginPath();x.arc(ex+2,123,3.2,0,7);x.fill();x.fillStyle='#fff';x.beginPath();x.arc(ex+4,121,1.6,0,7);x.fill();
      x.strokeStyle='#2a1c12';x.lineWidth=5;x.lineCap='round';x.beginPath();x.moveTo(ex-16,103);x.quadraticCurveTo(ex,95,ex+16,101);x.stroke()}
    x.strokeStyle=dd;x.lineWidth=4;x.beginPath();x.moveTo(128,128);x.quadraticCurveTo(122,152,130,158);x.stroke();
    x.strokeStyle='#8c3f37';x.lineWidth=5;x.beginPath();x.moveTo(108,182);x.quadraticCurveTo(128,194,148,182);x.stroke()}
  return c}
// paleta: k-means nas cores da foto -> cor principal, de destaque e escura (calça)
function avatarPalette(img){try{const c=document.createElement('canvas');c.width=c.height=32;const x=c.getContext('2d');drawCover(x,img,0,0,32,32);const d=x.getImageData(0,0,32,32).data;const px=[];for(let i=0;i<d.length;i+=4)px.push([d[i],d[i+1],d[i+2]]);
  let cs=[px[33],px[350],px[680],px[990]].map(p=>p.slice());let cnt=[0,0,0,0];
  for(let it=0;it<10;it++){const sum=cs.map(()=>[0,0,0,0]);for(const q of px){let b=0,bd=1e9;cs.forEach((cc,k)=>{const dd=(q[0]-cc[0])**2+(q[1]-cc[1])**2+(q[2]-cc[2])**2;if(dd<bd){bd=dd;b=k}});sum[b][0]+=q[0];sum[b][1]+=q[1];sum[b][2]+=q[2];sum[b][3]++}cs=sum.map((u,k)=>u[3]?[u[0]/u[3],u[1]/u[3],u[2]/u[3]]:cs[k]);cnt=sum.map(u=>u[3])}
  const info=cs.map((v,k)=>{const cc=new THREE.Color().setRGB(v[0]/255,v[1]/255,v[2]/255,THREE.SRGBColorSpace),h={};cc.getHSL(h,THREE.SRGBColorSpace);return{cc,h,n:cnt[k],score:cnt[k]*(.2+h.s)*(1.2-Math.abs(h.l-.5))}}).filter(o=>o.n>8);
  if(!info.length)return null;info.sort((a,b)=>b.score-a.score);const prim=info[0];const acc=info.find(o=>o!==prim&&Math.abs(o.h.h-prim.h.h)>.06&&o.h.s>.15)||info.find(o=>o!==prim)||prim;
  const dark=[...info].sort((a,b)=>a.h.l-b.h.l)[0];const hex=cc=>'#'+cc.getHexString(THREE.SRGBColorSpace);
  return{prim:fixColor(hex(prim.cc)),acc:fixColor(hex(acc.cc)),pant:'#'+dark.cc.clone().lerp(new THREE.Color(0x1a1d26),.45).getHexString()}}catch(e){return null}}
function applyAvatar(r,img,url,isPhoto=true){
  if(racers.get(r.login)!==r)return;
  if(isPhoto&&!r.isBot){const pal=avatarPalette(img);if(pal)rebuildRider(r,pal.prim,pal)}
  const tex=new THREE.CanvasTexture(circleCanvas(img));tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  const m=r.m;if(m.badgeM.map)m.badgeM.map.dispose();m.badgeM.map=tex;m.badgeM.needsUpdate=true;m.badgeParts.forEach(o=>o.visible=true);
  m.tag.material.map.dispose();m.tag.material.map=tagTex(r.name,r.color,img);m.tag.material.needsUpdate=true;
  if(isPhoto&&!r.isBot){const ft=new THREE.CanvasTexture(faceCanvas(img,m.skin));ft.colorSpace=THREE.SRGBColorSpace;ft.anisotropy=4;if(m.faceM.map)m.faceM.map.dispose();m.faceM.map=ft;m.faceM.needsUpdate=true;m.gog.position.set(0,.272,.07);m.gog.rotation.x=-.7}
  r.avatarUrl=url;r.avatarImg=img;
}
function disposeRider(m){scene.remove(m.root);m.root.traverse(o=>{if(o.isSkinnedMesh)o.skeleton.dispose();if(o.isSprite){o.material.map.dispose();o.material.dispose()}else if(o.isMesh&&o.geometry&&!Object.values(RG).includes(o.geometry))o.geometry.dispose()});m.mats.forEach(x=>{if(x.map)x.map.dispose();x.dispose()})}
function rebuildRider(r,color,pal){const old=r.m;r.color=color;r.m=makeRider(color,r.name,pal);r.root=r.m.root;scene.add(r.root);r.root.position.copy(old.root.position);r.root.quaternion.copy(old.root.quaternion);disposeRider(old);r.mod='';}
function avatarHTML(r,sz=20){return r.avatarUrl?`<img class="av" alt="" src="${esc(r.avatarUrl)}" style="width:${sz}px;height:${sz}px;border-color:${r.color}">`:`<span class="av" style="width:${sz}px;height:${sz}px;background:${r.color};border-color:${r.color}"></span>`}
function createRacer(login,name,color,isBot){
  const m=makeRider(color,name);scene.add(m.root);
  const r={login,name,color,isBot,m,root:m.root,s:0,lat:0,latT:0,latV:0,latTimer:0,v:0,skill:1,phase:rand(0,10),mod:'',fx:{boost:0,stun:0,slow:0,shield:0,trick:0,stuck:0},cd:{},finished:false,place:0,time:0,emit:0,trickKind:0,botT:rand(2,6),pedal:0,wheel:0};
  racers.set(login,r);
  if(isBot){const c=botAvatar(name,color);applyAvatar(r,c,c.toDataURL('image/png'),false)}
  else getAvatar(login).then(a=>{if(a&&a.img)applyAvatar(r,a.img,a.url,true);else{const c=botAvatar(name,r.color);applyAvatar(r,c,a&&a.url?a.url:c.toDataURL('image/png'),false)}});
  return r;
}
function removeRacer(r){disposeRider(r.m);racers.delete(r.login)}
function resetRacers(){let k=0;for(const r of racers.values()){r.s=START_S-5-Math.floor(k/5)*3.6;r.lat=((k%5)-2)*2.4;r.latT=r.lat;r.v=0;r.finished=false;r.place=0;r.time=0;for(const f in r.fx)r.fx[f]=0;r.lane=k;r.cd={};r.air=null;r.vb=null;r.vaultU=null;r.coins=0;r.out=false;r.landed=false;r.steered=false;r.chuteT=0;r.hop=0;r.skill=rand(.95,1.05);r.mod='';r.botT=rand(3,7);k++}}
const TA={pos:new V3(),tan:new V3(),side:new V3(),mod:'',surface:'',seg:0,lu:0,ground:0,i:0};
const CTA={pos:new V3(),tan:new V3(),side:new V3(),mod:'',surface:'',seg:0,lu:0,ground:0,i:0};
function trackAt(s,o){const S=W.S,f=clamp(s/DS,0,S.length-1.0001),i=f|0,t=f-i,a=S[i],b=S[i+1];
  o.pos.lerpVectors(a.p,b.p,t);o.tan.lerpVectors(a.t,b.t,t).normalize();o.side.lerpVectors(a.sd,b.sd,t).normalize();
  o.mod=a.mod;o.surface=a.surface;o.seg=a.seg;o.lu=a.lu;o.ground=lerp(a.ground,b.ground,t);o.i=i;return o}
const _look=new V3(),_v=new V3();
function updateRacer(r,dt,t){
  const e=r.fx;for(const k in e)if(e[k]>0)e[k]=Math.max(0,e[k]-dt);
  trackAt(r.s,TA);
  const M=MODS[TA.mod],air=M.surface==='air';
  const standing=air&&(TA.lu<.025)&&r.v<8;
  if(TA.mod!==r.mod){const was=r.mod;r.mod=TA.mod;setVehicle(r,r.mod);if(was&&G.state==='race'){burst(r.root.position.clone().setY(r.root.position.y+1.5),30,[1,1,1],9,2,1,0,3);burst(r.root.position.clone().setY(r.root.position.y+1.5),20,[1,.8,.4],8,1,.6,0,0,GLOW);if(!W.segFirst[TA.seg]){W.segFirst[TA.seg]=true;sfx(TA.mod==='nado'?'splash':'whoosh');banner('TROCA!',`${M.icon} ${M.label}`,1.8)}}}
  let target=0;
  if(G.state==='race'&&!r.finished){target=M.speed*r.skill;if(TA.mod==='paraquedas'&&TA.lu>.4)target*=.45;if(e.boost>0)target*=1.65;if(e.slow>0)target*=.45;if(G.windT>0)target*=1.25;if(G.slowT>0)target*=.8;target*=1+clamp((G.leaderS-r.s)/420,0,.18);if(e.stun>0||e.stuck>0)target=0}
  else if(r.finished)target=Math.max(0,(W.L-8-r.s))*.8;
  const k=e.stun>0?5:target>r.v?(e.boost>0?3:1.3):2.2;
  r.v+=(target-r.v)*(1-Math.exp(-k*dt));
  if(G.state==='race'||r.finished)r.s=Math.min(r.s+r.v*dt,W.L-6);
  if(G.state==='race'){r.latTimer-=dt;if(r.latTimer<=0){r.latTimer=rand(1.2,3.6);r.latT=rand(-1,1)*M.lat}}
  if(TA.mod==='remo')r.latT=(((r.lane||0)%8)-3.5)*2.6;
  const pl=r.lat;r.lat=lerp(r.lat,clamp(r.latT,-M.lat,M.lat),1-Math.exp(-dt*.9));r.latV=dt>0?(r.lat-pl)/dt:0;
  let jump=0;r.m.spin.rotation.set(0,0,0);
  const flyish=air||TA.mod==='nado';
  if(e.trick>0){const p=1-e.trick/1.3;if(!flyish)jump=Math.sin(p*Math.PI)*3.6;const a=smooth(.1,.9,p)*Math.PI*2;if(flyish)r.m.spin.rotation.z=a;else if(r.mod==='bike')r.m.spin.rotation.x=-a;else if(r.trickKind)r.m.spin.rotation.x=a;else r.m.spin.rotation.y=a}
  if(r.trickPending&&e.trick<=0){r.trickPending=false;resolveTrick(r)}
  if(e.stun>0){r.m.spin.rotation.x=t*11;r.m.spin.rotation.z=Math.sin(t*7)*.6;jump=Math.abs(Math.sin(t*6))*.8}
  const gm=hasRule('gravidade')?1.7:1;
  if(r.air){r.air.t+=dt;const k=r.air.t/r.air.dur;if(k>=1)r.air=null;else jump+=Math.sin(Math.PI*k)*r.air.h}
  r.vaultU=null;
  if(TA.mod==='vara'&&!r.finished&&W.bars){let b=null;for(const q of W.bars){if(r.s>q.s-7&&r.s<q.s+6){b=q;break}}
    if(b){if(r.vb!==b){r.vb=b;r.vok=e.stun>0?false:Math.random()<(e.slow>0?.55:e.boost>0?.95:.8);r.vfail=false}const u=(r.s-(b.s-7))/13;
      if(r.vok){r.vaultU=u;jump+=Math.sin(Math.PI*u)*7.4*gm;r.m.spin.rotation.x=-2.5*Math.sin(Math.PI*Math.min(u/.9,1))*(u<.9?1:0)}
      else{jump+=Math.sin(Math.PI*Math.min(u,.5))*4.4;if(u>.45&&!r.vfail&&G.state==='race'){r.vfail=true;stun(r,1.5);b.fall=1;sfx('crash',r.isBot?.5:1);if(!r.isBot||Math.random()<.4)feed(`🏃 <b>${esc(r.name)}</b> derrubou o sarrafo`)}}}}
  if(TA.mod==='windsurf'&&!r.air&&G.state==='race'&&!r.finished&&Math.random()<dt*.22)r.air={t:0,dur:.85,h:2.6*gm};
  r.chuteOpen=TA.mod==='paraquedas'&&TA.lu>.4;r.flare=TA.mod==='paraquedas'?smooth(.95,.98,TA.lu)*(1-smooth(.985,.99,TA.lu)):0;
  if(TA.mod==='paraquedas'){const ch=r.m.chute,cn=ch.getObjectByName('canopy'),sl=ch.getObjectByName('slider');if(r.chuteOpen){if(!ch.visible){ch.visible=true;r.chuteT=0;r.collapse=0;ch.position.set(0,5.6,0);ch.rotation.set(0,0,0);if(!r.isBot)sfx('whoosh',.7)}r.chuteT=Math.min(1,(r.chuteT||0)+dt*.9);const k=r.chuteT;
      cn.scale.set(.12+.88*smooth(.25,.85,k),.6+.4*smooth(.2,.7,k),.35+.65*smooth(.15,.6,k));if(sl)sl.position.y=lerp(-.9,-3.55,smooth(.3,1,k));
      const fl=smooth(.95,.98,TA.lu);ch.rotation.z=lerp(ch.rotation.z,clamp(-r.latV*.16,-.5,.5),1-Math.exp(-dt*3));ch.rotation.x=Math.sin(t*1.2+r.phase)*.04-fl*.3;
      if(TA.lu>.985||r.finished){r.collapse=Math.min(1,(r.collapse||0)+dt*.8);const c=smooth(0,1,r.collapse);ch.position.set(0,lerp(5.6,.9,c),lerp(0,-4.2,c));ch.rotation.x=-1.25*c;cn.scale.y*=1-.65*c}}else ch.visible=false;
    if(TA.lu>.82&&!r.steered){r.steered=true;r.latT=rand(-1,1)*(Math.random()<.5?1.3:5)}
    if(TA.lu>.965&&!r.landed&&G.state==='race'){r.landed=true;if(Math.abs(r.lat)<2.2){r.fx.boost=Math.max(r.fx.boost,2.5);if(!r.isBot||Math.random()<.5)feed(`🎯 <b>${esc(r.name)}</b> pousou no centro do alvo! +turbo`)}}}
  else{r.steered=false;if(r.m.chute.visible)r.m.chute.visible=false}
  const P=r.root.position;P.copy(TA.pos).addScaledVector(TA.side,r.lat);P.y=TA.pos.y+.22+jump;
  if(air&&!standing){const env=smooth(.03,.15,TA.lu)*(1-smooth(.8,1,TA.lu));P.y+=Math.sin(t*1.1+r.phase)*1.6*env-.22+env*.6}
  const climb=TA.mod==='escalada',swim=TA.mod==='nado';
  if(climb){_v.set(TA.tan.x,0,TA.tan.z).normalize();P.addScaledVector(_v,-.62);P.y=TA.pos.y-.3+jump;_look.copy(P).add(_v);if(e.stun>0)r.s=Math.max(r.s-dt*5,W.bounds[TA.seg].a*W.L+2)}
  else if(swim){const under=W.water&&TA.pos.y<W.water.level-1;const lv=W.water?W.water.level:TA.pos.y;r.wade=W.water&&W.water.last&&TA.last?smooth(lv-1.2,lv-.25,TA.ground):0;
    P.y=lerp(TA.pos.y-(under?1.5:2.3)+Math.sin(t*1.6+r.phase)*.22,TA.ground+.04,r.wade);_look.copy(P).add(TA.tan);_look.y=P.y;r.m.fins.forEach(f=>f.visible=r.wade<.5);
    if(r.wade>.05&&r.wade<.95&&r.v>3&&Math.random()<dt*14)PUFF.emit(P.x+rand(-.4,.4),lv+.1,P.z+rand(-.4,.4),rand(-1,1),rand(1.5,3.5),rand(-1,1),1,1.05,1.1,rand(.4,.8),.5,6,.6,1.2)}
  else r.wade=0;
  if(!swim&&!climb){
  if(TA.mod==='remo'){P.y=TA.pos.y-.02+Math.sin(t*2+r.phase)*.04;_look.copy(P).add(TA.tan);const ph=((r.stroke||0)/(2*Math.PI))%1;if(ph<r.lastPh&&G.state==='race'&&camera.position.distanceToSquared(P)<140*140){for(const o of[r.m.oarL,r.m.oarR]){const bl=o.children[1];if(bl){bl.getWorldPosition(_v);puddle(_v.x,TA.pos.y,_v.z)}}}r.lastPh=ph}
  else if(TA.mod==='windsurf'){const lv=W.water?W.water.level:TA.pos.y,tt=FOGU.uTime.value;P.y=lv+waveH(P.x,P.z,tt)+.06+jump;_look.copy(P).addScaledVector(TA.tan,1.2);_look.y=lv+waveH(_look.x,_look.z,tt)+.06+jump}
  else _look.copy(P).add(TA.tan)}
  r.root.lookAt(_look);
  const bk=climb?0:clamp(-r.latV*(air?.12:.06),-.7,.7);r.m.bank.rotation.z=lerp(r.m.bank.rotation.z,bk,1-Math.exp(-dt*4));
  r.pedal+=dt*(r.v*.45);r.wheel-=r.v*dt/.51;r.climb=(r.climb||0)+dt*r.v*1.15;r.stroke=(r.stroke||0)+dt*(1.6+r.v*.3);
  poseRider(r,t,standing);
  if(r.mod==='bike'){r.m.wF.rotation.x=r.wheel;r.m.wR.rotation.x=r.wheel}
  if(standing||r.mod==='paraquedas')r.m.wings.visible=false;else if(air)r.m.wings.visible=true;
  r.m.bflame.visible=e.boost>0;if(e.boost>0)r.m.bflame.scale.set(1,1,.8+Math.random()*.6);
  r.m.bflame.position.set(0,air?1:1.1,air?-1.2:-.5);
  r.m.shield.visible=e.shield>0;
  r.m.stars.visible=e.stun>0||e.stuck>0;r.m.stars.rotation.y+=dt*6;
  if(r.mod==='rocket')r.m.jets.children.forEach(c=>{if(c.geometry===RG.flame)c.scale.set(1,.8+Math.random()*.7,1)});
  if(G.state==='race'&&!r.finished)for(const h of hazards){if(h.owner===r||h.hit.has(r))continue;if(Math.abs(r.s-h.s)<2.4&&Math.abs(r.lat-h.lat)<3.3){h.hit.add(r);
    if(e.shield>0){e.shield=0;feed(`🛡️ <b>${esc(r.name)}</b> passou ileso pela armadilha de ${esc(h.owner.name)}`)}
    else if(h.kind==='ground'){e.slow=2.8;feed(`🛢️ <b>${esc(r.name)}</b> escorregou no óleo de ${esc(h.owner.name)}`)}
    else{e.stun=1.6;burst(P,20,[.7,.8,1],8,1.2,.6,0,0,GLOW);feed(({air:'⛈️ <b>{n}</b> entrou na tempestade de {o}',water:'🪼 <b>{n}</b> levou choque das águas-vivas de {o}',rock:'🪨 <b>{n}</b> foi atingido pelas pedras de {o}'}[h.kind]||'').replace('{n}',esc(r.name)).replace('{o}',esc(h.owner.name)))}}}
  if(G.state==='race'&&!r.finished&&r.s>=W.FIN){r.finished=true;r.place=++G.finCount;r.time=G.raceT;if(G.finCount===1){sfx('win');G.firstFin=G.raceT;banner('VENCEDOR!',`🏆 ${r.name}`,3);burst(P.clone().setY(P.y+3),90,[1,.85,.25],16,1.2,1.6,4,0,GLOW)}else{sfx('finish',.7);feed(`🏁 <b>${esc(r.name)}</b> cruzou em ${r.place}º`)}}
  const dc=camera.position.distanceToSquared(P);
  if(dc<170*170&&r.v>(climb?2:4)){r.emit+=dt*(air?20:(M.surface==='snow'?26:24))*clamp(r.v/25,.3,1.2);
    while(r.emit>1){r.emit--;
      if(M.surface==='snow'){PUFF.emit(P.x+rand(-.5,.5),P.y+.15,P.z+rand(-.5,.5),-TA.tan.x*r.v*.18+TA.side.x*rand(-3.5,3.5),rand(1.2,4),-TA.tan.z*r.v*.18+TA.side.z*rand(-3.5,3.5),1.05,1.1,1.2,rand(.7,1.4),rand(.5,.9),7,.75,2.6)}
      else if(M.surface==='dirt'){PUFF.emit(P.x+rand(-.4,.4),P.y+.25,P.z+rand(-.4,.4),-TA.tan.x*r.v*.1+rand(-1,1),rand(.4,1.6),-TA.tan.z*r.v*.1+rand(-1,1),.62,.48,.34,rand(1,1.8),rand(.7,1.3),.4,.5,2.8)}
      else if(M.surface==='water'){const lv=W.water?W.water.level:P.y;if(P.y+1.5<lv-.5){if(Math.random()<.6)BUB.emit(P.x+rand(-.6,.6),P.y+1.8,P.z+rand(-.6,.6),rand(-.3,.3),rand(1.5,3),rand(-.3,.3),1,1,1,rand(.15,.42),2.2,-2.6,.95,.05)}
        else if(Math.random()<.5)PUFF.emit(P.x+rand(-1,1),lv+.1,P.z+rand(-1,1),rand(-1,1),rand(1,2.5),rand(-1,1),1.05,1.1,1.15,rand(.22,.45),.5,6,.5,.8)}
      else if(M.surface==='rio'||M.surface==='mar'){const ph=((r.stroke||0)/(2*Math.PI))%1;if(M.surface==='mar'||ph<.08){for(let q=0;q<(M.surface==='mar'?2:3);q++)PUFF.emit(P.x-TA.tan.x*1.2+rand(-.5,.5)+(M.surface==='rio'?TA.side.x*rand(-3.3,3.3):0),P.y+.12,P.z-TA.tan.z*1.2+rand(-.5,.5)+(M.surface==='rio'?TA.side.z*rand(-3.3,3.3):0),-TA.tan.x*r.v*.08+TA.side.x*rand(-2,2),rand(.6,2.4),-TA.tan.z*r.v*.08+TA.side.z*rand(-2,2),1.05,1.1,1.15,rand(.25,.55),.55,6,.6,1)}}
      else if(M.surface==='pista'){if(Math.random()<.4)PUFF.emit(P.x+rand(-.3,.3),P.y+.15,P.z+rand(-.3,.3),rand(-.6,.6),rand(.3,1),rand(-.6,.6),.55,.5,.4,rand(.4,.8),.5,.5,.35,1.5)}
      else if(M.surface==='rock'){if(Math.random()<.25)PUFF.emit(P.x+rand(-.5,.5),P.y+rand(2.2,3.4),P.z+rand(-.5,.5),rand(-.4,.4),rand(-.6,.2),rand(-.4,.4),1.1,1.1,1.1,rand(.25,.55),.9,-.1,.55,.8)}
      else if(!standing){if(r.mod==='rocket'){GLOW.emit(P.x-TA.tan.x*1.5,P.y+1.15,P.z-TA.tan.z*1.5,-TA.tan.x*9,rand(-1,1),-TA.tan.z*9,2.5,1.1,.35,rand(.6,1),.35,0,1);PUFF.emit(P.x-TA.tan.x*2,P.y+1.15,P.z-TA.tan.z*2,0,.4,0,.75,.75,.8,1.3,1.4,0,.3,2.2)}
        else for(const sd of[-1.45,1.45])GLOW.emit(P.x+TA.side.x*sd,P.y+1,P.z+TA.side.z*sd,0,0,0,.6,.65,.75,.35,.8,0,.6,-.1)}
      if(TA.mod==='paraquedas'&&!r.chuteOpen&&Math.random()<.5)GLOW.emit(P.x+rand(-2,2),P.y+rand(0,3),P.z+rand(-2,2),-TA.tan.x*20,-TA.tan.y*20+8,-TA.tan.z*20,.5,.55,.6,.18,.35,0,.5);
      if(e.boost>0)GLOW.emit(P.x-TA.tan.x*1.2,P.y+1.5,P.z-TA.tan.z*1.2,-TA.tan.x*6+rand(-1,1),rand(0,2),-TA.tan.z*6+rand(-1,1),3,rand(1,1.8),.3,rand(.5,1),.4,0,1);
      if(e.slow>0)PUFF.emit(P.x+rand(-1,1),P.y+rand(.5,2),P.z+rand(-1,1),0,1.5,0,.5,.25,.9,.6,.6,0,.8)}}
  r.m.tag.visible=dc<140*140;if(r.m.tag.visible){const w=clamp(Math.sqrt(dc)*.075,1.6,9)/1.5;r.m.tag.scale.set(w,w*.2,1);r.m.tag.position.y=2.6+w*.12}
}
function updateCourse(dt,t){
  if(W.bars)for(const b of W.bars){if(b.fall>0){b.fall=Math.max(0,b.fall-dt*.45);b.bar.position.y=5.6-Math.sin(Math.min(1,(1-b.fall)*3)*1.57)*5.4*(b.fall>0?1:0);b.bar.rotation.x=(1-b.fall)*.8}else{b.bar.position.y=5.6;b.bar.rotation.x=0}}
  if(W.heli){W.heli.userData.rot.rotation.y+=dt*24;W.heli.position.y+=Math.sin(t*1.1)*dt*.4;W.heli.rotation.z=Math.sin(t*.7)*.04}if(W.plane)W.plane.userData.prop.rotation.z+=dt*2;
  if(W.buoys&&W.water)for(const b of W.buoys){b.position.y=W.water.level+waveH(b.position.x,b.position.z,FOGU.uTime.value)+.2;b.rotation.z=Math.sin(t*1.3+b.position.x)*.12}
}
function resolveTrick(r){if(r.fx.stun>0)return;const ok=Math.random()<.74;
  if(ok){sfx('trick',r.isBot?.5:1);r.fx.boost=Math.max(r.fx.boost,2.2*(hasRule('turbo2')?2:1));burst(r.root.position.clone().setY(r.root.position.y+2),26,[1,.85,.3],8,.8,.7,0,0,GLOW);feed(`🤸 <b>${esc(r.name)}</b> mandou ${pick(['um 360 perfeito','um backflip insano','um superman','um 720 limpo','um frontflip'])}! +turbo`)}
  else{sfx('crash',r.isBot?.5:1);r.fx.stun=2;feed(`💥 <b>${esc(r.name)}</b> errou a manobra e capotou`)}}

