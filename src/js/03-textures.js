// ======================================================================
// PROCEDURAL TEXTURES (tileable detail: RGB=normal, A=height)
// ======================================================================
function genTile(size,cells,seed){const rng=mulberry(seed);const g=new Float32Array(cells*cells);for(let i=0;i<g.length;i++)g[i]=rng();const o=new Float32Array(size*size);const k=cells/size;
  for(let y=0;y<size;y++){const fy=y*k,iy=fy|0,ty=fy-iy,sy=ty*ty*(3-2*ty),y0=(iy%cells)*cells,y1=((iy+1)%cells)*cells;
    for(let x=0;x<size;x++){const fx=x*k,ix=fx|0,tx=fx-ix,sx=tx*tx*(3-2*tx),x0=ix%cells,x1=(ix+1)%cells;const a=g[y0+x0],b=g[y0+x1],c=g[y1+x0],d=g[y1+x1];o[y*size+x]=a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy}}return o}
function fbmTile(size,cells,oct,seed,gain=.5,rid=false){const o=new Float32Array(size*size);let a=1,m=0;for(let i=0;i<oct;i++){const t=genTile(size,cells<<i,seed+i*101);for(let j=0;j<o.length;j++){let v=t[j];if(rid){v=1-Math.abs(v*2-1);v*=v}o[j]+=v*a}m+=a;a*=gain}for(let j=0;j<o.length;j++)o[j]/=m;return o}
function worleyTile(size,cells,seed){const rng=mulberry(seed);const px=new Float32Array(cells*cells),py=new Float32Array(cells*cells);for(let i=0;i<px.length;i++){px[i]=rng();py[i]=rng()}
  const F1=new Float32Array(size*size),F2=new Float32Array(size*size),k=cells/size;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const fx=x*k,fy=y*k,cx=fx|0,cy=fy|0;let d1=9,d2=9;
    for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){const gx=cx+ox,gy=cy+oy,wx=((gx%cells)+cells)%cells,wy=((gy%cells)+cells)%cells,qi=wy*cells+wx;const dx=gx+px[qi]-fx,dy=gy+py[qi]-fy,d=dx*dx+dy*dy;if(d<d1){d2=d1;d1=d}else if(d<d2)d2=d}
    F1[y*size+x]=Math.sqrt(d1);F2[y*size+x]=Math.sqrt(d2)}return{F1,F2}}
function detailTex(h,size,strength){
  let mn=1e9,mx=-1e9;for(const v of h){if(v<mn)mn=v;if(v>mx)mx=v}const rg=mx-mn||1;
  const data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const xl=(x-1+size)%size,xr=(x+1)%size,yu=(y-1+size)%size,yd=(y+1)%size;
    const dx=(h[y*size+xr]-h[y*size+xl])/rg*strength,dy=(h[yd*size+x]-h[yu*size+x])/rg*strength;let nx=-dx,ny=-dy,nz=1;const l=Math.hypot(nx,ny,nz);nx/=l;ny/=l;nz/=l;
    const i=(y*size+x)*4;data[i]=nx*127.5+127.5;data[i+1]=ny*127.5+127.5;data[i+2]=nz*127.5+127.5;data[i+3]=(h[y*size+x]-mn)/rg*255}
  const t=new THREE.DataTexture(data,size,size,THREE.RGBAFormat);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t}
const TEXU={tRock:{value:null},tGrass:{value:null},tSnow:{value:null},tSand:{value:null},tWaves:{value:null},tRockA:{value:null},tGrassA:{value:null},tSnowA:{value:null},tSandA:{value:null}};let CLOTH=null;
function albTex(rgba,size){const t=new THREE.DataTexture(rgba,size,size,THREE.RGBAFormat);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t}
function buildTexturesHD(){
  const rnd=mulberry(4242);const c8=v=>Math.max(0,Math.min(255,v*255|0));
  // rocha: relevo em camadas, fissuras, estratos, líquen e grãos minerais
  {const S=1024,r=fbmTile(S,4,6,11,.52,true),cA=fbmTile(S,5,4,7),cB=fbmTile(S,11,3,8),f=fbmTile(S,32,4,17),cv=fbmTile(S,6,3,19),li=fbmTile(S,40,3,23),fn=fbmTile(S,128,2,29);
    const h=new Float32Array(S*S),a=new Uint8Array(S*S*4);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x;const cr=Math.min(smooth(0,.022,Math.abs(cA[i]-.5)),.35+.65*smooth(0,.014,Math.abs(cB[i]-.5)));const st=Math.sin(2*Math.PI*(y/S*9+r[i]*1.3))*.5+.5;
      const H=.56*r[i]+.14*cr+.16*f[i]+.07*st+.07*fn[i];h[i]=H;
      let R=lerp(.5,.66,cv[i]),G=lerp(.48,.6,cv[i]),B=lerp(.45,.53,cv[i]);const sh=.62+.55*H;R*=sh;G*=sh;B*=sh;
      const ck=1-cr;R*=1-ck*.42;G*=1-ck*.42;B*=1-ck*.38;
      const lich=smooth(.62,.74,li[i])*smooth(.45,.7,H);const lt=li[i]>.7;R=lerp(R,lt?.78:.6,lich*.5);G=lerp(G,lt?.55:.6,lich*.5);B=lerp(B,lt?.25:.32,lich*.5);
      const g=(rnd()-.5)*.07+(fn[i]-.5)*.08;a[i*4]=c8(R+g);a[i*4+1]=c8(G+g);a[i*4+2]=c8(B+g);a[i*4+3]=255}
    TEXU.tRock.value=detailTex(h,S,32);TEXU.tRockA.value=albTex(a,S)}
  // grama: dezenas de milhares de folhas desenhadas, com trevos e flores
  {const S=1024,cv=document.createElement('canvas');cv.width=cv.height=S;const x=cv.getContext('2d');x.fillStyle='#2b4314';x.fillRect(0,0,S,S);
    const R=mulberry(31),line=(x0,y0,x1,y1)=>{for(const ox of[0,-S,S])for(const oy of[0,-S,S]){if((ox&&Math.min(x0,x1)+ox>S+20)||(ox&&Math.max(x0,x1)+ox<-20)||(oy&&Math.min(y0,y1)+oy>S+20)||(oy&&Math.max(y0,y1)+oy<-20))continue;if(!ox&&!oy){}x.beginPath();x.moveTo(x0+ox,y0+oy);x.lineTo(x1+ox,y1+oy);x.stroke()}};
    for(let k=0;k<26000;k++){const px=R()*S,py=R()*S,d=R();x.fillStyle=`hsla(${70+R()*30},${30+R()*25}%,${10+d*16}%,.5)`;x.beginPath();x.arc(px,py,2+R()*5,0,7);x.fill()}
    for(let k=0;k<75000;k++){const px=R()*S,py=R()*S,len=5+R()*15,ang=-Math.PI/2+(R()-.5)*1.3,g=R();x.strokeStyle=`hsl(${68+R()*42},${40+R()*35}%,${16+g*40}%)`;x.lineWidth=.8+R()*1.6;line(px,py,px+Math.cos(ang)*len,py+Math.sin(ang)*len)}
    for(let k=0;k<500;k++){const px=R()*S,py=R()*S;x.fillStyle=pick(['#f2e14a','#ffffff','#c48df0','#f59b3a']);x.beginPath();x.arc(px,py,1.4+R()*1.6,0,7);x.fill()}
    const id=x.getImageData(0,0,S,S).data,h=new Float32Array(S*S),a=new Uint8Array(S*S*4);for(let i=0;i<S*S;i++){h[i]=(id[i*4]*.3+id[i*4+1]*.6+id[i*4+2]*.1)/255;a[i*4]=id[i*4];a[i*4+1]=id[i*4+1];a[i*4+2]=id[i*4+2];a[i*4+3]=255}
    TEXU.tGrass.value=detailTex(h,S,18);TEXU.tGrassA.value=albTex(a,S)}
  // neve: dunas de vento (sastrugi), granulação fina e cristais
  {const S=512,b=fbmTile(S,4,5,41),f=fbmTile(S,64,2,43),h=new Float32Array(S*S),a=new Uint8Array(S*S*4);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x;const sa=Math.sin(2*Math.PI*(x/S*7+y/S*2+b[i]*1.6))*.5+.5;const H=.6*b[i]+.22*sa+.18*f[i];h[i]=H;
      const sp=rnd()>.996?.08:0;a[i*4]=c8(lerp(.76,.97,H)+sp);a[i*4+1]=c8(lerp(.83,.98,H)+sp);a[i*4+2]=c8(lerp(.95,1,H)+sp);a[i*4+3]=255}
    TEXU.tSnow.value=detailTex(h,S,8);TEXU.tSnowA.value=albTex(a,S)}
  // terra/areia: ondulações, seixos coloridos e manchas
  {const S=512,b=fbmTile(S,16,4,53),cv=fbmTile(S,6,3,57),w=worleyTile(S,44,59),h=new Float32Array(S*S),a=new Uint8Array(S*S*4);const pc=fbmTile(S,44,1,61);
    for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x;const peb=(1-smooth(.12,.3,w.F1[i]))*smooth(.48,.7,b[i])*.9;const rp=Math.sin(2*Math.PI*(x/S*14+y/S*5+b[i]*2))*.5+.5;const H=.55*b[i]+.3*rp+.15*peb;h[i]=H;
      let R=lerp(.62,.78,cv[i]),G=lerp(.5,.64,cv[i]),B=lerp(.36,.46,cv[i]);const sh=.75+.35*b[i];R*=sh;G*=sh;B*=sh;
      if(peb>.05){const t=pc[i];const pr=lerp(.42,.72,t),pg=lerp(.4,.62,t),pb=lerp(.38,.55,t);R=lerp(R,pr,peb);G=lerp(G,pg,peb);B=lerp(B,pb,peb)}
      
      const g=(rnd()-.5)*.06;a[i*4]=c8(R+g);a[i*4+1]=c8(G+g);a[i*4+2]=c8(B+g);a[i*4+3]=255}
    TEXU.tSand.value=detailTex(h,S,11);TEXU.tSandA.value=albTex(a,S)}
}
function buildTextures(){
  const S=512;
  {const r=fbmTile(S,4,6,11,.52,true),w=worleyTile(S,10,7),f=fbmTile(S,32,3,17);const h=new Float32Array(S*S);
    for(let i=0;i<h.length;i++){const cr=smooth(0,.14,w.F2[i]-w.F1[i]);h[i]=.55*r[i]+.33*cr+.12*f[i]}TEXU.tRock.value=detailTex(h,S,26)}
  {const a=fbmTile(S,64,3,23),b=fbmTile(S,8,4,29),c=fbmTile(S,128,2,31);const h=new Float32Array(S*S);for(let i=0;i<h.length;i++)h[i]=.45*a[i]+.35*b[i]+.2*c[i];TEXU.tGrass.value=detailTex(h,S,14)}
  {const a=fbmTile(S,4,5,41),b=fbmTile(S,16,3,43);const h=new Float32Array(S*S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x;h[i]=.7*a[i]+.12*b[i]+.18*(Math.sin(2*Math.PI*(x/S*7+y/S*2+a[i]*1.6))*.5+.5)}TEXU.tSnow.value=detailTex(h,S,7)}
  {const a=fbmTile(S,16,4,53),w=worleyTile(S,40,59);const h=new Float32Array(S*S);for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=y*S+x;h[i]=.6*a[i]+.28*(Math.sin(2*Math.PI*(x/S*14+y/S*5+a[i]*2))*.5+.5)+.12*(1-smooth(0,.45,w.F1[i]))}TEXU.tSand.value=detailTex(h,S,16)}
  {const a=fbmTile(256,8,5,61,.55);TEXU.tWaves.value=detailTex(a,256,9)}
  {const S2=256,a=fbmTile(S2,4,4,71),h=new Float32Array(S2*S2);for(let y=0;y<S2;y++)for(let x=0;x<S2;x++){const i=y*S2+x;h[i]=.75*a[i]+.25*(Math.sin(2*Math.PI*x/S2*48)*Math.sin(2*Math.PI*y/S2*48)*.5+.5)}CLOTH=detailTex(h,S2,5)}
}

// foliage atlas: TL pine branch, TR leaf cluster, BL bark, BR shrub
let ATLAS=null;
function buildAtlas(){
  const c=document.createElement('canvas');c.width=c.height=1024;const x=c.getContext('2d');const R=mulberry(99);const r=(a,b)=>a+R()*(b-a);
  // pine branch (0..512,0..512) - u along branch (trunk at left)
  x.save();x.beginPath();x.rect(0,0,512,512);x.clip();
  for(let s=0;s<3;s++){
    const yoff=256;
    for(let k=0;k<92;k++){const t=k/92,bx=10+t*480,half=(1-t*.68)*238;
      for(const sg of[-1,1]){const len=half*r(.75,1.05),ang=sg*r(.55,.95);
        const ex=bx+Math.cos(ang)*len*.55,ey=yoff+Math.sin(ang)*len;
        x.strokeStyle=`rgba(${38+s*6},${30+s*4},${18},.9)`;x.lineWidth=2;x.beginPath();x.moveTo(bx,yoff);x.lineTo(ex,ey);x.stroke();
        for(let q=0;q<16;q++){const u=q/16,px=lerp(bx,ex,u),py=lerp(yoff,ey,u),nl=r(12,24)*(1-u*.4);
          for(const ns of[-1,1]){const na=ang+ns*r(.5,1.0)+(sg>0?-.3:.3);const g=r(55,105)+s*18;x.strokeStyle=`rgba(${r(14,32)},${g},${r(28,46)},${r(.75,1)})`;x.lineWidth=r(1.8,3.2);x.beginPath();x.moveTo(px,py);x.lineTo(px+Math.cos(na)*nl+6,py+Math.sin(na)*nl);x.stroke()}}}}
  }
  x.strokeStyle='#3b2a1a';x.lineWidth=7;x.beginPath();x.moveTo(0,256);x.lineTo(500,256);x.stroke();x.restore();
  // leaf cluster (512..1024,0..512)
  x.save();x.beginPath();x.rect(512,0,512,512);x.clip();
  for(let k=0;k<620;k++){const a=r(0,Math.PI*2),d=Math.pow(R(),.6)*215,px=768+Math.cos(a)*d,py=256+Math.sin(a)*d,sz=r(10,20),rot=r(0,Math.PI*2),sh=r(.75,1.15)*(1-d/400);
    x.save();x.translate(px,py);x.rotate(rot);const g=x.createLinearGradient(-sz,0,sz,0);g.addColorStop(0,`rgb(${40*sh|0},${100*sh|0},${28*sh|0})`);g.addColorStop(1,`rgb(${85*sh|0},${150*sh|0},${45*sh|0})`);x.fillStyle=g;x.beginPath();x.ellipse(0,0,sz,sz*.45,0,0,Math.PI*2);x.fill();x.strokeStyle='rgba(20,50,10,.35)';x.lineWidth=1;x.beginPath();x.moveTo(-sz,0);x.lineTo(sz,0);x.stroke();x.restore()}
  x.restore();
  // bark (0..512,512..1024)
  x.fillStyle='#4a3626';x.fillRect(0,512,512,512);
  for(let k=0;k<900;k++){const px=r(0,512),w=r(2,9);x.fillStyle=R()<.5?`rgba(30,20,12,${r(.3,.7)})`:`rgba(120,95,70,${r(.15,.4)})`;x.fillRect(px,512+r(0,512),w,r(20,140))}
  // shrub (512..1024,512..1024)
  x.save();x.beginPath();x.rect(512,512,512,512);x.clip();
  for(let k=0;k<26;k++){const a=-Math.PI/2+r(-1.1,1.1),len=r(120,230);x.strokeStyle='#5a4630';x.lineWidth=r(2,4);x.beginPath();x.moveTo(768,1010);const ex=768+Math.cos(a)*len,ey=1010+Math.sin(a)*len;x.lineTo(ex,ey);x.stroke();
    for(let q=0;q<10;q++){const u=r(.3,1),px=lerp(768,ex,u),py=lerp(1010,ey,u),sz=r(5,11);x.fillStyle=`rgb(${r(80,120)|0},${r(95,130)|0},${r(40,60)|0})`;x.beginPath();x.ellipse(px+r(-8,8),py+r(-8,8),sz,sz*.5,r(0,3),0,Math.PI*2);x.fill()}}
  x.restore();
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;t.generateMipmaps=true;t.minFilter=THREE.LinearMipmapLinearFilter;ATLAS=t;
}
function cTex(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=8;return t}
const puffTex=cTex(128,128,(x,w,h)=>{const id=x.createImageData(w,h);const n=makeNoise(mulberry(5));for(let y=0;y<h;y++)for(let i=0;i<w;i++){const dx=(i-64)/64,dy=(y-64)/64,d=Math.hypot(dx,dy);const v=clamp(1-d,0,1);const nn=fbm(n,i*.06,y*.06,3)*.5+.5;const a=Math.pow(v,1.4)*(.55+.6*nn);const k=(y*w+i)*4;id.data[k]=id.data[k+1]=id.data[k+2]=255;id.data[k+3]=clamp(a,0,1)*255}x.putImageData(id,0,0)});
const glowTex=cTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h)});
function bannerTex(text,bg1,bg2,checker){return cTex(1024,128,(x,w,h)=>{
  if(checker){const sq=h/4;for(let i=0;i<w/sq;i++)for(let j=0;j<4;j++){x.fillStyle=(i+j)%2?'#111':'#fff';x.fillRect(i*sq,j*sq,sq,sq)}x.fillStyle='rgba(10,10,10,.85)';x.fillRect(w*.2,h*.1,w*.6,h*.8)}
  else{const g=x.createLinearGradient(0,0,w,0);g.addColorStop(0,bg1);g.addColorStop(1,bg2);x.fillStyle=g;x.fillRect(0,0,w,h);x.fillStyle='rgba(255,255,255,.14)';for(let i=-h;i<w;i+=60){x.beginPath();x.moveTo(i,h);x.lineTo(i+h,0);x.lineTo(i+h+18,0);x.lineTo(i+18,h);x.fill()}}
  x.font=`italic 900 82px 'Saira Condensed', Impact, sans-serif`;x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.45)';x.shadowOffsetY=4;x.fillText(text,w/2,h/2+4)})}
const archTex=cTex(512,64,(x,w,h)=>{for(let i=0;i<8;i++){x.fillStyle=i%2?'#ff4a1c':'#ffd23f';x.fillRect(i*64,0,64,h)}x.fillStyle='rgba(0,0,0,.18)';x.fillRect(0,h*.75,w,h*.25)});archTex.wrapS=THREE.RepeatWrapping;

