function makeGate(s,text,c1,c2,checker,air){
  const S=W.S,i=clamp(Math.round(s/DS),0,S.length-1),p=S[i];
  const g=new THREE.Group();g.position.set(p.p.x,p.ground,p.p.z);g.rotation.y=Math.atan2(p.t.x,p.t.z);
  const R=air?13.5:11.2;
  const archM=new THREE.MeshPhysicalMaterial({map:archTex,roughness:.35,clearcoat:.6,sheen:.4});
  if(checker)archM.map=cTex(512,64,(x,w,h)=>{for(let i=0;i<16;i++)for(let j=0;j<2;j++){x.fillStyle=(i+j)%2?'#111':'#f5f5f5';x.fillRect(i*32,j*32,32,32)}});
  else archM.map=cTex(512,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?c1:c2;x.fillRect(i*64,0,64,h)}});
  archM.map.wrapS=THREE.RepeatWrapping;archM.map.repeat.set(4,1);
  const arch=new THREE.Mesh(new THREE.TorusGeometry(R,1.25,18,64,Math.PI),archM);arch.castShadow=true;g.add(arch);
  const baseM=new THREE.MeshStandardMaterial({color:0x22262f,roughness:.6});
  for(const k of[-1,1]){const b=new THREE.Mesh(new RoundedBoxGeometry(2.6,1,2.6,2,.25),baseM);b.position.set(R*k,.4,0);b.castShadow=true;g.add(b)}
  const bt=bannerTex(text,c1||'#000',c2||'#000',checker);
  const bm=new THREE.MeshStandardMaterial({map:bt,roughness:.6,emissive:0xffffff,emissiveMap:bt,emissiveIntensity:.35,side:THREE.DoubleSide});
  const pl=new THREE.Mesh(new THREE.PlaneGeometry(R*1.45,R*.18),bm);pl.position.set(0,R*.8,-.05);pl.rotation.y=Math.PI;g.add(pl);
  W.group.add(g);
}

// ---------------- vegetation ----------------
function cardGeo(build){const P=[],N=[],U=[],C=[],I=[];
  const quad=(a,b,c,d,ua,ub,uc,ud,na,nb,nc,nd,ca,cb,cc,cd)=>{const o=P.length/3;[a,b,c,d].forEach(v=>P.push(v.x,v.y,v.z));[ua,ub,uc,ud].forEach(u=>U.push(u[0],u[1]));[na,nb,nc,nd].forEach(v=>N.push(v.x,v.y,v.z));[ca,cb,cc,cd].forEach(c=>C.push(c,c,c));I.push(o,o+1,o+2,o,o+2,o+3)};
  const tube=(r0,r1,h,seg,y0,uv0,uv1)=>{const o=P.length/3;for(let j=0;j<=1;j++)for(let i=0;i<=seg;i++){const a=i/seg*Math.PI*2,r=j?r1:r0;P.push(Math.cos(a)*r,y0+h*j,Math.sin(a)*r);N.push(Math.cos(a),0,Math.sin(a));U.push(lerp(uv0[0],uv1[0],i/seg),lerp(uv0[1],uv1[1],j));C.push(1,1,1)}
    for(let i=0;i<seg;i++){const a=o+i,b=a+1,c=a+seg+1,d=c+1;I.push(a,c,b,b,c,d)}};
  build(quad,tube);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setIndex(I);g.computeBoundingSphere();return g}
function pineGeo(lod){const R=mulberry(lod?7:8);const r=(a,b)=>a+R()*(b-a);
  return cardGeo((quad,tube)=>{
    tube(.34,.05,12.2,lod?7:4,0,[0,0],[.5,.5]);
    const nW=lod?13:6;
    for(let w=0;w<nW;w++){const t=w/(nW-1),y=1.9+t*9.7,L=lerp(4.4,.85,Math.pow(t,.9))*r(.88,1.1),nb=lod?(t>.8?5:8):4;
      for(let b=0;b<nb;b++){const ang=b/nb*Math.PI*2+w*.9+r(-.3,.3),droop=lerp(.45,.15,t)+r(-.08,.08);
        const dir=new V3(Math.cos(ang)*Math.cos(droop),-Math.sin(droop),Math.sin(ang)*Math.cos(droop));
        const side=new V3(-Math.sin(ang),0,Math.cos(ang));const roll=r(-.35,.35);side.applyAxisAngle(dir,roll);
        const W2=L*.86;const o=new V3(0,y,0),tip=o.clone().addScaledVector(dir,L);
        const a=o.clone().addScaledVector(side,-W2*.5),b2=o.clone().addScaledVector(side,W2*.5),c=tip.clone().addScaledVector(side,W2*.5),d=tip.clone().addScaledVector(side,-W2*.5);
        const nrm=v=>new V3(v.x,(v.y-y)*.4+.75,v.z).normalize();
        const ci=.38+.3*t,co=.95;
        quad(a,b2,c,d,[0,.5],[0,1],[.5,1],[.5,.5],nrm(a),nrm(b2),nrm(c),nrm(d),ci,ci,co,co);
        if(lod){const up=new V3().crossVectors(dir,side).normalize();const W3=W2*.55;const a2=o.clone().addScaledVector(up,-W3*.5),b3=o.clone().addScaledVector(up,W3*.5),c2=tip.clone().addScaledVector(up,W3*.5),d2=tip.clone().addScaledVector(up,-W3*.5);
          quad(a2,b3,c2,d2,[0,.5],[0,1],[.5,1],[.5,.5],nrm(a2),nrm(b3),nrm(c2),nrm(d2),ci,ci,co,co)}}}
    for(let k=0;k<(lod?3:2);k++){const a=k/3*Math.PI;const sd=new V3(Math.cos(a),0,Math.sin(a));const h0=10.6,h1=13.4,w=.8;
      const p=[new V3(0,h0,0).addScaledVector(sd,-w),new V3(0,h0,0).addScaledVector(sd,w),new V3(0,h1,0).addScaledVector(sd,w*.2),new V3(0,h1,0).addScaledVector(sd,-w*.2)];
      quad(p[0],p[1],p[2],p[3],[0,.5],[0,1],[.5,1],[.5,.5],UP,UP,UP,UP,.8,.8,1,1)}
  })}
function broadGeo(lod){const R=mulberry(lod?17:18);const r=(a,b)=>a+R()*(b-a);
  return cardGeo((quad,tube)=>{
    tube(.3,.12,5.2,lod?6:4,0,[0,0],[.5,.5]);
    const ctr=new V3(0,6.4,0);const clusters=lod?7:3;
    for(let c=0;c<clusters;c++){const cp=new V3(r(-2.4,2.4),r(-1.5,2.2),r(-2.4,2.4)).add(ctr);const nCards=lod?7:6;
      for(let k=0;k<nCards;k++){const nrmv=new V3(r(-1,1),r(-.4,1),r(-1,1)).normalize();const t1=new V3().crossVectors(nrmv,Math.abs(nrmv.y)<.9?UP:new V3(1,0,0)).normalize();const t2=new V3().crossVectors(nrmv,t1);const s=r(1.8,2.8)*(lod?1:1.5);
        const cc=cp.clone().addScaledVector(nrmv,r(-.3,.6));const v=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([a,b])=>cc.clone().addScaledVector(t1,a*s).addScaledVector(t2,b*s));
        const nn=v.map(p=>p.clone().sub(ctr).multiplyScalar(.5).add(new V3(0,1.2,0)).normalize());const cl=v.map(p=>clamp(.45+p.distanceTo(ctr)*.16,.45,1));
        quad(v[0],v[1],v[2],v[3],[.5,.5],[1,.5],[1,1],[.5,1],nn[0],nn[1],nn[2],nn[3],cl[0],cl[1],cl[2],cl[3])}}
  })}
function bushGeo(){const R=mulberry(27);const r=(a,b)=>a+R()*(b-a);
  return cardGeo((quad)=>{for(let k=0;k<6;k++){const a=k/6*Math.PI+r(-.2,.2);const sd=new V3(Math.cos(a),0,Math.sin(a));const w=r(1.4,2),h=r(1.6,2.4);
    const p=[new V3(0,0,0).addScaledVector(sd,-w),new V3(0,0,0).addScaledVector(sd,w),new V3(0,h,0).addScaledVector(sd,w),new V3(0,h,0).addScaledVector(sd,-w)];
    const nn=p.map(v=>new V3(v.x,1.2,v.z).normalize());quad(p[0],p[1],p[2],p[3],[.5,0],[1,0],[1,.5],[.5,.5],nn[0],nn[1],nn[2],nn[3],.6,.6,1,1)}})}
function foliageMaterial(){
  const m=new THREE.MeshStandardMaterial({map:ATLAS,alphaTest:.5,alphaToCoverage:QL.msaa>0,vertexColors:true,side:THREE.DoubleSide,roughness:.82,metalness:0});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,FOGU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aSnow;uniform float uTime;varying float vSnow;varying float vUpY;varying vec3 vWP;')
      .replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
vec4 ip=instanceMatrix[3];
#else
vec4 ip=vec4(0.);
#endif
float hh=max(position.y-1.2,0.);float ph=ip.x*.05+ip.z*.07;
transformed.x+=(sin(uTime*1.3+ph)*.6+sin(uTime*3.1+ph*2.+position.y)*.25)*.0035*hh*hh;
transformed.z+=(cos(uTime*1.1+ph)*.5)*.0035*hh*hh;`)
      .replace('#include <fog_vertex>',`#include <fog_vertex>
vSnow=aSnow;vUpY=objectNormal.y;
#ifdef USE_INSTANCING
vWP=(modelMatrix*instanceMatrix*vec4(transformed,1.)).xyz;
#else
vWP=(modelMatrix*vec4(transformed,1.)).xyz;
#endif`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vSnow;varying float vUpY;varying vec3 vWP;')
      .replace('#include <map_fragment>',`#include <map_fragment>
{float ra=diffuseColor.a;vec2 tu=vMapUv*1024.;float mip=max(0.,.5*log2(max(dot(dFdx(tu),dFdx(tu)),dot(dFdy(tu),dFdy(tu)))));ra*=1.+mip*.32;
diffuseColor.a=clamp((ra-.42)/max(fwidth(ra),1e-4)+.5,0.,1.);}
float sn=vSnow*smoothstep(.45,.85,vUpY+(diffuseColor.g-.2)*.6)*step(vMapUv.y,.999);
diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.88,.92,1.)*.9,sn);`)
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);')
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
{vec3 vd=normalize(vWP-cameraPosition);float bl=pow(max(dot(vd,uSunDir),0.),3.);totalEmissiveRadiance+=diffuseColor.rgb*uSunCol*bl*.9*(1.-sn);}`);
  };
  m.customProgramCacheKey=()=>'foliage'+(QL.msaa>0);
  return m;
}
function rockMaterial(){
  const m=new THREE.MeshStandardMaterial({roughness:.85,metalness:0});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,FOGU,TEXU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec4 aCover;varying vec4 vCover;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <fog_vertex>',`#include <fog_vertex>
vCover=aCover;
#ifdef USE_INSTANCING
mat4 mm=modelMatrix*instanceMatrix;
#else
mat4 mm=modelMatrix;
#endif
vWP=(mm*vec4(transformed,1.)).xyz;vWN=normalize(mat3(mm)*objectNormal);`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D tRock,tGrass,tSnow,tSand,tRockA,tGrassA,tSnowA,tSandA;varying vec4 vCover;varying vec3 vWP;varying vec3 vWN;')
      .replace('#include <map_fragment>',`
vec3 n=normalize(vWN);vec3 p=vWP;vec3 bw=pow(abs(n),vec3(4.));bw/=dot(bw,vec3(1.));float rs=.22;
vec4 rX=texture2D(tRock,p.zy*rs),rY=texture2D(tRock,p.xz*rs),rZ=texture2D(tRock,p.xy*rs);
vec3 nX=rX.xyz*2.-1.,nY=rY.xyz*2.-1.,nZ=rZ.xyz*2.-1.;
nX=vec3(nX.xy+n.zy,abs(nX.z)*n.x);nY=vec3(nY.xy+n.xz,abs(nY.z)*n.y);nZ=vec3(nZ.xy+n.xy,abs(nZ.z)*n.z);
vec3 tN=normalize(nX.zyx*bw.x+nY.xzy*bw.y+nZ.xyz*bw.z);float ra=rX.a*bw.x+rY.a*bw.y+rZ.a*bw.z;
vec3 alb=diffuseColor.rgb*2.*(texture2D(tRockA,p.zy*rs).rgb*bw.x+texture2D(tRockA,p.xz*rs).rgb*bw.y+texture2D(tRockA,p.xy*rs).rgb*bw.z);
float cov=vCover.a*smoothstep(.35,.75,n.y+(ra-.5)*.6);
alb=mix(alb,vCover.rgb,cov);diffuseColor.rgb=alb;float tRough=mix(.82,.6,cov);`)
      .replace('#include <roughnessmap_fragment>','float roughnessFactor=tRough;')
      .replace('#include <normal_fragment_maps>','normal=normalize((viewMatrix*vec4(tN,0.)).xyz);');
  };
  m.customProgramCacheKey=()=>'rock';
  return m;
}
function rockGeo(seed,detail){const g=new THREE.IcosahedronGeometry(1,detail);const n=makeNoise(mulberry(seed));const p=g.attributes.position;
  for(let i=0;i<p.count;i++){const v=new V3(p.getX(i),p.getY(i),p.getZ(i));const d=1+fbm(n,v.x*1.3+v.y*.7,v.z*1.3-v.y*.5,4)*.38;v.multiplyScalar(d);if(v.y<-.35)v.y=-.35+(v.y+.35)*.25;p.setXYZ(i,v.x,v.y,v.z)}
  g.computeVertexNormals();return mergeGeometries([g])}

function scatter(rng){
  const S=W.S;
  const tries=Math.round(12000*QL.trees);
  const P=[],B=[],SH=[],R=[];
  for(let k=0;k<tries;k++){
    const i=Math.floor(rng()*S.length),s=S[i],side=rng()<.5?-1:1;
    const lat=(15+Math.pow(rng(),1.7)*440)*side;
    const x=s.p.x+s.sd.x*lat+s.t.x*(rng()-.5)*30,z=s.p.z+s.sd.z*lat+s.t.z*(rng()-.5)*30;
    if(Math.abs(x)>1280||Math.abs(z)>1280)continue;
    const h=gridH(x,z);nearest(x,z);const ss=W.S[_ni],d=_nd;if(d<(ss.surface==='air'?30:ss.surface==='pista'?30:ss.surface==='asfalto'?13:ss.surface==='rio'?32:14))continue;if(W.landS!=null&&ss.mod==='paraquedas'&&Math.abs(ss.s-W.landS)<80&&d<64)continue;if(d<48&&(ss.s<START_S+70||ss.s>W.FIN-70))continue;if((ss.surface==='water'||ss.surface==='rock'||ss.surface==='mar')&&d<75)continue;if(W.water&&h<W.water.level+1.2)continue;
    const h2=gridH(x+2,z),h3=gridH(x,z+2),slope=Math.hypot(h2-h,h3-h)/2;
    const sf=ss.surface,r=rng(),hw=h-ss.ground;
    if(sf==='air'){if(r<.35&&slope<.9)R.push([x,h,z,'canyon']);else if(r<.75&&slope<.55)SH.push([x,h,z]);continue}
    if(hw>150)continue;
    if(slope>.9){if(r<.25&&slope<1.3)R.push([x,h,z,sf]);continue}
    if(r<.07)R.push([x,h,z,sf]);
    else if(sf==='snow'||rng()<.6)P.push([x,h,z,sf==='snow'?rand(.55,1):rand(0,.15)*(hw>90?3:0)]);
    else B.push([x,h,z]);
  }
  // pebbles near track edges
  for(let k=0;k<Math.round(1400*QL.trees);k++){const i=Math.floor(rng()*S.length),s=S[i];if(s.surface!=='snow'&&s.surface!=='dirt')continue;const side=rng()<.5?-1:1,lat=side*rand(10.5,22);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat;R.push([x,gridH(x,z),z,s.surface,true])}
  // chunked LOD instancing
  const CH=320,chunks=new Map();
  const key=(x,z)=>Math.floor(x/CH)+','+Math.floor(z/CH);
  const add=(list,type)=>list.forEach(it=>{const k=key(it[0],it[2]);if(!chunks.has(k))chunks.set(k,{cx:(Math.floor(it[0]/CH)+.5)*CH,cz:(Math.floor(it[2]/CH)+.5)*CH,pine:[],broad:[],bush:[]});chunks.get(k)[type].push(it)});
  add(P,'pine');add(B,'broad');add(SH,'bush');
  const fm=foliageMaterial();
  const geos={pine:[pineGeo(1),pineGeo(0)],broad:[broadGeo(1),broadGeo(0)],bush:[bushGeo(),bushGeo()]};
  const m=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V3(),pp=new V3(),col=new THREE.Color();
  for(const ch of chunks.values()){
    const entry={cx:ch.cx,cz:ch.cz,hi:[],lo:[]};
    for(const type of['pine','broad','bush']){const list=ch[type];if(!list.length)continue;
      for(let l=0;l<2;l++){const im=new THREE.InstancedMesh(geos[type][l],fm,list.length);const snowA=new Float32Array(list.length);
        list.forEach((it,k)=>{const R2=mulberry(Math.floor(it[0]*13+it[2]*7));const s=type==='bush'?.5+R2()*.5:.75+R2()*.75;m.compose(pp.set(it[0],it[1]-.2,it[2]),q.setFromEuler(e.set((R2()-.5)*.08,R2()*6.3,(R2()-.5)*.08)),sc.set(s,s*(.85+R2()*.35),s));im.setMatrixAt(k,m);
          if(type==='pine')col.setRGB(.8+R2()*.35,.85+R2()*.3,.8+R2()*.25);else if(type==='broad'){const au=R2()<.18;col.setRGB(au?1.6:.85+R2()*.3,au?1.05:.9+R2()*.25,au?.5:.8)}else col.setRGB(1,1,1);
          im.setColorAt(k,col);snowA[k]=type==='pine'?it[3]:0});
        im.geometry=im.geometry.clone();im.geometry.setAttribute('aSnow',new THREE.InstancedBufferAttribute(snowA,1));
        im.computeBoundingSphere();im.castShadow=l===0;im.receiveShadow=l===0;W.group.add(im);(l?entry.lo:entry.hi).push(im)}}
    W.chunks.push(entry);
  }
  Object.values(geos).forEach(([a,b])=>{a.dispose();b.dispose()});
  // rocks
  if(R.length){const rm=rockMaterial();const gs=[rockGeo(3,3),rockGeo(5,2)];
    gs.forEach((g,gi)=>{const list=R.filter((_,k)=>k%2===gi);if(!list.length)return;const im=new THREE.InstancedMesh(g,rm,list.length);const cov=new Float32Array(list.length*4);
      list.forEach(([x,h,z,sf,peb],k)=>{const s=peb?rand(.25,.8):rand(.8,3.2);m.compose(pp.set(x,h-s*.25,z),q.setFromEuler(e.set(rand(-.3,.3),rand(0,6.3),rand(-.3,.3))),sc.set(s*rand(.9,1.6),s*rand(.6,1.1),s*rand(.9,1.5)));im.setMatrixAt(k,m);
        if(sf==='canyon')col.setRGB(.62,.36,.22);else col.setRGB(.5,.48,.45);im.setColorAt(k,col);
        const c=sf==='snow'?[.85,.9,1,.95]:sf==='canyon'?[.7,.55,.36,.5]:[.16,.26,.07,.65];cov.set(c,k*4)});
      g.setAttribute('aCover',new THREE.InstancedBufferAttribute(cov,4));im.castShadow=true;im.receiveShadow=true;W.group.add(im)})}
}
function updateLOD(){if(!W||!W.chunks)return;const cp=camera.position;for(const c of W.chunks){const d=Math.hypot(c.cx-cp.x,c.cz-cp.z);const near=d<300;c.hi.forEach(m=>m.visible=near);c.lo.forEach(m=>m.visible=!near&&d<3200)}}

// grass
let grass=null,cover=null;
function makeGrass(){
  for(const g of[grass,cover])if(g){scene.remove(g);g.geometry.dispose()}grass=cover=null;
  if(!QL.grass)return;grass=grassMesh(QL.grass,false);if(W&&W.water)cover=grassMesh(Math.round(QL.grass*1.1),true);
}
function grassMesh(N,cv){
  const g=new THREE.InstancedBufferGeometry();
  const ys=[0,.34,.68,1],ws=[.5,.42,.27,0];const P=[],H=[];
  for(let i=0;i<3;i++){P.push(-ws[i],ys[i],0,ws[i],ys[i],0);H.push(ys[i],ys[i])}P.push(0,1,0);H.push(1);
  g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aH',new THREE.Float32BufferAttribute(H,1));
  g.setIndex([0,1,2,1,3,2,2,3,4,3,5,4,4,5,6]);
  const off=new Float32Array(N*4);for(let i=0;i<N*4;i++)off[i]=Math.random();
  g.setAttribute('aOff',new THREE.InstancedBufferAttribute(off,4));g.instanceCount=N;
  const m=new THREE.MeshStandardMaterial({side:THREE.DoubleSide,roughness:.75,metalness:0});
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,FOGU,GRASSU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>',`#include <common>
attribute float aH;attribute vec4 aOff;uniform sampler2D uHF;uniform vec4 uHFInfo;uniform vec2 uCenter;uniform float uR;uniform float uTime;varying float vGH;varying vec3 vGTip;varying vec3 vGWP;
vec4 hfS(vec2 xz){vec2 g=(xz-uHFInfo.xy)/uHFInfo.z;vec2 i=floor(g);vec2 f=g-i;float N=uHFInfo.w;vec2 uv0=(i+.5)/N;float o=1./N;
 vec4 a=texture2D(uHF,uv0),b=texture2D(uHF,uv0+vec2(o,0.)),c=texture2D(uHF,uv0+vec2(0.,o)),d=texture2D(uHF,uv0+vec2(o,o));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}`)
      .replace('#include <beginnormal_vertex>',`
vec2 hlf=vec2(uR*.5);vec2 wxz=uCenter-hlf+mod(aOff.xy*uR-(uCenter-hlf),uR);
vec4 hf=hfS(wxz);float dist=length(wxz-uCenter);
float keep=step(aOff.w,${cv?'hf.b':'hf.g'})*(1.-smoothstep(uR*.34,uR*.5,dist));
float ang=aOff.z*6.2831;float s=sin(ang),c=cos(ang);
float bh=(${cv?'.22+aOff.w*.4':'.45+aOff.w*.85'})*keep*(.7+.6*fract(aOff.z*7.3));
float wv=sin(uTime*${cv?'.7':'1.8'}+wxz.x*.13+wxz.y*.09)*.5+.5;
vec3 objectNormal=normalize(vec3(-s*.25,1.,c*.25));`)
      .replace('#include <begin_vertex>',`
vec3 lp=vec3(position.x*${cv?'.11':'.075'}*(.7+fract(aOff.z*13.)*.6),position.y*bh,0.);
vec3 transformed=vec3(c*lp.x,lp.y,s*lp.x);
float bend=aH*aH*(.18+.38*wv)*bh;transformed.xz+=vec2(.75,.4)*bend+vec2(c,s)*aH*aH*.15*bh;transformed.y-=bend*.25;
transformed.x+=wxz.x;transformed.z+=wxz.y;transformed.y+=hf.r-.06;
vGH=aH;float fl=fract(aOff.z*91.7);
vGTip=${cv?'fract(aOff.x*7.)>.45?vec3(.75,.12,.62):vec3(.12,.7,.66)':"fl>.988?(fract(aOff.y*53.)>.5?vec3(1.,.82,.15):vec3(.95,.95,1.)):mix(vec3(.2,.32,.06),vec3(.42,.42,.13),fract(aOff.x*31.))"};
vGWP=transformed;`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vGH;varying vec3 vGTip;varying vec3 vGWP;')
      .replace('#include <map_fragment>',`diffuseColor.rgb=mix(${cv?'vec3(.05,.015,.06)':'vec3(.03,.06,.012)'},vGTip,smoothstep(0.,1.,vGH));`)
      .replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{vec3 vd=normalize(vGWP-cameraPosition);totalEmissiveRadiance+=vGTip*uSunCol*pow(max(dot(vd,uSunDir),0.),3.)*.6*vGH;}')
      .replace('#include <lights_fragment_begin>',THREE.ShaderChunk.lights_fragment_begin.replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=rr_cloudShadow(vGWP);'));
  };
  m.customProgramCacheKey=()=>cv?'cover':'grass';
  const gm=new THREE.Mesh(g,m);gm.frustumCulled=false;gm.receiveShadow=true;scene.add(gm);return gm;
}
const GRASSU={uHF:{value:null},uHFInfo:{value:new THREE.Vector4()},uCenter:{value:new THREE.Vector2()},uR:{value:120}};

let CROWD_GEO=null;
function crowdGeo(){
  if(CROWD_GEO)return CROWD_GEO;const parts=[];const L=prof=>new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(Math.max(r,.001),y)),12);
  const add=(g,part)=>{g=g.index?g.toNonIndexed():g;const n=g.attributes.position.count;g.setAttribute('aPart',new THREE.BufferAttribute(new Float32Array(n).fill(part),1));if(g.attributes.uv)g.deleteAttribute('uv');parts.push(g)};
  for(const x of[-.1,.1]){add(T(L([[0,0],[.055,.01],[.065,.08],[.06,.3],[.08,.55],[.1,.84],[0,.9]]),x,0,0),0);add(T(new RoundedBoxGeometry(.11,.08,.22,2,.03),x,.04,.04),0)}
  add(T(L([[0,.82],[.16,.84],[.155,.98],[.18,1.2],[.19,1.33],[.13,1.44],[.06,1.48],[0,1.49]]),0,0,0,0,0,0,1.18,1,.78),1);
  add(T(new THREE.SphereGeometry(.105,16,12),0,1.62,.01,0,0,0,1,1.14,1.06),2);add(T(new THREE.CylinderGeometry(.045,.05,.12,8),0,1.5,0),2);add(T(new THREE.BoxGeometry(.03,.045,.04),0,1.6,.115),2);
  add(T(new THREE.SphereGeometry(.112,16,10,0,Math.PI*2,0,Math.PI*.55),0,1.65,-.005,0,0,0,1,1.05,1.08),3);
  for(const[x,pt]of[[.21,4],[-.21,5]]){add(T(L([[0,-.6],[.035,-.58],[.042,-.32],[.055,-.06],[.06,0],[0,.03]]),x,1.4,0),pt);add(T(new THREE.SphereGeometry(.045,8,6),x,1.4-.62,0,0,0,0,1,1.2,.9),pt+2)}
  CROWD_GEO=mergeGeometries(parts);return CROWD_GEO;
}
function crowdMaterial(){
  const m=new THREE.MeshStandardMaterial({roughness:.78,metalness:0});
  m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);
    sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aPart;attribute vec4 aCrowd;attribute vec3 aShirt;uniform float uTime;varying vec3 vCC;')
      .replace('#include <beginnormal_vertex>',`#include <beginnormal_vertex>
float ph=aCrowd.x,ty=aCrowd.y;float hype=.55+.45*sin(uTime*.6+ph*3.);
float isL=step(3.5,aPart)*step(aPart,4.5)+step(5.5,aPart)*step(aPart,6.5);float isR=step(4.5,aPart)*step(aPart,5.5)+step(6.5,aPart)*step(aPart,7.5);
float sd=isL-isR;float ang=ty<.4?(2.55+sin(uTime*9.+ph)*.35)*hype:ty<.7?(1.25+sin(uTime*13.+ph+sd)*.28):.22+.08*sin(uTime*2.+ph);
float ca=cos(ang*sd),sa=sin(ang*sd);
if(isL+isR>.5){objectNormal.xy=vec2(ca*objectNormal.x-sa*objectNormal.y,sa*objectNormal.x+ca*objectNormal.y);}`)
      .replace('#include <begin_vertex>',`#include <begin_vertex>
if(isL+isR>.5){vec3 pv=vec3(.21*sd,1.4,0.);vec3 q=transformed-pv;q.xy=vec2(ca*q.x-sa*q.y,sa*q.x+ca*q.y);transformed=pv+q;}
transformed.y+=max(0.,sin(uTime*7.+ph*5.))*.22*hype*step(ty,.45);
vec3 skin=mix(vec3(.78,.5,.34),vec3(.1,.05,.03),aCrowd.z);vec3 hair=aCrowd.w>.82?aShirt*.7:mix(vec3(.015,.01,.008),vec3(.42,.26,.1),aCrowd.w*aCrowd.w);
vCC=aPart<.5?mix(vec3(.03,.04,.07),aShirt*.3,.4):(aPart<1.5||(aPart>3.5&&aPart<5.5))?aShirt:(aPart<2.5||aPart>5.5)?skin:hair;`);
    sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCC;').replace('#include <map_fragment>','diffuseColor.rgb=vCC;');
  };
  m.customProgramCacheKey=()=>'crowd';return m;
}
function makeCrowd(rng){
  const S=W.S,spots=[W.FIN-30,W.FIN+6,START_S+15,...W.bounds.slice(1).map(b=>b.a*W.L-25),...W.bounds.filter(b=>b.mod==='vara'||b.mod==='skate'||b.mod==='remo').map(b=>(b.a+b.b)/2*W.L),...(W.landS?[W.landS]:[])];
  const list=[],fences=[],flagsL=[];
  spots.forEach(s0=>{for(let k=0;k<70;k++){const s=s0+rand(-26,26),i=clamp(Math.round(s/DS),0,S.length-1),p=S[i];if(!isG(p.surface)&&!(p.surface==='water'&&p.lu>.96)&&p.surface!=='rio'&&!(p.mod==='paraquedas'&&p.lu>(W.bounds[p.seg].td||.9)-.07))continue;const side=rng()<.5?-1:1,lat=side*(p.surface==='rio'?rand(21,29):p.mod==='paraquedas'?rand(18,26):p.surface==='asfalto'?rand(9,12):rand(12.6,19.5));
      const x=p.p.x+p.sd.x*lat,z=p.p.z+p.sd.z*lat,y=gridH(x,z);if(W.water&&y<W.water.level+.3)continue;if(Math.abs(y-p.ground)>4)continue;list.push({x,z,y,ang:Math.atan2(-p.sd.x*side,-p.sd.z*side)})}
    for(let f=-24;f<=24;f+=3.3){const i=clamp(Math.round((s0+f)/DS),0,S.length-1),p=S[i];if(!isG(p.surface)||p.surface==='asfalto')continue;const fw=p.surface==='pista'?14.5:11.6;for(const side of[-1,1]){const x=p.p.x+p.sd.x*fw*side,z=p.p.z+p.sd.z*fw*side,y=gridH(x,z);if(Math.abs(y-p.ground)>3)continue;fences.push({x,y,z,ang:Math.atan2(p.t.x,p.t.z)});if(rng()<.18)flagsL.push({x:p.p.x+p.sd.x*20*side,y:gridH(p.p.x+p.sd.x*20*side,p.p.z+p.sd.z*20*side),z:p.p.z+p.sd.z*20*side,ang:Math.atan2(p.t.x,p.t.z)})}}});
  const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),sc=new V3(1.5,1.5,1.5),pp=new V3();
  if(list.length){const g=crowdGeo().clone();const ac=new Float32Array(list.length*4),as=new Float32Array(list.length*3);const col=new THREE.Color();
    const im=new THREE.InstancedMesh(g,crowdMaterial(),list.length);
    list.forEach((c,k)=>{sc.setScalar(1.5*rand(.9,1.08));q.setFromAxisAngle(UP,c.ang+rand(-.3,.3));mt.compose(pp.set(c.x,c.y-.05,c.z),q,sc);im.setMatrixAt(k,mt);
      ac.set([rand(0,6.28),Math.random(),Math.pow(Math.random(),1.3),Math.random()],k*4);col.setHSL(rand(0,1),rand(.55,.9),rand(.35,.6));as.set([col.r,col.g,col.b],k*3)});
    g.setAttribute('aCrowd',new THREE.InstancedBufferAttribute(ac,4));g.setAttribute('aShirt',new THREE.InstancedBufferAttribute(as,3));im.computeBoundingSphere();im.castShadow=true;W.group.add(im)}
  if(fences.length){const ft=cTex(512,160,(x,w,h)=>{const gr=x.createLinearGradient(0,0,w,0);gr.addColorStop(0,'#ff4a1c');gr.addColorStop(1,'#ff2e63');x.fillStyle=gr;x.fillRect(0,0,w,h);x.fillStyle='#0a0e1a';x.fillRect(0,h*.78,w,h*.22);x.font="italic 900 92px 'Saira Condensed', Impact, sans-serif";x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText('RADICAL RUSH',w/2,h*.42)});
    const fg=mergeGeometries([new THREE.PlaneGeometry(3.25,1.05).translate(0,.75,0),new THREE.CylinderGeometry(.04,.04,1.4,6).translate(1.6,.7,0).deleteAttribute('normal')&&new THREE.CylinderGeometry(.04,.04,1.4,6).toNonIndexed().translate(1.6,.7,0)].map(x=>x.index?x.toNonIndexed():x));
    const fm=new THREE.MeshStandardMaterial({map:ft,roughness:.6,side:THREE.DoubleSide});const im=new THREE.InstancedMesh(fg,fm,fences.length);
    fences.forEach((f,k)=>{q.setFromAxisAngle(UP,f.ang);mt.compose(pp.set(f.x,f.y,f.z),q,sc.set(1,1,1));im.setMatrixAt(k,mt)});im.castShadow=true;W.group.add(im)}
  if(flagsL.length){const pole=new THREE.CylinderGeometry(.04,.05,5,6).translate(0,2.5,0);const flg=new THREE.PlaneGeometry(1.8,1.1,6,2).translate(.95,4.3,0);
    const pm=new THREE.InstancedMesh(pole,new THREE.MeshStandardMaterial({color:0xdddddd,metalness:.6,roughness:.3}),flagsL.length);
    const fm=new THREE.MeshStandardMaterial({roughness:.6,side:THREE.DoubleSide});fm.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fw=max(position.x,0.);vec4 ip=instanceMatrix[3];transformed.z+=sin(uTime*6.+fw*3.+ip.x*.2)*.18*fw;transformed.y-=fw*fw*.03;')};fm.customProgramCacheKey=()=>'bigflag';
    const fi=new THREE.InstancedMesh(flg,fm,flagsL.length);const col=new THREE.Color();
    flagsL.forEach((f,k)=>{q.setFromAxisAngle(UP,f.ang+Math.PI/2);mt.compose(pp.set(f.x,f.y,f.z),q,sc.set(1,1,1));pm.setMatrixAt(k,mt);fi.setMatrixAt(k,mt);fi.setColorAt(k,col.setHSL(pick([0,.05,.12,.55,.6,.85]),.85,.5))});
    pm.castShadow=fi.castShadow=true;W.group.add(pm,fi)}
}
function updateCrowd(){}

