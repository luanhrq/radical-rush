// ======================================================================
// CONEXÃO TWITCH POR SESSÃO
// ======================================================================
// Não há canal padrão: cada página/tab começa desconectada e cada streamer
// autoriza individualmente a própria conta pelo botão de login Twitch.
CFG.channel='';
try{LS.set('channel','')}catch(_){}

function renderTwitchChannel(login){
  const channel=login||'';
  const connected=!!channel;
  const lobbyChan=$('lobbyChan');
  if(lobbyChan)lobbyChan.textContent=connected?channel:'nenhum canal conectado';
  const cta=document.querySelector('#lobby .cta-t');
  if(cta)cta.innerHTML=connected
    ?`Digite no chat de <b id="lobbyChan">${esc(channel)}</b> para entrar na corrida`
    :'Conecte sua conta Twitch para direcionar a corrida ao seu canal.';
  const hostChannel=$('padChan');
  if(hostChannel){hostChannel.value=channel;hostChannel.placeholder='Conecte sua conta Twitch';hostChannel.readOnly=true}
}

// O botão legado do painel HOST também inicia a autenticação individual;
// ele não pode conectar anonimamente a um canal predefinido.
const channelInput=$('padChan'),channelButton=$('btnChan');
if(channelInput){channelInput.value='';channelInput.placeholder='Conecte sua conta Twitch';channelInput.readOnly=true}
if(channelButton){channelButton.textContent='CONECTAR TWITCH';channelButton.onclick=()=>beginTwitchLogin()}

window.addEventListener('rr:twitch-auth',e=>renderTwitchChannel(e.detail?.login||''));
renderTwitchChannel(twitchLogin);
if(!Q.has('demo')){G.twitch='disconnected';setStatus(false,'Twitch: desconectado')}
