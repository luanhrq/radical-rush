// ======================================================================
// TWITCH
// ======================================================================
let ws=null,wsTry=0,wsTimer=0;
const TWITCH_CLIENT_ID='gak9zpsfc5uef6csu3d2uo7mooaalq';
const TWITCH_OAUTH_STATE_KEY='rr.twitch.oauth.state';
const TWITCH_TOKEN_KEY='rr.twitch.oauth.token';
const TWITCH_LOGIN_KEY='rr.twitch.oauth.login';
let twitchAuthToken='',twitchLogin='';
try{
  twitchAuthToken=sessionStorage.getItem(TWITCH_TOKEN_KEY)||'';
  twitchLogin=sessionStorage.getItem(TWITCH_LOGIN_KEY)||'';
  if(twitchLogin){CFG.channel=twitchLogin;LS.set('channel',twitchLogin)}
}catch(_){}
function setStatus(ok,txt){const s=$('status');s.className='glass '+(ok?'ok':'bad');s.textContent=txt}
function twitchIdentity(login){
  twitchLogin=login;
  try{sessionStorage.setItem(TWITCH_LOGIN_KEY,login)}catch(_){}
  CFG.channel=login;LS.set('channel',login);
  $('lobbyChan').textContent=login;
  const padChannel=$('padChan');if(padChannel)padChannel.value=login;
  window.dispatchEvent(new CustomEvent('rr:twitch-auth',{detail:{login}}));
}
function twitchRedirectUri(){return location.origin+location.pathname}
function beginTwitchLogin(){
  if(!TWITCH_CLIENT_ID){setStatus(false,'Client ID da Twitch não configurado');return}
  let state;
  try{
    const bytes=new Uint8Array(24);crypto.getRandomValues(bytes);
    state=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
    sessionStorage.setItem(TWITCH_OAUTH_STATE_KEY,state);
  }catch(_){setStatus(false,'Não foi possível iniciar o login seguro da Twitch');return}
  const auth=new URL('https://id.twitch.tv/oauth2/authorize');
  auth.searchParams.set('client_id',TWITCH_CLIENT_ID);
  auth.searchParams.set('redirect_uri',twitchRedirectUri());
  auth.searchParams.set('response_type','token');
  auth.searchParams.set('scope','chat:read');
  auth.searchParams.set('state',state);
  auth.searchParams.set('force_verify','true');
  location.assign(auth.toString());
}
async function validateTwitchToken(token){
  const response=await fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:'OAuth '+token},cache:'no-store'});
  if(!response.ok)throw new Error('A Twitch não validou a sessão. Conecte sua conta novamente.');
  const data=await response.json();
  if(data.client_id!==TWITCH_CLIENT_ID)throw new Error('A sessão pertence a outro aplicativo Twitch.');
  if(!data.login)throw new Error('Não foi possível identificar seu canal Twitch.');
  return data;
}
function clearTwitchOAuthHash(){history.replaceState(null,'',location.pathname+location.search)}
async function handleTwitchOAuthReturn(){
  const hash=new URLSearchParams(location.hash.slice(1));
  const token=hash.get('access_token');
  const error=hash.get('error');
  if(!token&&!error)return false;
  const returnedState=hash.get('state');
  let expectedState='';try{expectedState=sessionStorage.getItem(TWITCH_OAUTH_STATE_KEY)||''}catch(_){}
  clearTwitchOAuthHash();
  try{sessionStorage.removeItem(TWITCH_OAUTH_STATE_KEY)}catch(_){}
  if(error){setStatus(false,error==='access_denied'?'Login Twitch cancelado':'Não foi possível autorizar a Twitch');return true}
  if(!expectedState||!returnedState||returnedState!==expectedState){setStatus(false,'Não foi possível confirmar o login da Twitch. Tente novamente.');return true}
  setStatus(false,'Validando sua conta Twitch…');
  try{
    const data=await validateTwitchToken(token);
    twitchAuthToken=token;
    try{sessionStorage.setItem(TWITCH_TOKEN_KEY,token)}catch(_){}
    twitchIdentity(data.login.toLowerCase());
    connectTwitch(twitchLogin,true);
  }catch(e){setStatus(false,e.message||'Falha ao validar a conta Twitch')}
  return true;
}
async function restoreTwitchLogin(){
  if(await handleTwitchOAuthReturn())return;
  if(!twitchAuthToken)return;
  try{
    const data=await validateTwitchToken(twitchAuthToken);
    twitchIdentity(data.login.toLowerCase());
    if(G.twitch!=='ok'||CFG.channel!==data.login.toLowerCase())connectTwitch(twitchLogin,true);
  }catch(e){
    twitchAuthToken='';twitchLogin='';
    try{sessionStorage.removeItem(TWITCH_TOKEN_KEY);sessionStorage.removeItem(TWITCH_LOGIN_KEY)}catch(_){}
    setStatus(false,e.message||'Sessão Twitch expirada. Conecte novamente.');
  }
}
function connectTwitch(ch,manual){
  ch=(ch||'').replace(/^#/,'').trim().toLowerCase();
  if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}clearTimeout(wsTimer);
  if(manual)wsTry=0;
  if(!ch){setStatus(false,'Sem canal');return}
  setStatus(false,`Conectando a #${ch}…`);G.twitch='connecting';
  let opened=false;
  try{ws=new WebSocket('wss://irc-ws.chat.twitch.tv:443')}catch(e){twitchFail(ch);return}
  ws.onopen=()=>{
    opened=true;
    ws.send('CAP REQ :twitch.tv/tags twitch.tv/commands');
    ws.send(twitchAuthToken?'PASS oauth:'+twitchAuthToken:'PASS SCHMOOPIIE');
    ws.send('NICK '+(twitchAuthToken&&twitchLogin?twitchLogin:'justinfan'+Math.floor(rand(10000,99999))));
    ws.send('JOIN #'+ch);
  };
  ws.onmessage=ev=>{for(const line of String(ev.data).split('\r\n')){
    if(!line)continue;
    if(line.startsWith('PING')){ws.send('PONG :tmi.twitch.tv');continue}
    let rest=line,tags={};
    if(rest[0]==='@'){const sp=rest.indexOf(' ');rest.slice(1,sp).split(';').forEach(kv=>{const i=kv.indexOf('=');tags[kv.slice(0,i)]=kv.slice(i+1)});rest=rest.slice(sp+1)}
    const m=rest.match(/^:([^!\s]+)!\S+ PRIVMSG #\S+ :(.*)$/);
    if(m){const login=m[1],name=(tags['display-name']||login).replace(/\\s/g,' ');handleChat(login,name||login,tags.color,m[2]);continue}
    if(/ (366|ROOMSTATE) /.test(rest)){
      G.twitch='ok';wsTry=0;
      setStatus(true,twitchAuthToken?`Twitch: @${twitchLogin} • canal #${ch}`:`Twitch: #${ch} • digite !radical`);
      window.dispatchEvent(new CustomEvent('rr:twitch-chat-connected',{detail:{channel:ch,login:twitchLogin}}));
    }
  }};
  ws.onclose=()=>{if(!opened||G.twitch!=='ok')twitchFail(ch);else{setStatus(false,'Twitch caiu — reconectando…');wsTimer=setTimeout(()=>connectTwitch(ch),4000)}};
}
function twitchFail(ch){
  wsTry++;
  if(wsTry>=2){
    G.twitch='blocked';
    setStatus(false,twitchAuthToken?'Falha na Twitch — verifique a autorização e o canal':'Twitch indisponível aqui — modo teste');
    $('pad').classList.add('show');
    if(!twitchAuthToken&&!G.autoBots&&racers.size===0){G.autoBots=true;addBots(7);if(G.state==='lobby'&&isFinite(G.timer))G.timer=Math.min(G.timer,10)}
    wsTimer=setTimeout(()=>connectTwitch(ch),30000);
  }else wsTimer=setTimeout(()=>connectTwitch(ch),1500);
}
