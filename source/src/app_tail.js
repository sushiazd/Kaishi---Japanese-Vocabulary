/* ---------- misc ---------- */
let toastT=null; function toast(msg){const t=$("#toast");t.textContent=msg;t.hidden=false;clearTimeout(toastT);toastT=setTimeout(()=>t.hidden=true,3200)}
document.addEventListener("keydown",e=>{
  if(e.target.closest("input,textarea")||!$("#sheet").hidden) return;
  if(e.target.closest("canvas")) return;
  if((e.key===" "||e.key==="Enter")&&e.target.closest("button")) return;
  if(view==="placement"&&PT){ if(PT.answered&&(e.key==="Enter"||e.key===" ")){e.preventDefault(); $("#ptNext")&&$("#ptNext").click();} return; }
  if(view==="lesson"&&LES){ if(LES.phase==="learn"){ if(e.key==="ArrowRight"||e.key==="Enter"||e.key===" "){e.preventDefault();lessonMove(1)} else if(e.key==="ArrowLeft") lessonMove(-1); }
    else if(LES.phase==="quiz"&&LES.answered&&(e.key==="Enter"||e.key===" ")){e.preventDefault(); $("#qNext")&&$("#qNext").click();} return; }
  if(view!=="study"||cur==null){ if(e.key===" "&&view==="home"&&$("#studyBtn")&&!$("#studyBtn").disabled){e.preventDefault();startStudy()} return; }
  if(isKW(cur)){ if(shown&&(e.key===" "||e.key==="Enter")){e.preventDefault(); $("#kPrimary")&&$("#kPrimary").click();} else if(e.key==="z"||e.key==="Z") undo(); return; }
  if(isK(cur)&&!isKW(cur)){ if(KQ&&KQ.id===cur&&KQ.stage==="done"&&(e.key===" "||e.key==="Enter")){e.preventDefault(); $("#kPrimary")&&$("#kPrimary").click();} else if(e.key==="z"||e.key==="Z") undo(); return; }
  if(e.key===" "||e.key==="Enter"){e.preventDefault(); shown?answer(3):reveal()}
  else if(shown&&["1","2","3","4"].includes(e.key)) answer(+e.key);
  else if(e.key==="z"||e.key==="Z") undo();
});
setInterval(()=>{ if(view==="study"&&cur==null) nextCard(); else if(view==="home"||view==="study") renderCounts(); },30000);

/* ---------- boot ---------- */
(async function boot(){
  STORAGE_OK=checkStorage(); loadLocal(); pickVoice();
  try{
    const d=JSON.parse(document.getElementById("deck").textContent); CARDS=d.cards; GRAM=d.grammar;
    const kd=JSON.parse(document.getElementById("kanji").textContent); KANJI=kd.kanji; KGROUPS=kd.groups;
    KV=JSON.parse(document.getElementById("kvocab").textContent);
    VOCAB_IDS=CARDS.map((_,i)=>i); KANJI_IDS=KANJI.map((_,i)=>KR+i).concat(KANJI.map((_,i)=>KW+i));
  }catch(e){ $("#view").innerHTML=`<div class="loading">Le deck n'a pas pu être chargé. Recharge la page.</div>`; return; }
  renderHome();
  connect();
  try{ navigator.storage&&navigator.storage.persist&&navigator.storage.persist(); }catch(e){}
  if("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(()=>{});
})();
