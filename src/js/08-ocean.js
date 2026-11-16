let ocean=null;
const WAVES=[[1,.2,52,.34,.5],[.8,.6,33,.24,.55],[.95,-.3,21,.15,.55],[.6,.8,13,.09,.5],[1,-.6,8,.05,.45],[.3,1,4.8,.03,.4],[.9,.45,3,.017,.35],[-.2,1,1.9,.01,.3]];
function makeOcean(){
  const RN=150,AN=240,P=[],I=[];P.push(0,0,0);
  for(let k=1;k<=RN;k++){const r=.35*(Math.pow(1.066,k)-1);for(let a=0;a<AN;a++){const t=a/AN*Math.PI*2;P.push(Math.cos(t)*r,0,Math.sin(t)*r)}}
  for(let a=0;a<AN;a++)I.push(0,1+(a+1)%AN,1+a);
  for(let k=1;k<RN;k++)for(let a=0;a<AN;a++){const i0=1+(k-1)*AN+a,i1=1+(k-1)*AN+(a+1)%AN,j0=i0+AN,j1=i1+AN;I.push(i0,i1,j0,i1,j1,j0)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);
  const wv=WAVES.map(w=>{const l=Math.hypot(w[0],w[1]);return new THREE.Vector4(w[0]/l,w[1]/l,2*Math.PI/w[2],w[3])});
  const mat=new THREE.ShaderMaterial({side:THREE.DoubleSide,
    uniforms:{...FOGU,uHF:GRASSU.uHF,uHFInfo:GRASSU.uHFInfo,tWaves:TEXU.tWaves,uW:{value:wv},uQ:{value:WAVES.map(w=>w[4])},uSunI:{value:3}},
    vertexShader:`uniform vec4 uW[8];uniform float uQ[8];uniform float uTime;varying vec3 vWP;varying vec3 vN;varying float vJ;varying float vH;
    void main(){vec3 wp=(modelMatrix*vec4(position,1.)).xyz;float dist=length(position.xz);float fade=1.-smoothstep(220.,1500.,dist);
      vec3 disp=vec3(0.);float nx=0.,nz=0.,ny=0.;
      for(int i=0;i<8;i++){vec4 w=uW[i];float k=w.z,A=w.w*fade,om=sqrt(9.8*k);float f=k*dot(w.xy,wp.xz)-om*uTime+float(i)*1.7;float Q=uQ[i]/(k*w.w*8.+1e-4);
        float c=cos(f),s=sin(f);disp.xz+=Q*A*w.xy*c;disp.y+=A*s;nx+=w.x*k*A*c;nz+=w.y*k*A*c;ny+=Q*k*A*s;}
      vWP=wp+disp;vN=vec3(-nx,1.-ny,-nz);vJ=1.-ny;vH=disp.y;gl_Position=projectionMatrix*viewMatrix*vec4(vWP,1.);}`,
    fragmentShader:`${GLSL_SKY}
    uniform sampler2D tWaves;uniform sampler2D uHF;uniform vec4 uHFInfo;uniform float uSunI;varying vec3 vWP;varying vec3 vN;varying float vJ;varying float vH;
    float hfH(vec2 xz){vec2 g=(xz-uHFInfo.xy)/uHFInfo.z;return texture2D(uHF,(g+.5)/uHFInfo.w).r;}
    void main(){vec3 toC=cameraPosition-vWP;float dist=length(toC);vec3 V=toC/dist;float df=exp(-dist*.006);
      vec3 n=normalize(vN);
      vec2 u1=vWP.xz*.045+uTime*vec2(.018,.011),u2=vWP.xz*.13-uTime*vec2(.015,.027),u3=vWP.xz*.37+uTime*vec2(-.03,.02);
      vec2 dn=(texture2D(tWaves,u1).xy*2.-1.)+(texture2D(tWaves,u2).xy*2.-1.)*.8+(texture2D(tWaves,u3).xy*2.-1.)*.5*df;
      n=normalize(n+vec3(dn.x,0.,dn.y)*mix(.1,.42,df));
      float depth=uWater.x-hfH(vWP.xz);
      vec3 col;
      if(!gl_FrontFacing||cameraPosition.y<vWP.y){
        vec3 I=-V;vec3 T=refract(I,-n,1.33);
        float sw=smoothstep(.0,.08,dot(T,T));vec3 Tn=normalize(T+vec3(0.,1e-4,0.));
        vec3 win=rr_sky(Tn)*1.15+uSunCol*pow(max(dot(Tn,uSunDir),0.),220.)*30.;
        vec3 tir=RR_WCOL*.55*(.8+.4*rr_vnoise(vWP.xz*.3+uTime*.4));
        col=mix(tir,win,sw)*(.85+.3*pow(1.-max(dot(n,V),0.),3.));
        col=rr_underFog(col,cameraPosition,-V,dist);
      }else{
        float NdV=max(dot(n,V),1e-3);float F=.02+.98*pow(1.-NdV,5.);
        vec3 R=reflect(-V,n);R.y=abs(R.y)+.01;R=normalize(R);vec3 refl=rr_sky(R);
        float rough=mix(.11,.035,df);vec3 H=normalize(V+uSunDir);float NdH=max(dot(n,H),0.);float a2=rough*rough;float dd=NdH*NdH*(a2-1.)+1.;float D=a2/(3.1416*dd*dd);
        float NdL=max(dot(n,uSunDir),0.);vec3 spec=uSunCol*uSunI*D*F*NdL*.3;
        float sh=smoothstep(0.,8.,depth);vec3 amb=uSkyHor*.55+uSunCol*uSunI*.05*max(uSunDir.y,0.);
        vec3 body=mix(vec3(.03,.22,.21),vec3(.004,.028,.04),sh)*amb*2.3;
        float back=pow(max(dot(normalize(vec3(-V.x,0.,-V.z)),normalize(vec3(uSunDir.x,.001,uSunDir.z))),0.),3.);
        body+=vec3(.02,.17,.12)*uSunCol*max(vH,0.)*(.4+3.*back)*uSunI*.18;
        col=mix(body,refl,F)+spec;
        float fn=rr_fbm(vWP.xz*.35+uTime*.15);
        float foam=smoothstep(.8,1.08,(1.-vJ)*2.2+fn*.45)*.5;
        float shore=(1.-smoothstep(0.,.75+fn*.9,depth))*(.55+.45*sin(uTime*1.7-depth*4.+fn*6.));
        foam=clamp(foam+max(shore,0.),0.,1.)*(.6+.4*fn);
        col=mix(col,amb*1.5+uSunCol*uSunI*.22*max(uSunDir.y,.1),foam*.85);
        vec3 vd=-V;col=mix(col,rr_fogCol(vd),rr_aerial(dist,vd));
      }
      gl_FragColor=vec4(col,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`});
  ocean=new THREE.Mesh(g,mat);ocean.frustumCulled=false;ocean.visible=false;ocean.renderOrder=0;scene.add(ocean);
}
// ---------------- vida marinha: cardumes, tubarões, algas, corais ----------------
const LIFE={sharks:[],schools:[],fish:null,idx:[],mantas:[],vents:[]};
function isUnderSwim(r){if(!W.water||r.mod!=='nado')return false;trackAt(r.s,CTA);return CTA.pos.y<W.water.level-3}
function fishGeo(){const g=new THREE.LatheGeometry([[0,-.25],[.05,-.2],[.09,-.05],[.1,.05],[.075,.17],[.03,.24],[0,.26]].map(([r,y])=>new THREE.Vector2(Math.max(r,.001),y)),10);g.rotateX(Math.PI/2);g.scale(.42,1,1);
  const tail=new THREE.BufferGeometry();tail.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.22,0,.13,-.38,0,-.13,-.38],3));tail.computeVertexNormals();
  const a=g.toNonIndexed();a.deleteAttribute('uv');return mergeGeometries([a,tail])}
function sharkGeo(){
  const prof=[[0,2.05],[.16,1.85],[.32,1.5],[.46,.95],[.5,.45],[.47,-.1],[.38,-.7],[.24,-1.25],[.12,-1.7],[.07,-1.95],[0,-2]];
  const b=new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(Math.max(r,.001),y)),24);b.rotateX(Math.PI/2);b.scale(.82,.92,1);
  const tri=(pts)=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));g.computeVertexNormals();return g};
  const fin=(a,b2,c,th=.03)=>{const P=[];const o=[[th,0,0],[-th,0,0]];for(const[dx]of o)P.push(a[0]+dx,a[1],a[2],b2[0]+dx,b2[1],b2[2],c[0]+dx,c[1],c[2]);P.push(a[0]+th,a[1],a[2],b2[0]+th,b2[1],b2[2],b2[0]-th,b2[1],b2[2],a[0]+th,a[1],a[2],b2[0]-th,b2[1],b2[2],a[0]-th,a[1],a[2]);return tri(P)};
  const parts=[b.toNonIndexed(),fin([0,.38,.55],[0,1.15,-.15],[0,.36,-.45]),fin([0,.05,-1.85],[0,1.05,-2.55],[0,.05,-1.95]),fin([0,.0,-1.85],[0,-.75,-2.35],[0,.0,-1.95]),
    tri([.3,-.12,.55,1.25,-.5,-.1,.32,-.18,-.05, .3,-.12,.55,.32,-.18,-.05,1.25,-.5,-.1]),tri([-.3,-.12,.55,-.32,-.18,-.05,-1.25,-.5,-.1, -.3,-.12,.55,-1.25,-.5,-.1,-.32,-.18,-.05])];
  parts.forEach(g=>{if(g.attributes.uv)g.deleteAttribute('uv')});
  const g=mergeGeometries(parts);const p=g.attributes.position,n=p.count,c=new Float32Array(n*3);
  for(let i=0;i<n;i++){const y=p.getY(i),k=smooth(-.25,.12,y);c[i*3]=lerp(.86,.22,k);c[i*3+1]=lerp(.87,.27,k);c[i*3+2]=lerp(.88,.33,k)}g.setAttribute('color',new THREE.BufferAttribute(c,3));
  const eye=new THREE.SphereGeometry(.05,8,6);const e1=eye.clone().translate(.27,.12,1.35),e2=eye.clone().translate(-.27,.12,1.35);[e1,e2].forEach(e=>{e.deleteAttribute('uv');const cc=new Float32Array(e.attributes.position.count*3).fill(.01);e.setAttribute('color',new THREE.BufferAttribute(cc,3))});
  return mergeGeometries([g,e1.toNonIndexed(),e2.toNonIndexed()])}
function swayMat(opts,amp,key){const m=new THREE.MeshStandardMaterial(opts);m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
#ifdef USE_INSTANCING
float ph=instanceMatrix[3].x*.7+instanceMatrix[3].z*.3;
#else
float ph=modelMatrix[3].x*.3;
#endif
${amp}`)};m.customProgramCacheKey=()=>key;return m}
function buildSeaLife(){
  LIFE.sharks=[];LIFE.schools=[];LIFE.fish=null;LIFE.idx=[];LIFE.mantas=[];LIFE.vents=[];
  if(!W.water)return;const S=W.S,lv=W.water.level;
  for(let i=W.water.i0;i<=W.water.i1;i++)if(S[i].p.y<lv-3.2)LIFE.idx.push(i);
  if(LIFE.idx.length<12)return;
  const I=LIFE.idx,mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V3(),pp=new V3(),col=new THREE.Color();
  // floresta de kelp alta com folhas
  {const kt=cTex(64,256,(x,w,h)=>{x.clearRect(0,0,w,h);const g=x.createLinearGradient(0,h,0,0);g.addColorStop(0,'#1f3a10');g.addColorStop(.55,'#456a18');g.addColorStop(1,'#a3bd3c');x.fillStyle=g;x.beginPath();x.moveTo(32,h);for(let y=h;y>=0;y-=6){const t=1-y/h,wd=Math.pow(Math.sin(t*Math.PI),.7)*27+2;x.lineTo(32+wd+Math.sin(y*.45)*4+(y%18<6?3:0),y)}for(let y=0;y<=h;y+=6){const t=1-y/h,wd=Math.pow(Math.sin(t*Math.PI),.7)*27+2;x.lineTo(32-wd+Math.sin(y*.45+1)*4-(y%18<6?3:0),y)}x.fill();x.strokeStyle='rgba(30,45,10,.6)';x.lineWidth=2;x.beginPath();x.moveTo(32,h);x.lineTo(32,4);x.stroke()});
    const P=[],N=[],U=[],C=[],Ix=[];const R=mulberry(77);const quad=(a,b,c,d,n,uv,col)=>{const o=P.length/3;[a,b,c,d].forEach((v,k)=>{P.push(v.x,v.y,v.z);N.push(n[k].x,n[k].y,n[k].z);U.push(uv[k][0],uv[k][1]);C.push(col[k],col[k],col[k])});Ix.push(o,o+1,o+2,o,o+2,o+3)};
    for(let k=0;k<96;k++){const y=.4+k/96*19.8,ang=k*2.399+R()*.6,L=lerp(3.4,1.8,k/96)*(.8+R()*.4),Wd=.95*(.8+R()*.4);const dir=new V3(Math.cos(ang),.25+R()*.6,Math.sin(ang)).normalize(),sd=new V3(-Math.sin(ang),0,Math.cos(ang));const o=new V3(0,y,0),tp=o.clone().addScaledVector(dir,L);
      const a=o.clone().addScaledVector(sd,-Wd*.5),b=o.clone().addScaledVector(sd,Wd*.5),c=tp.clone().addScaledVector(sd,Wd*.5),d=tp.clone().addScaledVector(sd,-Wd*.5);const nn=[a,b,c,d].map(v=>new V3(v.x,.6,v.z).normalize());const ao=.18+.62*k/96;
      quad(a,b,c,d,nn,[[0,0],[1,0],[1,1],[0,1]],[ao,ao,1,1])}
    for(let k=0;k<6;k++){const a0=k/6*Math.PI*2,a1=(k+1)/6*Math.PI*2,r=.07;const v=[new V3(Math.cos(a0)*r,0,Math.sin(a0)*r),new V3(Math.cos(a1)*r,0,Math.sin(a1)*r),new V3(Math.cos(a1)*r,20,Math.sin(a1)*r),new V3(Math.cos(a0)*r,20,Math.sin(a0)*r)];const nn=v.map(p=>new V3(p.x,0,p.z).normalize());quad(v[0],v[1],v[2],v[3],nn,[[.48,0],[.52,0],[.52,.02],[.48,.02]],[.6,.6,.8,.8])}
    const kg=new THREE.BufferGeometry();kg.setAttribute('position',new THREE.Float32BufferAttribute(P,3));kg.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));kg.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));kg.setAttribute('color',new THREE.Float32BufferAttribute(C,3));kg.setIndex(Ix);
    const km=new THREE.MeshStandardMaterial({map:kt,alphaTest:.5,alphaToCoverage:QL.msaa>0,side:THREE.DoubleSide,vertexColors:true,roughness:.7});
    km.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>',`#include <begin_vertex>
float ph=instanceMatrix[3].x*.21+instanceMatrix[3].z*.17;float hy=position.y/20.;transformed.x+=sin(uTime*.55+ph+position.y*.12)*1.6*hy*hy;transformed.z+=cos(uTime*.45+ph*1.3)*1.1*hy*hy;`);
      sh.fragmentShader=sh.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\nnormal=normalize(vNormal);').replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=diffuseColor.rgb*vec3(.0,.02,.008);')};
    km.customProgramCacheKey=()=>'kelp';
    const spots=[];const groves=[];for(let g=0;g<22;g++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(8,34);groves.push([s.p.x+s.sd.x*lat,s.p.z+s.sd.z*lat])}
    for(let k=0;k<Math.round(340*QL.trees+60);k++){const gv=pick(groves);const i=pick(I),s=S[i];const lat=0;const x=gv[0]+rand(-9,9),z=gv[1]+rand(-9,9);nearest(x,z);if(_nd<6.5)continue;const y=gridH(x,z);const room=lv-y-1;if(room<6)continue;spots.push([x,y,z,Math.min(1.25,room/20)*rand(.75,1)])}
    const kim=new THREE.InstancedMesh(kg,km,spots.length);spots.forEach(([x,y,z,h],k)=>{mt.compose(pp.set(x,y-.2,z),q.setFromEuler(e.set(0,rand(0,6.3),0)),sc.set(h,h,h));kim.setMatrixAt(k,mt);kim.setColorAt(k,col.setRGB(rand(.8,1.1),rand(.85,1.1),rand(.7,1)))});
    kim.castShadow=true;W.group.add(kim);
    // brilhos dourados/verdes na floresta
    const SN=Math.min(5000,spots.length*16),sp=new Float32Array(SN*3),sa=new Float32Array(SN*4);for(let k=0;k<SN;k++){const s0=spots[k%spots.length];sp.set([s0[0]+rand(-2.2,2.2),s0[1]+rand(1,20*s0[3]),s0[2]+rand(-2.2,2.2)],k*3);const gld=Math.random()<.5;sa.set([gld?1.6:.6,gld?1.3:1.6,gld?.4:.6,rand(0,6.3)],k*4)}
    const sgm=new THREE.BufferGeometry();sgm.setAttribute('position',new THREE.BufferAttribute(sp,3));sgm.setAttribute('sc',new THREE.BufferAttribute(sa,4));
    const smat=new THREE.ShaderMaterial({uniforms:{uTime:FOGU.uTime,uScale:{value:innerHeight*.5}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
      vertexShader:`attribute vec4 sc;uniform float uTime;uniform float uScale;varying vec3 vC;varying float vA;void main(){vec3 p=position;p.x+=sin(uTime*.5+sc.w)*.4;p.y+=sin(uTime*.3+sc.w*2.)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=min(.12*uScale/-mv.z,6.);vC=sc.rgb;vA=(.35+.65*pow(.5+.5*sin(uTime*2.3+sc.w*7.),3.))*smoothstep(90.,20.,-mv.z);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying vec3 vC;varying float vA;void main(){float d=length(gl_PointCoord-.5);gl_FragColor=vec4(vC,smoothstep(.5,0.,d)*vA);}`});
    const spk=new THREE.Points(sgm,smat);spk.frustumCulled=false;W.group.add(spk);
    // rochas grandes cobertas de musgo e pedras flutuando
    {const rm=rockMaterial();const rgA=rockGeo(31,3),rgB=rockGeo(37,3);const big=[];
      for(let k=0;k<150;k++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(7.5,44);const x=s.p.x+s.sd.x*lat+s.t.x*rand(-8,8),z=s.p.z+s.sd.z*lat+s.t.z*rand(-8,8);nearest(x,z);if(_nd<7.5)continue;const y=gridH(x,z);if(y>lv-5)continue;big.push([x,y,z,rand(1.6,Math.min(9,(lv-y)*.35)),false])}
      for(let k=0;k<26;k++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(9,30);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat;const y=gridH(x,z);const top=lv-3;if(top-y<10)continue;big.push([x,rand(y+7,top-2),z,rand(.6,2.6),true])}
      [rgA,rgB].forEach((g,gi)=>{const list=big.filter((_,k)=>k%2===gi);if(!list.length)return;const im=new THREE.InstancedMesh(g,rm,list.length);const cov=new Float32Array(list.length*4);
        list.forEach(([x,y,z,sz,fl],k)=>{mt.compose(pp.set(x,fl?y:y-sz*.35,z),q.setFromEuler(e.set(rand(-.5,.5),rand(0,6.3),rand(-.5,.5))),sc.set(sz*rand(1,1.7),sz*rand(.7,1.2),sz*rand(1,1.6)));im.setMatrixAt(k,mt);im.setColorAt(k,col.setRGB(.42,.48,.46));cov.set([.16,.3,.17,fl?.35:.75],k*4)});
        g.setAttribute('aCover',new THREE.InstancedBufferAttribute(cov,4));im.castShadow=im.receiveShadow=true;W.group.add(im)});
      // arcos de pedra por cima do túnel
      for(let k=0;k<4;k++){const i=I[Math.floor((k+.6)/4.6*I.length)],s=S[i];const fy=gridH(s.p.x,s.p.z);const R0=Math.max(24,s.p.y+6-fy);
        const ag=new THREE.TorusGeometry(R0,3.2,14,64,Math.PI);const pa=ag.attributes.position,nn=makeNoise(mulberry(k*13+5));for(let v=0;v<pa.count;v++){const vx=pa.getX(v),vy=pa.getY(v),vz=pa.getZ(v);const f=1+fbm(nn,vx*.12+vz*.2,vy*.12,4)*.35;const a=Math.atan2(vy,vx),cx=Math.cos(a)*R0,cy=Math.sin(a)*R0;pa.setXYZ(v,cx+(vx-cx)*f,cy+(vy-cy)*f,vz*f*1.3)}ag.computeVertexNormals();
        const cv=new Float32Array(pa.count*4);for(let v=0;v<pa.count;v++)cv.set([.16,.3,.17,.8],v*4);ag.setAttribute('aCover',new THREE.BufferAttribute(cv,4));
        const am=rockMaterial();am.color.setHex(0x6d7470);const arch=new THREE.Mesh(ag,am);arch.position.set(s.p.x,fy-2,s.p.z);arch.lookAt(arch.position.clone().add(new V3(s.t.x,0,s.t.z)));arch.castShadow=arch.receiveShadow=true;W.group.add(arch)}
    }
    // corais em galho
    {const coralGeo=seed=>{const R2=mulberry(seed),parts=[];const br=(p0,dir,len,r,dp)=>{const e2=p0.clone().addScaledVector(dir,len);parts.push(tubeGeo(p0,e2,r,6).toNonIndexed(),new THREE.SphereGeometry(r*1.05,6,4).translate(e2.x,e2.y,e2.z).toNonIndexed());if(dp>0)for(let k=0;k<3;k++){const nd=dir.clone().add(new V3(R2()-.5,R2()*.7,R2()-.5).multiplyScalar(1.3)).normalize();br(e2,nd,len*.74,r*.72,dp-1)}};br(new V3(),UP.clone(),.55,.085,3);parts.forEach(g=>{if(g.attributes.uv)g.deleteAttribute('uv')});return mergeGeometries(parts)};
      const cg=[coralGeo(3),coralGeo(9)];const cm=new THREE.MeshStandardMaterial({roughness:.6});
      cg.forEach((g,gi)=>{const n=Math.round(130*QL.trees+20);const im=new THREE.InstancedMesh(g,cm,n);let c2=0;for(let k=0;k<n;k++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(6,32);const x=s.p.x+s.sd.x*lat+rand(-5,5),z=s.p.z+s.sd.z*lat+rand(-5,5);nearest(x,z);if(_nd<6)continue;const y=gridH(x,z);if(y>lv-4)continue;const sz=rand(1.2,3.2);
        mt.compose(pp.set(x,y-.1,z),q.setFromEuler(e.set(rand(-.2,.2),rand(0,6.3),rand(-.2,.2))),sc.set(sz,sz,sz));im.setMatrixAt(c2,mt);im.setColorAt(c2,col.setHSL(pick([.83,.88,.95,.02,.08,.75]),.6,rand(.45,.62)));c2++}im.count=c2;im.castShadow=true;W.group.add(im)})}
    // teleférico afundado e âncora gigante (cenário)
    {const i=I[Math.floor(I.length*.38)],s=S[i];const side=1,lat=15;const x=s.p.x+s.sd.x*lat*side,z=s.p.z+s.sd.z*lat*side,y=gridH(x,z);
      const g=new THREE.Group();g.position.set(x,y+1.1,z);g.rotation.set(.35,rand(0,6),-.28);
      const paint=new THREE.MeshStandardMaterial({color:0x7a2a1d,roughness:.75,metalness:.35}),dark=new THREE.MeshStandardMaterial({color:0x0c1416,roughness:.15,metalness:.6}),steel=new THREE.MeshStandardMaterial({color:0x5b6366,roughness:.55,metalness:.8});
      const cab=new THREE.Mesh(new RoundedBoxGeometry(3.4,2.8,2.4,3,.35),paint);cab.castShadow=true;g.add(cab);
      const win=new THREE.Mesh(new RoundedBoxGeometry(3.46,1.1,2.46,2,.2),dark);win.position.y=.35;g.add(win);
      const roof=new THREE.Mesh(new RoundedBoxGeometry(2.4,.4,1.6,2,.15),steel);roof.position.y=1.55;g.add(roof);
      const arm=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,2.4,8),steel);arm.position.y=2.9;g.add(arm);
      const wh=new THREE.Mesh(new THREE.TorusGeometry(.45,.12,8,20),steel);wh.position.y=4.1;g.add(wh);W.group.add(g);
      const j=I[Math.floor(I.length*.72)],s2=S[j];const ax=s2.p.x-s2.sd.x*17,az=s2.p.z-s2.sd.z*17,ay=gridH(ax,az);
      const an=new THREE.Group();an.position.set(ax,ay+.4,az);an.rotation.set(0,rand(0,6),1.15);
      an.add(new THREE.Mesh(new THREE.CylinderGeometry(.45,.45,9,12).translate(0,4.5,0),steel));
      const ring=new THREE.Mesh(new THREE.TorusGeometry(1.1,.3,10,24),steel);ring.position.y=9.6;an.add(ring);
      const stock=new THREE.Mesh(new THREE.CylinderGeometry(.3,.3,5,10),steel);stock.rotation.z=Math.PI/2;stock.position.y=7.6;an.add(stock);
      const crown=new THREE.Mesh(new THREE.TorusGeometry(3,.45,10,30,Math.PI),steel);crown.rotation.z=Math.PI;crown.position.y=1.8;an.add(crown);
      an.traverse(o=>{if(o.isMesh)o.castShadow=true});W.group.add(an)}
    // esponjas-barril
    const bg=new THREE.LatheGeometry([[.3,0],[.42,.35],[.5,.85],[.46,.9],[.36,.85],[.3,.4],[.001,.3]].map(([r,y])=>new THREE.Vector2(r,y)),18);
    const bim=new THREE.InstancedMesh(bg,new THREE.MeshStandardMaterial({roughness:.85,side:THREE.DoubleSide}),70);let bn=0;
    for(let k=0;k<70;k++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(5.5,26);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat,y=gridH(x,z);if(y>lv-4)continue;const sz=rand(.8,2.2);mt.compose(pp.set(x,y-.1,z),q.setFromEuler(e.set(rand(-.15,.15),rand(0,6.3),rand(-.15,.15))),sc.set(sz,sz*rand(.8,1.4),sz));bim.setMatrixAt(bn,mt);bim.setColorAt(bn,col.setHSL(pick([.06,.08,.1,.78,.95]),.55,.42));bn++}
    bim.count=bn;bim.castShadow=true;W.group.add(bim);
    // arraias planando acima do túnel
    const mg=new THREE.PlaneGeometry(5.2,2.6,16,6);mg.rotateX(-Math.PI/2);{const pa=mg.attributes.position,cc=new Float32Array(pa.count*3);for(let i=0;i<pa.count;i++){const x=pa.getX(i),z=pa.getZ(i);const wdt=2.6*(1-Math.abs(z+(.25-Math.abs(x)*.18))/1.3);if(Math.abs(x)>wdt){pa.setX(i,Math.sign(x)*Math.max(wdt,.05))}pa.setY(i,Math.max(0,.22-Math.abs(pa.getX(i))*.08)*(1-Math.abs(z)/1.4));cc.set([.05,.07,.1],i*3)}mg.computeVertexNormals();mg.setAttribute('color',new THREE.BufferAttribute(cc,3))}
    const mm=swayMat({vertexColors:true,roughness:.5,side:THREE.DoubleSide},'float wx=abs(position.x)/2.6;transformed.y+=sin(uTime*1.5+ph)*1.1*wx*wx;','manta');
    LIFE.mantas=[];for(let k=0;k<3;k++){const m=new THREE.Mesh(mg,mm);m.castShadow=true;const i=I[Math.floor((k+.3)/3*I.length)];LIFE.mantas.push({m,c:S[i].p.clone().setY(lv-4.5-k*1.5),r:rand(14,22),a:rand(0,6.3),sp:rand(.12,.2)*(k%2?1:-1)});W.group.add(m)}
    // colunas de bolhas subindo do fundo
    LIFE.vents=[];for(let k=0;k<10;k++){const i=pick(I),s=S[i];const lat=(Math.random()<.5?-1:1)*rand(7,22);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat;LIFE.vents.push(new V3(x,gridH(x,z),z))}
  }
  // algas baixas
  const kelpN=220,kelp=new THREE.InstancedMesh(new THREE.PlaneGeometry(.7,1,1,10).translate(0,.5,0),swayMat({color:0xffffff,roughness:.7,side:THREE.DoubleSide},'float hh=position.y;transformed.x+=sin(uTime*1.2+ph+hh*1.6)*.25*hh*hh;transformed.z+=cos(uTime*.9+ph)*.15*hh*hh;','kelp'),kelpN);
  let kn=0;for(let k=0;k<kelpN;k++){const i=pick(I),s=S[i];const lat=(rand(0,1)<.5?-1:1)*rand(5.5,28);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat,y=gridH(x,z);if(y>lv-4)continue;const h=rand(3,Math.min(10,lv-y-1.5));
    mt.compose(pp.set(x,y-.2,z),q.setFromEuler(e.set(0,rand(0,6.3),0)),sc.set(rand(.7,1.3),h,1));kelp.setMatrixAt(kn,mt);kelp.setColorAt(kn,col.setRGB(rand(.12,.3),rand(.25,.42),rand(.05,.12)));kn++}
  kelp.count=kn;W.group.add(kelp);
  // corais
  const corN=170,cor=new THREE.InstancedMesh(rockGeo(21,1),new THREE.MeshStandardMaterial({roughness:.6}),corN);let cn=0;
  for(let k=0;k<corN;k++){const i=pick(I),s=S[i];const lat=(rand(0,1)<.5?-1:1)*rand(5.5,24);const x=s.p.x+s.sd.x*lat,z=s.p.z+s.sd.z*lat,y=gridH(x,z);if(y>lv-4)continue;const sz=rand(.3,1.2);
    mt.compose(pp.set(x,y,z),q.setFromEuler(e.set(rand(0,3),rand(0,3),rand(0,3))),sc.set(sz*rand(.8,1.6),sz*rand(.8,2.2),sz*rand(.8,1.6)));cor.setMatrixAt(cn,mt);cor.setColorAt(cn,col.setHSL(pick([.97,.03,.08,.8,.55,.13]),.75,.5));cn++}
  cor.count=cn;W.group.add(cor);
  // cardumes
  const nSch=9,per=QL.grass?64:30,fm=swayMat({color:0x9aa6b0,roughness:.38,metalness:.3},'transformed.x+=sin(uTime*14.+ph*9.)*.06*max(-position.z,0.)*4.;','fish');
  const fish=new THREE.InstancedMesh(fishGeo(),fm,nSch*per);fish.frustumCulled=false;W.group.add(fish);LIFE.fish=fish;
  const pal=[[.8,.85,.9],[1,.75,.1],[1,.45,.12],[.25,.55,1],[.9,.9,.4],[.6,.85,.95]];
  for(let k=0;k<nSch;k++){const i=I[Math.floor((k+.5)/nSch*I.length)],s=S[i];const side=k%2?1:-1;const c=pal[k%pal.length];
    const sch={i,anchor:new V3(s.p.x+s.sd.x*side*rand(7,15),s.p.y+rand(-2,3),s.p.z+s.sd.z*side*rand(7,15)),rad:rand(6,12),sp:rand(.25,.45)*(k%3?1:-1),ph:rand(0,6.3),cross:k%3===0,members:[],pos:new V3(),prev:new V3(),hit:new Map()};
    for(let m=0;m<per;m++){sch.members.push({o:new V3(rand(-3.2,3.2),rand(-1.8,1.8),rand(-3.2,3.2)),w:rand(0,6.3)});fish.setColorAt(k*per+m,col.setRGB(c[0]*rand(.85,1.1),c[1]*rand(.85,1.1),c[2]*rand(.85,1.1)))}
    LIFE.schools.push(sch)}
  LIFE.per=per;
  // tubarões
  const sg=sharkGeo(),sm=swayMat({vertexColors:true,roughness:.42,metalness:.05},'float tl=max(-position.z-.6,0.);transformed.x+=sin(uTime*5.5+ph)*.12*tl*tl;','shark');
  for(let k=0;k<3;k++){const i=I[Math.floor((k+.5)/3*I.length)],s=S[i];const m=new THREE.Mesh(sg,sm);m.castShadow=true;m.scale.setScalar(1.15);W.group.add(m);
    const side=k%2?1:-1;const anchor=new V3(s.p.x+s.sd.x*side*14,s.p.y-1,s.p.z+s.sd.z*side*14);m.position.copy(anchor);
    LIFE.sharks.push({m,anchor,ang:rand(0,6.3),state:'patrol',t:0,target:null,vel:new V3(),cool:rand(4,9),by:null})}
  LIFE.next=rand(9,14);
}
function sendShark(t,by){let best=null,bd=1e9;for(const sh of LIFE.sharks){if(sh.state!=='patrol')continue;const d=sh.m.position.distanceTo(t.root.position);if(d<bd){bd=d;best=sh}}
  if(!best)return false;best.state='hunt';best.target=t;best.t=0;best.by=by||null;return true}
const _sv=new V3(),_sq=new V3(),_sm=new THREE.Matrix4(),_sQ=new THREE.Quaternion(),_sS=new V3(1,1,1);
function updateSeaLife(dt,t){
  if(!LIFE.fish&&!LIFE.sharks.length)return;
  for(const mt of LIFE.mantas){mt.a+=dt*mt.sp;const x=mt.c.x+Math.cos(mt.a)*mt.r,z=mt.c.z+Math.sin(mt.a)*mt.r,y=mt.c.y+Math.sin(mt.a*2)*1.2;_sv.set(x+Math.cos(mt.a+Math.sign(mt.sp)*1.57)*3,y,z+Math.sin(mt.a+Math.sign(mt.sp)*1.57)*3);mt.m.position.set(x,y,z);mt.m.lookAt(_sv);mt.m.rotateZ(Math.sin(t*.7+mt.r)*.2)}
  if(FOGU.uUnder.value.w>0)for(const v of LIFE.vents)if(Math.random()<dt*3)BUB.emit(v.x+rand(-.3,.3),v.y+.3,v.z+rand(-.3,.3),rand(-.2,.2),rand(1.5,2.6),rand(-.2,.2),1,1,1,rand(.12,.4),6,-.4,.9,.04);
  const S=W.S;
  // cardumes
  if(LIFE.fish){LIFE.schools.forEach((sch,k)=>{sch.prev.copy(sch.pos);const a=t*sch.sp+sch.ph;const s=S[sch.i];
      if(sch.cross){const sw=Math.sin(a*1.3)*16;sch.pos.copy(s.p).addScaledVector(s.sd,sw).addScaledVector(s.t,Math.cos(a)*6);sch.pos.y=s.p.y+Math.sin(a*2)*1.2}
      else{sch.pos.set(sch.anchor.x+Math.cos(a)*sch.rad,sch.anchor.y+Math.sin(a*2.1)*1.5,sch.anchor.z+Math.sin(a)*sch.rad)}
      _sv.subVectors(sch.pos,sch.prev);if(_sv.lengthSq()<1e-6)_sv.set(1,0,0);_sv.normalize();_sQ.setFromUnitVectors(new V3(0,0,1),_sv);
      sch.members.forEach((mm,j)=>{_sq.copy(mm.o).applyQuaternion(_sQ);_sq.x+=Math.sin(t*1.7+mm.w)*.4;_sq.y+=Math.cos(t*1.3+mm.w)*.3;_sq.add(sch.pos);_sm.compose(_sq,_sQ,_sS.setScalar(.95));LIFE.fish.setMatrixAt(k*LIFE.per+j,_sm)});
      if(G.state==='race')for(const r of racers.values()){if(r.finished||r.mod!=='nado')continue;const d=_sq.copy(r.root.position).setY(r.root.position.y+1.5).distanceTo(sch.pos);const last=sch.hit.get(r)||-99;
        if(d<4.2&&G.clock-last>8){sch.hit.set(r,G.clock);if(r.fx.shield>0)continue;r.fx.slow=Math.max(r.fx.slow,1.3);if(!r.isBot||Math.random()<.35)feed(`🐟 <b>${esc(r.name)}</b> nadou no meio de um cardume e perdeu ritmo`)}}});
    LIFE.fish.instanceMatrix.needsUpdate=true}
  // tubarões
  if(G.state==='race'&&LIFE.sharks.length){LIFE.next-=dt;if(LIFE.next<=0){LIFE.next=rand(8,14);const sw=[...racers.values()].filter(o=>!o.finished&&o.fx.stun<=0&&isUnderSwim(o));if(sw.length){sw.sort((a,b)=>b.s-a.s);const pickR=Math.random()<.55?sw[0]:pick(sw);sendShark(pickR,null)}}}
  for(const sh of LIFE.sharks){const m=sh.m;sh.t+=dt;
    if(sh.state==='patrol'){sh.ang+=dt*.32;_sv.set(sh.anchor.x+Math.cos(sh.ang)*10,sh.anchor.y+Math.sin(sh.ang*1.7)*1.4,sh.anchor.z+Math.sin(sh.ang)*10);steer(sh,_sv,7,dt)}
    else if(sh.state==='hunt'){const r=sh.target;if(!r||r.finished||!racers.has(r.login)||!isUnderSwim(r)||sh.t>9){sh.state='leave';sh.t=0;continue}
      _sv.copy(r.root.position);_sv.y+=1.5;steer(sh,_sv,Math.max(r.v+14,24),dt);
      if(m.position.distanceTo(_sv)<2.4){
        if(r.fx.shield>0){r.fx.shield=0;sh.state='leave';sh.t=0;burst(_sv,30,[.3,.9,1.6],8,1,.6,0,0,GLOW);feed(`🛡️ O escudo de <b>${esc(r.name)}</b> espantou o tubarão`)}
        else{sh.state='carry';sh.t=0;stun(r,2.6);sfx('shark',1);CAM.shake=Math.max(CAM.shake,.6);spotlight(r);burst(_sv,40,[.85,.95,1.05],6,.4,1.4,-2.5,0);
          feed(sh.by?`🦈 O tubarão de ${esc(sh.by.name)} PEGOU <b>${esc(r.name)}</b> e arrastou para trás!`:`🦈 Um TUBARÃO pegou <b>${esc(r.name)}</b> e arrastou para trás!`)}}}
    else if(sh.state==='carry'){const r=sh.target;if(!r||!racers.has(r.login)){sh.state='leave';continue}
      const segA=W.bounds[r.m&&TA?trackAt(r.s,CTA).seg:0].a*W.L;r.s=Math.max(r.s-dt*16,segA+30);r.fx.stun=Math.max(r.fx.stun,.3);
      _sv.copy(r.root.position);_sv.y+=1.5;trackAt(r.s,CTA);m.position.copy(_sv).addScaledVector(CTA.tan,-.4);m.position.y+=.2;
      _sq.copy(m.position).addScaledVector(CTA.tan,-1);m.lookAt(_sq);m.rotateY(Math.sin(t*16)*.35);
      if(Math.random()<.5)PUFF.emit(_sv.x+rand(-.8,.8),_sv.y+rand(0,1),_sv.z+rand(-.8,.8),rand(-.5,.5),rand(1,3),rand(-.5,.5),.85,.95,1.05,rand(.15,.35),1.3,-2,.8,0);
      if(sh.t>1.7){sh.state='leave';sh.t=0}}
    else{_sv.copy(sh.anchor);_sv.y-=2;steer(sh,_sv,12,dt);if(sh.t>4){sh.state='patrol';sh.t=0;sh.target=null}}
  }
}
function steer(sh,target,speed,dt){const m=sh.m;_sq.subVectors(target,m.position);const d=_sq.length();if(d<.01)return;_sq.multiplyScalar(1/d);
  sh.vel.lerp(_sq.multiplyScalar(speed),1-Math.exp(-dt*2.2));const step=sh.vel.length()*dt;if(step>d)sh.vel.setLength(d/dt);
  m.position.addScaledVector(sh.vel,dt);if(sh.vel.lengthSq()>.01){_sv.copy(m.position).add(sh.vel);m.lookAt(_sv)}}
