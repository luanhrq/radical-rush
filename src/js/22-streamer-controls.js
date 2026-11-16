// ======================================================================
// CONTROLES PARA STREAMERS
// ======================================================================
// A conexão IRC anônima da Twitch não informa qual conta está autenticada no
// navegador. Por isso, o streamer pode informar aqui o login do próprio canal
// (ou de qualquer canal público) sem depender de um canal fixo no código.
(function addStreamerControls(){
  const style=document.createElement('style');
  style.textContent=`
    .rr-controls{position:relative;z-index:5;pointer-events:auto;display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:16px}
    .rr-controls button{font:800 12px var(--fb);letter-spacing:.08em;color:#fff;border:1px solid rgba(255,255,255,.2);border-radius:10px;padding:11px 16px;cursor:pointer;background:linear-gradient(120deg,var(--hot),var(--hot2))}
    .rr-controls button:hover{filter:brightness(1.12)}.rr-controls button:disabled{opacity:.45;cursor:default}
    .rr-controls input{min-width:0;width:190px;padding:10px 12px;border:1px solid var(--line2);border-radius:10px;background:rgba(9,13,22,.86);color:var(--ink);font:600 13px var(--fb)}
    .rr-channel{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.rr-channel small{flex-basis:100%;color:var(--ink2);font-size:11px}
    @media(max-width:860px){.rr-controls{margin-top:12px}.rr-controls input{width:150px}}
  `;
  document.head.append(style);

  const add=()=>{
    const lobbyLeft=document.querySelector('#lobby .lb-left');
    const champWrap=document.querySelector('#champ .rs-wrap');
    if(!lobbyLeft||!champWrap||!window.radical)return false;

    if(!$('lobbyStart')){
      const controls=document.createElement('div');
      controls.className='rr-controls';
      controls.innerHTML='<button id="lobbyStart" type="button">▶ INICIAR AGORA</button><div class="rr-channel"><input id="streamerChannel" type="text" maxlength="25" autocomplete="off" autocapitalize="none" spellcheck="false" aria-label="Canal da Twitch" placeholder="login do seu canal"><button id="connectStreamerChannel" type="button">CONECTAR CANAL</button><small id="streamerChannelHelp">Informe o login do canal da Twitch que vai receber a corrida.</small></div>';
      lobbyLeft.append(controls);
      $('streamerChannel').value=CFG.channel||'';
      $('lobbyStart').addEventListener('click',()=>{
        if(G.state!=='lobby'||!racers.size&&!pending.size)return;
        // Incorpora quem entrou enquanto aguardava e inicia a contagem regressiva.
        for(const p of pending.values())createRacer(p.login,p.name,p.color,p.isBot);
        pending.clear();resetRacers();
        startIntro();
      });
      $('connectStreamerChannel').addEventListener('click',()=>{
        const channel=$('streamerChannel').value.replace(/^#/,'').trim().toLowerCase();
        if(!/^[a-z0-9_]{1,25}$/.test(channel)){
          $('streamerChannelHelp').textContent='Digite um login Twitch válido (letras, números e _).';
          $('streamerChannel').focus();
          return;
        }
        CFG.channel=channel;LS.set('channel',channel);
        $('lobbyChan').textContent=channel;
        $('padChan').value=channel;
        $('streamerChannelHelp').textContent=`Conectando ao chat de #${channel}…`;
        connectTwitch(channel,true);
      });
      $('streamerChannel').addEventListener('keydown',e=>{
        if(e.key==='Enter')$('connectStreamerChannel').click();
      });
    }

    if(!$('startNewChampionship')){
      const button=document.createElement('button');
      button.id='startNewChampionship';button.type='button';button.textContent='🏁 COMEÇAR NOVO CAMPEONATO';
      button.addEventListener('click',()=>{
        if(G.state!=='champion')return;
        session.clear();renderSession();G.round++;G.champ=0;
        show('champ',false);setLoading(true,'Preparando o novo campeonato…');G.state='building';
        setTimeout(()=>{enterLobby(false);setLoading(false);feed('🏁 Novo campeonato começando!')},40);
      });
      const controls=document.createElement('div');controls.className='rr-controls';controls.style.justifyContent='center';controls.append(button);
      champWrap.append(controls);
    }
    return true;
  };

  // Os elementos do jogo já existem; aguardamos apenas o início da aplicação.
  if(add())return;
  const retry=setInterval(()=>{if(add())clearInterval(retry)},100);
})();

// Atualiza disponibilidade do botão, inclusive quando pilotos entram pelo chat.
setInterval(()=>{
  const button=$('lobbyStart');
  if(button){
    const ready=G.state==='lobby'&&(racers.size+pending.size)>0;
    button.disabled=!ready;
    button.title=ready?'Iniciar a corrida agora, sem esperar o cronômetro.':'Aguardando pelo menos um piloto para iniciar.';
  }
  const input=$('streamerChannel');
  if(input&&document.activeElement!==input&&input.value!==CFG.channel)input.value=CFG.channel||'';
},300);
