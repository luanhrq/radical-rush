// ======================================================================
// CAMERA DIRECTOR
// ======================================================================
const CAM={pos:new V3(0,700,-1200),look:new V3(0,400,-800),orbit:0,shake:0,focus:null,shot:'chase',shotT:0,roll:0};
const _dp=new V3(),_dl=new V3();
const SHOTS=['chase','chase','low','front','drone','side'];
function updateCamera(dt,t){
  let k=2.4,rollT=0;
  if(G.state==='lobby'||G.state==='boot'){CAM.orbit+=dt*.09;trackAt(START_S-8,CTA);const c=CTA.pos;_dp.set(c.x+Math.cos(CAM.orbit)*24,CTA.ground+7.5+Math.sin(CAM.orbit*.7)*2.5,c.z+Math.sin(CAM.orbit)*24);_dl.set(c.x,CTA.ground+2.2,c.z);k=1.2}
  else if(G.state==='intro'){trackAt(START_S-30,CTA);_dp.copy(CTA.pos);_dp.y=CTA.ground+6.5;_dp.addScaledVector(CTA.side,5);trackAt(START_S+25,CTA);_dl.copy(CTA.pos);_dl.y+=1.5;k=1.15}
  else if(G.state==='race'){
    if(SPEC.on&&SPEC.r&&racers.has(SPEC.r.login)){const f=SPEC.r;CAM.focus=f;trackAt(f.s,CTA);const fp=f.root.position,sfc=CTA.surface;
      const dist=SPEC.dist||(sfc==='air'?15:sfc==='water'?8.5:sfc==='rock'?12:11);const pitch=sfc==='water'?clamp(SPEC.pitch,-.3,.35):SPEC.pitch;
      _v.set(-CTA.tan.x,0,-CTA.tan.z).normalize().applyAxisAngle(UP,SPEC.yaw);
      _dp.copy(fp).addScaledVector(_v,dist*Math.cos(pitch));_dp.y=fp.y+1.5+dist*Math.sin(pitch);_dl.copy(fp);_dl.y+=1.5;k=4.5;
    }else{
    const spot=G.spot&&G.spot.t>0&&!G.spot.r.finished&&racers.has(G.spot.r.login)?G.spot.r:null;
    const f=spot||G.rank.find(r=>!r.finished)||G.rank[0];if(!f)return;
    if(f!==CAM.focus){CAM.focus=f}
    CAM.shotT-=dt;if(CAM.shotT<=0){CAM.shot=spot?'chase':pick(SHOTS);CAM.shotT=rand(6,10)}
    trackAt(f.s,CTA);const air=CTA.surface==='air',fp=f.root.position;const shot=spot?'chase':CAM.shot;
    const sfc=CTA.surface;
    if(sfc==='rock'){_v.set(CTA.tan.x,0,CTA.tan.z).normalize();_dp.copy(fp).addScaledVector(_v,-11.5).addScaledVector(CTA.side,Math.sin(t*.3)*4.5);_dp.y=fp.y+1.2;_dl.copy(fp);_dl.y+=3.4;k=2.4}
    else if(sfc==='water'&&!((f.wade||0)>.5)){if(shot==='front'){_dp.copy(fp).addScaledVector(CTA.tan,8);_dp.y=fp.y+2.1;_dl.copy(fp).addScaledVector(CTA.tan,-4);_dl.y+=1.5;k=2.6}
      else{_dp.copy(fp).addScaledVector(CTA.tan,-9.5).addScaledVector(CTA.side,Math.sin(t*.4)*1.1);_dp.y=fp.y+2.3;_dl.copy(fp).addScaledVector(CTA.tan,8);_dl.y+=1.4;k=3}}
    else if(shot==='front'){_dp.copy(fp).addScaledVector(CTA.tan,13);_dp.y=fp.y+(air?3:2.6);_dp.addScaledVector(CTA.side,3.5);_dl.copy(fp).addScaledVector(CTA.tan,-6);_dl.y+=1.4;k=2.6}
    else if(shot==='low'){_dp.copy(fp).addScaledVector(CTA.tan,-7.5).addScaledVector(CTA.side,4.2);_dp.y=fp.y+1.1;_dl.copy(fp).addScaledVector(CTA.tan,10);_dl.y+=1.8;k=3.4}
    else if(shot==='drone'){_dp.copy(fp).addScaledVector(CTA.tan,-18).addScaledVector(CTA.side,10);_dp.y=fp.y+16;_dl.copy(fp).addScaledVector(CTA.tan,6);k=1.8}
    else if(shot==='side'){_dp.copy(fp).addScaledVector(CTA.side,12).addScaledVector(CTA.tan,2);_dp.y=fp.y+2.6;_dl.copy(fp).addScaledVector(CTA.tan,4);_dl.y+=1.2;k=2.8}
    else{const pq=CTA.mod==='paraquedas',open=pq&&CTA.lu>.4;const back=open?15:air?14:10.5,h=open?2.2:air?4.2:4.4;_dp.copy(fp).addScaledVector(CTA.tan,-back);_dp.y=fp.y+h+Math.max(0,-CTA.tan.y)*back*.3;_dp.addScaledVector(CTA.side,Math.sin(t*.21)*4);_dl.copy(fp).addScaledVector(CTA.tan,9);_dl.y+=open?5.5:1.6;k=3.2;
      rollT=air?clamp(f.m.bank.rotation.z*.35,-.25,.25):0}
    const spd=clamp(f.v/40,0,1.2);CAM.shake=Math.max(CAM.shake,spd*.06);
    }
  }else{CAM.orbit+=dt*.25;trackAt(W.FIN-26,CTA);_dp.copy(CTA.pos).addScaledVector(CTA.side,Math.sin(CAM.orbit)*6);_dp.y=CTA.ground+7;trackAt(W.FIN+8,CTA);_dl.copy(CTA.pos);_dl.y=CTA.ground+3;k=1.4}
  const a=1-Math.exp(-k*dt);CAM.pos.lerp(_dp,a);CAM.look.lerp(_dl,a);
  const th=terrainH(CAM.pos.x,CAM.pos.z)+1.6;if(CAM.pos.y<th)CAM.pos.y=th;
  camera.position.copy(CAM.pos);
  if(CAM.shake>0){CAM.shake=Math.max(0,CAM.shake-dt*.8);camera.position.x+=(Math.sin(t*37)+Math.sin(t*61))*CAM.shake*.3;camera.position.y+=(Math.sin(t*43)+Math.sin(t*71))*CAM.shake*.3}
  camera.lookAt(CAM.look);CAM.roll=lerp(CAM.roll,rollT,1-Math.exp(-dt*2));camera.rotateZ(CAM.roll);
  const boost=G.state==='race'&&CAM.focus&&CAM.focus.fx.boost>0;const fovT=boost?72:(G.state==='race'?62:55);camera.fov=lerp(camera.fov,fovT,1-Math.exp(-dt*3));camera.updateProjectionMatrix();
  if(post.grade)post.grade.uniforms.uBoost.value=lerp(post.grade.uniforms.uBoost.value,boost?1:(G.state==='race'&&CAM.focus&&MODS[CAM.focus.mod||'bike'].surface==='air'?.35:0),1-Math.exp(-dt*4));
}

