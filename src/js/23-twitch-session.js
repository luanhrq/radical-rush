// ======================================================================
// CONEXÃO TWITCH POR SESSÃO
// ======================================================================
// Não há canal padrão: cada página/tab começa desconectada e cada streamer
// autoriza individualmente a própria conta pelo botão de login Twitch.
CFG.channel='';
try{LS.set('channel','')}catch(_){}

function renderTwitchChannel(login){
  const channel=login||'';
  const lobbyChan=$('lobbyChan');
  if(lobbyChan)lobbyChan.textContent=channel||'nenhum canal conectado';
  const cta=document.querySelector('#lobby .cta-t');
  if(cta)cta.innerHTML=channel
    ?`Digite no chat de <b id="lobbyChan">${esc(channel)}</b> para entrar na corrida`
    :`Conecte sua conta Twitch para direcionar a corrida ao seu canal. <b id="lobbyChan" class="hidden">nenhum canal conectado</b>`;
  const hostChannel=$('padChan');
  if(hostChannel){hostChannel.value=channel;hostChannel.placeholder='Conecte sua conta Twitch';hostChannel.readOnly=true}
}

const channelInput=$('padChan'),channelButton=$('btnChan');
if(channelInput){channelInput.value='';channelInput.placeholder='Conecte sua conta Twitch';channelInput.readOnly=true}
if(channelButton){channelButton.textContent=twitchLogin?'TROCAR CONTA':'CONECTAR TWITCH';channelButton.onclick=()=>beginTwitchLogin(!!twitchLogin)}
window.addEventListener('rr:twitch-auth',e=>{if(channelButton)channelButton.textContent=e.detail?.login?'TROCAR CONTA':'CONECTAR TWITCH'});

window.addEventListener('rr:twitch-auth',e=>renderTwitchChannel(e.detail?.login||''));
renderTwitchChannel(twitchLogin);
if(!Q.has('demo')){G.twitch='disconnected';setStatus(false,'Twitch: desconectado')}
