/* ===================== evidence board ===================== */
const TYPE_COL={person:'#D6A85F',statement:'#E58FB0',evidence:'#82A9C8',location:'#6FD1C1',event:'#B39DDB',fact:'#A8B5C2',rule:'#F0845C',derived:'#66C69A'};
const TYPE_LAB={person:'People',statement:'Statements',evidence:'Evidence',location:'Locations',event:'Events',fact:'Logical facts',rule:'Rules',derived:'Derived conclusions'};
const ORDER=['person','statement','evidence','location','event','fact','rule','derived'];
function graph(c){
  const R=run(c),N={},E=[];
  const add=(id,type,label,ref)=>{N[id]={id,type,label,ref};};
  const edge=(a,b,k)=>{if(N[a]&&N[b]&&!E.some(e=>e.a===a&&e.b===b&&e.k===k)) E.push({a,b,k});};
  c.people.forEach(p=>add('p:'+p.id,'person',p.name,p.id));
  c.ev.forEach(e=>add('e:'+e.id,'evidence',e.id+' '+e.title,e.id));
  c.locs.forEach(l=>add('l:'+l,'location',l,l));
  c.st.forEach(s=>add('s:'+s.id,'statement',s.id+' '+pname(c,s.who),s.id));
  c.tl.forEach(e=>{if(e.type!=='gap') add('t:'+e.id,'event',fmtT(e.t)+' '+e.d,e.id);});
  R.facts.forEach(f=>add((f.rule?'d:':'f:')+f.id,f.rule?'derived':'fact',f.id+' '+f.s,f.id));
  c.rules.forEach(r=>add('r:'+r.id,'rule',r.id+' '+r.name,r.id));
  c.ev.forEach(e=>{e.who.forEach(w=>edge('p:'+w,'e:'+e.id,'Associated with evidence'));e.loc.forEach(l=>edge('e:'+e.id,'l:'+l,'Recorded at location'));});
  c.st.forEach(s=>{edge('p:'+s.who,'s:'+s.id,'Mentioned in statement');s.ev.forEach(e=>edge('s:'+s.id,'e:'+e,'Associated with evidence'));});
  c.tl.forEach(e=>{if(e.type==='gap') return;edge('p:'+e.who,'t:'+e.id,'Event involves person');edge('t:'+e.id,'l:'+e.loc,'Recorded at location');edge('t:'+e.id,'e:'+e.ev,'Associated with evidence');});
  R.facts.forEach(f=>{
    if(f.ev) edge((f.rule?'d:':'f:')+f.id,'e:'+f.ev,'Supports fact');
    if(f.rule){
      f.premises.forEach(pid=>{const pf=R.byId[pid];edge((pf.rule?'d:':'f:')+pid,'r:'+f.rule,'Used by rule');});
      edge('r:'+f.rule,'d:'+f.id,'Derived from');
    }
  });
  return {N,E};
}
function boardSec(c){
  mark('board');
  const b=S.board,{N,E}=graph(c);
  const vis=Object.values(N).filter(n=>!b.hide[n.type]);
  const cols=ORDER.filter(t=>!b.hide[t]);
  cols.forEach((t,ci)=>{vis.filter(n=>n.type===t).forEach((n,i)=>{n.x=30+ci*236;n.y=30+i*44;});});
  b.nodes=vis;
  const ids=new Set(vis.map(n=>n.id));
  const edges=E.filter(e=>ids.has(e.a)&&ids.has(e.b)&&N[e.a].x!==N[e.b].x);
  const sel=b.sel&&ids.has(b.sel)?b.sel:null;
  const nb=new Set();if(sel){nb.add(sel);edges.forEach(e=>{if(e.a===sel) nb.add(e.b);if(e.b===sel) nb.add(e.a);});}
  const toks=tokens(b.q);
  const matches=vis.filter(n=>toks.length&&toks.every(t=>n.label.toLowerCase().includes(t)));
  const mset=new Set(matches.map(n=>n.id));
  const vb=b.vb?b.vb.x+' '+b.vb.y+' '+b.vb.w+' '+b.vb.h:'0 0 1600 600';
  const eS=edges.map(e=>{
    let a=N[e.a],z=N[e.b];if(a.x>z.x){const t=a;a=z;z=t;}
    const x1=a.x+200,y1=a.y+15,x2=z.x,y2=z.y+15,mx=(x1+x2)/2;
    const hi=sel&&(e.a===sel||e.b===sel);
    return '<path class="be '+(hi?'hi':sel?'dim':'')+'" d="M'+x1+' '+y1+' C'+mx+' '+y1+' '+mx+' '+y2+' '+x2+' '+y2+'"><title>'+esc(e.k)+'</title></path>';
  }).join('');
  const nS=vis.map(n=>{
    const cls=[n.id===sel?'sel':'',sel&&!nb.has(n.id)?'dim':'',toks.length?(mset.has(n.id)?'hit':'dim'):''].join(' ');
    const lab=n.label.length>29?n.label.slice(0,28)+'\u2026':n.label;
    return '<g class="bn '+cls+'" data-act="bSel" data-id="'+esc(n.id)+'" transform="translate('+n.x+' '+n.y+')"><title>'+esc(TYPE_LAB[n.type]+': '+n.label)+'</title><rect width="200" height="30" rx="5"/><rect width="6" height="30" rx="2" style="fill:'+TYPE_COL[n.type]+';stroke:none"/><text x="14" y="19">'+esc(lab)+'</text></g>';
  }).join('');
  let detail='<div class="muted">Select a node to highlight everything connected to it.</div>';
  if(sel){
    const n=N[sel],conn=edges.filter(e=>e.a===sel||e.b===sel);
    detail='<div class="row"><span class="bd" style="color:'+TYPE_COL[n.type]+'">'+TYPE_LAB[n.type]+'</span><b>'+esc(n.label)+'</b></div><div class="row mt" style="margin-top:10px"><button class="btn sm" data-act="bOpen" data-id="'+esc(sel)+'">Open record</button><button class="btn sm" data-act="bClear">Clear selection</button></div><h3 style="margin-top:12px">'+conn.length+' connections</h3><ul class="plain">'+conn.map(e=>{const o=N[e.a===sel?e.b:e.a];return '<li class="li" data-act="bSel" data-id="'+esc(o.id)+'"><span class="lbl">'+esc(e.k)+'</span><div style="font-size:13px">'+esc(o.label)+'</div></li>';}).join('')+'</ul>';
  }
  return '<div class="panel mb"><div class="row"><input id="in-board.q" data-in="board.q" type="search" class="grow" placeholder="Search nodes" value="'+esc(b.q)+'">'+(toks.length?'<span class="muted" style="font-size:12.5px">'+matches.length+' nodes match</span>':'')+'<button class="btn sm" data-act="bZoom" data-v="in">+</button><button class="btn sm" data-act="bZoom" data-v="out">&minus;</button><button class="btn" data-act="bFit">Fit to screen</button><button class="btn" data-act="bReset">Reset view</button></div><div class="row" style="margin-top:10px">'+ORDER.map(t=>'<span class="chip '+(b.hide[t]?'':'sel')+'" data-act="bType" data-t="'+t+'" style="'+(b.hide[t]?'opacity:.55':'')+'"><span style="width:9px;height:9px;border-radius:2px;background:'+TYPE_COL[t]+'"></span>'+TYPE_LAB[t]+'</span>').join('')+'</div></div>'+
  '<div class="g32" style="grid-template-columns:minmax(0,3fr) minmax(220px,1fr)"><div><div class="bwrap"><svg id="boardsvg" viewBox="'+vb+'" preserveAspectRatio="xMidYMid meet">'+eS+nS+'</svg></div><div class="muted" style="font-size:12px;margin-top:6px">Drag to pan. Scroll to zoom. Every connection comes from the case data or from the engine provenance: evidence links, statement speakers, rule inputs and derivations. Hover a line for its meaning.</div></div><div class="panel" style="align-self:start"><h2 class="sh">Node details</h2>'+detail+'</div></div>';
}
function fitBoard(){
  const svg=$('#boardsvg'),ns=S.board.nodes;
  if(!svg||!ns||!ns.length) return;
  const xs=ns.map(n=>n.x),ys=ns.map(n=>n.y);
  const minx=Math.min(...xs)-20,maxx=Math.max(...xs)+220,miny=Math.min(...ys)-20,maxy=Math.max(...ys)+50;
  const r=svg.getBoundingClientRect(),ar=(r.width||900)/(r.height||560);
  let w=maxx-minx,h=maxy-miny;
  if(w/h>ar){const nh=w/ar;S.board.vb={x:minx,y:miny-(nh-h)/2,w,h:nh};}
  else{const nw=h*ar;S.board.vb={x:minx-(nw-w)/2,y:miny,w:nw,h};}
  const v=S.board.vb;svg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);
}
/* ===================== reasoning ===================== */
const substChips=o=>Object.entries(o||{}).map(([k,v])=>'<span class="sub">'+k+' &rarr; '+esc(v)+'</span>').join(' ');
function evLine(e,isCur,c,showSub){
  let cls='',h='';
  switch(e.k){
    case 'round':cls='hd';h='Round '+e.n+': match every rule against the current fact base';break;
    case 'rule':{const r=ruleOf(c,e.rule);cls='hd';h='Rule '+e.rule+(r?': '+esc(r.name):'');break;}
    case 'cond':h='Condition '+(e.i+1)+'/'+e.total+': <span class="mono">'+esc(e.applied)+'</span>';break;
    case 'cand':cls=e.ok?'ok':'no';h='Try '+e.fact+' <span class="mono">'+esc(e.fs)+'</span> against <span class="mono">'+esc(e.cond)+'</span> &rarr; '+(e.ok?'<b class="okc">UNIFIES</b> '+(showSub?substChips(e.bind):''):'<b class="err">FAILS</b>: '+esc(e.reason));break;
    case 'nocand':cls='no';h='No fact satisfies <span class="mono">'+esc(e.cond)+'</span>. This branch stops here.';break;
    case 'builtin':cls=e.ok?'ok':'no';h='Built-in check <span class="mono">'+esc(e.cond)+'</span>: '+esc(e.text);break;
    case 'derive':cls='dv';h='<b>DERIVED '+e.fact+'</b> <span class="mono">'+esc(e.term)+'</span> from '+e.premises.join(' + ')+' '+(showSub?substChips(e.subst):'');break;
    case 'dup':h='Already known: <span class="mono">'+esc(e.term)+'</span>. Duplicate not added.';break;
    case 'warn':cls='no';h=esc(e.text);break;
    case 'fixpoint':cls='hd';h='Fixpoint reached after '+e.round+' rounds. '+e.total+' facts derived. No rule can add anything new.';break;
  }
  return '<div class="ev '+cls+' '+(isCur?'cur':'')+'">'+h+'</div>';
}
function stepCard(e,c,R){
  if(!e) return '<div class="step muted">Press <b>Next Step</b> or <b>Step Through</b> to watch the engine work one operation at a time, or <b>Run Reasoning</b> to run it to the end.</div>';
  const L=(l,v)=>'<div><div class="lbl">'+l+'</div>'+v+'</div>';
  if(e.k==='cand') return '<div class="step">'+L('Rule condition','<span class="mono">'+esc(e.cond)+'</span>')+L('Candidate fact','<span class="mono">'+e.fact+' '+esc(e.fs)+'</span>')+L('Unification',e.ok?'<span class="okc">SUCCESS</span> '+(Object.keys(e.bind).length?substChips(e.bind):'<span class="muted">no new bindings</span>'):'<span class="err">FAIL: '+esc(e.reason)+'</span>')+'</div>';
  if(e.k==='derive'){const r=R.rules.find(x=>x.id===e.rule);return '<div class="step">'+L('Rule',e.rule+(r?' - '+esc(r.name):''))+L('Facts matched',e.premises.map(id=>chipF(c,id)).join(' ')||'none')+L('Substitution',substChips(e.subst))+L('Conclusion','<span class="mono okc">'+e.fact+' '+esc(e.term)+'</span>')+'</div>';}
  return '<div class="step">'+evLine(e,false,c,true)+'</div>';
}
function explainHTML(f,c,R){
  const rule=R.rules.find(r=>r.id===f.rule);if(!rule) return '';
  const s={};Object.entries(f.subst).forEach(([k,v])=>{s[k]=parseTerm(v);});
  let pi=0;
  const conds=rule.if.map(cs=>{
    const pc=parseTerm(cs),ap=toStr(applyS(pc,s));
    if(BUILTINS.includes(pc.f)) return '<li class="li d"><span class="okc">&#10003;</span> <span class="mono">'+esc(ap)+'</span> <span class="muted">built-in check passed</span></li>';
    const pid=f.premises[pi++];
    return '<li class="li d"><span class="okc">&#10003;</span> <span class="mono">'+esc(ap)+'</span> <span class="muted">matched</span> '+(pid?chipF(c,pid):'')+'</li>';
  }).join('');
  const prem=f.premises.map(id=>R.byId[id]);
  return '<div class="panel" style="background:var(--bg2)"><h3>Why '+f.id+' was derived'+basisNote(f.basis)+'</h3>'+
  '<div class="chain mb"><div class="cn" data-act="rsSelFact" data-id="'+(f.premises[0]||'')+'"><div class="lbl">Initial facts</div>'+f.premises.map(id=>'<div class="mono" style="font-size:12px">'+id+'</div>').join('')+'</div><span class="ar">&rarr;</span><div class="cn"><div class="lbl">Unification</div>'+substChips(f.subst)+'</div><span class="ar">&rarr;</span><div class="cn" data-act="rsShowRule" data-id="'+f.rule+'"><div class="lbl">Rule application</div>'+f.rule+'</div><span class="ar">&rarr;</span><div class="cn" data-act="rsSelDer" data-id="'+f.id+'"><div class="lbl">Derived fact</div><span class="mono" style="font-size:12px">'+esc(f.s)+'</span></div><span class="ar">&rarr;</span><div class="cn"><div class="lbl">Explanation</div>below</div></div>'+
  '<dl class="kv"><dt>Conclusion</dt><dd>'+esc(fill(rule.est,f.subst,c))+'</dd><dt>Rule</dt><dd>'+rule.id+': '+esc(rule.name)+'<div class="muted" style="font-size:12.5px">'+esc(rule.why)+'</div></dd><dt>Facts used</dt><dd>'+prem.map(p=>'<div><span class="mono" style="color:var(--amber)">'+p.id+'</span> <span class="mono">'+esc(p.s)+'</span> '+kindBd(p.kind)+'</div>').join('')+'</dd><dt>Substitution</dt><dd>'+Object.entries(f.subst).map(([k,v])=>'<span class="sub">'+k+' = '+esc(v)+'</span>').join(' ')+'</dd><dt>Conditions</dt><dd><ul class="plain">'+conds+'</ul></dd><dt>Result</dt><dd><span class="mono okc">'+esc(f.s)+'</span></dd><dt>Establishes</dt><dd>'+esc(fill(rule.est,f.subst,c))+'</dd><dt>Does not establish</dt><dd>'+esc(fill(rule.not,f.subst,c))+'</dd></dl></div>';
}
function reasoningSec(c){
  const rs=RS(c.id),R=run(c);
  const topTabs=seg('rtab',[['case','Case reasoning'],['lab','Custom lab']],S.rtab);
  if(S.rtab==='lab') return '<div class="mb">'+topTabs+'</div>'+labHTML();
  const ev=R.events,idx=Math.min(rs.idx,ev.length),shown=ev.slice(0,idx);
  if(idx>0) mark('reasoning');
  const derIds=new Set(shown.filter(e=>e.k==='derive').map(e=>e.fact));
  const toks=tokens(rs.q);
  const facts=R.facts.filter(f=>{
    if(f.kind==='derived'&&!derIds.has(f.id)) return false;
    if(rs.view==='derived'&&f.kind!=='derived') return false;
    return !toks.length||toks.every(t=>(f.id+' '+f.s).toLowerCase().includes(t));
  });
  const sf=rs.selFact&&R.byId[rs.selFact]&&(R.byId[rs.selFact].kind!=='derived'||derIds.has(rs.selFact))?R.byId[rs.selFact]:null;
  const done=idx>=ev.length;
  const sd=rs.selDer&&derIds.has(rs.selDer)?R.byId[rs.selDer]:null;
  const curE=idx>0?ev[idx-1]:null;
  const left='<div class="panel"><h2 class="sh">Knowledge base</h2><input id="in-rs.q" data-in="rs.q" type="search" style="width:100%" placeholder="Search facts" value="'+esc(rs.q)+'"><div class="row mt" style="margin:8px 0">'+seg('rs.view',[['all','Show All Facts'],['derived','Show Derived Facts']],rs.view)+'</div><div class="scroll">'+(facts.length?facts.map(f=>'<div class="li '+({verified:'v',reported:'r',derived:'d',temp:'h'}[f.kind])+' '+(sf&&sf.id===f.id?'sel':'')+'" data-act="rsSelFact" data-id="'+f.id+'"><div class="row"><span class="mono" style="color:var(--amber)">'+f.id+'</span>'+kindBd(f.kind)+'<span class="sp"></span>'+(f.kind==='temp'?'<button class="btn sm danger" data-act="rsDel" data-id="'+f.id+'" title="Remove temporary fact">'+IC('x')+'</button>':'')+'</div><div class="mono">'+hl(f.s,toks)+'</div></div>').join(''):'<div class="muted">No facts to show.</div>')+'</div>'+
  (sf?'<div class="step mt" style="margin-top:10px"><div class="lbl">Source metadata</div><div class="mono">'+sf.id+' '+esc(sf.s)+'</div><div>'+kindBd(sf.kind)+basisNote(sf.basis)+'</div>'+(sf.ev?'<div>Source: '+chipE(c,sf.ev)+' <span class="muted" style="font-size:12.5px">'+esc((evOf(c,sf.ev)||{}).title||'')+'</span></div>':sf.kind==='temp'?'<div class="muted" style="font-size:12.5px">Added by you. Not backed by an evidence record.</div>':'<div class="muted" style="font-size:12.5px">Derived by rule '+sf.rule+' from '+sf.premises.join(', ')+'.</div>')+'</div>':'')+
  '<h3 style="margin-top:14px">Add a temporary fact</h3><div class="row"><input id="in-rs.inp" data-in="rs.inp" type="text" class="grow mono" placeholder="present(rahul, lab)" value="'+esc(rs.inp)+'"><button class="btn" data-act="rsAdd">'+IC('plus')+'Add</button></div>'+(rs.err?'<div class="err">'+esc(rs.err)+'</div>':'')+'<div class="muted" style="font-size:12px;margin-top:6px">Ground facts only: lowercase constants, no variables.'+(rs.temp.length?' <a href="#" data-act="rsResetTemp" style="color:var(--amber)">Remove all '+rs.temp.length+' temporary facts</a>':'')+'</div></div>';
  const rulesBox=rs.showRules?'<div class="panel" style="margin-bottom:12px;background:var(--bg2)"><h3>Rule list</h3><ul class="plain">'+c.rules.map(r=>'<li class="li '+(rs.hlRule===r.id||(curE&&curE.rule===r.id)?'sel':'')+'"><b>'+r.id+': '+esc(r.name)+'</b><div class="mono">IF '+r.if.map(esc).join(' AND ')+'<br>THEN '+esc(r.then)+'</div><div class="muted" style="font-size:12.5px">'+esc(r.why)+'</div></li>').join('')+'</ul></div>':'';
  const center='<div class="panel"><h2 class="sh">Rule execution</h2><div class="row mb"><button class="btn pri" data-act="rsRun">'+IC('play')+'Run Reasoning</button><button class="btn" data-act="rsStep">'+IC('step')+'Step Through</button><button class="btn" data-act="rsPrev" '+(idx<=0?'disabled':'')+'>'+IC('prev')+'Previous</button><button class="btn" data-act="rsNext" '+(done?'disabled':'')+'>'+IC('step')+'Next Step</button><button class="btn" data-act="rsReset">'+IC('reset')+'Reset</button><button class="btn" data-act="rsExample">Try Example</button></div><div class="row mb"><button class="btn sm '+(rs.showSub?'on':'')+'" data-act="tog" data-k="rs.showSub">Show Substitutions</button><button class="btn sm '+(rs.showRules?'on':'')+'" data-act="tog" data-k="rs.showRules">Show Rule List</button><span class="sp"></span><span class="muted mono" style="font-size:12px">step '+idx+' / '+ev.length+'</span></div>'+rulesBox+stepCard(curE,c,R)+'<div class="term" id="trace">'+(shown.length?shown.map((e,i)=>evLine(e,i===idx-1,c,rs.showSub)).join(''):'<span class="muted">The trace appears here. Every line is produced by the local engine: unify(), then rule firing.</span>')+'</div><div class="muted" style="font-size:12px;margin-top:6px">Rule-based symbolic reasoning: structural unification plus forward chaining. No language model is involved.</div></div>';
  const ders=shown.filter(e=>e.k==='derive').map(e=>R.byId[e.fact]);
  const right='<div class="panel"><h2 class="sh">Derived facts</h2><div class="scroll">'+(ders.length?ders.map(f=>'<div class="li d '+(sd&&sd.id===f.id?'sel':'')+'" data-act="rsSelDer" data-id="'+f.id+'"><div class="row"><span class="mono" style="color:var(--blue)">'+f.id+'</span><span class="mono">'+esc(f.s)+'</span></div><div class="muted" style="font-size:12px">Rule '+f.rule+' from '+f.premises.join(' + ')+'</div>'+(rs.showSub?'<div style="margin-top:4px">'+substChips(f.subst)+'</div>':'')+basisNote(f.basis)+'</div>').join(''):'<div class="muted">Nothing derived yet. Step through or run the engine.</div>')+'</div><h3 style="margin-top:14px">Unresolved conditions</h3>'+(done?(R.unresolved.length?'<ul class="plain">'+R.unresolved.map(u=>'<li class="li u"><b>'+u.rule+'</b> '+esc(u.name)+'<div class="muted" style="font-size:12.5px">'+esc(u.why)+'. This rule did not fire.</div></li>').join('')+'</ul>':'<div class="muted" style="font-size:12.5px">Every rule fired at least once. Open case questions are listed in the report.</div>'):'<div class="muted" style="font-size:12.5px">Shown once the run reaches its end.</div>')+(R.errors.length?'<div class="err">'+R.errors.map(esc).join('<br>')+'</div>':'')+'</div>';
  return '<div class="mb">'+topTabs+'</div><div class="rg">'+left+center+right+'</div>'+(sd?'<div class="mt" id="explain">'+explainHTML(sd,c,R)+'</div>':'');
}
/* ===================== custom lab ===================== */
const SAMPLES={A:['has_key(X, lab)','has_key(amit, lab)'],B:['present(X, lab)','present(rahul, lab)'],C:['has_key(X, lab)','present(amit, lab)'],D:['owns(X, X)','owns(amit, rahul)'],E:['located(X, room(Y))','located(amit, room(lab))'],occ:['p(X, f(X))','p(Y, Y)']};
function labUnify(){
  const L=S.lab;L.err='';L.res=null;
  try{
    const a=parseTerm(L.a),b=parseTerm(L.b),trace=[];
    const r=unify(a,b,{},trace);
    L.res={a:toStr(a),b:toStr(b),ok:r.ok,reason:r.reason,sub:r.ok?resolvedSubst(r.s):null,inst:r.ok?toStr(applyS(a,r.s)):null,trace};
    log('Unification',(r.ok?'Unified ':'Failed to unify ')+toStr(a)+' with '+toStr(b)+'.');
  }catch(e){L.err=e.message;}
}
function labRun(){
  const L=S.lab;L.rerr=[];L.run=null;
  const rules=[];
  L.rules.split('\n').forEach((ln,i)=>{
    if(!ln.trim()||ln.trim()[0]==='#') return;
    try{rules.push(parseRuleLine(ln));}catch(e){L.rerr.push('Line '+(i+1)+': '+e.message);}
  });
  if(L.rerr.length) return;
  if(!rules.length){L.rerr.push('Add at least one rule.');return;}
  L.run=runEngine(L.facts.map((s,i)=>({id:'F'+pad(i+1),s,kind:'temp'})),rules);
  L.run.cc={rules:L.run.rules};
  log('Inference','Custom lab: '+L.run.derived.length+' facts derived in '+L.run.rounds+' rounds.');
}
function labHTML(){
  const L=S.lab,r=L.res,R=L.run;
  const dummy={people:[]};
  const tr=r?r.trace.map(t=>'<div class="ev '+(t.kind==='fail'?'no':t.kind==='bind'||t.kind==='done'?'ok':'')+'">'+esc(t.msg)+'</div>').join(''):'';
  const unif='<div class="panel"><h2 class="sh">Unification playground</h2><div class="row mb"><button class="btn sm" data-act="labSample" data-v="A">Successful matching</button><button class="btn sm" data-act="labSample" data-v="C">Failed predicate matching</button><button class="btn sm" data-act="labSample" data-v="D">Repeated-variable failure</button><button class="btn sm" data-act="labSample" data-v="E">Nested terms</button><button class="btn sm" data-act="labSample" data-v="occ">Occurs check</button><button class="btn sm" data-act="labSample" data-v="multi">Multi-step inference</button><button class="btn sm" data-act="labSample" data-v="B">Demo B</button></div>'+
  '<div class="g2"><div><div class="lbl">Term 1</div><input id="in-lab.a" data-in="lab.a" type="text" class="mono" style="width:100%" value="'+esc(L.a)+'"></div><div><div class="lbl">Term 2</div><input id="in-lab.b" data-in="lab.b" type="text" class="mono" style="width:100%" value="'+esc(L.b)+'"></div></div><div class="row mt" style="margin-top:10px"><button class="btn pri" data-act="labUnify">'+IC('play')+'Run unification</button></div>'+
  (L.err?'<div class="err" style="margin-top:8px">'+esc(L.err)+'</div>':'')+
  (r?'<div class="step mt" style="margin-top:12px"><div style="font-family:var(--type);font-size:22px" class="'+(r.ok?'okc':'err')+'">'+(r.ok?'SUCCESS':'FAIL')+'</div>'+(r.ok?'<div><div class="lbl">Substitution</div>'+(Object.keys(r.sub).length?Object.entries(r.sub).map(([k,v])=>'<span class="sub">'+k+' = '+esc(v)+'</span>').join(' '):'<span class="muted">empty (terms are identical)</span>')+'</div><div><div class="lbl">Unified term</div><span class="mono">'+esc(r.inst)+'</span></div>':'<div><div class="lbl">Reason</div>'+esc(r.reason)+'</div>')+'<div class="lbl">Execution trace</div><div class="term" style="max-height:240px">'+tr+'</div></div>':'<div class="muted" style="margin-top:10px;font-size:12.5px">Pick a sample or type two terms, then run unification.</div>')+'</div>';
  const facts='<ul class="plain">'+L.facts.map((f,i)=>'<li class="li"><div class="row"><span class="mono">'+esc(f)+'</span><span class="sp"></span><button class="btn sm danger" data-act="labDelFact" data-i="'+i+'">'+IC('x')+'</button></div></li>').join('')+'</ul>';
  let out='';
  if(R){
    out='<div class="mt" style="margin-top:12px"><h3>Derived facts ('+R.derived.length+', '+R.rounds+' rounds)</h3>'+(R.derived.length?'<ul class="plain">'+R.derived.map(f=>'<li class="li d"><div class="row"><span class="mono" style="color:var(--blue)">'+f.id+'</span><span class="mono">'+esc(f.s)+'</span></div><div class="muted" style="font-size:12px">'+f.rule+' from '+f.premises.join(' + ')+'</div>'+substChips(f.subst)+'</li>').join('')+'</ul>':'<div class="muted">No rule was satisfied by these facts.</div>')+(R.unresolved.length?'<h3 style="margin-top:10px">Unresolved</h3><ul class="plain">'+R.unresolved.map(u=>'<li class="li u"><b>'+u.rule+'</b>: '+esc(u.why)+'</li>').join('')+'</ul>':'')+'<h3 style="margin-top:10px">Trace</h3><div class="term">'+R.events.map(e=>evLine(e,false,dummy,true)).join('')+'</div></div>';
  }
  const inf='<div class="panel"><h2 class="sh">Inference sandbox</h2><h3>Temporary facts</h3>'+(L.facts.length?facts:'<div class="muted">No facts. Add one below.</div>')+'<div class="row" style="margin-top:8px"><input id="in-lab.factIn" data-in="lab.factIn" type="text" class="grow mono" placeholder="present(rahul, lab)" value="'+esc(L.factIn)+'"><button class="btn" data-act="labAddFact">'+IC('plus')+'Add fact</button></div>'+(L.ferr?'<div class="err">'+esc(L.ferr)+'</div>':'')+
  '<h3 style="margin-top:14px">Rules</h3><textarea id="in-lab.rules" data-in="lab.rules" rows="5" spellcheck="false">'+esc(L.rules)+'</textarea>'+(L.rerr.length?'<div class="err">'+L.rerr.map(esc).join('<br>')+'</div>':'')+
  '<div class="row" style="margin-top:10px"><button class="btn pri" data-act="labRun">'+IC('play')+'Run forward chaining</button><button class="btn danger" data-act="labResetAsk">'+IC('reset')+'Reset experiment</button></div>'+out+'</div>';
  const syn='<div class="panel"><h2 class="sh">Term syntax</h2><div class="g3"><div><b>Constants</b><div class="muted">Lowercase or numeric: <span class="mono">amit</span>, <span class="mono">lab</span>, <span class="mono">1930</span></div></div><div><b>Variables</b><div class="muted">Start with a capital: <span class="mono">X</span>, <span class="mono">Y</span>, <span class="mono">T1</span></div></div><div><b>Compound terms</b><div class="muted"><span class="mono">predicate(arg1, arg2)</span>, nesting allowed: <span class="mono">located(X, room(Y))</span></div></div></div><p class="muted" style="margin:10px 0 0;font-size:12.5px">Rules: <span class="mono">R1: IF cond1 AND cond2 THEN conclusion</span>. Built-in checks: <span class="mono">neq(A, B)</span> and <span class="mono">lt(A, B)</span> need ground arguments. Input is parsed into structured terms. Nothing is executed as code.</p></div>';
  return '<div style="display:grid;gap:14px">'+unif+inf+syn+'</div>';
}
/* ===================== report ===================== */
function verdict(c,R){
  const keyD=R.derived.filter(f=>c.keyPreds.includes(f.p.f));
  return {keyD,primary:c.open.length?'Unresolved':(keyD.length?'Supported by encoded facts and rules':'Not supported by available facts'),overall:!R.derived.length?'Not supported by available facts':(keyD.length&&!c.open.length?'Supported by encoded facts and rules':keyD.length?'Partially supported':'Unresolved')};
}
function reportMD(c){
  const R=run(c),rs=RS(c.id),v=verdict(c,R),L=[];
  const ver=R.facts.filter(f=>f.kind==='verified'),rep=R.facts.filter(f=>f.kind==='reported');
  L.push('# MysteryMind Investigation Report: '+c.id,'**'+c.title+'**','','Generated: '+new Date().toLocaleString()+'. Engine: local forward chaining with structural unification (rule-based symbolic AI, not a language model).');
  if(rs.temp.length) L.push('Note: '+rs.temp.length+' temporary fact(s) added by the investigator are included and labelled.');
  L.push('','## 1. Case details','- Category: '+c.cat+', difficulty '+c.diff+', status '+c.status,'- Location: '+c.loc,'- Time: '+c.when,'- Objective: '+c.obj,'','## 2. Incident summary',c.brief);
  L.push('','## 3. Verified facts');ver.forEach(f=>L.push('- `'+f.id+'` `'+f.s+'` (source '+f.ev+')'));
  L.push('','## 4. Reported statements');c.st.forEach(s=>L.push('- '+s.id+' '+pname(c,s.who)+' (stated '+fmtT(s.t)+'): "'+s.text+'"'));rep.forEach(f=>L.push('- Encoded claim `'+f.id+'` `'+f.s+'`'));
  L.push('','## 5. Evidence reviewed');c.ev.forEach(e=>L.push('- '+e.id+' '+e.title+' ('+e.cat+', '+e.ver+', reliability '+e.rel+')'));
  L.push('','## 6. Rules applied');c.rules.forEach(r=>{const n=R.derived.filter(f=>f.rule===r.id).length,i=R.info[r.id];L.push('- '+r.id+' '+r.name+': '+(i&&i.fired?n+' new fact(s)':'did not fire'));});
  L.push('','## 7. Successful unifications');
  const dv=R.events.filter(e=>e.k==='derive');
  if(dv.length) dv.forEach(e=>L.push('- '+e.rule+': '+Object.entries(e.subst).map(([k,x])=>k+' = '+x).join(', ')+' using '+e.premises.join(' + ')+' gives `'+e.term+'`'));else L.push('- None.');
  L.push('','## 8. Derived facts');
  if(R.derived.length) R.derived.forEach(f=>{const r=ruleOf(c,f.rule)||R.rules.find(x=>x.id===f.rule);L.push('- `'+f.id+'` `'+f.s+'` by '+f.rule+' from '+f.premises.join(' + ')+'. '+fill(r.est,f.subst,c)+(f.basis==='reported'?' (depends on a reported claim)':f.basis==='temp'?' (depends on a temporary fact)':''));});else L.push('- None.');
  L.push('','## 9. Unresolved conditions');
  R.unresolved.forEach(u=>L.push('- Rule '+u.rule+' ('+u.name+') did not fire: '+u.why));
  c.open.forEach(q=>L.push('- '+q));
  L.push('','## 10. Conflicting records');
  const cf=c.tl.filter(e=>e.conflict);
  cf.forEach(e=>L.push('- '+fmtT(e.t)+' '+e.d+' Conflict: '+e.conflict));
  R.derived.filter(f=>c.conflictPreds.includes(f.p.f)).forEach(f=>L.push('- Derived `'+f.s+'`'));
  if(!cf.length&&!R.derived.some(f=>c.conflictPreds.includes(f.p.f))) L.push('- None encoded.');
  L.push('','## 11. Alternative explanations');c.hyp.forEach(h=>L.push('- Hypothesis (untested): '+h.text));L.push('- Access, presence or opportunity facts are equally consistent with innocent explanations.');
  L.push('','## 12. Limitations');c.limits.forEach(x=>L.push('- '+x));L.push('- Text search and logical inference are separate. Only derived facts above come from the rule engine.','- Unknown: '+c.unknown.join(' '));
  L.push('','## 13. Conclusion','- Primary question ("'+c.q+'"): **'+v.primary+'**','- Derived conclusions: **Supported by encoded facts and rules** ('+R.derived.length+' facts, each traceable above)','- Rules whose conditions were not met: **Not supported by available facts** ('+(R.unresolved.length?R.unresolved.map(u=>u.rule).join(', '):'none')+')','- Overall investigation status: **'+v.overall+'**','','This report covers a fictional case and a rule-based demonstration. It does not establish real-world guilt. The conclusions above show only what the encoded facts and rules support.');
  return L.join('\n');
}
function mdToHtml(md){
  const out=[];let inList=false;
  const inl=s=>esc(s).replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>');
  md.split('\n').forEach(l=>{
    if(/^- /.test(l)){if(!inList){out.push('<ul>');inList=true;}out.push('<li>'+inl(l.slice(2))+'</li>');return;}
    if(inList){out.push('</ul>');inList=false;}
    if(/^# /.test(l)) out.push('<h1>'+inl(l.slice(2))+'</h1>');
    else if(/^## /.test(l)) out.push('<h2>'+inl(l.slice(3))+'</h2>');
    else if(l.trim()) out.push('<p>'+inl(l)+'</p>');
  });
  if(inList) out.push('</ul>');
  return out.join('');
}
function reportSec(c){
  mark('report');
  return '<div class="row noprint mb"><button class="btn pri" data-act="repCopy">'+IC('copy')+'Copy report</button><button class="btn" data-act="repPrint">'+IC('print')+'Print report</button><span class="muted" style="font-size:12.5px">Built from the current facts, rules and engine run for '+c.id+'. Temporary facts you add are included and labelled.</span></div><div class="md" id="report"><span class="tag">FICTIONAL CASE</span>'+mdToHtml(reportMD(c))+'</div>';
}
/* ===================== drawer / search / confirm ===================== */
function drawerHTML(){
  const d=S.drawer;if(!d) return '';
  const c=C(d.c||S.caseId),R=run(c);let title='',sub='',body='';
  const row=(l,v)=>'<dt>'+l+'</dt><dd>'+v+'</dd>';
  if(d.type==='ev'){
    const e=evOf(c,d.id);if(!e) return '';
    const facts=R.facts.filter(f=>f.ev===e.id),evts=c.tl.filter(t=>t.ev===e.id);
    title=e.title;sub='<span class="mono" style="color:var(--amber)">'+e.id+'</span> '+bd(e.ver)+bd('blue',e.cat);
    body='<dl class="kv">'+row('Description',esc(e.desc))+row('Collected',fmtT(e.t))+row('Source',esc(e.src))+row('Reliability',bd(e.rel,e.rel))+row('Verification',bd(e.ver))+row('Related persons',e.who.length?e.who.map(w=>chipP(c,w)).join(' '):'<span class="muted">none</span>')+row('Related locations',e.loc.map(l=>'<span class="bd">'+esc(l)+'</span>').join(' '))+row('Related events',evts.length?evts.map(t=>'<span class="chip" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+t.id+'"><span class="tt">'+fmtT(t.t)+'</span></span>').join(' '):'<span class="muted">none</span>')+'</dl>'+
    '<div class="row"><button class="btn sm" data-act="dTL" data-id="'+e.id+'">View in Timeline</button><button class="btn sm" data-act="dSus" data-id="'+e.id+'">View Related Suspects</button><button class="btn sm '+(d.facts?'on':'')+'" data-act="dFacts">Show Logical Facts</button><button class="btn sm" data-act="dConn" data-id="'+e.id+'">Show Connections</button></div>'+
    (d.facts?'<div><h3>Associated facts ('+facts.length+')</h3><ul class="plain">'+(facts.length?facts.map(f=>factRow(f,c)).join(''):'<li class="muted">No facts are encoded from this record.</li>')+'</ul></div>':'');
  }else if(d.type==='st'){
    const s=c.st.find(x=>x.id===d.id);if(!s) return '';
    title=s.id+': '+pname(c,s.who);sub=bd('reported','Reported claim');
    body='<p style="font-size:16px;margin:0">&ldquo;'+esc(s.text)+'&rdquo;</p><dl class="kv">'+row('Speaker',chipP(c,s.who))+row('Reported time',fmtT(s.t))+row('Context',esc(s.ctx))+row('Verification',bd(s.ver))+row('Related evidence',s.ev.length?s.ev.map(id=>chipE(c,id)).join(' '):'<span class="muted">none</span>')+'</dl><div class="muted" style="font-size:12.5px">A statement is a reported claim. It is not a verified fact until a record supports it.</div><div class="row"><button class="btn sm" data-act="dStmt" data-id="'+s.id+'">Open in Statements</button><button class="btn sm" data-act="cmpTog" data-id="'+s.id+'">Add to comparison</button></div>';
  }else if(d.type==='tl'){
    const e=c.tl.find(x=>x.id===d.id);if(!e) return '';
    title=fmtT(e.t)+' '+(e.type==='gap'?'Missing information':'Event');sub='<span class="mono muted">'+e.id+'</span> '+bd(e.type==='gap'?'unknown':e.ver,e.type==='gap'?'Missing information':e.ver);
    body='<p style="font-size:16px;margin:0">'+esc(e.d)+'</p><dl class="kv">'+row('Person',e.who?chipP(c,e.who):'<span class="muted">none recorded</span>')+row('Location',esc(e.loc||'unknown'))+row('Related evidence',chipE(c,e.ev))+row('Status',bd(e.ver))+'</dl>'+(e.conflict?'<div class="flag">'+IC('flag')+esc(e.conflict)+'</div>':'')+'<div class="row"><button class="btn sm" data-act="dConn" data-id="'+e.ev+'">Show evidence connections</button></div>';
  }else if(d.type==='fact'){
    const f=R.byId[d.id];if(!f) return '';
    title=f.id+': '+f.s;sub=kindBd(f.kind)+basisNote(f.basis);
    body='<div class="mono" style="font-size:15px">'+esc(f.s)+'</div><dl class="kv">'+row('Fact ID',f.id)+row('Type',kindBd(f.kind))+(f.ev?row('Source evidence',chipE(c,f.ev)):'')+'</dl>'+(f.rule?explainHTML(f,c,R):'')+'<div class="row"><button class="btn sm" data-act="dFactRS" data-id="'+f.id+'">'+IC('cpu')+'Open in reasoning lab</button></div>';
  }else return '';
  return '<div class="scrim" data-act="closeDrawer"></div><aside class="drawer" role="dialog" aria-label="Record details"><div class="dh"><div class="grow"><div class="row">'+sub+'</div><h2 style="font-family:var(--type);font-weight:400;font-size:21px;margin:6px 0 0">'+esc(title)+'</h2></div><button class="btn sm" data-act="closeDrawer" aria-label="Close">'+IC('x')+'</button></div><div class="db">'+body+'</div></aside>';
}
const STYPES=['All','Case','Evidence','Suspect','Statement','Timeline','Fact'];
function quickQuery(c,s){
  const rows=[];let label='';
  const locq=s.qloc.trim().toLowerCase();
  if(s.qk==='present'){
    label='People recorded in a location matching "'+s.qloc+'"';
    const seen={};
    c.F.forEach(f=>{if(f.p.args.length>1&&f.p.args[0].t==='const'&&pOf(c,f.p.args[0].n)&&f.p.args.slice(1).some(a=>a.t==='const'&&a.n.toLowerCase().includes(locq))){(seen[f.p.args[0].n]=seen[f.p.args[0].n]||[]).push(f.id+' '+f.s);}});
    c.tl.forEach(e=>{if(e.who&&e.type!=='gap'&&(e.loc||'').toLowerCase().includes(locq)) (seen[e.who]=seen[e.who]||[]).push(e.id);});
    Object.keys(seen).forEach(id=>rows.push('<button class="hit" data-act="goSus" data-id="'+id+'" data-c="'+c.id+'"><b>'+esc(pname(c,id))+'</b><div class="muted mono" style="font-size:12px">'+esc(seen[id].slice(0,3).join(' | '))+'</div></button>'));
  }else if(s.qk==='key'){
    label='People holding access to "'+s.qloc+'"';
    R_=run(c);
    R_.facts.filter(f=>['has_key','holds_permission','cleared'].includes(f.p.f)&&f.p.args[1]&&f.p.args[1].n&&f.p.args[1].n.toLowerCase().includes(locq)).forEach(f=>rows.push('<button class="hit" data-act="open" data-type="fact" data-c="'+c.id+'" data-id="'+f.id+'"><b>'+esc(nameOf(c,f.p.args[0].n))+'</b> <span class="mono muted">'+f.id+' '+esc(f.s)+'</span> '+kindBd(f.kind)+'</button>'));
  }else if(s.qk==='evidence'){
    const p=pOf(c,s.qperson)||c.people[0];
    label='Evidence associated with '+p.name;
    c.ev.filter(e=>e.who.includes(p.id)).forEach(e=>rows.push('<button class="hit" data-act="open" data-type="ev" data-c="'+c.id+'" data-id="'+e.id+'"><span class="mono" style="color:var(--amber)">'+e.id+'</span> '+esc(e.title)+'</button>'));
    c.st.filter(x=>x.who===p.id).forEach(x=>rows.push('<button class="hit" data-act="open" data-type="st" data-c="'+c.id+'" data-id="'+x.id+'"><span class="mono" style="color:var(--amber)">'+x.id+'</span> statement by '+esc(p.name)+'</button>'));
  }else{
    const a=Number(s.qfrom)||0,b=Number(s.qto)||9999;
    label='Events between '+fmtT(a)+' and '+fmtT(b);
    c.tl.filter(e=>e.t>=a&&e.t<=b).sort((x,y)=>x.t-y.t).forEach(e=>rows.push('<button class="hit" data-act="open" data-type="tl" data-c="'+c.id+'" data-id="'+e.id+'"><span class="tt">'+fmtT(e.t)+'</span> '+esc(e.d)+'</button>'));
  }
  return {label,rows};
}
let R_=null;
function searchModal(){
  const s=S.search;if(!s.open) return '';
  const toks=tokens(s.q),c=cur();
  let body='';
  if(s.mode==='text'){
    if(!toks.length) body='<div class="empty">Type to search cases, evidence, suspects, statements, timeline events and fact labels. Matches are text matches, not AI deductions.</div>';
    else{
      const rs=IDX.filter(r=>(s.type==='All'||r.type===s.type)&&toks.every(t=>(r.text+' '+r.title).toLowerCase().includes(t)));
      if(!rs.length) body=empty('No results for "'+esc(s.q)+'". Try a shorter word or another type filter.');
      else body=STYPES.slice(1).map(t=>{
        const g=rs.filter(r=>r.type===t);if(!g.length) return '';
        return '<div class="sg"><div class="lbl">'+t+' ('+g.length+')</div>'+g.slice(0,6).map(r=>'<button class="hit" data-act="sOpen" data-type="'+r.type+'" data-c="'+r.c+'" data-id="'+r.id+'"><div class="row"><b>'+hl(r.title,toks)+'</b><span class="sp"></span><span class="mono muted" style="font-size:11.5px">'+r.c+'</span></div><div class="muted" style="font-size:12.5px">'+snippet(r.text,toks,130)+'</div></button>').join('')+(g.length>6?'<div class="muted" style="font-size:12px;margin-top:4px">+'+(g.length-6)+' more. Narrow the search or pick a type.</div>':'')+'</div>';
      }).join('');
    }
  }else{
    const q=quickQuery(c,s);
    body='<div class="row mb">'+sel('search.qk',['present','key','evidence','time'],s.qk,{present:'People recorded in a location',key:'People with access to a place',evidence:'Evidence for a person',time:'Events in a time range'})+(s.qk==='present'||s.qk==='key'?'<input id="in-search.qloc" data-in="search.qloc" type="text" placeholder="location or access target" value="'+esc(s.qloc)+'">':s.qk==='evidence'?sel('search.qperson',c.people.map(p=>p.id),s.qperson||c.people[0].id,Object.fromEntries(c.people.map(p=>[p.id,p.name]))):'<input id="in-search.qfrom" data-in="search.qfrom" type="text" style="width:80px" placeholder="1700" value="'+esc(s.qfrom)+'"><span class="muted">to</span><input id="in-search.qto" data-in="search.qto" type="text" style="width:80px" placeholder="2100" value="'+esc(s.qto)+'">')+'</div><div class="lbl">'+esc(q.label)+' in '+c.id+'</div>'+(q.rows.length?q.rows.join(''):empty('No records match this query.'))+'<div class="muted" style="font-size:12px;margin-top:10px">Structured lookup over the case data. This is a filter, not an AI deduction. Time values use hhmm, for example 1830.</div>';
  }
  return '<div class="scrim" data-act="closeSearch"></div><div class="modal" role="dialog" aria-label="Global search"><div style="padding:14px 14px 4px"><div class="row"><div class="gs" style="max-width:none;cursor:text;margin:0">'+IC('search')+'<input id="in-search.q" data-in="search.q" type="search" placeholder="Search everything (try rahul, camera, laboratory)" value="'+esc(s.q)+'" style="flex:1;background:none;border:0;padding:0" '+(s.mode==='text'?'':'disabled')+'></div><button class="btn sm" data-act="clearSearch">Clear</button><button class="btn sm" data-act="closeSearch" aria-label="Close">'+IC('x')+'</button></div><div class="row" style="margin-top:10px">'+seg('search.mode',[['text','Text search'],['quick','Quick queries']],s.mode)+(s.mode==='text'?STYPES.map(t=>'<span class="chip '+(s.type===t?'sel':'')+'" data-act="set" data-k="search.type" data-v="'+t+'">'+t+'</span>').join(''):'')+'</div></div><div class="sr">'+body+'</div></div>';
}
function confirmHTML(){
  const k=S.confirm;if(!k) return '';
  return '<div class="scrim" data-act="confirmNo"></div><div class="modal sm" role="alertdialog"><h2 class="sh" style="margin-bottom:6px">Please confirm</h2><p>'+esc(k.msg)+'</p><div class="row"><button class="btn danger" data-act="confirmYes">'+esc(k.ok)+'</button><button class="btn" data-act="confirmNo">Cancel</button></div></div>';
}
/* ===================== about ===================== */
function aboutPage(){
  return '<div class="ph"><div><h1>Settings / About</h1><p>MysteryMind is a rule-based symbolic AI demonstration. It is not a language model and it does not search the internet.</p></div></div><div class="g2"><div class="panel"><h2 class="sh">What it does</h2><p>Facts and clues are encoded as logical terms. Rules say what follows from them. A forward-chaining engine uses structural unification to match rule conditions against facts, keeps one consistent substitution across all conditions, derives new facts, and records provenance so every conclusion can be explained.</p><p class="muted">All people, places and incidents are fictional. A derived fact shows that encoded conditions were met. It never proves real-world guilt.</p></div>'+
  '<div class="panel"><h2 class="sh">Unification, step by step</h2><ul class="plain"><li class="li">Walk both terms through the current substitution.</li><li class="li">Variable vs term: run the occurs check, then bind.</li><li class="li">Constant vs constant: they must be identical.</li><li class="li">Compound vs compound: same predicate name and arity, then unify arguments left to right, sharing one substitution.</li><li class="li">Any other pairing fails with a stated reason.</li></ul></div>'+
  '<div class="panel"><h2 class="sh">Forward chaining</h2><ul class="plain"><li class="li">Read initial facts and rules.</li><li class="li">For each rule, unify each condition against the facts, threading the substitution through.</li><li class="li">Apply the substitution to the conclusion. Add it only if it is ground and new.</li><li class="li">Repeat until a full round adds nothing (fixpoint).</li></ul></div>'+
  '<div class="panel"><h2 class="sh">System</h2><dl class="kv"><dt>Mode</dt><dd>DEMO MODE</dd><dt>Engine</dt><dd>LOCAL, in this page</dd><dt>Version</dt><dd>v1.0</dd><dt>Cases</dt><dd>'+CASES.length+' fictional cases</dd></dl><div class="row mt" style="margin-top:12px"><button class="btn" data-act="toggleSide">'+IC('menu')+'Collapse or expand sidebar</button><button class="btn danger" data-act="resetAllAsk">'+IC('reset')+'Reset all experiments</button></div></div></div>';
}
/* ===================== shell ===================== */
const PAGE_LABEL={overview:'Overview',cases:'Case Explorer',builder:'Case Builder',room:'Investigation Room',vault:'Evidence Vault',suspects:'Suspect Dossiers',timeline:'Timeline',board:'Evidence Board',reasoning:'AI Reasoning Lab',reports:'Investigation Reports',about:'Settings / About'};
function pageHTML(){
  const c=cur();
  const head=(t,s)=>'<div class="ph"><div><h1>'+t+'</h1><p>'+s+'</p></div><span class="sp"></span><span class="mono muted">'+c.id+'</span></div>';
  switch(S.page){
    case 'overview':return overview();
    case 'cases':return casesPage();
    case 'builder':return builderPage();
    case 'room':return roomPage();
    case 'vault':return head('Evidence Vault','Searchable evidence and witness statements for '+esc(c.title)+'.')+'<div class="mb">'+seg('vault.tab',[['evidence','Evidence'],['statements','Statements']],S.vault.tab)+'</div>'+(S.vault.tab==='evidence'?evidenceSec(c):statementsSec(c));
    case 'suspects':return head('Suspect Dossiers','People of interest: verified facts, reported claims, derived facts, hypotheses and unknowns.')+suspects(c);
    case 'timeline':return head('Timeline','Events in order, with conflicts and missing information shown where the record supports them.')+timelineSec(c);
    case 'board':return head('Evidence Board','Connections between people, evidence, locations, statements, events, facts, rules and derived conclusions.')+boardSec(c);
    case 'reasoning':return head('AI Reasoning Lab','Run unification and forward chaining on this case, or experiment in the custom lab.')+reasoningSec(c);
    case 'reports':return head('Investigation Reports','A report generated from the current facts, rules and engine run.')+reportSec(c);
    case 'about':return aboutPage();
  }
  return '';
}
function shell(){
  const c=cur();
  const nav=NAV.map(([id,l,ic])=>'<button class="'+(S.page===id?'on':'')+'" data-act="nav" data-p="'+id+'" title="'+l+'">'+IC(ic)+'<span>'+l+'</span></button>').join('');
  return '<div class="app"><aside class="side '+(S.collapsed?'col':'')+'"><div class="logo"><div class="logo-mark">'+IC('room')+'</div><div><div class="logo-t">MysteryMind</div><div class="logo-s">AI Logic Detective</div></div></div><nav class="nav">'+nav+'</nav><div class="sfoot"><div><span class="dot"></span><b>DEMO MODE</b></div><div>Reasoning engine: <b>LOCAL</b></div><div>Case: <b class="mono">'+c.id+'</b></div><div>Version v1.0</div></div></aside>'+
  '<div class="main"><header class="top"><button class="btn sm" data-act="toggleSide" aria-label="Toggle sidebar">'+IC('menu')+'</button><div class="crumb">MysteryMind / <b>'+PAGE_LABEL[S.page]+'</b>'+(['overview','cases','about','builder'].includes(S.page)?'':' / '+c.id)+'</div><button class="gs" data-act="openSearch">'+IC('search')+'<span class="t">Search cases, evidence, suspects, statements</span><span class="kbd">Ctrl K</span></button>'+sel('caseId',CASES.map(x=>x.id),S.caseId,Object.fromEntries(CASES.map(x=>[x.id,x.id+': '+x.title])))+'<div class="avatar" title="Inspector Nova (fictional investigator)">IN</div></header><main class="content" id="content">'+pageHTML()+'</main></div></div>'+
  drawerHTML()+searchModal()+confirmHTML()+(S.toastMsg?'<div class="toast" role="status">'+esc(S.toastMsg)+'</div>':'');
}
function render(reset){
  const act=document.activeElement,fid=act&&act.id,ss=act&&act.selectionStart,se=act&&act.selectionEnd;
  const st=window.pageYOffset||0;
  const root=$('#app');
  root.innerHTML=shell();
  if(window.scrollTo) window.scrollTo(0,reset?0:st);
  if(fid){const e=document.getElementById(fid);if(e){e.focus();try{if(ss!=null) e.setSelectionRange(ss,se);}catch(_){}}}
  if(S.search.open&&S.search.focus){const e=document.getElementById('in-search.q');if(e) e.focus();S.search.focus=false;}
  if($('#boardsvg')&&!S.board.vb) fitBoard();
  const tr=$('#trace');
  if(tr){const cu=tr.querySelector('.ev.cur');if(cu) tr.scrollTop=Math.max(0,cu.offsetTop-tr.clientHeight/2);}
}
/* ===================== actions ===================== */
function go(page,reset){S.page=page;S.drawer=null;render(reset!==false);}
function caseChanged(){
  S.sus=null;S.board.sel=null;S.board.vb=null;S.board.q='';S.drawer=null;S.st.cmp=[];S.st.who='All';
  S.tlf.who='All';S.tlf.loc='All';S.tlf.from='All';S.tlf.to='All';S.tlf.q='';S.vault.q='';
}
function setKey(key,val){
  const p=key.split('.');
  if(p.length===1){S[key]=val;if(key==='caseId') caseChanged();return;}
  const t=p[0]==='rs'?RS():S[p[0]];
  t[p[1]]=val;
  if(p[0]==='search'&&p[1]==='mode') S.search.focus=true;
}
function resetAll(){
  Object.keys(RSS).forEach(k=>delete RSS[k]);
  S.lab.facts=['has_key(amit, lab)','present(amit, lab)'];S.lab.rules='R1: IF has_key(X, lab) AND present(X, lab) THEN can_access(X, lab)\nR2: IF can_access(X, lab) AND present(X, lab) THEN could_enter(X, lab)';S.lab.run=null;S.lab.res=null;S.lab.rerr=[];S.lab.ferr='';
  S.done={};caseChanged();log('Reset','All experiments and progress were reset.');
}
function tryExample(c){
  const rs=RS(c.id),R=run(c),i=R.events.findIndex(e=>e.k==='derive');
  rs.idx=i<0?R.events.length:i+1;rs.selDer=i<0?null:R.events[i].fact;rs.showSub=true;
  log('Reasoning','Example run on '+c.id+': first derivation at step '+rs.idx+'.');
}
function openRecord(type,cid,id){
  if(type==='Case'){S.caseId=cid;caseChanged();S.page='room';S.tab='overview';}
  else if(type==='Suspect'){S.caseId=cid;caseChanged();S.sus=id;S.page='suspects';}
  else if(type==='Evidence'){S.caseId=cid;caseChanged();S.page='vault';S.vault.tab='evidence';S.drawer={type:'ev',c:cid,id,facts:false};}
  else if(type==='Statement'){S.caseId=cid;caseChanged();S.page='vault';S.vault.tab='statements';S.drawer={type:'st',c:cid,id};}
  else if(type==='Timeline'){S.caseId=cid;caseChanged();S.page='timeline';S.drawer={type:'tl',c:cid,id};}
  else if(type==='Fact'){S.caseId=cid;caseChanged();S.page='reasoning';S.rtab='case';const rs=RS(cid);rs.selFact=id;S.drawer={type:'fact',c:cid,id};}
}
const DTYPE={ev:'Evidence',st:'Statement',tl:'Timeline',fact:'Fact'};
function handle(act,d,el,e){
  const c=cur(),rs=RS();
  switch(act){
    case 'nav':if(d.p==='reasoning'&&S.page!=='reasoning') S.rtab='case';go(d.p);return;
    case 'toggleSide':S.collapsed=!S.collapsed;break;
    case 'openCase':S.caseId=d.id;caseChanged();S.page='room';S.tab='overview';log('Case','Opened '+d.id+'.');render(true);return;
    case 'openReason':S.caseId=d.id;caseChanged();S.page='reasoning';S.rtab='case';render(true);return;
    case 'demo':S.caseId='CASE-001';caseChanged();S.page='reasoning';S.rtab='case';tryExample(C('CASE-001'));render(true);return;
    case 'labOpen':S.page='reasoning';S.rtab='lab';render(true);return;
    case 'tab':S.tab=d.t;render(true);return;
    case 'set':setKey(d.k,d.v);if(d.k==='rtab'&&d.v==='lab') S.rtab='lab';break;
    case 'tog':{const p=d.k.split('.');const t=p[0]==='rs'?rs:S[p[0]];t[p[1]]=!t[p[1]];break;}
    case 'clearCF':S.cf=Object.assign(S.cf,{q:'',cat:'All',diff:'All',status:'All',sort:'id'});break;
    case 'clearVault':Object.assign(S.vault,{q:'',cat:'All',ver:'All',sort:'id'});break;
    case 'clearTL':Object.assign(S.tlf,{q:'',who:'All',loc:'All',from:'All',to:'All',rev:'no'});break;
    case 'clearCmp':S.st.cmp=[];break;
    case 'cmpTog':{const a=S.st.cmp,i=a.indexOf(d.id);if(i>=0) a.splice(i,1);else{a.push(d.id);if(a.length>2) a.shift();}if(S.drawer&&S.drawer.type==='st'){S.drawer=null;S.page='vault';S.vault.tab='statements';}break;}
    case 'selSus':S.sus=d.id;break;
    case 'goSus':S.caseId=d.c||S.caseId;if(d.c&&d.c!==S.caseId) caseChanged();S.sus=d.id;S.search.open=false;S.drawer=null;S.page='suspects';render(true);return;
    case 'open':S.drawer={type:d.type,c:d.c||S.caseId,id:d.id,facts:false};break;
    case 'closeDrawer':S.drawer=null;break;
    case 'dFacts':S.drawer.facts=!S.drawer.facts;break;
    case 'dTL':S.tlf.q=d.id;S.drawer=null;S.page='timeline';render(true);return;
    case 'dSus':{const ev=evOf(c,d.id);S.drawer=null;if(ev&&ev.who.length){S.sus=ev.who[0];S.page='suspects';}else toast('No persons are linked to this record');render(true);return;}
    case 'dConn':S.drawer=null;S.board.q='';S.board.sel='e:'+d.id;S.board.vb=null;S.page='board';render(true);return;
    case 'dStmt':S.drawer=null;S.page='vault';S.vault.tab='statements';S.st.q=d.id;render(true);return;
    case 'dFactRS':{S.drawer=null;S.page='reasoning';S.rtab='case';rs.selFact=d.id;render(true);return;}
    case 'openSearch':S.search.open=true;S.search.focus=true;break;
    case 'closeSearch':S.search.open=false;break;
    case 'clearSearch':S.search.q='';S.search.focus=true;break;
    case 'sOpen':S.search.open=false;openRecord(d.type,d.c,d.id);render(true);return;
    case 'bSel':S.board.sel=d.id;break;
    case 'bClear':S.board.sel=null;break;
    case 'bType':S.board.hide[d.t]=!S.board.hide[d.t];S.board.vb=null;break;
    case 'bFit':S.board.vb=null;break;
    case 'bReset':S.board.vb=null;S.board.sel=null;S.board.q='';S.board.hide={};break;
    case 'bZoom':{const v=S.board.vb;if(v){const f=d.v==='in'?1/1.25:1.25,cx=v.x+v.w/2,cy=v.y+v.h/2;v.w*=f;v.h*=f;v.x=cx-v.w/2;v.y=cy-v.h/2;const svg=$('#boardsvg');if(svg) svg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);}return;}
    case 'bOpen':{
      const k=d.id[0],ref=d.id.slice(2);
      if(k==='p'){S.sus=ref;S.page='suspects';}
      else if(k==='e') S.drawer={type:'ev',c:c.id,id:ref,facts:false};
      else if(k==='s') S.drawer={type:'st',c:c.id,id:ref};
      else if(k==='t') S.drawer={type:'tl',c:c.id,id:ref};
      else if(k==='f'||k==='d') S.drawer={type:'fact',c:c.id,id:ref};
      else if(k==='r'){S.page='reasoning';S.rtab='case';rs.showRules=true;rs.hlRule=ref;}
      else if(k==='l'){S.tlf.loc=ref;S.page='timeline';}
      render(true);return;}
    case 'rsRun':rs.idx=run(c).events.length;{const R=run(c),dv=R.derived;if(dv.length&&!rs.selDer) rs.selDer=dv[0].id;}log('Reasoning','Ran forward chaining on '+c.id+': '+run(c).derived.length+' facts derived.');break;
    case 'rsStep':rs.idx=rs.idx>=run(c).events.length||rs.idx===0?1:rs.idx+1;break;
    case 'rsNext':rs.idx=Math.min(rs.idx+1,run(c).events.length);break;
    case 'rsPrev':rs.idx=Math.max(0,rs.idx-1);break;
    case 'rsReset':rs.idx=0;rs.selDer=null;rs.selFact=null;break;
    case 'rsExample':tryExample(c);break;
    case 'rsSelFact':if(d.id){rs.selFact=d.id;const f=run(c).byId[d.id];if(f&&f.kind==='derived') rs.selDer=d.id;}break;
    case 'rsSelDer':rs.selDer=d.id;rs.selFact=d.id;break;
    case 'rsShowRule':rs.showRules=true;rs.hlRule=d.id;break;
    case 'rsAdd':{
      rs.err='';
      try{
        const t=parseTerm(rs.inp.trim());
        if(t.t!=='cmp') throw new Error('A fact must be a predicate such as present(amit, lab).');
        if(hasVar(t)) throw new Error('Facts must be ground. Replace the variables ('+termVars(t).join(', ')+') with constants.');
        const k=toStr(t);
        if(run(c).facts.some(f=>toStr(f.p)===k)) throw new Error(k+' is already in the knowledge base.');
        rs.temp.push(k);rs.inp='';rs.idx=0;rs.selDer=null;log('Reasoning','Added temporary fact '+k+' to '+c.id+'.');
      }catch(err){rs.err=err.message;}
      break;}
    case 'rsDel':{const i=Number(d.id.slice(1))-1;if(rs.temp[i]!==undefined){log('Reasoning','Removed temporary fact '+rs.temp[i]+'.');rs.temp.splice(i,1);rs.idx=0;rs.selDer=null;rs.selFact=null;}break;}
    case 'rsResetTemp':if(e) e.preventDefault();S.confirm={msg:'Remove all '+rs.temp.length+' temporary facts from '+c.id+'? The seeded facts stay.',ok:'Remove them',act:'rsClearTemp'};break;
    case 'labUnify':labUnify();break;
    case 'labSample':
      if(d.v==='multi'){S.lab.facts=['has_key(amit, lab)','present(amit, lab)'];S.lab.rules='R1: IF has_key(X, lab) AND present(X, lab) THEN can_access(X, lab)\nR2: IF can_access(X, lab) AND present(X, lab) THEN could_enter(X, lab)';S.lab.ferr='';labRun();}
      else{S.lab.a=SAMPLES[d.v][0];S.lab.b=SAMPLES[d.v][1];labUnify();}
      break;
    case 'labAddFact':{
      S.lab.ferr='';
      try{
        const t=parseTerm(S.lab.factIn.trim());
        if(t.t!=='cmp') throw new Error('A fact must be a predicate such as present(amit, lab).');
        if(hasVar(t)) throw new Error('Facts must be ground (no variables).');
        const k=toStr(t);if(S.lab.facts.includes(k)) throw new Error('That fact is already in the list.');
        S.lab.facts.push(k);S.lab.factIn='';S.lab.run=null;
      }catch(err){S.lab.ferr=err.message;}
      break;}
    case 'labDelFact':S.lab.facts.splice(Number(d.i),1);S.lab.run=null;break;
    case 'labRun':labRun();break;
    case 'labResetAsk':S.confirm={msg:'Reset the custom lab? Your facts, rules and results will return to the starting example.',ok:'Reset experiment',act:'labReset'};break;
    case 'resetAllAsk':S.confirm={msg:'Reset all temporary facts, reasoning progress and lab experiments?',ok:'Reset all',act:'resetAll'};break;
    case 'confirmNo':S.confirm=null;break;
    case 'confirmYes':{
      const a=S.confirm.act;S.confirm_id=S.confirm.id;S.confirm=null;
      if(a==='rsClearTemp'){rs.temp=[];rs.idx=0;rs.selDer=null;rs.selFact=null;log('Reasoning','Cleared temporary facts on '+c.id+'.');}
      else if(a==='labReset'){S.lab.facts=['has_key(amit, lab)','present(amit, lab)'];S.lab.rules='R1: IF has_key(X, lab) AND present(X, lab) THEN can_access(X, lab)\nR2: IF can_access(X, lab) AND present(X, lab) THEN could_enter(X, lab)';S.lab.run=null;S.lab.res=null;S.lab.err='';S.lab.rerr=[];S.lab.ferr='';S.lab.a='has_key(X, lab)';S.lab.b='has_key(amit, lab)';}
      else if(a==='resetAll') resetAll();
      else if(a==='draftClear') S.draft=newDraft();
      else if(a==='deleteCase'){deleteCase(S.confirm_id);}
      render();toast('Reset complete');return;}
    case 'dAddPerson':case 'dDelPerson':case 'dEvWho':case 'dAddEv':case 'dDelEv':case 'dAddFact':case 'dDelFact':case 'dAddSt':case 'dDelSt':case 'dAddTl':case 'dDelTl':draftAct(act,d);break;
    case 'dExample':loadExample();toast('Example loaded. Review it, then create the case.');return;
    case 'dClearAsk':S.confirm={msg:'Clear everything you typed in the Case Builder form?',ok:'Clear form',act:'draftClear'};break;
    case 'dCreate':if(createCase()){render(true);toast('Case created');return;}render();return;
    case 'deleteCaseAsk':S.confirm={msg:'Delete this case? Your entered facts, rules and evidence for it will be removed.',ok:'Delete case',act:'deleteCase',id:d.id};break;
    case 'repCopy':copyText(reportMD(c));return;
    case 'repPrint':try{window.print();}catch(_){toast('Printing is not available here. Use Copy report.');}return;
  }
  render();
}
/* ===================== case builder ===================== */
function newDraft(){return {title:'',cat:'Theft',diff:'Medium',loc:'',when:'',desc:'',brief:'',obj:'',q:'',people:[],ev:[],facts:[],st:[],tl:[],rules:'',open:'',keyp:'',confp:'',evN:0,
  pName:'',pRole:'',pBg:'',pWhere:'',pAccess:'',
  eTitle:'',eDesc:'',eCat:'Document',eRel:'High',eVer:'Verified',eLoc:'',eTime:'1200',eWho:[],
  fTerm:'',fEv:'',fKind:'v',
  sWho:'',sText:'',sTime:'1200',sEv:'',
  tTime:'1200',tDesc:'',tWho:'',tLoc:'',tEv:'',tVer:'Verified',tConf:'',
  err:{},errs:[]};}
S.draft=newDraft();
const BUILD_CATS=['Theft','Tampering','Digital','Facility','Exhibit','Other'];
const BUILD_EVCATS=EV_CATS.slice(1);
function draftEvLabels(D){return Object.fromEntries(D.ev.map(e=>[e.id,e.id+': '+e.title]));}
function fld(label,key,ph,wide){
  return '<label style="display:block"><div class="lbl">'+label+'</div><input id="in-draft.'+key+'" data-in="draft.'+key+'" type="text" style="width:100%" placeholder="'+esc(ph||'')+'" value="'+esc(S.draft[key])+'"></label>';
}
function area(label,key,ph,rows){
  return '<label style="display:block"><div class="lbl">'+label+'</div><textarea id="in-draft.'+key+'" data-in="draft.'+key+'" rows="'+(rows||3)+'" style="font-family:var(--ui);font-size:14px" placeholder="'+esc(ph||'')+'">'+esc(S.draft[key])+'</textarea></label>';
}
function dErr(k){return S.draft.err[k]?'<div class="err">'+esc(S.draft.err[k])+'</div>':'';}
function builderPage(){
  const D=S.draft,pOpts=['']. concat(D.people.map(p=>p.id)),pLab=Object.assign({'':'(nobody)'},Object.fromEntries(D.people.map(p=>[p.id,p.name+' ('+p.id+')'])));
  const evOpts=[''].concat(D.ev.map(e=>e.id)),evLab=Object.assign({'':'(no evidence link)'},draftEvLabels(D));
  const sec=(n,t,help,inner)=>'<div class="panel"><h2 class="sh">'+n+'. '+t+'</h2>'+(help?'<p class="muted" style="margin:0 0 12px;font-size:13px">'+help+'</p>':'')+inner+'</div>';
  const list=(items)=>items.length?'<ul class="plain" style="margin-bottom:12px">'+items.join('')+'</ul>':'<div class="muted" style="font-size:12.5px;margin-bottom:12px">Nothing added yet.</div>';
  const rm=(act,i)=>'<button class="btn sm danger" data-act="'+act+'" data-i="'+i+'" aria-label="Remove">'+IC('x')+'</button>';
  const basics=sec(1,'Case basics','The title and at least one person, one fact and one rule are required. Everything else is optional but makes the report richer.',
    '<div class="g2">'+fld('Case title *','title','e.g. The Missing Canteen Cash Box')+fld('Location','loc','e.g. College Canteen')+'<div><div class="lbl">Category</div>'+sel('draft.cat',BUILD_CATS,D.cat)+'</div><div><div class="lbl">Difficulty</div>'+sel('draft.diff',['Easy','Medium','Hard'],D.diff)+'</div>'+fld('When it happened','when','e.g. Fri 7 Aug, 16:00 to 17:30')+fld('Main question','q','e.g. Who took the cash box?')+'</div><div class="g2 mt" style="margin-top:12px">'+area('Short description','desc','One line for the case card')+area('Briefing','brief','What happened?')+'</div><div style="margin-top:12px">'+area('Investigation objective','obj','What should the investigation establish?',2)+'</div>');
  const people=sec(2,'People of interest','Each person gets a lowercase ID automatically. Use that ID as the constant in your facts, for example has_key(meera, cashbox).',
    list(D.people.map((p,i)=>'<li class="li"><div class="row"><b>'+esc(p.name)+'</b><span class="muted">'+esc(p.role)+'</span><span class="sp"></span><span class="sub">id: '+p.id+'</span>'+rm('dDelPerson',i)+'</div></li>'))+
    '<div class="g3">'+fld('Name *','pName','Meera Shah')+fld('Role','pRole','Canteen Manager')+fld('Access / permissions','pAccess','Holds the cash box key')+'</div><div class="g2" style="margin-top:10px">'+fld('Background','pBg','Short background')+fld('Recorded whereabouts','pWhere','Where were they recorded?')+'</div><div class="row" style="margin-top:10px"><button class="btn" data-act="dAddPerson">'+IC('plus')+'Add person</button></div>'+dErr('person'));
  const evid=sec(3,'Evidence records','Evidence supports facts. Click people below to link them to the record you are adding.',
    list(D.ev.map((e,i)=>'<li class="li"><div class="row"><span class="mono" style="color:var(--amber)">'+e.id+'</span><b>'+esc(e.title)+'</b>'+bd(e.ver)+'<span class="sp"></span>'+rm('dDelEv',i)+'</div></li>'))+
    '<div class="g3">'+fld('Title *','eTitle','Key Register')+'<div><div class="lbl">Category</div>'+sel('draft.eCat',BUILD_EVCATS,D.eCat)+'</div>'+fld('Location','eLoc','College Canteen')+'<div><div class="lbl">Reliability</div>'+sel('draft.eRel',['High','Medium','Low'],D.eRel)+'</div><div><div class="lbl">Verification</div>'+sel('draft.eVer',['Verified','Reported','Unverified'],D.eVer)+'</div>'+fld('Collection time (hhmm)','eTime','1200')+'</div><div style="margin-top:10px">'+fld('Description','eDesc','What does this record say?')+'</div><div class="row" style="margin-top:10px"><span class="muted" style="font-size:12.5px">Related people:</span>'+(D.people.length?D.people.map(p=>'<span class="chip '+(D.eWho.includes(p.id)?'sel':'')+'" data-act="dEvWho" data-id="'+p.id+'">'+esc(p.name)+'</span>').join(''):'<span class="muted" style="font-size:12.5px">add people first</span>')+'</div><div class="row" style="margin-top:10px"><button class="btn" data-act="dAddEv">'+IC('plus')+'Add evidence</button></div>'+dErr('ev'));
  const facts=sec(4,'Logical facts','Write each fact as a predicate with lowercase constants, for example present(meera, canteen) or box_last_seen(1640). Times use hhmm numbers so the lt() check works. Facts must contain no variables.',
    list(D.facts.map((f,i)=>'<li class="li '+(f.kind==='r'?'r':'v')+'"><div class="row"><span class="mono">'+esc(f.term)+'</span>'+(f.ev?'<span class="chip mono">'+f.ev+'</span>':'')+bd(f.kind==='r'?'reported':'verified',f.kind==='r'?'Reported':'Verified')+'<span class="sp"></span>'+rm('dDelFact',i)+'</div></li>'))+
    '<div class="row"><input id="in-draft.fTerm" data-in="draft.fTerm" type="text" class="grow mono" placeholder="present(meera, canteen)" value="'+esc(D.fTerm)+'">'+sel('draft.fEv',evOpts,D.fEv,evLab)+sel('draft.fKind',['v','r'],D.fKind,{v:'Verified record',r:'Reported claim'})+'<button class="btn" data-act="dAddFact">'+IC('plus')+'Add fact</button></div>'+dErr('fact'));
  const rules=sec(5,'Rules','One rule per line: R1: IF has_key(X, cashbox) AND present(X, canteen) THEN can_open(X, cashbox). Variables start with a capital letter. Built-in checks: neq(A, B), lt(A, B).',
    '<textarea id="in-draft.rules" data-in="draft.rules" rows="5" spellcheck="false" placeholder="R1: IF a(X) AND b(X) THEN c(X)">'+esc(D.rules)+'</textarea><div class="g2" style="margin-top:10px">'+fld('Key conclusion predicates (optional, comma separated)','keyp','opportunity')+fld('Conflict predicates (optional, comma separated)','confp','conflicting_departure')+'</div>');
  const stm=sec(6,'Statements (optional)','Statements are stored as reported claims, not verified facts.',
    list(D.st.map((s,i)=>'<li class="li r"><div class="row"><b>'+esc(pname({people:D.people},s.who))+'</b><span class="muted">'+esc(s.text.slice(0,70))+'</span><span class="sp"></span>'+rm('dDelSt',i)+'</div></li>'))+
    '<div class="g3">'+'<div><div class="lbl">Speaker</div>'+sel('draft.sWho',pOpts,D.sWho,pLab)+'</div>'+fld('Stated time (hhmm)','sTime','1725')+'<div><div class="lbl">Related evidence</div>'+sel('draft.sEv',evOpts,D.sEv,evLab)+'</div></div><div style="margin-top:10px">'+area('Statement text','sText','What did they say?',2)+'</div><div class="row" style="margin-top:10px"><button class="btn" data-act="dAddSt">'+IC('plus')+'Add statement</button></div>'+dErr('st'));
  const tl=sec(7,'Timeline events (optional)','Add a conflict note only when your records really disagree.',
    list(D.tl.slice().sort((a,b)=>a.t-b.t).map(e=>'<li class="li"><div class="row"><span class="tt">'+fmtT(e.t)+'</span><span>'+esc(e.d)+'</span><span class="sp"></span>'+rm('dDelTl',D.tl.indexOf(e))+'</div></li>'))+
    '<div class="g3">'+fld('Time (hhmm)','tTime','1640')+'<div><div class="lbl">Person</div>'+sel('draft.tWho',pOpts,D.tWho,pLab)+'</div>'+fld('Location','tLoc','College Canteen')+'<div><div class="lbl">Related evidence</div>'+sel('draft.tEv',evOpts,D.tEv,evLab)+'</div><div><div class="lbl">Status</div>'+sel('draft.tVer',['Verified','Reported','Unknown'],D.tVer)+'</div>'+fld('Conflict note (optional)','tConf','Differs from the logged exit time')+'</div><div style="margin-top:10px">'+fld('What happened','tDesc','Cash box seen on the shelf')+'</div><div class="row" style="margin-top:10px"><button class="btn" data-act="dAddTl">'+IC('plus')+'Add event</button></div>'+dErr('tl'));
  const open=sec(8,'Unresolved questions (optional)','One per line.',area('','open','Who else could reach the cash box without a key?',3));
  return '<div class="ph"><div><h1>Case Builder</h1><p>Create your own case. Add people, evidence, facts and rules, and MysteryMind will run real unification and forward chaining on them. Your cases are saved in this browser.</p></div><span class="sp"></span><button class="btn" data-act="dExample">Fill with an example</button><button class="btn danger" data-act="dClearAsk">'+IC('reset')+'Clear form</button></div>'+
  '<div style="display:grid;gap:14px">'+basics+people+evid+facts+rules+stm+tl+open+
  '<div class="panel"><div class="row"><button class="btn pri" data-act="dCreate">'+IC('room')+'Create case and open it</button><span class="muted" style="font-size:12.5px">Required: title, one person, one fact, one rule.</span></div>'+(D.errs.length?'<ul class="plain mt" style="margin-top:12px">'+D.errs.map(e=>'<li class="li u">'+esc(e)+'</li>').join('')+'</ul>':'')+'</div></div>';
}
function dTime(v,label){
  if(!/^\d{3,4}$/.test(String(v).trim())) throw new Error(label+' must be a number like 1640 (hhmm).');
  const n=Number(v),h=Math.floor(n/100),m=n%100;
  if(m>59||h>33) throw new Error(label+' is not a valid time.');
  return n;
}
function dFactTerm(str){
  const t=parseTerm(str.trim());
  if(t.t!=='cmp') throw new Error('A fact must be a predicate such as present(meera, canteen).');
  if(hasVar(t)) throw new Error('Facts must be ground. Replace the variables ('+termVars(t).join(', ')+') with lowercase constants.');
  return toStr(t);
}
function draftAct(act,d){
  const D=S.draft;D.err={};
  try{
    if(act==='dAddPerson'){
      const name=D.pName.trim();if(!name) throw new Error('A name is required.');
      let base=(name.split(/\s+/)[0]||'p').toLowerCase().replace(/[^a-z0-9]/g,'')||'p',id=base,n=2;
      if(/^\d/.test(id)) id='p'+id;
      while(D.people.some(p=>p.id===id)){id=base+n;n++;}
      D.people.push({id,name,role:D.pRole.trim()||'Person of interest',bg:D.pBg.trim()||'Not provided.',where:D.pWhere.trim()||'Not provided.',access:D.pAccess.trim()||'Not provided.',unk:['Further details are not recorded.']});
      D.pName=D.pRole=D.pBg=D.pWhere=D.pAccess='';
    }else if(act==='dDelPerson'){
      const p=D.people[Number(d.i)];if(!p) return;
      D.people.splice(Number(d.i),1);
      D.ev.forEach(e=>{e.who=e.who.filter(x=>x!==p.id);});D.st=D.st.filter(s=>s.who!==p.id);D.tl.forEach(e=>{if(e.who===p.id) e.who='';});
    }else if(act==='dEvWho'){
      const i=D.eWho.indexOf(d.id);if(i>=0) D.eWho.splice(i,1);else D.eWho.push(d.id);
    }else if(act==='dAddEv'){
      if(!D.eTitle.trim()) throw new Error('Evidence needs a title.');
      const t=dTime(D.eTime,'Collection time');
      D.evN++;
      D.ev.push({id:'E'+D.evN,title:D.eTitle.trim(),desc:D.eDesc.trim()||'No description provided.',cat:D.eCat,t,src:'Entered by investigator',rel:D.eRel,ver:D.eVer,who:D.eWho.slice(),loc:D.eLoc.trim()?[D.eLoc.trim()]:[]});
      D.eTitle=D.eDesc='';D.eWho=[];
    }else if(act==='dDelEv'){
      const e=D.ev[Number(d.i)];if(!e) return;
      D.ev.splice(Number(d.i),1);D.facts.forEach(f=>{if(f.ev===e.id) f.ev='';});D.st.forEach(s=>{if(s.ev===e.id) s.ev='';});D.tl.forEach(x=>{if(x.ev===e.id) x.ev='';});
    }else if(act==='dAddFact'){
      const k=dFactTerm(D.fTerm);
      if(D.facts.some(f=>f.term===k)) throw new Error('That fact is already in the list.');
      D.facts.push({term:k,ev:D.fEv,kind:D.fKind});D.fTerm='';
    }else if(act==='dDelFact') D.facts.splice(Number(d.i),1);
    else if(act==='dAddSt'){
      if(!D.sWho) throw new Error('Choose who made the statement.');
      if(!D.sText.trim()) throw new Error('Write the statement text.');
      D.st.push({who:D.sWho,text:D.sText.trim(),t:dTime(D.sTime,'Stated time'),ev:D.sEv});D.sText='';
    }else if(act==='dDelSt') D.st.splice(Number(d.i),1);
    else if(act==='dAddTl'){
      if(!D.tDesc.trim()) throw new Error('Describe what happened.');
      D.tl.push({t:dTime(D.tTime,'Event time'),d:D.tDesc.trim(),who:D.tWho,loc:D.tLoc.trim(),ev:D.tEv,ver:D.tVer,conflict:D.tConf.trim()});D.tDesc=D.tConf='';
    }else if(act==='dDelTl') D.tl.splice(Number(d.i),1);
  }catch(e){
    const k={dAddPerson:'person',dAddEv:'ev',dAddFact:'fact',dAddSt:'st',dAddTl:'tl'}[act];D.err[k||'ev']=e.message;
  }
}
function csvPreds(s){return String(s||'').split(',').map(x=>x.trim()).filter(Boolean);}
function createCase(){
  const D=S.draft,errs=[];
  if(!D.title.trim()) errs.push('Give the case a title.');
  if(!D.people.length) errs.push('Add at least one person of interest.');
  if(!D.facts.length) errs.push('Add at least one fact.');
  const rules=[];
  D.rules.split('\n').forEach((ln,i)=>{
    if(!ln.trim()||ln.trim()[0]==='#') return;
    try{const r=parseRuleLine(ln);if(rules.some(x=>x.id===r.id)) errs.push('Rule line '+(i+1)+': the ID '+r.id+' is used twice.');else rules.push(r);}
    catch(e){errs.push('Rule line '+(i+1)+': '+e.message);}
  });
  if(!rules.length&&!errs.some(x=>x.startsWith('Rule line'))) errs.push('Add at least one rule.');
  D.errs=errs;
  if(errs.length) return false;
  let u=1;CASES.forEach(c=>{const m=/^CASE-U(\d+)$/.exec(c.id);if(m) u=Math.max(u,Number(m[1])+1);});
  const id='CASE-U'+pad(u,2),map={};
  D.ev.forEach((e,i)=>{map[e.id]='EV-U'+u+'-'+(i+1);});
  const lastConcl=parseTerm(rules[rules.length-1].then).f;
  const kp=csvPreds(D.keyp),cp=csvPreds(D.confp);
  const c={id,n:'U'+u,title:D.title.trim(),cat:D.cat,diff:D.diff,status:'Active',icon:'file',hue:hueOf(D.title),custom:true,
    kw:[D.cat,'custom'],desc:D.desc.trim()||'A case entered by the investigator.',brief:D.brief.trim()||D.desc.trim()||'No briefing was entered for this case.',
    obj:D.obj.trim()||'Determine what the encoded facts and rules support.',q:D.q.trim()||'What do the encoded facts support?',
    loc:D.loc.trim()||'Not specified',when:D.when.trim()||'Not specified',
    people:D.people.map(p=>Object.assign({},p)),
    ev:D.ev.map(e=>Object.assign({},e,{id:map[e.id]})),
    st:D.st.map((s,i)=>({id:'ST-U'+u+'-'+(i+1),who:s.who,text:s.text,t:s.t,ctx:'Entered by investigator',ev:s.ev&&map[s.ev]?[map[s.ev]]:[],ver:'Reported'})),
    tl:D.tl.map(e=>{const o={t:e.t,d:e.d,who:e.who,loc:e.loc,ev:e.ev&&map[e.ev]?map[e.ev]:'',ver:e.ver};if(e.conflict) o.conflict=e.conflict;return o;}),
    facts:D.facts.map(f=>[f.term,f.ev&&map[f.ev]?map[f.ev]:'',f.kind]),
    rules,open:D.open.split('\n').map(x=>x.trim()).filter(Boolean),hyp:[],unknown:['Anything not recorded in the entered facts.'],
    limits:['This case was entered by the investigator. The engine only knows the facts and rules that were entered.','Reported claims are not verified facts.','Derived facts show that encoded conditions were met. They do not prove what actually happened.'],
    conflictPreds:cp,keyPreds:kp.length?kp:[lastConcl]};
  CUSTOM_RAW.push(JSON.parse(JSON.stringify(c)));saveCustom();
  CASES.push(c);prepCase(c);
  S.caseId=c.id;caseChanged();S.page='room';S.tab='overview';S.draft=newDraft();
  log('Case Builder','Created '+c.id+': '+c.title+' ('+c.F.length+' facts, '+BASE[c.id].derived.length+' derived).');
  return true;
}
function deleteCase(id){
  const i=CASES.findIndex(c=>c.id===id);if(i<0||!CASES[i].custom) return;
  CASES.splice(i,1);const j=CUSTOM_RAW.findIndex(c=>c.id===id);if(j>=0) CUSTOM_RAW.splice(j,1);saveCustom();
  delete BASE[id];delete BLOB[id];delete RSS[id];
  for(let k=IDX.length-1;k>=0;k--) if(IDX[k].c===id) IDX.splice(k,1);
  Object.keys(RUNS).forEach(k=>{if(k.indexOf(id+'|')===0) delete RUNS[k];});
  if(S.caseId===id) S.caseId='CASE-001';
  caseChanged();S.page='cases';log('Case Builder','Deleted '+id+'.');
}
function loadExample(){
  const D=newDraft();
  Object.assign(D,{title:'The Missing Canteen Cash Box',cat:'Theft',diff:'Easy',loc:'College Canteen',when:'Fri 7 Aug, 16:00 to 17:30',q:'Who took the cash box?',
   desc:'The afternoon cash box disappears from the canteen counter shelf.',brief:'The cash box was on the counter shelf at 16:40. By 17:30 it was gone. Two people held a key, and one volunteer was in the canteen without one.',
   obj:'Find who satisfied the access and presence conditions, and whether that is enough to say who took the box.',
   people:[{id:'meera',name:'Meera Shah',role:'Canteen Manager',bg:'Runs the canteen and holds a cash box key.',where:'Present until 17:00 per the entry register.',access:'Cash box key holder.',unk:['Further details are not recorded.']},
           {id:'kabir',name:'Kabir Rao',role:'Student Volunteer',bg:'Helps with serving on busy afternoons.',where:'Present until 17:25 per the entry register.',access:'No key.',unk:['Further details are not recorded.']},
           {id:'tanya',name:'Tanya Dsouza',role:'Accountant',bg:'Counts the cash at the end of the day.',where:'Not recorded in the canteen.',access:'Cash box key holder.',unk:['Further details are not recorded.']}],
   evN:3,
   ev:[{id:'E1',title:'Key Register',desc:'Keys for the cash box were issued to Meera and Tanya only.',cat:'Document',t:1800,src:'Entered by investigator',rel:'High',ver:'Verified',who:['meera','tanya'],loc:['College Canteen']},
       {id:'E2',title:'Canteen Entry Register',desc:'Meera in until 17:00. Kabir in until 17:25.',cat:'Access Log',t:1805,src:'Entered by investigator',rel:'High',ver:'Verified',who:['meera','kabir'],loc:['College Canteen']},
       {id:'E3',title:'Counter Camera Note',desc:'The camera shows the cash box on the shelf at 16:40.',cat:'Camera Observation',t:1810,src:'Entered by investigator',rel:'Medium',ver:'Verified',who:[],loc:['College Canteen']}],
   facts:[{term:'has_key(meera, cashbox)',ev:'E1',kind:'v'},{term:'has_key(tanya, cashbox)',ev:'E1',kind:'v'},{term:'present(meera, canteen)',ev:'E2',kind:'v'},{term:'present(kabir, canteen)',ev:'E2',kind:'v'},{term:'box_last_seen(1640)',ev:'E3',kind:'v'},{term:'logged_exit(meera, 1700)',ev:'E2',kind:'v'},{term:'logged_exit(kabir, 1725)',ev:'E2',kind:'v'}],
   rules:'R1: IF has_key(X, cashbox) AND present(X, canteen) THEN can_open(X, cashbox)\nR2: IF present(X, canteen) AND logged_exit(X, T) AND box_last_seen(S) AND lt(S, T) THEN present_after_last_seen(X)\nR3: IF can_open(X, cashbox) AND present_after_last_seen(X) THEN opportunity(X, cashbox)',
   st:[{who:'kabir',text:'I only helped stack chairs and left at twenty-five past five.',t:1725,ev:'E2'}],
   tl:[{t:1640,d:'The cash box is seen on the shelf.',who:'',loc:'College Canteen',ev:'E3',ver:'Verified',conflict:''},{t:1700,d:'Meera leaves the canteen.',who:'meera',loc:'College Canteen',ev:'E2',ver:'Verified',conflict:''},{t:1725,d:'Kabir leaves the canteen.',who:'kabir',loc:'College Canteen',ev:'E2',ver:'Verified',conflict:''}],
   open:'Could someone without a key reach the cash box?\nWas the box removed before or after 17:00?',keyp:'opportunity'});
  S.draft=D;
}

/* ===================== events ===================== */
document.addEventListener('click',e=>{
  if(S.justDragged){S.justDragged=false;return;}
  const el=e.target.closest('[data-act]');if(!el) return;
  if(el.tagName==='A') e.preventDefault();
  handle(el.dataset.act,el.dataset,el,e);
});
document.addEventListener('input',e=>{
  const el=e.target;if(!el.dataset||!el.dataset.in) return;
  setKey(el.dataset.in,el.value);
  if(el.dataset.in==='board.q'||el.dataset.in==='caseId') render(el.dataset.in==='caseId');
  else render();
});
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();S.search.open=true;S.search.focus=true;render();return;}
  if(e.key==='Escape'){if(S.confirm) S.confirm=null;else if(S.search.open) S.search.open=false;else if(S.drawer) S.drawer=null;else return;render();}
  if(e.key==='Enter'&&e.target.id==='in-rs.inp'){handle('rsAdd',{}, e.target,e);e.preventDefault();}
  if(e.key==='Enter'&&e.target.id==='in-draft.fTerm'){handle('dAddFact',{},e.target,e);e.preventDefault();}
  if(e.key==='Enter'&&e.target.id==='in-lab.factIn'){handle('labAddFact',{},e.target,e);e.preventDefault();}
  if(e.key==='Enter'&&(e.target.id==='in-lab.a'||e.target.id==='in-lab.b')){handle('labUnify',{},e.target,e);e.preventDefault();}
});
document.addEventListener('wheel',e=>{
  const svg=e.target.closest&&e.target.closest('#boardsvg');
  if(!svg||!S.board.vb) return;
  e.preventDefault();
  const r=svg.getBoundingClientRect(),v=S.board.vb,f=e.deltaY>0?1.12:1/1.12;
  const px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height,mx=v.x+px*v.w,my=v.y+py*v.h;
  v.w*=f;v.h*=f;v.x=mx-px*v.w;v.y=my-py*v.h;
  svg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);
},{passive:false});
let PD=null;
document.addEventListener('pointerdown',e=>{
  const svg=e.target.closest&&e.target.closest('#boardsvg');
  if(!svg||!S.board.vb||e.button>0) return;
  PD={x:e.clientX,y:e.clientY,vx:S.board.vb.x,vy:S.board.vb.y,moved:false,svg};
});
window.addEventListener('pointermove',e=>{
  if(!PD) return;
  const r=PD.svg.getBoundingClientRect(),v=S.board.vb;
  const dx=e.clientX-PD.x,dy=e.clientY-PD.y;
  if(Math.abs(dx)+Math.abs(dy)>5) PD.moved=true;
  if(!PD.moved) return;
  v.x=PD.vx-dx*v.w/r.width;v.y=PD.vy-dy*v.h/r.height;
  PD.svg.setAttribute('viewBox',v.x+' '+v.y+' '+v.w+' '+v.h);
});
window.addEventListener('pointerup',()=>{if(PD&&PD.moved){S.justDragged=true;setTimeout(()=>{S.justDragged=false;},50);}PD=null;});
render(true);
