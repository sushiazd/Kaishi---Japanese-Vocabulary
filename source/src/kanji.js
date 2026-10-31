/* ===================== Kanji : outils communs ===================== */
/* --- romaji -> hiragana (saisie des lectures) --- */
const RK=(()=>{const t={a:"あ",i:"い",u:"う",e:"え",o:"お"};
  const rows={k:"かきくけこ",g:"がぎぐげご",s:"さしすせそ",z:"ざじずぜぞ",t:"たちつてと",d:"だぢづでど",n:"なにぬねの",h:"はひふへほ",b:"ばびぶべぼ",p:"ぱぴぷぺぽ",m:"まみむめも",r:"らりるれろ"};
  for(const c in rows) for(let i=0;i<5;i++) t[c+"aiueo"[i]]=rows[c][i];
  Object.assign(t,{ya:"や",yu:"ゆ",yo:"よ",wa:"わ",wo:"を",wi:"うぃ",we:"うぇ",shi:"し",chi:"ち",tsu:"つ",fu:"ふ",ji:"じ",
    fa:"ふぁ",fi:"ふぃ",fe:"ふぇ",fo:"ふぉ",ja:"じゃ",ju:"じゅ",jo:"じょ",je:"じぇ",sha:"しゃ",shu:"しゅ",sho:"しょ",she:"しぇ",
    cha:"ちゃ",chu:"ちゅ",cho:"ちょ",che:"ちぇ",va:"ゔぁ",vi:"ゔぃ",vu:"ゔ",ve:"ゔぇ",vo:"ゔぉ",thi:"てぃ",dhi:"でぃ",
    xa:"ぁ",xi:"ぃ",xu:"ぅ",xe:"ぇ",xo:"ぉ",la:"ぁ",li:"ぃ",lu:"ぅ",le:"ぇ",lo:"ぉ",xtsu:"っ",ltsu:"っ",xtu:"っ",ltu:"っ",
    xya:"ゃ",xyu:"ゅ",xyo:"ょ",lya:"ゃ",lyu:"ゅ",lyo:"ょ","-":"ー"});
  const y={k:"き",g:"ぎ",n:"に",h:"ひ",b:"び",p:"ぴ",m:"み",r:"り",s:"し",z:"じ",t:"ち",c:"ち",d:"ぢ",j:"じ"}, sm={a:"ゃ",u:"ゅ",o:"ょ",e:"ぇ"};
  for(const c in y) for(const v of "auoe") t[c+"y"+v]=y[c]+sm[v];
  return t;})();
const RK_PREFIX=(()=>{const p=new Set();for(const k in RK) for(let i=1;i<=k.length;i++) p.add(k.slice(0,i));return p})();
function toKana(s,final){
  let out="",i=0;
  while(i<s.length){
    const lo=s[i].toLowerCase();
    if(!/[a-z'\-]/.test(lo)){out+=s[i];i++;continue}
    const nx=(s[i+1]||"").toLowerCase();
    if(lo==="n"){
      if(!nx){ out+=final?"ん":s[i]; i++; continue; }
      if(nx==="'"){out+="ん";i+=2;continue}
      if(nx==="n"){ const n2=(s[i+2]||"").toLowerCase(); out+="ん"; i+=/[aiueoy]/.test(n2)?1:2; continue; }
      if(!/[aiueoy]/.test(nx)){out+="ん";i++;continue}
    }
    if(lo===nx&&/[bcdfghjkmpqrstvwxz]/.test(lo)){out+="っ";i++;continue}
    if(lo==="t"&&nx==="c"){out+="っ";i++;continue}
    let m=null; for(const L of [4,3,2,1]){const seg=s.substr(i,L).toLowerCase(); if(seg.length===L&&RK[seg]){m=seg;break}}
    if(m){out+=RK[m];i+=m.length;continue}
    const rest=s.slice(i).toLowerCase();
    if(!final&&RK_PREFIX.has(rest)){out+=s.slice(i);break}
    out+=s[i]; i++;
  }
  return out;
}
const kataToHira=s=>s.replace(/[ァ-ヶ]/g,c=>String.fromCharCode(c.charCodeAt(0)-0x60));
const normKana=s=>kataToHira(toKana(String(s).trim(),true)).replace(/[\s・。、,.　]/g,"");
function bindKana(input){ input.addEventListener("input",()=>{const v=input.value, c=toKana(v,false); if(c!==v) input.value=c;}); }

/* --- vérification du sens (français) --- */
function normFr(s){
  s=String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g,"").replace(/œ/g,"oe").replace(/æ/g,"ae")
    .replace(/\(.*?\)/g," ").replace(/[’'`]/g," ").replace(/[^a-z0-9 ]/g," ").replace(/(\d) (?=\d)/g,"$1").replace(/\s+/g," ").trim();
  for(let n=0;n<2;n++) s=s.replace(/^(le|la|les|l|un|une|des|du|de|d|se|s|en|au|aux)\s+/,"");
  return s;
}
function lev(a,b){ if(a===b) return 0; const m=a.length,n=b.length; if(!m) return n; if(!n) return m;
  let p=Array.from({length:n+1},(_,j)=>j); for(let i=1;i<=m;i++){ const c=[i]; for(let j=1;j<=n;j++) c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); p=c; } return p[n]; }
function acceptedMeanings(k){ const set=new Set(); for(const x of k[1].split(/[;,/]/).concat(k[12]||[])){const n=normFr(x); if(n) set.add(n);} return [...set]; }
function checkMeaning(k,ans){
  const a=normFr(ans); if(!a) return {ok:false,empty:true};
  for(const acc of acceptedMeanings(k)){
    if(a===acc) return {ok:true};
    const tol=acc.length<=3?0:acc.length<=6?1:2;
    if(lev(a,acc)<=tol) return {ok:true,typo:true};
  }
  return {ok:false};
}
function checkReading(expected,ans){
  const a=normKana(ans), e=normKana(expected); if(!a) return {ok:false,empty:true};
  if(a===e) return {ok:true};
  if(/[a-z]/i.test(a)) return {ok:false,latin:true};
  return {ok:false,close:lev(a,e)<=1};
}
const wordHL=(w,k)=>esc(w).split(k).join(`<b class="hl">${k}</b>`);

/* --- champ de réponse tapée --- */
function qFieldHTML(kind){
  const r=kind==="r";
  return `<form class="qform" id="qform" autocomplete="off">
    <input id="qin" class="qin${r?" qin-r":""}" type="text" inputmode="text" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="done" lang="${r?"ja":"fr"}" placeholder="${r?"en romaji : yasumu":"en français"}" aria-label="${r?"Lecture":"Sens"}">
    <button class="qgo" aria-label="Valider">${arrowIco()}</button></form>
    <div class="qfb" id="qfb" aria-live="polite"></div>`;
}
const arrowIco=()=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
/* branche le champ ; onAnswer(valeur) doit renvoyer {ok, html} ; submit() force une réponse vide (« je ne sais pas ») */
function wireQuestion(kind,onAnswer){
  const f=$("#qform"), inp=$("#qin"); if(!f) return {submit(){}};
  if(kind==="r") bindKana(inp);
  setTimeout(()=>{try{inp.focus({preventScroll:true})}catch(e){}},60);
  const go=force=>{ if(f.dataset.done) return;
    const v=kind==="r"?toKana(inp.value,true):inp.value;
    if(!v.trim()&&!force){ inp.classList.add("shake"); setTimeout(()=>inp.classList.remove("shake"),400); return; }
    inp.value=v; const res=onAnswer(v); f.dataset.done="1"; inp.readOnly=true;
    f.classList.add(res.ok?"is-ok":"is-bad"); $("#qfb").innerHTML=res.html||""; };
  f.onsubmit=e=>{e.preventDefault();go(false)};
  return {submit:()=>go(true)};
}

/* ===================== Bloc A : leçons ===================== */
let LES=null;
function dayStart(day){ return day*DAY+4*3600e3+new Date().getTimezoneOffset()*MIN; }
function lessonsLeft(){ return Math.max(0,S.cfg.kNewPerDay-daily("kanji").n); }
function lessonPool(){ const out=[]; for(let i=0;i<KANJI.length;i++){const r=st(KR+i); if(r.q===0&&!r.susp) out.push(i)} return out; }
function lessonBatch(){ return lessonPool().slice(0,Math.min(5,lessonsLeft())); }
function lessonCount(){ return Math.min(lessonsLeft(),lessonPool().length); }
function startLesson(){
  const b=lessonBatch();
  if(!b.length){ toast(lessonPool().length?"Tu as fait tes leçons du jour. Reviens demain, ou augmente la limite dans les Réglages.":"Tu as vu tous les kanji N5 !"); return; }
  LES={batch:b,k:0,page:0,phase:"learn",queue:[],wrong:new Set()}; view="lesson"; cur=null; pad=null; renderLesson();
}
const LPAGES=["Sens","Lecture","Écriture"];
function renderLesson(){
  const L=LES; if(!L) return renderHome();
  $("#counts").innerHTML=`<span class="c-new on" title="Leçon">${L.batch.length}</span>`;
  if(L.phase==="learn") return renderLessonPage();
  if(L.phase==="quiz") return renderLessonQuiz();
  return renderLessonDone();
}
function lessonHead(){
  const L=LES;
  return `<div class="les-head"><div class="les-dots">${L.batch.map((i,j)=>`<span class="${L.phase!=="learn"||j<L.k?"ok":j===L.k?"on":""}">${KANJI[i][0]}</span>`).join("")}</div>
    ${L.phase==="learn"?`<div class="les-tabs">${LPAGES.map((p,j)=>`<button class="${j===L.page?"on":""}" data-lpage="${j}">${p}</button>`).join("")}</div>`:`<div class="les-step">Quiz de fin de leçon</div>`}</div>`;
}
function renderLessonPage(){
  const L=LES, i=L.batch[L.k], k=KANJI[i];
  let body="";
  if(L.page===0){
    body=`<div class="kbig">${k[0]}</div><p class="meaning big">${esc(k[1])}</p>
      <div class="extras"><div class="box"><h4>Éléments</h4>${esc(k[4])}</div>
      <div class="box"><h4>Astuce pour le sens</h4>${esc(k[5])}</div></div>`;
  } else if(L.page===1){
    body=`<div class="kbig sm">${k[0]}</div><p class="meaning">${esc(k[1])}</p>${readingsHTML(k)}
      <div class="extras"><div class="box"><h4>Astuce pour la lecture</h4>${esc(k[13])}</div>
      <div class="box"><h4>Mots à connaître</h4>${examplesHTML(k)}</div></div>`;
  } else {
    body=`<div class="les-write"><div class="svg-wrap">${kanjiSVG(k)}<button class="ghost sm" id="replay">Rejouer l'ordre des traits</button></div>
      ${k[6]?`<p class="tip" style="text-align:left">${esc(k[6])}</p>`:""}
      <div class="box practice"><h4>Trace-le</h4>${lessonPadHTML(k)}</div></div>`;
  }
  $("#view").innerHTML=`<section class="lesson fade">${lessonHead()}<article class="card kcard">${body}</article></section>`;
  $("#stage").scrollTop=0;
  if(L.page===1) speak([k[7][0][1]]);
  if(L.page===2){ const svg=$(".les-write .ksvg"); animateStrokes(svg); $("#replay").onclick=()=>animateStrokes(svg); lessonPadInit(k); }
  const last=L.k===L.batch.length-1&&L.page===2;
  const a=$("#answer"), inner=$("#answerInner"); a.hidden=false;
  inner.innerHTML=`<div class="les-nav"><button class="ghost" id="lPrev" ${L.k===0&&L.page===0?"disabled":""}>Précédent</button><button class="show-btn" id="lNext">${last?"Commencer le quiz":"Suivant"}</button></div>`;
  $("#lPrev").onclick=()=>lessonMove(-1); $("#lNext").onclick=()=>lessonMove(1);
}
/* tracé pendant la leçon : 1) sur le modèle, trait suivant indiqué ; 2) de mémoire */
function lessonPadHTML(k){ const pass=(LES.wp&&LES.wp[LES.k])||0;
  return `<p class="les-pass">${pass===0?"<b>1/2</b> · Trace sur le modèle, trait par trait":pass===1?"<b>2/2</b> · Maintenant de mémoire, sans modèle":"✓ Écrit deux fois. Tu peux passer à la suite."}</p>
  ${checkPadHTML("padPractice")}<div class="pad-tools"><button class="ghost sm" id="pHint">Indice</button><button class="ghost sm" id="pReset">Recommencer</button></div>`; }
function lessonPadInit(k){
  const L=LES; L.wp=L.wp||{}; const pass=L.wp[L.k]||0;
  const pp=PADS.padPractice=makeCheckPad($("#padPractice"),k,{guide:pass===0,hintNext:pass===0,onMsg:padMsgFn("padPractice"),
    onDone:()=>{ if(pass<2){ setTimeout(()=>{ if(!LES||LES.phase!=="learn"||LES.page!==2) return; L.wp[L.k]=pass+1; renderLessonPage(); },700); } }});
  if(pass>=2) pp.reveal();
  $("#pHint").onclick=()=>pp.hint(); $("#pReset").onclick=()=>pp.reset();
}
function lessonMove(d){
  const L=LES; if(L.phase!=="learn") return;
  let p=L.page+d, k=L.k;
  if(p>2){ if(k<L.batch.length-1){k++;p=0} else return startLessonQuiz(); }
  if(p<0){ if(k>0){k--;p=2} else return; }
  L.k=k; L.page=p; try{speechSynthesis.cancel()}catch(e){} renderLessonPage();
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-lpage]"); if(b&&LES&&LES.phase==="learn"){LES.page=+b.dataset.lpage; renderLessonPage();}});
function shuffle(a,seed){ const r=a.slice(); for(let i=r.length-1;i>0;i--){const j=hash(seed+i*31)%(i+1); [r[i],r[j]]=[r[j],r[i]]} return r; }
function startLessonQuiz(){
  const L=LES; const items=[]; for(const i of L.batch){items.push({i,t:"m"});items.push({i,t:"r"});}
  L.queue=shuffle(items,Date.now()%100000); L.phase="quiz"; L.answered=false; renderLesson();
}
function quizPromptHTML(k,t){
  if(t==="m") return `<div class="kbig">${k[0]}</div><p class="kq">Que veut dire ce kanji ?</p>`;
  const ex=k[7][0]; return `<div class="qword">${wordHL(ex[0],k[0])}</div><p class="kq">Comment se lit ce mot ?</p>`;
}
function quizFeedback(k,t,res){
  const ex=k[7][0];
  if(res.ok) return `<p class="ok">Correct${res.typo?" (attention à l'orthographe)":""}.</p><p class="qsol">${t==="m"?esc(k[1]):`${esc(ex[0])} se lit <b>${esc(ex[1])}</b> · ${esc(ex[2])}`}</p>`;
  let hint=""; if(res.latin) hint="Écris la lecture en romaji complet (ex. : yasumu → やすむ). "; else if(res.close) hint="Presque ! ";
  return `<p class="bad">${hint}Pas tout à fait.</p><p class="qsol">${t==="m"?`Réponse : <b>${esc(k[1])}</b>`:`${esc(ex[0])} se lit <b>${esc(ex[1])}</b> · ${esc(ex[2])}`}</p>`;
}
function renderLessonQuiz(){
  const L=LES; if(!L.queue.length) return finishLesson();
  const it=L.queue[0], k=KANJI[it.i]; L.answered=false;
  $("#view").innerHTML=`<section class="lesson fade">${lessonHead()}<article class="card kcard"><div class="tagline"><span class="chip kind">${it.t==="m"?"Sens":"Lecture"}</span><span class="num">${L.queue.length} restante${L.queue.length>1?"s":""}</span></div>
    ${quizPromptHTML(k,it.t)}${qFieldHTML(it.t)}</article></section>`;
  const a=$("#answer"); a.hidden=true;
  wireQuestion(it.t,v=>{
    const res=it.t==="m"?checkMeaning(k,v):checkReading(k[7][0][1],v);
    L.answered=true; L.lastOk=res.ok;
    if(it.t==="r"&&res.ok) speak([k[7][0][1]]);
    a.hidden=false; $("#answerInner").innerHTML=`<div class="les-nav">${res.ok?"":`<button class="ghost" id="qTypo">J'avais juste</button>`}<button class="show-btn" id="qNext">Continuer</button></div>`;
    $("#qNext").onclick=()=>lessonQuizNext(res.ok);
    if(!res.ok) $("#qTypo").onclick=()=>lessonQuizNext(true);
    setTimeout(()=>{try{$("#qNext").focus({preventScroll:true})}catch(e){}},30);
    return {ok:res.ok,html:quizFeedback(k,it.t,res)};
  });
}
function lessonQuizNext(ok){
  const L=LES, it=L.queue.shift();
  if(!ok){ L.wrong.add(it.i); const pos=Math.min(L.queue.length,2+hash(Date.now())%3); L.queue.splice(pos,0,it); }
  renderLessonQuiz();
}
function finishLesson(){
  const L=LES, now=Date.now(), t=today(now), dd=daily("kanji"), H=S.histK, h=H[t]||(H[t]=[0,0,0,0]);
  for(const i of L.batch){
    S.cards[KR+i]={...NEW,q:1,step:1,due:now+10*MIN,ease:START_EASE,reps:1,mod:now};
    if(S.cfg.kWrite) S.cards[KW+i]={...NEW,q:1,step:1,due:dayStart(t+1),ease:START_EASE,reps:0,mod:now};
    changed(KR+i); changed(KW+i);
  }
  dd.n+=L.batch.length; h[3]+=L.batch.length; changed(null);
  L.phase="done"; renderLesson();
}
function renderLessonDone(){
  const L=LES, more=lessonCount(), g=gather(Date.now(),"kanji"), rev=g.learnNow.length+g.rev.length;
  $("#view").innerHTML=`<section class="done fade"><p class="big">${L.batch.map(i=>KANJI[i][0]).join("")}</p><h2>Leçon terminée !</h2>
    <p>Tu reverras ces ${L.batch.length} kanji en révision dans 10 minutes${S.cfg.kWrite?", puis tu les écriras de mémoire dès demain":""}.</p>
    <div class="links" style="justify-content:center">${more?`<button class="primary" style="width:auto" id="moreLes">Leçon suivante (${Math.min(5,more)})</button>`:""}
    ${rev?`<button class="ghost" id="goRev">Révisions (${rev})</button>`:""}<button class="ghost" id="homeBtn">Accueil</button></div></section>`;
  $("#answer").hidden=true; renderCounts();
  if($("#moreLes")) $("#moreLes").onclick=startLesson;
  if($("#goRev")) $("#goRev").onclick=()=>{LES=null;startStudy()};
  $("#homeBtn").onclick=()=>{LES=null;renderHome()};
}

/* ===================== Bloc B : révisions tapées ===================== */
let KQ=null;
function kqFor(id){ if(!KQ||KQ.id!==id){ const k=kOf(id), s=st(id); KQ={id,stage:"m",mOk:null,rOk:null,mAns:"",rAns:"",ex:k[7][s.reps%k[7].length]}; } return KQ; }
function gradeBtnHTML(btn,label,cls,id){ const now=Date.now(); return `<button class="grade g${btn} ${cls||""}" ${id?`id="${id}"`:""} data-g="${btn}"><small class="num">${fmtIvl(next(cur,st(cur),btn,now),now)}</small><span>${label}</span></button>`; }
function resLine(label,ok,txt){ return `<p class="res ${ok?"ok":"bad"}"><span class="res-l">${ok?"✓":"✗"} ${label}</span><span class="res-v">${txt}</span></p>`; }
function renderKanjiRec(noAudio){
  const k=kOf(cur), s=st(cur), Q=kqFor(cur); renderCounts();
  let html=`<article class="card kcard fade" aria-live="polite"><div class="tagline"><span>${statusChip(s)} <span class="chip kind">Lecture</span></span><span class="num">${Q.stage==="m"?"1/2 · sens":Q.stage==="r"?"2/2 · lecture":""}</span></div>`;
  if(Q.stage==="m") html+=`<div class="kbig">${k[0]}</div><p class="kq">Que veut dire ce kanji ?</p>${qFieldHTML("m")}`;
  else if(Q.stage==="r") html+=`<div class="qword">${wordHL(Q.ex[0],k[0])}</div><p class="kq">Comment se lit ce mot ?</p>${qFieldHTML("r")}`;
  else html+=`<div class="kbig sm">${k[0]}</div><p class="meaning">${esc(k[1])}</p>
      <div class="results">${resLine("Sens",Q.mOk,Q.mOk?esc(Q.mAns):`${esc(Q.mAns)||"—"} → <b>${esc(k[1])}</b>`)}${resLine(`Lecture de ${esc(Q.ex[0])}`,Q.rOk,Q.rOk?esc(Q.ex[1]):`${esc(Q.rAns)||"—"} → <b>${esc(Q.ex[1])}</b>`)}</div>
      ${kanjiInfoHTML(k)}<div class="svg-wrap">${kanjiSVG(k)}<button class="ghost sm" id="replay">Rejouer l'ordre des traits</button></div>`;
  html+=`</article>`;
  $("#view").innerHTML=html; $("#stage").scrollTop=0;
  const a=$("#answer"), inner=$("#answerInner"); a.hidden=false;
  if(Q.stage!=="done"){
    inner.innerHTML=`<button class="ghost wide" id="kIdk">Je ne sais pas</button>`;
    const W=wireQuestion(Q.stage,v=>{
      const r=Q.stage==="m"?checkMeaning(k,v):checkReading(Q.ex[1],v);
      if(Q.stage==="m"){Q.mOk=!!r.ok;Q.mAns=v}else{Q.rOk=!!r.ok;Q.rAns=v; if(r.ok) speak([Q.ex[1]]);}
      inner.innerHTML=`<button class="show-btn" id="kNext">Continuer</button>`;
      $("#kNext").onclick=()=>{ if(Q.stage==="m") Q.stage="r"; else {Q.stage="done"; shown=true;} renderKanjiRec(Q.stage==="done"&&Q.rOk); };
      setTimeout(()=>{try{$("#kNext").focus({preventScroll:true})}catch(e){}},30);
      const sol=Q.stage==="m"?esc(k[1]):`${esc(Q.ex[0])} se lit <b>${esc(Q.ex[1])}</b> · ${esc(Q.ex[2])}`;
      let hint=""; if(r.latin) hint="Écris la lecture en romaji complet (ex. : yasumu → やすむ). "; else if(r.close) hint="Presque ! ";
      return {ok:r.ok,html:r.ok?`<p class="ok">Correct${r.typo?" (attention à l'orthographe)":""}.</p><p class="qsol">${sol}</p>`:`<p class="bad">${hint}${r.empty?"Pas de réponse.":"Pas tout à fait."}</p><p class="qsol">${Q.stage==="m"?"Réponse : <b>"+sol+"</b>":sol}</p>`};
    });
    $("#kIdk").onclick=()=>W.submit();
  } else {
    const ok=Q.mOk&&Q.rOk;
    inner.innerHTML=`<div class="grades two">${ok?gradeBtnHTML(3,"Correct","pri","kPrimary")+gradeBtnHTML(4,"Facile"):gradeBtnHTML(1,"À revoir","pri","kPrimary")+`<button class="grade g3 typo" data-g="3"><small>J'avais juste</small><span>Faute de frappe</span></button>`}</div><div class="kbd">Entrée : ${ok?"Correct":"À revoir"}</div>`;
    inner.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>answer(+b.dataset.g));
    const svg=$(".kcard .ksvg"); animateStrokes(svg); $("#replay").onclick=()=>animateStrokes(svg);
    if(S.cfg.autoplay&&!noAudio) speak([Q.ex[1]]);
  }
}

/* ===================== Bloc C : écriture vérifiée trait par trait ===================== */
let _sampler=null;
const SVGNS="http://www.w3.org/2000/svg";
function modelStrokes(k){
  if(k._ms) return k._ms;
  if(!_sampler){ _sampler=document.createElementNS(SVGNS,"svg"); _sampler.setAttribute("width","1"); _sampler.setAttribute("height","1");
    _sampler.style.cssText="position:absolute;left:-9999px;top:0;width:1px;height:1px;overflow:hidden"; document.body.appendChild(_sampler); }
  k._ms=k[9].map(d=>{ const p=document.createElementNS(SVGNS,"path"); p.setAttribute("d",d); _sampler.appendChild(p);
    const L=p.getTotalLength(), n=Math.max(8,Math.ceil(L/1.5)), pts=[];
    for(let i=0;i<=n;i++){const q=p.getPointAtLength(L*i/n); pts.push([q.x,q.y])}
    p.remove(); return pts; });
  return k._ms;
}
const dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
function polyLen(p){let L=0;for(let i=1;i<p.length;i++)L+=dist(p[i],p[i-1]);return L}
function centroid(p){let x=0,y=0;for(const q of p){x+=q[0];y+=q[1]}return [x/p.length,y/p.length]}
function resample(pts,N=24){
  if(!pts.length) return [];
  const p=pts.map(q=>q.slice()), L=polyLen(p);
  if(L===0) return Array.from({length:N},()=>p[0].slice());
  const I=L/(N-1), out=[p[0].slice()]; let D=0;
  for(let i=1;i<p.length;i++){ const d=dist(p[i],p[i-1]);
    if(D+d>=I&&d>0){ const t=(I-D)/d, q=[p[i-1][0]+t*(p[i][0]-p[i-1][0]),p[i-1][1]+t*(p[i][1]-p[i-1][1])]; out.push(q); p.splice(i,0,q); D=0; }
    else D+=d; }
  while(out.length<N) out.push(p[p.length-1].slice());
  return out.slice(0,N);
}
/* compare un trait tracé (unités KanjiVG 109×109) au trait attendu */
function strokeMatch(u,m,off=[0,0],loose=false){
  const N=24, uu=resample(u.map(q=>[q[0]-off[0],q[1]-off[1]]),N), mm=resample(m,N);
  const Lu=polyLen(resample(u,16)), Lm=polyLen(m);
  const mean=(a,b)=>a.reduce((s,q,i)=>s+dist(q,b[i]),0)/a.length;
  const d=mean(uu,mm), dr=mean(uu.slice().reverse(),mm);
  if(Lm<14){ const ok=dist(centroid(uu),centroid(mm))<14&&Lu<40; return {ok,d}; }
  const tol=Math.min(21,Math.max(11,8+Lm*0.13))*(loose?1.4:1), ratio=Lu/Lm;
  let ok=d<tol&&dist(uu[0],mm[0])<tol*1.6&&dist(uu[N-1],mm[N-1])<tol*1.6&&ratio>0.45&&ratio<2.1;
  const vu=[uu[N-1][0]-uu[0][0],uu[N-1][1]-uu[0][1]], vm=[mm[N-1][0]-mm[0][0],mm[N-1][1]-mm[0][1]], nm=Math.hypot(...vm), nu=Math.hypot(...vu);
  if(ok&&nm>5&&nu>3&&(vu[0]*vm[0]+vu[1]*vm[1])/(nm*nu)<0.25) return {ok:false,d,reversed:true};
  return {ok,d,reversed:!ok&&dr<tol&&dr<d*0.7};
}
/* trait attendu M[i] ; refuse si le tracé ressemble nettement plus à un autre trait pas encore écrit */
function strokeCheck(u,M,i,off,loose){
  const r=strokeMatch(u,M[i],off,loose); if(!r.ok) return r;
  for(let j=i+1;j<M.length;j++){ const o=strokeMatch(u,M[j],off,loose); if(o.ok&&o.d<r.d*0.75) return {ok:false,order:true,d:r.d}; }
  return r;
}
function makeCheckPad(canvas,k,o={}){
  const M=modelStrokes(k), ctx=canvas.getContext("2d");
  const st0=o.state||{idx:0,mistakes:0,miss:0,hint:false,done:false,gaveUp:false,off:[0,0],offs:[]};
  const P=st0; let cur=null, flash=null, guide=!!o.guide;
  const css=()=>{const cs=getComputedStyle(document.body);return {ink:cs.color,line:cs.getPropertyValue("--line").trim()||"#ccc",ai:cs.getPropertyValue("--ai").trim()||"#36c",bad:cs.getPropertyValue("--learn").trim()||"#c33"}};
  let sc=1;
  function size(){const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1; canvas.width=Math.max(1,Math.round(r.width*dpr)); canvas.height=Math.max(1,Math.round(r.height*dpr)); sc=canvas.width/109; draw();}
  function poly(pts,w,color,alpha=1){ if(!pts||!pts.length) return; ctx.save(); ctx.globalAlpha=alpha; ctx.strokeStyle=color; ctx.lineWidth=w*sc; ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.beginPath(); ctx.moveTo(pts[0][0]*sc,pts[0][1]*sc); if(pts.length===1) ctx.lineTo(pts[0][0]*sc+0.1,pts[0][1]*sc);
    for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i][0]*sc,pts[i][1]*sc); ctx.stroke(); ctx.restore(); }
  function draw(){
    const c=css(), W=canvas.width; ctx.clearRect(0,0,W,canvas.height);
    ctx.save(); ctx.strokeStyle=c.line; ctx.lineWidth=Math.max(1,W/300); ctx.setLineDash([W/40,W/40]); ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,W); ctx.moveTo(0,W/2); ctx.lineTo(W,W/2); ctx.stroke(); ctx.restore();
    if(guide) M.forEach((m,j)=>{ if(j>=P.idx) poly(m,4.2,c.ai,.16); });
    for(let j=0;j<P.idx;j++) poly(M[j],4.4,c.ink);
    if(!P.done&&P.idx<M.length&&(P.hint||o.hintNext)){ const m=M[P.idx]; poly(m,4.6,c.ai,.42); ctx.save(); ctx.fillStyle=c.ai; ctx.beginPath(); ctx.arc(m[0][0]*sc,m[0][1]*sc,3.2*sc,0,7); ctx.fill(); ctx.restore(); }
    if(cur) poly(cur,4.4,c.ink); if(flash) poly(flash,4.4,c.bad,.9);
  }
  const pt=e=>{const r=canvas.getBoundingClientRect();return [Math.min(109,Math.max(0,(e.clientX-r.left)/r.width*109)),Math.min(109,Math.max(0,(e.clientY-r.top)/r.height*109))]};
  const say=(msg,kind)=>o.onMsg&&o.onMsg(msg,kind,P);
  function evaluate(u){
    if(P.done) return;
    const r=strokeCheck(u,M,P.idx,P.off,P.offs.length===0);
    if(r.ok){
      const cu=centroid(resample(u,24)), cm=centroid(resample(M[P.idx],24)); P.offs.push([cu[0]-cm[0],cu[1]-cm[1]]);
      const av=P.offs.reduce((a,q)=>[a[0]+q[0],a[1]+q[1]],[0,0]).map(x=>Math.max(-12,Math.min(12,x/P.offs.length))); P.off=av;
      P.idx++; P.miss=0; P.hint=false;
      if(P.idx>=M.length){ P.done=true; draw(); say(P.mistakes?`Terminé, avec ${P.mistakes} erreur${P.mistakes>1?"s":""}.`:"Parfait, aucune erreur !","ok"); o.onDone&&o.onDone(P); return; }
      say(`Trait ${P.idx+1} sur ${M.length}`,"info");
    } else {
      P.mistakes++; P.miss++;
      let msg="Pas tout à fait.";
      if(r.reversed) msg="Bon trait, mais tracé dans le mauvais sens.";
      else if(r.order) msg="Ce trait vient plus tard : respecte l'ordre.";
      else for(let j=P.idx+1;j<M.length;j++) if(strokeMatch(u,M[j],P.off).ok){ msg="Ce trait vient plus tard : respecte l'ordre."; break; }
      if(P.miss>=2&&!P.hint){ P.hint=true; msg+=" Regarde l'indice."; }
      flash=u; setTimeout(()=>{flash=null;draw()},450); say(msg,"bad");
    }
    draw();
  }
  if(!o.readOnly){
    canvas.addEventListener("pointerdown",e=>{ if(P.done) return; e.preventDefault(); try{canvas.setPointerCapture(e.pointerId)}catch(_){} cur=[pt(e)]; draw(); });
    canvas.addEventListener("pointermove",e=>{ if(!cur) return; e.preventDefault(); const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e]; for(const ev of evs) cur.push(pt(ev)); draw(); });
    const end=()=>{ if(!cur) return; const u=cur; cur=null; evaluate(u); };
    canvas.addEventListener("pointerup",end); canvas.addEventListener("pointercancel",()=>{cur=null;draw()});
  }
  size(); if(!P.done) say(`Trait ${P.idx+1} sur ${M.length}`,"info");
  return {state:P,size,draw,
    hint(){ if(P.done||P.hint) return; P.hint=true; P.mistakes++; draw(); say("Indice affiché (compte comme une erreur).","info"); },
    reveal(){ if(P.done) return; P.gaveUp=true; P.idx=M.length; P.done=true; draw(); o.onDone&&o.onDone(P); },
    reset(){ Object.assign(P,{idx:0,mistakes:0,miss:0,hint:false,done:false,gaveUp:false,off:[0,0],offs:[]}); draw(); say(`Trait 1 sur ${M.length}`,"info"); },
    setGuide(b){ guide=b; draw(); } };
}
function checkPadHTML(id,extra=""){ return `<canvas class="pad" id="${id}" aria-label="Zone d'écriture"></canvas><p class="padmsg" id="${id}Msg" aria-live="polite"></p>${extra}`; }
function padMsgFn(id){ return (msg,kind)=>{ const el=document.getElementById(id+"Msg"); if(el){ el.textContent=msg; el.className="padmsg "+(kind||""); } }; }

/* --- carte d'écriture en révision --- */
function writeGrade(P){ if(P.gaveUp||P.mistakes>=3) return [1,2]; if(P.mistakes>0) return [2,3]; return [3,4]; }
function renderKanjiWrite(noAudio){
  const k=kOf(cur), s=st(cur); renderCounts();
  if(!pad||pad.id!==cur) pad={id:cur,state:null};
  const ex=k[7][0], blank=esc(ex[0]).split(k[0]).join(`<span class="blank">◯</span>`);
  let html=`<article class="card kcard fade" aria-live="polite"><div class="tagline"><span>${statusChip(s)} <span class="chip kind">Écriture</span></span><span class="num">${k[8]} trait${k[8]>1?"s":""}</span></div>
    <p class="kq">Écris le kanji qui veut dire</p><p class="meaning big">${esc(k[1])}</p>
    <p class="kprompt"><span class="kp-w">${blank}</span><span class="kp-r">${esc(ex[1])} · ${esc(ex[2])}</span></p>`;
  if(!shown){
    html+=`${checkPadHTML("padMain")}<div class="pad-tools"><button class="ghost sm" id="wHint">Indice</button></div>`;
  } else {
    const P=pad.state||{mistakes:0,gaveUp:true};
    const sum=P.gaveUp?`<p class="res bad"><span class="res-l">✗ Modèle affiché</span><span class="res-v">À revoir</span></p>`:P.mistakes?`<p class="res bad"><span class="res-l">${P.mistakes} erreur${P.mistakes>1?"s":""}</span><span class="res-v">${P.mistakes>=3?"À revoir":"Difficile"}</span></p>`:`<p class="res ok"><span class="res-l">✓ Sans faute</span><span class="res-v">tous les traits dans l'ordre</span></p>`;
    html+=`<div class="results">${sum}</div><div class="svg-wrap">${kanjiSVG(k)}<button class="ghost sm" id="replay">Rejouer l'ordre des traits</button></div>
      <div class="kbig sm">${k[0]}</div>${kanjiInfoHTML(k)}`;
  }
  html+=`</article>`;
  $("#view").innerHTML=html; $("#stage").scrollTop=0;
  const a=$("#answer"), inner=$("#answerInner"); a.hidden=false;
  if(!shown){
    const pp=PADS.padMain=makeCheckPad($("#padMain"),k,{state:pad.state,onMsg:padMsgFn("padMain"),
      onDone:P=>{ pad.state=P; setTimeout(()=>{ if(cur===pad.id&&!shown){ shown=true; renderKanjiWrite(); } },P.gaveUp?0:650); }});
    pad.state=pp.state;
    $("#wHint").onclick=()=>pp.hint();
    inner.innerHTML=`<button class="ghost wide" id="wGive">Je ne sais pas · montrer le modèle</button>`;
    $("#wGive").onclick=()=>pp.reveal();
  } else {
    const [g1,g2]=writeGrade(pad.state||{gaveUp:true}), L=["","À revoir","Difficile","Correct","Facile"];
    inner.innerHTML=`<div class="grades two">${gradeBtnHTML(g1,L[g1],"pri","kPrimary")}${gradeBtnHTML(g2,L[g2])}</div><div class="kbd">Entrée : ${L[g1]}</div>`;
    inner.querySelectorAll("[data-g]").forEach(b=>b.onclick=()=>answer(+b.dataset.g));
    const svg=$(".kcard .ksvg"); animateStrokes(svg); $("#replay").onclick=()=>animateStrokes(svg);
    if(S.cfg.autoplay&&!noAudio) speak([ex[1]]);
  }
}

/* ===================== Bloc E : test de niveau ===================== */
let PT=null;
function startPlacement(){
  const list=lessonPool(); if(!list.length){ toast("Tous les kanji ont déjà commencé : pas besoin de test."); return; }
  PT={list,pos:0,stage:"m",known:[],unknown:[],streak:0,answered:false}; view="placement"; cur=null; LES=null; renderPlacement();
}
function ptHead(){ const n=PT.list.length; return `<div class="pt-head"><div class="pt-top num"><b>Test de niveau</b><span>${Math.min(PT.pos+1,n)} / ${n} · ${PT.known.length} connu${PT.known.length>1?"s":""}</span></div><div class="meter-track"><i class="m-mature" style="width:${(PT.pos/n*100).toFixed(1)}%"></i></div></div>`; }
function renderPlacement(){
  if(!PT) return renderHome();
  $("#counts").innerHTML=`<span class="c-new on" title="Test de niveau">${PT.list.length-PT.pos}</span>`;
  if(PT.pos>=PT.list.length) return finishPlacement();
  const i=PT.list[PT.pos], k=KANJI[i], ex=k[7][0]; PT.answered=false;
  const prompt=PT.stage==="m"?`<div class="kbig">${k[0]}</div><p class="kq">Que veut dire ce kanji ?</p>`:`<div class="qword">${wordHL(ex[0],k[0])}</div><p class="kq">Comment se lit ce mot ?</p>`;
  const tired=PT.streak>=8?`<div class="pt-tired"><span>Plusieurs kanji d'affilée inconnus : tu peux t'arrêter là, le reste arrivera en leçons.</span><button class="ghost sm" id="ptStop2">Terminer le test</button></div>`:"";
  $("#view").innerHTML=`<section class="lesson fade">${ptHead()}${tired}<article class="card kcard"><div class="tagline"><span class="chip kind">${PT.stage==="m"?"Sens":"Lecture"}</span><span></span></div>${prompt}${qFieldHTML(PT.stage)}</article>
    <p class="tip">Réponds seulement si tu sais vraiment. Un kanji est compté connu si tu trouves son sens et la lecture d'un mot.</p></section>`;
  const a=$("#answer"), inner=$("#answerInner"); a.hidden=false;
  inner.innerHTML=`<div class="les-nav"><button class="ghost" id="ptStop">Terminer</button><button class="show-btn" id="ptIdk">Je ne sais pas</button></div>`;
  $("#ptStop").onclick=finishPlacement; if($("#ptStop2")) $("#ptStop2").onclick=finishPlacement;
  const W=wireQuestion(PT.stage,v=>{
    const r=PT.stage==="m"?checkMeaning(k,v):checkReading(ex[1],v);
    PT.answered=true;
    const goOn=()=>{ if(!PT) return;
      if(PT.stage==="m"&&r.ok){PT.stage="r";}
      else { if(PT.stage==="r"&&r.ok){PT.known.push(i);PT.streak=0} else {PT.unknown.push(i);PT.streak++} PT.stage="m"; PT.pos++; }
      renderPlacement(); };
    inner.innerHTML=`<div class="les-nav"><button class="ghost" id="ptStop">Terminer</button><button class="show-btn" id="ptNext">Continuer</button></div>`;
    $("#ptStop").onclick=()=>{ if(PT.stage==="r"&&r.ok) PT.known.push(i); finishPlacement(); };
    $("#ptNext").onclick=goOn; setTimeout(()=>{try{$("#ptNext").focus({preventScroll:true})}catch(e){}},30);
    if(r.ok) PT._t=setTimeout(()=>{ if(PT&&PT.answered&&PT.list[PT.pos]===i) goOn(); },650);
    const sol=PT.stage==="m"?esc(k[1]):`${esc(ex[0])} se lit <b>${esc(ex[1])}</b>`;
    return {ok:r.ok,html:r.ok?`<p class="ok">Correct.</p><p class="qsol">${sol}</p>`:`<p class="bad">${r.empty?"Pas de réponse.":"Pas tout à fait."}</p><p class="qsol">${PT.stage==="m"?"Réponse : <b>"+sol+"</b>":sol}</p>`};
  });
  $("#ptIdk").onclick=()=>W.submit();
}
function finishPlacement(){
  if(!PT) return renderHome();
  clearTimeout(PT._t);
  const now=Date.now(), t=today(now), K=PT.known;
  K.forEach((i,n)=>{
    const ivl=4+(n%7);
    S.cards[KR+i]={...NEW,q:2,ivl,ease:START_EASE,reps:1,due:t+ivl,mod:now};
    if(S.cfg.kWrite) S.cards[KW+i]={...NEW,q:1,step:1,ease:START_EASE,due:dayStart(t+1+(n%7)),mod:now};
    changed(KR+i); changed(KW+i);
  });
  changed(null);
  const tested=PT.pos, left=lessonPool().length;
  PT=null; view="placementDone";
  $("#view").innerHTML=`<section class="done fade"><p class="big">${K.length}</p><h2>kanji déjà connus sur ${tested} testés</h2>
    <p>${K.length?`Ils sont marqués comme acquis : ils reviendront en révision d'ici 4 à 10 jours pour confirmer${S.cfg.kWrite?", et tu les écriras de mémoire au fil de la semaine":""}.`:"Aucun kanji n'a été marqué comme connu."} ${left?`Les ${left} autres arriveront en leçons, 5 par 5.`:""}</p>
    <div class="links" style="justify-content:center">${left?`<button class="primary" style="width:auto" id="ptLesson">Commencer une leçon</button>`:""}<button class="ghost" id="homeBtn">Accueil</button></div></section>`;
  $("#answer").hidden=true; renderCounts();
  if($("#ptLesson")) $("#ptLesson").onclick=startLesson;
  $("#homeBtn").onclick=renderHome;
}
