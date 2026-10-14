/* ===================== helpers ===================== */
const ICONS={
 home:'<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
 cases:'<path d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>',
 room:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
 vault:'<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
 people:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-4 3.5-6 6.5-6s6 2 6.5 6M16 5a3.5 3.5 0 010 7M18 14c2 .7 3.5 2.5 3.5 6"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 board:'<circle cx="5" cy="6" r="2.5"/><circle cx="19" cy="7" r="2.5"/><circle cx="12" cy="18" r="2.5"/><path d="M7.5 6.5l9 .5M6.5 8l4 8M17.5 9l-4 7.5"/>',
 cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
 report:'<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>',
 menu:'<path d="M4 7h16M4 12h16M4 17h16"/>',
 x:'<path d="M6 6l12 12M18 6L6 18"/>',
 play:'<path d="M7 4l13 8-13 8z"/>',
 step:'<path d="M5 4l10 8-10 8zM18 4v16"/>',
 prev:'<path d="M19 4L9 12l10 8zM6 4v16"/>',
 reset:'<path d="M4 12a8 8 0 108-8M4 4v5h5"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2h2"/>',
 print:'<path d="M7 9V3h10v6M7 17H5a2 2 0 01-2-2v-5h18v5a2 2 0 01-2 2h-2M7 14h10v7H7z"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 search:'<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
 laptop:'<rect x="5" y="5" width="14" height="10" rx="1.5"/><path d="M2 19h20"/>',
 key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v4M15 12v3"/>',
 file:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 14h7"/>',
 bolt:'<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
 vase:'<path d="M9 3h6M10 3c0 3-4 4-4 9a6 6 0 0012 0c0-5-4-6-4-9M8 21h8"/>',
 flag:'<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>'
};
const IC=n=>'<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(ICONS[n]||'')+'</svg>';
const $=(s,r)=>(r||document).querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtT=t=>{const h=Math.floor(t/100),m=t%100;return (h>=24?'+1d ':'')+pad(h%24,2)+':'+pad(m,2);};
const hueOf=s=>{let h=0;for(const ch of String(s))h=(h*31+ch.charCodeAt(0))%360;return h;};
const sum=(a,f)=>a.reduce((x,y)=>x+f(y),0);
const C=id=>CASES.find(c=>c.id===id);
const cur=()=>C(S.caseId);
const pOf=(c,id)=>c.people.find(p=>p.id===id);
const pname=(c,id)=>{const p=pOf(c,id);return p?p.name:(id||'');};
const evOf=(c,id)=>c.ev.find(e=>e.id===id);
const ruleOf=(c,id)=>(c.rules||[]).find(r=>r.id===id);
function nameOf(c,x){
  const p=pOf(c,x);if(p) return p.name;
  if(/^\d{4}$/.test(x)&&Number(x)<=3400) return fmtT(Number(x));
  return String(x).replace(/_/g,' ');
}
function fill(str,sub,c){return str.replace(/\{(\w+)\}/g,(m,k)=>sub&&sub[k]!==undefined?nameOf(c,sub[k]):m);}
const bd=(kind,label)=>'<span class="bd b-'+String(kind).toLowerCase().replace(/\s+/g,'-')+'">'+esc(label||kind)+'</span>';
const kindBd=k=>({verified:bd('verified','Verified fact'),reported:bd('reported','Reported statement'),derived:bd('derived','Derived fact'),temp:bd('temp','Temporary fact'),hypothesis:bd('hypothesis','Hypothesis'),unknown:bd('unknown','Unknown')}[k]||bd(k));
const basisNote=b=>b==='reported'?' <span class="bd b-reported">uses a reported claim</span>':b==='temp'?' <span class="bd b-temp">uses a temporary fact</span>':'';
const tokens=q=>String(q||'').toLowerCase().split(/\s+/).filter(Boolean);
function hl(text,toks){
  let s=esc(text);
  if(!toks||!toks.length) return s;
  const re=new RegExp('('+toks.map(t=>esc(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|')+')','gi');
  return s.replace(re,'<mark>$1</mark>');
}
function snippet(text,toks,len){
  len=len||110;
  const low=text.toLowerCase();let at=-1;
  for(const t of toks){const i=low.indexOf(t);if(i>=0&&(at<0||i<at)) at=i;}
  if(at<0) at=0;
  const a=Math.max(0,at-35),b=Math.min(text.length,a+len);
  return (a>0?'\u2026':'')+hl(text.slice(a,b),toks)+(b<text.length?'\u2026':'');
}
function copyText(txt){
  const ok=()=>toast('Copied to clipboard');
  const fb=()=>{try{const t=document.createElement('textarea');t.value=txt;t.style.position='fixed';t.style.opacity='0';document.body.appendChild(t);t.select();document.execCommand('copy');document.body.removeChild(t);ok();}catch(e){toast('Copy is not available here');}};
  try{navigator.clipboard.writeText(txt).then(ok,fb);}catch(e){fb();}
}
/* ===================== data prep ===================== */
const BASE={},IDX=[],BLOB={};
function prepCase(c){
  c.F=c.facts.map(([s,ev,k],i)=>({id:'F'+pad(i+1),s,ev,kind:k==='r'?'reported':'verified'}));
  c.F.forEach(f=>f.p=parseTerm(f.s));
  c.people.forEach((p,i)=>p.sid='SUS-'+c.n+'0'+(i+1));
  c.tl.forEach((e,i)=>e.id='TL'+c.n+'-'+pad(i+1,2));
  c.locs=[...new Set(c.ev.flatMap(e=>e.loc).concat(c.tl.map(e=>e.loc).filter(Boolean)))];
  BASE[c.id]=runEngine(c.F,c.rules);
  IDX.push({type:'Case',c:c.id,id:c.id,title:c.id+' '+c.title,text:[c.id,c.title,c.desc,c.brief,c.cat,c.kw.join(' '),c.loc].join(' | ')});
  c.people.forEach(p=>IDX.push({type:'Suspect',c:c.id,id:p.id,title:p.name+' ('+p.role+')',text:[p.name,p.id,p.sid,p.role,p.bg,p.where,p.access].join(' | ')}));
  c.ev.forEach(e=>IDX.push({type:'Evidence',c:c.id,id:e.id,title:e.id+' '+e.title,text:[e.id,e.title,e.desc,e.cat,e.src,e.loc.join(' ')].join(' | ')}));
  c.st.forEach(s=>IDX.push({type:'Statement',c:c.id,id:s.id,title:s.id+' by '+pname(c,s.who),text:[s.id,pname(c,s.who),s.text,s.ctx].join(' | ')}));
  c.tl.forEach(e=>IDX.push({type:'Timeline',c:c.id,id:e.id,title:fmtT(e.t)+' '+e.d,text:[e.d,e.loc,e.ev,e.id,pname(c,e.who),e.conflict||''].join(' | ')}));
  c.F.forEach(f=>IDX.push({type:'Fact',c:c.id,id:f.id,title:f.id+' '+f.s,text:[f.s,f.ev,f.id].join(' | ')}));
  BLOB[c.id]=IDX.filter(r=>r.c===c.id).map(r=>r.text).join(' ').toLowerCase();
}
let CUSTOM_RAW=[];
try{CUSTOM_RAW=JSON.parse(localStorage.getItem('mm-custom-cases')||'[]');if(!Array.isArray(CUSTOM_RAW)) CUSTOM_RAW=[];}catch(e){CUSTOM_RAW=[];}
CUSTOM_RAW.forEach(r=>{try{CASES.push(JSON.parse(JSON.stringify(r)));}catch(e){}});
const saveCustom=()=>{try{localStorage.setItem('mm-custom-cases',JSON.stringify(CUSTOM_RAW));}catch(e){}};
CASES.forEach(prepCase);
/* ===================== state ===================== */
const S={page:'overview',caseId:'CASE-001',tab:'overview',collapsed:innerWidth<900,dashCat:'All',
 cf:{q:'',cat:'All',diff:'All',status:'All',sort:'id',view:'grid'},
 vault:{tab:'evidence',q:'',cat:'All',ver:'All',sort:'id',view:'list'},
 st:{q:'',who:'All',cmp:[]},
 tlf:{q:'',who:'All',loc:'All',from:'All',to:'All',rev:'no'},
 sus:null,drawer:null,confirm:null,toastMsg:null,
 search:{open:false,q:'',mode:'text',type:'All',qk:'present',qloc:'lab',qperson:'',qfrom:'1700',qto:'2100',focus:false},
 board:{q:'',sel:null,hide:{},vb:null,nodes:[]},
 rtab:'case',done:{},justDragged:false,
 activity:[{t:'Session',m:'Local reasoning engine initialised with 5 seeded cases.'},{t:'Engine',m:'Forward chaining reached a fixpoint on all seeded cases.'}],
 lab:{a:'has_key(X, lab)',b:'has_key(amit, lab)',res:null,err:'',facts:['has_key(amit, lab)','present(amit, lab)'],factIn:'',ferr:'',rules:'R1: IF has_key(X, lab) AND present(X, lab) THEN can_access(X, lab)\nR2: IF can_access(X, lab) AND present(X, lab) THEN could_enter(X, lab)',rerr:[],run:null}};
const RSS={},RUNS={};
const RS=(id)=>{id=id||S.caseId;return RSS[id]||(RSS[id]={idx:0,temp:[],selFact:null,selDer:null,view:'all',showSub:true,showRules:false,hlRule:null,q:'',inp:'',err:''});};
function run(c){
  const rs=RS(c.id),key=c.id+'|'+rs.temp.join('~');
  if(!RUNS[key]){
    const base=c.F.concat(rs.temp.map((s,i)=>({id:'T'+pad(i+1),s,kind:'temp',ev:null})));
    RUNS[key]=runEngine(base,c.rules);
  }
  return RUNS[key];
}
const log=(t,m)=>{S.activity.unshift({t,m});if(S.activity.length>12) S.activity.pop();};
const TASKS=['suspects','evidence','statements','timeline','board','reasoning','report'];
function mark(sec){const c=cur();(S.done[c.id]=S.done[c.id]||{})[sec]=true;}
const progress=c=>{const d=S.done[c.id]||{};return TASKS.filter(t=>d[t]).length;};
function currentSec(){
  if(S.page==='room') return S.tab;
  if(S.page==='vault') return S.vault.tab;
  return {suspects:'suspects',timeline:'timeline',board:'board',reasoning:'reasoning',reports:'report'}[S.page]||null;
}
function toast(m){S.toastMsg=m;render();clearTimeout(toast.t);toast.t=setTimeout(()=>{S.toastMsg=null;render();},1700);}
/* ===================== small components ===================== */
function sel(key,opts,val,labels){
  return '<select id="in-'+key+'" data-in="'+key+'">'+opts.map(o=>'<option value="'+esc(o)+'" '+(o===val?'selected':'')+'>'+esc(labels&&labels[o]!==undefined?labels[o]:o)+'</option>').join('')+'</select>';
}
function seg(key,opts,val){return '<div class="seg">'+opts.map(([v,l])=>'<button class="'+(v===val?'on':'')+'" data-act="set" data-k="'+key+'" data-v="'+v+'">'+l+'</button>').join('')+'</div>';}
function chipP(c,id){const p=pOf(c,id);return p?'<span class="chip" data-act="goSus" data-id="'+p.id+'" data-c="'+c.id+'">'+IC('people')+esc(p.name)+'</span>':'';}
function chipE(c,id){const e=evOf(c,id);return e?'<span class="chip mono" data-act="open" data-type="ev" data-c="'+c.id+'" data-id="'+id+'" title="'+esc(e.title)+'">'+id+'</span>':'';}
function chipF(c,id){return '<span class="chip mono" data-act="open" data-type="fact" data-c="'+c.id+'" data-id="'+id+'">'+id+'</span>';}
function avatar(p,cls){const h=hueOf(p.id);return '<div class="'+cls+'" style="background:hsl('+h+' 45% 62%)">'+esc(p.name.split(' ').map(w=>w[0]).filter(x=>/[A-Z]/.test(x)).slice(0,2).join(''))+'</div>';}
function empty(msg,btn){return '<div class="empty"><div style="font-family:var(--type);font-size:18px;color:var(--text)">Nothing here</div><div>'+msg+'</div>'+(btn||'')+'</div>';}
function factRow(f,c){
  const cls={verified:'v',reported:'r',derived:'d',temp:'h'}[f.kind]||'';
  return '<div class="li '+cls+'" data-act="open" data-type="fact" data-c="'+c.id+'" data-id="'+f.id+'"><div class="row"><span class="mono" style="color:var(--amber)">'+f.id+'</span><span class="mono">'+esc(f.s)+'</span><span class="sp"></span>'+kindBd(f.kind)+'</div></div>';
}
function thumb(c){
  return '<div class="thumb" style="background:linear-gradient(135deg,hsl('+c.hue+' 45% 28%),hsl('+((c.hue+40)%360)+' 50% 14%))">'+IC(c.icon)+'<i>illustration</i></div>';
}
function caseCard(c,q){
  const toks=tokens(q);let m='';
  if(toks.length){const r=IDX.find(x=>x.c===c.id&&toks.every(t=>x.text.toLowerCase().includes(t)))||IDX.find(x=>x.c===c.id&&toks.some(t=>x.text.toLowerCase().includes(t)));if(r) m='<div class="muted" style="font-size:12px"><span class="bd">'+r.type+'</span> '+snippet(r.text,toks,100)+'</div>';}
  return '<div class="ccard" data-act="openCase" data-id="'+c.id+'">'+thumb(c)+'<div class="cbody"><div class="row"><span class="mono muted">'+c.id+'</span><span class="sp"></span>'+bd(c.status)+'</div><div class="ctitle">'+hl(c.title,toks)+'</div><div class="muted" style="font-size:13px">'+hl(c.desc,toks)+'</div>'+m+'<div class="cmeta">'+bd('blue',c.cat)+bd(c.diff)+(c.custom?bd('temp','Your case'):'')+'</div><div class="cstat"><span>'+c.people.length+' suspects</span><span>'+c.ev.length+' evidence</span><span>'+BASE[c.id].derived.length+' derived</span></div><button class="btn sm" style="align-self:flex-start" data-act="openCase" data-id="'+c.id+'">Investigate Case</button></div></div>';
}
/* ===================== pages ===================== */
const NAV=[['overview','Overview','home'],['cases','Case Explorer','cases'],['builder','Case Builder','plus'],['room','Investigation Room','room'],['vault','Evidence Vault','vault'],['suspects','Suspect Dossiers','people'],['timeline','Timeline','clock'],['board','Evidence Board','board'],['reasoning','AI Reasoning Lab','cpu'],['reports','Investigation Reports','report'],['about','Settings / About','info']];
function overview(){
  const ev=sum(CASES,c=>c.ev.length),der=sum(CASES,c=>BASE[c.id].derived.length),act=CASES.filter(c=>c.status==='Active').length;
  const cats=['All'].concat([...new Set(CASES.map(c=>c.cat))]);
  const recent=CASES.filter(c=>S.dashCat==='All'||c.cat===S.dashCat);
  const c=cur();
  const tl=c.tl.slice().sort((a,b)=>a.t-b.t).slice(0,5);
  return '<div class="hero"><span class="stamp">CLASSIFIED</span><div class="lbl">MysteryMind &middot; rule-based symbolic AI demonstration</div><h1>Investigation Command Center</h1><p>Review active cases, trace evidence, and examine conclusions supported by the available facts. <i>Every clue has a story. Every conclusion needs a reason.</i></p><div class="row"><button class="btn pri" data-act="openCase" data-id="CASE-001">'+IC('room')+'Open Investigation</button><button class="btn" data-act="demo">'+IC('cpu')+'Run AI Reasoning Demo</button><button class="btn" data-act="openSearch">'+IC('search')+'Search all records</button></div></div>'+
  '<div class="g4 mb">'+[['Total Cases',CASES.length,'Fictional, seeded'],['Active Investigations',act,'Status: Active'],['Evidence Records',ev,'Across all cases'],['Derived Facts',der,'Computed by the engine']].map(s=>'<div class="panel stat"><div class="lbl">'+s[0]+'</div><div class="n">'+s[1]+'</div><div class="muted" style="font-size:12px">'+s[2]+'</div></div>').join('')+'</div>'+
  '<div class="g32"><div style="display:grid;gap:14px;align-content:start"><div class="panel"><h2 class="sh">Recent cases</h2><div class="row mb">'+cats.map(x=>'<span class="chip '+(S.dashCat===x?'sel':'')+'" data-act="set" data-k="dashCat" data-v="'+esc(x)+'">'+esc(x)+'</span>').join('')+'</div><ul class="plain">'+recent.map(x=>'<li class="li" data-act="openCase" data-id="'+x.id+'"><div class="row"><span class="mono" style="color:var(--amber)">'+x.id+'</span><b>'+esc(x.title)+'</b><span class="sp"></span>'+bd(x.status)+bd(x.diff)+'</div></li>').join('')+'</ul></div>'+
  '<div><h2 class="sh">Featured investigations</h2><div class="cards" style="margin-top:12px">'+CASES.slice(0,2).map(x=>caseCard(x,'')).join('')+'</div></div></div>'+
  '<div style="display:grid;gap:14px;align-content:start"><div class="panel"><h2 class="sh">Recent activity</h2><ul class="plain">'+S.activity.slice(0,6).map(a=>'<li class="li"><span class="lbl">'+esc(a.t)+'</span><div>'+esc(a.m)+'</div></li>').join('')+'</ul></div>'+
  '<div class="panel"><h2 class="sh">Reasoning activity</h2><ul class="plain">'+CASES.map(x=>{const r=BASE[x.id];return '<li class="li" data-act="openReason" data-id="'+x.id+'"><div class="row"><span class="mono">'+x.id+'</span><span class="muted">'+x.cat+'</span><span class="sp"></span><span class="mono">'+x.F.length+' &rarr; +'+r.derived.length+'</span></div><div class="muted" style="font-size:12px">'+r.rounds+' rounds, '+r.events.length+' trace steps</div></li>';}).join('')+'</ul></div></div></div>'+
  '<div class="g2 mt"><div class="panel"><h2 class="sh">Timeline preview: '+esc(c.id)+'</h2><div class="tl">'+tl.map(e=>'<div class="tle '+tlCls(e)+'" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+e.id+'"><span class="tt">'+fmtT(e.t)+'</span> '+esc(e.d)+'</div>').join('')+'</div><button class="btn sm" data-act="nav" data-p="timeline">Full timeline</button></div>'+
  '<div class="panel"><h2 class="sh">Quick actions</h2><div class="row"><button class="btn" data-act="openSearch">'+IC('search')+'Search evidence</button><button class="btn" data-act="nav" data-p="reasoning">'+IC('cpu')+'Reasoning lab</button><button class="btn" data-act="nav" data-p="builder">'+IC('plus')+'Create your own case</button><button class="btn" data-act="labOpen">'+IC('cpu')+'Custom unification lab</button><button class="btn" data-act="nav" data-p="reports">'+IC('report')+'Generate report</button><button class="btn" data-act="nav" data-p="board">'+IC('board')+'Evidence board</button></div><p class="muted" style="font-size:12.5px">Numbers on this page are computed from the seeded case data and the local engine. They do not change at random.</p></div></div>';
}
const tlCls=e=>e.type==='gap'?'gap':e.ver==='Reported'?'r':e.ver==='Unknown'?'u':'';
function filteredCases(){
  const f=S.cf,toks=tokens(f.q);
  const order={Easy:0,Medium:1,Hard:2};
  const r=CASES.filter(c=>(f.cat==='All'||c.cat===f.cat)&&(f.diff==='All'||c.diff===f.diff)&&(f.status==='All'||c.status===f.status)&&toks.every(t=>BLOB[c.id].includes(t)));
  r.sort((a,b)=>f.sort==='title'?a.title.localeCompare(b.title):f.sort==='diff'?order[a.diff]-order[b.diff]:f.sort==='evidence'?b.ev.length-a.ev.length:a.id.localeCompare(b.id));
  return r;
}
function casesPage(){
  const f=S.cf,list=filteredCases();
  const cats=['All'].concat([...new Set(CASES.map(c=>c.cat))]);
  return '<div class="ph"><div><h1>Case Explorer</h1><p>Search across titles, descriptions, suspects, evidence, statements, locations and fact labels. This is plain text search, not AI deduction.</p></div></div>'+
  '<div class="panel mb"><div class="row"><input id="in-cf.q" data-in="cf.q" type="search" class="grow" placeholder="Search cases, e.g. rahul, camera, laboratory" value="'+esc(f.q)+'">'+sel('cf.cat',cats,f.cat,{All:'All categories'})+sel('cf.diff',['All','Easy','Medium','Hard'],f.diff,{All:'All difficulty'})+sel('cf.status',['All','Active','Under Review','Unresolved'],f.status,{All:'All status'})+sel('cf.sort',['id','title','diff','evidence'],f.sort,{id:'Sort: Case ID',title:'Sort: Title',diff:'Sort: Difficulty',evidence:'Sort: Evidence count'})+seg('cf.view',[['grid','Grid'],['list','List']],f.view)+'<button class="btn" data-act="clearCF">Clear filters</button></div><div class="muted mt" style="font-size:12.5px;margin-top:10px">'+list.length+' of '+CASES.length+' cases match</div></div>'+
  (list.length?'<div class="cards '+(f.view==='list'?'list':'')+'">'+list.map(c=>caseCard(c,f.q)).join('')+'</div>':empty('No case matches these filters. Try a shorter search term or clear the filters.','<div class="mt"><button class="btn" data-act="clearCF">Clear filters</button></div>'));
}
const ROOM_TABS=[['overview','Overview'],['suspects','Suspects'],['evidence','Evidence'],['statements','Statements'],['timeline','Timeline'],['board','Evidence Board'],['reasoning','AI Reasoning'],['report','Final Report']];
function roomPage(){
  const c=cur(),pr=progress(c),pct=Math.round(pr/TASKS.length*100);
  return '<div class="panel"><div class="row"><span class="mono" style="color:var(--amber)">'+c.id+'</span>'+bd(c.status)+bd(c.diff)+bd('blue',c.cat)+'<span class="sp"></span>'+(c.custom?'<button class="btn sm danger" data-act="deleteCaseAsk" data-id="'+c.id+'">Delete this case</button> ':'')+'<span class="stamp">CASE FILE</span></div><h1 style="font-family:var(--type);font-weight:400;font-size:28px;margin:8px 0">'+esc(c.title)+'</h1><p class="muted" style="max-width:760px;margin:0 0 12px">'+esc(c.brief)+'</p><dl class="kv"><dt>Incident location</dt><dd>'+esc(c.loc)+'</dd><dt>Incident time</dt><dd>'+esc(c.when)+'</dd><dt>Progress</dt><dd><div class="bar" style="margin:6px 0 3px"><div style="width:'+pct+'%"></div></div><span class="muted" style="font-size:12px">'+pr+' of '+TASKS.length+' investigation steps completed (suspects, evidence, statements, timeline, board, reasoning, report)</span></dd></dl></div>'+
  '<div class="tabs">'+ROOM_TABS.map(t=>'<button class="'+(S.tab===t[0]?'on':'')+'" data-act="tab" data-t="'+t[0]+'">'+t[1]+'</button>').join('')+'</div>'+sec(S.tab,c);
}
function sec(name,c){
  switch(name){
    case 'overview':return roomOverview(c);
    case 'suspects':return suspects(c);
    case 'evidence':return evidenceSec(c);
    case 'statements':return statementsSec(c);
    case 'timeline':return timelineSec(c);
    case 'board':return boardSec(c);
    case 'reasoning':return reasoningSec(c);
    case 'report':return reportSec(c);
  }
  return '';
}
function roomOverview(c){
  const R=run(c);
  const vf=R.facts.filter(f=>f.kind==='verified').slice(0,6);
  const top=c.ev.filter(e=>e.rel==='High').slice(0,3);
  return '<div class="g2"><div style="display:grid;gap:14px;align-content:start"><div class="panel"><h2 class="sh">Investigation objective</h2><p style="margin:0">'+esc(c.obj)+'</p><p class="muted" style="margin:10px 0 0">Primary question: <b style="color:var(--text)">'+esc(c.q)+'</b></p></div>'+
  '<div class="panel"><h2 class="sh">Known facts</h2><ul class="plain">'+vf.map(f=>factRow(f,c)).join('')+'</ul><button class="btn sm mt" style="margin-top:10px" data-act="tab" data-t="reasoning">See all '+R.facts.length+' facts in the reasoning lab</button></div>'+
  '<div class="panel"><h2 class="sh">Unresolved questions</h2><ul class="plain">'+c.open.map(q=>'<li class="li u">'+esc(q)+'</li>').join('')+'</ul></div></div>'+
  '<div style="display:grid;gap:14px;align-content:start"><div class="panel"><h2 class="sh">Important evidence</h2><ul class="plain">'+top.map(e=>'<li class="li" data-act="open" data-type="ev" data-c="'+c.id+'" data-id="'+e.id+'"><div class="row"><span class="mono" style="color:var(--amber)">'+e.id+'</span><b>'+esc(e.title)+'</b><span class="sp"></span>'+bd(e.ver)+'</div><div class="muted" style="font-size:12.5px">'+esc(e.desc.slice(0,120))+(e.desc.length>120?'\u2026':'')+'</div></li>').join('')+'</ul></div>'+
  '<div class="panel"><h2 class="sh">Key persons</h2><div class="row">'+c.people.map(p=>chipP(c,p.id)).join('')+'</div></div>'+
  '<div class="panel"><h2 class="sh">Quick actions</h2><div class="row"><button class="btn pri" data-act="tab" data-t="reasoning">'+IC('cpu')+'Run reasoning</button><button class="btn" data-act="tab" data-t="board">'+IC('board')+'Evidence board</button><button class="btn" data-act="tab" data-t="report">'+IC('report')+'Final report</button></div></div></div></div>';
}
/* ---------- suspects ---------- */
function suspects(c){
  mark('suspects');
  if(!S.sus||!pOf(c,S.sus)) S.sus=c.people[0].id;
  const p=pOf(c,S.sus),R=run(c);
  const about=R.facts.filter(f=>termHas(f.p,p.id));
  const ver=about.filter(f=>f.kind==='verified'),rep=about.filter(f=>f.kind==='reported'),der=about.filter(f=>f.kind==='derived'||f.kind==='temp');
  const conf=der.filter(f=>c.conflictPreds.includes(f.p.f)),sup=der.filter(f=>!c.conflictPreds.includes(f.p.f));
  const sts=c.st.filter(s=>s.who===p.id);
  const evs=c.ev.filter(e=>e.who.includes(p.id));
  const evt=c.tl.filter(e=>e.who===p.id);
  const hyp=c.hyp.filter(h=>h.who===p.id);
  const list=(arr,none)=>arr.length?'<ul class="plain">'+arr.join('')+'</ul>':'<div class="muted" style="font-size:12.5px">'+none+'</div>';
  return '<div class="g32" style="grid-template-columns:minmax(220px,1fr) minmax(0,3fr)"><div class="panel" style="align-self:start"><h2 class="sh">People of interest</h2><div style="display:grid;gap:8px">'+c.people.map(x=>'<button class="pcard '+(x.id===p.id?'sel':'')+'" data-act="selSus" data-id="'+x.id+'">'+avatar(x,'mini')+'<span><b>'+esc(x.name)+'</b><br><span class="muted" style="font-size:12px">'+esc(x.role)+'</span></span></button>').join('')+'</div><div class="muted" style="font-size:12px;margin-top:12px">Presence, access or opportunity never equals guilt. Dossiers list facts, claims and unknowns only.</div></div>'+
  '<div style="display:grid;gap:14px;align-content:start"><div class="panel"><div class="row" style="align-items:flex-start;gap:20px">'+(function(){const h=hueOf(p.id);return '<div class="pol"><div style="background:hsl('+h+' 45% 62%)">'+esc(p.name.split(' ').map(w=>w[0]).filter(x=>/[A-Z]/.test(x)).slice(0,2).join(''))+'</div><span>'+p.sid+'</span></div>';})()+'<div class="grow"><h1 style="font-family:var(--type);font-weight:400;font-size:26px;margin:0">'+esc(p.name)+'</h1><div class="muted">'+esc(p.role)+' &middot; <span class="mono">'+p.sid+'</span></div><dl class="kv mt" style="margin-top:12px"><dt>Background</dt><dd>'+esc(p.bg)+'</dd><dt>Recorded whereabouts</dt><dd>'+esc(p.where)+'</dd><dt>Access permissions</dt><dd>'+esc(p.access)+'</dd></dl></div></div></div>'+
  '<div class="g2"><div class="panel"><h3>'+kindBd('verified')+'</h3>'+list(ver.map(f=>factRow(f,c)),'No verified facts mention this person.')+'</div><div class="panel"><h3>'+kindBd('reported')+'</h3>'+list(rep.map(f=>factRow(f,c)).concat(sts.map(s=>'<li class="li r" data-act="open" data-type="st" data-c="'+c.id+'" data-id="'+s.id+'"><span class="mono" style="color:var(--amber)">'+s.id+'</span> &ldquo;'+esc(s.text)+'&rdquo;</li>')),'No reported claims.')+'</div>'+
  '<div class="panel"><h3>Supported observations</h3>'+list(sup.map(f=>factRow(f,c)),'No derived observations yet. Run the reasoning lab.')+'</div><div class="panel"><h3>Conflicting observations</h3>'+list(conf.map(f=>factRow(f,c)).concat(evt.filter(e=>e.conflict).map(e=>'<li class="li u" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+e.id+'"><span class="tt">'+fmtT(e.t)+'</span> '+esc(e.conflict)+'</li>')),'No conflicts encoded for this person.')+'</div>'+
  '<div class="panel"><h3>'+kindBd('hypothesis')+'</h3>'+list(hyp.map(h=>'<li class="li h">'+esc(h.text)+'</li>'),'None recorded.')+'</div><div class="panel"><h3>'+kindBd('unknown')+'</h3>'+list(p.unk.map(u=>'<li class="li u">'+esc(u)+'</li>'),'None.')+'</div></div>'+
  '<div class="panel"><h3>Related evidence</h3><div class="row">'+(evs.length?evs.map(e=>chipE(c,e.id)+' <span class="muted" style="font-size:12.5px">'+esc(e.title)+'</span>').join(''):'<span class="muted">No evidence linked.</span>')+'</div><h3 style="margin-top:14px">Relevant timeline events</h3>'+list(evt.map(e=>'<li class="li" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+e.id+'"><span class="tt">'+fmtT(e.t)+'</span> '+esc(e.d)+' '+bd(e.ver)+'</li>'),'No timeline events.')+'</div></div></div>';
}
/* ---------- evidence ---------- */
const EV_CATS=['All','Physical','Digital Record','Access Log','Witness Statement','Camera Observation','Document','Timeline Record','Environmental'];
const RELORD={High:0,Medium:1,Low:2};
function evidenceList(c){
  const v=S.vault,toks=tokens(v.q);
  let r=c.ev.filter(e=>(v.cat==='All'||e.cat===v.cat)&&(v.ver==='All'||e.ver===v.ver)&&toks.every(t=>(e.id+' '+e.title+' '+e.desc+' '+e.src+' '+e.loc.join(' ')+' '+e.who.map(x=>pname(c,x)).join(' ')).toLowerCase().includes(t)));
  r.sort((a,b)=>v.sort==='time'?a.t-b.t:v.sort==='rel'?RELORD[a.rel]-RELORD[b.rel]:v.sort==='cat'?a.cat.localeCompare(b.cat):a.id.localeCompare(b.id));
  return r;
}
function evidenceSec(c){
  mark('evidence');
  const v=S.vault,list=evidenceList(c),toks=tokens(v.q);
  const card=e=>'<div class="ccard" style="margin-top:0" data-act="open" data-type="ev" data-c="'+c.id+'" data-id="'+e.id+'"><div class="cbody"><div class="row"><span class="mono" style="color:var(--amber)">'+e.id+'</span><span class="sp"></span>'+bd(e.ver)+'</div><div class="ctitle" style="font-size:15px">'+hl(e.title,toks)+'</div><div class="muted" style="font-size:12.5px">'+hl(e.desc,toks)+'</div><div class="cmeta">'+bd('blue',e.cat)+bd(e.rel,e.rel+' reliability')+'</div><div class="muted mono" style="font-size:11.5px">Collected '+fmtT(e.t)+' &middot; '+esc(e.src)+'</div></div></div>';
  return '<div class="panel mb"><div class="row"><input id="in-vault.q" data-in="vault.q" type="search" class="grow" placeholder="Search evidence" value="'+esc(v.q)+'">'+sel('vault.cat',EV_CATS,v.cat,{All:'All categories'})+sel('vault.ver',['All','Verified','Reported','Unverified'],v.ver,{All:'All status'})+sel('vault.sort',['id','time','rel','cat'],v.sort,{id:'Sort: ID',time:'Sort: Collection time',rel:'Sort: Reliability',cat:'Sort: Category'})+seg('vault.view',[['list','List'],['grid','Grid']],v.view)+'</div><div class="muted" style="font-size:12.5px;margin-top:8px">'+list.length+' of '+c.ev.length+' records in '+c.id+'</div></div>'+
  (list.length?(v.view==='grid'?'<div class="cards">'+list.map(card).join('')+'</div>':'<div class="panel p0"><ul class="plain" style="gap:0">'+list.map(e=>'<li class="li" style="border-radius:0;border-width:0 0 1px 0" data-act="open" data-type="ev" data-c="'+c.id+'" data-id="'+e.id+'"><div class="row"><span class="mono" style="color:var(--amber)">'+e.id+'</span><b>'+hl(e.title,toks)+'</b>'+bd('blue',e.cat)+'<span class="sp"></span>'+bd(e.rel,e.rel)+bd(e.ver)+'</div><div class="muted" style="font-size:12.5px">'+hl(e.desc,toks)+'</div></li>').join('')+'</ul></div>'):empty('No evidence matches the search or filters.','<div class="mt"><button class="btn" data-act="clearVault">Clear filters</button></div>'));
}
/* ---------- statements ---------- */
function diffWords(a,b){
  const norm=w=>w.toLowerCase().replace(/[^a-z0-9:]/g,'');
  const A=a.split(/\s+/),B=b.split(/\s+/);
  const sa=new Set(A.map(norm)),sb=new Set(B.map(norm));
  const mk=(arr,other)=>arr.map(w=>other.has(norm(w))||!norm(w)?esc(w):'<mark>'+esc(w)+'</mark>').join(' ');
  return [mk(A,sb),mk(B,sa)];
}
function statementsSec(c){
  mark('statements');
  const f=S.st,toks=tokens(f.q);
  const list=c.st.filter(s=>(f.who==='All'||s.who===f.who)&&toks.every(t=>(s.id+' '+pname(c,s.who)+' '+s.text+' '+s.ctx).toLowerCase().includes(t)));
  const cmp=f.cmp.filter(id=>c.st.some(s=>s.id===id));
  let cmpHTML='';
  if(cmp.length===2){
    const [a,b]=cmp.map(id=>c.st.find(s=>s.id===id));const [da,db]=diffWords(a.text,b.text);
    cmpHTML='<div class="panel mb"><h2 class="sh">Side-by-side comparison</h2><div class="g2"><div><div class="lbl">'+a.id+' &middot; '+esc(pname(c,a.who))+' &middot; stated '+fmtT(a.t)+'</div><p>'+da+'</p></div><div><div class="lbl">'+b.id+' &middot; '+esc(pname(c,b.who))+' &middot; stated '+fmtT(b.t)+'</div><p>'+db+'</p></div></div><div class="muted" style="font-size:12.5px">Highlighted words appear in one statement but not the other. Differences can be innocent wording. Check the related evidence before reading anything into them.</div></div>';
  }else if(cmp.length===1) cmpHTML='<div class="panel mb muted">Select one more statement to compare.</div>';
  return '<div class="panel mb"><div class="row"><input id="in-st.q" data-in="st.q" type="search" class="grow" placeholder="Search statements" value="'+esc(f.q)+'">'+sel('st.who',['All'].concat(c.people.map(p=>p.id)),f.who,Object.assign({All:'All speakers'},Object.fromEntries(c.people.map(p=>[p.id,p.name]))))+'<button class="btn" data-act="clearCmp">Clear comparison</button></div></div>'+cmpHTML+
  (list.length?'<div style="display:grid;gap:10px">'+list.map(s=>'<div class="panel"><div class="row"><span class="mono" style="color:var(--amber)">'+s.id+'</span>'+chipP(c,s.who)+'<span class="muted mono" style="font-size:12px">stated '+fmtT(s.t)+'</span><span class="sp"></span>'+bd('reported','Reported claim')+'<button class="btn sm '+(cmp.includes(s.id)?'on':'')+'" data-act="cmpTog" data-id="'+s.id+'">'+(cmp.includes(s.id)?'Selected':'Compare')+'</button></div><p style="font-size:15px;margin:10px 0 8px;cursor:pointer" data-act="open" data-type="st" data-c="'+c.id+'" data-id="'+s.id+'">&ldquo;'+hl(s.text,toks)+'&rdquo;</p><div class="muted" style="font-size:12.5px">'+esc(s.ctx)+'. Related evidence: </div><div class="row" style="margin-top:6px">'+(s.ev.length?s.ev.map(id=>chipE(c,id)).join(''):'<span class="muted" style="font-size:12.5px">none</span>')+'</div></div>').join('')+'</div>':empty('No statement matches the search.'));
}
/* ---------- timeline ---------- */
function timelineSec(c){
  mark('timeline');
  const f=S.tlf,toks=tokens(f.q);
  const times=[...new Set(c.tl.map(e=>e.t))].sort((a,b)=>a-b);
  const tOpts=['All'].concat(times.map(String));const tLab=Object.fromEntries(times.map(t=>[String(t),fmtT(t)]));tLab.All='Any';
  let list=c.tl.filter(e=>(f.who==='All'||e.who===f.who)&&(f.loc==='All'||e.loc===f.loc)&&(f.from==='All'||e.t>=Number(f.from))&&(f.to==='All'||e.t<=Number(f.to))&&toks.every(t=>(e.d+' '+e.loc+' '+e.ev+' '+e.id+' '+pname(c,e.who)+' '+(e.conflict||'')).toLowerCase().includes(t)));
  list=list.slice().sort((a,b)=>a.t-b.t);
  if(f.rev==='yes') list.reverse();
  return '<div class="panel mb"><div class="row"><input id="in-tlf.q" data-in="tlf.q" type="search" class="grow" placeholder="Search events (try an evidence ID)" value="'+esc(f.q)+'">'+sel('tlf.who',['All'].concat(c.people.map(p=>p.id)),f.who,Object.assign({All:'All people'},Object.fromEntries(c.people.map(p=>[p.id,p.name]))))+sel('tlf.loc',['All'].concat(c.locs),f.loc,{All:'All locations'})+'<span class="muted">From</span>'+sel('tlf.from',tOpts,f.from,tLab)+'<span class="muted">to</span>'+sel('tlf.to',tOpts,f.to,tLab)+seg('tlf.rev',[['no','Chronological'],['yes','Reverse']],f.rev)+'<button class="btn" data-act="clearTL">Clear</button></div><div class="muted" style="font-size:12.5px;margin-top:8px">'+list.length+' of '+c.tl.length+' entries. Red dashed entries mark gaps in the record. Conflict flags appear only where the case data records one.</div></div>'+
  (list.length?'<div class="tl">'+list.map(e=>'<div class="tle '+tlCls(e)+(e.conflict?' cf':'')+'" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+e.id+'"><div class="row"><span class="tt">'+fmtT(e.t)+'</span>'+(e.type==='gap'?bd('unknown','Missing information'):bd(e.ver))+(e.who?'<span class="muted">'+esc(pname(c,e.who))+'</span>':'')+'<span class="muted" style="font-size:12.5px">'+esc(e.loc||'')+'</span><span class="sp"></span><span class="mono muted" style="font-size:11.5px">'+e.ev+'</span></div><div style="margin-top:4px">'+hl(e.d,toks)+'</div>'+(e.conflict?'<div class="flag">'+IC('flag')+esc(e.conflict)+'</div>':'')+'</div>').join('')+'</div>':empty('No timeline entry matches these filters.','<div class="mt"><button class="btn" data-act="clearTL">Clear filters</button></div>'));
}
