// ======================================================================
// PAINEL HOST — opções de organização e legibilidade
// ======================================================================
(function polishHostPanel(){
  // estilos em src/style.css (seção "Streamer e painel HOST")

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
