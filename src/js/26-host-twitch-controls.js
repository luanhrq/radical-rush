// ======================================================================
// HOST PANEL — owner controls and authenticated Twitch identity
// ======================================================================
(function configureHostPanelForTwitch(){
  // estilos em src/style.css (seção "Streamer e painel HOST")

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
