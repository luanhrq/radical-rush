// ======================================================================
// BOOT
// ======================================================================
window.radical={setDR(v){DR=v;resize()},get LIFE(){return LIFE},handleChat,G,racers,camera,renderer,scene,terrainH,trackAt,CTA,get W(){return W},addBots,CAM,get AU(){return AU},get post(){return post},applyAvatar,get SPEC(){return SPEC},dbg(){const g=post.grade&&post.grade.uniforms;const o={};for(const k in FOGU){const v=FOGU[k].value;o[k]=v&&v.toArray?v.toArray().map(x=>+(+x).toFixed(4)):v}if(g)for(const k of['uExp','uSunVis','uUW','uBoost','uRays'])o['g_'+k]=g[k].value;o.sunVisS=sunVisS;o.sunI=sun.intensity;o.fov=camera.fov;o.cam=camera.matrixWorld.elements.some(x=>!isFinite(x));o.drs=DR;return o},snap(){for(let i=0;i<80;i++){for(const r of racers.values())updateRacer(r,.02,G.clock);G.rank=ranking();updateCamera(.08,G.clock)}return[camera.position.toArray().map(v=>+v.toFixed(1)),CAM.look.toArray().map(v=>+v.toFixed(1))]}};
window.claude?.hot?.snapshot?.(()=>({session:[...session.entries()]}));
async function boot(){
  try{await Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,2500))])}catch(e){}
  setLoading(true,'Gerando texturas de rocha, neve e grama…');await new Promise(r=>setTimeout(r,30));
  buildTextures();buildTexturesHD();buildAtlas();
  setLoading(true,'Esculpindo as montanhas…');await new Promise(r=>setTimeout(r,30));
  setupPost();makeOcean();
  const data=window.claude?.hot?.data;if(data&&data.session)for(const[k,v]of data.session)session.set(k,v);
  enterLobby(true);
  $('lobbyChan').textContent=CFG.channel;$('padVer').textContent=`v${VERSION} · tecla C · atalhos 1–9`;$('roundNum').dataset.v=VERSION;
  if(CFG.bots)addBots(CFG.bots);
  if(Q.has('demo')){G.twitch='blocked';setStatus(false,'Modo demo');$('pad').classList.add('show');if(!CFG.bots)addBots(8)}
  else connectTwitch(CFG.channel);
  setLoading(false);
  audioInit();if(AU.ctx)AU.ctx.resume().catch(()=>{});setTimeout(updSndBtn,400);
  requestAnimationFrame(frame);
}
boot();
