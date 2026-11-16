// ======================================================================
// LOOP
// ======================================================================
const clock=new THREE.Clock();
const perf={acc:0,frames:0};
const _sunP=new V3(),_tmp=new V3();
let sunVisS=0;
function sunOcclusion(){
  // march from camera toward the sun over the heightfield
  const o=camera.position;let vis=1;for(let i=1;i<=24;i++){const d=i*i*3;_tmp.copy(o).addScaledVector(SUN_DIR,d);if(Math.abs(_tmp.x)>1290||Math.abs(_tmp.z)>1290)break;if(gridH(_tmp.x,_tmp.z)>_tmp.y){vis=0;break}}return vis}
function frame(){
  requestAnimationFrame(frame);
  const rdt=clock.getDelta(),dt=Math.min(rdt,.05);G.clock+=dt;const t=G.clock;FOGU.uTime.value=t;
  if(!W){renderer.render(scene,camera);return}
  if(G.state==='lobby'){if(racers.size&&!isFinite(G.timer))G.timer=G.first?lobbyTime():CFG.lobbyNext;if(isFinite(G.timer)){G.timer-=dt;if(G.timer<=0)startIntro()}}
  else if(G.state==='intro'){G.timer-=dt;const c=Math.ceil(G.timer);if(c<=3&&c!==G.lastCount&&c>0){G.lastCount=c;countdown(String(c))}if(G.timer<=0){countdown('VAI!');startRace()}}
  else if(G.state==='race'){G.raceT+=dt;G.windT=Math.max(0,G.windT-dt);G.slowT=Math.max(0,G.slowT-dt);G.fogT=Math.max(0,G.fogT-dt);
    G.evT-=dt;if(G.evT<=0){G.evT=hasRule('caos')?rand(8,12):rand(17,27);fireEvent()}
    if(hasRule('eliminacao')){G.elimT-=dt;if(G.elimT<=0){G.elimT=25;const alive=[...racers.values()].filter(r=>!r.finished);if(alive.length>1){alive.sort((a,b)=>a.s-b.s);const o=alive[0];o.out=true;o.finished=true;o.place=900-(G.outN=(G.outN||0)+1);o.v=0;stun(o,99);sfx('crash');feed(`❌ <b>${esc(o.name)}</b> foi ELIMINADO (último lugar)`);banner('ELIMINADO!',o.name,1.8)}}}
    if(G.spot)G.spot.t-=dt;
    const allDone=[...racers.values()].every(r=>r.finished);
    if(!racers.size||allDone||G.raceT>G.maxT||(G.firstFin&&G.raceT-G.firstFin>25))endRace()}
  else if(G.state==='results'){G.timer-=dt;if(G.timer<=0){if(G.champEnd)showChampion();else{G.round++;G.champ++;setLoading(true,'Esculpindo a próxima montanha…');G.state='building';setTimeout(()=>{enterLobby(false);setLoading(false)},40)}}}
  else if(G.state==='champion'){G.timer-=dt;$('champNext').textContent=`Novo campeonato em ${Math.max(0,Math.ceil(G.timer))}s`;if(Math.random()<dt*3){trackAt(W.FIN+rand(-10,10),CTA);burst(CTA.pos.clone().addScaledVector(CTA.side,rand(-12,12)).setY(CTA.ground+rand(8,16)),60,[rand(.5,3),rand(.5,3),rand(.5,3)],14,1,1.4,5,0,GLOW)}
    if(G.timer<=0){session.clear();renderSession();G.round++;G.champ=0;show('champ',false);setLoading(true,'Preparando o novo campeonato…');G.state='building';setTimeout(()=>{enterLobby(false);setLoading(false);feed('🏁 Novo campeonato começando!')},40)}}
  if(G.state==='building')return;
  for(const r of racers.values()){botThink(r,dt);updateRacer(r,dt,t)}
  G.rank=ranking();
  {const A=G.rank;for(let i=0;i<A.length;i++){const a=A[i];if(a.finished||a.mod==='remo')continue;for(let j=i+1;j<A.length&&j<i+4;j++){const b=A[j];if(b.finished||a.mod!==b.mod)continue;const ds=Math.abs(a.s-b.s);if(ds>3.4)continue;const dl=(a.lat+(a.cvLat||0))-(b.lat+(b.cvLat||0)),ad=Math.abs(dl);if(ad<1.8){const push=(1.8-ad)*(1-ds/3.4)*2.4*dt*(dl>0||(dl===0&&i%2)?1:-1);a.lat+=push;b.lat-=push}}}}G.leaderS=G.rank.length?G.rank.find(r=>!r.finished)?.s||0:0;
  for(let i=hazards.length-1;i>=0;i--){const h=hazards[i];h.t-=dt;if(h.kind==='water'){h.mesh.rotation.y+=dt*.25;for(const j of h.mesh.children){const s=1+Math.sin(t*2.6+(j.userData.ph||0))*.13;j.scale.set(s,1/(s*s),s);j.position.y+=Math.cos(t*2.6+(j.userData.ph||0))*dt*.25}}if(h.mesh.userData.flash){const f=h.mesh.userData.flash;f.emissiveIntensity=Math.random()<.04?6:Math.max(0,f.emissiveIntensity-dt*10);h.mesh.rotation.y+=dt*.3}
    if(h.t<=0||h.hit.size>=4){hazGroup.remove(h.mesh);disposeObj(h.mesh);hazards.splice(i,1)}}
  for(let i=missiles.length-1;i>=0;i--){const ms=missiles[i];ms.life-=dt;const tp=_v.copy(ms.t.root.position);tp.y+=1.4;const d=tp.distanceTo(ms.m.position);const sp=(ms.t.v+55)*dt;
    ms.m.lookAt(tp);ms.m.position.lerp(tp,Math.min(1,sp/Math.max(d,.01)));PUFF.emit(ms.m.position.x,ms.m.position.y,ms.m.position.z,rand(-.5,.5),rand(0,1),rand(-.5,.5),.8,.8,.82,1.2,1.2,0,.55,2.4);GLOW.emit(ms.m.position.x,ms.m.position.y,ms.m.position.z,0,0,0,3,1.4,.35,.7,.22,0,1);
    if(d<2.2||ms.life<=0||ms.t.finished){if(d<2.2&&!ms.t.finished){sfx('boom',.9);burst(tp,70,[3,1.3,.3],14,1.4,.7,2,1,GLOW);burst(tp,36,[.3,.3,.32],6,2.6,1.6,-1,3);CAM.shake=Math.max(CAM.shake,.8);if(!blocked(ms.t,ms.from,'o míssil')){stun(ms.t,2.8);feed(`💥 Míssil de ${esc(ms.from.name)} acertou <b>${esc(ms.t.name)}</b>!`);spotlight(ms.t)}}
      hazGroup.remove(ms.m);disposeObj(ms.m);missiles.splice(i,1)}}
  PUFF.update(dt);GLOW.update(dt);BUB.update(dt);updateAudio(dt);updateCourse(dt,t);updatePuddles(dt);updateSeaLife(dt,t);
  updateCamera(dt,t);
  G.lodT-=dt;if(G.lodT<=0){G.lodT=.3;updateLOD()}
  // environment follow
  sky.position.copy(camera.position);
  const ts=sun.shadow.camera.right*2/QL.shadow;_sunP.copy(CAM.look);_sunP.x=Math.round(_sunP.x/ts)*ts;_sunP.z=Math.round(_sunP.z/ts)*ts;
  sun.target.position.copy(_sunP);sun.position.copy(_sunP).addScaledVector(SUN_DIR,450);
  const fogMul=G.fogT>0?2.2:1;FOGU.uFogP.value.x=lerp(FOGU.uFogP.value.x,SKY.fog[0]*fogMul,1-Math.exp(-dt*1.2));FOGU.uFogP.value.w=lerp(FOGU.uFogP.value.w,SKY.fog[2]*(G.fogT>0?2.6:1),1-Math.exp(-dt*1.2));
  const light=new THREE.Color().copy(FOGU.uSunCol.value).multiplyScalar(SKY.sunI*.32).add(FOGU.uSkyHor.value.clone().multiplyScalar(.55));PUFF.mat.uniforms.uLight.value.copy(light);BUB.mat.uniforms.uLight.value.setRGB(.7,1.,1.15);
  if(grass){_tmp.set(0,0,-1).applyQuaternion(camera.quaternion);_tmp.y=0;_tmp.normalize();GRASSU.uCenter.value.set(camera.position.x+_tmp.x*40,camera.position.z+_tmp.z*40);grass.visible=camera.position.y-gridH(camera.position.x,camera.position.z)<80;if(cover)cover.visible=FOGU.uUnder.value.w>0}
  trackAt(CAM.focus&&G.state==='race'?CAM.focus.s:START_S,CTA);
  const underNow=FOGU.uUnder.value.w>0;const snowy=CTA.surface==='snow'||(SKY===SKIES.crisp&&(CTA.surface==='rock'||CTA.surface==='air'))||underNow;snow.material.color.setRGB(underNow?.55:1,underNow?.8:1,underNow?.85:1);snow.material.size=underNow?.08:.22;snow.material.opacity=lerp(snow.material.opacity,snowy?(underNow?.32:.85):0,1-Math.exp(-dt*2));snow.visible=snow.material.opacity>.02;
  if(snow.visible){const cp=camera.position;for(let i=0;i<SNOWN;i++){const j=i*3;snowPos[j+1]-=dt*(underNow?.25+(i%5)*.08:2.5+(i%5)*.8);snowPos[j]+=Math.sin(t*.7+i)*dt*.8;
    const dx=snowPos[j]-cp.x,dy=snowPos[j+1]-cp.y,dz=snowPos[j+2]-cp.z;if(dx>60)snowPos[j]-=120;else if(dx<-60)snowPos[j]+=120;if(dy<-40)snowPos[j+1]+=80;else if(dy>40)snowPos[j+1]-=80;if(dz>60)snowPos[j+2]-=120;else if(dz<-60)snowPos[j+2]+=120}snowGeo.attributes.position.needsUpdate=true}
  {const under=!!(W.water&&ocean&&ocean.visible&&camera.position.y<W.water.level+.05);FOGU.uUnder.value.set(.012,.1,.12,under?.045:0);
    if(post.grade)post.grade.uniforms.uUW.value=lerp(post.grade.uniforms.uUW.value,under?1:0,1-Math.exp(-dt*8));
    if(ocean&&ocean.visible){ocean.position.set(Math.round(camera.position.x/4)*4,W.water.level,Math.round(camera.position.z/4)*4);ocean.material.uniforms.uSunI.value=SKY.sunI}
    if(under)sunVisS=0}
  // sun flare / rays
  if(post.grade){_sunP.copy(camera.position).addScaledVector(SUN_DIR,1000).project(camera);const on=_sunP.z<1&&Math.abs(_sunP.x)<1.3&&Math.abs(_sunP.y)<1.3;const occ=on?sunOcclusion():0;sunVisS=lerp(sunVisS,on?occ:0,1-Math.exp(-dt*6));
    const gu=post.grade.uniforms;gu.uSunUV.value.set(_sunP.x*.5+.5,_sunP.y*.5+.5);gu.uSunVis.value=sunVisS*clamp(1.2-Math.max(Math.abs(_sunP.x),Math.abs(_sunP.y)),0,1);gu.uTime.value=t;gu.uRays.value=QL.rays}
  G.uiT-=dt;if(G.uiT<=0){G.uiT=.25;if(G.state==='race'||G.state==='intro')renderStandings();if(G.state==='lobby')renderLobby();updatePad();
    const sp=$('spot');if(G.state==='race'&&SPEC.on&&SPEC.r){sp.innerHTML=`🎥 ${avatarHTML(SPEC.r,22)} ${esc(SPEC.r.name)} <small style="color:var(--ink3);font-weight:700">· câmera manual</small>`;sp.classList.add('show')}
    else if(G.state==='race'&&G.spot&&G.spot.t>0){sp.innerHTML=`🎥 ${avatarHTML(G.spot.r,22)} ${esc(G.spot.r.name)}`;sp.classList.add('show')}else sp.classList.remove('show')}
  if(post.on){renderer.setRenderTarget(post.sceneRT);renderer.render(scene,camera);renderer.setRenderTarget(null);post.composer.render(rdt)}else renderer.render(scene,camera);
  // adaptive resolution
  perf.acc+=rdt;perf.frames++;if(perf.acc>2){const fps=perf.frames/perf.acc;perf.acc=0;perf.frames=0;
    perf.fps=fps;const dmin=QL.drMin||.55;if(fps<42&&DR>dmin){DR=Math.max(dmin,DR*.9);resize()}else if(fps>57&&DR<1){DR=Math.min(1,DR*1.07);resize()}}
}

