// ======================================================================
// WORLD
// ======================================================================
let W=null;
function disposeObj(o){o.traverse(c=>{if(c.geometry)c.geometry.dispose();if(c.material){(Array.isArray(c.material)?c.material:[c.material]).forEach(m=>{if(m.map&&m.map!==ATLAS&&!Object.values(TEXU).some(u=>u.value===m.map))m.map.dispose();m.dispose()})}})}
let _ni=0,_nd=0;
function nearest(x,z){const S=W.S,n=S.length;let best=1e18,bi=0;
  for(let i=0;i<n;i+=8){const p=S[i].p,dx=p.x-x,dz=p.z-z,d=dx*dx+dz*dz;if(d<best){best=d;bi=i}}
  const a=Math.max(0,bi-8),b=Math.min(n-1,bi+8);for(let i=a;i<=b;i++){const p=S[i].p,dx=p.x-x,dz=p.z-z,d=dx*dx+dz*dz;if(d<best){best=d;bi=i}}
  _ni=bi;_nd=Math.sqrt(best)}
function baseZ(z){const B=W.zb;const f=clamp((z+1300)/10,0,B.length-1.001);const i=f|0;return lerp(B[i],B[i+1],f-i)}
function terrainH(x,z){
  nearest(x,z);const s=W.S[_ni],d=_nd,air=s.surface==='air',wat=s.surface==='water'||s.surface==='mar';const Wd=air?26:wat?11+58*smooth(0,.06,s.lu)*(s.last?(1-smooth(.88,.97,s.lu)):1):s.surface==='pista'?22:s.surface==='asfalto'?8:s.surface==='rio'?15:11;
  const nz=fbm(W.n1,x*.0032,z*.0032,5);
  const wx=x+nz*110,wz=z+fbm(W.n2,x*.003+7,z*.003,3)*110;
  const rg=ridged(W.n2,wx*.0019,wz*.0019,5);
  if(s.surface==='rio'){const g2=lerp(s.p.y,baseZ(z),smooth(90,300,d));let h2=lerp(s.ground,s.p.y+1.3,smooth(12,19.5,d));h2=lerp(h2,g2+1.3,smooth(40,300,d))+smooth(45,120,d)*(26+rg*170+nz*40)+Math.max(0,d-130)*.2+fbm(W.n1,x*.045,z*.045,3)*1.4*smooth(20,30,d);return h2}
  const t=smooth(Wd,Wd+(air?34:wat?60:72),d);
  const g=lerp(s.ground,baseZ(z),smooth(70,280,d));
  let h=g+t*(26+rg*210+nz*40)+Math.max(0,d-Wd-90)*.22;
  h+=fbm(W.n1,x*.045,z*.045,3)*1.8*smooth(Wd-3,Wd+8,d);
  if(s.surface==='asfalto'){const e=smooth(0,.05,s.lu)*(1-smooth(.95,1,s.lu)),lat=(x-s.p.x)*s.sd.x+(z-s.p.z)*s.sd.z,up=lat*(s.seg%2?1:-1)>0,dd=Math.max(0,d-7.6);let hs;
    if(up)hs=s.ground+smooth(0,26,dd)*(16+rg*120+nz*30)+dd*.62+fbm(W.n1,x*.07,z*.07,3)*2.4*smooth(0,5,dd);
    else{const drop=Math.min(48,dd*.85+dd*dd*.004);hs=lerp(s.ground-.25-drop+fbm(W.n1,x*.05,z*.05,3)*2.6*smooth(0,6,dd),g+(26+rg*210+nz*40)*.55,smooth(70,210,d))}
    if(d<7.6)hs=s.ground;h=lerp(h,hs,e)}
  if(s.surface==='rock')h-=9*(1-smooth(12,20,d));
  if(wat){const deep=smooth(.06,.2,s.lu)*(1-smooth(.82,.92,s.lu));h+=(ridged(W.n1,x*.028,z*.028,4)*7+fbm(W.n2,x*.09,z*.09,3)*1.6+Math.max(0,fbm(W.n1,x*.012+3,z*.012,3))*14*smooth(20,45,d))*smooth(7,16,d)*deep}
  if(W.water&&W.water.last){const E=W.S[W.S.length-1];const hl=Math.hypot(E.t.x,E.t.z)||1;const ah=((x-E.p.x)*E.t.x+(z-E.p.z)*E.t.z)/hl;if(ah>-25)h=lerp(h,W.water.level-28+fbm(W.n1,x*.01,z*.01,2)*6,smooth(-25,170,ah))}
  return h;
}
// heightfield grid lookups
function gridH(x,z){const G=W.grid;const fx=clamp((x-G.ox)/G.cell,0,G.N-1.001),fz=clamp((z-G.oz)/G.cell,0,G.N-1.001);const i=fx|0,j=fz|0,tx=fx-i,tz=fz-j,N=G.N,H=G.H;
  const a=H[j*N+i],b=H[j*N+i+1],c=H[(j+1)*N+i],d=H[(j+1)*N+i+1];return a+(b-a)*tx+(c-a)*tz+(a-b-c+d)*tx*tz}

function buildWorld(def,seed){
  if(W){scene.remove(W.group);disposeObj(W.group)}
  const rng=mulberry(seed);
  const group=new THREE.Group();scene.add(group);
  W={group,def,n1:makeNoise(rng),n2:makeNoise(rng),chunks:[],bars:[],landS:null,buoys:[],heli:null,plane:null};
  // ---- track
  const ctrl=[];let x=0;const N=18;
  for(let i=0;i<=N;i++){const z=-880+i*(1760/N);if(i>1){x+=(rng()-.5)*190;x=clamp(x,-270,270)}ctrl.push(new V3(x,0,z))}
  const curve=new THREE.CatmullRomCurve3(ctrl,false,'centripetal');
  const Lc=curve.getLength(),n=Math.floor(Lc/DS),pts=curve.getSpacedPoints(n);
  let acc=0;const bounds=def.segs.map(([m,f])=>{const a=acc;acc+=f;return{mod:m,a,b:acc}});bounds[bounds.length-1].b=1;
  const S=[];let y=440,shx=0,shz=0;
  for(let i=0;i<=n;i++){
    const u=i/n;let si=bounds.findIndex(b=>u<b.b);if(si<0)si=bounds.length-1;
    const B=bounds[si],M=MODS[B.mod],lu=(u-B.a)/(B.b-B.a);
    let px=pts[i].x-shx,pz=pts[i].z-shz;
    if(B.mod==='escalada'&&i>0){const dx=pts[i].x-pts[i-1].x,dz=pts[i].z-pts[i-1].z,dl=Math.hypot(dx,dz)||1,pv=S[i-1].p;px=pv.x+dx/dl*.45;pz=pv.z+dz/dl*.45;shx=pts[i].x-px;shz=pts[i].z-pz}
    if(i>0){if(B.mod==='escalada')y+=1.95;else if(B.mod==='paraquedas')y-=(lu<.4?1.1:.22)*DS;else{let sl=M.slope;if(M.surface==='snow'||M.surface==='dirt')sl*=1+.65*Math.sin(i*.045+si*2);y-=sl*DS}}
    let off=0,yy=y;
    if(B.mod==='paraquedas')off=0;
    else if(M.surface==='air')off=-78*smooth(0,.05,lu)*(1-smooth(.7,1,lu));
    else if(B.mod==='bike')yy+=Math.sin(i*DS*.075)*1.6*smooth(0,.06,lu)*(1-smooth(.94,1,lu));
    else if(B.mod==='nado'){const pw=si>0&&bounds[si-1].mod==='windsurf';const dive=smooth(.05,.16,lu)*(1-smooth(.76,.86,lu));yy=y-9*dive;off=-(7+2*dive)*(pw?1:smooth(0,.04,lu))*(1-smooth(.88,.96,lu))}
    else if(B.mod==='remo')off=-4.5*smooth(0,.03,lu)*(1-smooth(.97,1,lu));
    else if(B.mod==='skate'){const e=smooth(0,.12,lu)*(1-smooth(.88,1,lu));px+=Math.sin(i*DS/170*Math.PI*2)*26*e}
    else if(B.mod==='windsurf'){const nx=bounds[si+1]&&bounds[si+1].mod==='nado';off=-16*smooth(0,.06,lu)*(nx?1:(1-smooth(.93,1,lu)))}
    S.push({p:new V3(px,yy,pz),s:i*DS,seg:si,mod:B.mod,surface:M.surface,lu,ground:yy+off,last:si===bounds.length-1,t:new V3(),sd:new V3()});
  }
  bounds.forEach(B=>{if(B.mod!=='paraquedas')return;const i0=Math.max(0,Math.round(B.a*n)),i1=Math.min(n,Math.round(B.b*n));const yEnd=S[i1].p.y;for(let i=i0;i<=i1;i++){const q=S[i];q.ground=lerp(lerp(q.p.y,yEnd,smooth(0,.035,q.lu)),q.p.y,smooth(.9,.995,q.lu))}});
  for(let i=0;i<S.length;i++){const a=S[Math.max(0,i-1)].p,b=S[Math.min(S.length-1,i+1)].p;S[i].t.subVectors(b,a).normalize();S[i].sd.set(-S[i].t.z,0,S[i].t.x).normalize()}
  W.S=S;W.L=(S.length-1)*DS;W.bounds=bounds;
  const wIdx=bounds.map((b,k)=>(b.mod==='nado'||b.mod==='windsurf')?k:-1).filter(k=>k>=0);W.water=null;
  if(wIdx.length){const a0=wIdx[0],b0=wIdx[wIdx.length-1];const i0=Math.round(bounds[a0].a*n),i1=Math.min(n,Math.round(bounds[b0].b*n));W.water={level:S[i0].p.y-.6,i0,i1,last:b0===bounds.length-1}}
  W.FIN=W.L-(W.water&&W.water.last?12:40);
  FOGU.uWater.value.set(W.water?W.water.level:0,W.water?1:0);
  const zb=new Array(261).fill(null);
  for(const s of S){const k=clamp(Math.round((s.p.z+1300)/10),0,260);zb[k]=zb[k]==null?s.ground:Math.min(zb[k],s.ground)}
  const first=zb.findIndex(v=>v!=null),last=260-[...zb].reverse().findIndex(v=>v!=null);
  for(let k=0;k<first;k++)zb[k]=zb[first]+(first-k)*1.5;
  for(let k=last+1;k<=260;k++)zb[k]=zb[last];
  for(let k=first;k<=last;k++)if(zb[k]==null)zb[k]=zb[k-1];
  for(let pass=0;pass<6;pass++)for(let k=1;k<260;k++)zb[k]=(zb[k-1]+zb[k]*2+zb[k+1])/4;
  W.zb=zb;
  let minG=1e9;for(const s of S)minG=Math.min(minG,s.ground);
  applySky(def.sky,minG-30);
  const ns=S.length,wS=new Float32Array(ns),wD=new Float32Array(ns),wA=new Float32Array(ns);
  for(let i=0;i<ns;i++){let a=0,b=0,c=0,k=0;for(let j=Math.max(0,i-40);j<=Math.min(ns-1,i+40);j+=4){const sf=S[j].surface;if(sf==='snow')a++;else if(sf==='dirt'||sf==='pista'||sf==='asfalto'||sf==='rio'||S[j].mod==='paraquedas')b++;else c++;k++}wS[i]=a/k;wD[i]=b/k;wA[i]=c/k}
  W.wS=wS;W.wD=wD;W.wA=wA;
  // ---- terrain grid
  const SIZE=2600,SEG=QL.seg,NN=SEG+1,cell=SIZE/SEG;
  const tg=new THREE.PlaneGeometry(SIZE,SIZE,SEG,SEG);tg.rotateX(-Math.PI/2);
  const pos=tg.attributes.position,cnt=pos.count,bi=new Int32Array(cnt),bd=new Float32Array(cnt),H=new Float32Array(cnt);
  for(let v=0;v<cnt;v++){const px=pos.getX(v),pz=pos.getZ(v);const h=terrainH(px,pz);pos.setY(v,h);H[v]=h;bi[v]=_ni;bd[v]=_nd}
  W.grid={ox:-SIZE/2,oz:-SIZE/2,cell,N:NN,H};
  tg.computeVertexNormals();
  const nrm=tg.attributes.normal;
  const aBiome=new Float32Array(cnt*3),aExtra=new Float32Array(cnt*3);
  // baked sun visibility + ambient occlusion + snow caps
  const sd=SUN_DIR,hl=Math.hypot(sd.x,sd.z)||1e-3,tanE=sd.y/hl;
  const hfData=new Float32Array(cnt*4);
  const dirs=[];for(let k=0;k<8;k++){const a=k/8*Math.PI*2;dirs.push([Math.cos(a),Math.sin(a)])}
  for(let v=0;v<cnt;v++){
    const px=pos.getX(v),py=H[v],pz=pos.getZ(v);
    // sun march
    let occ=0,step=cell*.9,dist=step;
    for(let k=0;k<26&&dist<900;k++){const sx=px+sd.x/hl*dist,sz=pz+sd.z/hl*dist;const rayH=py+tanE*dist+1.2;const th=gridH(sx,sz);if(th>rayH){occ=Math.max(occ,clamp((th-rayH)/(dist*.08+2),0,1))}dist+=step;step*=1.16}
    const sunVis=1-occ;
    // AO
    let ao=0;for(const[dx,dz]of dirs){let m=0;for(const r of[5,14,34]){const h2=gridH(px+dx*r,pz+dz*r);m=Math.max(m,(h2-py)/r)}ao+=clamp(m,0,1.2)}
    ao=clamp(1-ao/8*.75,.25,1);
    const i=bi[v],s=S[i],hw=py-s.ground,ny=nrm.getY(v);
    const nn=fbm(W.n2,px*.01,pz*.01,2);
    const cap=smooth(118,165,hw+nn*35)*(1-wA[i]);
    aBiome[v*3]=wS[i];aBiome[v*3+1]=wD[i];aBiome[v*3+2]=wA[i];
    aExtra[v*3]=sunVis;aExtra[v*3+1]=ao;aExtra[v*3+2]=cap;
    // grass density
    const flat=smooth(.78,.9,ny);const offTrack=smooth(12,15,bd[v]);
    hfData[v*4+2]=W.water&&py<W.water.level-2.5?smooth(.66,.85,ny)*smooth(-.3,.15,fbm(W.n2,px*.035,pz*.035,2)):0;
    hfData[v*4]=py;hfData[v*4+1]=wD[i]*flat*offTrack*(1-cap)*smooth(.2,.5,ao)*(W.water&&py<W.water.level+.5?0:1);hfData[v*4+3]=1;
  }
  tg.setAttribute('aBiome',new THREE.BufferAttribute(aBiome,3));tg.setAttribute('aExtra',new THREE.BufferAttribute(aExtra,3));
  const terrain=new THREE.Mesh(tg,terrainMaterial());terrain.receiveShadow=true;group.add(terrain);
  const hfTex=new THREE.DataTexture(hfData,NN,NN,THREE.RGBAFormat,THREE.FloatType);hfTex.magFilter=hfTex.minFilter=THREE.NearestFilter;hfTex.needsUpdate=true;
  W.hfTex=hfTex;W.hfInfo=new THREE.Vector4(-SIZE/2,-SIZE/2,cell,NN);
  // far mountains ring
  farRing(rng);
  // ---- track surfaces
  const ribbon=(i0,i1,half,yo,mat,kind,useP)=>{
    const P=[],R=[],SD=[],I=[];
    for(let i=i0;i<=i1;i++){const s=S[i];for(const k of[-1,1]){P.push(s.p.x+s.sd.x*half*k,(useP?s.p.y:s.ground)+yo,s.p.z+s.sd.z*half*k);R.push(k<0?0:1,s.s);SD.push(s.sd.x,0,s.sd.z)}}
    for(let k=0;k<i1-i0;k++){const a=k*2;I.push(a,a+1,a+2,a+1,a+3,a+2)}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aR',new THREE.Float32BufferAttribute(R,2));g.setAttribute('aSide',new THREE.Float32BufferAttribute(SD,3));g.setIndex(I);g.computeVertexNormals();
    const m=new THREE.Mesh(g,mat);m.receiveShadow=true;m.renderOrder=1;group.add(m);return m;
  };
  const mSnow=trackMaterial('snow'),mDirt=trackMaterial('dirt'),mWater=trackMaterial('water');
  bounds.forEach(B=>{
    const i0=Math.max(0,Math.round(B.a*n)),i1=Math.min(n,Math.round(B.b*n));const sf=MODS[B.mod].surface;
    if(sf==='air'&&B.mod!=='paraquedas'){let a=-1,b=-1;for(let i=i0;i<=i1;i++){if(S[i].ground<S[i].p.y-45){if(a<0)a=i;b=i}}if(a>=0&&b>a)ribbon(a,b,21,.7,mWater)}
    else if(sf==='snow'||sf==='dirt')ribbon(Math.max(0,i0-1),i1,10.5,.22,sf==='snow'?mSnow:mDirt);
    else if(sf==='rio'){ribbon(Math.max(0,i0-1),i1,18.5,.02,trackMaterial('river'),0,true);buildRiverBanks(i0,i1)}
    else if(sf==='mar')buildBuoys(i0,i1);
    else if(sf==='pista'){ribbon(Math.max(0,i0-1),i1,10.5,.22,trackMaterial('pista'));buildVara(i0,i1)}
    else if(sf==='asfalto'){ribbon(Math.max(0,i0-1),i1,6.9,.06,trackMaterial('asfalto'));buildRoad(i0,i1)}
    else if(B.mod==='escalada')climbWall(i0,i1);
    else if(B.mod==='nado')swimTube(i0,i1);
    if(B.mod==='paraquedas')buildLanding(i0,i1);
  });
  // ---- flags (slalom poles + flags)
  const poleG=new THREE.CylinderGeometry(.06,.06,3,6);poleG.translate(0,1.5,0);
  const flagG=new THREE.PlaneGeometry(1.1,.75,4,1);flagG.translate(.55,2.55,0);
  const fl=[];for(let i=0;i<S.length;i+=10){if(S[i].surface!=='snow'&&S[i].surface!=='dirt')continue;fl.push(i)}
  const poles=new THREE.InstancedMesh(poleG,new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:.35,metalness:.3}),fl.length*2);
  const flagM=new THREE.MeshStandardMaterial({roughness:.6,side:THREE.DoubleSide});
  flagM.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fw=max(position.x,0.);vec4 ip=instanceMatrix[3];transformed.z+=sin(uTime*7.+fw*4.+ip.x*.3)*.12*fw;').replace('#include <common>','#include <common>\nuniform float uTime;')};
  const flags=new THREE.InstancedMesh(flagG,flagM,fl.length*2);
  const mtx=new THREE.Matrix4(),qq=new THREE.Quaternion(),sc=new V3(1,1,1),pp=new V3(),cc=new THREE.Color();
  let fk=0;fl.forEach(i=>{const s=S[i];const ang=Math.atan2(s.t.x,s.t.z);for(const k of[-1,1]){pp.set(s.p.x+s.sd.x*9.8*k,s.ground,s.p.z+s.sd.z*9.8*k);qq.setFromAxisAngle(UP,ang+Math.PI/2+(k<0?Math.PI:0));mtx.compose(pp,qq,sc);poles.setMatrixAt(fk,mtx);flags.setMatrixAt(fk,mtx);flags.setColorAt(fk,cc.set(k<0?0xff3b2f:0x1e7bff));fk++}});
  poles.castShadow=flags.castShadow=true;group.add(poles,flags);
  // ---- rings
  const ringIdx=[];for(let i=0;i<S.length;i+=34){const s=S[i];if(s.surface!=='air'||s.mod==='paraquedas'||s.lu<.08||s.lu>.85)continue;ringIdx.push(i)}
  if(ringIdx.length){const rm=new THREE.MeshStandardMaterial({color:0xff7a1a,emissive:0xff6a10,emissiveIntensity:3.2,roughness:.3,metalness:.2});
    const rings=new THREE.InstancedMesh(new THREE.TorusGeometry(7,.36,10,64),rm,ringIdx.length);const o=new THREE.Object3D();
    ringIdx.forEach((i,k)=>{o.position.copy(S[i].p);o.lookAt(S[i].p.clone().add(S[i].t));o.updateMatrix();rings.setMatrixAt(k,o.matrix)});group.add(rings)}
  // ---- gates
  makeGate(START_S+2,'LARGADA','#ff4a1c','#ff2e63');
  makeGate(W.FIN,'CHEGADA',null,null,true);
  bounds.forEach((B,si)=>{if(si===0)return;const M=MODS[B.mod];makeGate(B.a*W.L+(M.surface==='air'?4:0),'TROCA ➜ '+M.label,M.surface==='air'?'#ff8a00':'#1e7bff',M.surface==='air'?'#ff2e63':'#29e3ff',false,M.surface==='air')});
  const fin=S[Math.round(W.FIN/DS)];
  const strip=new THREE.Mesh(new THREE.PlaneGeometry(21,2.4),new THREE.MeshStandardMaterial({map:cTex(256,32,(x)=>{for(let i=0;i<16;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#111':'#fafafa';x.fillRect(i*16,j*16,16,16)}}),roughness:.7,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}));
  strip.rotation.x=-Math.PI/2;const sg=new THREE.Group();sg.position.set(fin.p.x,fin.ground+.3,fin.p.z);sg.rotation.y=Math.atan2(fin.t.x,fin.t.z);sg.add(strip);group.add(sg);
  // ---- vegetation, rocks, grass, crowd
  scatter(rng);
  makeGrass();
  makeCrowd(rng);
  W.segFirst=bounds.map(()=>false);
  if(ocean){ocean.visible=!!W.water}
  buildSeaLife();
}

// ---------------- materials ----------------
function terrainMaterial(){
  const m=new THREE.MeshStandardMaterial({roughness:.9,metalness:0});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,FOGU,TEXU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 aBiome;attribute vec3 aExtra;varying vec3 vBiome;varying vec3 vExtra;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <fog_vertex>','#include <fog_vertex>\nvBiome=aBiome;vExtra=aExtra;vWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);');
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>',`#include <common>
uniform sampler2D tRock,tGrass,tSnow,tSand,tRockA,tGrassA,tSnowA,tSandA;varying vec3 vBiome;varying vec3 vExtra;varying vec3 vWP;varying vec3 vWN;
vec3 rr_tn(vec4 t,vec3 n){vec3 tn=t.xyz*2.-1.;vec3 r=vec3(tn.xy+n.xz,abs(tn.z)*n.y);return normalize(r.xzy);}`)
      .replace('#include <map_fragment>',`
vec3 n=normalize(vWN);vec3 p=vWP;float camD=length(cameraPosition-p);float dFade=1.-smoothstep(260.,1100.,camD);
vec3 bw=pow(abs(n),vec3(4.));bw/=dot(bw,vec3(1.));
float rs=.085;
vec4 rX=texture2D(tRock,p.zy*rs),rY=texture2D(tRock,p.xz*rs),rZ=texture2D(tRock,p.xy*rs);
vec3 nX=rX.xyz*2.-1.,nY=rY.xyz*2.-1.,nZ=rZ.xyz*2.-1.;
nX=vec3(nX.xy+n.zy,abs(nX.z)*n.x);nY=vec3(nY.xy+n.xz,abs(nY.z)*n.y);nZ=vec3(nZ.xy+n.xy,abs(nZ.z)*n.z);
vec3 rockN=normalize(nX.zyx*bw.x+nY.xzy*bw.y+nZ.xyz*bw.z);
float rockA=rX.a*bw.x+rY.a*bw.y+rZ.a*bw.z;
float rockA2=texture2D(tRock,p.xz*.019).a;rockA=mix(rockA,rockA*.6+rockA2*.4,.6);
vec4 gT=texture2D(tGrass,p.xz*.15),snT=texture2D(tSnow,p.xz*.055),saT=texture2D(tSand,p.xz*.07);
float mac=texture2D(tSnow,p.xz*.0021).a,mac2=texture2D(tGrass,p.xz*.0067).a,mac3=texture2D(tSand,p.xz*.004).a;
float slope=1.-n.y;
float rk=smoothstep(.27,.47,slope+(rockA-.5)*.35+(mac-.5)*.12);
vec3 aRX=texture2D(tRockA,p.zy*rs).rgb,aRY=texture2D(tRockA,p.xz*rs).rgb,aRZ=texture2D(tRockA,p.xy*rs).rgb;vec3 rockAlb=aRX*bw.x+aRY*bw.y+aRZ*bw.z;
{vec2 duv=bw.x>bw.z?p.zy:p.xy;duv=bw.y>max(bw.x,bw.z)?p.xz:duv;rockAlb=mix(rockAlb,texture2D(tRockA,duv*.021+.37).rgb,.42);}
vec2 rq=mat2(.8,-.6,.6,.8)*p.xz;
vec3 gA=mix(texture2D(tGrassA,p.xz*.13).rgb,texture2D(tGrassA,rq*.047).rgb,smoothstep(.3,.7,mac2));
vec3 snA=mix(texture2D(tSnowA,p.xz*.055).rgb,texture2D(tSnowA,rq*.021).rgb,.45);
vec3 saA=mix(texture2D(tSandA,p.xz*.07).rgb,texture2D(tSandA,rq*.027).rgb,smoothstep(.3,.7,mac));
vec3 rockC=rockAlb*mix(vec3(.92,.95,1.),vec3(1.08,1.,.9),mac3)*1.15;
vec3 grassC=gA*mix(vec3(1.),vec3(1.3,1.12,.62),smoothstep(.45,.8,mac2)*.75)*1.1;
grassC=mix(grassC,saA*vec3(.62,.52,.42),smoothstep(.66,.82,mac)*.8);
vec3 snowC=snA*1.02;
float snowOnRock=smoothstep(.62,.38,slope+(rockA-.5)*.55);
float strata=sin(p.y*.21+mac*7.+rockA*1.6);
vec3 canC=rockAlb*mix(vec3(1.35,.72,.46),vec3(1.5,.98,.62),.5+.5*strata);
vec3 sandC=saA*1.05;
float cap=vExtra.z;float cslope=smoothstep(.12,.3,slope);
float wRock=vBiome.x*rk*(1.-snowOnRock*.45)+vBiome.y*rk*(1.-cap*snowOnRock*.6);
float wSnow=vBiome.x*(1.-rk*(1.-snowOnRock*.45))+vBiome.y*cap*(1.-rk*(1.-snowOnRock*.6));
float wGrass=vBiome.y*(1.-cap)*(1.-rk);
float wCan=vBiome.z*cslope,wSand=vBiome.z*(1.-cslope);
vec3 alb=rockC*wRock+snowC*wSnow+grassC*wGrass+canC*wCan+sandC*wSand;
if(uWater.y>.5&&p.y<uWater.x-1.){float uw=smoothstep(uWater.x-1.,uWater.x-4.,p.y);float up=smoothstep(.5,.9,n.y);
 vec3 mRock=rockAlb*vec3(.62,.78,.74);vec3 moss=mix(vec3(.08,.2,.12),vec3(.2,.33,.17),gT.a)*(.7+.5*mac2);vec3 sand=vec3(.5,.46,.37)*(.75+.4*saT.a);
 vec3 uwc=mix(mRock,moss,up*smoothstep(.35,.65,rockA*.7+mac2*.6));uwc=mix(uwc,sand,up*smoothstep(.62,.8,mac)*.85);
 alb=mix(alb,uwc,uw);wRock=mix(wRock,1.-up*.6,uw);wSnow*=1.-uw;wGrass*=1.-uw;}
alb*=mix(.92,1.08,mac2);
diffuseColor.rgb*=alb;
vec3 tN=normalize(rockN*(wRock+wCan)*1.15+rr_tn(gT,n)*wGrass+rr_tn(snT,n)*wSnow*.8+rr_tn(saT,n)*wSand);
tN=normalize(mix(n,tN,dFade));
float tRough=(wRock+wCan)*.82+wGrass*.93+wSnow*.5+wSand*.9;
float tSunVis=vExtra.x*rr_cloudShadow(p);float tAO=vExtra.y;

vec3 V=normalize(cameraPosition-p);
vec3 gc=floor(p*7.);vec3 hh=rr_hash3(gc);vec3 fac=normalize(tN+(hh-.5)*1.6);
float glint=pow(max(dot(reflect(-V,fac),uSunDir),0.),220.)*step(.82,hh.z)*(1.-smoothstep(25.,90.,camD));
vec3 tSpark=uSunCol*glint*wSnow*tSunVis*14.;
`)
      .replace('#include <roughnessmap_fragment>','float roughnessFactor=tRough;')
      .replace('#include <normal_fragment_maps>','normal=normalize((viewMatrix*vec4(tN,0.)).xyz);')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=tSpark;')
      .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=tSunVis;'))
      .replace('#include <aomap_fragment>','#include <aomap_fragment>\nreflectedLight.indirectDiffuse*=tAO;reflectedLight.indirectSpecular*=tAO*tAO;');
  };
  m.customProgramCacheKey=()=>'terrain';
  return m;
}
function trackMaterial(kind){
  const river=kind==='river',water=kind==='water'||river;
  const m=new THREE.MeshStandardMaterial({roughness:water?.05:.7,metalness:0,transparent:!river,depthWrite:water,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4,side:THREE.DoubleSide,color:water?0x0d4d5c:0xffffff,envMapIntensity:water?1.4:1});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,FOGU,TEXU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec2 aR;attribute vec3 aSide;varying vec2 vR;varying vec3 vSide;varying vec3 vWP;')
      .replace('#include <fog_vertex>','#include <fog_vertex>\nvR=aR;vSide=aSide;vWP=(modelMatrix*vec4(transformed,1.)).xyz;');
    let body;
    if(kind==='snow')body=`
float ex=vR.x;float edge=smoothstep(0.,.13,ex)*smoothstep(1.,.87,ex);
vec4 snT=texture2D(tSnow,vWP.xz*.055);
float cord=sin(ex*230.);float trk=smoothstep(.72,.95,rr_vnoise(vec2(ex*36.,vR.y*.08)))*.6;
vec3 alb=texture2D(tSnowA,vWP.xz*.055).rgb*vec3(.97,.98,1.)*(1.-trk*.12);
diffuseColor.rgb*=alb;diffuseColor.a*=edge;
vec3 tN=normalize(vec3(0.,1.,0.)+vSide*cord*.11+(snT.xyz*2.-1.).xzy*vec3(.25,0.,.25));
float tRough=.55+trk*.2;vec3 tE=vec3(0.);`;
    else if(kind==='dirt')body=`
float ex=vR.x;float edge=smoothstep(0.,.16,ex)*smoothstep(1.,.84,ex);
vec4 saT=texture2D(tSand,vWP.xz*.09);vec4 rT=texture2D(tRock,vWP.xz*.12);
float rut=exp(-pow((ex-.36)*16.,2.))+exp(-pow((ex-.64)*16.,2.));
vec3 alb=texture2D(tSandA,vWP.xz*.09).rgb*vec3(.66,.55,.44)*(.8+.3*rT.a)*(1.-rut*.25);
alb=mix(alb,vec3(.12,.17,.06),(1.-smoothstep(.0,.22,ex)*smoothstep(1.,.78,ex))*.6);
diffuseColor.rgb*=alb;diffuseColor.a*=edge;
vec3 tN=normalize(vec3(0.,1.,0.)+(mix(saT.xyz,rT.xyz,.5)*2.-1.).xzy*vec3(.8,0.,.8)*(1.-rut*.6));
float tRough=.92-rut*.25;vec3 tE=vec3(0.);`;
    else if(kind==='river')body=`
float ex=vR.x;vec2 uvA=vec2(ex*37.,vR.y)*.055+vec2(0.,-uTime*.3);vec2 uvB=vec2(ex*37.,vR.y)*.14+vec2(uTime*.03,-uTime*.52);
vec3 na=texture2D(tWaves,uvA).xyz*2.-1.,nb=texture2D(tWaves,uvB).xyz*2.-1.;
vec3 tN=normalize(vec3(0.,1.,0.)+vec3(na.x+nb.x*.6,0.,na.y+nb.y*.6)*.3);
float sh=min(ex,1.-ex);float bank=1.-smoothstep(.0,.09,sh);
diffuseColor.rgb=mix(vec3(.016,.075,.07),vec3(.06,.13,.09),bank);
float fo=smoothstep(.58,.92,rr_vnoise(vec2(ex*70.,vR.y*.35-uTime*1.4)))*bank*.55+(1.-smoothstep(.0,.012,sh))*.5;
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.78,.83,.8),clamp(fo,0.,1.));diffuseColor.a=1.;
float tRough=mix(.045,.5,clamp(fo,0.,1.));vec3 tE=vec3(0.);`;
    else if(kind==='pista')body=`
float ex=vR.x;float edge=smoothstep(0.,.025,ex)*smoothstep(1.,.975,ex);
vec4 saT=texture2D(tSand,vWP.xz*.3);float ln=step(abs(fract(ex*6.+.5)-.5),.014);
vec3 alb=vec3(.5,.11,.06)*(.78+.4*saT.a);alb=mix(alb,vec3(.92),ln);
diffuseColor.rgb*=alb;diffuseColor.a*=edge;
vec3 tN=normalize(vec3(0.,1.,0.)+(saT.xyz*2.-1.).xzy*vec3(.3,0.,.3));
float tRough=mix(.78,.5,ln);vec3 tE=vec3(0.);`;
    else if(kind==='asfalto')body=`
float ex=vR.x;float edge=smoothstep(0.,.01,ex)*smoothstep(1.,.99,ex);
vec4 saT=texture2D(tSand,vWP.xz*.42);vec4 rkT=texture2D(tRock,vWP.xz*.6);
float n1=rr_vnoise(vWP.xz*.12),n2=rr_vnoise(vWP.xz*2.3),n3=rr_vnoise(vWP.xz*.035);
vec3 alb=vec3(.078,.08,.086)*(.72+.42*saT.a+.28*n1)+vec3(.1)*smoothstep(.78,.9,n2);
float patchy=smoothstep(.55,.6,rr_vnoise(vec2(floor(vR.y/9.),floor(ex*3.))*.73+vec2(3.1,7.7)));alb*=mix(1.,.72,patchy*.7);
float tm=smoothstep(.07,.0,abs(ex-.5-.2*sin(vR.y*.019)))*(.45+.55*rr_vnoise(vec2(ex*50.,vR.y*.04)));alb*=1.-.4*tm*smoothstep(.4,.7,n3);
float wl=step(abs(ex-.055),.007)+step(abs(ex-.945),.007);
float cl=(step(abs(ex-.49),.0045)+step(abs(ex-.51),.0045))*step(fract(vR.y/12.),.56);
float pw=clamp(wl,0.,1.),pc=clamp(cl,0.,1.);float wear=.65+.35*smoothstep(.2,.6,rr_vnoise(vWP.xz*1.3));
alb=mix(alb,vec3(.86,.86,.82)*wear,pw);alb=mix(alb,vec3(.95,.66,.08)*wear,pc);
diffuseColor.rgb*=alb;diffuseColor.a*=edge;
vec3 tN=normalize(vec3(0.,1.,0.)+(saT.xyz*2.-1.).xzy*vec3(.22,0.,.22)+(rkT.xyz*2.-1.).xzy*vec3(.12,0.,.12));
float tRough=mix(.86,.62,max(pw,pc))-tm*.12;vec3 tE=vec3(0.);`;
    else body=`
float ex=vR.x;float edge=smoothstep(0.,.08,ex)*smoothstep(1.,.92,ex);
vec2 q=vec2(vWP.x,vWP.z);vec2 fl=vec2(0.,uTime*2.2);
vec4 a=texture2D(tSnow,(q+vSide.xz*0.)*.05-fl*.02);vec4 b=texture2D(tSand,q*.08+vec2(uTime*.05,-uTime*.09));
vec3 tN=normalize(vec3(0.,1.,0.)+((a.xyz+b.xyz)-1.).xzy*vec3(.35,0.,.35));
float foam=smoothstep(.55,.95,rr_vnoise(vec2(ex*30.,vR.y*.15-uTime*3.)))*(1.-smoothstep(.0,.25,min(ex,1.-ex)))+ (1.-smoothstep(.0,.06,min(ex,1.-ex)))*.8;
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.85,.92,.95),clamp(foam,0.,1.));diffuseColor.a=mix(.82,1.,foam)*edge;
float tRough=mix(.04,.6,clamp(foam,0.,1.));vec3 tE=vec3(0.);`;
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRock,tGrass,tSnow,tSand,tRockA,tGrassA,tSnowA,tSandA,tWaves;varying vec2 vR;varying vec3 vSide;varying vec3 vWP;')
      .replace('#include <map_fragment>',body)
      .replace('#include <roughnessmap_fragment>','float roughnessFactor=tRough;')
      .replace('#include <normal_fragment_maps>','normal=normalize((viewMatrix*vec4(tN,0.)).xyz);')
      .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=rr_cloudShadow(vWP);'));
  };
  m.customProgramCacheKey=()=>'track_'+kind;
  return m;
}
function farRing(rng){
  const R0=1150,R1=4600,NR=46,NA=180,P=[],I=[],B=[],E=[];
  const ns=makeNoise(rng);
  for(let j=0;j<=NR;j++){const t=j/NR,r=lerp(R0,R1,Math.pow(t,1.35));for(let i=0;i<=NA;i++){const a=i/NA*Math.PI*2;const x=Math.cos(a)*r,z=Math.sin(a)*r;
    const base=baseZ(clamp(z,-1290,1290));const rgv=ridged(ns,x*.0007,z*.0007,5);
    let h=base-60+smooth(0,.12,t)*(220+rgv*900*smooth(.05,.4,t)+t*300);
    P.push(x,h,z);const hw=h-base;B.push(0,1,0);E.push(.9,1,smooth(260,520,hw+fbm(ns,x*.003,z*.003,2)*120))}}
  for(let j=0;j<NR;j++)for(let i=0;i<NA;i++){const a=j*(NA+1)+i,b=a+1,c=a+NA+1,d=c+1;I.push(a,c,b,b,c,d)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aBiome',new THREE.Float32BufferAttribute(B,3));g.setAttribute('aExtra',new THREE.Float32BufferAttribute(E,3));g.setIndex(I);g.computeVertexNormals();
  const m=new THREE.Mesh(g,terrainMaterial());W.group.add(m);
}

