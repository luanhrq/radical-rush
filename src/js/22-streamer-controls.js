// ======================================================================
// CONTROLES PARA STREAMERS (tela inicial e tela de campeão)
// ======================================================================
// Os estilos ficam em src/style.css (seção "Streamer e painel HOST").

// Larga na hora, sem esperar o cronômetro do lobby (precisa de pelo menos um piloto).
function startRaceNow(){
  if(G.state!=='lobby'||!racers.size&&!pending.size)return false;
  for(const p of pending.values())createRacer(p.login,p.name,p.color,p.isBot);
  pending.clear();resetRacers();startIntro();return true;
}

(function addStreamerControls(){
  const add=()=>{
    const lobbyLeft=document.querySelector('#lobby .lb-left');
    const champWrap=document.querySelector('#champ .rs-wrap');
    if(!lobbyLeft||!champWrap||!window.radical)return false;

    if(!$('lobbyStart')){
      const card=document.createElement('div');card.className='rr-controls';card.id='streamerCard';
      card.innerHTML=`
        <div class="sc-row">
          <div class="sc-id" id="streamerConnected" aria-live="polite">
            <span class="sc-av" aria-hidden="true">t</span>
            <span class="sc-txt"><span class="sc-k">CONECTADO COMO</span><span class="sc-n" id="streamerLogin"></span></span>
          </div>
          <div class="sc-acts">
            <button id="connectStreamerTwitch" type="button"><span class="rr-twitch-mark" aria-hidden="true">t</span><span id="connectStreamerLabel">CONECTAR COM TWITCH</span></button>
            <button id="logoutStreamerTwitch" type="button" class="sc-sec" hidden>SAIR</button>
          </div>
        </div>
        <button id="lobbyStart" type="button">▶ INICIAR AGORA</button>
        <small id="streamerChannelHelp">Conecte sua conta Twitch para usar automaticamente o chat do seu canal.</small>`;
      lobbyLeft.append(card);
      $('lobbyStart').addEventListener('click',()=>startRaceNow());
      $('connectStreamerTwitch').addEventListener('click',()=>beginTwitchLogin(!!twitchLogin));
      $('logoutStreamerTwitch').addEventListener('click',()=>logoutTwitch());
    }

    if(!$('startNewChampionship')){
      const button=document.createElement('button');button.id='startNewChampionship';button.type='button';button.textContent='🏁 COMEÇAR NOVO CAMPEONATO';
      button.addEventListener('click',()=>{
        if(G.state!=='champion')return;
        session.clear();renderSession();G.round++;G.champ=0;
        show('champ',false);setLoading(true,'Preparando o novo campeonato…');G.state='building';
        setTimeout(()=>{enterLobby(false);setLoading(false);feed('🏁 Novo campeonato começando!')},40);
      });
      const controls=document.createElement('div');controls.className='rr-controls rr-champ';controls.append(button);champWrap.append(controls);
    }
    updateTwitchControls(twitchLogin);
    return true;
  };

  function updateTwitchControls(login){
    const card=$('streamerCard'),label=$('connectStreamerLabel'),name=$('streamerLogin'),help=$('streamerChannelHelp'),out=$('logoutStreamerTwitch');
    if(!card||!label)return;
    card.classList.toggle('on',!!login);
    if(out)out.hidden=!login;
    if(name)name.textContent=login?'@'+login:'';
    label.textContent=login?'TROCAR CONTA':'CONECTAR COM TWITCH';
    if(help)help.textContent=login?`O chat da corrida é o de #${CFG.channel||login}.`:'Conecte sua conta Twitch para usar automaticamente o chat do seu canal.';
  }
  window.addEventListener('rr:twitch-auth',e=>updateTwitchControls(e.detail?.login||''));
  window.addEventListener('rr:twitch-chat-connected',e=>{
    const help=$('streamerChannelHelp');if(help)help.textContent=`Chat de #${e.detail.channel} conectado: a comunidade digita !radical para entrar.`;
  });
  if(add()){}else{const retry=setInterval(()=>{if(add())clearInterval(retry)},100)}
})();

// Restaura a sessão da Twitch (se houver) e processa o retorno OAuth.
restoreTwitchLogin();

setInterval(()=>{
  const button=$('lobbyStart');
  if(button){
    const ready=G.state==='lobby'&&(racers.size+pending.size)>0;
    button.disabled=!ready;
    button.title=ready?'Iniciar a corrida agora, sem esperar o cronômetro.':'Aguardando pelo menos um piloto para iniciar.';
  }
},300);
