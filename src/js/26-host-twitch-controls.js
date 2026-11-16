// ======================================================================
// HOST PANEL — owner controls and authenticated Twitch identity
// ======================================================================
(function configureHostPanelForTwitch(){
  const style=document.createElement('style');
  style.textContent=`
    #tr{position:relative}
    #btnPad{
      position:fixed;right:max(22px,env(safe-area-inset-right,0px));
      top:calc(20px + env(safe-area-inset-top,0px));z-index:5;
      min-width:112px;min-height:44px;padding:10px 20px;
      border:1px solid rgba(255,111,111,.52);border-radius:12px;
      background:linear-gradient(120deg,#ff4a1c,#e51f4b);
      color:#fff;font-size:13px;font-weight:900;letter-spacing:.16em;
      box-shadow:0 8px 26px rgba(255,45,65,.32);
      transition:filter .18s,transform .18s,box-shadow .18s;
    }
    #btnPad:hover{filter:brightness(1.13);transform:translateY(-1px);box-shadow:0 11px 30px rgba(255,45,65,.43)}
    #btnPad[aria-expanded="true"]{background:linear-gradient(120deg,#c92232,#941b38)}
    #pad{width:min(410px,calc(100vw - 32px));}
    #pad .ph{color:#fff;font-size:12px;letter-spacing:.2em}
    #pad #padName{min-width:0;color:#fff;font-weight:700}
    #pad #padName[readonly]{border-color:rgba(93,255,160,.25);background:rgba(93,255,160,.07)}
    #pad #btnJoin{min-width:110px;min-height:44px;background:linear-gradient(120deg,#ff4a1c,#ff2e63);font-size:13px;letter-spacing:.08em}
    #pad #btnJoin:disabled{background:rgba(255,255,255,.1);color:#9098a8;opacity:.65;cursor:not-allowed}
    #hostConnectionState{font-size:12px;line-height:1.45;overflow-wrap:anywhere}
    @media(max-width:860px){
      #btnPad{right:max(12px,env(safe-area-inset-right,0px));top:calc(12px + env(safe-area-inset-top,0px));min-width:100px;min-height:42px}
      #pad{width:auto}
    }
  `;
  document.head.append(style);

  const pad=$('pad'),hostToggle=$('btnPad'),nameInput=$('padName'),joinButton=$('btnJoin');
  if(hostToggle){
    hostToggle.textContent='HOST';
    hostToggle.setAttribute('aria-controls','pad');
    hostToggle.setAttribute('aria-expanded','false');
    hostToggle.onclick=()=>{
      const open=!pad.classList.contains('show');
      pad.classList.toggle('show',open);
      hostToggle.setAttribute('aria-expanded',String(open));
    };
  }
  if(!pad||!nameInput||!joinButton)return;

  const authenticated=()=>G.twitch==='ok'&&!!twitchLogin;
  const syncIdentity=()=>{
    const connected=authenticated();
    nameInput.value=connected?twitchLogin:'';
    nameInput.readOnly=true;
    nameInput.placeholder=connected?'Canal conectado':'Conecte sua conta Twitch na tela inicial';
    joinButton.textContent=connected&&(racers.has(twitchLogin.toLowerCase())||pending.has(twitchLogin.toLowerCase()))?'SAIR':'ENTRAR';
    joinButton.disabled=!connected;
    joinButton.title=connected?`Entrar na corrida como @${twitchLogin}`:'Conecte sua conta Twitch antes de entrar.';
  };

  joinButton.onclick=()=>{
    if(!authenticated()){
      feed('🔒 Conecte sua conta Twitch na tela inicial antes de entrar.');
      return;
    }
    const login=twitchLogin.toLowerCase();
    if(racers.has(login)||pending.has(login))handleChat(login,twitchLogin,null,'!sair');
    else join(login,twitchLogin,null,false);
    syncIdentity();
  };

  const oldCmds=$('padCmds');
  if(oldCmds){
    const cmds=oldCmds.cloneNode(true);
    oldCmds.replaceWith(cmds);
    cmds.addEventListener('click',event=>{
      const button=event.target.closest('button[data-cmd]');
      if(!button||!authenticated())return;
      const racer=racers.get(twitchLogin.toLowerCase());
      if(!racer)return;
      handleChat(twitchLogin.toLowerCase(),twitchLogin,null,'!'+button.dataset.cmd);
      updatePad();
    });
  }

  const baseUpdatePad=updatePad;
  updatePad=function(){
    baseUpdatePad();
    syncIdentity();
    const racer=authenticated()?racers.get(twitchLogin.toLowerCase()):null;
    document.querySelectorAll('#padCmds button[data-cmd]').forEach(button=>{
      const command=button.dataset.cmd;
      const remaining=racer?Math.max(0,(racer.cd[command]||0)-G.clock):0;
      const canUse=!!racer&&G.state==='race'&&!racer.finished&&remaining<=0;
      button.disabled=!canUse;
      button.style.setProperty('--cd',racer&&COOL[command]?Math.min(1,remaining/COOL[command]):0);
      button.title=!racer?'Entre na corrida com sua conta conectada para usar os comandos.':remaining>0?`Disponível em ${Math.ceil(remaining)}s`:'Usar comando no chat';
    });
  };

  window.addEventListener('rr:twitch-auth',syncIdentity);
  window.addEventListener('rr:twitch-chat-connected',()=>{syncIdentity();updatePad()});
  window.addEventListener('rr:twitch-disconnected',syncIdentity);
  syncIdentity();

  window.addEventListener('keydown',event=>{
    if(!/^[1-9]$/.test(event.key)||event.target.matches('input,select,textarea'))return;
    event.stopImmediatePropagation();
    if(!authenticated())return;
    const button=document.querySelector(`#padCmds button[data-cmd]:nth-child(${Number(event.key)})`);
    if(button&&!button.disabled)button.click();
  },true);
})();
