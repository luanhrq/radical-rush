// ======================================================================
// BOTS
// ======================================================================
function addBots(n){const used=new Set([...racers.values(),...pending.values()].map(r=>r.name));let made=0,guard=0;while(made<n&&guard++<200){let nm=pick(BOT_NAMES);if(used.has(nm))nm+=Math.floor(rand(10,99));if(used.has(nm))continue;used.add(nm);join('bot_'+nm.toLowerCase(),nm,null,true);made++}}
function botThink(r,dt){if(!r.isBot||G.state!=='race'||r.finished)return;r.botT-=dt;if(r.botT>0)return;r.botT=rand(2.5,7);
  const w=[['!turbo',25],['!manobra',24],['!rasteira',12],['!oleo',10],['!escudo',10],['!missil',7],['!atalho',6],['!troca',4],['!tubarao',r.mod==='nado'?8:0]];let tot=w.reduce((a,b)=>a+b[1],0),x=Math.random()*tot;let c=w[0][0];for(const[k,v]of w){x-=v;if(x<=0){c=k;break}}
  handleChat(r.login,r.name,r.color,c)}

