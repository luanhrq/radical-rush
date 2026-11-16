// ======================================================================
// CONTROLES PARA STREAMERS
// ======================================================================
(function addStreamerControls(){
  const style=document.createElement('style');
  style.textContent=`
    .rr-controls{position:relative;z-index:5;pointer-events:auto;display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:22px}
    #lobby .rr-controls{width:min(100%,560px);padding:14px;border:1px solid rgba(205,220,255,.16);border-radius:16px;background:linear-gradient(145deg,rgba(14,20,34,.88),rgba(8,12,22,.76));box-shadow:0 16px 40px rgba(0,0,0,.24),inset 0 1px rgba(255,255,255,.06);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px)}
    .rr-controls button{min-height:44px;font:800 12px var(--fb);letter-spacing:.1em;color:#fff;border:1px solid rgba(255,255,255,.16);border-radius:11px;padding:11px 16px;cursor:pointer;transition:transform .18s ease,filter .18s ease,box-shadow .18s ease;background:linear-gradient(120deg,var(--hot),var(--hot2));box-shadow:0 7px 22px rgba(255,74,28,.2)}
    .rr-controls button:hover:not(:disabled){filter:brightness(1.12);transform:translateY(-1px);box-shadow:0 10px 26px rgba(255,74,28,.28)}
    .rr-controls button:active:not(:disabled){transform:translateY(0)}.rr-controls button:disabled{opacity:.42;cursor:not-allowed;filter:saturate(.45);box-shadow:none}
    #lobbyStart{flex:1 1 190px;min-height:48px;font-size:13px;background:linear-gradient(115deg,#ff6331,#ff2e63);box-shadow:0 8px 26px rgba(255,65,46,.3)}
    #lobbyStart:disabled{background:linear-gradient(115deg,#555d70,#394155)}
    .rr-channel{flex:1 1 280px;min-width:0;display:flex;align-items:center;gap:9px}
    #connectStreamerTwitch{min-height:48px;display:inline-flex;align-items:center;justify-content:center;gap:9px;white-space:nowrap;background:#9147ff;border-color:rgba(255,255,255,.12);box-shadow:0 8px 24px rgba(145,71,255,.27)}
    #connectStreamerTwitch:hover:not(:disabled){background:#a365ff;box-shadow:0 10px 27px rgba(145,71,255,.36)}
    .rr-twitch-mark{width:17px;height:17px;display:inline-grid;place-items:center;border-radius:4px;background:#fff;color:#9147ff;font-size:11px;font-weight:900;letter-spacing:-.08em}
    .rr-channel small{flex:1 1 100%;color:var(--ink3);font-size:10px;font-weight:600;line-height:1.45}
    .rr-connected{display:none;align-items:center;gap:7px;min-height:40px;padding:8px 12px;border:1px solid rgba(93,255,160,.25);border-radius:999px;background:rgba(93,255,160,.08);color:var(--ok);font-size:11px;font-weight:800;letter-spacing:.04em}
    .rr-controls .rr-logout{min-height:40px;padding:8px 14px;background:transparent;border:1px solid rgba(255,255,255,.22);box-shadow:none;color:var(--ink2);font-size:11px}
    .rr-controls .rr-logout:hover:not(:disabled){background:rgba(255,255,255,.08);color:#fff;box-shadow:none}.rr-logout[hidden]{display:none}
    .rr-connected.show{display:inline-flex}.rr-connected:before{content:"";width:7px;height:7px;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
    #champ .rr-controls{justify-content:center;margin:24px auto 0}
    #startNewChampionship{min-height:48px;padding:12px 22px;font-size:13px;letter-spacing:.1em;background:linear-gradient(115deg,#ff6331,#ff2e63);box-shadow:0 9px 28px rgba(255,65,46,.28)}
    @media(max-width:860px){.rr-controls{margin-top:14px;gap:9px}#lobby .rr-controls{width:100%;padding:11px;border-radius:13px}#lobbyStart{flex-basis:100%}.rr-channel{flex-basis:100%;flex-wrap:wrap}#connectStreamerTwitch{flex:1}.rr-channel small{flex-basis:100%}#champ .rr-controls{margin-top:18px}}
    @media(prefers-reduced-motion:reduce){.rr-controls button{transition:none}}
  `;
  document.head.append(style);

  const add=()=>{
    const lobbyLeft=document.querySelector('#lobby .lb-left');
    const champWrap=document.querySelector('#champ .rs-wrap');
    if(!lobbyLeft||!champWrap||!window.radical)return false;

    if(!$('lobbyStart')){
      const controls=document.createElement('div');controls.className='rr-controls';
      controls.innerHTML='<button id="lobbyStart" type="button">▶ INICIAR AGORA</button><div class="rr-channel"><button id="connectStreamerTwitch" type="button"><span class="rr-twitch-mark">t</span><span id="connectStreamerLabel">CONECTAR COM TWITCH</span></button><span id="streamerConnected" class="rr-connected" aria-live="polite"></span><button id="logoutStreamerTwitch" type="button" class="rr-logout" hidden>SAIR</button><small id="streamerChannelHelp">Conecte sua conta Twitch para usar automaticamente o chat do seu canal.</small></div>';
      lobbyLeft.append(controls);
      $('lobbyStart').addEventListener('click',()=>{
        if(G.state!=='lobby'||!racers.size&&!pending.size)return;
        for(const p of pending.values())createRacer(p.login,p.name,p.color,p.isBot);
        pending.clear();resetRacers();startIntro();
      });
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
      const controls=document.createElement('div');controls.className='rr-controls';controls.append(button);champWrap.append(controls);
    }
    updateTwitchControls(twitchLogin);
    return true;
  };

  function updateTwitchControls(login){
    const button=$('connectStreamerTwitch'),label=$('connectStreamerLabel'),identity=$('streamerConnected'),help=$('streamerChannelHelp');
    if(!button||!label||!identity)return;
    const out=$('logoutStreamerTwitch');if(out)out.hidden=!login;
    if(login){
      label.textContent='TROCAR CONTA';identity.textContent=`CONECTADO COMO @${login}`;identity.classList.add('show');
      if(help)help.textContent=`O chat da corrida está direcionado para #${CFG.channel||login}.`;
    }else{
      label.textContent='CONECTAR COM TWITCH';identity.textContent='';identity.classList.remove('show');
      if(help)help.textContent='Conecte sua conta Twitch para usar automaticamente o chat do seu canal.';
    }
  }
  window.addEventListener('rr:twitch-auth',e=>updateTwitchControls(e.detail?.login||''));
  window.addEventListener('rr:twitch-chat-connected',e=>{
    const help=$('streamerChannelHelp');if(help)help.textContent=`Conectado ao chat de #${e.detail.channel}. A comunidade pode digitar !radical para entrar.`;
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
