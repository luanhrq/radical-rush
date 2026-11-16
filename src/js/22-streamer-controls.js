// ======================================================================
// CONTROLES PARA STREAMERS
// ======================================================================
// A conexão IRC anônima da Twitch não informa qual conta está autenticada no
// navegador. Por isso, o streamer pode informar aqui o login do próprio canal
// (ou de qualquer canal público) sem depender de um canal fixo no código.
(function addStreamerControls(){
  const style=document.createElement('style');
  style.textContent=`
    .rr-controls{position:relative;z-index:5;pointer-events:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:22px}
    #lobby .rr-controls{width:min(100%,560px);padding:14px;border:1px solid rgba(205,220,255,.16);border-radius:16px;background:linear-gradient(145deg,rgba(14,20,34,.88),rgba(8,12,22,.76));box-shadow:0 16px 40px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.06);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    .rr-controls button{min-height:44px;font:800 12px var(--fb);letter-spacing:.1em;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:11px 16px;cursor:pointer;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease;background:linear-gradient(120deg,var(--hot),var(--hot2));box-shadow:0 7px 22px rgba(255,74,28,.2)}
    .rr-controls button:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px);box-shadow:0 10px 26px rgba(255,74,28,.28)}
    .rr-controls button:active:not(:disabled){transform:translateY(0)}
    .rr-controls button:disabled{opacity:.42;cursor:not-allowed;filter:saturate(.45);box-shadow:none}
    #lobbyStart{flex:1 1 190px;min-height:48px;font-size:13px;background:linear-gradient(115deg,#ff6331,#ff2e63);box-shadow:0 8px 26px rgba(255,65,46,.3)}
    #lobbyStart:disabled{background:linear-gradient(115deg,#555d70,#394155)}
    .rr-channel{flex:1 1 280px;min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:7px;align-items:center}
    .rr-channel input{width:100%;min-width:0;height:42px;padding:0 12px;border:1px solid rgba(205,220,255,.2);border-radius:10px;background:rgba(255,255,255,.055);color:var(--ink);font:600 13px var(--fb);transition:border-color .18s,background .18s}
    .rr-channel input::placeholder{color:var(--ink3)}.rr-channel input:focus{border-color:rgba(63,224,255,.7);background:rgba(255,255,255,.08);outline:none;box-shadow:0 0 0 3px rgba(63,224,255,.1)}
    .rr-channel button{min-height:42px;padding:9px 12px;background:rgba(255,255,255,.09);box-shadow:none;letter-spacing:.06em}
    .rr-channel button:hover:not(:disabled){background:rgba(255,255,255,.16);box-shadow:none}
    .rr-channel small{grid-column:1/-1;color:var(--ink3);font-size:10px;font-weight:600;line-height:1.45;padding:1px 3px 0}
    #champ .rr-controls{justify-content:center;margin:24px auto 0}
    #startNewChampionship{min-height:48px;padding:12px 22px;font-size:13px;letter-spacing:.1em;background:linear-gradient(115deg,#ff6331,#ff2e63);box-shadow:0 9px 28px rgba(255,65,46,.28)}
    @media(max-width:860px){
      .rr-controls{margin-top:14px;gap:9px}
      #lobby .rr-controls{width:100%;padding:11px;border-radius:13px}
      #lobbyStart{flex-basis:100%}
      .rr-channel{flex-basis:100%;grid-template-columns:minmax(0,1fr) auto}
      .rr-channel button{font-size:10px;padding-inline:10px}
      #champ .rr-controls{margin-top:18px}
    }
    @media(max-width:420px){.rr-channel{grid-template-columns:1fr}.rr-channel button{width:100%}.rr-channel small{grid-column:1}}
    @media(prefers-reduced-motion:reduce){.rr-controls button{transition:none}}
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
      const controls=document.createElement('div');controls.className='rr-controls';controls.append(button);
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
