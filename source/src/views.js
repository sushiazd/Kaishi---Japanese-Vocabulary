/* ---------- views ---------- */
function refresh(){ if(view==="home") renderHome(); else if(view==="study"&&!shown) nextCard(); else if(view==="home"||view==="study") renderCounts(); }

function stats(d=deck){
  let nw=0,learn=0,young=0,mature=0,susp=0;
  for(const i of D(d).ids){const c=st(i); if(c.susp){susp++;continue}
    if(c.q===0)nw++; else if(c.q===1||c.q===3)learn++; else if(c.ivl>=MATURE)mature++; else young++;}
  return {nw,learn,young,mature,susp,N:D(d).ids.length};
}
/* Les kanji s'apprennent à travers les mots (bloc « Les kanji du mot » au verso) : le deck kanji séparé
   (leçons, révisions tapées, écriture, test de niveau dans kanji.js) n'est plus proposé. */
function renderBrand(){
  $("#brand").innerHTML = `<span class="brand-mark" lang="ja">開</span><span class="brand-txt"><strong>Kaishi 1.5k</strong><small>Vocabulaire · FR</small></span>`;
}
function renderHome(){
  view="home"; cur=null; shown=false; pad=null; LES=null; if(PT){clearTimeout(PT._t);PT=null;} deck="vocab"; $("#answer").hidden=true; renderBrand();
  const g=renderCounts(), s=stats(), N=s.N, total=g.fresh.length+g.learnNow.length+g.learnSoon.length+g.rev.length;
  const pct=x=>(x/N*100).toFixed(2)+"%";
  const tool=(open,ic,title,desc,when)=>`<button class="tool" data-open="${open}"><span class="ic" aria-hidden="true">${ic}</span>${when?`<span class="when num">${when}</span>`:""}<h2>${title}</h2><p>${desc}</p><span class="go">Ouvrir →</span></button>`;
  $("#view").innerHTML=`<section class="home fade">
    <p class="eyebrow">Japonais · Vocabulaire</p><h1><span lang="ja">開始</span>Kaishi 1.5k</h1><p class="lede">Les 1 500 mots japonais les plus fréquents, avec une phrase d'exemple, traduits en français.</p>
    <div class="today">
      <div class="today-row num">
        <div><strong class="c-new">${g.fresh.length}</strong><small>Nouvelles</small></div>
        <div><strong class="c-learn">${g.learnNow.length+g.learnSoon.length}</strong><small>Apprentissage</small></div>
        <div><strong class="c-rev">${g.rev.length}</strong><small>À réviser</small></div>
      </div>
      <button class="primary" id="studyBtn" ${total?"":"disabled"}>${total?"Étudier maintenant":"Rien à étudier pour l'instant"}</button>
      <div class="meter">
        <div class="meter-top num"><span>Progression du deck</span><span>${N-s.nw-s.susp} / ${N} vues</span></div>
        <div class="meter-track" role="img" aria-label="Répartition des cartes"><i class="m-mature" style="width:${pct(s.mature)}"></i><i class="m-young" style="width:${pct(s.young)}"></i><i class="m-learn" style="width:${pct(s.learn)}"></i></div>
        <div class="legend num"><span style="--k:var(--rev)">Acquises ${s.mature}</span><span style="--k:color-mix(in srgb,var(--rev) 45%,var(--surface))">Récentes ${s.young}</span><span style="--k:var(--learn)">En cours ${s.learn}</span><span style="--k:var(--line)">Nouvelles ${s.nw}</span>${s.susp?`<span style="--k:var(--muted)">Suspendues ${s.susp}</span>`:""}</div>
      </div>
    </div>
    <div class="tools">${tool("browse","語","Parcourir","Chercher un mot, le suspendre.","1 500")}${tool("grid","字","Les kanji","Fiches des kanji de base : sens, mots, ordre des traits.",KANJI.length)}${tool("stats","統","Statistiques","Réussite, série, prévisions.")}${tool("settings","設","Réglages","Rythme, audio, sauvegarde.")}</div>
    <div class="sync num" id="sync"></div>
    ${!total?nextDueLine():""}
    <p class="tip">Comme dans Anki : réponds dans ta tête (ou à voix haute), retourne la carte, puis note-toi honnêtement. « À revoir » si tu ne savais pas, « Correct » si tu savais. Au verso, <b>Les kanji du mot</b> explique chaque kanji : à force de les revoir dans tes mots, tu apprends à les reconnaître.</p>
  </section>`;
  renderSync();
  const b=$("#studyBtn"); if(b) b.onclick=()=>startStudy();
}
/* grille des kanji : surligne ceux déjà rencontrés dans un mot étudié */
function kStatus(i){ const ch=KANJI[i][0]; return CARDS.some((c,j)=>c[0].includes(ch)&&st(j).q!==0)?"mature":"new"; }
/* « Les kanji du mot » : sens et lectures (KANJIDIC2 ; astuce et fiche complète pour les kanji de base), et d'autres mots du deck qui l'utilisent */
let KIDX=null;
function wordKanjiHTML(c){
  const ks=[...new Set([...c[0]].filter(ch=>KV[ch]))]; if(!ks.length) return "";
  if(!KIDX){ KIDX={}; CARDS.forEach((w,i)=>{ for(const ch of new Set(w[0])) if(KV[ch]) (KIDX[ch]||(KIDX[ch]=[])).push(i); }); }
  return `<div class="box"><h4>Les kanji du mot</h4><div class="wk">${ks.map(ch=>{
    const [m,on,kun]=KV[ch], n=KANJI.findIndex(k=>k[0]===ch), K=n>=0?KANJI[n]:null;
    const also=(KIDX[ch]||[]).filter(i=>i!==cur).sort((a,b)=>(st(a).q===0)-(st(b).q===0)||a-b).slice(0,3).map(i=>esc(CARDS[i][0])).join("、");
    const body=`<b lang="ja">${ch}</b><span><strong>${esc(K?K[1]:m)}</strong><small lang="ja">${[on,kun].filter(Boolean).map(esc).join(" · ")}</small>${K?`<small>${esc(K[5])}</small>`:""}${also?`<small>Aussi dans : <span lang="ja">${also}</span></small>`:""}${K?`<small class="wk-more">Voir la fiche →</small>`:""}</span>`;
    return K?`<button class="wk-k" data-k="${n}">${body}</button>`:`<div class="wk-k">${body}</div>`;}).join("")}</div></div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest(".wk-k[data-k]"); if(b) openSheet("kanji",+b.dataset.k);});
function nextDueLine(){
  let soon=Infinity;
  for(const i of D().ids){const c=st(i); if(c.susp) continue; if(c.q===1||c.q===3) soon=Math.min(soon,c.due); }
  if(soon<Infinity) return `<p class="tip">Prochaine carte en apprentissage dans ${fmtIvl({q:1,due:soon},Date.now())}.</p>`;
  return `<p class="tip">Bravo, tu as fini pour aujourd'hui. Reviens demain pour de nouvelles cartes et tes révisions.</p>`;
}
function startStudy(){view="study";sinceNew=0;nextCard()}
function nextCard(){
  const i=pick(); pad=null; KQ=null;
  if(i==null){cur=null;renderDone();return}
  cur=i; shown=false; renderCard();
}
function renderDone(){
  view="study"; $("#answer").hidden=true; renderCounts();
  $("#view").innerHTML=`<section class="done fade"><p class="big">お疲れ様</p><h2>Félicitations, tu as terminé pour le moment.</h2>${nextDueLine()}<div class="links" style="justify-content:center"><button class="ghost" id="homeBtn">Retour au deck</button><button class="ghost" data-open="stats">Statistiques</button></div></section>`;
  $("#homeBtn").onclick=renderHome;
}
function statusChip(c){
  if(c.q===0) return `<span class="chip c-new">Nouvelle</span>`;
  if(c.q===1) return `<span class="chip c-learn">Apprentissage</span>`;
  if(c.q===3) return `<span class="chip c-learn">Réapprentissage</span>`;
  return `<span class="chip c-rev">Révision</span>`;
}
function renderCard(noAudio){
  if(isK(cur)) return renderKanjiCard(noAudio);
  const c=CARDS[cur], s=st(cur); renderCounts();
  const front=`<div class="word">${furi(esc(c[3]))}</div>${S.cfg.sentenceFront?`<p class="sent">${c[4]}</p>`:`<button class="ghost sm" id="sentHint">Indice : voir la phrase</button>`}`;
  let html=`<article class="card fade" aria-live="polite"><div class="tagline"><span>${statusChip(s)}</span><span class="num">#${cur+1}</span></div>`;
  if(!shown){ html+=front+`</article>`; }
  else{
    html+=`<div class="word">${furi(esc(c[3]))}</div>
      <div class="back"><p class="meaning">${esc(c[2])}</p><p class="pos">${esc(c[11])}</p>
      <div class="sep"></div>
      <p class="sent">${furi(c[6])}</p><p class="trans">${c[5]}</p>
      <div class="audio"><button id="sayW">${playIco()}Mot</button><button id="sayS">${playIco()}Phrase</button></div>
      <div class="extras">
        ${wordKanjiHTML(c)}
        ${S.cfg.showPitch&&c[8]?`<div class="box"><h4>Accent (hauteur)</h4><div class="pitch">${c[8]}</div>${c[9]?`<div style="margin-top:4px">${c[9]}</div>`:""}</div>`:""}
        ${c[7]?`<div class="box"><h4>Note</h4>${c[7]}</div>`:""}
        ${c[10]>=0?`<details class="box"><summary>Grammaire : ${GRAM[c[10]].split("<br>")[0]}</summary><div>${GRAM[c[10]].split("<br>").slice(1).join("<br>")}</div></details>`:""}
      </div></div></article>`;
  }
  $("#view").innerHTML=html; $("#stage").scrollTop=0;
  renderAnswerBar();
  const sh=$("#sentHint"); if(sh) sh.onclick=()=>{ sh.outerHTML=`<p class="sent">${c[4]}</p>`; };
  if(shown){ $("#sayW").onclick=()=>speak([wordSay(c)]); $("#sayS").onclick=()=>speak([plain(c[4])]);
    if(S.cfg.autoplay&&!noAudio) speak([wordSay(c),plain(c[4])]); }
}
const playIco=()=>`<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>`;

/* ----- kanji: tracés (KanjiVG) ----- */
const reduceMotion=()=>{try{return matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){return false}};
function kanjiSVG(k,cls=""){
  const paths=k[9].map(d=>`<path d="${d}"/>`).join("");
  const nums=S.cfg.kNums?k[10].map((p,n)=>`<text x="${p[0]}" y="${p[1]}">${n+1}</text>`).join(""):"";
  return `<svg class="ksvg ${cls}" viewBox="0 0 109 109" role="img" aria-label="Ordre des traits de ${k[0]}"><g class="kg-grid"><path d="M54.5 2v105M2 54.5h105"/></g><g class="kg-ghost">${paths}</g><g class="kg-ink">${paths}</g><g class="kg-num">${nums}</g></svg>`;
}
function animateStrokes(svg){
  if(!svg) return; const ps=[...svg.querySelectorAll(".kg-ink path")], ns=[...svg.querySelectorAll(".kg-num text")];
  if(reduceMotion()){ ps.forEach(p=>{p.style.strokeDasharray="";p.style.strokeDashoffset=""}); ns.forEach(n=>n.style.opacity=1); return; }
  const token=(svg._tok=(svg._tok||0)+1);
  ps.forEach(p=>{const L=p.getTotalLength(); p.style.transition="none"; p.style.strokeDasharray=L+" "+L; p.style.strokeDashoffset=L;});
  ns.forEach(n=>{n.style.transition="none";n.style.opacity=0});
  svg.getBoundingClientRect();
  let delay=150;
  ps.forEach((p,i)=>{const L=p.getTotalLength(), dur=Math.max(280,L*13);
    setTimeout(()=>{ if(svg._tok!==token) return;
      p.style.transition=`stroke-dashoffset ${dur}ms cubic-bezier(.4,0,.6,1)`; p.style.strokeDashoffset=0;
      if(ns[i]){ns[i].style.transition="opacity .2s";ns[i].style.opacity=1} },delay);
    delay+=dur+160; });
}
/* ----- kanji: tablette de dessin ----- */
function makePad(canvas,strokes,opts={}){
  const ctx=canvas.getContext("2d"); let drawing=null;
  const css=()=>getComputedStyle(document.body);
  function size(){const r=canvas.getBoundingClientRect(),dpr=window.devicePixelRatio||1; canvas.width=Math.round(r.width*dpr); canvas.height=Math.round(r.height*dpr); redraw();}
  function guides(){const W=canvas.width,H=canvas.height; ctx.save(); ctx.strokeStyle=css().getPropertyValue("--line").trim()||"#ccc"; ctx.lineWidth=Math.max(1,W/300); ctx.setLineDash([W/40,W/40]);
    ctx.beginPath(); ctx.moveTo(W/2,0); ctx.lineTo(W/2,H); ctx.moveTo(0,H/2); ctx.lineTo(W,H/2); ctx.stroke(); ctx.restore();}
  function line(s){ if(!s.length) return; const W=canvas.width; ctx.lineWidth=W*0.042; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.strokeStyle=css().color;
    ctx.beginPath(); ctx.moveTo(s[0][0]*W,s[0][1]*W);
    if(s.length===1){ctx.lineTo(s[0][0]*W+0.1,s[0][1]*W)}
    for(let i=1;i<s.length;i++){const p=s[i-1],q=s[i]; ctx.quadraticCurveTo(p[0]*W,p[1]*W,(p[0]+q[0])/2*W,(p[1]+q[1])/2*W)}
    const l=s[s.length-1]; ctx.lineTo(l[0]*W,l[1]*W); ctx.stroke(); }
  function redraw(){ctx.clearRect(0,0,canvas.width,canvas.height); guides(); strokes.forEach(line);}
  const pt=e=>{const r=canvas.getBoundingClientRect();return [Math.min(1,Math.max(0,(e.clientX-r.left)/r.width)),Math.min(1,Math.max(0,(e.clientY-r.top)/r.height))]};
  if(!opts.readOnly){
    canvas.addEventListener("pointerdown",e=>{e.preventDefault(); try{canvas.setPointerCapture(e.pointerId)}catch(_){} drawing=[pt(e)]; strokes.push(drawing); redraw(); opts.onChange&&opts.onChange();});
    canvas.addEventListener("pointermove",e=>{ if(!drawing) return; e.preventDefault(); const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e]; for(const ev of evs) drawing.push(pt(ev)); redraw(); });
    const end=()=>{drawing=null}; canvas.addEventListener("pointerup",end); canvas.addEventListener("pointercancel",end);
  }
  size(); return {redraw,size,clear(){strokes.length=0;redraw();opts.onChange&&opts.onChange()},undo(){strokes.pop();redraw();opts.onChange&&opts.onChange()}};
}
function padTools(id){ return `<div class="pad-tools"><button class="ghost sm" data-pad="undo" data-for="${id}">Annuler le trait</button><button class="ghost sm" data-pad="clear" data-for="${id}">Effacer</button></div>`; }
const PADS={};
document.addEventListener("click",e=>{const b=e.target.closest("[data-pad]"); if(!b) return; const p=PADS[b.dataset.for]; if(p) p[b.dataset.pad]();});

function readingsHTML(k){
  return `<div class="readings"><div><span class="rl">ON</span><span class="rv on">${esc(k[2])}</span></div><div><span class="rl">KUN</span><span class="rv">${esc(k[3])}</span></div></div>`;
}
function examplesHTML(k){
  return `<div class="exlist">${k[7].map((e,j)=>`<button class="ex" data-say="${esc(e[1])}"><span class="ex-w">${esc(e[0])}</span><span class="ex-r">${esc(e[1])}</span><span class="ex-m">${esc(e[2])}</span>${playIco()}</button>`).join("")}</div>`;
}
function kanjiInfoHTML(k){
  return `${readingsHTML(k)}
    <div class="extras">
      <div class="box"><h4>Astuce pour retenir</h4>${esc(k[5])}<div class="parts">Éléments : ${esc(k[4])}</div></div>
      ${k[13]?`<div class="box"><h4>Astuce pour la lecture</h4>${esc(k[13])}</div>`:""}
      <div class="box"><h4>Mots à connaître</h4>${examplesHTML(k)}</div>
      ${k[6]?`<div class="box"><h4>Ordre des traits</h4>${esc(k[6])}</div>`:""}
    </div>`;
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-say]"); if(b) speak([b.dataset.say]);});

function renderKanjiCard(noAudio){ return isKW(cur)?renderKanjiWrite(noAudio):renderKanjiRec(noAudio); }
function renderAnswerBar(){
  const a=$("#answer"), inner=$("#answerInner"); a.hidden=false;
  if(!shown){ inner.innerHTML=`<button class="show-btn" id="showBtn">Afficher la réponse</button><div class="kbd">Espace : afficher</div>`; $("#showBtn").onclick=reveal; return; }
  const now=Date.now(), c=st(cur), labels=["À revoir","Difficile","Correct","Facile"];
  inner.innerHTML=`<div class="grades">${[1,2,3,4].map(b=>`<button class="grade g${b}" data-g="${b}"><small class="num">${fmtIvl(next(cur,c,b,now),now)}</small><span>${labels[b-1]}</span></button>`).join("")}</div><div class="kbd">1 À revoir · 2 Difficile · 3 ou Espace Correct · 4 Facile · Z Annuler</div>`;
  inner.querySelectorAll(".grade").forEach(b=>b.onclick=()=>answer(+b.dataset.g));
}
function reveal(){ if(cur==null||shown) return; shown=true; renderCard(); }
function answer(btn){
  if(cur==null||!shown) return;
  const now=Date.now(), t=today(now), prev=st(cur), d=deckOf(cur), cfg=D(d), dd=daily(d), H=S[cfg.hkey];
  undoStack.push({idx:cur,prev:S.cards[cur]?{...S.cards[cur]}:null,dkey:cfg.dkey,daily:{...dd},hkey:cfg.hkey,hist:H[t]?[...H[t]]:null,sinceNew});
  if(undoStack.length>30) undoStack.shift();
  const n=next(cur,prev,btn,now); S.cards[cur]=n;
  const h=H[t]||(H[t]=[0,0,0,0]); h[0]++;
  if(prev.q===0){dd.n++;h[3]++;sinceNew=0} else sinceNew++;
  if(prev.q===2){dd.r++;h[1]++;if(btn>1)h[2]++}
  if(prev.q===2&&btn===1&&n.lapses>=LEECH&&n.lapses%4===0){
    const name=isK(cur)?kOf(cur)[0]:CARDS[cur][0];
    toast(`Carte « ${name} » oubliée ${n.lapses} fois (sangsue) : relis bien l'astuce.`); }
  pruneHist(); changed(cur); hush();
  nextCard();
}
function pruneHist(){const t=today();for(const hk of ["hist","histK"]) for(const d in S[hk]) if(+d<t-60) delete S[hk][d]}
function undo(){
  const u=undoStack.pop(); if(!u){toast("Rien à annuler.");return}
  S.cards[u.idx]=u.prev?{...u.prev,mod:Date.now()}:{...NEW,mod:Date.now()};
  S[u.dkey]=u.daily; const t=today(); if(u.hist) S[u.hkey][t]=u.hist; else delete S[u.hkey][t];
  sinceNew=u.sinceNew; changed(u.idx); deck=deckOf(u.idx); renderBrand(); view="study"; cur=u.idx; shown=false; pad=null; KQ=null; renderCard(); toast("Dernière réponse annulée.");
}
function bury(){ if(cur==null) return; const c={...st(cur),bury:today(),mod:Date.now()}; S.cards[cur]=c; changed(cur); toast("Carte mise de côté jusqu'à demain."); nextCard(); }
function suspend(idx){ const c={...st(idx),susp:st(idx).susp?0:1,mod:Date.now()}; S.cards[idx]=c; changed(idx); return c.susp; }

/* ---------- menu & sheets ---------- */
function openMenu(){
  const m=$("#menu"); if(!m.hidden){m.hidden=true;return}
  const inStudy=view==="study"&&cur!=null;
  m.innerHTML=`<button data-act="home">Accueil</button>
    <button data-act="undo" ${undoStack.length?"":"disabled"}>Annuler la dernière réponse</button>
    <button data-act="bury" ${inStudy?"":"disabled"}>Mettre de côté jusqu'à demain</button>
    <button data-act="susp" ${inStudy?"":"disabled"}>Suspendre (je connais déjà)</button>
    <button data-act="browse">Parcourir les mots</button><button data-act="grid">Les kanji</button>
    <button data-act="stats">Statistiques</button><button data-act="settings">Réglages</button>`;
  m.hidden=false;
}
document.addEventListener("click",e=>{
  const act=e.target.closest("[data-act]"), op=e.target.closest("[data-open]");
  if(act){ $("#menu").hidden=true; const a=act.dataset.act;
    if(a==="home") renderHome();
    else if(a==="undo") undo(); else if(a==="bury") bury();
    else if(a==="susp"){ suspend(cur); toast("Carte suspendue. Tu peux la réactiver dans « Parcourir »."); nextCard(); }
    else openSheet(a); return; }
  if(op){ openSheet(op.dataset.open); return; }
  if(!e.target.closest("#menu")&&!e.target.closest("#menuBtn")) $("#menu").hidden=true;
});
$("#menuBtn").onclick=openMenu; $("#brand").onclick=()=>{ if(CARDS.length){ LES=null; renderHome(); } };

let sheetStack=[];
function openSheet(kind,arg){
  const host=$("#sheet");
  host.innerHTML=`<div class="sheet-back" id="sheetBack"><div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheetTitle"><header><button class="icon-btn" id="backSheet" aria-label="Retour" hidden><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg></button><h2 id="sheetTitle"></h2><button class="icon-btn" id="closeSheet" aria-label="Fermer"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header><div id="sheetBody"></div></div></div>`;
  host.hidden=false;
  const close=()=>{host.hidden=true;host.innerHTML="";sheetStack=[];delete PADS.padPractice;
    if(view==="home") renderHome();
    else if(view==="study"){ if(cur==null||st(cur).susp) nextCard(); else renderCard(true); }
    else if(view==="lesson") renderLesson(); else if(view==="placement") renderPlacement(); };
  $("#closeSheet").onclick=close; $("#sheetBack").onclick=e=>{if(e.target.id==="sheetBack")close()};
  $("#backSheet").onclick=()=>{sheetStack.pop(); const p=sheetStack.pop(); if(p) showSheet(p[0],p[1]);};
  sheetStack=[]; showSheet(kind,arg);
}
function showSheet(kind,arg){
  sheetStack.push([kind,arg]); $("#backSheet").hidden=sheetStack.length<2;
  $(".sheet").scrollTop=0;
  if(kind==="settings") sheetSettings(); else if(kind==="stats") sheetStats(); else if(kind==="grid") sheetGrid();
  else if(kind==="kanji") sheetKanji(arg); else sheetBrowse();
}
function sheetGrid(){
  $("#sheetTitle").textContent=`Les ${KANJI.length} kanji de base`;
  let html=`<p class="tip" style="margin-top:0">Les kanji du JLPT N5, ceux que tu croises le plus dans tes mots. Touche un kanji pour voir son astuce, ses lectures, ses mots et l'ordre des traits.</p>
    <div class="legend num" style="margin:4px 0 12px"><span style="--k:var(--line)">Pas encore rencontré</span><span style="--k:var(--rev)">Déjà vu dans tes mots</span></div>`;
  KGROUPS.forEach((g,gi)=>{
    html+=`<h3 class="kgroup">${esc(g)}</h3><div class="kgrid">`;
    KANJI.forEach((k,i)=>{ if(k[11]!==gi) return; html+=`<button class="ktile ks-${kStatus(i)}" data-k="${i}"><b>${k[0]}</b><small>${esc(k[1].split(" ;")[0])}</small></button>`; });
    html+=`</div>`;
  });
  $("#sheetBody").innerHTML=html;
  $("#sheetBody").onclick=e=>{const b=e.target.closest("[data-k]"); if(b) showSheet("kanji",+b.dataset.k);};
}
function sheetKanji(i){
  const k=KANJI[i];
  $("#sheetTitle").textContent=`${k[0]} · ${k[1]}`;
  $("#sheetBody").innerHTML=`
    <div class="kdetail">
      <div class="svg-wrap">${kanjiSVG(k)}<div class="pad-tools"><button class="ghost sm" id="replay2">Rejouer</button></div></div>
      <div class="kd-side"><div class="kbig sm">${k[0]}</div><p class="pos num">${k[8]} trait${k[8]>1?"s":""}</p></div>
    </div>
    ${kanjiInfoHTML(k)}
    <div class="box practice"><h4>Entraîne-toi à l'écrire</h4>
      <label class="trace"><input type="checkbox" class="switch" id="traceTgl" checked> Modèle en transparence</label>
      ${checkPadHTML("padPractice")}
      <div class="pad-tools"><button class="ghost sm" id="pHint">Indice</button><button class="ghost sm" id="pReset">Recommencer</button></div>
      <p class="tip">Chaque trait est vérifié : position, sens et ordre. Trace d'abord sur le modèle, puis décoche-le et écris de mémoire.</p>
    </div>`;
  const svg=$("#sheetBody .kdetail .ksvg"); animateStrokes(svg); $("#replay2").onclick=()=>animateStrokes(svg);
  const pp=PADS.padPractice=makeCheckPad($("#padPractice"),k,{guide:true,onMsg:padMsgFn("padPractice")});
  $("#traceTgl").onchange=e=>{pp.setGuide(e.target.checked);pp.reset();};
  $("#pHint").onclick=()=>pp.hint(); $("#pReset").onclick=()=>pp.reset();
}
function sheetSettings(){
  $("#sheetTitle").textContent="Réglages"; if(!voice) pickVoice();
  const c=S.cfg;
  $("#sheetBody").innerHTML=`
    <h3 class="set-h">Vocabulaire (Kaishi 1.5k)</h3>
    <div class="row"><label for="newPerDay">Nouvelles cartes par jour<small>Anki : 20 par défaut</small></label><input type="number" id="newPerDay" min="0" max="200" value="${c.newPerDay}"></div>
    <div class="row"><label for="revPerDay">Révisions max par jour<small>Anki : 200 par défaut</small></label><input type="number" id="revPerDay" min="0" max="9999" value="${c.revPerDay}"></div>
    <div class="row"><label for="sentenceFront">Phrase au recto<small>Le contexte aide à deviner le mot. Désactivé : la phrase reste disponible en indice</small></label><input type="checkbox" class="switch" id="sentenceFront" ${c.sentenceFront?"checked":""}></div>
    <div class="row"><label for="showPitch">Afficher l'accent de hauteur<small>Notation des barres hautes / descentes</small></label><input type="checkbox" class="switch" id="showPitch" ${c.showPitch?"checked":""}></div>
    <h3 class="set-h">Kanji</h3>
    <div class="row"><label for="kNums">Numéros des traits<small>Sur l'animation de l'ordre des traits</small></label><input type="checkbox" class="switch" id="kNums" ${c.kNums?"checked":""}></div>
    <h3 class="set-h">Audio</h3>
    <div class="row"><label for="autoplay">Lecture audio automatique<small>Au verso de la carte</small></label><input type="checkbox" class="switch" id="autoplay" ${c.autoplay?"checked":""}></div>
    <div class="row"><label for="rate">Vitesse de la voix<small id="rateVal">${c.rate.toFixed(2).replace(".",",")}×</small></label><input type="range" id="rate" min="0.6" max="1.2" step="0.05" value="${c.rate}"></div>
    <div class="row"><label>Voix japonaise<small>${voice?esc(voice.name):"Aucune voix japonaise trouvée. Sur iPhone : Réglages › Accessibilité › Contenu énoncé › Voix › Japonais."}</small></label><button class="ghost" id="testVoice">Tester</button></div>
    <h3 class="set-h">Progression</h3>
    <div class="row"><label>Sauvegarder ma progression<small>Dans un fichier .json (iCloud, PC…)</small></label><button class="ghost" id="backup">Sauvegarder</button></div>
    <div class="row"><label for="restoreFile">Restaurer une sauvegarde<small>Remplace la progression actuelle</small></label><button class="ghost" id="restoreBtn">Choisir…</button><input type="file" id="restoreFile" accept=".json,application/json" hidden></div>
    <div class="row" style="border:0"><label>Réinitialiser ce deck<small>Efface toutes tes révisions de vocabulaire</small></label><button class="danger" id="reset">Réinitialiser</button></div>`;
  const save=()=>{S.cfgMod=Date.now();changed(null)};
  const num=(id,lo,hi)=>{$("#"+id).onchange=e=>{let v=Math.round(+e.target.value);if(!isFinite(v))v=DEFAULT_CFG[id];v=Math.min(hi,Math.max(lo,v));e.target.value=v;S.cfg[id]=v;save()}};
  num("newPerDay",0,200); num("revPerDay",0,9999);
  for(const id of ["sentenceFront","autoplay","showPitch","kNums"]) $("#"+id).onchange=e=>{S.cfg[id]=e.target.checked;save()};
  $("#rate").oninput=e=>{S.cfg.rate=+e.target.value;$("#rateVal").textContent=S.cfg.rate.toFixed(2).replace(".",",")+"×"}; $("#rate").onchange=save;
  $("#backup").onclick=()=>{
    try{ const blob=new Blob([JSON.stringify({app:"kaishi-fr",...snapshotLocal()})],{type:"application/json"});
      const a=document.createElement("a"); const d=new Date();
      a.href=URL.createObjectURL(blob); a.download=`kaishi-progression-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}.json`;
      document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},2000);
    }catch(e){toast("La sauvegarde n'a pas pu être créée.")} };
  $("#restoreBtn").onclick=()=>$("#restoreFile").click();
  $("#restoreFile").onchange=async e=>{
    const f=e.target.files&&e.target.files[0]; if(!f) return;
    try{ const o=JSON.parse(await f.text()); if(!o||o.v!==1||typeof o.cards!=="object") throw 0;
      S.cards={}; for(const k in o.cards) S.cards[k]=fromArr(o.cards[k]);
      S.daily=o.daily||{day:-1,n:0,r:0}; S.dk=o.dk||{day:-1,n:0,r:0}; S.hist=o.hist||{}; S.histK=o.histK||{};
      S.cfg={...DEFAULT_CFG,...(o.cfg||{})}; S.cfgMod=Date.now();
      undoStack=[]; cur=null; for(const k of chunkIds()) dirty.add(k); changed(null);
      toast("Progression restaurée."); sheetSettings();
    }catch(err){ toast("Ce fichier n'est pas une sauvegarde Kaishi valide."); }
    e.target.value=""; };
  $("#testVoice").onclick=()=>speak(["こんにちは。日本語を勉強しています。"]);
  let armed=null; $("#reset").onclick=e=>{const b=e.currentTarget;
    if(!armed){b.classList.add("armed");b.textContent="Confirmer : tout effacer";armed=setTimeout(()=>{armed=null;b.classList.remove("armed");b.textContent="Réinitialiser"},4000);return}
    clearTimeout(armed); armed=null; const now=Date.now(), cfg=D();
    for(const id of cfg.ids){ if(S.cards[id]){ S.cards[id]={...NEW,mod:now}; dirty.add("k"+Math.floor(id/CHUNK)); } }
    S[cfg.dkey]={day:today(),n:0,r:0}; S[cfg.hkey]={}; undoStack=[]; cur=null; changed(null); b.classList.remove("armed"); b.textContent="Réinitialiser"; toast("Deck réinitialisé.");};
}
function sheetStats(){
  const cfg=D(), H=S[cfg.hkey], K=deck==="kanji";
  $("#sheetTitle").textContent=`Statistiques · ${cfg.name}`;
  const s=stats(), t=today(), h=H[t]||[0,0,0,0];
  let r30=0,p30=0; for(const d in H) if(+d>t-30){r30+=H[d][1];p30+=H[d][2]}
  const fc=[0,0,0,0,0,0,0];
  for(const i of cfg.ids){const c=st(i); if(c.susp||c.q!==2) continue; const k=Math.max(0,c.due-t); if(k<7) fc[k]++;}
  const max=Math.max(1,...fc), dn=["Auj.","Dem."], wd=["dim.","lun.","mar.","mer.","jeu.","ven.","sam."];
  const lab=k=>k<2?dn[k]:wd[new Date(Date.now()+k*DAY).getDay()];
  let streak=0; const any=d=>(S.hist[d]&&S.hist[d][0]>0)||(S.histK[d]&&S.histK[d][0]>0);
  for(let d=t;any(d);d--) streak++;
  let kLearned=0; if(K) for(let i=0;i<KANJI.length;i++){const r=st(KR+i); if(r.q===2&&!r.susp) kLearned++;}
  $("#sheetBody").innerHTML=`
    <div class="stats-grid num">
      <div class="stat"><strong>${h[0]}</strong><small>réponses aujourd'hui</small></div>
      <div class="stat"><strong>${h[3]}</strong><small>nouvelles cartes aujourd'hui</small></div>
      <div class="stat"><strong>${r30?Math.round(p30/r30*100)+" %":"–"}</strong><small>réussite en révision (30 j)</small></div>
      <div class="stat"><strong>${streak}</strong><small>jour${streak>1?"s":""} d'affilée (tous decks)</small></div>
      ${K?`<div class="stat"><strong>${kLearned} / ${KANJI.length}</strong><small>kanji appris en lecture</small></div>`:""}
      <div class="stat"><strong>${s.mature}</strong><small>cartes acquises (≥ 21 j)</small></div>
      <div class="stat"><strong>${s.young+s.learn}</strong><small>récentes / en cours</small></div>
      <div class="stat"><strong>${s.nw}</strong><small>pas encore vues</small></div>
    </div>
    <h4 style="margin:0;font-size:13px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">Révisions prévues (7 jours)</h4>
    <div class="fc num" role="img" aria-label="Révisions prévues sur 7 jours">${fc.map(v=>`<div><b>${v}</b><i style="height:${Math.round(v/max*90)}%"></i></div>`).join("")}</div>
    <div class="fc-l">${fc.map((_,k)=>`<span>${lab(k)}</span>`).join("")}</div>
    <p class="tip">Les nouvelles cartes du jour ne sont pas comptées dans ces prévisions.</p>`;
}
function stLabel(c){ if(c.susp) return ["st-susp","Suspendue"]; if(c.q===0) return ["st-new","Nouvelle"]; if(c.q===1||c.q===3) return ["st-learn","En cours"];
  return [c.ivl>=MATURE?"st-mature":"st-young",(c.ivl>=MATURE?"Acquise":"Récente")+" · "+(c.due<=today()?"à réviser":"dans "+(c.due-today())+" j")]; }
function sheetBrowse(){
  $("#sheetTitle").textContent="Parcourir les mots";
  $("#sheetBody").innerHTML=`<input class="search" id="q" type="search" placeholder="Chercher : 食べる, たべる, manger…" autocomplete="off"><div class="list" id="list"></div><p class="tip" id="more"></p>`;
  const draw=()=>{
    const q=$("#q").value.trim().toLowerCase(); const out=[]; let count=0;
    for(let i=0;i<CARDS.length;i++){const c=CARDS[i]; if(q&&!(c[0].includes(q)||c[1].includes(q)||c[2].toLowerCase().includes(q))) continue; count++; if(out.length<150) out.push(i)}
    $("#list").innerHTML=out.map(i=>{const c=CARDS[i],s=st(i),[cls,l]=stLabel(s);
      return `<div class="li"><div class="w">${esc(c[0])}<small>${esc(c[1])}</small></div><div class="m">${esc(c[2])}</div><div class="s"><span class="${cls}" style="font-size:12px;font-weight:700">${l}</span><button data-s="${i}">${s.susp?"Réactiver":"Suspendre"}</button></div></div>`}).join("")||`<p class="tip">Aucun mot ne correspond.</p>`;
    $("#more").textContent=count>out.length?`${count} résultats, ${out.length} affichés. Affine la recherche pour voir les autres.`:"";
  };
  $("#q").oninput=draw; draw();
  $("#list").onclick=e=>{const b=e.target.closest("[data-s]"); if(!b) return; suspend(+b.dataset.s); draw();};
}
window.addEventListener("resize",()=>{for(const k in PADS){try{PADS[k].size()}catch(e){}}});

