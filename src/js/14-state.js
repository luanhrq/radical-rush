// ======================================================================
// GAME STATE
// ======================================================================
const G={state:'boot',round:+(Q.get('round')||0),champ:0,seed:+(Q.get('seed'))||(Date.now()&0xffff)||1,prevMods:[],timer:0,raceT:0,finCount:0,firstFin:0,leaderS:0,windT:0,slowT:0,fogT:0,evT:0,spot:null,rank:[],clock:0,maxT:150,lastCount:-1,uiT:0,lodT:0,twitch:'connecting'};
function setLoading(on,msg){$('loading').classList.toggle('hide',!on);if(msg)$('loadMsg').textContent=msg}
function enterLobby(first){
  const def=G.def=genRound(G.round);G.prevMods=def.segs.map(x=>x[0]);
  buildWorld(def,(Date.now()&0xffff)+G.round*7919);
  GRASSU.uHF.value=W.hfTex;GRASSU.uHFInfo.value.copy(W.hfInfo);
  hazards.forEach(h=>{hazGroup.remove(h.mesh);disposeObj(h.mesh)});missiles.forEach(m=>{hazGroup.remove(m.m);disposeObj(m.m)});hazards=[];missiles=[];
  for(const p of pending.values())createRacer(p.login,p.name,p.color,p.isBot);pending.clear();
  resetRacers();for(const r of racers.values())updateRacer(r,0,0);
  G.state='lobby';G.timer=racers.size?(first?lobbyTime():CFG.lobbyNext):Infinity;G.first=first;
  G.maxT=Math.round(W.L/16*1.8);setMusicRound(G.round);G.elimT=30;
  if(def.rules.includes('chuva')){FOGU.uCloud.value.set(.85,.95);sun.intensity*=.5;FOGU.uFogP.value.x*=1.3;SKY=Object.assign({},SKY,{fog:[SKY.fog[0]*1.3,SKY.fog[1],SKY.fog[2]*1.25]})}
  $('lobbyRound').textContent=CFG.rounds>0?`RODADA ${G.champ+1} DE ${CFG.rounds}`:`RODADA ${G.champ+1}`;
  $('lobbyRules').innerHTML=def.rules.map(k=>`<span class="rule">${RULES[k].icon} <b>${RULES[k].label}</b> ${RULES[k].desc}</span>`).join('');$('lobbyName').textContent=def.name;
  $('lobbySegs').innerHTML=def.segs.map(([m],i)=>`<div class="rt"><div class="ri">${MODS[m].icon}</div><div class="rl">${MODS[m].label}<small>TRECHO ${i+1}</small></div></div>`).join('<div class="rline"></div>');
  $('roundNum').textContent=(CFG.rounds>0?`RODADA ${G.champ+1}/${CFG.rounds}`:`RODADA ${G.champ+1}`)+` · v${VERSION}`;$('roundName').textContent=def.name;
  $('segChips').innerHTML=def.segs.map(([m],i)=>`<span class="chip" data-i="${i}">${MODS[m].icon} ${MODS[m].label}</span>`).join('')+def.rules.map(k=>`<span class="chip" title="${RULES[k].desc}">${RULES[k].icon}</span>`).join('');
  const segCols={snow:'#dbe9ff',dirt:'#b07a4c',air:'#ff7a3d',rock:'#9aa1ad',water:'#2fc6e8',pista:'#d2453a',asfalto:'#8a94a3',rio:'#3fa9d6',mar:'#1f7fd8'};
  $('progSegs').innerHTML=def.segs.map(([m,f])=>`<div style="width:${f*100}%;background:${segCols[MODS[m].surface]}"></div>`).join('');
  show('lobby',true);show('results',false);show('standings',false);show('progress',false);show('timer',false);show('tl',true);
  renderSession();renderLobby();
}
function lobbyTime(){return G.twitch==='ok'?CFG.lobby:12}
function startIntro(){G.state='intro';G.timer=5.5;show('lobby',false);show('standings',true);show('progress',true);
  trackAt(START_S+160,CTA);CAM.pos.set(CTA.pos.x+CTA.side.x*70,CTA.pos.y+80,CTA.pos.z+CTA.side.z*70);
  banner(G.def.name.toUpperCase(),(CFG.rounds>0?`Rodada ${G.champ+1} de ${CFG.rounds}`:`Rodada ${G.champ+1}`)+` • ${racers.size} pilotos`,2.5);G.lastCount=-1}
function startRace(){G.outN=0;G.state='race';G.raceT=0;G.finCount=0;G.firstFin=0;G.evT=rand(14,22);G.windT=G.slowT=G.fogT=0;show('timer',true);for(const r of racers.values())r.v=6;CAM.shotT=0}
function endRace(){
  G.state='results';G.timer=10;
  const rk=ranking();let html='';
  rk.forEach((r,i)=>{const pts=(r.finished&&!r.out?(PTS[i]||1):0);let s=session.get(r.login);if(!s){s={name:r.name,color:r.color,pts:0,wins:0};session.set(r.login,s)}s.color=r.color;s.avatarUrl=r.avatarUrl;s.pts+=pts;if(r.finished&&i===0)s.wins++;
    r._pts=pts;r._tot=s.pts;
    if(i>=3&&i<11)html+=`<div class="row"><span><b class="disp">${i+1}</b> ${avatarHTML(r,22)} ${esc(r.name)}</span><span>${r.out?'ELIMINADO':r.finished?fmt(r.time):'DNF'}· <b style="color:var(--volt)">+${pts}</b></span></div>`});
  $('resTitle').textContent=rk[0]&&rk[0].finished?rk[0].name:'Ninguém completou';
  const pod=[rk[1],rk[0],rk[2]];$('podium').innerHTML=pod.map((r,k)=>r?`<div class="pod ${k===1?'p1':''}"><div class="pp">${k===1?1:k===0?2:3}</div>${avatarHTML(r,k===1?64:48)}<div class="pn">${esc(r.name)}</div><div class="ps">${r.out?'ELIMINADO':r.finished?fmt(r.time):'DNF'} · +${r._pts} pts</div></div>`:'<div></div>').join('');
  $('resList').innerHTML=html;
  show('results',true);show('timer',false);show('standings',false);
  G.champEnd=CFG.rounds>0&&G.champ+1>=CFG.rounds;
}
function showChampion(){
  G.state='champion';G.timer=22;show('results',false);
  const l=[...session.entries()].map(([k,v])=>({login:k,...v})).sort((a,b)=>b.pts-a.pts||b.wins-a.wins);const c=l[0];
  $('champTitle').textContent=c?c.name:'Sem campeão';$('champSub').textContent=c?`${c.pts} pontos${c.wins?` · ${c.wins} vitória${c.wins>1?'s':''}`:''} em ${CFG.rounds} rodada${CFG.rounds>1?'s':''}`:'';
  const pod=[l[1],l[0],l[2]];$('champPod').innerHTML=pod.map((r,k)=>r?`<div class="pod ${k===1?'p1':''}"><div class="pp">${k===1?1:k===0?2:3}</div>${avatarHTML(r,k===1?72:52)}<div class="pn">${esc(r.name)}</div><div class="ps">${r.pts} pts</div></div>`:'<div></div>').join('');
  $('champList').innerHTML=l.slice(3,11).map((r,i)=>`<div class="row"><span><b class="disp">${i+4}</b> ${avatarHTML(r,22)} ${esc(r.name)}</span><b>${r.pts} pts</b></div>`).join('');
  show('champ',true);sfx('win');setTimeout(()=>sfx('win'),1600);
  if(c)banner('CAMPEÃO!',`🏆 ${c.name}`,4);
}
function fmt(t){const m=Math.floor(t/60),s=Math.floor(t%60);return`${m}:${String(s).padStart(2,'0')}`}

