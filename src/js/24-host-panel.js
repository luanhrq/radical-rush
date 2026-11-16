// ======================================================================
// PAINEL HOST — opções de organização e legibilidade
// ======================================================================
(function polishHostPanel(){
  const style=document.createElement('style');
  style.textContent=`
    #pad{
      width:min(390px,calc(100vw - 32px));
      max-height:calc(100vh - 112px - env(safe-area-inset-bottom,0px));
      overflow-y:auto;overscroll-behavior:contain;
      padding:18px;
      background:rgba(7,10,18,.96);
      border:1px solid rgba(205,220,255,.22);
      box-shadow:0 20px 70px rgba(0,0,0,.52),0 0 0 1px rgba(255,255,255,.025);
      scrollbar-width:thin;scrollbar-color:rgba(163,175,200,.4) transparent;
    }
    #pad .ph{
      position:sticky;top:-18px;z-index:2;
      margin:-18px -18px 14px;padding:15px 18px 12px;
      background:rgba(7,10,18,.98);border-bottom:1px solid var(--line);
      color:var(--ink);font-size:11px;letter-spacing:.2em;
    }
    #pad .ph span{color:var(--ink2);letter-spacing:.03em}
    #hostConnectionState{
      display:flex;align-items:center;gap:8px;
      margin:0 0 13px;padding:10px 12px;
      border:1px solid rgba(255,128,128,.25);border-radius:10px;
      background:rgba(255,74,28,.08);color:#ffaaaa;
      font-size:11px;font-weight:800;letter-spacing:.04em;
    }
    #hostConnectionState:before{content:"";width:8px;height:8px;flex:none;border-radius:50%;background:currentColor;box-shadow:0 0 10px currentColor}
    #hostConnectionState.connected{border-color:rgba(93,255,160,.25);background:rgba(93,255,160,.08);color:var(--ok)}
    #pad .prow{gap:8px;margin-top:9px}
    #pad input,#pad select{min-height:40px;padding:9px 11px;background:rgba(255,255,255,.075);border-color:rgba(205,220,255,.18)}
    #pad button{min-height:40px;padding:9px 12px}
    #pad #btnJoin{min-width:94px}
    #padCmds{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
    #padCmds button{min-height:48px;padding:9px 8px;border:1px solid rgba(205,220,255,.1);border-radius:10px;background:rgba(255,255,255,.065);font-size:12px}
    #padCmds button:hover:not(:disabled){background:rgba(255,255,255,.12);border-color:rgba(205,220,255,.24)}
    #padCmds button small{margin-top:4px;color:#a3afc8}
    #padCmds button:disabled{opacity:.52}
    #pad .prow select{font-size:12px}
    #pad #btnBots{white-space:nowrap}
    #padNote{padding-top:8px;border-top:1px solid var(--line);font-size:11px}
    @media(max-width:860px){
      #pad{left:max(12px,env(safe-area-inset-left,0px));right:max(12px,env(safe-area-inset-right,0px));bottom:calc(46px + env(safe-area-inset-bottom,0px));width:auto;max-height:calc(100dvh - 100px - env(safe-area-inset-bottom,0px));padding:15px}
      #pad .ph{top:-15px;margin:-15px -15px 12px;padding:13px 15px 11px}
      #padCmds{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
      #padCmds button{font-size:11px;min-height:44px}
    }
    @media(max-height:650px){#pad{max-height:calc(100vh - 70px - env(safe-area-inset-bottom,0px))}#pad .ph{position:static}}
  `;
  document.head.append(style);

  const pad=$('pad');
  if(!pad)return;
  const title=pad.querySelector('.ph');
  if(title){title.firstChild.textContent='PAINEL DO HOST ';}
  // O login Twitch já é feito pelo botão da tela inicial. Remova a linha legada
  // de canal do painel para evitar um segundo caminho de conexão/confusão.
  const legacyChannel=$('padChan');
  if(legacyChannel){const row=legacyChannel.closest('.prow');if(row)row.remove()}
  const legacyButton=$('btnChan');if(legacyButton)legacyButton.remove();

  const state=document.createElement('div');
  state.id='hostConnectionState';state.setAttribute('role','status');state.setAttribute('aria-live','polite');
  if(title)title.insertAdjacentElement('afterend',state);else pad.prepend(state);

  const update=()=>{
    const connected=G.twitch==='ok'&&!!twitchLogin;
    state.textContent=connected?`Twitch conectada: @${twitchLogin}`:G.twitch==='connecting'?'Conectando à Twitch…':'Twitch desconectada — conecte pela tela inicial';
    state.classList.toggle('connected',connected);
  };
  window.addEventListener('rr:twitch-auth',update);
  window.addEventListener('rr:twitch-chat-connected',update);
  update();
})();
