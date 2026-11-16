// ======================================================================
// EVENTS
// ======================================================================
const EVENTS=[
  {n:()=>'VENTO A FAVOR',s:'todos +25% de velocidade',f(){G.windT=6}},
  {n:sf=>sf==='snow'?'AVALANCHE!':sf==='air'?'TURBULÊNCIA!':'DESLIZAMENTO!',s:'pilotos atingidos',f(sf){const l=[...racers.values()].filter(r=>!r.finished);for(let k=0;k<Math.min(3,l.length);k++){const r=l.splice(Math.floor(Math.random()*l.length),1)[0];if(r.fx.shield>0){r.fx.shield=0;continue}stun(r,2.2);burst(r.root.position.clone().setY(r.root.position.y+2),50,sf==='dirt'?[.55,.42,.3]:[1.1,1.1,1.15],12,3,1.4,3,3)}CAM.shake=1}},
  {n:()=>'NEBLINA DENSA',s:'visibilidade reduzida',f(){G.fogT=9}},
  {n:()=>'CHUVA DE TURBO',s:'turbo grátis para os sortudos',f(){for(const r of racers.values())if(!r.finished&&Math.random()<.45)r.fx.boost=Math.max(r.fx.boost,2.6)}},
  {n:()=>'TERRENO INSTÁVEL',s:'todos mais lentos',f(){G.slowT=5;CAM.shake=1.2}},
  {n:()=>'REVIRAVOLTA',s:'os últimos ganham super turbo',f(){ranking().filter(r=>!r.finished).slice(-3).forEach(r=>r.fx.boost=4.5)}},
];
function fireEvent(){const ld=G.rank.find(r=>!r.finished);const sf=ld?MODS[ld.mod||'bike'].surface:'dirt';const ev=pick(EVENTS);sfx('event');banner(ev.n(sf),ev.s,2.4);ev.f(sf);feed(`🌪️ EVENTO: <b>${ev.n(sf)}</b>`)}

