// ======================================================================
// GAME DATA
// ======================================================================
const MODS={
  snowboard:{label:'SNOWBOARD',icon:'🏂',speed:27,slope:.2,surface:'snow',lat:6},
  ski:{label:'ESQUI',icon:'⛷️',speed:29,slope:.22,surface:'snow',lat:6},
  bike:{label:'MOUNTAIN BIKE',icon:'🚵',speed:23,slope:.11,surface:'dirt',lat:6},
  wingsuit:{label:'WINGSUIT',icon:'🦅',speed:40,slope:.27,surface:'air',lat:15},
  rocket:{label:'ROCKET WING',icon:'🚀',speed:52,slope:.07,surface:'air',lat:15},
  escalada:{label:'ESCALADA',icon:'🧗',speed:5.5,slope:0,surface:'rock',lat:5},
  nado:{label:'NADO SUBMERSO',icon:'🏊',speed:15,slope:0,surface:'water',lat:2.3},
  paraquedas:{label:'PARAQUEDAS',icon:'🪂',speed:44,slope:0,surface:'air',lat:19},
  vara:{label:'SALTO COM VARA',icon:'🏃',speed:15,slope:.03,surface:'pista',lat:5},
  skate:{label:'SKATE DOWNHILL',icon:'🛹',speed:31,slope:.1,surface:'asfalto',lat:4},
  remo:{label:'REMO',icon:'🚣',speed:14,slope:.012,surface:'rio',lat:10},
  windsurf:{label:'WINDSURF',icon:'🏄',speed:30,slope:0,surface:'mar',lat:12},
};
const GROUNDS={snow:1,dirt:1,pista:1,asfalto:1};const isG=sf=>!!GROUNDS[sf];
const FIRST_ROUND={name:'Avalanche Run',sky:'day',segs:[['snowboard',.36],['wingsuit',.2],['snowboard',.22],['nado',.22]],rules:[]};
const POOL=['snowboard','ski','bike','wingsuit','rocket','escalada','nado','paraquedas','remo','windsurf','skate'];
const WEIGHT={snowboard:.32,ski:.32,bike:.32,wingsuit:.22,rocket:.24,escalada:.045,nado:.24,paraquedas:.24,vara:.2,skate:.26,remo:.24,windsurf:.22};
const NA=['Rally','Desafio','Circuito','Travessia','Copa','Arena','Expresso','Corrida','Rota','Grande Prêmio'];
const NB=['do Pico','do Cânion','das Nuvens','da Serra','Selvagem','Maluco','do Abismo','Gelado','da Baía','do Vento','dos Loucos','Radical'];
const RULES={
  eliminacao:{label:'ELIMINAÇÃO',icon:'❌',desc:'o último é eliminado a cada 25s'},
  turbo2:{label:'TURBO EM DOBRO',icon:'⚡',desc:'turbos duram o dobro'},
  caos:{label:'CAOS',icon:'🌪️',desc:'eventos a cada 10s'},
  chuva:{label:'TEMPESTADE',icon:'🌧️',desc:'chuva e céu fechado'},
  gravidade:{label:'GRAVIDADE BAIXA',icon:'🌙',desc:'saltos bem mais altos'},
};
function genRound(n){
  // ?segs=bike,paraquedas&sky=sunset monta uma rodada fixa (para testar um trecho específico)
  const qs=(Q.get('segs')||'').split(',').filter(m=>MODS[m]&&m!=='vara');
  if(qs.length){const tot=qs.reduce((a,m)=>a+(m==='escalada'?0:WEIGHT[m]),0)||1,esc=qs.includes('escalada')?.045:0;return{name:'Rodada de teste',sky:SKIES[Q.get('sky')]?Q.get('sky'):'day',segs:qs.map(m=>[m,m==='escalada'?.045:WEIGHT[m]/tot*(1-esc)]),rules:(Q.get('regras')||'').split(',').filter(r=>RULES[r])}}
  if(n===0)return FIRST_ROUND;
  const R=mulberry(n*7919+(G.seed||1)),pk=a=>a[Math.floor(R()*a.length)];
  const cnt=R()<.2?2:R()<.75?3:4;const featured=[null,'skate','paraquedas','remo','windsurf'][n]||null;
  let segs=[];
  for(let tries=0;tries<60;tries++){segs=[];let guard=0;
    while(segs.length<cnt&&guard++<200){const i=segs.length,last=segs[i-1];let m=featured&&!segs.includes(featured)&&R()<.55?featured:pk(POOL);if(last==='windsurf')m='nado';if(m==='windsurf'&&(i===0||i<cnt-2))continue;
      if(m===last||segs.includes(m))continue;if(m!==featured&&G.prevMods.includes(m)&&R()<.75)continue;if(i===0&&(m==='paraquedas'||m==='escalada'||m==='nado'))continue;if(m==='nado'&&i!==cnt-1)continue;if(i===cnt-1&&m==='escalada')continue;segs.push(m)}
    if((segs.includes('nado')||segs.includes('windsurf'))&&segs.includes('escalada'))continue;
    if(segs.length===cnt&&(!featured||segs.includes(featured)))break}
  const tot=segs.reduce((a,m)=>a+(m==='escalada'?0:WEIGHT[m]),0),esc=segs.includes('escalada')?.045:0;
  const def={name:pk(NA)+' '+pk(NB),sky:pk(Object.keys(SKIES)),segs:segs.map(m=>[m,m==='escalada'?.045:WEIGHT[m]/tot*(1-esc)]),rules:[]};
  const rk=Object.keys(RULES);const nr=n<2?1:R()<.2?0:R()<.7?1:2;let g2=0;while(def.rules.length<nr&&g2++<20){const r=pk(rk);if(!def.rules.includes(r))def.rules.push(r)}
  return def;
}
const hasRule=r=>!!(G.def&&G.def.rules&&G.def.rules.includes(r));
const ROUNDS=[
  {name:'Avalanche Run',sky:'day',segs:[['snowboard',.36],['wingsuit',.2],['snowboard',.22],['nado',.22]]},
  {name:'Paredão',sky:'day',segs:[['bike',.44],['escalada',.045],['wingsuit',.515]]},
  {name:'Mergulho Final',sky:'golden',segs:[['ski',.48],['wingsuit',.26],['nado',.26]]},
  {name:'Pico Gelado',sky:'crisp',segs:[['ski',.36],['rocket',.26],['ski',.38]]},
  {name:'Do Topo ao Mar',sky:'sunset',segs:[['snowboard',.32],['escalada',.04],['bike',.38],['nado',.26]]},
  {name:'Cânion Voador',sky:'golden',segs:[['wingsuit',.46],['bike',.54]]},
  {name:'Foguete na Neve',sky:'day',segs:[['snowboard',.3],['rocket',.3],['bike',.4]]},
];
const CMDS=[['!radical','entrar na corrida'],['!turbo','acelera por 3s'],['!rasteira @nick','derruba quem está perto'],['!oleo','armadilha na pista'],['!escudo','bloqueia 1 trapaça'],['!manobra','truque: acerta = turbo, erra = tombo'],['!atalho','arrisca um atalho secreto'],['!missil','míssil teleguiado no líder'],['!troca @nick','tenta trocar de lugar com quem está na frente'],['!tubarao @nick','solta um tubarão no nado submerso'],['!sair','sair do jogo']];
const COOL={turbo:14,rasteira:20,oleo:16,escudo:28,manobra:7,atalho:40,missil:35,troca:60,tubarao:40};
const ALIAS={'!radical':'join','!turbo':'turbo','!boost':'turbo','!rasteira':'rasteira','!trip':'rasteira','!oleo':'oleo','!óleo':'oleo','!oil':'oleo','!armadilha':'oleo','!escudo':'escudo','!shield':'escudo','!manobra':'manobra','!trick':'manobra','!flip':'manobra','!atalho':'atalho','!shortcut':'atalho','!missil':'missil','!míssil':'missil','!foguete':'missil','!troca':'troca','!swap':'troca','!tubarao':'tubarao','!tubarão':'tubarao','!shark':'tubarao','!sair':'sair'};
const PTS=[25,18,15,12,10,8,6,4,2,1];
const BOT_NAMES=['Turbo_Tatu','CapivaraRadical','ManoBike','NeveLoka','Asa_Delta','RampaRafa','DriftDona','ZeDownhill','PipocaGamer','LuluWing','Faisca99','BiscoitoFly','JacaVoadora','Tio_Grau','MariRampa','Pinguim_X','SaciNaNeve','Kiko360','Ventania','BetaBoard'];
const DS=2,START_S=44;

