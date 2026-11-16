// ======================================================================
// RIDERS
// ======================================================================
function colGeo(g,hex){const c=new THREE.Color(hex);const n=g.attributes.position.count;const a=new Float32Array(n*3);for(let i=0;i<n;i++){a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute('color',new THREE.BufferAttribute(a,3));return g}
function mergeCol(list){return mergeGeometries(list.map(([g,c])=>colGeo(g.index?g.toNonIndexed():g,c)))}
const T=(g,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{g.scale(sx,sy,sz);if(rx)g.rotateX(rx);if(ry)g.rotateY(ry);if(rz)g.rotateZ(rz);g.translate(x,y,z);return g};
const M_GOG=new THREE.MeshPhysicalMaterial({color:0x101216,metalness:.9,roughness:.06,iridescence:1,iridescenceIOR:1.7,iridescenceThicknessRange:[250,900],clearcoat:1});
const M_METAL=new THREE.MeshStandardMaterial({color:0xc7ccd4,roughness:.22,metalness:1});
const M_RUBBER=new THREE.MeshStandardMaterial({color:0x17181b,roughness:.92,metalness:0});
const M_GOLD=new THREE.MeshStandardMaterial({color:0xd4a72c,roughness:.25,metalness:1});
const M_FLAME=new THREE.MeshBasicMaterial({color:new THREE.Color(4,1.6,.4),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false,fog:false});
const M_SHIELD=new THREE.ShaderMaterial({uniforms:{uTime:FOGU.uTime},transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,
  vertexShader:`varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vN=normalize(normalMatrix*normal);vec4 mv=modelViewMatrix*vec4(position,1.);vV=-mv.xyz;vP=position;gl_Position=projectionMatrix*mv;}`,
  fragmentShader:`uniform float uTime;varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.5);float hex=smoothstep(.85,1.,abs(sin(vP.y*14.+uTime*3.))*abs(sin(vP.x*12.+vP.z*12.)));gl_FragColor=vec4(vec3(.2,.85,1.5)*(f*1.6+hex*.25+.04),f*.9+.08);}`});
const M_STAR=new THREE.MeshBasicMaterial({color:new THREE.Color(2.5,2.1,.4),fog:false});
const RG={tube:new THREE.CylinderGeometry(1,1,1,10),bflame:new THREE.ConeGeometry(.24,1.8,16,1,true).rotateX(-Math.PI/2).translate(0,0,-.9),flame:new THREE.ConeGeometry(.1,.9,12,1,true).rotateX(Math.PI).translate(0,-.45,0),
  shield:new THREE.SphereGeometry(1.4,32,20),star:new THREE.OctahedronGeometry(.11,0),badge:new THREE.CircleGeometry(.11,28),badgeRing:new THREE.CircleGeometry(.13,28)};
function tube(a,b,r,mat){const d=new V3().subVectors(b,a),len=d.length(),m=new THREE.Mesh(RG.tube,mat);m.scale.set(r,len,r);m.position.copy(a).addScaledVector(d,.5);m.quaternion.setFromUnitVectors(UP,d.normalize());m.castShadow=true;return m}
function tubeGeo(a,b,r,seg=8){const d=new V3().subVectors(b,a),len=d.length();const g=new THREE.CylinderGeometry(r,r,len,seg);const q=new THREE.Quaternion().setFromUnitVectors(UP,d.clone().normalize());g.applyQuaternion(q);g.translate(a.x+d.x/2,a.y+d.y/2,a.z+d.z/2);return g}
function mk(g,m,parent,cast=true){const o=new THREE.Mesh(g,m);o.castShadow=cast;o.receiveShadow=false;if(parent)parent.add(o);return o}
function bentBox(w,h,l,tipF,tipB){const g=new RoundedBoxGeometry(w,h,l,3,Math.min(h*.45,w*.2));const p=g.attributes.position;for(let i=0;i<p.count;i++){const z=p.getZ(i),hz=l/2;const f=Math.max(0,z-(hz-l*.16))/(l*.16),b=Math.max(0,-z-(hz-l*.16))/(l*.16);p.setY(i,p.getY(i)+f*f*tipF+b*b*tipB)}g.computeVertexNormals();return g}

const lathe=(prof,seg=20)=>new THREE.LatheGeometry(prof.map(([r,y])=>new THREE.Vector2(Math.max(r,.001),y)),seg);
// corpo do piloto: uma malha contínua com pele (skinning) presa aos ossos, sem emendas em ombro, cotovelo, quadril e joelho
const ssj=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)};
function bodyGeo(cl){const P=[],UV=[],C=[],SI=[],SW=[],I=[];const col=new THREE.Color();
  const tube=(rings,seg,n,place,colF,wF)=>{const base=P.length/3;
    for(const rg of rings)for(let k=0;k<seg;k++){const a=k/seg*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),sx=Math.sign(ca)*Math.pow(Math.abs(ca),2/n),sz=Math.sign(sa)*Math.pow(Math.abs(sa),2/n);
      const v=place(rg,sx,sz);P.push(v[0],v[1],v[2]);UV.push((1-Math.abs(k/seg*2-1))*2,v[1]*3);colF(col,v[1],sx,sz);C.push(col.r,col.g,col.b);const w=wF(v[1]);SI.push(w[0],w[2],0,0);SW.push(w[1],w[3],0,0)}
    for(let ri=0;ri<rings.length-1;ri++)for(let k=0;k<seg;k++){const a=base+ri*seg+k,b=base+ri*seg+(k+1)%seg,c=a+seg,d=b+seg;I.push(a,b,c,b,d,c)}
    for(const[ri,up]of[[0,1],[rings.length-1,0]]){const o=P.length/3;let cx=0,cy=0,cz=0;for(let k=0;k<seg;k++){const j=(base+ri*seg+k)*3;cx+=P[j];cy+=P[j+1];cz+=P[j+2]}cx/=seg;cy/=seg;cz/=seg;
      const wj=(base+ri*seg)*4;P.push(cx,cy+(up?.004:-.004),cz);UV.push(.5,0);C.push(C[(base+ri*seg)*3],C[(base+ri*seg)*3+1],C[(base+ri*seg)*3+2]);SI.push(SI[wj],SI[wj+1],0,0);SW.push(SW[wj],SW[wj+1],0,0);
      for(let k=0;k<seg;k++){const j=(base+ri*seg+k);P.push(P[j*3],P[j*3+1],P[j*3+2]);UV.push(0,0);C.push(C[j*3],C[j*3+1],C[j*3+2]);SI.push(SI[j*4],SI[j*4+1],0,0);SW.push(SW[j*4],SW[j*4+1],0,0)}
      for(let k=0;k<seg;k++){const a=o+1+k,b=o+1+(k+1)%seg;if(up)I.push(o,b,a);else I.push(o,a,b)}}};
  // tronco (quadril → pescoço)
  tube([[.645,.062,.05,.052],[.62,.092,.06,.064],[.59,.152,.082,.092],[.55,.182,.102,.11],[.5,.2,.118,.12],[.44,.203,.128,.118],[.36,.192,.13,.11],[.28,.176,.122,.104],[.2,.162,.11,.1],[.13,.158,.102,.102],[.06,.17,.108,.118],[0,.177,.114,.13],[-.06,.168,.112,.128],[-.11,.14,.1,.11],[-.135,.085,.07,.075]],26,2.3,
    (r,sx,sz)=>{const j=ssj(.07,.13,r[0])*(1-ssj(.58,.64,r[0]));return[sx*(r[1]+.014*j),r[0],sz>0?sz*(r[2]+.012*j):sz*(r[3]+.012*j)]},
    (c,y,sx,sz)=>{if(y<.088)c.copy(cl.pant);else if(y>.47)c.copy(cl.acc);else if(Math.abs(sx)>.86&&y>.12)c.copy(cl.prim2);else if(sz>.35&&y>.355&&y<.39)c.copy(cl.acc);else c.copy(cl.prim)},
    y=>{if(y<.04)return[0,1,1,0];if(y>.2)return[1,1,0,0];const t=ssj(.04,.2,y);return[0,1-t,1,t]});
  // pernas
  for(const[sd,li,si]of[[1,3,4],[-1,5,6]])tube([[.045,.098,0],[-.03,.1,0],[-.13,.095,.005],[-.24,.085,.007],[-.34,.072,.005],[-.41,.063,.01],[-.47,.062,0],[-.55,.066,-.012],[-.65,.059,-.008],[-.74,.049,0],[-.81,.044,0]],16,2,
    (r,sx,sz)=>[sd*.095+sx*r[1]*.97,r[0],r[2]+sz*r[1]*1.03],
    (c,y,sx)=>{c.copy(sx*sd>.93&&y<.02?cl.acc:cl.pant)},
    y=>{if(y>-.2){const w=ssj(.05,-.1,y);return[0,1-w,li,w]}const w=ssj(-.36,-.48,y);return[li,1-w,si,w]});
  // braços
  for(const[sd,ai,fi]of[[1,7,8],[-1,9,10]])tube([[.618,.034,-.022],[.598,.058,-.01],[.566,.07,0],[.52,.068,.004],[.46,.061,.002],[.39,.056,0],[.32,.051,0],[.268,.046,0],[.22,.048,0],[.15,.047,0],[.07,.041,0],[.0,.034,0],[-.03,.032,0]],16,2,
    (r,sx,sz)=>{const j=r[0]>.03?.007:0;return[sd*(.235+r[2])+sx*(r[1]+j),r[0],sz*(r[1]+j)*.92]},
    (c,y,sx)=>{if(y<.03)c.copy(cl.dark);else if(y>.5)c.copy(cl.acc);else if(sx*sd>.93)c.copy(cl.acc);else c.copy(cl.prim)},
    y=>{if(y>.4){const w=ssj(.61,.49,y);return[1,1-w,ai,w]}const w=ssj(.29,.2,y);return[ai,1-w,fi,w]});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));
  g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));g.setIndex(I);g.computeVertexNormals();return g}
// formato de cabeça: maxilar mais estreito, queixo, nuca mais cheia
function headShape(g){const p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const r=Math.hypot(x,y,z)||1,ny=y/r,nz=z/r;
  x*=.93*(1-.26*Math.max(0,-ny)*Math.max(0,-ny));if(ny<-.35&&nz>0)z+=.012*r*10*(Math.min(1,(-ny-.35)*2.2))*nz*.1;if(nz<0)z*=1+.07*(-nz);if(ny>.5)y*=1-.04*(ny-.5);
  if(Math.abs(ny)<.25&&nz>.6)z*=1+.025*(1-Math.abs(ny)/.25);p.setXYZ(i,x,y,z)}g.computeVertexNormals();return g}
function makeRider(color,name,pal){
  const c1=new THREE.Color(color),c2=pal&&pal.acc?new THREE.Color(pal.acc):c1.clone().offsetHSL(.08,-.1,.18),dark=0x1b1e25,pant=pal&&pal.pant?new THREE.Color(pal.pant).getHex():c1.clone().offsetHSL(0,-.4,-.33).getHex(),skin=pal&&pal.skin?pal.skin:pick([0xe0ac86,0xc98f68,0xa86f4c,0x7a4e33,0xf1c6a5]);
  const acc=c2.getHex(),prim=c1.getHex(),prim2=c1.clone().offsetHSL(0,0,-.1).getHex();
  const bodyMat=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.8,metalness:0,sheen:.85,sheenRoughness:.45,sheenColor:new THREE.Color(.5,.5,.5),normalMap:CLOTH,normalScale:new THREE.Vector2(.65,.65)});
  const helmMat=new THREE.MeshPhysicalMaterial({color:prim,roughness:.2,metalness:.15,clearcoat:1,clearcoatRoughness:.05});
  const paintMat=new THREE.MeshPhysicalMaterial({color:prim,roughness:.3,metalness:.35,clearcoat:1,clearcoatRoughness:.1});
  const wingMat=new THREE.MeshPhysicalMaterial({color:c1.clone().offsetHSL(0,0,-.08),roughness:.6,sheen:.8,side:THREE.DoubleSide});
  wingMat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fx=abs(position.x)-.2;transformed.z+=sin(uTime*34.+position.x*9.+position.y*6.)*.018*max(fx,0.)+sin(uTime*21.+position.y*8.)*.008;').replace('#include <common>','#include <common>\nuniform float uTime;')};
  wingMat.customProgramCacheKey=()=>'wing';
  const root=new THREE.Group(),bank=new THREE.Group(),spin=new THREE.Group(),inner=new THREE.Group();
  root.add(bank);bank.add(spin);spin.position.y=1;spin.add(inner);inner.position.y=-1;
  const pelvis=new THREE.Group();pelvis.rotation.order='YXZ';inner.add(pelvis);
  mk(mergeCol([[T(new THREE.TorusGeometry(.15,.02,6,30),0,.075,0,Math.PI/2,0,0,1.2,1,.84),dark],[T(new RoundedBoxGeometry(.07,.05,.03,2,.01),0,.075,.125),acc]]),bodyMat,pelvis);
  const spine=new THREE.Group();spine.position.y=.08;spine.rotation.order='YXZ';pelvis.add(spine);
  mk(mergeCol([
    [T(new THREE.TorusGeometry(.152,.022,6,30),0,.02,0,Math.PI/2,0,0,1.24,1,.8),acc],
    [T(new THREE.BoxGeometry(.012,.5,.014),0,.27,.143),dark],
    [T(new THREE.BoxGeometry(.035,.2,.012),.085,.36,.136,0,0,.15),acc],[T(new THREE.BoxGeometry(.035,.2,.012),-.085,.36,.136,0,0,-.15),acc],
    [T(new RoundedBoxGeometry(.09,.06,.02,2,.008),.095,.12,.135),prim2],[T(new RoundedBoxGeometry(.09,.06,.02,2,.008),-.095,.12,.135),prim2],
    [T(new THREE.TorusGeometry(.085,.033,8,24),0,.545,0,Math.PI/2),acc],
    [T(new THREE.TorusGeometry(.11,.042,8,20,Math.PI),0,.5,-.08,-.5,0,Math.PI),prim2],
    [T(new RoundedBoxGeometry(.3,.4,.15,3,.045),0,.3,-.215),dark],[T(new RoundedBoxGeometry(.24,.14,.05,2,.02),0,.22,-.3),acc],[T(new RoundedBoxGeometry(.2,.04,.04,2,.015),0,.47,-.24),acc],
    [T(new THREE.BoxGeometry(.035,.38,.025),.105,.32,-.12,.18),dark],[T(new THREE.BoxGeometry(.035,.38,.025),-.105,.32,-.12,.18),dark],[T(new THREE.BoxGeometry(.2,.03,.02),0,.25,.14),dark],
  ]),bodyMat,spine);
  const neck=new THREE.Group();neck.position.y=.56;spine.add(neck);
  mk(mergeCol([[T(new THREE.CylinderGeometry(.05,.058,.1,12),0,.03,0),skin],[T(headShape(new THREE.SphereGeometry(.1,28,22)),0,.15,.01,0,0,0,1,1.12,1.06),skin],[T(new THREE.CylinderGeometry(.006,.016,.04,4,1).rotateX(-.35),0,.13,.113,0,Math.PI/4),skin],[T(new THREE.SphereGeometry(.022,8,6),.092,.15,-.005,0,0,0,.55,1,.9),skin],[T(new THREE.SphereGeometry(.022,8,6),-.092,.15,-.005,0,0,0,.55,1,.9),skin]]),bodyMat,neck);
  mk(T(mergeGeometries([new THREE.SphereGeometry(.135,28,8,0,Math.PI*2,0,Math.PI*.3),new THREE.SphereGeometry(.135,28,10,Math.PI/2+.9,Math.PI*2-1.8,Math.PI*.3,Math.PI*.3)]),0,.165,-.008,0,0,0,1.06,1.04,1.18),helmMat,neck);
  const faceM=new THREE.MeshStandardMaterial({roughness:.62,metalness:0});{const ft=new THREE.CanvasTexture(faceCanvas(null,skin));ft.colorSpace=THREE.SRGBColorSpace;faceM.map=ft}
  mk(T(headShape(new THREE.SphereGeometry(.1015,30,20,Math.PI/2-.95,1.9,Math.PI*.3,Math.PI*.46)),0,.15,.01,0,0,0,1,1.12,1.06),faceM,neck,false);
  mk(mergeCol([[T(new THREE.BoxGeometry(.016,.012,.15),.04,.295,-.02),dark],[T(new THREE.BoxGeometry(.016,.012,.15),-.04,.295,-.02),dark],[T(new THREE.BoxGeometry(.016,.012,.12),0,.302,-.03),dark],[T(new THREE.BoxGeometry(.2,.03,.05),0,.245,.14,-.35),dark]]),bodyMat,neck,false);
  const gog=mk(T(new THREE.CapsuleGeometry(.042,.12,6,16),0,0,0,0,0,Math.PI/2,1,1,.55),M_GOG,neck);gog.position.set(0,.15,.105);
  mk(mergeCol([[T(new THREE.TorusGeometry(.128,.013,6,30,Math.PI*1.25),0,.15,0,Math.PI/2,0,Math.PI*-.125),acc],[T(new THREE.TorusGeometry(.09,.006,4,20,Math.PI),0,.08,.02,0,Math.PI/2,Math.PI),dark]]),bodyMat,neck,false);
  const arm=(x)=>{const a=new THREE.Group();a.position.set(x,.465,0);spine.add(a);
    const b=new THREE.Group();b.position.y=-.3;a.add(b);
    const sx=Math.sign(x);mk(mergeCol([[T(new THREE.TorusGeometry(.038,.011,6,16),0,-.255,0,Math.PI/2),dark],
      [T(new RoundedBoxGeometry(.074,.085,.046,2,.018),0,-.305,.006),dark],[T(new RoundedBoxGeometry(.07,.02,.04,2,.008),0,-.268,.014),acc],...[-.026,-.009,.009,.026].map((fx,k)=>[T(new THREE.CapsuleGeometry(.0115,.04-Math.abs(fx)*.4,3,8),fx,-.37+Math.abs(fx)*.25,.022,.45),dark]),[T(new THREE.CapsuleGeometry(.013,.032,3,8),sx*-.04,-.3,.03,.5,0,sx*.6),dark]]),bodyMat,b);return[a,b]};
  const[armL,foreL]=arm(.235),[armR,foreR]=arm(-.235);
  const leg=(x)=>{const a=new THREE.Group();a.position.set(x,0,0);pelvis.add(a);
    mk(mergeCol([[T(new RoundedBoxGeometry(.05,.08,.026,2,.008),Math.sign(x)*.092,-.2,.0,0,Math.PI/2*Math.sign(x)),pant]]),bodyMat,a);
    const b=new THREE.Group();b.position.y=-.42;a.add(b);
    mk(mergeCol([[T(new RoundedBoxGeometry(.105,.11,.04,2,.015),0,-.06,.058,-.1),dark],
      [T(new RoundedBoxGeometry(.12,.14,.29,3,.04),0,-.43,.045),dark],[T(new RoundedBoxGeometry(.126,.04,.3,2,.015),0,-.49,.045),acc],[T(new THREE.TorusGeometry(.055,.012,6,16),0,-.34,0,Math.PI/2),acc]]),bodyMat,b);
    const fin=mk(T(new RoundedBoxGeometry(.17,.012,.36,2,.005),0,-.5,.23),paintMat,b);fin.visible=false;return[a,b,fin]};
  const[legL,shinL,finL]=leg(.095),[legR,shinR,finR]=leg(-.095);
  {root.updateMatrixWorld(true);const sk=new THREE.Skeleton([pelvis,spine,neck,legL,shinL,legR,shinR,armL,foreL,armR,foreR]);
    const body=new THREE.SkinnedMesh(bodyGeo({prim:new THREE.Color(prim),prim2:new THREE.Color(prim2),acc:new THREE.Color(acc),pant:new THREE.Color(pant),dark:new THREE.Color(dark)}),bodyMat);
    body.castShadow=true;body.frustumCulled=false;inner.add(body);body.updateMatrixWorld(true);body.bind(sk,body.matrixWorld)}
  // vehicles
  const ski=new THREE.Group();inner.add(ski);
  const skiMat=new THREE.MeshPhysicalMaterial({color:prim,roughness:.25,metalness:.2,clearcoat:1});
  mk(bentBox(.085,.022,1.75,.12,.03),skiMat,ski).position.set(.13,.02,.12);mk(bentBox(.085,.022,1.75,.12,.03),skiMat,ski).position.set(-.13,.02,.12);
  const poleG=mergeGeometries([new THREE.CylinderGeometry(.011,.009,1.15,6).translate(0,-.55,0),new THREE.TorusGeometry(.045,.008,6,12).rotateX(Math.PI/2).translate(0,-1.0,0)]);
  const polesL=mk(poleG,M_METAL,foreL),polesR=mk(poleG,M_METAL,foreR);polesL.position.y=polesR.position.y=-.3;
  const board=new THREE.Group();inner.add(board);
  const bcol=c1.clone().offsetHSL(.5,0,0);
  const bg=bentBox(.3,.028,1.52,.07,.07);{const p=bg.attributes.position,cc=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const z=p.getZ(i),k=Math.sin(z*9)>.3?1:0;const col=k?c1:bcol;cc[i*3]=col.r;cc[i*3+1]=col.g;cc[i*3+2]=col.b}bg.setAttribute('color',new THREE.BufferAttribute(cc,3))}
  mk(bg,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.3,clearcoat:1}),board).position.y=.03;
  for(const z of[.24,-.24])mk(T(new RoundedBoxGeometry(.24,.06,.14,2,.02),0,.07,z),M_RUBBER,board);
  const bike=new THREE.Group();inner.add(bike);
  const wheel=()=>{const w=new THREE.Group();mk(new THREE.TorusGeometry(.34,.048,12,48),M_RUBBER,w);mk(new THREE.TorusGeometry(.3,.014,6,40),M_METAL,w);
    const sp=[];for(let i=0;i<16;i++){const a=i/16*Math.PI*2;sp.push(tubeGeo(new V3(0,0,0),new V3(Math.cos(a)*.3,Math.sin(a)*.3,(i%2?.02:-.02)),.004,4))}sp.push(new THREE.CylinderGeometry(.03,.03,.1,10).rotateX(Math.PI/2));
    mk(mergeGeometries(sp),M_METAL,w,false);mk(new THREE.CylinderGeometry(.08,.08,.006,20).rotateX(Math.PI/2).translate(0,0,.04),M_METAL,w,false);w.rotation.y=Math.PI/2;return w};
  const wF=wheel(),wR=wheel();wF.position.set(0,.34,.56);wR.position.set(0,.34,-.56);bike.add(wF,wR);
  const Vv=(x,y,z)=>new V3(x,y,z);
  const bb=Vv(0,.31,-.02),stp=Vv(0,.88,-.22),ht=Vv(0,.86,.4),htb=Vv(0,.7,.44),bars=Vv(0,1.02,.36);
  [[bb,stp,.032],[stp,ht,.03],[bb,htb,.038],[htb,ht,.04],[stp,Vv(.04,.36,-.52),.016],[stp,Vv(-.04,.36,-.52),.016],[bb,Vv(.04,.34,-.54),.018],[bb,Vv(-.04,.34,-.54),.018]].forEach(([a,b,r])=>bike.add(tube(a,b,r,paintMat)));
  bike.add(tube(Vv(.05,.86,.4),Vv(.05,.36,.55),.022,M_GOLD),tube(Vv(-.05,.86,.4),Vv(-.05,.36,.55),.022,M_GOLD),tube(ht,bars,.022,M_RUBBER),tube(Vv(-.36,1.03,.36),Vv(.36,1.03,.36),.016,M_RUBBER));
  mk(T(new RoundedBoxGeometry(.13,.05,.28,2,.02),0,.92,-.24),M_RUBBER,bike);
  mk(T(new THREE.CylinderGeometry(.1,.1,.012,24),.05,.31,-.02,0,0,Math.PI/2),M_METAL,bike);
  const crank=new THREE.Group();crank.position.copy(bb);bike.add(crank);mk(T(new THREE.BoxGeometry(.02,.17,.03),.08,-.085,0),M_METAL,crank);mk(T(new THREE.BoxGeometry(.02,.17,.03),-.08,.085,0),M_METAL,crank);
  const wings=mk(wingGeo(),wingMat,spine,false);
  const jets=new THREE.Group();spine.add(jets);
  for(const x of[.13,-.13]){mk(T(new THREE.CylinderGeometry(.075,.09,.5,16),x,.3,-.3),M_METAL,jets);mk(T(new THREE.CylinderGeometry(.095,.07,.08,16),x,.02,-.3),M_RUBBER,jets);const f=new THREE.Mesh(RG.flame,M_FLAME);f.position.set(x,0,-.3);jets.add(f)}
  const boat=new THREE.Group();inner.add(boat);let oarL,oarR;
  {const hull=new THREE.LatheGeometry([[0,-3.6],[.12,-3.0],[.24,-1.6],[.27,0],[.25,1.5],[.14,3.0],[0,3.7]].map(([r2,y2])=>new THREE.Vector2(Math.max(r2,.001),y2)),20);hull.rotateX(Math.PI/2);hull.scale(1,.5,1);
    mk(hull,new THREE.MeshPhysicalMaterial({color:0xf3f5f8,roughness:.22,clearcoat:1}),boat).position.y=.08;mk(new THREE.BoxGeometry(.32,.03,6.4),paintMat,boat).position.y=.15;
    mk(new THREE.SphereGeometry(.07,10,8),new THREE.MeshStandardMaterial({color:0xffffff,roughness:.5}),boat).position.set(0,.13,3.72);mk(new THREE.BoxGeometry(.012,.14,.22),M_RUBBER,boat).position.set(0,-.06,-2.4);mk(new RoundedBoxGeometry(.42,.03,1.2,1,.01),new THREE.MeshStandardMaterial({color:0x2a2f38,roughness:.4}),boat).position.set(0,.16,.05);
    const seatM=new THREE.MeshStandardMaterial({color:0x22262e,roughness:.6});mk(new RoundedBoxGeometry(.3,.06,.36,2,.02),seatM,boat).position.set(0,.3,0);
    const oar=side=>{const g=new THREE.Group();g.position.set(.84*side,.44,.05);boat.add(g);mk(new THREE.CylinderGeometry(.019,.019,3.2,6).rotateZ(Math.PI/2).translate(side*.75,0,0),M_METAL,g);const bl=mk(new RoundedBoxGeometry(.52,.17,.03,1,.012),paintMat,g);bl.position.set(side*2.22,0,0);
      boat.add(tube(new V3(.14*side,.18,.3),new V3(.84*side,.44,.05),.014,M_METAL),tube(new V3(.14*side,.18,-.25),new V3(.84*side,.44,.05),.014,M_METAL));return g};
    oarL=oar(1);oarR=oar(-1)}
  const surf=new THREE.Group();inner.add(surf);
  {mk(bentBox(.64,.1,2.7,.14,.03),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.3,clearcoat:1}),surf).position.y=.05;mk(new THREE.BoxGeometry(.56,.012,1.4),new THREE.MeshStandardMaterial({color:acc,roughness:.9}),surf).position.set(0,.106,-.2);
    mk(new THREE.BoxGeometry(.02,.36,.26),M_RUBBER,surf).position.set(0,-.16,-1.1);
    const rig=new THREE.Group();rig.position.set(0,.12,.4);rig.rotation.set(-.2,0,.34);surf.add(rig);mk(new THREE.CylinderGeometry(.03,.045,4.6,8).translate(0,2.3,0),M_RUBBER,rig);
    const A=new V3(0,.4,0),B=new V3(0,4.5,0),C=new V3(0,1.55,-2.6),P2=[],I2=[],CC=[],NU=10,NV=6;const cP=new THREE.Color(prim),cA=new THREE.Color(acc),cW=new THREE.Color(0xf4f4f4);
    for(let i=0;i<=NU;i++)for(let j=0;j<=NV;j++){const u=i/NU,v=j/NV;const e=A.clone().lerp(B,u);const q=e.lerp(C,v);q.x+=Math.sin(v*Math.PI)*.28*(1-u*.5);P2.push(q.x,q.y,q.z);const band=u<.3?cP:u<.38?cW:u<.65?cA:u<.72?cW:cP;CC.push(band.r,band.g,band.b)}
    for(let i=0;i<NU;i++)for(let j=0;j<NV;j++){const a=i*(NV+1)+j,b2=a+1,c=a+NV+1,d=c+1;I2.push(a,c,b2,b2,c,d)}
    const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(P2,3));sg.setAttribute('color',new THREE.Float32BufferAttribute(CC,3));sg.setIndex(I2);sg.computeVertexNormals();
    mk(sg,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.45,side:THREE.DoubleSide,transparent:true,opacity:.93,sheen:.5}),rig,true);
    rig.add(tube(new V3(.12,1.55,0),new V3(0,1.55,-2.6),.022,M_RUBBER),tube(new V3(-.12,1.55,0),new V3(.02,1.55,-2.6),.022,M_RUBBER))}
  const vpole=new THREE.Group();vpole.position.set(0,1.05,.25);inner.add(vpole);mk(new THREE.CylinderGeometry(.02,.026,4.8,8).translate(0,2.1,0),new THREE.MeshPhysicalMaterial({color:0x1e6fff,roughness:.25,clearcoat:1}),vpole);vpole.visible=false;
  const skate=new THREE.Group();inner.add(skate);
  {const dg=bentBox(.25,.022,1.02,.035,.035);{const p=dg.attributes.position,cc=new Float32Array(p.count*3);for(let i=0;i<p.count;i++){const y=p.getY(i),z=p.getZ(i);const top=y>.004;const col=top?new THREE.Color(.05,.05,.055):(Math.abs(z)<.18?c1:Math.sin(z*14)>0?bcol:new THREE.Color(.95,.95,.95));cc[i*3]=col.r;cc[i*3+1]=col.g;cc[i*3+2]=col.b}dg.setAttribute('color',new THREE.BufferAttribute(cc,3))}
    mk(dg,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.55,clearcoat:.4}),skate).position.y=.115;
    const wm=new THREE.MeshPhysicalMaterial({color:acc,roughness:.35,clearcoat:.6,transparent:true,opacity:.92});
    for(const z of[.34,-.34]){mk(T(new RoundedBoxGeometry(.07,.025,.1,2,.008),0,.09,z),M_METAL,skate);mk(T(new THREE.CylinderGeometry(.018,.022,.04,8),0,.068,z),M_METAL,skate);mk(T(new THREE.CylinderGeometry(.009,.009,.27,6),0,.046,z,0,0,Math.PI/2),M_METAL,skate);
      for(const x of[-.12,.12])mk(T(new THREE.CylinderGeometry(.036,.036,.05,16),x,.036,z,0,0,Math.PI/2),wm,skate)}}
  skate.visible=false;
  const chute=new THREE.Group();chute.position.y=5.6;root.add(chute);
  {const NC=9,SP=5.8,CH=2.3,R=3.6,NX=NC*6,NZ=12,P2=[],C2=[],I2=[];const pal=[prim,prim,acc,0xf4f4f4,prim,0xf4f4f4,acc,prim,prim].map(c=>new THREE.Color(c));
    const thick=u=>.34*Math.sqrt(.05+u*.95)*Math.pow(1-u,1.1)+.012;
    const pt=(xu,u,top)=>{const x=(xu-.5)*SP,cf=(xu*NC)%1,bul=Math.sin(cf*Math.PI)*.075*(1-u*.4);const y=top?thick(u)*.62+bul:-thick(u)*.38-bul*.22;const a=x/SP*1.75,rr=R+y;return[Math.sin(a)*rr,Math.cos(a)*rr-R,CH*(.45-u)]};
    for(const top of[1,0]){const o=P2.length/3;for(let i=0;i<=NX;i++)for(let j=0;j<=NZ;j++){const xu=i/NX,u=j/NZ;P2.push(...pt(xu,u,top));const cell=Math.min(NC-1,Math.floor(xu*NC));const c=pal[cell];const k=top?1:.62;C2.push(c.r*k,c.g*k,c.b*k)}
      for(let i=0;i<NX;i++)for(let j=0;j<NZ;j++){const a=o+i*(NZ+1)+j,b=a+1,c=a+NZ+1,d=c+1;if(top)I2.push(a,c,b,b,c,d);else I2.push(a,b,c,b,d,c)}}
    for(let ci=0;ci<=NC;ci++){const xu=ci/NC,o=P2.length/3;for(let j=0;j<=NZ;j++){P2.push(...pt(xu,j/NZ,1),...pt(xu,j/NZ,0));C2.push(.82,.82,.84,.82,.82,.84)}for(let j=0;j<NZ;j++){const a=o+j*2;I2.push(a,a+1,a+2,a+1,a+3,a+2)}}
    const cgeo=new THREE.BufferGeometry();cgeo.setAttribute('position',new THREE.Float32BufferAttribute(P2,3));cgeo.setAttribute('color',new THREE.Float32BufferAttribute(C2,3));cgeo.setIndex(I2);cgeo.computeVertexNormals();
    const canopy=mk(cgeo,new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.5,sheen:1,sheenColor:new THREE.Color(.7,.7,.7),side:THREE.DoubleSide}),chute);canopy.name='canopy';
    const lp=[];const riser=(x,z)=>[x<0?-.24:.24,-3.95,z];
    for(let ci=0;ci<=NC;ci++)for(const u of[.14,.62]){const a=pt(ci/NC,u,0);const r2=riser(a[0],u<.5?.08:-.08);lp.push(...a,...r2)}
    for(const ci of[0,9]){const a=pt(ci/NC,1,0);lp.push(...a,ci<5?-.42:.42,-3.25,-.05)}
    const lg=new THREE.BufferGeometry();lg.setAttribute('position',new THREE.Float32BufferAttribute(lp,3));chute.add(new THREE.LineSegments(lg,new THREE.LineBasicMaterial({color:0x3a404a,transparent:true,opacity:.3})));
    const slider=mk(new THREE.PlaneGeometry(.8,.55).rotateX(-Math.PI/2),new THREE.MeshStandardMaterial({color:0x22262e,roughness:.7,side:THREE.DoubleSide}),chute,false);slider.position.y=-1.2;slider.name='slider';
    const pc=mk(new THREE.SphereGeometry(.34,16,8,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:acc,roughness:.6,side:THREE.DoubleSide}),chute,false);pc.position.set(0,1.05,-1.9);pc.rotation.x=-.9;
    const bg=new THREE.BufferGeometry();bg.setAttribute('position',new THREE.Float32BufferAttribute([0,.22,0,0,1.05,-1.9],3));chute.add(new THREE.LineSegments(bg,new THREE.LineBasicMaterial({color:0xe8e8e8})))}
  chute.visible=false;
  const bflame=new THREE.Mesh(RG.bflame,M_FLAME);bflame.position.set(0,1.1,-.5);root.add(bflame);
  const shield=new THREE.Mesh(RG.shield,M_SHIELD);shield.position.y=1;root.add(shield);
  const stars=new THREE.Group();stars.position.y=2.15;root.add(stars);for(let k=0;k<4;k++){const s=new THREE.Mesh(RG.star,M_STAR);const a=k/4*Math.PI*2;s.position.set(Math.cos(a)*.35,0,Math.sin(a)*.35);stars.add(s)}
  const badgeM=new THREE.MeshStandardMaterial({roughness:.45,transparent:true}),ringM=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.35});
  const bk=mk(RG.badgeRing,ringM,spine,false);bk.position.set(0,.3,-.292);bk.rotation.y=Math.PI;
  const bkI=mk(RG.badge,badgeM,spine,false);bkI.position.set(0,.3,-.294);bkI.rotation.y=Math.PI;
  const hb=mk(new THREE.CircleGeometry(.07,24),badgeM,neck,false);hb.position.set(0,.2,-.158);hb.rotation.set(-.3,Math.PI,0);
  const cb=mk(new THREE.CircleGeometry(.095,28),badgeM,spine,false);cb.position.set(0,.37,.146);
  const badgeParts=[bk,bkI,hb,cb];badgeParts.forEach(o=>o.visible=false);
  const tag=nameTag(name,color);tag.position.y=2.9;root.add(tag);
  root.scale.setScalar(1.5);
  return{root,bank,spin,pelvis,spine,neck,armL,armR,foreL,foreR,legL,legR,shinL,shinR,fins:[finL,finR],vpole,skate,chute,boat,oarL,oarR,surf,faceM,gog,skin,ski,polesL,polesR,board,bike,wF,wR,crank,wings,jets,bflame,shield,stars,tag,badgeM,badgeParts,
    bodyMat,helmMat,paintMat,wingMat,skiMat,mats:[bodyMat,helmMat,paintMat,wingMat,skiMat,badgeM,ringM,faceM]};
}
function wingGeo(){
  // membrane in spine-local XY plane (arms spread along X), subdivided for flutter
  const P=[],I=[];const NX=10,NY=6;
  const add=(pts)=>{const o=P.length/3;for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){const u=i/NX,v=j/NY;const top=new V3().lerpVectors(pts[0],pts[1],u),bot=new V3().lerpVectors(pts[3],pts[2],u);const p=new V3().lerpVectors(top,bot,v);P.push(p.x,p.y,p.z)}
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=o+j*(NX+1)+i,b=a+1,c=a+NX+1,d=c+1;I.push(a,c,b,b,c,d)}};
  add([new V3(.18,.5,-.02),new V3(.98,.4,-.02),new V3(.92,.26,-.02),new V3(.16,-.12,-.02)]);
  add([new V3(-.18,.5,-.02),new V3(-.98,.4,-.02),new V3(-.92,.26,-.02),new V3(-.16,-.12,-.02)]);
  add([new V3(-.13,-.08,-.02),new V3(.13,-.08,-.02),new V3(.3,-.95,-.02),new V3(-.3,-.95,-.02)]);
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();return g}
function tagTex(name,color,img){
  return cTex(640,128,(x,w,h)=>{x.fillStyle='rgba(8,12,24,.78)';x.beginPath();x.roundRect(60,22,w-64,h-44,22);x.fill();
    x.fillStyle=color;x.beginPath();x.arc(64,64,62,0,Math.PI*2);x.fill();
    x.save();x.beginPath();x.arc(64,64,54,0,Math.PI*2);x.clip();
    if(img)drawCover(x,img,10,10,108,108);else{x.fillStyle='#222';x.fillRect(10,10,108,108);x.font='800 56px Rubik, sans-serif';x.fillStyle=color;x.textAlign='center';x.textBaseline='middle';x.fillText(name[0].toUpperCase(),64,68)}
    x.restore();x.font='800 50px Rubik, sans-serif';x.fillStyle='#fff';x.textAlign='left';x.textBaseline='middle';let s=name;while(x.measureText(s).width>w-160&&s.length>3)s=s.slice(0,-1);x.fillText(s,140,66)});
}
function drawCover(x,img,dx,dy,dw,dh){const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,k=Math.max(dw/iw,dh/ih);x.drawImage(img,dx+(dw-iw*k)/2,dy+(dh-ih*k)/2,iw*k,ih*k)}
function nameTag(name,color){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tagTex(name,color,null),depthTest:false,depthWrite:false,transparent:true,fog:false}));sp.scale.set(4.4,.88,1);sp.renderOrder=20;return sp}
function setVehicle(r,mod){const m=r.m;m.ski.visible=m.polesL.visible=m.polesR.visible=mod==='ski';m.board.visible=mod==='snowboard';m.bike.visible=mod==='bike';m.wings.visible=mod==='wingsuit'||mod==='rocket';m.jets.visible=mod==='rocket';m.fins.forEach(f=>f.visible=mod==='nado');m.vpole.visible=mod==='vara';m.boat.visible=mod==='remo';m.surf.visible=mod==='windsurf';m.skate.visible=mod==='skate';if(mod!=='paraquedas')m.chute.visible=false}
function poseRider(r,t,standing){
  const m=r.m,mod=r.mod,P=m.pelvis,Sp=m.spine;
  P.rotation.set(0,0,0);P.position.set(0,.93,0);Sp.rotation.set(0,0,0);m.neck.rotation.set(0,0,0);
  for(const l of[m.armL,m.armR,m.foreL,m.foreR,m.legL,m.legR,m.shinL,m.shinR])l.rotation.set(0,0,0);
  const sp=clamp(r.v/30,0,1.5),br=Math.sin(t*2+r.phase)*.02;
  const crouch=(a)=>{m.legL.rotation.x=m.legR.rotation.x=-a;m.shinL.rotation.x=m.shinR.rotation.x=a*2;P.position.y=.88*Math.cos(a)+.08};
  if(mod==='ski'){const a=.42+sp*.12+Math.sin(t*3.2+r.phase)*.04;crouch(a);Sp.rotation.x=.35+sp*.1;m.neck.rotation.x=-.35;
    const sw=Math.sin(t*3+r.phase)*.2;m.armL.rotation.x=-.45+sw;m.armR.rotation.x=-.45-sw;m.foreL.rotation.x=m.foreR.rotation.x=-.7;m.armL.rotation.z=.18;m.armR.rotation.z=-.18;
    m.polesL.rotation.x=m.polesR.rotation.x=.9}
  else if(mod==='snowboard'){P.rotation.y=1.38;const a=.45+Math.sin(t*2.4+r.phase)*.05;crouch(a);m.legL.rotation.z=.16;m.legR.rotation.z=-.16;Sp.rotation.x=.22;Sp.rotation.y=-.35;m.neck.rotation.y=-1.0;
    m.armL.rotation.z=.85+Math.sin(t*2+r.phase)*.15;m.armR.rotation.z=-.7;m.armL.rotation.x=m.armR.rotation.x=-.3;m.foreL.rotation.x=m.foreR.rotation.x=-.4}
  else if(mod==='bike'){P.position.set(0,1.0,-.22);const pd=r.pedal;const ps=Math.sin(pd)*.32,pc=Math.cos(pd)*.25;
    m.legL.rotation.x=-1.25+ps;m.shinL.rotation.x=1.35-pc-ps*.4;m.legR.rotation.x=-1.25-ps;m.shinR.rotation.x=1.35+pc+ps*.4;
    Sp.rotation.x=.85;m.neck.rotation.x=-.75;m.armL.rotation.x=m.armR.rotation.x=-1.05;m.foreL.rotation.x=m.foreR.rotation.x=-.35;m.armL.rotation.z=.22;m.armR.rotation.z=-.22;m.crank.rotation.x=pd}
  else if(mod==='escalada'){const c=r.climb,a=Math.sin(c);P.position.set(0,.95,0);Sp.rotation.x=-.06;m.neck.rotation.x=-.5;
    m.armL.rotation.x=-2.55-a*.45;m.foreL.rotation.x=-.35-Math.max(0,a)*.75;m.armR.rotation.x=-2.55+a*.45;m.foreR.rotation.x=-.35-Math.max(0,-a)*.75;m.armL.rotation.z=.3;m.armR.rotation.z=-.3;
    m.legL.rotation.x=-.5-Math.max(0,-a)*.8;m.shinL.rotation.x=.8+Math.max(0,-a)*.7;m.legR.rotation.x=-.5-Math.max(0,a)*.8;m.shinR.rotation.x=.8+Math.max(0,a)*.7;m.legL.rotation.z=.25;m.legR.rotation.z=-.25}
  else if(mod==='vara'){const u=r.vaultU;if(u!=null){P.position.y=.92;Sp.rotation.x=-.35;m.armL.rotation.x=m.armR.rotation.x=-2.8;m.foreL.rotation.x=m.foreR.rotation.x=-.15;const k=Math.sin(Math.PI*Math.min(u/.85,1));m.legL.rotation.x=m.legR.rotation.x=-1.6*k;m.shinL.rotation.x=m.shinR.rotation.x=.4*(1-k)}
    else{const c=r.pedal*1.25;crouch(.12);Sp.rotation.x=.28;m.legL.rotation.x=Math.sin(c)*.95-.1;m.legR.rotation.x=-Math.sin(c)*.95-.1;m.shinL.rotation.x=.4+Math.max(0,-Math.sin(c))*1.3;m.shinR.rotation.x=.4+Math.max(0,Math.sin(c))*1.3;m.armL.rotation.x=m.armR.rotation.x=-.95;m.foreL.rotation.x=m.foreR.rotation.x=-.7;m.armL.rotation.z=-.15;m.armR.rotation.z=.15}}
  else if(mod==='skate'){const lv=clamp(r.latV||0,-3,3);P.rotation.y=.95;crouch(.98);P.position.y+=.11;m.legL.rotation.z=.12;m.legR.rotation.z=-.12;Sp.rotation.x=.78;Sp.rotation.y=-.38;Sp.rotation.z=lv*.04;m.neck.rotation.x=-.85;m.neck.rotation.y=-.62;
    m.armL.rotation.x=m.armR.rotation.x=.75;m.armL.rotation.z=.1;m.armR.rotation.z=-.1;m.foreL.rotation.x=m.foreR.rotation.x=-.25}
  else if(mod==='paraquedas'){if(r.chuteOpen&&(r.collapse||0)>.05){crouch(.12);m.armL.rotation.z=.35;m.armR.rotation.z=-.35}
    else if(r.chuteOpen){const fl=r.flare||0;crouch(.04);m.armL.rotation.x=m.armR.rotation.x=lerp(-2.75,-.45,fl)+(r.latV>0?.2:-.2)*0;m.armL.rotation.z=.18;m.armR.rotation.z=-.18;m.foreL.rotation.x=m.foreR.rotation.x=-.2;m.legL.rotation.x=-.35+Math.sin(t*1.3+r.phase)*.12;m.legR.rotation.x=-.25-Math.sin(t*1.3+r.phase)*.12}
    else{P.position.set(0,1,0);P.rotation.x=Math.PI/2*.94;Sp.rotation.x=-.18;m.armL.rotation.z=1.38;m.armR.rotation.z=-1.38;m.armL.rotation.x=m.armR.rotation.x=-.4;m.foreL.rotation.x=m.foreR.rotation.x=-1.45;m.legL.rotation.z=.3;m.legR.rotation.z=-.3;m.legL.rotation.x=m.legR.rotation.x=.15;m.shinL.rotation.x=m.shinR.rotation.x=1.25;m.neck.rotation.x=-1.25;const f=Math.sin(t*9+r.phase)*.04;m.armL.rotation.z+=f;m.armR.rotation.z-=f}}
  else if(mod==='remo'){const ph=((r.stroke||0)/(2*Math.PI))%1,dr=ph<.42?ph/.42:1-(ph-.42)/.58,dk=smooth(0,1,dr);P.position.set(0,.33,lerp(-.38,.28,dk));P.rotation.y=Math.PI;
    m.legL.rotation.x=m.legR.rotation.x=lerp(-2.3,-1.52,dk);m.shinL.rotation.x=m.shinR.rotation.x=lerp(2.25,.15,dk);m.legL.rotation.z=.06;m.legR.rotation.z=-.06;
    Sp.rotation.x=lerp(.48,-.32,dk);m.neck.rotation.x=lerp(-.35,.2,dk);m.armL.rotation.x=m.armR.rotation.x=lerp(-1.45,-.5,dk);m.foreL.rotation.x=m.foreR.rotation.x=lerp(-.08,-1.55,dk);m.armL.rotation.z=.28;m.armR.rotation.z=-.28;
    const sw=lerp(.78,-.55,dk),dp=ph<.42?-.19:.07;m.oarL.rotation.set(0,-sw,dp);m.oarR.rotation.set(0,sw,-dp)}
  else if(mod==='windsurf'){P.rotation.y=1.45;crouch(.24+Math.sin(t*1.7+r.phase)*.04);m.legL.rotation.z=.2;m.legR.rotation.z=-.2;Sp.rotation.x=-.42;m.neck.rotation.x=.25;m.neck.rotation.y=-.5;
    m.armL.rotation.x=m.armR.rotation.x=-1.38;m.armL.rotation.z=.32;m.armR.rotation.z=-.1;m.foreL.rotation.x=m.foreR.rotation.x=-.25}
  else if(mod==='nado'){P.position.set(0,1,0);P.rotation.x=Math.PI/2;const c=r.stroke;m.armL.rotation.x=c;m.armR.rotation.x=c+Math.PI;
    m.foreL.rotation.x=-.7*Math.max(0,Math.sin(c));m.foreR.rotation.x=-.7*Math.max(0,Math.sin(c+Math.PI));Sp.rotation.y=Math.sin(c)*.35;m.neck.rotation.x=-1.05;m.neck.rotation.y=Math.sin(c)*.5;
    const k=Math.sin(c*3)*.28;m.legL.rotation.x=k;m.legR.rotation.x=-k;m.shinL.rotation.x=.15+Math.max(0,-k);m.shinR.rotation.x=.15+Math.max(0,k)}
  else if(standing){crouch(.08);m.armL.rotation.z=.25+br;m.armR.rotation.z=-.25-br;m.foreL.rotation.x=m.foreR.rotation.x=-.2}
  else{P.position.set(0,1,0);P.rotation.x=Math.PI/2;const f=Math.sin(t*2.2+r.phase)*.05;m.armL.rotation.z=1.42+f;m.armR.rotation.z=-1.42-f;m.armL.rotation.x=m.armR.rotation.x=.1;m.legL.rotation.z=.15;m.legR.rotation.z=-.15;m.neck.rotation.x=-1.05}
  Sp.rotation.x+=br;
}

