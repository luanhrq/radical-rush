// ======================================================================
// TWITCH
// ======================================================================
let ws=null,wsTry=0,wsTimer=0;
function setStatus(ok,txt){const s=$('status');s.className='glass '+(ok?'ok':'bad');s.textContent=txt}
function connectTwitch(ch,manual){
  if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}clearTimeout(wsTimer);
  if(manual)wsTry=0;
  if(!ch){setStatus(false,'Sem canal');return}
  setStatus(false,`Conectando a #${ch}…`);G.twitch='connecting';
  let opened=false;
  try{ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443')}catch(e){twitchFail(ch);return}
  ws.onopen=()=>{opened=true;ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');ws.send('PASS SCHMOOPIIE');ws.send('NICK justinfan'+Math.floor(rand(10000,99999)));ws.send('JOIN #'+ch)};
  ws.onmessage=ev=>{for(const line of String(ev.data).split('\r\n')){if(!line)continue;
    if(line.startsWith('PING')){ws.send('PONG :tmi.twitch.tv');continue}
    let rest=line,tags={};if(rest[0]==='@'){const sp=rest.indexOf(' ');rest.slice(1,sp).split(';').forEach(kv=>{const i=kv.indexOf('=');tags[kv.slice(0,i)]=kv.slice(i+1)});rest=rest.slice(sp+1)}
    const m=rest.match(/^:([^!\s]+)!\S+ PRIVMSG #\S+ :(.*)$/);
    if(m){const login=m[1],name=(tags['display-name']||login).replace(/\\s/g,' ');handleChat(login,name||login,tags.color,m[2]);continue}
    if(/ (366|ROOMSTATE) /.test(rest)){G.twitch='ok';wsTry=0;setStatus(true,`Twitch: #${ch} • digite !radical`)}}};
  ws.onclose=()=>{if(!opened||G.twitch!=='ok')twitchFail(ch);else{setStatus(false,'Twitch caiu — reconectando…');wsTimer=setTimeout(()=>connectTwitch(ch),4000)}};
}
function twitchFail(ch){wsTry++;if(wsTry>=2){G.twitch='blocked';setStatus(false,'Twitch indisponível aqui — modo teste');$('pad').classList.add('show');
    if(!G.autoBots&&racers.size===0){G.autoBots=true;addBots(7);if(G.state==='lobby'&&isFinite(G.timer))G.timer=Math.min(G.timer,10)}
    wsTimer=setTimeout(()=>connectTwitch(ch),30000)}
  else wsTimer=setTimeout(()=>connectTwitch(ch),1500)}

