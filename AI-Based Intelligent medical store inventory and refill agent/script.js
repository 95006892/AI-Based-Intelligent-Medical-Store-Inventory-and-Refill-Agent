const $=s=>document.querySelector(s),css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const RM=matchMedia("(prefers-reduced-motion:reduce)").matches,sleep=ms=>new Promise(r=>setTimeout(r,RM?0:ms));
document.querySelectorAll(".tabs button").forEach(b=>b.onclick=()=>show(b.dataset.t));
function show(id){document.querySelectorAll(".tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.t==id));
 ["t1","t2","t3"].forEach(t=>$("#"+t).hidden=t!=id);if(id=="t2")draw()}

/* 1. Agent */
const MEDS=[["Paracetamol 500mg",40,25,2,15,300],["Amoxicillin 250mg",30,12,3,10,200],["ORS sachets",30,20,2,10,400],["Insulin glargine",6,3,4,4,90],["Cetirizine 10mg",20,10,2,8,150],["Metformin 500mg",120,15,3,10,260],["Omeprazole 20mg",60,8,3,8,180],["Cough syrup",14,3,2,5,20]];
$("#inv").innerHTML=MEDS.map((m,i)=>`<tr id="r${i}"><td>${m[0]}</td><td>${m[1]}</td><td>${m[2]}</td><td>${m[3]}</td><td id="p${i}">-</td><td>${m[5]}</td><td id="d${i}">-</td></tr>`).join("");
$("#runAgent").onclick=async function(){
 this.disabled=true;$("#toRoute").disabled=true;const log=$("#log");log.innerHTML="";let n=0;
 for(let i=0;i<MEDS.length;i++){const[nm,st,dm,ld,sf,ex]=MEDS[i],rop=dm*ld+sf;
  document.querySelectorAll("tr.on").forEach(r=>r.classList.remove("on"));$("#r"+i).classList.add("on");
  $("#p"+i).textContent=rop;let dec,cls,act;
  if(st<=rop){const q=dm*(ld+7)+sf-st;n++;dec="Reorder "+q;cls="reorder";act=`order ${q} units`}
  else if(ex<30){dec="Expiring: return";cls="exp";act="flag batch for supplier return"}
  else{dec="Stock OK";cls="okc";act="no action"}
  $("#d"+i).innerHTML=`<span class="tag ${cls}">${dec}</span>`;
  log.insertAdjacentHTML("beforeend",`<li><b>${nm}</b>: perceive stock ${st}, demand ${dm}/day. Decide: reorder point ${rop}, so ${st<=rop?"below it":"above it"}. Act: ${act}.</li>`);
  log.scrollTop=log.scrollHeight;await sleep(550)}
 document.querySelectorAll("tr.on").forEach(r=>r.classList.remove("on"));
 log.insertAdjacentHTML("beforeend",`<li><b>Cycle complete:</b> ${n} items to reorder. Next: choose a delivery route and suppliers.</li>`);
 log.scrollTop=log.scrollHeight;this.disabled=false;$("#toRoute").disabled=false};
$("#toRoute").onclick=()=>show("t2");

/* 2. BFS vs A* */
const W=22,H=12,S=[1,5],E=[20,6],cv=$("#cv"),ctx=cv.getContext("2d"),CS=30;
let wall,state={},timer,res={};
function reset(){wall=Array.from({length:H},()=>Array(W).fill(0));
 for(let y=0;y<9;y++){wall[y][6]=1;wall[y][16]=1}for(let y=3;y<H;y++)wall[y][11]=1;
 state={};res={};cancelAnimationFrame(timer);draw();$("#stats").innerHTML='<div class="stat">Run a search to see how many cells each one explores.</div>'}
function draw(){const{closed,open,path}=state;ctx.clearRect(0,0,cv.width,cv.height);
 const c={w:css("--wall"),v:css("--vis"),f:css("--fr"),p:css("--pri"),l:css("--line")};
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;
  ctx.fillStyle=wall[y][x]?c.w:path&&path.has(k)?c.p:open&&open.includes(k)?c.f:closed&&closed.has(k)?c.v:"transparent";
  ctx.fillRect(x*CS+1,y*CS+1,CS-2,CS-2);ctx.strokeStyle=c.l;ctx.strokeRect(x*CS+.5,y*CS+.5,CS,CS)}
 ctx.font="800 16px Manrope,sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
 [[S,"S",c.p],[E,"M",css("--bad")]].forEach(([p,t,col])=>{ctx.fillStyle=col;ctx.fillRect(p[0]*CS+1,p[1]*CS+1,CS-2,CS-2);ctx.fillStyle="#fff";ctx.fillText(t,p[0]*CS+CS/2,p[1]*CS+CS/2)})}
cv.onclick=e=>{const r=cv.getBoundingClientRect(),x=Math.floor((e.clientX-r.left)/r.width*W),y=Math.floor((e.clientY-r.top)/r.height*H);
 if(x==S[0]&&y==S[1]||x==E[0]&&y==E[1])return;wall[y][x]^=1;state={};draw()};
function mk(kind){const h=k=>Math.abs(k%W-E[0])+Math.abs((k/W|0)-E[1]),k0=S[1]*W+S[0],g={[k0]:0},par={},seen=new Set([k0]),open=[k0],closed=new Set(),goal=E[1]*W+E[0];
 const f=k=>g[k]+(kind=="astar"?h(k):0);
 return{open,closed,par,g,goal,step(){if(!open.length)return"fail";let bi=0;
  if(kind=="astar")for(let i=1;i<open.length;i++)if(f(open[i])<f(open[bi]))bi=i;
  const k=open.splice(bi,1)[0];closed.add(k);if(k==goal)return"found";
  const x=k%W,y=k/W|0;
  for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=W||ny>=H||wall[ny][nx])continue;const n=ny*W+nx;
   if(kind=="bfs"){if(seen.has(n))continue;seen.add(n);g[n]=g[k]+1;par[n]=k;open.push(n)}
   else if(g[n]===undefined||g[k]+1<g[n]){g[n]=g[k]+1;par[n]=k;if(!open.includes(n))open.push(n)}}
  return"go"}}}
function run(kind){cancelAnimationFrame(timer);const s=mk(kind),t0=performance.now();state=s;
 const tick=()=>{let r="go",i=0;while(r=="go"&&(RM||i++<3))r=s.step();
  if(r=="go"){draw();timer=requestAnimationFrame(tick);return}
  if(r=="found"){const p=new Set();for(let k=s.goal;k!==undefined;k=s.par[k])p.add(k);s.path=p;res[kind]={ex:s.closed.size,len:s.g[s.goal]}}
  else res[kind]={ex:s.closed.size,len:null};
  draw();stats()};tick()}
function stats(){const nm={bfs:"BFS",astar:"A*"};let h=Object.keys(res).map(k=>`<div class="stat">${nm[k]}<b>${res[k].len==null?"No path":res[k].len+" steps"}</b>${res[k].ex} cells explored</div>`).join("");
 if(res.bfs&&res.astar&&res.bfs.len!=null)h+=`<div class="stat">Result<b>${res.bfs.len==res.astar.len?"Same optimal path":"Different paths"}</b>A* explored ${Math.max(0,res.bfs.ex-res.astar.ex)} fewer cells than BFS</div>`;
 $("#stats").innerHTML=h}
$("#bfs").onclick=()=>run("bfs");$("#astar").onclick=()=>run("astar");$("#clr").onclick=reset;reset();

/* 3. CSP + backtracking */
const SUP={A:{n:"MediLine",cold:1,lic:1,cap:2,f:1},B:{n:"HealthFirst",cold:0,lic:1,cap:2,f:.9},C:{n:"QuickPharma",cold:0,lic:0,cap:3,f:.8}};
const IT=[{n:"Insulin glargine",c:1800,cold:1,h:1},{n:"Amoxicillin 250mg",c:900,h:1},{n:"Paracetamol 500mg",c:400},{n:"ORS sachets",c:300},{n:"Cetirizine 10mg",c:350}],BUDGET=3500;
const needs=it=>[it.cold?"cold-chain":"",it.h?"Schedule H":""].filter(Boolean).join(", ")||"none";
$("#csp").innerHTML=IT.map((it,i)=>`<tr><td>${it.n}</td><td>${needs(it)}</td><td id="s${i}">-</td><td id="c${i}">-</td></tr>`).join("");
function solve(){const ev=[],a={};
 const P=e=>{e.a={...a};ev.push(e)};
 (function bt(i,cost){if(i==IT.length){P({t:"done"});return true}
  const it=IT[i];
  for(const k of"ABC"){const s=SUP[k],pr=Math.round(it.c*s.f);let why=null;
   if(it.cold&&!s.cold)why="needs cold-chain";else if(it.h&&!s.lic)why="Schedule H needs a licence";
   else if(Object.values(a).filter(x=>x==k).length>=s.cap)why="supplier is at capacity";
   else if(cost+pr>BUDGET)why="total ₹"+(cost+pr)+" is over budget";
   if(why){P({t:"fail",i,k,why});continue}
   a[i]=k;P({t:"try",i,k,pr});
   if(bt(i+1,cost+pr))return true;
   delete a[i];P({t:"undo",i,k})}
  return false})(0,0);return ev}
$("#solve").onclick=async function(){this.disabled=true;const log=$("#clog");log.innerHTML="";
 const ev=solve(),total=a=>Object.entries(a).reduce((s,[i,k])=>s+Math.round(IT[i].c*SUP[k].f),0);let back=0,steps=0;
 for(const e of ev){steps++;
  let msg,col="";
  if(e.t=="try")msg=`Assign <b>${IT[e.i].n}</b> to ${SUP[e.k].n} (₹${e.pr})`;
  else if(e.t=="fail"){msg=`${IT[e.i].n} to ${SUP[e.k].n} rejected: ${e.why}`;col="var(--bad)"}
  else if(e.t=="undo"){back++;msg=`<b>Backtrack:</b> undo ${IT[e.i].n} from ${SUP[e.k].n}`;col="var(--warn)"}
  else{msg="<b>All constraints satisfied. Solution found.</b>";col="var(--ok)"}
  log.insertAdjacentHTML("beforeend",`<li style="color:${col||"inherit"}">${msg}</li>`);log.scrollTop=log.scrollHeight;
  IT.forEach((it,i)=>{const k=e.a[i];$("#s"+i).textContent=k?k+" "+SUP[k].n:"-";$("#c"+i).textContent=k?"₹"+Math.round(it.c*SUP[k].f):"-"});
  $("#cstats").innerHTML=`<div class="stat">Total cost<b>₹${total(e.a)}</b>Budget ₹${BUDGET}</div><div class="stat">Backtracks<b>${back}</b>${steps} steps so far</div>`;
  await sleep(e.t=="fail"?90:160)}
 this.disabled=false};
