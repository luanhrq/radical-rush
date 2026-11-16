// ======================================================================
// HOST: painel e barra do topo durante a corrida
// ======================================================================
// Na corrida o botão HOST e o painel ficam translúcidos para não tapar a cena;
// voltam ao normal com o mouse em cima (ou com foco do teclado). Estilos em src/style.css.
(function hostUi(){
  const pad=$('pad'),btn=$('btnPad'),body=document.body;
  if(!pad)return;
  const sync=()=>{const open=pad.classList.contains('show');body.classList.toggle('pad-open',open);if(btn)btn.setAttribute('aria-expanded',String(open))};
  new MutationObserver(sync).observe(pad,{attributes:true,attributeFilter:['class']});sync();
  const close=$('padClose');if(close)close.onclick=()=>pad.classList.remove('show');
  addEventListener('keydown',e=>{if(e.key==='Escape'&&pad.classList.contains('show')){pad.classList.remove('show');if(btn)btn.focus()}});
  const start=$('padStart');if(start)start.onclick=()=>startRaceNow();
  const hint=$('padCmdsHint');
  setInterval(()=>{
    body.classList.toggle('racing',G.state==='race'||G.state==='intro');
    if(start){const lobby=G.state==='lobby',ready=lobby&&(racers.size+pending.size)>0;start.disabled=!ready;
      start.textContent=lobby?'▶ INICIAR AGORA':G.state==='race'||G.state==='intro'?'CORRIDA EM ANDAMENTO':'AGUARDE A PRÓXIMA RODADA';
      start.title=ready?'Larga agora, sem esperar o cronômetro.':lobby?'Precisa de pelo menos um piloto na largada.':''}
    if(hint){const me=twitchLogin&&racers.get(twitchLogin.toLowerCase());
      hint.textContent=!(G.twitch==='ok'&&twitchLogin)?'Conecte sua conta Twitch na tela inicial para correr e usar as trapaças.':!me?'Entre na corrida para usar as trapaças.':G.state==='race'?'Clique ou use as teclas 1–9.':'As trapaças liberam quando a corrida começar.'}
  },250);
})();
