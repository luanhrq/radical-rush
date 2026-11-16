// ======================================================================
// DIAGNÓSTICO DE INICIALIZAÇÃO
// ======================================================================
// Evita que uma exceção no boot deixe apenas o spinner indefinidamente.
(function watchStartup(){
  const loading=$('loading');
  if(!loading)return;
  let reported=false;
  const showFailure=message=>{
    if(reported||loading.classList.contains('hide'))return;
    reported=true;
    const detail=String(message||'erro desconhecido').slice(0,240);
    $('loadMsg').textContent=`Falha ao iniciar: ${detail}. Abra o Console (F12) para detalhes.`;
    console.error('[Radical Rush] Falha durante a inicialização:',message);
  };
  addEventListener('error',event=>{
    const source=event.filename?` (${event.filename.split('/').pop()}${event.lineno?':'+event.lineno:''})`:'';
    showFailure((event.message||'Erro JavaScript')+source);
  },true);
  addEventListener('unhandledrejection',event=>{
    const reason=event.reason;
    showFailure(reason&&reason.message?reason.message:reason);
  });
  setTimeout(()=>{
    if(!loading.classList.contains('hide')&&!reported){
      $('loadMsg').textContent='A inicialização está demorando. Verifique o Console (F12) e tente recarregar a página.';
      console.warn('[Radical Rush] A inicialização continua ativa após 30 segundos.');
    }
  },30000);
})();
