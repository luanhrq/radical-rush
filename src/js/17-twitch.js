// ======================================================================
// TWITCH
// ======================================================================
let ws=null,wsTry=0,wsTimer=0;
const TWITCH_CLIENT_ID='gak9zpsfc5uef6csu3d2uo7mooaalq';
const TWITCH_OAUTH_STATE_KEY='rr.twitch.oauth.state';
const TWITCH_TOKEN_KEY='rr.twitch.oauth.token';
const TWITCH_LOGIN_KEY='rr.twitch.oauth.login';
// Conta lembrada neste navegador (sobrevive a fechar a aba, reiniciar o navegador ou o OBS).
const TWITCH_REMEMBER_TOKEN_KEY='rr.twitch.remember.token';
const TWITCH_REMEMBER_LOGIN_KEY='rr.twitch.remember.login';
let twitchAuthToken='',twitchLogin='';
// Prioridade: a conta desta aba (cada aba pode usar uma conta diferente ao mesmo tempo e mantém a sua no F5);
// sem conta na aba, usa a última conta conectada neste navegador.
try{
  twitchAuthToken=sessionStorage.getItem(TWITCH_TOKEN_KEY)||'';
  twitchLogin=sessionStorage.getItem(TWITCH_LOGIN_KEY)||'';
}catch(_){}
const TWITCH_LOGGED_OUT_KEY='rr.twitch.loggedout';
let twitchLoggedOut=false;try{twitchLoggedOut=sessionStorage.getItem(TWITCH_LOGGED_OUT_KEY)==='1'}catch(_){}
if(!twitchLogin&&!twitchLoggedOut){
  try{
    twitchAuthToken=localStorage.getItem(TWITCH_REMEMBER_TOKEN_KEY)||'';
    twitchLogin=localStorage.getItem(TWITCH_REMEMBER_LOGIN_KEY)||'';
  }catch(_){}
}
function setStatus(ok,txt){const s=$('status');s.className='glass '+(ok?'ok':'bad');s.textContent=txt}
function twitchIdentity(login){
  twitchLogin=login;
  CFG.channel=login;
  const lobbyChan=$('lobbyChan');if(lobbyChan)lobbyChan.textContent=login;
  const padChannel=$('padChan');if(padChannel)padChannel.value=login;
  window.dispatchEvent(new CustomEvent('rr:twitch-auth',{detail:{login}}));
}
function twitchRedirectUri(){return location.origin+location.pathname}
// switchAccount: obriga a Twitch a mostrar a tela de autorização (para escolher outra conta).
// Sem isso, quem já autorizou o jogo volta logado na hora, sem tela intermediária.
function beginTwitchLogin(switchAccount){
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
  if(switchAccount===true)auth.searchParams.set('force_verify','true');
  location.assign(auth.toString());
}
async function validateTwitchToken(token){
  let response;
  try{response=await fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:'OAuth '+token},cache:'no-store',signal:AbortSignal.timeout?AbortSignal.timeout(8000):undefined})}
  catch(e){const err=new Error('Sem resposta da Twitch para validar a sessão.');err.network=true;throw err}
  if(response.status===401){const err=new Error('A sessão da Twitch expirou. Conecte sua conta novamente.');err.expired=true;throw err}
  if(!response.ok){const err=new Error('A Twitch não validou a sessão agora.');err.network=true;throw err}
  const data=await response.json();
  if(data.client_id!==TWITCH_CLIENT_ID)throw new Error('A sessão pertence a outro aplicativo Twitch.');
  if(!data.login)throw new Error('Não foi possível identificar seu canal Twitch.');
  return data;
}
function persistTwitchSession(token,login){
  twitchAuthToken=token;twitchLogin=login.toLowerCase();
  try{
    sessionStorage.setItem(TWITCH_TOKEN_KEY,token);
    sessionStorage.setItem(TWITCH_LOGIN_KEY,twitchLogin);
    sessionStorage.removeItem(TWITCH_LOGGED_OUT_KEY);
  }catch(_){/* If storage is unavailable, the current page can still stay connected. */}
  try{
    localStorage.setItem(TWITCH_REMEMBER_TOKEN_KEY,token);
    localStorage.setItem(TWITCH_REMEMBER_LOGIN_KEY,twitchLogin);
  }catch(_){}
}
// Token vencido ou revogado: esquece só o token. O canal continua lembrado,
// porque ler o chat não precisa de autorização.
function dropTwitchToken(){
  const old=twitchAuthToken;twitchAuthToken='';
  try{sessionStorage.removeItem(TWITCH_TOKEN_KEY)}catch(_){}
  try{if(localStorage.getItem(TWITCH_REMEMBER_TOKEN_KEY)===old)localStorage.removeItem(TWITCH_REMEMBER_TOKEN_KEY)}catch(_){}
}
// Sair: esquece a conta desta aba e, se for a mesma conta lembrada no navegador, ela também.
function clearTwitchSession(){
  const oldLogin=twitchLogin;
  twitchAuthToken='';twitchLogin='';
  try{sessionStorage.removeItem(TWITCH_TOKEN_KEY);sessionStorage.removeItem(TWITCH_LOGIN_KEY)}catch(_){}
  try{if(localStorage.getItem(TWITCH_REMEMBER_LOGIN_KEY)===oldLogin){localStorage.removeItem(TWITCH_REMEMBER_TOKEN_KEY);localStorage.removeItem(TWITCH_REMEMBER_LOGIN_KEY)}}catch(_){}
}
function logoutTwitch(){
  clearTwitchSession();
  // esta aba fica desconectada no F5 (não puxa a conta de outra aba) até conectar de novo
  try{sessionStorage.setItem(TWITCH_LOGGED_OUT_KEY,'1')}catch(_){}
  if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}clearTimeout(wsTimer);
  CFG.channel='';G.twitch='disconnected';setStatus(false,'Twitch: desconectado');
  twitchIdentity('');
  window.dispatchEvent(new CustomEvent('rr:twitch-disconnected'));
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
    persistTwitchSession(token,data.login);
    twitchIdentity(twitchLogin);
    connectTwitch(twitchLogin,true);
  }catch(e){clearTwitchSession();setStatus(false,e.message||'Falha ao validar a conta Twitch')}
  return true;
}
async function restoreTwitchLogin(){
  if(await handleTwitchOAuthReturn())return;
  if(!twitchLogin){
    // sem conta lembrada: ?channel=canal na URL (OBS) só lê o chat, sem login
    const ch=(Q.get('channel')||'').replace(/^#/,'').trim().toLowerCase();
    if(ch){CFG.channel=ch;connectTwitch(ch,true)}
    return;
  }
  setStatus(false,'Restaurando conexão com a Twitch…');
  if(twitchAuthToken){
    try{
      const data=await validateTwitchToken(twitchAuthToken);
      persistTwitchSession(twitchAuthToken,data.login);
    }catch(e){
      if(e.expired)dropTwitchToken();
      // sem rede para validar: segue com o canal lembrado; o chat diz se o token ainda vale
    }
  }
  // mantém o canal mesmo sem token válido: o chat é lido sem precisar de login
  try{sessionStorage.setItem(TWITCH_LOGIN_KEY,twitchLogin)}catch(_){}
  twitchIdentity(twitchLogin);
  connectTwitch(twitchLogin,true);
}
// a Twitch pede que apps revalidem o token a cada hora
setInterval(async()=>{
  if(!twitchAuthToken)return;
  try{await validateTwitchToken(twitchAuthToken)}catch(e){if(e.expired)dropTwitchToken()}
},3600*1000);
function connectTwitch(ch,manual){
  ch=(ch||'').replace(/^#/,'').trim().toLowerCase();
  if(ws){ws.onclose=null;try{ws.close()}catch(e){}ws=null}clearTimeout(wsTimer);
  if(manual)wsTry=0;
  if(!ch){G.twitch='disconnected';setStatus(false,'Twitch: desconectado');return}
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
    // token recusado pelo chat (vencido/revogado): esquece o token e lê o mesmo canal sem login
    if(/NOTICE \* :(Login authentication failed|Improperly formatted auth)/.test(line)&&twitchAuthToken){dropTwitchToken();ws.onclose=null;try{ws.close()}catch(e){}ws=null;connectTwitch(ch,true);return}
    let rest=line,tags={};
    if(rest[0]==='@'){const sp=rest.indexOf(' ');rest.slice(1,sp).split(';').forEach(kv=>{const i=kv.indexOf('=');tags[kv.slice(0,i)]=kv.slice(i+1)});rest=rest.slice(sp+1)}
    const m=rest.match(/^:([^!\s]+)!\S+ PRIVMSG #\S+ :(.*)$/);
    if(m){const login=m[1],name=(tags['display-name']||login).replace(/\\s/g,' ');handleChat(login,name||login,tags.color,m[2]);continue}
    if(/ (366|ROOMSTATE) /.test(rest)){
      G.twitch='ok';wsTry=0;
      setStatus(true,`Twitch • #${ch}`);
      window.dispatchEvent(new CustomEvent('rr:twitch-chat-connected',{detail:{channel:ch,login:twitchLogin}}));
    }
  }};
  ws.onclose=()=>{if(!opened||G.twitch!=='ok')twitchFail(ch);else{setStatus(false,'Twitch caiu — reconectando…');wsTimer=setTimeout(()=>connectTwitch(ch),4000)}};
}
function twitchFail(ch){
  wsTry++;
  if(wsTry>=2){
    G.twitch='blocked';
    setStatus(false,twitchAuthToken?'Falha na Twitch — verifique a autorização e o canal':'Twitch indisponível — conecte sua conta Twitch');
    $('pad').classList.add('show');
    if(!twitchAuthToken&&!G.autoBots&&racers.size===0){G.autoBots=true;addBots(7);if(G.state==='lobby'&&isFinite(G.timer))G.timer=Math.min(G.timer,10)}
    wsTimer=setTimeout(()=>connectTwitch(ch),30000);
  }else wsTimer=setTimeout(()=>connectTwitch(ch),1500);
}
