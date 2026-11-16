// ======================================================================
// GLSL SHARED (aerial perspective fog, sky, clouds)
// ======================================================================
const FOGU={
  uSunDir:{value:new V3(0,1,0)},uSunCol:{value:new THREE.Color(1,1,1)},uSkyTop:{value:new THREE.Color()},uSkyHor:{value:new THREE.Color()},
  uFogP:{value:new THREE.Vector4(.004,.006,0,.0001)},uTime:{value:0},uCloud:{value:new THREE.Vector2(.45,.6)},uGround:{value:new THREE.Color(.2,.2,.2)},uUnder:{value:new THREE.Vector4(0,0,0,0)},uWater:{value:new THREE.Vector2(0,0)},
};
const GLSL_NOISE=`
float rr_hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}
vec3 rr_hash3(vec3 p){p=fract(p*vec3(.1031,.1030,.0973));p+=dot(p,p.yxz+33.33);return fract((p.xxy+p.yxx)*p.zyx);}
float rr_vnoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(rr_hash(i),rr_hash(i+vec2(1.,0.)),f.x),mix(rr_hash(i+vec2(0.,1.)),rr_hash(i+vec2(1.,1.)),f.x),f.y);}
float rr_fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*rr_vnoise(p);p=p*2.03+vec2(17.1,9.3);a*=.5;}return s;}
`;
const GLSL_SKY=`
uniform vec3 uSunDir;uniform vec3 uSunCol;uniform vec3 uSkyTop;uniform vec3 uSkyHor;uniform vec4 uFogP;uniform float uTime;uniform vec2 uCloud;uniform vec3 uGround;uniform vec4 uUnder;uniform vec2 uWater;
${GLSL_NOISE}
vec3 rr_sky(vec3 d){float h=max(d.y,0.);vec3 c=mix(uSkyHor,uSkyTop,pow(h,.42));float s=max(dot(d,uSunDir),0.);
 c+=uSunCol*(pow(s,5.)*.22+pow(s,64.)*.55);c+=uSunCol*.2*pow(1.-h,5.)*s*s;return c;}
vec3 rr_fogCol(vec3 d){return rr_sky(normalize(vec3(d.x,max(d.y,0.)*.3+.015,d.z)));}
float rr_aerial(float dist,vec3 rd){float a=uFogP.x,b=uFogP.y;float camH=cameraPosition.y-uFogP.z;
 float c=a*exp(-camH*b);float k=rd.y*b;float t=abs(k)>1e-5?(1.-exp(-dist*k))/k:dist;
 float hf=1.-exp(-c*max(t,0.));float hz=1.-exp(-dist*uFogP.w);return clamp(1.-(1.-hf)*(1.-hz),0.,1.);}
const vec3 RR_SIG=vec3(.034,.0135,.011);const vec3 RR_KD=vec3(.05,.022,.015);const vec3 RR_WCOL=vec3(.16,.58,.9);
float rr_caus(vec2 q){q*=.32;vec2 w=q+vec2(rr_vnoise(q*.7+uTime*.15),rr_vnoise(q*.7-uTime*.12+5.3))*1.3;float a=rr_vnoise(w*1.6+uTime*.22),b=rr_vnoise(w*2.08-uTime*.18+3.7);return pow(1.-abs(a-b),8.)*1.7+pow(max(1.-abs(a+b-1.),0.),12.)*.5;}
vec3 rr_underFog(vec3 c,vec3 ro,vec3 rd,float d){
  float y0=min(ro.y-uWater.x,0.);vec3 a=RR_SIG-RR_KD*rd.y;a=mix(a,vec3(1e-4),step(abs(a),vec3(1e-4)));vec3 I=(1.-exp(-a*d))/a;
  float mu=max(dot(rd,uSunDir),0.);float m2=mu*mu;
  vec3 ins=vec3(.08,.48,.88)*RR_SIG*exp(RR_KD*y0*1.25)*I*(1.1+.45*m2*m2)*.6;
  vec3 acc=vec3(0.);float tm=min(d,80.);float dt=tm/7.;float j=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))));
  for(int n=0;n<7;n++){float t=(float(n)+j)*dt;vec3 p=ro+rd*t;float py=min(p.y-uWater.x,0.);vec2 q=p.xz-uSunDir.xz*(py/max(uSunDir.y,.15));
    float pat=smoothstep(.42,.72,rr_vnoise(q/22.+uTime*.04))*smoothstep(.3,.68,rr_vnoise(q.yx/9.+.3-uTime*.03));
    acc+=exp(-RR_SIG*t+RR_KD*(py/max(uSunDir.y,.15)))*(pat*6.5+.025);}
  vec3 sh=acc*dt*RR_SIG*(RR_WCOL*1.15+vec3(.0,.04,.03))*mix(vec3(1.),uSunCol,.4)*(.25+1.8*mu*mu*mu)*.6;
  return min(c*exp(-RR_SIG*d)+ins+sh,vec3(64.));}
float rr_cloudShadow(vec3 p){vec2 q=p.xz*.0011+uTime*vec2(.006,.003);float n=rr_fbm(q*1.3);return 1.-.55*smoothstep(1.-uCloud.x-.05,1.-uCloud.x+.25,n)*uCloud.y;}
`;
THREE.ShaderChunk.fog_pars_vertex='#ifdef USE_FOG\nvarying vec3 vFogView;\n#endif';
THREE.ShaderChunk.fog_vertex='#ifdef USE_FOG\nvFogView=mvPosition.xyz;\n#endif';
THREE.ShaderChunk.fog_pars_fragment='#ifdef USE_FOG\nuniform vec3 fogColor;uniform float fogDensity;varying vec3 vFogView;\n'+GLSL_SKY+'\n#endif';
THREE.ShaderChunk.fog_fragment='#ifdef USE_FOG\nvec3 rrFW=(vec4(vFogView,0.)*viewMatrix).xyz;float rrFD=length(rrFW);vec3 rrDir=rrFW/max(rrFD,1e-3);\nif(uUnder.w>0.){gl_FragColor.rgb=rr_underFog(gl_FragColor.rgb,cameraPosition,rrDir,rrFD);}else gl_FragColor.rgb=mix(gl_FragColor.rgb,rr_fogCol(rrDir)*fogColor,rr_aerial(rrFD,rrDir));\n#endif';
THREE.ShaderChunk.lights_fragment_begin=THREE.ShaderChunk.lights_fragment_begin.replace('IncidentLight directLight;',`IncidentLight directLight;
vec3 rrSunT=vec3(1.);float rrUY=1.;
#if defined(USE_FOG)&&defined(STANDARD)
vec3 rrWP=(vec4(geometryPosition-viewMatrix[3].xyz,0.)*viewMatrix).xyz;rrUY=rrWP.y-uWater.x;
if(uWater.y>.5&&rrUY<0.){float rrSy=max(uSunDir.y,.15);vec2 rrQ=rrWP.xz-uSunDir.xz*(rrUY/rrSy);rrSunT=exp(RR_KD*(rrUY/rrSy))*(.3+rr_caus(rrQ)*1.6);}
#endif`).replace('getDirectionalLightInfo( directionalLight, directLight );','getDirectionalLightInfo( directionalLight, directLight );directLight.color*=rrSunT;');
THREE.ShaderChunk.aomap_fragment=THREE.ShaderChunk.aomap_fragment+`
#if defined(USE_FOG)&&defined(STANDARD)
if(uWater.y>.5&&rrUY<0.){float rrK=smoothstep(0.,-1.5,rrUY);vec3 rrAm=vec3(.25,.72,1.)*exp(RR_KD*rrUY*1.2)*1.25*(.45+.55*(normal.y*.5+.5));
reflectedLight.indirectDiffuse=mix(reflectedLight.indirectDiffuse,diffuseColor.rgb*rrAm,rrK);reflectedLight.indirectSpecular*=mix(1.,.35,rrK);}
#endif`;
THREE.Material.prototype.onBeforeCompile=function(sh){Object.assign(sh.uniforms,FOGU)};

