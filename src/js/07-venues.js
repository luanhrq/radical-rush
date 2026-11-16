function buildVara(i0,i1){const S=W.S;const std=new THREE.MeshStandardMaterial({color:0xeef1f4,roughness:.3,metalness:.5});
  const barM=new THREE.MeshStandardMaterial({map:cTex(256,16,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#111':'#ffd23f';x.fillRect(i*32,0,32,h)}}),roughness:.4});
  const matM=new THREE.MeshPhysicalMaterial({color:0x1d5fd6,roughness:.8,sheen:.6});const span=i1-i0;
  for(let i=i0+Math.round(span*.14);i<i1-Math.round(span*.06);i+=23){const s=S[i];const g=new THREE.Group();g.position.set(s.p.x,s.ground,s.p.z);g.rotation.y=Math.atan2(s.t.x,s.t.z);
    for(const k of[-1,1]){const st=new THREE.Mesh(new THREE.CylinderGeometry(.09,.12,6.6,10),std);st.position.set(7.4*k,3.3,0);st.castShadow=true;g.add(st);const bs=new THREE.Mesh(new THREE.CylinderGeometry(.55,.65,.16,18),std);bs.position.set(7.4*k,.08,0);g.add(bs)}
    const bar=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,14.8,10).rotateZ(Math.PI/2),barM);bar.position.y=5.6;bar.castShadow=true;g.add(bar);
    const mat=new THREE.Mesh(new RoundedBoxGeometry(13,1.2,7.4,3,.4),matM);mat.position.set(0,.6,4.8);mat.castShadow=mat.receiveShadow=true;g.add(mat);
    const box=new THREE.Mesh(new THREE.BoxGeometry(1.3,.06,1.8),new THREE.MeshStandardMaterial({color:0x1a1a1a,roughness:.5,metalness:.6}));box.position.set(0,.03,-2.3);g.add(box);
    W.group.add(g);W.bars.push({s:s.s,bar,fall:0})}}
function strawTex(){return cTex(256,256,(x,w,h)=>{x.fillStyle='#d9b862';x.fillRect(0,0,w,h);const R2=mulberry(11);for(let k=0;k<2600;k++){const v=R2();x.strokeStyle=v<.5?`rgba(120,86,30,${.25+R2()*.35})`:`rgba(250,226,150,${.2+R2()*.4})`;x.lineWidth=.6+R2()*1.4;const y0=R2()*h,x0=R2()*w;x.beginPath();x.moveTo(x0,y0);x.lineTo(x0+12+R2()*30,y0+(R2()-.5)*5);x.stroke()}
  x.strokeStyle='rgba(90,64,24,.35)';x.lineWidth=2;[.3,.7].forEach(f=>{x.beginPath();x.moveTo(0,h*f);x.lineTo(w,h*f);x.stroke()})})}
function chevronTex(){return cTex(512,256,(x,w,h)=>{x.fillStyle='#ffd400';x.fillRect(0,0,w,h);x.fillStyle='#111';for(let k=0;k<3;k++){const ox=60+k*150;x.beginPath();x.moveTo(ox,30);x.lineTo(ox+70,30);x.lineTo(ox+150,128);x.lineTo(ox+70,226);x.lineTo(ox,226);x.lineTo(ox+80,128);x.closePath();x.fill()}x.strokeStyle='#111';x.lineWidth=10;x.strokeRect(5,5,w-10,h-10)})}
function buildRoad(i0,i1){const S=W.S;const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V3(1,1,1),pp=new V3();
  const upS=i=>(S[i].seg%2?1:-1);
  // guard-rail de perfil W no lado do precipício
  {const prof=[[0,.48],[.09,.53],[.09,.58],[.02,.62],[.02,.68],[.09,.72],[.09,.77],[0,.82]];const P=[],I=[];let row=0;
    for(let i=i0+1;i<=i1-1;i++){const s=S[i],sg=-upS(i),lat=sg*7.25;for(const[o,y]of prof){const L=lat+sg*o;P.push(s.p.x+s.sd.x*L,s.ground+y,s.p.z+s.sd.z*L)}
      if(row>0){const a=(row-1)*prof.length,b=row*prof.length;for(let k=0;k<prof.length-1;k++){if(sg>0)I.push(a+k,b+k,a+k+1,a+k+1,b+k,b+k+1);else I.push(a+k,a+k+1,b+k,a+k+1,b+k+1,b+k)}}row++}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();
    const rail=new THREE.Mesh(g,new THREE.MeshStandardMaterial({color:0xc4cad1,metalness:.85,roughness:.32,side:THREE.DoubleSide}));rail.castShadow=true;rail.receiveShadow=true;W.group.add(rail);
    const L=[];for(let i=i0+1;i<=i1-1;i+=2){const s=S[i],sg=-upS(i);L.push([s,sg*7.42])}
    const im=new THREE.InstancedMesh(new THREE.BoxGeometry(.09,.9,.16).translate(0,.45,0),new THREE.MeshStandardMaterial({color:0x8d949c,metalness:.8,roughness:.45}),L.length);
    L.forEach(([s,lat],k)=>{mt.compose(pp.set(s.p.x+s.sd.x*lat,s.ground-.05,s.p.z+s.sd.z*lat),q.setFromEuler(e.set(0,Math.atan2(s.t.x,s.t.z),0)),sc.set(1,1,1));im.setMatrixAt(k,mt)});im.castShadow=true;W.group.add(im)}
  // balizadores refletivos do lado da encosta
  {const L=[];for(let i=i0+2;i<=i1-2;i+=8)L.push(S[i]);const g=mergeCol([[new THREE.BoxGeometry(.1,1.05,.1).translate(0,.52,0),0xf2f2f2],[new THREE.BoxGeometry(.105,.18,.105).translate(0,.78,0),0x14161a],[new THREE.BoxGeometry(.04,.12,.11).translate(0,.88,0),0xff7a00]]);
    const im=new THREE.InstancedMesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4}),L.length);L.forEach((s,k)=>{const i=Math.round(s.s/DS),lat=upS(i)*7.5;mt.compose(pp.set(s.p.x+s.sd.x*lat,s.ground,s.p.z+s.sd.z*lat),q.setFromEuler(e.set(0,Math.atan2(s.t.x,s.t.z),0)),sc.set(1,1,1));im.setMatrixAt(k,mt)});im.castShadow=true;W.group.add(im)}
  // fardos de feno na parte de fora das curvas + placas de curva
  {const bales=[],signs=[];let lastSign=-99;
    for(let i=i0+8;i<=i1-8;i++){const a=S[i-6].t,b=S[i+6].t,cr=a.z*b.x-a.x*b.z;if(Math.abs(cr)<.11)continue;const out=Math.sign(cr);const s=S[i];bales.push([s,out*6.05,0]);if(Math.abs(cr)>.16)bales.push([s,out*6.05,.56]);
      if(i-lastSign>30&&Math.abs(cr)>.14){const j=Math.max(i0,i-10);signs.push([S[j],out*8.4]);lastSign=i}}
    if(bales.length){const im=new THREE.InstancedMesh(new RoundedBoxGeometry(.95,.55,1.9,2,.08),new THREE.MeshStandardMaterial({map:strawTex(),roughness:.95,normalMap:CLOTH,normalScale:new THREE.Vector2(1.4,1.4)}),bales.length);
      bales.forEach(([s,lat,y],k)=>{mt.compose(pp.set(s.p.x+s.sd.x*lat,s.ground+.29+y,s.p.z+s.sd.z*lat),q.setFromEuler(e.set(0,Math.atan2(s.t.x,s.t.z)+rand(-.06,.06),0)),sc.set(1,1,1));im.setMatrixAt(k,mt)});im.castShadow=true;im.receiveShadow=true;W.group.add(im)}
    const sm=new THREE.MeshStandardMaterial({map:chevronTex(),roughness:.5}),pm=new THREE.MeshStandardMaterial({color:0x5b6470,metalness:.7,roughness:.4});
    for(const[s,lat]of signs){const g=new THREE.Group();const bd=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.3),sm);bd.position.y=1.9;g.add(bd);const bk=new THREE.Mesh(new THREE.PlaneGeometry(2.6,1.3),pm);bk.position.set(0,1.9,-.01);bk.rotation.y=Math.PI;g.add(bk);
      for(const x of[-.9,.9]){const pl=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.9,6),pm);pl.position.set(x,.95,-.03);g.add(pl)}
      g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.position.set(s.p.x+s.sd.x*lat,s.ground,s.p.z+s.sd.z*lat);g.rotation.y=Math.atan2(s.t.x,s.t.z)+Math.PI;W.group.add(g)}}
  // pórtico de largada da descida
  {const s=S[Math.min(i1,i0+4)];const g=new THREE.Group();const tm=new THREE.MeshStandardMaterial({color:0x1b1f27,metalness:.6,roughness:.35});
    for(const x of[-8,8]){const pl=new THREE.Mesh(new THREE.BoxGeometry(.6,6.5,.6),tm);pl.position.set(x,3.25,0);g.add(pl)}
    const bn=new THREE.Mesh(new THREE.BoxGeometry(16.6,1.6,.4),tm);bn.position.y=6.2;g.add(bn);for(const z of[.21,-.21]){const f=new THREE.Mesh(new THREE.PlaneGeometry(15.6,1.25),new THREE.MeshStandardMaterial({map:bannerTex('SKATE DOWNHILL','#ff3d6e','#ffd23f'),roughness:.6}));f.position.set(0,6.2,z);if(z<0)f.rotation.y=Math.PI;g.add(f)}
    g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.position.set(s.p.x,s.ground,s.p.z);g.rotation.y=Math.atan2(s.t.x,s.t.z);W.group.add(g)}
}
function heliMesh(){const g=new THREE.Group();const body=new THREE.MeshPhysicalMaterial({color:0xe2302a,roughness:.35,clearcoat:.8}),dark=new THREE.MeshStandardMaterial({color:0x1d2229,roughness:.4,metalness:.5}),glass=new THREE.MeshPhysicalMaterial({color:0x0e1720,roughness:.05,metalness:.3,clearcoat:1});
  const fus=new THREE.Mesh(new THREE.CapsuleGeometry(1.25,2.6,8,18).rotateX(Math.PI/2),body);fus.scale.set(1,.95,1);g.add(fus);const ck=new THREE.Mesh(new THREE.SphereGeometry(1.15,20,14,0,Math.PI*2,0,Math.PI*.55).rotateX(Math.PI/2.4),glass);ck.position.set(0,.25,1.5);g.add(ck);
  const tb=new THREE.Mesh(new THREE.CylinderGeometry(.18,.35,6,10).rotateX(Math.PI/2),body);tb.position.set(0,.4,-4.6);g.add(tb);const fin=new THREE.Mesh(new THREE.BoxGeometry(.12,1.6,.9),body);fin.position.set(0,1.1,-7.3);g.add(fin);
  const tr=new THREE.Mesh(new THREE.BoxGeometry(.05,1.6,.16),dark);tr.position.set(.18,1.1,-7.4);g.add(tr);const mast=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,.6,8),dark);mast.position.y=1.5;g.add(mast);
  const rot=new THREE.Group();rot.position.y=1.8;for(const a of[0,Math.PI/2]){const bl=new THREE.Mesh(new THREE.BoxGeometry(11,.05,.32),dark);bl.rotation.y=a;rot.add(bl)}g.add(rot);
  for(const x of[-.95,.95]){const sk=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,4.2,8).rotateX(Math.PI/2),dark);sk.position.set(x,-1.55,.2);g.add(sk);for(const z of[-.8,1.2]){const st=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,.7,6),dark);st.position.set(x*.85,-1.2,z);g.add(st)}}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData.rot=rot;g.userData.tr=tr;return g}
function planeMesh(c2){const g=new THREE.Group();const wht=new THREE.MeshPhysicalMaterial({color:0xf4f5f7,roughness:.3,clearcoat:.8}),acc2=new THREE.MeshStandardMaterial({color:c2,roughness:.4}),dark=new THREE.MeshStandardMaterial({color:0x1b2028,roughness:.4,metalness:.5});
  const f=new THREE.Mesh(new THREE.CapsuleGeometry(.85,6.4,8,18).rotateX(Math.PI/2),wht);f.position.y=1.6;g.add(f);const st=new THREE.Mesh(new THREE.BoxGeometry(.06,.3,6.8),acc2);st.position.set(.85,1.6,0);g.add(st);const st2=st.clone();st2.position.x=-.85;g.add(st2);
  const w=new THREE.Mesh(new RoundedBoxGeometry(13,.2,1.7,2,.08),wht);w.position.set(0,2.55,.6);g.add(w);const tf=new THREE.Mesh(new THREE.BoxGeometry(.12,1.9,1.4),wht);tf.position.set(0,2.6,-3.9);g.add(tf);const hs=new THREE.Mesh(new THREE.BoxGeometry(4.2,.1,1.1),wht);hs.position.set(0,1.9,-3.9);g.add(hs);
  const prop=new THREE.Group();prop.position.set(0,1.6,4.35);for(const a of[0,Math.PI/2]){const b=new THREE.Mesh(new THREE.BoxGeometry(2.6,.16,.06),dark);b.rotation.z=a;prop.add(b)}g.add(prop);const sp=new THREE.Mesh(new THREE.ConeGeometry(.28,.5,12).rotateX(Math.PI/2),acc2);sp.position.set(0,1.6,4.5);g.add(sp);
  for(const [x,z] of[[-1.3,.9],[1.3,.9],[0,3.4]]){const wh=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.2,14).rotateZ(Math.PI/2),dark);wh.position.set(x,.32,z);g.add(wh);const lg=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.1,6),dark);lg.position.set(x,.85,z);g.add(lg)}
  g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.userData.prop=prop;return g}
function buildLanding(i0,i1){const S=W.S,i=i0+Math.round((i1-i0)*.97),s=S[i];W.landS=s.s;const ang=Math.atan2(s.t.x,s.t.z);
  const place=(o,ss,lat,along,y,rot=0)=>{o.position.set(ss.p.x+ss.sd.x*lat+ss.t.x*along,y,ss.p.z+ss.sd.z*lat+ss.t.z*along);o.rotation.y=Math.atan2(ss.t.x,ss.t.z)+rot;W.group.add(o);return o};
  // alvo: cascalho fino com anéis pintados
  const tex=cTex(1024,1024,(x,w,h)=>{x.fillStyle='#b9a98c';x.fillRect(0,0,w,h);const R2=mulberry(5);for(let k=0;k<26000;k++){const v=150+R2()*90|0;x.fillStyle=`rgb(${v},${v-12|0},${v-30|0})`;x.beginPath();x.ellipse(R2()*w,R2()*h,1.5+R2()*3,1.2+R2()*2.4,R2()*3,0,7);x.fill()}
    x.strokeStyle='rgba(255,255,255,.92)';[.3,.55,.8].forEach(rr=>{x.lineWidth=16;x.beginPath();x.arc(512,512,rr*500,0,7);x.stroke()});x.fillStyle='#ffd23f';x.beginPath();x.arc(512,512,36,0,7);x.fill();x.strokeStyle='#e8312f';x.lineWidth=10;x.beginPath();x.arc(512,512,36,0,7);x.stroke();
    const g=x.createRadialGradient(512,512,440,512,512,512);g.addColorStop(0,'rgba(60,70,40,0)');g.addColorStop(1,'rgba(60,70,40,.9)');x.fillStyle=g;x.fillRect(0,0,w,h)});
  const tg=new THREE.Mesh(new THREE.CircleGeometry(10,72),new THREE.MeshStandardMaterial({map:tex,roughness:.92,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-8}));tg.rotation.x=-Math.PI/2;tg.position.set(s.p.x,s.ground+.22,s.p.z);tg.receiveShadow=true;W.group.add(tg);
  // T de vento e biruta
  const wm=new THREE.MeshStandardMaterial({color:0xf4f4f4,roughness:.6});const tT=new THREE.Group();const a1=new THREE.Mesh(new THREE.BoxGeometry(.5,.08,4),wm);tT.add(a1);const a2=new THREE.Mesh(new THREE.BoxGeometry(3,.08,.5),wm);a2.position.z=1.8;tT.add(a2);place(tT,s,-14,-6,s.ground+.25,.4);
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.08,.11,7.5,8),new THREE.MeshStandardMaterial({color:0xdddddd,metalness:.6,roughness:.3}));place(pole,s,15,-4,s.ground+3.75);
  const sockM=new THREE.MeshStandardMaterial({map:cTex(128,32,(x,w,h)=>{for(let k=0;k<5;k++){x.fillStyle=k%2?'#ffffff':'#ff5a12';x.fillRect(k*w/5,0,w/5,h)}}),roughness:.6,side:THREE.DoubleSide});
  const sock=new THREE.Mesh(new THREE.CylinderGeometry(.28,.6,3.4,16,1,true).rotateZ(Math.PI/2).translate(1.7,0,0),sockM);place(sock,s,15,-4,s.ground+7.1,rand(0,6));
  // hangar curvo e avião estacionado
  {const hm=new THREE.MeshStandardMaterial({color:0xc6ccd3,roughness:.45,metalness:.6}),dm=new THREE.MeshStandardMaterial({color:0x22272f,roughness:.5});const g=new THREE.Group();
    const rf=new THREE.Mesh(new THREE.CylinderGeometry(10,10,16,28,1,false,0,Math.PI).rotateZ(Math.PI/2).rotateY(Math.PI/2),hm);rf.scale.y=.75;g.add(rf);const fr=new THREE.Mesh(new THREE.CircleGeometry(10,28,0,Math.PI),hm);fr.scale.y=.75;fr.position.z=8;g.add(fr);
    const dr=new THREE.Mesh(new THREE.PlaneGeometry(12,6),dm);dr.position.set(0,3,8.05);g.add(dr);const bk=fr.clone();bk.position.z=-8;bk.rotation.y=Math.PI;g.add(bk);
    const sg=new THREE.Mesh(new THREE.PlaneGeometry(9,1.3),new THREE.MeshStandardMaterial({map:bannerTex('DROP ZONE','#1e7bff','#29e3ff'),roughness:.6}));sg.position.set(0,7.2,8.06);g.add(sg);
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});place(g,s,-44,6,gridH(s.p.x-s.sd.x*44,s.p.z-s.sd.z*44),-Math.PI/2);
    const pl=planeMesh(0x1e6fd9);place(pl,s,-30,-14,gridH(s.p.x-s.sd.x*30,s.p.z-s.sd.z*30),2.2);W.plane=pl}
  // bandeiras de pena ao redor do campo
  {const fm=new THREE.MeshStandardMaterial({roughness:.6,side:THREE.DoubleSide});fm.onBeforeCompile=sh=>{Object.assign(sh.uniforms,FOGU);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uTime;').replace('#include <begin_vertex>','#include <begin_vertex>\nfloat fw=max(position.x,0.);transformed.z+=sin(uTime*4.+position.y*1.5+modelMatrix[3].x)*.12*fw;')};
    const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(0,4.2);shape.quadraticCurveTo(1.6,4.5,1.2,2.4);shape.lineTo(.9,.4);shape.lineTo(0,0);const fg=new THREE.ShapeGeometry(shape,8);
    [[-18,8],[-18,-8],[18,8],[18,-8],[-9,16],[9,16]].forEach(([lat,al],k)=>{const g=new THREE.Group();const pl=new THREE.Mesh(new THREE.CylinderGeometry(.04,.05,5,6),new THREE.MeshStandardMaterial({color:0x333a44}));pl.position.y=2.5;g.add(pl);const m2=fm.clone();m2.onBeforeCompile=fm.onBeforeCompile;m2.color.setHSL([.02,.58,.12][k%3],.85,.5);const f=new THREE.Mesh(fg,m2);f.position.y=.6;g.add(f);
      g.traverse(o=>{if(o.isMesh)o.castShadow=true});const x=s.p.x+s.sd.x*lat+s.t.x*al,z=s.p.z+s.sd.z*lat+s.t.z*al;g.position.set(x,gridH(x,z),z);g.rotation.y=rand(0,6);W.group.add(g)})}
  // plataforma de salto na beira do penhasco + helicóptero
  {const se=S[Math.min(i1,i0+2)];const st=new THREE.MeshStandardMaterial({color:0x3a414c,roughness:.45,metalness:.7}),gr=new THREE.MeshStandardMaterial({color:0x9aa3ad,roughness:.6,metalness:.6});const g=new THREE.Group();
    const dk=new THREE.Mesh(new THREE.BoxGeometry(10,.35,8),gr);dk.position.set(0,-.2,1.5);g.add(dk);for(const x of[-5,5]){const rl=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,8,6).rotateX(Math.PI/2),st);rl.position.set(x,1.05,1.5);g.add(rl);for(let z=-2.4;z<=5.4;z+=1.95){const pst=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.1,6),st);pst.position.set(x,.5,z);g.add(pst)}}
    for(const x of[-4.2,4.2])for(const z of[3.5,5.2]){const bm=new THREE.Mesh(new THREE.CylinderGeometry(.14,.14,9,8),st);bm.position.set(x,-4.4,z-3.5);bm.rotation.x=-.55;g.add(bm)}
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});g.position.set(se.p.x,se.ground,se.p.z);g.rotation.y=Math.atan2(se.t.x,se.t.z);W.group.add(g);
    const h=heliMesh();h.position.set(se.p.x+se.sd.x*26+se.t.x*14,se.p.y+16,se.p.z+se.sd.z*26+se.t.z*14);h.rotation.y=Math.atan2(se.t.x,se.t.z)-1.2;W.group.add(h);W.heli=h}
  // nuvens no meio da queda
  {const cm=new THREE.SpriteMaterial({map:puffTex,color:0xffffff,transparent:true,opacity:.42,depthWrite:false,fog:true});for(let k=0;k<12;k++){const j=i0+Math.round((i1-i0)*rand(.1,.38));const q2=S[j];const sp=new THREE.Sprite(cm);const sd2=(k%2?1:-1)*rand(34,80);sp.position.set(q2.p.x+q2.sd.x*sd2,q2.ground+rand(10,40),q2.p.z+q2.sd.z*sd2);const w=rand(26,58);sp.scale.set(w,w*rand(.45,.7),1);W.group.add(sp)}}
}
const WAVEV=()=>WAVES.map((w,i)=>{const l=Math.hypot(w[0],w[1]);return[w[0]/l,w[1]/l,2*Math.PI/w[2],w[3],i]});let _WV=null;
function waveH(x,z,t){if(!_WV)_WV=WAVEV();let h=0;for(const w of _WV){const k=w[2],om=Math.sqrt(9.8*k);h+=w[3]*Math.sin(k*(w[0]*x+w[1]*z)-om*t+w[4]*1.7)}return h}
function buildBuoys(i0,i1){const S=W.S;W.buoys=W.buoys||[];const bm=new THREE.MeshPhysicalMaterial({color:0xff5a1f,roughness:.35,clearcoat:.8}),wm=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.4});
  for(let i=i0+8;i<i1-4;i+=16)for(const side of[-1,1]){const s=S[i];const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.9,24,16),bm);b.scale.y=.85;g.add(b);const band=new THREE.Mesh(new THREE.TorusGeometry(.86,.08,8,28).rotateX(Math.PI/2),wm);band.position.y=.15;g.add(band);
    const mast=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,1.8,6),wm);mast.position.y=1.2;g.add(mast);const fl=new THREE.Mesh(new THREE.PlaneGeometry(.7,.45),new THREE.MeshStandardMaterial({color:side<0?0xff3b2f:0x1e7bff,side:THREE.DoubleSide}));fl.position.set(.35,1.9,0);g.add(fl);
    g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.position.set(s.p.x+s.sd.x*15*side,0,s.p.z+s.sd.z*15*side);W.group.add(g);W.buoys.push(g)}}
function signTex(txt,bg,fg){return cTex(512,256,(x,w,h)=>{x.fillStyle=bg;x.fillRect(0,0,w,h);x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h*.82,w,h*.18);x.font="italic 900 150px 'Saira Condensed', Impact, sans-serif";x.textAlign='center';x.textBaseline='middle';x.fillStyle=fg;x.fillText(txt,w/2,h*.45)})}
function buildRiverBanks(i0,i1){const S=W.S,span=i1-i0,at=f=>S[Math.min(i1,i0+Math.round(span*f))];
  const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V3(1,1,1),pp=new V3(),col=new THREE.Color();const place=(o,s,lat,y,rot=0)=>{o.position.set(s.p.x+s.sd.x*lat,y,s.p.z+s.sd.z*lat);o.rotation.y=Math.atan2(s.t.x,s.t.z)+rot;o.traverse(c=>{if(c.isMesh){c.castShadow=true;c.receiveShadow=true}});W.group.add(o);return o};
  // linhas de raia: boias a cada 2 m, vermelhas nos últimos 250 m, laranja a cada 50 m
  {const L=[];for(let i=i0+3;i<=i1-2;i++){const s=S[i];for(let k=0;k<9;k++)L.push([s,(k-4)*2.6,i])}
    const im=new THREE.InstancedMesh(new THREE.SphereGeometry(.16,10,8),new THREE.MeshStandardMaterial({roughness:.35}),L.length);
    L.forEach(([s,lat,i],k)=>{mt.makeTranslation(s.p.x+s.sd.x*lat,s.p.y+.04,s.p.z+s.sd.z*lat);im.setMatrixAt(k,mt);im.setColorAt(k,col.setHex(i>i1-36?0xe8312f:(i-i0)%25===0?0xff8a1f:0xf4f4f4))});W.group.add(im)}
  // pontões de largada numerados
  {const s=S[Math.min(i1,i0+1)];const pm=new THREE.MeshStandardMaterial({color:0xeef1f4,roughness:.5});for(let k=0;k<8;k++){const lat=(k-3.5)*2.6;const g=new THREE.Group();const b=new THREE.Mesh(new RoundedBoxGeometry(1.7,.5,2.4,2,.08),pm);b.position.y=.1;g.add(b);
      const sg=new THREE.Mesh(new THREE.PlaneGeometry(1.2,.9),new THREE.MeshStandardMaterial({map:signTex(String(k+1),'#f5f5f5','#111'),roughness:.6}));sg.position.set(0,.85,-1);sg.rotation.y=Math.PI;g.add(sg);place(g,s,lat,s.p.y-.12)}}
  // torre de largada
  {const s=at(.02);const g=new THREE.Group();const tm=new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.45,metalness:.3}),dm=new THREE.MeshStandardMaterial({color:0x10151c,roughness:.1,metalness:.6});
    for(const dx of[-1.6,1.6])for(const dz of[-1.6,1.6]){const l=new THREE.Mesh(new THREE.CylinderGeometry(.12,.12,7,8),tm);l.position.set(dx,3.5,dz);g.add(l)}
    const cab=new THREE.Mesh(new RoundedBoxGeometry(4.2,2.6,4.2,2,.12),tm);cab.position.y=8.2;g.add(cab);const gl=new THREE.Mesh(new THREE.BoxGeometry(4.25,1.1,4.25),dm);gl.position.y=8.4;g.add(gl);const rf=new THREE.Mesh(new THREE.BoxGeometry(5,.25,5),tm);rf.position.y=9.65;g.add(rf);place(g,s,-25,s.p.y+1.2)}
  // ponte de pedra em arco
  {const sb=at(.5);const stone=new THREE.MeshStandardMaterial({color:0xc4bbad,roughness:.9});if(TEXU.tRockA.value){const tx=TEXU.tRockA.value.clone();tx.wrapS=tx.wrapT=THREE.RepeatWrapping;tx.repeat.set(.11,.11);tx.needsUpdate=true;stone.map=tx}
    const light=new THREE.MeshStandardMaterial({color:0xe2dbcd,roughness:.85,map:stone.map});const g=new THREE.Group();
    const sh=new THREE.Shape();sh.moveTo(-36,-4);sh.lineTo(36,-4);sh.lineTo(36,10.2);sh.lineTo(-36,10.2);sh.lineTo(-36,-4);
    const hole=new THREE.Path();const AR=15,AH=11;hole.moveTo(AR,-3.5);for(let k=0;k<=28;k++){const a=Math.PI*k/28;hole.lineTo(Math.cos(a)*AR,-3.5+Math.sin(a)*AH)}hole.lineTo(-AR,-3.5);sh.holes.push(hole);
    const eg=new THREE.ExtrudeGeometry(sh,{depth:7,bevelEnabled:false,curveSegments:4});eg.translate(0,0,-3.5);g.add(new THREE.Mesh(eg,stone));
    const vs=[];for(let k=0;k<=18;k++){const a=Math.PI*k/18;const cx=Math.cos(a)*(AR+.55),cy=-3.5+Math.sin(a)*(AH+.55);for(const z of[3.62,-3.62]){const b=new THREE.BoxGeometry(1.15,1.5,.3);b.rotateZ(Math.atan2(Math.sin(a)*AR,Math.cos(a)*AH)-Math.PI/2);b.translate(cx,cy,z);vs.push(b)}}
    g.add(new THREE.Mesh(mergeGeometries(vs),light));
    const cor=new THREE.Mesh(new THREE.BoxGeometry(72.5,.35,7.7),light);cor.position.y=10.3;g.add(cor);
    for(const z of[3.25,-3.25]){const pa=new THREE.Mesh(new THREE.BoxGeometry(72,1.05,.45),stone);pa.position.set(0,10.98,z);g.add(pa);const cap=new THREE.Mesh(new THREE.BoxGeometry(72.3,.16,.6),light);cap.position.set(0,11.58,z);g.add(cap)}
    const lm=new THREE.MeshStandardMaterial({color:0x1d2128,metalness:.7,roughness:.3}),gl=new THREE.MeshStandardMaterial({color:0xfff1c8,emissive:0xffd890,emissiveIntensity:.6,roughness:.3});
    for(let k=0;k<6;k++)for(const z of[3.25,-3.25]){const lp=new THREE.Mesh(new THREE.CylinderGeometry(.07,.1,2.6,8),lm);lp.position.set(-25+k*10,12.9,z);g.add(lp);const lg=new THREE.Mesh(new THREE.SphereGeometry(.22,12,8),gl);lg.position.set(-25+k*10,14.3,z);g.add(lg)}
    g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});place(g,sb,0,sb.p.y,0);
    const list=[];for(let k=0;k<26;k++){const x=rand(-14,14),z=(k%2?1:-1)*2.75;list.push([x,10.45,z,z>0?Math.PI:0])}
    const cg=crowdGeo().clone(),im=new THREE.InstancedMesh(cg,crowdMaterial(),list.length),ac=new Float32Array(list.length*4),as=new Float32Array(list.length*3);g.updateMatrixWorld(true);
    list.forEach(([x,y,z,ry],k)=>{pp.set(x,y,z).applyMatrix4(g.matrixWorld);q.setFromEuler(e.set(0,g.rotation.y+ry+rand(-.4,.4),0));mt.compose(pp,q,sc.setScalar(1.45));im.setMatrixAt(k,mt);ac.set([rand(0,6.3),Math.random(),Math.pow(Math.random(),1.3),Math.random()],k*4);col.setHSL(rand(0,1),rand(.5,.9),rand(.35,.6));as.set([col.r,col.g,col.b],k*3)});
    cg.setAttribute('aCrowd',new THREE.InstancedBufferAttribute(ac,4));cg.setAttribute('aShirt',new THREE.InstancedBufferAttribute(as,3));im.computeBoundingSphere();im.castShadow=true;W.group.add(im)}
  // arquibancada coberta com público
  {const sg=at(.84),side=1;const g=new THREE.Group();const cm=new THREE.MeshStandardMaterial({color:0x8b939e,roughness:.8}),seat=new THREE.MeshStandardMaterial({color:0x1e6fd9,roughness:.5});
    for(let k=0;k<6;k++){const st=new THREE.Mesh(new THREE.BoxGeometry(34,.6*(k+1),1.7),cm);st.position.set(0,.3*(k+1),k*1.7);g.add(st);const sr=new THREE.Mesh(new THREE.BoxGeometry(33,.18,.6),seat);sr.position.set(0,.6*(k+1)+.09,k*1.7-.3);g.add(sr)}
    const rf=new THREE.Mesh(new THREE.BoxGeometry(36,.25,11),new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.4,metalness:.3}));rf.position.set(0,7.6,4.2);rf.rotation.x=-.08;g.add(rf);
    for(const x of[-17,-6,6,17]){const pl=new THREE.Mesh(new THREE.CylinderGeometry(.15,.15,7.6,8),cm);pl.position.set(x,3.8,9.6);g.add(pl)}
    const bnr=new THREE.Mesh(new THREE.PlaneGeometry(34,1.1),new THREE.MeshStandardMaterial({map:bannerTex('RADICAL RUSH · REGATA','#1e7bff','#29e3ff'),roughness:.6}));bnr.position.set(0,.35,-.9);bnr.rotation.y=Math.PI;g.add(bnr);
    place(g,sg,24*side,sg.p.y+1.25,side>0?-Math.PI/2:Math.PI/2);
    const list=[];for(let k=0;k<6;k++)for(let x=-16;x<=16;x+=1.15)if(Math.random()<.82)list.push([x+rand(-.2,.2),.6*(k+1)+.18,k*1.7-.1]);
    const cg=crowdGeo().clone(),im=new THREE.InstancedMesh(cg,crowdMaterial(),list.length),ac=new Float32Array(list.length*4),as=new Float32Array(list.length*3);g.updateMatrixWorld(true);
    list.forEach(([x,y,z],k)=>{pp.set(x,y,z).applyMatrix4(g.matrixWorld);q.setFromEuler(e.set(0,g.rotation.y+Math.PI,0));mt.compose(pp,q,sc.setScalar(1.45));im.setMatrixAt(k,mt);ac.set([rand(0,6.3),Math.random(),Math.pow(Math.random(),1.3),Math.random()],k*4);col.setHSL(rand(0,1),rand(.5,.9),rand(.35,.6));as.set([col.r,col.g,col.b],k*3)});
    cg.setAttribute('aCrowd',new THREE.InstancedBufferAttribute(ac,4));cg.setAttribute('aShirt',new THREE.InstancedBufferAttribute(as,3));im.computeBoundingSphere();im.castShadow=true;W.group.add(im)}
  // garagens de barcos (outra margem)
  {const red=new THREE.MeshStandardMaterial({color:0x9e2b25,roughness:.75}),wht=new THREE.MeshStandardMaterial({color:0xf0ede6,roughness:.6}),drk=new THREE.MeshStandardMaterial({color:0x1b1f26,roughness:.5}),hull=new THREE.MeshPhysicalMaterial({color:0xf3f5f8,roughness:.25,clearcoat:1});
    for(let k=0;k<3;k++){const s=at(.06+k*.05);const g=new THREE.Group();const wl=new THREE.Mesh(new THREE.BoxGeometry(12,6,9.5),red);wl.position.y=3;g.add(wl);
      const rf=new THREE.Mesh(new THREE.CylinderGeometry(7.2,7.2,10,3,1).rotateZ(Math.PI/2).rotateX(Math.PI/6),wht);rf.scale.set(1,.45,1);rf.position.y=6+1.6;g.add(rf);
      const dr=new THREE.Mesh(new THREE.BoxGeometry(8,4.6,.2),drk);dr.position.set(0,2.3,4.8);g.add(dr);const tr=new THREE.Mesh(new THREE.BoxGeometry(12.2,.35,9.7),wht);tr.position.y=6.05;g.add(tr);
      for(let j=0;j<3;j++){const hb=new THREE.Mesh(new THREE.CapsuleGeometry(.22,6.2,4,10).rotateX(Math.PI/2),hull);hb.scale.y=.5;hb.position.set(-3+j*3,.9+j*.55,6.6);g.add(hb)}
      place(g,s,-29,s.p.y+1.3,-Math.PI/2)}}
  // placas de distância nas duas margens
  [['1500 m',.25],['1000 m',.5],['500 m',.75]].forEach(([txt,f])=>{const s=at(f);for(const side of[-1,1]){const g=new THREE.Group();const bd=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshStandardMaterial({map:signTex(txt,'#ffd23f','#111'),roughness:.6,side:THREE.DoubleSide}));bd.position.y=3.2;g.add(bd);
    for(const x of[-1.6,1.6]){const pl=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,3,6),new THREE.MeshStandardMaterial({color:0x333a44,metalness:.6,roughness:.4}));pl.position.set(x,1.5,0);g.add(pl)}place(g,s,21.5*side,s.p.y+1.25,Math.PI)}});
  // taboas e juncos na beira d'água
  {const stalk=new THREE.CylinderGeometry(.025,.035,2.4,5).translate(0,1.2,0),head=new THREE.CapsuleGeometry(.07,.32,3,6).translate(0,2.15,0);
    const cg=mergeGeometries([stalk.toNonIndexed(),head.toNonIndexed()].map(g=>{const n=g.attributes.position.count,cc=new Float32Array(n*3),c=g===null?0:1;return g}));
    const L=[];for(let i=i0;i<=i1;i++){const s=S[i];for(const side of[-1,1])for(let k=0;k<2;k++)if(Math.random()<.55)L.push([s,side*rand(16.8,19.2),rand(.7,1.25)])}
    const im=new THREE.InstancedMesh(cg,swayMat({color:0x6f7f3a,roughness:.8},'float hh=max(position.y,0.);transformed.x+=sin(uTime*1.3+ph+hh)*.05*hh*hh;','reed'),L.length);
    L.forEach(([s,lat,sz],k)=>{mt.compose(pp.set(s.p.x+s.sd.x*lat,s.p.y-.35,s.p.z+s.sd.z*lat),q.setFromEuler(e.set(rand(-.12,.12),rand(0,6.3),rand(-.12,.12))),sc.set(sz,sz*rand(.8,1.2),sz));im.setMatrixAt(k,mt);im.setColorAt(k,col.setRGB(rand(.75,1.1),rand(.85,1.1),rand(.7,1)))});im.castShadow=true;W.group.add(im)}
}
// círculos deixados pelas pás na água
const PUDDLES=[];
function puddle(x,y,z){let p=PUDDLES.find(o=>o.life<=0);if(!p){if(PUDDLES.length>=70)return;const m=new THREE.Mesh(new THREE.RingGeometry(.34,.44,32).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0xdcebed,transparent:true,opacity:0,depthWrite:false}));m.renderOrder=2;scene.add(m);p={m,life:0};PUDDLES.push(p)}
  p.life=2.6;p.m.position.set(x,y+.05,z);p.m.scale.setScalar(1);p.m.visible=true}
function updatePuddles(dt){for(const p of PUDDLES){if(p.life<=0){p.m.visible=false;continue}p.life-=dt;const k=1-p.life/2.6;p.m.scale.setScalar(1+k*1.8);p.m.material.opacity=(1-k)*(1-k)*.32}}
function wallDep(s,lat){return .12+fbm(W.n1,s.p.y*.22+lat*.03,lat*.22,4)*.5+Math.max(0,Math.abs(lat)-9)*.35}
function climbWall(i0,i1){
  const S=W.S,NL=37,P=[],I=[],CV=[];const rows=[];
  for(let i=i0-4;i<=i1+3;i++)rows.push(S[clamp(i,0,S.length-1)]);
  rows.forEach(s=>{const hl=Math.hypot(s.t.x,s.t.z)||1,hx=s.t.x/hl,hz=s.t.z/hl;for(let j=0;j<NL;j++){const lat=-18+j,dep=wallDep(s,lat);
    P.push(s.p.x+s.sd.x*lat+hx*dep,(s.surface==='rock'?s.p.y:s.ground)-Math.max(0,Math.abs(lat)-15)*.6,s.p.z+s.sd.z*lat+hz*dep);CV.push(.82,.86,.9,s.surface==='rock'?.1:.35)}});
  for(let r=0;r<rows.length-1;r++)for(let j=0;j<NL-1;j++){const a=r*NL+j,b=a+1,c=a+NL,d=c+1;I.push(a,b,c,b,d,c)}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('aCover',new THREE.Float32BufferAttribute(CV,4));g.setIndex(I);g.computeVertexNormals();
  const rm=rockMaterial();rm.color.setHex(0x9a928a);rm.side=THREE.DoubleSide;const m=new THREE.Mesh(g,rm);m.castShadow=m.receiveShadow=true;W.group.add(m);
  const holds=[];for(let i=i0;i<=i1;i++){const s=S[i];for(let k=0;k<3;k++){const lat=rand(-6.5,6.5),hl=Math.hypot(s.t.x,s.t.z)||1;const dep=wallDep(s,lat)-.1;holds.push([s.p.x+s.sd.x*lat+s.t.x/hl*dep,s.p.y+rand(-.8,.8),s.p.z+s.sd.z*lat+s.t.z/hl*dep])}}
  const hm=new THREE.InstancedMesh(new THREE.SphereGeometry(.17,10,8),new THREE.MeshPhysicalMaterial({roughness:.55,clearcoat:.4}),holds.length);
  const mt=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(),sc=new V3(),pp=new V3(),col=new THREE.Color();
  holds.forEach((h,k)=>{mt.compose(pp.set(h[0],h[1],h[2]),q.setFromEuler(e.set(rand(0,3),rand(0,3),rand(0,3))),sc.set(rand(1.1,1.9),rand(.6,1),rand(.9,1.4)));hm.setMatrixAt(k,mt);col.setHSL(pick([0,.08,.15,.33,.55,.8,.92]),.85,.5);hm.setColorAt(k,col)});
  hm.castShadow=true;W.group.add(hm);
}
function swimTube(i0,i1){
  const S=W.S,lv=W.water.level;let a=-1,b=-1;for(let i=i0;i<=i1;i++){if(S[i].p.y<lv-3.2){if(a<0)a=i;b=i}}if(a<0||b-a<6)return;
  const pts=[];for(let i=a;i<=b;i+=2)pts.push(S[i].p.clone());
  const curve=new THREE.CatmullRomCurve3(pts);
  const glass=new THREE.MeshPhysicalMaterial({color:0xd2f6ff,transparent:true,opacity:.09,roughness:.04,metalness:0,clearcoat:1,clearcoatRoughness:.04,side:THREE.DoubleSide,depthWrite:false,envMapIntensity:2.4});
  const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,pts.length*2,4.6,40,false),glass);tube.renderOrder=3;W.group.add(tube);
  const idx=[];for(let i=a;i<=b;i+=12)idx.push(i);
  const rings=new THREE.InstancedMesh(new THREE.TorusGeometry(4.68,.07,6,64),new THREE.MeshStandardMaterial({color:0x9fd8e8,emissive:0x5fc8e0,emissiveIntensity:.22,roughness:.25,metalness:.6,transparent:true,opacity:.55}),idx.length);
  const o=new THREE.Object3D();idx.forEach((i,k)=>{o.position.copy(S[i].p);o.lookAt(S[i].p.clone().add(S[i].t));o.updateMatrix();rings.setMatrixAt(k,o.matrix)});W.group.add(rings);
  const lane=new THREE.InstancedMesh(new THREE.BoxGeometry(.25,.06,2.4),new THREE.MeshStandardMaterial({color:0xd8c48a,emissive:0xffb000,emissiveIntensity:.3}),idx.length*2);
  idx.forEach((i,k)=>{for(let j=0;j<2;j++){const ii=Math.min(b,i+3*j);o.position.copy(S[ii].p);o.position.y-=4.45;o.lookAt(o.position.clone().add(S[ii].t));o.updateMatrix();lane.setMatrixAt(k*2+j,o.matrix)}});W.group.add(lane);
}
