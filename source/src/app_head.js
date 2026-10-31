"use strict";
/* ---------- constants (Anki defaults) ---------- */
const STEPS=[1,10], RELEARN=[10], GRAD_IVL=1, EASY_IVL=4, START_EASE=2500, MIN_EASE=1300,
      EASY_BONUS=1.3, HARD_MULT=1.2, MAX_IVL=36500, LEARN_AHEAD=20*60e3, LEECH=8, MATURE=21, CHUNK=100;
const DEFAULT_CFG={newPerDay:20,revPerDay:200,autoplay:true,sentenceFront:true,showPitch:false,rate:0.9,kNewPerDay:10,kRevPerDay:200,kWrite:true,kNums:true};
const KR=10000, KW=20000; // ids des cartes kanji : lecture / écriture
const LS_KEY="kaishi-fr-v1";
const MIN=60e3, DAY=864e5;

/* ---------- state ---------- */
let CARDS=[], GRAM=[], KANJI=[], KGROUPS=[];
const S={cards:{},daily:{day:-1,n:0,r:0},dk:{day:-1,n:0,r:0},hist:{},histK:{},cfg:{...DEFAULT_CFG},cfgMod:0};
let view="loading", cur=null, shown=false, sinceNew=0, undoStack=[], REMOTE=null, deck="vocab", pad=null;
let VOCAB_IDS=[], KANJI_IDS=[];
const isK=id=>id>=KR, isKW=id=>id>=KW, kOf=id=>KANJI[id>=KW?id-KW:id-KR];
function deckOf(id){return id>=KR?"kanji":"vocab"}
function D(d=deck){ return d==="kanji"
  ? {ids:KANJI_IDS,newLim:S.cfg.kNewPerDay,revLim:S.cfg.kRevPerDay,dkey:"dk",hkey:"histK",name:"Kanji N5"}
  : {ids:VOCAB_IDS,newLim:S.cfg.newPerDay,revLim:S.cfg.revPerDay,dkey:"daily",hkey:"hist",name:"Kaishi 1.5k"}; }

const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const furi=s=>s.replace(/ ?([^ >]+?)\[(.+?)\]/g,"<ruby>$1<rt>$2</rt></ruby>");

function today(now=Date.now()){const d=new Date(now);return Math.floor((now-d.getTimezoneOffset()*MIN-4*3600e3)/DAY)}

/* card state: [q,due,ivl,ease,reps,lapses,step,mod,susp,bury] */
const NEW={q:0,due:0,ivl:0,ease:0,reps:0,lapses:0,step:0,mod:0,susp:0,bury:-1};
const toArr=c=>[c.q,c.due,c.ivl,c.ease,c.reps,c.lapses,c.step,c.mod,c.susp,c.bury];
const fromArr=a=>({q:a[0],due:a[1],ivl:a[2],ease:a[3],reps:a[4],lapses:a[5],step:a[6],mod:a[7],susp:a[8]||0,bury:a[9]??-1});
const st=i=>S.cards[i]||NEW;

/* ---------- scheduler (Anki SM-2, v3 behaviour) ---------- */
function hash(n){n=(n^61)^(n>>>16);n=n+(n<<3)|0;n=n^(n>>>4);n=Math.imul(n,0x27d4eb2d);n=n^(n>>>15);return n>>>0}
function fuzzed(ivl,seed){
  ivl=Math.max(1,Math.round(ivl)); if(ivl<3) return Math.min(ivl,MAX_IVL);
  let d=1; for(const [a,b,f] of [[2.5,7,.15],[7,20,.1],[20,Infinity,.05]]) d+=f*Math.max(0,Math.min(ivl,b)-a);
  const lo=Math.max(2,Math.round(ivl-d)), hi=Math.min(MAX_IVL,Math.round(ivl+d));
  return hi<=lo?lo:lo+hash(seed)%(hi-lo+1);
}
function hardDelay(steps,i){
  if(i===0) return (steps.length>1?(steps[0]+steps[1])/2:Math.min(steps[0]*1.5,steps[0]+1440))*MIN;
  return steps[Math.min(i,steps.length-1)]*MIN;
}
function next(idx,c,btn,now){
  const t=today(now), seed=idx*7919+c.reps*104729+btn;
  const n={...c,reps:c.reps+1,mod:now,bury:-1};
  const grad=(ivl)=>{n.q=2;n.step=0;n.ivl=fuzzed(ivl,seed);n.due=t+n.ivl;if(!n.ease)n.ease=START_EASE;};
  if(c.q===0||c.q===1){
    const i=c.q===0?0:c.step;
    if(btn===1){n.q=1;n.step=0;n.due=now+STEPS[0]*MIN}
    else if(btn===2){n.q=1;n.step=i;n.due=now+hardDelay(STEPS,i)}
    else if(btn===3){ if(i+1>=STEPS.length) grad(GRAD_IVL); else {n.q=1;n.step=i+1;n.due=now+STEPS[i+1]*MIN} }
    else grad(EASY_IVL);
  } else if(c.q===2){
    const delay=Math.max(0,t-c.due), e=c.ease/1000;
    if(btn===1){n.lapses=c.lapses+1;n.ease=Math.max(MIN_EASE,c.ease-200);n.ivl=1;n.q=3;n.step=0;n.due=now+RELEARN[0]*MIN}
    else{
      const hard=Math.min(MAX_IVL,Math.max(c.ivl+1,Math.round(c.ivl*HARD_MULT)));
      const good=Math.min(MAX_IVL,Math.max(hard+1,Math.round((c.ivl+delay/2)*e)));
      const easy=Math.min(MAX_IVL,Math.max(good+1,Math.round((c.ivl+delay)*e*EASY_BONUS)));
      const seedR=idx*7919+c.reps*104729;
      const fh=fuzzed(hard,seedR+2), fg=Math.max(fh+1,fuzzed(good,seedR+3)), fe=Math.max(fg+1,fuzzed(easy,seedR+4));
      n.ivl=Math.min(MAX_IVL,btn===2?fh:btn===3?fg:fe); n.q=2; n.due=t+n.ivl;
      if(btn===2) n.ease=Math.max(MIN_EASE,c.ease-150);
      if(btn===4) n.ease=c.ease+150;
    }
  } else { // relearning
    const i=c.step;
    if(btn===1){n.step=0;n.due=now+RELEARN[0]*MIN}
    else if(btn===2){n.due=now+hardDelay(RELEARN,i)}
    else if(btn===3){ if(i+1>=RELEARN.length){n.q=2;n.step=0;n.ivl=Math.max(1,c.ivl);n.due=t+n.ivl} else {n.step=i+1;n.due=now+RELEARN[i+1]*MIN} }
    else {n.q=2;n.step=0;n.ivl=Math.max(1,c.ivl)+1;n.due=t+n.ivl}
  }
  return n;
}
function fmtIvl(n,now){
  let ms = n.q===2 ? Math.max(1,(n.due-today(now)))*DAY : n.due-now;
  const m=ms/MIN;
  if(m<1) return "<1 min";
  if(m<60) return Math.round(m)+" min";
  const h=m/60; if(h<24) return (Math.round(h*10)/10).toString().replace(".",",")+" h";
  const d=ms/DAY; if(d<30) return Math.round(d)+" j";
  const mo=d/30.4; if(mo<12) return (Math.round(mo*10)/10).toString().replace(".",",")+" mois";
  return (Math.round(d/365*10)/10).toString().replace(".",",")+" ans";
}

/* ---------- queue ---------- */
function daily(d=deck){const t=today(),k=D(d).dkey;if(!S[k]||S[k].day!==t)S[k]={day:t,n:0,r:0};return S[k]}
function writeReady(i,t){ // la carte d'écriture arrive quand la lecture est apprise, jamais le même jour
  const r=st(KR+i); return S.cfg.kWrite && r.q===2 && today(r.mod)<t; }
function freshList(d,limit,t){
  const out=[]; if(limit<=0) return out;
  if(d==="vocab"){ for(const id of VOCAB_IDS){ if(out.length>=limit) break; const c=st(id); if(c.q===0&&!c.susp&&c.bury!==t) out.push(id) } return out; }
  const rec=[], wr=[];
  for(let i=0;i<KANJI.length;i++){
    const r=st(KR+i), w=st(KW+i);
    if(w.q===0&&!w.susp&&w.bury!==t&&writeReady(i,t)) wr.push(KW+i);
  }
  while(out.length<limit&&(rec.length||wr.length)){ if(wr.length) out.push(wr.shift()); if(out.length<limit&&rec.length) out.push(rec.shift()); }
  return out;
}
function gather(now=Date.now(),d=deck){
  const t=today(now), dd=daily(d), cfg=D(d);
  const learnNow=[], learnSoon=[], rev=[];
  for(const i of cfg.ids){
    const c=st(i); if(c.susp||c.bury===t) continue;
    if(c.q===1||c.q===3){ if(c.due<=now) learnNow.push(i); else if(c.due<=now+LEARN_AHEAD) learnSoon.push(i); }
    else if(c.q===2){ if(c.due<=t) rev.push(i); }
  }
  const newLeft=Math.max(0,cfg.newLim-dd.n), revLeft=Math.max(0,cfg.revLim-dd.r);
  const fresh=freshList(d,newLeft,t);
  learnNow.sort((a,b)=>st(a).due-st(b).due); learnSoon.sort((a,b)=>st(a).due-st(b).due);
  rev.sort((a,b)=>st(a).due-st(b).due||hash(a+t)-hash(b+t));
  return {learnNow,learnSoon,rev:rev.slice(0,revLeft),fresh,revTotal:rev.length};
}
function pick(now=Date.now()){
  const g=gather(now);
  if(g.learnNow.length) return g.learnNow[0];
  const r=g.rev.length, n=g.fresh.length;
  if(r&&n){ const ratio=Math.max(1,Math.floor(r/n)); if(sinceNew>=ratio) return g.fresh[0]; return g.rev[0]; }
  if(r) return g.rev[0];
  if(n) return g.fresh[0];
  if(g.learnSoon.length) return g.learnSoon[0];
  return null;
}
function renderCounts(){
  const g=gather(), el=$("#counts");
  const learn=g.learnNow.length+g.learnSoon.length;
  const cq=cur==null?-1:st(cur).q;
  const nNew=g.fresh.length+(deck==="kanji"&&typeof lessonCount==="function"&&KANJI.length?lessonCount():0);
  el.innerHTML=`<span class="c-new ${cq===0?"on":""}" title="${deck==="kanji"?"Leçons et nouvelles":"Nouvelles"}">${nNew}</span><span class="c-learn ${cq===1||cq===3?"on":""}" title="En apprentissage">${learn}</span><span class="c-rev ${cq===2?"on":""}" title="À réviser">${g.rev.length}</span>`;
  return g;
}

/* ---------- audio (synthèse vocale japonaise du navigateur) ---------- */
let voice=null;
function pickVoice(){try{const vs=speechSynthesis.getVoices().filter(v=>/^ja/i.test(v.lang));voice=vs.find(v=>/Kyoko|O-?ren|Otoya|Hattori|Google/i.test(v.name))||vs[0]||null}catch(e){}}
try{pickVoice();speechSynthesis.onvoiceschanged=pickVoice}catch(e){}
function speak(texts){
  try{ speechSynthesis.cancel();
    for(const t of texts){ if(!t) continue; const u=new SpeechSynthesisUtterance(t); u.lang="ja-JP"; if(voice)u.voice=voice; u.rate=S.cfg.rate; speechSynthesis.speak(u); }
  }catch(e){toast("La lecture audio n'est pas disponible sur cet appareil.")}
}
const plain=s=>s.replace(/<[^>]+>/g,"").replace(/[AB]「/g,"「");
const wordSay=c=>c[1].split(/[・、]/)[0];

/* ---------- persistence ---------- */
function snapshotLocal(){
  const cards={}; for(const k in S.cards) cards[k]=toArr(S.cards[k]);
  return {v:1,cards,daily:S.daily,dk:S.dk,hist:S.hist,histK:S.histK,cfg:S.cfg,cfgMod:S.cfgMod};
}
let STORAGE_OK=true, lastSaved=0;
function checkStorage(){try{const k="kaishi-test";localStorage.setItem(k,"1");const ok=localStorage.getItem(k)==="1";localStorage.removeItem(k);return ok}catch(e){return false}}
function saveLocal(){
  try{ const raw=JSON.stringify({...snapshotLocal(),deck}); localStorage.setItem(LS_KEY,raw);
    if(localStorage.getItem(LS_KEY)!==raw) throw new Error("not kept");
    STORAGE_OK=true; lastSaved=Date.now(); }
  catch(e){ if(STORAGE_OK){STORAGE_OK=false; renderSync();} }
}
function loadLocal(){
  try{const raw=localStorage.getItem(LS_KEY); if(!raw) return; const o=JSON.parse(raw);
    for(const k in o.cards) S.cards[k]=fromArr(o.cards[k]);
    if(o.daily) S.daily=o.daily; if(o.dk) S.dk=o.dk; if(o.hist) S.hist=o.hist; if(o.histK) S.histK=o.histK;
    if(o.cfg) S.cfg={...DEFAULT_CFG,...o.cfg}; S.cfgMod=o.cfgMod||0; if(o.deck) deck=o.deck;
  }catch(e){}
}
const dirty=new Set(); let flushTimer=null, flushing=false;
function changed(idx){
  if(idx!=null) dirty.add("k"+Math.floor(idx/CHUNK));
  dirty.add("meta"); saveLocal();
  if(REMOTE){clearTimeout(flushTimer);flushTimer=setTimeout(flush,1500)}
}
function chunkBody(k){const c={};for(const key in S.cards){const i=+key; if(i>=k*CHUNK&&i<(k+1)*CHUNK) c[key]=toArr(S.cards[key]);} return {c}}
function chunkIds(){const s=new Set();for(const i of VOCAB_IDS.concat(KANJI_IDS)) s.add("k"+Math.floor(i/CHUNK));return [...s]}
function metaBody(){return {daily:S.daily,dk:S.dk,hist:S.hist,histK:S.histK,cfg:S.cfg,cfgMod:S.cfgMod}}
async function flush(){
  if(!REMOTE||flushing) return; flushing=true;
  try{ while(dirty.size){
      const k=dirty.values().next().value; dirty.delete(k);
      const body=k==="meta"?metaBody():chunkBody(+k.slice(1));
      try{ await REMOTE.col.doc(k).set(body); }
      catch(e){ const code=e&&e.code;
        if(code==="unavailable"||code==="resource_exhausted"){dirty.add(k);setTimeout(flush,4000+Math.random()*3000);break}
        if(code==="quota_exceeded"){toast("Le stockage en ligne est plein : la progression reste sur cet appareil.");REMOTE=null;break}
        REMOTE=null; break; }
  } } finally { flushing=false; renderSync(); }
}
async function pull(){
  if(!REMOTE) return false;
  const ids=["meta",...chunkIds()];
  const snaps=await Promise.all(ids.map(id=>REMOTE.col.doc(id).get().catch(()=>null)));
  let changedAny=false;
  snaps.forEach((s,j)=>{
    const id=ids[j];
    if(!s||!s.exists){ if(id!=="meta"&&Object.keys(chunkBody(+id.slice(1)).c).length) dirty.add(id); if(id==="meta") dirty.add("meta"); return; }
    const d=s.data();
    if(id==="meta"){
      if(d.cfg&&(d.cfgMod||0)>S.cfgMod){S.cfg={...DEFAULT_CFG,...d.cfg};S.cfgMod=d.cfgMod;changedAny=true}
      else if(S.cfgMod>(d.cfgMod||0)) dirty.add("meta");
      for(const dk of ["daily","dk"]){ const R=d[dk], L=S[dk]; if(!R) continue;
        if(R.day>L.day){S[dk]=R;changedAny=true}
        else if(R.day===L.day){const n=Math.max(L.n,R.n),r=Math.max(L.r,R.r); if(n!==L.n||r!==L.r)changedAny=true; S[dk]={day:L.day,n,r}} }
      for(const hk of ["hist","histK"]) if(d[hk]) for(const day in d[hk]){const a=d[hk][day],b=S[hk][day]||[0,0,0,0];S[hk][day]=a.map((v,x)=>Math.max(v,b[x]||0))}
      dirty.add("meta"); return;
    }
    const remote=d.c||{}, k=+id.slice(1); let localNewer=false;
    for(const key in remote){ const r=fromArr(remote[key]), l=S.cards[key];
      if(!l||r.mod>l.mod){S.cards[key]=r;changedAny=true} else if(l.mod>r.mod) localNewer=true; }
    for(const key in S.cards){const i=+key; if(i>=k*CHUNK&&i<(k+1)*CHUNK&&!remote[key]) localNewer=true;}
    if(localNewer) dirty.add(id);
  });
  saveLocal();
  if(dirty.size){clearTimeout(flushTimer);flushTimer=setTimeout(flush,800)}
  return changedAny;
}
async function connect(){
  try{
    const use=window.claude&&window.claude.use?window.claude.use.bind(window.claude):null; if(!use) return;
    const [db,user]=await Promise.all([use("db"),use("user")]);
    if(!db||!user) return;
    const uid=await user.id(); if(!uid) return;
    REMOTE={col:db.collection("data/users/"+uid)};
    const ch=await pull(); renderSync();
    if(ch) refresh();
  }catch(e){REMOTE=null; renderSync();}
}
function renderSync(){const el=$("#sync"); if(!el) return;
  const seen=Object.keys(S.cards).filter(k=>S.cards[k].q!==0).length;
  if(REMOTE){el.className="sync ok";el.innerHTML="<i></i>Progression synchronisée avec ton compte (iPhone, PC…)";return}
  if(!STORAGE_OK){el.className="sync bad";el.innerHTML=`<i></i><span><b>Ce navigateur n'enregistre pas ta progression</b> : elle sera perdue au rechargement. C'est le cas en navigation privée, ou si les cookies sont bloqués (iPhone : Réglages › Safari › désactiver « Bloquer tous les cookies »). Le plus sûr : ajoute l'app sur l'écran d'accueil et ouvre-la depuis l'icône.</span>`;return}
  el.className="sync ok";
  el.innerHTML=`<i></i>Progression enregistrée sur cet appareil${seen?` (${seen} carte${seen>1?"s":""} vue${seen>1?"s":""})`:""}. Fais une sauvegarde de temps en temps (Réglages).`;}
document.addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden"){saveLocal();flush()} else if(REMOTE){pull().then(c=>{if(c)refresh()})} });

