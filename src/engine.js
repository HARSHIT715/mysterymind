/* ===== Term representation, parser, unification, forward chaining ===== */
function parseTerm(src){
  const toks=[];let i=0;
  while(i<src.length){
    const c=src[i];
    if(/\s/.test(c)){i++;continue;}
    if(c==='('||c===')'||c===','){toks.push(c);i++;continue;}
    const m=/^[A-Za-z0-9_]+/.exec(src.slice(i));
    if(!m) throw new Error('Unexpected character "'+c+'" at position '+(i+1)+'.');
    toks.push(m[0]);i+=m[0].length;
  }
  if(!toks.length) throw new Error('The term is empty.');
  let p=0;
  function term(){
    const t=toks[p];
    if(t===undefined) throw new Error('Unexpected end of input. A name was expected.');
    if(!/^[A-Za-z0-9_]+$/.test(t)) throw new Error('Expected a name but found "'+t+'".');
    p++;
    if(toks[p]==='('){
      p++;
      if(toks[p]===')') throw new Error('"'+t+'" needs at least one argument.');
      const args=[];
      for(;;){
        args.push(term());
        if(toks[p]===','){p++;continue;}
        if(toks[p]===')'){p++;break;}
        throw new Error(toks[p]===undefined?'Missing a closing parenthesis.':'Expected "," or ")" but found "'+toks[p]+'".');
      }
      if(/^[A-Z_]/.test(t)) throw new Error('Predicate names must start with a lowercase letter ("'+t+'").');
      return {t:'cmp',f:t,args};
    }
    return /^[A-Z_]/.test(t)?{t:'var',n:t}:{t:'const',n:t};
  }
  const r=term();
  if(p<toks.length) throw new Error('Unexpected "'+toks[p]+'" after the end of the term.');
  return r;
}
function toStr(t){
  if(t.t==='cmp') return t.f+'('+t.args.map(toStr).join(', ')+')';
  return t.n;
}
const hasOwn=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
function walk(t,s){while(t.t==='var'&&hasOwn(s,t.n)) t=s[t.n];return t;}
function applyS(t,s){
  t=walk(t,s);
  if(t.t==='cmp') return {t:'cmp',f:t.f,args:t.args.map(a=>applyS(a,s))};
  return t;
}
function occurs(v,t,s){
  t=walk(t,s);
  if(t.t==='var') return t.n===v.n;
  if(t.t==='cmp') return t.args.some(a=>occurs(v,a,s));
  return false;
}
function hasVar(t){return t.t==='var'||(t.t==='cmp'&&t.args.some(hasVar));}
function termVars(t,out=[]){
  if(t.t==='var'){if(!out.includes(t.n)) out.push(t.n);}
  else if(t.t==='cmp') t.args.forEach(a=>termVars(a,out));
  return out;
}
function termHas(t,name){
  if(t.t==='const') return t.n===name;
  if(t.t==='cmp') return t.args.some(a=>termHas(a,name));
  return false;
}
/* Structural unification with a substitution map and occurs check. */
function unify(a,b,s0,trace){
  s0=s0||{};
  const s=Object.assign({},s0);
  const log=(kind,msg)=>{if(trace) trace.push({kind,msg,s:Object.assign({},s)});};
  function u(x0,y0,depth){
    const x=walk(x0,s),y=walk(y0,s);
    log('compare','Compare '+toStr(applyS(x0,s))+' with '+toStr(applyS(y0,s)));
    if(x.t==='var'&&y.t==='var'&&x.n===y.n){log('ok','Same variable on both sides: nothing to bind.');return null;}
    if(x.t==='var'){
      if(occurs(x,y,s)) return 'Occurs check failed: '+x.n+' appears inside '+toStr(applyS(y,s))+', which would make an infinite term.';
      s[x.n]=y;log('bind','Bind '+x.n+' \u2192 '+toStr(applyS(y,s)));return null;
    }
    if(y.t==='var'){
      if(occurs(y,x,s)) return 'Occurs check failed: '+y.n+' appears inside '+toStr(applyS(x,s))+', which would make an infinite term.';
      s[y.n]=x;log('bind','Bind '+y.n+' \u2192 '+toStr(applyS(x,s)));return null;
    }
    if(x.t==='const'&&y.t==='const'){
      if(x.n===y.n){log('ok','Constants match: '+x.n);return null;}
      const rv=x0.t==='var'?x0:(y0.t==='var'?y0:null);
      if(rv) return 'The repeated variable '+rv.n+' cannot equal two different constants ('+x.n+' and '+y.n+').';
      return 'Constants differ: '+x.n+' \u2260 '+y.n+'.';
    }
    if(x.t==='cmp'&&y.t==='cmp'){
      if(x.f!==y.f) return (depth===0?'Predicate names differ: ':'Function symbols differ: ')+x.f+' \u2260 '+y.f+'.';
      if(x.args.length!==y.args.length) return 'Arity differs: '+x.f+'/'+x.args.length+' vs '+y.f+'/'+y.args.length+'.';
      log('ok',(depth===0?'Predicate ':'Function ')+x.f+'/'+x.args.length+' matches on both sides. Unify the arguments pairwise.');
      for(let i=0;i<x.args.length;i++){const r=u(x.args[i],y.args[i],depth+1);if(r) return r;}
      return null;
    }
    return 'A constant cannot match a compound term: '+toStr(x)+' vs '+toStr(y)+'.';
  }
  const reason=u(a,b,0);
  if(reason){log('fail',reason);return {ok:false,reason,s:s0,trace};}
  log('done','Unification succeeded.');
  return {ok:true,reason:null,s,trace};
}
function resolvedSubst(s){const o={};Object.keys(s).forEach(k=>{o[k]=toStr(applyS({t:'var',n:k},s));});return o;}
function newBindings(sOld,sNew){const o={};Object.keys(sNew).forEach(k=>{if(!hasOwn(sOld,k)) o[k]=toStr(applyS({t:'var',n:k},sNew));});return o;}

const BUILTINS=['neq','lt'];
function basisOf(prem,byId){
  let r='verified';
  for(const id of prem){
    const f=byId[id];if(!f) continue;
    const k=f.kind==='derived'?f.basis:f.kind;
    if(k==='temp') return 'temp';
    if(k==='reported') r='reported';
  }
  return r;
}
/* Forward chaining with provenance. base: [{id,s,kind,ev}] rules: [{id,name,if:[...],then}] */
function runEngine(base,rules){
  const errors=[];
  const facts=[];
  base.forEach(f=>{
    try{facts.push(Object.assign({},f,{p:f.p||parseTerm(f.s)}));}
    catch(e){errors.push('Fact "'+f.s+'": '+e.message);}
  });
  const prules=[];
  rules.forEach(r=>{
    try{prules.push(Object.assign({},r,{pc:r.if.map(parseTerm),pt:parseTerm(r.then)}));}
    catch(e){errors.push('Rule '+r.id+': '+e.message);}
  });
  const byId={};facts.forEach(f=>byId[f.id]=f);
  const known=new Map(facts.map(f=>[toStr(f.p),f]));
  const events=[];const info={};
  prules.forEach(r=>info[r.id]={fired:0,deep:-1,why:''});
  let dn=0,round=0,changed=true,guard=0;
  while(changed&&guard++<40){
    changed=false;round++;
    events.push({k:'round',n:round});
    for(const r of prules){
      const buf=[{k:'rule',rule:r.id,n:round}];let newCount=0;
      const snap=facts.slice();
      const vars=[];r.pc.forEach(c=>termVars(c,vars));termVars(r.pt,vars);
      const rec=(i,s,prem)=>{
        if(i===r.pc.length){
          const concl=applyS(r.pt,s);
          info[r.id].fired++;
          if(hasVar(concl)){buf.push({k:'warn',rule:r.id,text:'Conclusion '+toStr(concl)+' still has unbound variables, so it was not derived.'});return;}
          const key=toStr(concl);
          const sub={};vars.forEach(v=>{sub[v]=toStr(applyS({t:'var',n:v},s));});
          if(known.has(key)){buf.push({k:'dup',rule:r.id,term:key,premises:prem.slice(),subst:sub});return;}
          dn++;
          const f={id:'D'+pad(dn),s:key,p:concl,kind:'derived',rule:r.id,premises:prem.slice(),subst:sub,round};
          f.basis=basisOf(prem,byId);
          facts.push(f);byId[f.id]=f;known.set(key,f);newCount++;changed=true;
          buf.push({k:'derive',rule:r.id,fact:f.id,term:key,premises:prem.slice(),subst:sub,round});
          return;
        }
        const cond=r.pc[i];const applied=applyS(cond,s);
        buf.push({k:'cond',rule:r.id,i,total:r.pc.length,cond:toStr(cond),applied:toStr(applied)});
        if(BUILTINS.includes(cond.f)){
          const a=applied.args;let ok=false,text='';
          if(a.length!==2) text=cond.f+' needs exactly two arguments.';
          else if(!a.every(x=>x.t==='const')) text=toStr(applied)+' has unbound variables, so it cannot be evaluated.';
          else if(cond.f==='neq'){ok=a[0].n!==a[1].n;text=a[0].n+' \u2260 '+a[1].n+' is '+ok+'.';}
          else{
            const x=Number(a[0].n),y=Number(a[1].n);
            if(isNaN(x)||isNaN(y)) text='lt needs numeric arguments.';
            else{ok=x<y;text=x+' < '+y+' is '+ok+'.';}
          }
          buf.push({k:'builtin',rule:r.id,i,cond:toStr(applied),ok,text});
          if(ok) rec(i+1,s,prem);
          else if(i>info[r.id].deep){info[r.id].deep=i;info[r.id].why='Built-in check failed: '+text;}
          return;
        }
        let any=false;
        for(const f of snap){
          if(f.p.t!=='cmp'||f.p.f!==cond.f||f.p.args.length!==cond.args.length) continue;
          const res=unify(cond,f.p,s);
          buf.push({k:'cand',rule:r.id,i,cond:toStr(applied),fact:f.id,fs:f.s,ok:res.ok,reason:res.reason,bind:res.ok?newBindings(s,res.s):{}});
          if(res.ok){any=true;rec(i+1,res.s,prem.concat(f.id));}
        }
        if(!any){
          buf.push({k:'nocand',rule:r.id,i,cond:toStr(applied)});
          if(i>info[r.id].deep){info[r.id].deep=i;info[r.id].why='No fact matches condition '+(i+1)+': '+toStr(applied);}
        }
      };
      rec(0,{},[]);
      if(round===1||newCount>0) events.push(...buf);
    }
  }
  events.push({k:'fixpoint',round,total:facts.filter(f=>f.rule).length});
  const unresolved=prules.filter(r=>info[r.id].fired===0).map(r=>({rule:r.id,name:r.name,why:info[r.id].why||'No complete match.'}));
  return {facts,byId,events,info,rounds:round,derived:facts.filter(f=>f.rule),unresolved,errors,rules:prules};
}
function parseRuleLine(line){
  const m=/^\s*([A-Za-z0-9_\-]+)\s*:\s*IF\s+(.+?)\s+THEN\s+(.+?)\s*$/i.exec(line);
  if(!m) throw new Error('Use the form  R1: IF cond1 AND cond2 THEN conclusion');
  const conds=m[2].split(/\s+AND\s+/i).map(x=>x.trim());
  conds.forEach(parseTerm);parseTerm(m[3]);
  return {id:m[1],name:'User rule '+m[1],if:conds,then:m[3].trim(),why:'User-defined rule.',est:'The rule conditions were satisfied.',not:'It establishes only what the rule encodes.'};
}
