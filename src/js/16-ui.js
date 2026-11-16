// ======================================================================
// UI
// ======================================================================
const $=id=>document.getElementById(id);
function show(id,on){const ov=id==='lobby'||id==='results'||id==='champ';$(id).classList.toggle(ov?'show':'hidden',ov?on:!on)}
let bannerTO=0;
function banner(a,b,d=2){const el=$('banner');el.querySelector('.b1').textContent=a;el.querySelector('.b2').textContent=b||'';el.querySelector('.b2').style.display=b?'inline-block':'none';el.classList.add('show');clearTimeout(bannerTO);bannerTO=setTimeout(()=>el.classList.remove('show'),d*1000)}
function feed(html){const el=document.createElement('div');el.className='fi';el.innerHTML=html;const f=$('feed');f.prepend(el);while(f.children.length>6)f.lastChild.remove();setTimeout(()=>el.remove(),9100)}
let cdTO=0;function countdown(txt){sfx(txt==='VAI!'?'go':'beep');const el=$('countdown');clearTimeout(cdTO);cdTO=setTimeout(()=>el.textContent='',950);el.textContent=txt;el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop')}
function renderLobby(){
  const n=racers.size+pending.size;
  $('lobbyTimer').textContent=isFinite(G.timer)&&G.state==='lobby'?String(Math.max(0,Math.ceil(G.timer))).padStart(2,'0'):'--';
  $('lobbyCount').textContent=n===0?'Aguardando o primeiro piloto…':isFinite(G.timer)?`${n} piloto${n>1?'s':''} confirmado${n>1?'s':''}`:`${n} pilotos`;
  $('lobbyN').textContent=n;
  $('lobbyPlayers').innerHTML=n?[...racers.values()].map(r=>`<div class="pt">${avatarHTML(r,24)}<span>${esc(r.name)}${r.isBot?' · bot':''}</span></div>`).join(''):'<div class="muted">Ninguém ainda. Seja o primeiro: !radical</div>';
}
function renderSession(){const l=[...session.values()].sort((a,b)=>b.pts-a.pts).slice(0,6);if(l.length)$('sessionBoard').innerHTML=l.map((s,i)=>`<div class="row"><span>${i+1}. ${avatarHTML(s,20)} ${esc(s.name)}</span><b>${s.pts} pts${s.wins?` • ${s.wins}🏆`:''}</b></div>`).join('')}
function renderStandings(){
  const rk=G.rank,lead=rk[0];if(!lead)return;
  $('standList').innerHTML=rk.slice(0,12).map((r,i)=>{const fx=r.out?'❌':(r.fx.shield>0?'🛡️':'')+(r.fx.boost>0?'⚡':'')+(r.fx.stun>0||r.fx.stuck>0?'💫':'')+(r.fx.slow>0?'🛢️':'');
    const gap=r.finished?fmt(r.time):i===0?'LÍDER':`-${Math.round(lead.finished?W.FIN-r.s:lead.s-r.s)}m`;
    return`<li data-l="${esc(r.login)}" class="${SPEC.on&&SPEC.r===r?'sel':''}"><span class="pos">${i+1}</span>${avatarHTML(r,24)}<span class="nm">${esc(r.name)}</span><span class="fx">${fx}</span><span>${MODS[r.mod]?MODS[r.mod].icon:''}</span><span class="gap">${gap}</span></li>`}).join('')+(rk.length>12?`<li style="color:var(--ink2);font-size:12px;justify-content:center">+${rk.length-12} pilotos</li>`:'');
  $('progDots').innerHTML=rk.slice(0,40).map((r,i)=>`<div class="dot${i===0?' lead':''}" style="left:${clamp(r.s/W.FIN,0,1)*100}%;background-color:${r.color}${r.avatarUrl?`;background-image:url('${esc(r.avatarUrl)}')`:''};z-index:${50-i}"></div>`).join('');
  const ls=trackAt(Math.min(lead.s,W.FIN),CTA).seg;document.querySelectorAll('#segChips .chip').forEach(c=>c.classList.toggle('on',+c.dataset.i===ls));
  $('timer').textContent=G.firstFin?`⏱ ${Math.max(0,Math.ceil(25-(G.raceT-G.firstFin)))}s`:fmt(G.raceT);
}
$('tickTrack').innerHTML=(()=>{const s=CMDS.map(([c,d])=>`<span><code>${c}</code>${d}</span>`).join('');return s+s})();
$('cmdHelp').innerHTML=CMDS.slice(1,10).map(([c,d])=>`<div><code>${c.split(' ')[0]}</code>${d}</div>`).join('');

// ---- test pad
const PAD_CMDS=[['turbo','⚡ Turbo'],['rasteira','🦶 Rasteira'],['oleo','🛢️ Óleo'],['escudo','🛡️ Escudo'],['manobra','🤸 Manobra'],['atalho','🌀 Atalho'],['missil','🚀 Míssil'],['troca','🔄 Troca'],['tubarao','🦈 Tubarão']];
$('padCmds').innerHTML=PAD_CMDS.map(([c,l],i)=>`<button type="button" data-cmd="${c}">${l}<small>tecla ${i+1}</small></button>`).join('');
const ME='voce_local';
function myName(){return($('padName').value||'Você').trim().slice(0,20)||'Você'}
$('btnJoin').onclick=()=>{const r=racers.get(ME);if(r||pending.has(ME)){handleChat(ME,myName(),null,'!sair');$('btnJoin').textContent='ENTRAR'}else{join(ME,myName(),'#29e3ff',false);$('btnJoin').textContent='SAIR'}};
$('padCmds').onclick=e=>{const b=e.target.closest('button');if(!b)return;handleChat(ME,myName(),null,'!'+b.dataset.cmd)};
$('btnBots').onclick=()=>addBots(4);
$('selRounds').value=String([3,5,7,10,0].includes(CFG.rounds)?CFG.rounds:5);$('selRounds').onchange=e=>{CFG.rounds=+e.target.value;LS.set('rounds',String(CFG.rounds));feed(CFG.rounds?`🏆 Campeonato de ${CFG.rounds} rodadas`:'♾️ Rodadas sem fim');if(G.state==='lobby')$('lobbyRound').textContent=CFG.rounds>0?`RODADA ${G.champ+1} DE ${CFG.rounds}`:`RODADA ${G.champ+1}`};
$('selQ').value=CFG.quality;$('selQ').onchange=e=>{CFG.quality=e.target.value;LS.set('quality',CFG.quality);QL=QP[CFG.quality];DR=1;setShadowRes();setupPost();makeGrass();feed(`🎛️ Qualidade gráfica: <b>${e.target.selectedOptions[0].textContent.split(': ')[1]}</b> (terreno e árvores mudam na próxima rodada)`)};
$('padChan').value=CFG.channel;$('btnChan').onclick=()=>{const ch=$('padChan').value.replace(/^#/,'').trim().toLowerCase();if(!ch)return;CFG.channel=ch;LS.set('channel',ch);$('lobbyChan').textContent=ch;connectTwitch(ch,true)};
$('btnPad').onclick=()=>$('pad').classList.toggle('show');
function updatePad(){const r=racers.get(ME);$('btnJoin').textContent=r||pending.has(ME)?'SAIR':'ENTRAR';
  document.querySelectorAll('#padCmds button').forEach(b=>{const c=b.dataset.cmd;const can=r&&G.state==='race'&&!r.finished;const left=r?Math.max(0,(r.cd[c]||0)-G.clock):0;b.disabled=!can||left>0;b.style.setProperty('--cd',r&&left>0?(left/COOL[c]).toFixed(3):0)});
  const fot=`Fotos de perfil: ${AVSTAT.ok} carregadas${AVSTAT.html?` · ${AVSTAT.html} só no placar`:''}${AVSTAT.fail?` · ${AVSTAT.fail} sem foto`:''}.`;
  const pf=perf.fps?` Imagem: ${Math.round(DR*100)}% da resolução, ${Math.round(perf.fps)} fps.`:'';$('padNote').textContent=G.twitch==='ok'?`Conectado ao chat de #${CFG.channel}. ${fot}${pf}`:G.twitch==='blocked'?'Este visualizador não permite conexão com a Twitch. Teste aqui com os botões; no OBS o chat conecta sozinho.':'Conectando ao chat da Twitch…'}
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;if(e.key==='c'||e.key==='C')$('pad').classList.toggle('show');const n=+e.key;if(n>=1&&n<=9)handleChat(ME,myName(),null,'!'+PAD_CMDS[n-1][0])});

// ---- câmera do espectador: scroll troca de piloto, arrastar gira, Shift+scroll aproxima, duplo clique volta ao automático
const SPEC={on:false,r:null,yaw:0,pitch:.28,dist:0,drag:null,shown:false};
function specSet(r){if(!r)return;SPEC.on=true;SPEC.r=r;G.spot=null;specHint()}
function specPick(dir){const l=G.rank.filter(r=>racers.has(r.login));if(!l.length)return;let i=l.indexOf(SPEC.on&&SPEC.r?SPEC.r:CAM.focus);if(i<0)i=0;else if(SPEC.on)i=(i+dir+l.length)%l.length;specSet(l[i])}
function specAuto(){SPEC.on=false;SPEC.r=null;SPEC.yaw=0;SPEC.pitch=.28;SPEC.dist=0}
let hintTO=0;function specHint(){const h=$('specHint');h.classList.add('show');clearTimeout(hintTO);hintTO=setTimeout(()=>h.classList.remove('show'),5000)}
canvas.addEventListener('wheel',e=>{if(G.state!=='race')return;e.preventDefault();
  if(e.shiftKey||e.ctrlKey){if(!SPEC.on)specSet(CAM.focus);SPEC.dist=clamp((SPEC.dist||11)*(e.deltaY>0?1.12:.89),4,45);return}
  specPick(e.deltaY>0?1:-1)},{passive:false});
canvas.addEventListener('pointerdown',e=>{SPEC.drag={x:e.clientX,y:e.clientY};try{canvas.setPointerCapture(e.pointerId)}catch(_){}});
canvas.addEventListener('pointermove',e=>{if(!SPEC.shown&&G.state==='race'){SPEC.shown=true;specHint()}if(!SPEC.drag)return;const dx=e.clientX-SPEC.drag.x,dy=e.clientY-SPEC.drag.y;SPEC.drag={x:e.clientX,y:e.clientY};
  if(G.state==='race'){if(!SPEC.on)specSet(CAM.focus);SPEC.yaw-=dx*.006;SPEC.pitch=clamp(SPEC.pitch+dy*.004,-.35,1.25)}else CAM.orbit-=dx*.006});
canvas.addEventListener('pointerup',()=>SPEC.drag=null);canvas.addEventListener('pointercancel',()=>SPEC.drag=null);
canvas.addEventListener('dblclick',()=>{specAuto();specHint()});
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT'||G.state!=='race')return;if(e.key==='ArrowRight'||e.key==='ArrowDown')specPick(1);else if(e.key==='ArrowLeft'||e.key==='ArrowUp')specPick(-1);else if(e.key==='a'||e.key==='A')specAuto()});
$('standList').addEventListener('click',e=>{const li=e.target.closest('li[data-l]');if(li)specSet(racers.get(li.dataset.l))});

