// ======================================================================
// PARTICLES
// ======================================================================
class PSys{
  constructor(max,additive,tex){
    this.max=max;this.head=0;
    const g=this.geo=new THREE.BufferGeometry();
    this.pos=new Float32Array(max*3);this.col=new Float32Array(max*3);this.size=new Float32Array(max);this.alpha=new Float32Array(max);
    this.vel=new Float32Array(max*3);this.life=new Float32Array(max);this.lmax=new Float32Array(max);this.grav=new Float32Array(max);this.a0=new Float32Array(max);this.grow=new Float32Array(max);this.rot=new Float32Array(max);
    g.setAttribute('position',new THREE.BufferAttribute(this.pos,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('pcol',new THREE.BufferAttribute(this.col,3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('size',new THREE.BufferAttribute(this.size,1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('alpha',new THREE.BufferAttribute(this.alpha,1).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('prot',new THREE.BufferAttribute(this.rot,1));
    this.mat=new THREE.ShaderMaterial({uniforms:{scale:{value:innerHeight*.5},map:{value:tex},uLight:{value:new THREE.Color(1,1,1)}},transparent:true,depthWrite:false,blending:additive?THREE.AdditiveBlending:THREE.NormalBlending,
      vertexShader:`attribute float size;attribute float alpha;attribute vec3 pcol;attribute float prot;varying float vA;varying vec3 vC;varying float vR;uniform float scale;
      void main(){vA=alpha;vC=pcol;vR=prot;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=min(size*scale/-mv.z,400.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`uniform sampler2D map;uniform vec3 uLight;varying float vA;varying vec3 vC;varying float vR;
      void main(){vec2 p=gl_PointCoord-.5;float c=cos(vR),s=sin(vR);p=mat2(c,-s,s,c)*p+.5;vec4 t=texture2D(map,p);gl_FragColor=vec4(vC*uLight,t.a*vA);}`});
    this.pts=new THREE.Points(g,this.mat);this.pts.frustumCulled=false;this.pts.renderOrder=6;scene.add(this.pts);
  }
  emit(x,y,z,vx,vy,vz,r,g,b,size,life,grav=0,alpha=1,grow=0){const i=this.head;this.head=(this.head+1)%this.max;const i3=i*3;
    this.pos[i3]=x;this.pos[i3+1]=y;this.pos[i3+2]=z;this.vel[i3]=vx;this.vel[i3+1]=vy;this.vel[i3+2]=vz;this.col[i3]=r;this.col[i3+1]=g;this.col[i3+2]=b;
    this.size[i]=size;this.life[i]=life;this.lmax[i]=life;this.grav[i]=grav;this.a0[i]=alpha;this.grow[i]=grow;this.rot[i]=Math.random()*6.28}
  update(dt){const drag=Math.exp(-dt*1.5);let any=false;
    for(let i=0;i<this.max;i++){if(this.life[i]<=0){if(this.alpha[i]!==0)this.alpha[i]=0;continue}any=true;
      this.life[i]-=dt;const i3=i*3;this.vel[i3+1]-=this.grav[i]*dt;this.vel[i3]*=drag;this.vel[i3+1]*=drag;this.vel[i3+2]*=drag;
      this.pos[i3]+=this.vel[i3]*dt;this.pos[i3+1]+=this.vel[i3+1]*dt;this.pos[i3+2]+=this.vel[i3+2]*dt;this.size[i]+=this.grow[i]*dt;
      const t=this.life[i]/this.lmax[i];this.alpha[i]=this.life[i]>0?this.a0[i]*Math.min(1,t*2.2)*Math.min(1,(1-t)*8):0}
    const a=this.geo.attributes;a.position.needsUpdate=a.pcol.needsUpdate=a.size.needsUpdate=a.alpha.needsUpdate=true;a.prot.needsUpdate=true}
}
const bubbleTex=cTex(64,64,(x,w,h)=>{const g=x.createRadialGradient(32,32,10,32,32,31);g.addColorStop(0,'rgba(255,255,255,0.04)');g.addColorStop(.75,'rgba(255,255,255,0.18)');g.addColorStop(.92,'rgba(255,255,255,0.95)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.beginPath();x.arc(32,32,31,0,7);x.fill();x.fillStyle='rgba(255,255,255,.95)';x.beginPath();x.ellipse(22,21,6,4,-.6,0,7);x.fill()});
const PUFF=new PSys(5000,false,puffTex),GLOW=new PSys(2500,true,glowTex),BUB=new PSys(1500,false,bubbleTex);const PSYS=[PUFF,GLOW,BUB];
function burst(p,n,col,spd,size,life,grav=0,grow=0,sys=PUFF){for(let k=0;k<n;k++){const a=Math.random()*Math.PI*2,b=Math.random()*Math.PI-.3,v=spd*rand(.3,1);sys.emit(p.x,p.y,p.z,Math.cos(a)*Math.cos(b)*v,Math.sin(b)*v+spd*.2,Math.sin(a)*Math.cos(b)*v,col[0],col[1],col[2],size*rand(.6,1.3),life*rand(.6,1.2),grav,1,grow)}}
// snowfall
const SNOWN=1800,snowPos=new Float32Array(SNOWN*3);for(let i=0;i<SNOWN*3;i++)snowPos[i]=rand(-60,60);
const snowGeo=new THREE.BufferGeometry();snowGeo.setAttribute('position',new THREE.BufferAttribute(snowPos,3));
const snow=new THREE.Points(snowGeo,new THREE.PointsMaterial({size:.22,map:glowTex,transparent:true,depthWrite:false,opacity:0,color:0xffffff}));snow.frustumCulled=false;scene.add(snow);

