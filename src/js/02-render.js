// ======================================================================
// RENDERER + POST
// ======================================================================
const canvas=document.getElementById('c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance',stencil:false});
renderer.setSize(innerWidth,innerHeight);
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.fog=new THREE.FogExp2(0xffffff,0);
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.3,9000);
let DR=1;
const post={on:false,composer:null,bloom:null,grade:null};
const GradeShader={
  uniforms:{tDiffuse:{value:null},uRes:{value:new THREE.Vector2(1,1)},uTime:{value:0},uBoost:{value:0},uExp:{value:1},uSunUV:{value:new THREE.Vector2(.5,.5)},uSunVis:{value:0},uSunTint:{value:new THREE.Color(1,.9,.7)},uRays:{value:1},uUW:{value:0},uSharp:{value:.25}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 uRes;uniform float uTime,uBoost,uExp,uSunVis,uRays,uUW,uSharp;uniform vec2 uSunUV;uniform vec3 uSunTint;varying vec2 vUv;
  vec3 agx(vec3 color){const mat3 I=mat3(vec3(.856627153315983,.137318972929847,.11189821299995),vec3(.0951212405381588,.761241990602591,.0767994186031903),vec3(.0482516061458583,.101439036467562,.811302368396859));
  const mat3 O=mat3(vec3(1.1271005818144368,-.1413297634984383,-.14132976349843826),vec3(-.11060664309660323,1.157823702216272,-.11060664309660294),vec3(-.016493938717834573,-.016493938717834257,1.2519364065950405));
  const mat3 toR=mat3(vec3(.6274,.0691,.0164),vec3(.3293,.9195,.0880),vec3(.0433,.0113,.8956));const mat3 fromR=mat3(vec3(1.6605,-.1246,-.0182),vec3(-.5876,1.1329,-.1006),vec3(-.0728,-.0083,1.1187));
  color=toR*color;color=I*color;color=max(color,1e-10);color=log2(color);color=(color+12.47393)/(4.026069+12.47393);color=clamp(color,0.,1.);
  vec3 x2=color*color,x4=x2*x2;color=15.5*x4*x2-40.14*x4*color+31.96*x4-6.868*x2*color+.4298*x2+.1191*color-.00232;
  color=O*color;color=pow(max(vec3(0.),color),vec3(2.2));color=fromR*color;return clamp(color,0.,1.);}
  vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}
  float hsh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
  void main(){
    vec2 uv=vUv;if(uUW>0.)uv+=vec2(sin(uv.y*38.+uTime*2.6),cos(uv.x*31.+uTime*2.1))*.0028*uUW;vec2 dc=uv-.5;float asp=uRes.x/uRes.y;
    float ca=.0012+uBoost*.0035;vec3 col=vec3(0.);
    if(uBoost>.01){for(int i=0;i<8;i++){float t=float(i)/7.;vec2 o=dc*t*.07*uBoost;col.r+=texture2D(tDiffuse,uv-o-dc*ca).r;col.g+=texture2D(tDiffuse,uv-o).g;col.b+=texture2D(tDiffuse,uv-o+dc*ca).b;}col/=8.;}
    else{col.r=texture2D(tDiffuse,uv-dc*ca).r;col.g=texture2D(tDiffuse,uv).g;col.b=texture2D(tDiffuse,uv+dc*ca).b;}
    if(uSharp>0.){vec2 px=1./uRes;vec3 nb=texture2D(tDiffuse,uv+vec2(px.x,0.)).rgb+texture2D(tDiffuse,uv-vec2(px.x,0.)).rgb+texture2D(tDiffuse,uv+vec2(0.,px.y)).rgb+texture2D(tDiffuse,uv-vec2(0.,px.y)).rgb;vec3 lap=col-nb*.25;col=max(col+lap*uSharp/(1.+abs(lap)*2.),0.);}
    if(uRays>.5&&uSunVis>.01){vec2 dir=uSunUV-uv;float acc=0.;float j=hsh(uv*uRes+uTime);
      for(int i=0;i<14;i++){float t=(float(i)+j)/14.;vec3 s=texture2D(tDiffuse,uv+dir*t*.92).rgb;acc+=smoothstep(1.8,5.,dot(s,vec3(.3,.5,.2)));}
      acc/=14.;float fall=exp(-length(dir*vec2(asp,1.))*2.4);col+=uSunTint*acc*fall*uSunVis*.75;
      vec2 sv=(uv-uSunUV)*vec2(asp,1.);col+=uSunTint*uSunVis*.06*exp(-dot(sv,sv)*30.);
      for(int g=1;g<4;g++){vec2 gp=mix(uSunUV,vec2(.5),float(g)*.55);vec2 gd=(uv-gp)*vec2(asp,1.);float r=.025*float(g);col+=uSunTint*uSunVis*.035*smoothstep(r,r*.6,length(gd));}}
    col=mix(col,col*vec3(.92,1.,1.04),uUW);col*=uExp*1.15*mix(1.,.9,uUW);col=agx(col);col=toSRGB(col);
    float l=dot(col,vec3(.2126,.7152,.0722));col=mix(vec3(l),col,1.22+uUW*.3);
    col=mix(col,col*col*(3.-2.*col),.2+uUW*.25);
    col+=vec3(-.012,.0,.016)*(1.-l)+vec3(.016,.007,-.012)*l;
    float v=smoothstep(1.05,.3,length(dc*vec2(asp,1.)*.9));col*=mix(.7,1.,v);
    col+=(hsh(uv*uRes+fract(uTime)*91.)-.5)*.02;
    gl_FragColor=vec4(clamp(col,0.,1.),1.);
  }`
};
function setupPost(){
  if(post.composer){post.composer.renderTarget1.dispose();post.composer.renderTarget2.dispose();post.composer=null}
  if(post.sceneRT){post.sceneRT.dispose();if(post.sceneRT.depthTexture)post.sceneRT.depthTexture.dispose();post.sceneRT=null}
  if(post.ao){try{post.ao.dispose()}catch(e){}post.ao=null}
  post.on=!!QL.post;
  renderer.toneMapping=post.on?THREE.NoToneMapping:THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1;
  if(!post.on){scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}});return}
  // a cena é renderizada num alvo com MSAA e textura de profundidade (usada pela oclusão ambiente)
  const dtex=new THREE.DepthTexture(innerWidth,innerHeight);dtex.type=THREE.UnsignedIntType;
  post.sceneRT=new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType,samples:QL.msaa,depthTexture:dtex});
  const comp=new EffectComposer(renderer,new THREE.WebGLRenderTarget(innerWidth,innerHeight,{type:THREE.HalfFloatType}));
  post.input=new ShaderPass({uniforms:{tScene:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tScene;varying vec2 vUv;void main(){vec4 c=texture2D(tScene,vUv);if(!(c==c))c=vec4(0.,0.,0.,1.);gl_FragColor=vec4(clamp(c.rgb,0.,64.),1.);}`},'tNone');
  post.input.uniforms.tScene.value=post.sceneRT.texture;comp.addPass(post.input);
  // GTAOPass do r160 quebra quando recebe só a profundidade (procura normalRenderTarget); um alvo vazio resolve
  if(!GTAOPass.prototype._rrFix){const sg=GTAOPass.prototype.setGBuffer;GTAOPass.prototype.setGBuffer=function(d,n){if(d!==undefined&&!this.normalRenderTarget)this.normalRenderTarget={depthTexture:d,setSize(){},dispose(){}};return sg.call(this,d,n)};GTAOPass.prototype._rrFix=1}
  if(QL.ao){try{post.ao=new GTAOPass(scene,camera,innerWidth,innerHeight,{depthTexture:dtex},{radius:2.4,distanceExponent:1.4,thickness:3,scale:1.1,samples:QL.ao,distanceFallOff:1,screenSpaceRadius:false});post.ao.blendIntensity=.9;comp.addPass(post.ao);comp.addPass(new ShaderPass({uniforms:{tDiffuse:{value:null}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform sampler2D tDiffuse;varying vec2 vUv;void main(){vec4 c=texture2D(tDiffuse,vUv);if(!(c==c)||!(c.r+c.g+c.b<1e4))c=vec4(0.,0.,0.,1.);gl_FragColor=vec4(clamp(c.rgb,0.,64.),1.);}`}))}catch(e){console.warn('AO',e);post.ao=null}}
  if(QL.bloom){post.bloom=new UnrealBloomPass(new THREE.Vector2(innerWidth/2,innerHeight/2),.42,.6,2.2);comp.addPass(post.bloom)}else post.bloom=null;
  post.grade=new ShaderPass(GradeShader);comp.addPass(post.grade);post.grade.uniforms.uSharp.value=QL.ao?.24:.16;
  post.composer=comp;resize();
  scene.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}});
}
function resize(){
  const pr=Math.min(devicePixelRatio||1,QL.pr)*DR;
  renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
  if(post.composer){post.composer.setPixelRatio(pr);post.composer.setSize(innerWidth,innerHeight);post.grade.uniforms.uRes.value.set(innerWidth*pr,innerHeight*pr);if(post.sceneRT)post.sceneRT.setSize(Math.floor(innerWidth*pr),Math.floor(innerHeight*pr));if(post.ao&&QL.aoHalf)post.ao.setSize(Math.floor(innerWidth*pr*.5),Math.floor(innerHeight*pr*.5))}
  PSYS.forEach(p=>p.mat.uniforms.scale.value=innerHeight*pr*.5);
}
addEventListener('resize',resize);

// sky dome
const skyFrag=`${GLSL_SKY}varying vec3 vD;
void main(){vec3 d=normalize(vD);vec3 c;
 #ifdef ENVMODE
  c=d.y>=0.?rr_sky(d):mix(rr_fogCol(d),uGround,smoothstep(0.,.25,-d.y));
 #else
  c=d.y>=0.?rr_sky(d):rr_fogCol(d);
  float s=dot(d,uSunDir);c+=uSunCol*smoothstep(.99935,.99968,s)*45.;
 #endif
 if(d.y>0.){vec2 u2=d.xz/(d.y+.04)*.3+uTime*vec2(.003,.001);float h2=rr_fbm(vec2(u2.x*.45,u2.y*2.6)+rr_fbm(u2*3.)*.45);
  float cl2=smoothstep(.5,.8,h2)*smoothstep(0.,.22,d.y)*.5;float s3=max(dot(d,uSunDir),0.);
  vec3 c2=mix(uSkyHor,vec3(1.)+uSunCol*.35,.55)+uSunCol*pow(s3,6.)*1.1;c=mix(c,c2,cl2);}
 if(d.y>0.){vec2 uv=d.xz/(d.y+.12);vec2 q=uv*1.15+uTime*vec2(.006,.0025);
  float n=rr_fbm(q+rr_fbm(q*2.1)*.55);float cov=uCloud.x;
  float cl=smoothstep(1.-cov-.08,1.-cov+.28,n)*smoothstep(0.,.14,d.y);
  float sh=rr_fbm(q+uSunDir.xz*.12+rr_fbm(q*2.1)*.55);
  float lit=clamp(.55+(n-sh)*4.,0.,1.);float s2=max(dot(d,uSunDir),0.);
  vec3 cc=mix(uSkyHor*.72+uSkyTop*.1,vec3(1.)*.95+uSunCol*.35,lit)+uSunCol*pow(s2,10.)*.8*(1.-cl*.6);
  c=mix(c,cc,cl*.94);}
 gl_FragColor=vec4(c,1.);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
}`;
const skyVert=`varying vec3 vD;void main(){vD=position;vec4 p=projectionMatrix*modelViewMatrix*vec4(position,1.);gl_Position=p.xyww;}`;
const skyMat=new THREE.ShaderMaterial({uniforms:FOGU,vertexShader:skyVert,fragmentShader:skyFrag,side:THREE.BackSide,depthWrite:false,fog:false});
const sky=new THREE.Mesh(new THREE.SphereGeometry(100,48,24),skyMat);sky.frustumCulled=false;sky.renderOrder=-10;scene.add(sky);
const envScene=new THREE.Scene();
const envSky=new THREE.Mesh(new THREE.SphereGeometry(100,48,24),new THREE.ShaderMaterial({uniforms:FOGU,vertexShader:skyVert,fragmentShader:skyFrag,side:THREE.BackSide,depthWrite:false,fog:false,defines:{ENVMODE:1}}));
envScene.add(envSky);
const pmrem=new THREE.PMREMGenerator(renderer);let envRT=null;

const sun=new THREE.DirectionalLight(0xffffff,3);
sun.castShadow=true;
Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:1,far:900});
sun.shadow.bias=-.0003;sun.shadow.normalBias=.35;
scene.add(sun,sun.target);
const fill=new THREE.HemisphereLight(0xffffff,0x444444,.15);scene.add(fill);
function setShadowRes(){sun.shadow.mapSize.set(QL.shadow,QL.shadow);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}}
setShadowRes();

const SKIES={
  day:{top:0x2c6fd8,hor:0xbdd8f2,sun:0xfff1dc,sunI:3.7,elev:.78,az:.7,exp:1.0,fog:[.0032,.0055,.00010],cloud:[.42,.6],ground:0x5d6152,mul:1.35},
  golden:{top:0x3567c2,hor:0xffcf9c,sun:0xffb874,sunI:3.4,elev:.3,az:2.3,exp:1.06,fog:[.0034,.0050,.00011],cloud:[.48,.65],ground:0x6b5a45,mul:1.3},
  sunset:{top:0x1d2a66,hor:0xff8a5a,sun:0xff8f50,sunI:3.0,elev:.18,az:-2.5,exp:1.15,fog:[.0033,.0050,.00011],cloud:[.52,.55],ground:0x4a3a40,mul:1.25},
  crisp:{top:0x1648b2,hor:0xd4eaff,sun:0xffffff,sunI:3.9,elev:.55,az:-.9,exp:.95,fog:[.0024,.0060,.00008],cloud:[.3,.5],ground:0x8090a0,mul:1.4},
};
const SUN_DIR=new V3();let SKY=SKIES.day;
function applySky(k,baseH){
  const S=SKY=SKIES[k];
  FOGU.uSkyTop.value.setHex(S.top).multiplyScalar(S.mul);FOGU.uSkyHor.value.setHex(S.hor).multiplyScalar(S.mul);
  FOGU.uSunCol.value.setHex(S.sun);FOGU.uGround.value.setHex(S.ground).multiplyScalar(.6);
  SUN_DIR.set(Math.cos(S.elev)*Math.sin(S.az),Math.sin(S.elev),Math.cos(S.elev)*Math.cos(S.az)).normalize();
  FOGU.uSunDir.value.copy(SUN_DIR);
  FOGU.uFogP.value.set(S.fog[0],S.fog[1],baseH,S.fog[2]);FOGU.uCloud.value.set(S.cloud[0],S.cloud[1]);
  sun.color.setHex(S.sun);sun.intensity=S.sunI;
  fill.color.setHex(S.top);fill.groundColor.setHex(S.ground);
  if(post.grade){post.grade.uniforms.uExp.value=S.exp;post.grade.uniforms.uSunTint.value.setHex(S.sun)}
  renderer.toneMappingExposure=S.exp;
  envSky.position.set(0,0,0);
  if(envRT)envRT.dispose();envRT=pmrem.fromScene(envScene,0,.1,1000);scene.environment=envRT.texture;
}

