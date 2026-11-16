// ======================================================================
// COMMANDS
// ======================================================================
function findRacer(q){if(!q)return null;q=q.replace(/^@/,'').toLowerCase();return racers.get(q)||[...racers.values()].find(r=>r.name.toLowerCase()===q)||[...racers.values()].find(r=>r.name.toLowerCase().startsWith(q))||null}
function ranking(){return[...racers.values()].sort((a,b)=>a.finished&&b.finished?a.place-b.place:a.finished?-1:b.finished?1:b.s-a.s)}
function aheadOf(r,maxD){let best=null,bd=1e9;for(const o of racers.values()){if(o===r||o.finished)continue;const d=o.s-r.s;if(d>0&&d<maxD&&d<bd){bd=d;best=o}}return best}
function nearTo(r,maxD){let best=null,bd=1e9;for(const o of racers.values()){if(o===r||o.finished)continue;const d=Math.abs(o.s-r.s);if(d<maxD&&d<bd){bd=d;best=o}}return best}
function blocked(t,by,what){if(t.fx.shield>0){t.fx.shield=0;burst(t.root.position.clone().setY(t.root.position.y+1.5),30,[.3,.9,1.6],10,1,.6,0,0,GLOW);feed(`🛡️ O escudo de <b>${esc(t.name)}</b> bloqueou ${what} de ${esc(by.name)}`);return true}return false}
function stun(t,d){t.fx.stun=Math.max(t.fx.stun,d);t.fx.trick=0;t.trickPending=false;burst(t.root.position.clone().setY(t.root.position.y+1),24,[1,1,1],7,1.6,.8,3,2)}
const ACTIONS={
  turbo(r){sfx('turbo',r.isBot?.45:1);r.fx.boost=3*(hasRule('turbo2')?2:1);burst(r.root.position.clone().setY(r.root.position.y+1),20,[2,.9,.2],8,.8,.5,0,0,GLOW);feed(`⚡ <b>${esc(r.name)}</b> ligou o TURBO`);return true},
  escudo(r){sfx('shield',r.isBot?.5:1);r.fx.shield=8;feed(`🛡️ <b>${esc(r.name)}</b> ativou o escudo`);return true},
  manobra(r){if(r.fx.trick>0||r.fx.stun>0)return false;r.fx.trick=1.3;r.trickPending=true;r.trickKind=Math.random()<.4?1:0;return true},
  rasteira(r,arg){const t=arg?findRacer(arg):nearTo(r,60);
    if(!t||t===r){feed(`🦶 <b>${esc(r.name)}</b> deu uma rasteira no vento (ninguém por perto)`);return true}
    if(t.finished)return false;
    if(Math.abs(t.s-r.s)>70){feed(`🦶 <b>${esc(r.name)}</b> tentou derrubar ${esc(t.name)}, mas está longe demais`);return true}
    if(blocked(t,r,'a rasteira'))return true;sfx('hit',r.isBot?.6:1);stun(t,2.6);feed(`🦶 <b>${esc(r.name)}</b> deu uma RASTEIRA em <b>${esc(t.name)}</b>!`);spotlight(t);return true},
  oleo(r){trackAt(r.s-3,TA);const sf=TA.surface;const kind=isG(sf)?'ground':(sf==='rio'||sf==='mar')?'water':sf;let mesh;
    if(kind==='ground'){mesh=new THREE.Mesh(new THREE.CircleGeometry(2.6,28),new THREE.MeshPhysicalMaterial({color:0x050507,roughness:.04,metalness:.2,clearcoat:1,iridescence:1,iridescenceIOR:1.5}));mesh.rotation.x=-Math.PI/2;mesh.position.copy(TA.pos).addScaledVector(TA.side,r.lat);mesh.position.y=TA.ground+.3}
    else{mesh=new THREE.Group();let m;
      if(kind==='water'){m=new THREE.MeshStandardMaterial({color:0xff7ad9,emissive:0xff3ac0,emissiveIntensity:1.8,transparent:true,opacity:.75,roughness:.3});m.side=THREE.DoubleSide;m.depthWrite=false;const core=new THREE.MeshStandardMaterial({color:0xffd0f4,emissive:0xff8ae0,emissiveIntensity:2.2,transparent:true,opacity:.85});
        for(let k=0;k<3;k++){const j=new THREE.Group();const bell=new THREE.Mesh(new THREE.SphereGeometry(.7,22,12,0,Math.PI*2,0,Math.PI*.56).scale(1,.78,1),m);j.add(bell);j.add(new THREE.Mesh(new THREE.TorusGeometry(.67,.035,6,26).rotateX(Math.PI/2).translate(0,-.1,0),m));j.add(new THREE.Mesh(new THREE.SphereGeometry(.26,12,8).scale(1,.6,1).translate(0,.2,0),core));
          for(let q=0;q<4;q++){const a=q/4*6.28+.4;const pts=[];for(let s2=0;s2<=6;s2++)pts.push(new V3(Math.cos(a)*.16+Math.sin(s2*1.3+q)*.05,-s2*.2,Math.sin(a)*.16+Math.cos(s2*1.1+q)*.05));j.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),10,.045,5),core))}
          for(let q=0;q<10;q++){const a=q/10*6.28;const pts=[];for(let s2=0;s2<=8;s2++)pts.push(new V3(Math.cos(a)*(.6-s2*.01)+Math.sin(s2*.9+q*2.)*.07,-.1-s2*.3,Math.sin(a)*(.6-s2*.01)+Math.cos(s2*.8+q)*.07));j.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),14,.014,4),m))}
          j.position.set(rand(-1.2,1.2),rand(-.5,.8),rand(-1,1));j.userData.ph=rand(0,6.3);mesh.add(j)}}
      else if(kind==='rock'){m=new THREE.MeshStandardMaterial({color:0x6b625a,roughness:.9});const rg=rockGeo(9,1);for(let k=0;k<4;k++){const c=new THREE.Mesh(rg,m);c.scale.setScalar(rand(.5,.9));c.position.set(rand(-1.5,1.5),rand(0,3),0);mesh.add(c)}}
      else{m=new THREE.MeshStandardMaterial({color:0x2c303a,roughness:1,emissive:0x3060ff,emissiveIntensity:0});for(let k=0;k<6;k++){const c=new THREE.Mesh(new THREE.IcosahedronGeometry(rand(1.3,2.3),2),m);c.position.set(rand(-2,2),rand(-.6,.8),rand(-1.5,1.5));mesh.add(c)}mesh.userData.flash=m}
      mesh.position.copy(r.root.position);mesh.position.y+=kind==='water'?1.5:1.2}
    sfx('oil',r.isBot?.5:1);hazGroup.add(mesh);hazards.push({s:r.s-3,lat:r.lat,owner:r,mesh,t:30,hit:new Set(),kind});
    feed({ground:`🛢️ <b>${esc(r.name)}</b> derramou ÓLEO na pista`,air:`⛈️ <b>${esc(r.name)}</b> criou uma nuvem de tempestade`,water:`🪼 <b>${esc(r.name)}</b> soltou águas-vivas no tubo`,rock:`🪨 <b>${esc(r.name)}</b> derrubou pedras soltas no paredão`}[kind]);return true},
  atalho(r){if(Math.random()<.4){const old=r.root.position.clone().setY(r.root.position.y+1);sfx('portal',r.isBot?.6:1);r.s=Math.min(r.s+W.L*.06,W.FIN-15);burst(old,50,[.3,1.4,2],12,1,.8,0,0,GLOW);feed(`🌀 <b>${esc(r.name)}</b> achou um ATALHO secreto!`);spotlight(r)}
    else{r.fx.stuck=3.2;feed(`🌲 <b>${esc(r.name)}</b> se perdeu no atalho…`)}return true},
  missil(r,arg){const rk=ranking().filter(o=>!o.finished);let t=arg?findRacer(arg):rk[0];if(t===r)t=rk[1];if(!t||t===r||t.finished)return false;
    const m=new THREE.Group();m.add(new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,1,12).rotateX(Math.PI/2),new THREE.MeshPhysicalMaterial({color:0xdddddd,metalness:.8,roughness:.25,clearcoat:1})));
    const tip=new THREE.Mesh(new THREE.ConeGeometry(.14,.35,12).rotateX(Math.PI/2).translate(0,0,.67),new THREE.MeshStandardMaterial({color:0xff2a2a,emissive:0xff2000,emissiveIntensity:2}));m.add(tip);
    sfx('launch',r.isBot?.6:1);m.position.copy(r.root.position).y+=2.2;hazGroup.add(m);missiles.push({m,t,from:r,life:8});feed(`🚀 <b>${esc(r.name)}</b> disparou um MÍSSIL em <b>${esc(t.name)}</b>`);return true},
  troca(r,arg){let t=arg?findRacer(arg):aheadOf(r,140);if(!t||t===r||t.finished){feed(`🔄 <b>${esc(r.name)}</b> não achou ninguém para trocar`);return true}
    if(t.s<=r.s){feed(`🔄 <b>${esc(r.name)}</b> só pode trocar com quem está na frente`);return true}
    if(t.s-r.s>140){feed(`🔄 ${esc(t.name)} está longe demais para <b>${esc(r.name)}</b>`);return true}
    if(blocked(t,r,'a troca'))return true;
    if(Math.random()<.5){sfx('swap');const s=r.s,l=r.lat;r.s=t.s;r.lat=t.lat;t.s=s;t.lat=l;burst(r.root.position.clone(),30,[1.2,.4,1.8],10,1,.7,0,0,GLOW);burst(t.root.position.clone(),30,[1.2,.4,1.8],10,1,.7,0,0,GLOW);feed(`🔄 <b>${esc(r.name)}</b> TROCOU de lugar com <b>${esc(t.name)}</b>!`);spotlight(r)}
    else{stun(r,2.2);feed(`🔄 A troca de <b>${esc(r.name)}</b> deu errado e acabou no chão`)}return true},
  tubarao(r,arg){if(!LIFE.sharks.length){feed(`🦈 <b>${esc(r.name)}</b> chamou um tubarão, mas não há mar nesta rodada`);return true}
    const sw=[...racers.values()].filter(o=>o!==r&&!o.finished&&isUnderSwim(o));let t=arg?findRacer(arg):null;if(t&&!isUnderSwim(t))t=null;if(!t)t=sw.sort((a,b)=>b.s-a.s)[0];
    if(!t){feed(`🦈 <b>${esc(r.name)}</b> soltou um tubarão, mas ninguém está no túnel agora`);return true}
    const ok=sendShark(t,r);if(ok)feed(`🦈 <b>${esc(r.name)}</b> soltou um TUBARÃO atrás de <b>${esc(t.name)}</b>!`);return true},
};
function handleChat(login,name,color,text){
  text=(text||'').trim();if(text[0]!=='!')return;
  const parts=text.split(/\s+/),cmd=ALIAS[parts[0].toLowerCase()],arg=parts[1];if(!cmd)return;
  login=login.toLowerCase();
  if(cmd==='join')return join(login,name,color,false);
  if(cmd==='sair'){const r=racers.get(login);if(r){removeRacer(r);feed(`👋 <b>${esc(name)}</b> saiu do jogo`)}pending.delete(login);return}
  const r=racers.get(login);if(!r||G.state!=='race'||r.finished)return;
  const now=G.clock;if((r.cd[cmd]||0)>now)return;
  if(ACTIONS[cmd](r,arg)){r.cd[cmd]=now+COOL[cmd];if(!r.isBot&&cmd!=='turbo')spotlight(r,true)}
}
function join(login,name,color,isBot){
  if(racers.has(login)||pending.has(login))return;
  if(racers.size+pending.size>=CFG.max){feed(`🚫 Corrida lotada (${CFG.max})`);return}
  color=fixColor(color);
  if(G.state==='lobby'){createRacer(login,name,color,isBot);resetRacers();feed(`🎽 <b>${esc(name)}</b> entrou na corrida!`);sfx('join',isBot?.5:1)}
  else{pending.set(login,{login,name,color,isBot});feed(`⏳ <b>${esc(name)}</b> entra na próxima rodada`)}
}
function spotlight(r,user){if(G.state!=='race')return;if(G.spot&&G.spot.t>0&&user)return;G.spot={r,t:3.5}}

