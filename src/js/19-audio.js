// ======================================================================
// AUDIO — trilha e efeitos 100% procedurais (WebAudio, sem arquivos)
// ======================================================================
const AU={ctx:null,on:LS.get('sound2','1')==='1',vol:.8,last:{}};
function audioInit(){
  if(AU.ctx)return AU.ctx;const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;
  const c=AU.ctx=new AC();c.onstatechange=()=>{if(c.state==='running'&&!AU.startedAt)AU.startedAt=performance.now();updSndBtn()};
  AU.master=c.createGain();AU.master.gain.value=AU.on?AU.vol:0;
  const comp=c.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.22;AU.master.connect(comp);comp.connect(c.destination);
  AU.musicLP=c.createBiquadFilter();AU.musicLP.type='lowpass';AU.musicLP.frequency.value=18000;AU.musicLP.connect(AU.master);
  AU.musicBus=c.createGain();AU.musicBus.gain.value=.5;AU.musicBus.connect(AU.musicLP);
  AU.padBus=c.createGain();AU.padBus.gain.value=1;AU.padBus.connect(AU.musicBus);
  AU.sfxBus=c.createGain();AU.sfxBus.gain.value=.85;AU.sfxBus.connect(AU.master);
  AU.rev=c.createConvolver();{const n=c.sampleRate*2.4,b=c.createBuffer(2,n,c.sampleRate);for(let ch=0;ch<2;ch++){const d=b.getChannelData(ch);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2.4)}AU.rev.buffer=b}
  const rg=c.createGain();rg.gain.value=.25;AU.rev.connect(rg);rg.connect(AU.master);
  {const n=c.sampleRate*2,b=c.createBuffer(1,n,c.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;AU.noise=b}
  // vento / ambiente
  const ws=c.createBufferSource();ws.buffer=AU.noise;ws.loop=true;AU.windF=c.createBiquadFilter();AU.windF.type='bandpass';AU.windF.frequency.value=500;AU.windF.Q.value=.7;AU.windG=c.createGain();AU.windG.gain.value=0;ws.connect(AU.windF);AU.windF.connect(AU.windG);AU.windG.connect(AU.master);ws.start();
  MUS.next=c.currentTime+.15;if(!MUS.mel.snow)setMusicRound(G.round);setInterval(musicTick,25);
  return c;
}
function audioUnlock(){const c=audioInit();if(c&&c.state!=='running')c.resume().then(updSndBtn).catch(()=>{});updSndBtn()}
function updSndBtn(){const b=$('btnSnd');if(!b)return;const run=AU.ctx&&AU.ctx.state==='running';b.textContent=!AU.on?'SOM: OFF':run?'SOM: ON':'🔊 LIGAR SOM';b.setAttribute('aria-pressed',AU.on?'true':'false');const h=$('sndHint');if(h)h.classList.toggle('show',AU.on&&!run)}
function tone(type,freq,t,dur,vol,dest,o={}){const c=AU.ctx,os=c.createOscillator();if(type==='pulse')os.setPeriodicWave(pw25());else os.type=type;if(o.vib){const l=c.createOscillator(),lg=c.createGain();l.frequency.value=o.vibR||5.5;lg.gain.setValueAtTime(0,t);lg.gain.linearRampToValueAtTime(freq*.012*o.vib,t+Math.min(.25,dur*.6));l.connect(lg);lg.connect(os.frequency);l.start(t);l.stop(t+dur+.05)}os.frequency.setValueAtTime(freq,t);if(o.to)os.frequency.exponentialRampToValueAtTime(o.to,t+(o.glide||dur));if(o.det)os.detune.value=o.det;
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.005));g.gain.exponentialRampToValueAtTime(1e-4,t+dur);let n=os;
  if(o.lp){const f=c.createBiquadFilter();f.type='lowpass';f.frequency.setValueAtTime(o.lp,t);if(o.lpTo)f.frequency.exponentialRampToValueAtTime(o.lpTo,t+dur);f.Q.value=o.q||1;n.connect(f);n=f}
  n.connect(g);g.connect(dest);if(o.rev)g.connect(AU.rev);os.start(t);os.stop(t+dur+.05)}
function nz(t,dur,vol,dest,o={}){const c=AU.ctx,s=c.createBufferSource();s.buffer=AU.noise;s.loop=true;const f=c.createBiquadFilter();f.type=o.type||'bandpass';f.frequency.setValueAtTime(o.f||1000,t);if(o.fTo)f.frequency.exponentialRampToValueAtTime(o.fTo,t+dur);f.Q.value=o.q||1;
  const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+(o.a||.003));g.gain.exponentialRampToValueAtTime(1e-4,t+dur);s.connect(f);f.connect(g);g.connect(dest);if(o.rev)g.connect(AU.rev);s.start(t,Math.random()*1.5);s.stop(t+dur+.05)}
function cheer(t,v,d){for(let i=0;i<12;i++)nz(t+Math.random()*.5,1.2+Math.random()*1.2,.05*v,d,{f:500+Math.random()*1600,q:2.5,a:.18,rev:1})}
const SFXD={
  beep:(t,v,d)=>tone('square',660,t,.16,.16*v,d,{lp:2800}),
  go:(t,v,d)=>{tone('square',1320,t,.6,.17*v,d,{lp:4200,rev:1});tone('sawtooth',660,t,.6,.09*v,d,{lp:2000});cheer(t,.8*v,d)},
  join:(t,v,d)=>{tone('triangle',880,t,.12,.16*v,d);tone('triangle',1320,t+.07,.2,.14*v,d,{rev:1})},
  turbo:(t,v,d)=>{nz(t,.75,.32*v,d,{f:380,fTo:4200,q:2});tone('sawtooth',90,t,.65,.15*v,d,{to:280,lp:900,lpTo:3200})},
  hit:(t,v,d)=>{tone('sine',150,t,.35,.45*v,d,{to:40});nz(t,.25,.28*v,d,{type:'lowpass',f:1800,fTo:300})},
  oil:(t,v,d)=>{tone('sine',320,t,.4,.18*v,d,{to:90});nz(t,.35,.14*v,d,{type:'lowpass',f:600,q:6})},
  shield:(t,v,d)=>{[523,659,784,1046].forEach((f,i)=>tone('sine',f,t+i*.05,.7,.07*v,d,{rev:1}))},
  trick:(t,v,d)=>{[392,523,659,784,1046].forEach((f,i)=>tone('triangle',f,t+i*.055,.32,.09*v,d,{rev:1}))},
  crash:(t,v,d)=>{nz(t,.6,.36*v,d,{type:'lowpass',f:3000,fTo:200});tone('sine',90,t,.4,.38*v,d,{to:35})},
  portal:(t,v,d)=>{tone('sine',200,t,.8,.18*v,d,{to:1600});tone('sine',203,t,.8,.13*v,d,{to:1620,rev:1})},
  launch:(t,v,d)=>{nz(t,.9,.22*v,d,{f:800,fTo:3200,q:1.5});tone('sawtooth',220,t,.8,.07*v,d,{to:880,lp:2000})},
  boom:(t,v,d)=>{nz(t,1.4,.5*v,d,{type:'lowpass',f:2600,fTo:120,rev:1});tone('sine',70,t,1,.55*v,d,{to:28})},
  swap:(t,v,d)=>{tone('square',300,t,.35,.1*v,d,{to:1200,lp:3000});tone('square',1200,t+.18,.3,.09*v,d,{to:300,lp:3000})},
  event:(t,v,d)=>{[220,277,330,440].forEach(f=>tone('sawtooth',f,t,1,.07*v,d,{lp:500,lpTo:3500,a:.06,rev:1}))},
  whoosh:(t,v,d)=>nz(t,.6,.26*v,d,{f:300,fTo:2600,q:.8}),
  splash:(t,v,d)=>{nz(t,.7,.3*v,d,{type:'highpass',f:900,fTo:300});nz(t,.4,.2*v,d,{type:'lowpass',f:400})},
  win:(t,v,d)=>{[523,659,784,1046,1318].forEach((f,i)=>tone('square',f,t+i*.09,.55,.07*v,d,{lp:3600,rev:1}));cheer(t,1.3*v,d)},
  shark:(t,v,d)=>{tone('sine',62,t,1.3,.5*v,d,{to:38});tone('sawtooth',48,t,1,.12*v,d,{lp:220});nz(t,.9,.3*v,d,{type:'lowpass',f:500,fTo:120,rev:1});for(let i=0;i<6;i++)tone('sine',600+Math.random()*900,t+.1+Math.random()*.6,.08,.05*v,d,{to:1400})},
  boing:(t,v,d)=>{tone('sine',170,t,.4,.3*v,d,{to:560,glide:.25});tone('triangle',340,t,.25,.08*v,d,{to:1100,glide:.2})},
  coin:(t,v,d)=>{tone('square',988,t,.08,.06*v,d,{lp:5000});tone('square',1319,t+.07,.22,.06*v,d,{lp:5000,rev:1})},
  finish:(t,v,d)=>{tone('triangle',988,t,.18,.1*v,d);tone('triangle',1318,t+.08,.25,.08*v,d,{rev:1})},
};
function sfx(name,v=1){if(!AU.ctx||!AU.on||AU.ctx.state!=='running')return;const now=AU.ctx.currentTime;if(AU.last[name]&&now-AU.last[name]<.1)return;AU.last[name]=now;const f=SFXD[name];if(f)f(now,v,AU.sfxBus)}
// trilha: temas originais por ambiente, compostos em tempo real (estilo jogo de plataforma, sem melodias de terceiros)
const MUS={step:0,next:0,cur:'lobby',want:'lobby',mel:{},pw:null,int:0};
const mtof=m=>440*Math.pow(2,(m-69)/12);
function pw25(){if(MUS.pw)return MUS.pw;const n=40,re=new Float32Array(n),im=new Float32Array(n);for(let k=1;k<n;k++)im[k]=2/(k*Math.PI)*Math.sin(k*Math.PI*.25);MUS.pw=AU.ctx.createPeriodicWave(re,im);return MUS.pw}
const THEMES={
  lobby:{bpm:96,steps:16,key:57,mode:[0,2,3,5,7,9,10],prog:[[0,3,7,10],[5,8,12,15],[-2,2,5,9],[3,7,10,14]],drums:'lofi',bass:'sub',lead:'keys',arp:'keys',pad:1,dens:.32},
  snow:{bpm:138,steps:16,key:62,mode:[0,2,4,7,9],prog:[[0,4,7],[5,9,12],[7,11,14],[0,4,7],[9,12,16],[5,9,12],[2,5,9],[7,11,14]],drums:'bounce',bass:'oompah',lead:'bell',arp:'tri',dens:.55},
  dirt:{bpm:152,steps:16,key:52,mode:[0,2,4,5,7,9,10],prog:[[0,4,7],[-2,2,5],[-4,0,3],[-2,2,5]],drums:'drive',bass:'slap',lead:'pulse',stab:1,dens:.6},
  air:{bpm:164,steps:16,key:57,mode:[0,2,4,5,7,9,11],prog:[[9,12,16],[5,9,12],[0,4,7],[7,11,14]],drums:'break',bass:'octave',lead:'saw',arp:'saw',pad:1,dens:.66},
  rock:{bpm:112,steps:16,key:50,mode:[0,2,3,5,7,8,10],prog:[[0,2,7],[0,5,7],[-2,2,5],[-4,0,7]],drums:'tom',bass:'pulse8',lead:'pluck',pad:1,dens:.36},
  water:{bpm:92,steps:12,key:60,mode:[0,2,4,6,7,9,11],prog:[[0,4,7,11],[5,9,12,16],[4,7,11,14],[9,12,16,19]],drums:'brush',bass:'sub',lead:'vibe',arp:'marimba',pad:1,bubbles:1,dens:.36},
  fun:{bpm:126,steps:16,key:65,mode:[0,2,4,5,7,9,11],prog:[[0,4,7],[5,9,12],[7,11,14],[0,4,7],[2,5,9],[7,11,14],[0,4,7],[7,11,14]],drums:'circus',bass:'oompah',lead:'pulse',arp:'tri',dens:.62},
  intro:{bpm:140,steps:16,key:57,mode:[0,2,4,5,7,9,11],prog:[[0,4,7]],drums:'roll'},
  results:{bpm:120,steps:16,key:60,mode:[0,2,4,5,7,9,11],prog:[[0,4,7],[5,9,12],[7,11,14],[0,4,7]],drums:'light',bass:'oompah',lead:'bell',pad:1,dens:.5},
};
const THEME_OF={snow:'snow',dirt:'dirt',air:'air',rock:'rock',water:'water',pista:'dirt',asfalto:'dirt',rio:'dirt',mar:'air'};
function genMel(th,seed){const T=THEMES[th];if(!T.dens)return[];const R=mulberry(seed);const L=T.steps*4,mel=[];let deg=T.mode.length+2;const fast=th==='dirt'||th==='air',slow=th==='water'||th==='rock'||th==='lobby';
  for(let i=0;i<L;i++){const beat=i%(T.steps/4)===0;let on=R()<(beat?T.dens+.25:T.dens*.55);if(fast&&i%2===1&&R()<.45)on=false;if(slow&&i%2===1)on=false;
    if(on){deg+=Math.round((R()-.5)*(fast?3.6:2.6));deg=clamp(deg,T.mode.length,T.mode.length*2+3);mel.push({deg,len:slow?2+Math.floor(R()*3):1+Math.floor(R()*2)})}else mel.push(null)}
  return mel}
function setMusicRound(r){for(const k in THEMES)MUS.mel[k]=genMel(k,r*977+k.length*131+k.charCodeAt(0)*7)}
function degPitch(T,deg){const L=T.mode.length;return T.key+T.mode[((deg%L)+L)%L]+12*Math.floor(deg/L)}
function kick(t,d,v=1){const c=AU.ctx,o=c.createOscillator(),g=c.createGain();o.frequency.setValueAtTime(155,t);o.frequency.exponentialRampToValueAtTime(42,t+.12);g.gain.setValueAtTime(.85*v,t);g.gain.exponentialRampToValueAtTime(1e-4,t+.38);o.connect(g);g.connect(d);o.start(t);o.stop(t+.4);
  AU.padBus.gain.cancelScheduledValues(t);AU.padBus.gain.setValueAtTime(.35,t);AU.padBus.gain.linearRampToValueAtTime(1,t+.22)}
function snare(t,d,v=1){nz(t,.2,.3*v,d,{f:1900,q:.8,rev:1});tone('triangle',190,t,.1,.22*v,d,{to:150})}
function hat(t,d,v,open){nz(t,open?.22:.045,v,d,{type:'highpass',f:7500})}
function tom(t,d,f,v=1){tone('sine',f,t,.32,.45*v,d,{to:f*.55});nz(t,.06,.08*v,d,{f:f*4,q:1})}
function clap(t,d,v=1){for(let i=0;i<3;i++)nz(t+i*.012,.09,.18*v,d,{f:1400,q:1.2,rev:1})}
function pad(fr,t,dur,cut,v=1){const c=AU.ctx;fr.forEach(f=>[-10,0,10].forEach(dt=>{const o=c.createOscillator();o.type='sawtooth';o.frequency.value=f;o.detune.value=dt;const fl=c.createBiquadFilter();fl.type='lowpass';fl.frequency.value=cut;const g=c.createGain();g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.022*v,t+dur*.3);g.gain.linearRampToValueAtTime(0,t+dur);o.connect(fl);fl.connect(g);g.connect(AU.padBus);g.connect(AU.rev);o.start(t);o.stop(t+dur+.05)}))}
const INST={
  bell:(f,t,dur,v,d)=>{tone('sine',f,t,1.1,.11*v,d,{rev:1});tone('sine',f*2.76,t,.45,.04*v,d);tone('sine',f*5.4,t,.2,.02*v,d)},
  pulse:(f,t,dur,v,d)=>tone('pulse',f,t,Math.max(.12,dur),.07*v,d,{lp:5200,vib:1,rev:1}),
  saw:(f,t,dur,v,d)=>{tone('sawtooth',f,t,Math.max(.15,dur),.045*v,d,{lp:3600,lpTo:1400,det:-8,vib:1.2,rev:1});tone('sawtooth',f,t,Math.max(.15,dur),.045*v,d,{lp:3600,lpTo:1400,det:8})},
  pluck:(f,t,dur,v,d)=>tone('sawtooth',f,t,.3,.07*v,d,{lp:2600,lpTo:300,q:3,rev:1}),
  vibe:(f,t,dur,v,d)=>{tone('sine',f,t,1.6,.1*v,d,{vib:.6,vibR:6,rev:1});tone('sine',f*4,t,.12,.02*v,d)},
  keys:(f,t,dur,v,d)=>{tone('sine',f,t,1.1,.08*v,d,{det:4,rev:1});tone('triangle',f*2,t,.35,.025*v,d)},
  tri:(f,t,dur,v,d)=>tone('triangle',f,t,.14,.06*v,d),
  marimba:(f,t,dur,v,d)=>{tone('sine',f,t,.38,.08*v,d,{rev:1});tone('sine',f*4,t,.07,.025*v,d)},
};
function musicTick(){const c=AU.ctx;if(!c||c.state!=='running'){if(c)MUS.next=c.currentTime+.1;return}
  while(MUS.next<c.currentTime+.14){let T=THEMES[MUS.cur];const s=MUS.step%T.steps;
    if(MUS.want!==MUS.cur&&(s===0||MUS.want==='intro'||MUS.want==='results'||MUS.cur==='intro')){MUS.cur=MUS.want;MUS.step=0;T=THEMES[MUS.cur]}
    musicStep(MUS.step,MUS.next,T);MUS.next+=60/T.bpm/(T.steps/4);MUS.step++}}
function musicStep(st,t,T){
  const d=AU.musicBus,N=T.steps,s=st%N,bar=Math.floor(st/N),ch=T.prog[bar%T.prog.length],root=T.key,q=N/4,th=MUS.cur;
  const race=G.state==='race',I=MUS.int;
  // bateria
  switch(T.drums){
    case'bounce':if(s===0||s===8)kick(t,d);if(s===4||s===12)snare(t,d,.8);if(s%4===2)hat(t,d,.06);if(s%2===1)nz(t,.03,.025,d,{f:9000,q:3});if(s===4||s===12)nz(t,.12,.03,d,{type:'highpass',f:9500});break;
    case'drive':if(s%4===0)kick(t,d);if(s===4||s===12){snare(t,d);clap(t,d,.6)}if(s%4===2)hat(t,d,.05,true);else hat(t,d,.035);if(bar%4===3&&s>=12)snare(t,d,.35+(s-12)*.15);break;
    case'break':if(s===0||s===7||s===10)kick(t,d);if(s===4||s===12)snare(t,d);hat(t,d,s%4===2?.06:.03);if(bar%4===3&&s>=12)snare(t,d,.4+(s-12)*.15);break;
    case'tom':if(s===0||s===6||s===8)kick(t,d,.9);if(s===4)nz(t,.05,.12,d,{f:2500,q:2});if(s%2===0)hat(t,d,.025);if(bar%2===1&&s>=12)tom(t,d,[220,180,150,120][s-12],.8);break;
    case'brush':if(s===0)kick(t,d,.45);if(s===6)nz(t,.35,.08,d,{f:2600,q:.6,a:.04});nz(t,.05,.018+(s%3===0?.012:0),d,{f:6500,q:2});break;
    case'lofi':if(s===0||s===10)kick(t,d,.6);if(s===4||s===12)snare(t,d,.35);if(s%2===0)hat(t,d,s%4===2?.03:.02);break;
    case'roll':{const n=st%16;if(n%4===0)kick(t,d,.8);snare(t,d,.08+n*.03);if(n===0)nz(t,3,.06,d,{f:300,fTo:6000,q:1.5});break}
    case'circus':if(s===0||s===8)kick(t,d,.8);if(s===4||s===12)snare(t,d,.6);if(s%4===2)tone('sine',1050,t,.05,.07,d);if(s%2===1)hat(t,d,.025);break;
    case'light':if(s===0||s===8)kick(t,d,.6);if(s===12)snare(t,d,.5);if(s%2===0)hat(t,d,.025);break;
  }
  // baixo
  const b=root-24+ch[0];
  switch(T.bass){
    case'oompah':if(s%q===0){const f=mtof(b+((s/q)%2?7:0));tone('pulse',f,t,.16,.12,d,{lp:1400});tone('sine',f,t,.18,.14,d)}if((T===THEMES.snow||T===THEMES.fun)&&s%q===q/2)ch.forEach(n=>tone('triangle',mtof(root+n),t,.08,.025,d));break;
    case'slap':{const pat=[0,null,12,0,null,0,12,null,0,null,12,0,7,null,12,10][s];if(pat!=null){const f=mtof(b+pat);tone('sawtooth',f,t,.13,.12,d,{lp:1600+I*800,lpTo:220,q:6});tone('sine',f,t,.14,.13,d)}break}
    case'octave':if(s%2===0){const f=mtof(b+(s%4===2?12:0));tone('sawtooth',f,t,.14,.1,d,{lp:1300+I*900,lpTo:200,q:5});tone('sine',f,t,.15,.14,d)}break;
    case'pulse8':if(s%2===0){const f=mtof(b);tone('pulse',f,t,.14,.1,d,{lp:900});tone('sine',f,t,.16,.12,d)}break;
    case'sub':if(s===0||s===N/2){const f=mtof(b+(s?7:0));tone('sine',f,t,60/T.bpm*1.8,.17,d,{a:.02})}break;
  }
  // acordes
  if(s===0&&T.pad)pad(ch.map(n=>mtof(root-12+n)),t,60/T.bpm*4,th==='air'?2600+I*1500:th==='water'?1300:900,th==='water'?1.3:1);
  if(T.stab&&bar%2===1&&(s===2||s===6||s===10)){ch.forEach(n=>tone('sawtooth',mtof(root+n),t,.12,.03,d,{lp:3200,lpTo:800}))}
  // arpejo
  if(T.arp){const tones=[...ch,ch[0]+12,ch[1]+12];const every=th==='water'?1:th==='air'?1:2;if(s%every===0){const n=tones[(s/every+bar)%tones.length];INST[T.arp](mtof(root+12+n),t,.12,th==='air'?.7:.8,d)}}
  // melodia (frase de 4 compassos, com variação na repetição)
  if(T.lead&&MUS.mel[th]&&(race||th==='lobby'||th==='results')){const L=N*4;const i=st%L;const m=MUS.mel[th][i];if(m){let dg=m.deg;if(Math.floor(st/L)%2===1&&i>=N*3)dg+=2;
    let f=degPitch(T,dg);if(i%q===0){let best=f,bd=99;for(const c of ch)for(const o of[-12,0,12]){const cand=root+12+c+o;const dd=Math.abs(cand-f);if(dd<bd){bd=dd;best=cand}}f=best}
    INST[T.lead](mtof(f),t,m.len*60/T.bpm/q,th==='lobby'?.8:1,d)}}
  // bolhas do tema aquático
  if(T.bubbles&&Math.random()<.18){const f=rand(500,1100);tone('sine',f,t,.09,.03,d,{to:f*2.2})}
}
function updateAudio(dt){if(!AU.ctx||AU.ctx.state!=='running')return;const t=AU.ctx.currentTime;
  const f=CAM.focus,v=G.state==='race'&&f?f.v:0;const under=FOGU.uUnder.value.w>0;
  AU.windG.gain.setTargetAtTime(AU.on?(under?.05:clamp(v/55,0,1)*.2):0,t,.25);AU.windF.frequency.setTargetAtTime(under?220:350+v*30,t,.3);
  AU.musicLP.frequency.setTargetAtTime(under?2600:18000,t,.3);
  MUS.int=G.state==='race'&&G.rank[0]?clamp(G.rank[0].s/W.FIN,0,1):0;
  const S=G.state;MUS.want=S==='intro'?'intro':S==='results'||S==='champion'?'results':S==='race'&&f?(THEME_OF[MODS[f.mod||'snowboard'].surface]||'snow'):'lobby';}
['pointerdown','keydown','touchstart'].forEach(ev=>addEventListener(ev,e=>{if(e.target&&e.target.closest&&e.target.closest('#btnSnd')){AU.downLabel=$('btnSnd').textContent;return}audioUnlock()},{passive:true,capture:true}));
$('btnSnd').onclick=e=>{e.stopPropagation();const shown=AU.downLabel||e.currentTarget.textContent;AU.downLabel=null;const wasRunning=shown.indexOf('SOM: ')===0;audioUnlock();AU.on=wasRunning?!AU.on:true;LS.set('sound2',AU.on?'1':'0');if(AU.master)AU.master.gain.setTargetAtTime(AU.on?AU.vol:0,AU.ctx.currentTime,.05);setTimeout(updSndBtn,150)};
setInterval(()=>{if(AU.ctx&&AU.on&&AU.ctx.state!=='running')AU.ctx.resume().then(updSndBtn).catch(()=>{});else updSndBtn()},1500);

