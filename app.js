const modes = {
  aim:{name:"Aim Rush",icon:"◎",desc:"Попадай по целям за 30 секунд.",color:"cyan"},
  reaction:{name:"Reaction",icon:"ϟ",desc:"Нажми кнопку как можно быстрее.",color:"purple"},
  stack:{name:"Stack",icon:"◇",desc:"Построй самую высокую башню.",color:"green"},
  dodge:{name:"Dodge",icon:"△",desc:"Продержись как можно дольше.",color:"orange"},
  memory:{name:"Memory",icon:"✿",desc:"Запомни и повтори последовательность.",color:"pink"},
  click:{name:"Click Economy",icon:"◉",desc:"Заработай максимум за минуту.",color:"yellow"},
  endless:{name:"Endless",icon:"∞",desc:"Продержись как можно дольше.",color:"blue"}
};
const defaultBoard=[
 ["ShadowX",18942],["Neo",18721],["Damir",18638],["Pixel",18402],["Fox",18190],
 ["Nova",17642],["Kira",17210],["Rex",16890],["Zero",16540],["Byte",16120]
];
let data=JSON.parse(localStorage.getItem("rushRecord")||'{"scores":{},"records":0,"xp":0,"ach":[]}');
let currentMode="aim", score=0, timer=30, interval=null, playing=false, clicks=0;

function fmt(n){return Number(n||0).toLocaleString("ru-RU")}
function save(){localStorage.setItem("rushRecord",JSON.stringify(data))}
function level(){return Math.max(1,Math.floor((data.xp||0)/500)+1)}
function best(){return Math.max(0,...Object.values(data.scores||{}))}
function updateUI(){
  const lv=level(), b=best();
  ["level","level2","level3"].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent=lv});
  ["best","p-best"].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent=fmt(b)});
  ["records","stat-records","p-records"].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent=data.records||0});
  ["stat-ach","p-ach"].forEach(id=>{let e=document.getElementById(id);if(e)e.textContent=data.ach.length});
  document.getElementById("xpbar").style.width=(data.xp%500)/5+"%";
  document.getElementById("xpbar2").style.width=(data.xp%500)/5+"%";
  document.getElementById("stat-rank").textContent="#"+Math.max(3,100-(data.records||0)*2);
  document.getElementById("hero-record").textContent=fmt(Math.max(18942,b));
}
function renderModes(){
  const html=Object.entries(modes).map(([id,m])=>`<div class="mode-card"><div><div class="mode-icon">${m.icon}</div><h3>${m.name}</h3><p>${m.desc}</p></div><button data-start="${id}">Играть</button></div>`).join("");
  document.getElementById("mode-grid").innerHTML=html;
  document.getElementById("big-game-list").innerHTML=html;
}
function renderBoard(){
  let board=defaultBoard.map(x=>[x[0],x[1]]);
  const my=best();
  if(my>0) board.push(["Damir",my]);
  board.sort((a,b)=>b[1]-a[1]);
  document.getElementById("leaderboard-list").innerHTML=board.slice(0,100).map((r,i)=>`<div class="leader-row ${r[0]==="Damir"?"me":""}"><b>#${i+1}</b><div style="display:flex;gap:12px;align-items:center"><span class="leader-avatar">${r[0][0]}</span>${r[0]}</div><strong>${fmt(r[1])}</strong></div>`).join("");
}
function renderAchievements(){
  const all=[
    ["🏁","First Record","Установи первый рекорд",data.records>0],
    ["⚡","Speed","Набери 1000 очков",best()>=1000],
    ["🔵","Top 100","Попади в таблицу",data.records>0],
    ["👑","Legend","Установи 10 рекордов",data.records>=10],
    ["🔥","Streak","Играй несколько дней",false],
    ["💎","10K","Набери 10 000 очков",best()>=10000],
    ["🎯","Hunter","Попади по 50 целям",best()>=50],
    ["∞","Endless","Открой Endless",false]
  ];
  document.getElementById("ach-list").innerHTML=all.map(a=>`<div class="achievement ${a[3]?"done":""}"><div class="ach-icon">${a[0]}</div><h3>${a[1]}</h3><p>${a[2]}</p><b>${a[3]?"✓ ОТКРЫТО":"🔒"}</b></div>`).join("");
}
function showPage(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
  document.getElementById("page-"+page).classList.add("active");
  document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.page===page));
  if(page==="leaderboard")renderBoard();
  if(page==="achievements")renderAchievements();
}
document.querySelectorAll(".nav,.side-link").forEach(b=>b.addEventListener("click",()=>b.dataset.page&&showPage(b.dataset.page)));
document.addEventListener("click",e=>{
  const s=e.target.closest("[data-start]");
  if(s) openGame(s.dataset.start);
  const gm=e.target.closest(".game-side");
  if(gm){document.querySelectorAll(".game-side").forEach(x=>x.classList.remove("active"));gm.classList.add("active");openGame(gm.dataset.mode)}
});
function openGame(mode){
  currentMode=mode; document.getElementById("game-title").textContent=modes[mode].name.toUpperCase();
  document.getElementById("game-overlay").classList.remove("hidden");
  document.getElementById("game-area").innerHTML=`<div class="game-start"><h2>${modes[mode].name}</h2><p>${modes[mode].desc}</p><button class="play-btn" id="real-start">НАЧАТЬ</button></div>`;
  document.getElementById("score").textContent="0"; document.getElementById("timer").textContent=mode==="dodge"?60:30;
  document.getElementById("game-best").textContent=fmt(data.scores[mode]||0);
  document.getElementById("real-start").onclick=startGame;
}
document.getElementById("close-game").onclick=()=>{clearInterval(interval);playing=false;document.getElementById("game-overlay").classList.add("hidden")};

function startGame(){
  clearInterval(interval); playing=true; score=0; clicks=0; timer=currentMode==="dodge"?60:30;
  const area=document.getElementById("game-area"); area.innerHTML="";
  document.getElementById("score").textContent="0";document.getElementById("timer").textContent=timer;
  if(currentMode==="aim") spawnTarget();
  else if(currentMode==="reaction") reactionGame();
  else if(currentMode==="click") clickGame();
  else if(currentMode==="dodge") dodgeGame();
  else simpleGame();
  interval=setInterval(()=>{timer--;document.getElementById("timer").textContent=timer;if(timer<=0)endGame()},1000);
}
function spawnTarget(){
  if(!playing)return;
  const area=document.getElementById("game-area"), t=document.createElement("button");
  t.className="target"; const r=area.getBoundingClientRect();
  t.style.left=(Math.random()*(r.width-70)+5)+"px";t.style.top=(Math.random()*(r.height-70)+5)+"px";
  t.onclick=()=>{score+=100;data.xp+=3;document.getElementById("score").textContent=fmt(score);t.remove();spawnTarget()};
  area.appendChild(t);
}
function reactionGame(){
  const area=document.getElementById("game-area");
  area.innerHTML=`<div class="game-start"><h2 id="react-msg">Жди...</h2><p>Кнопка появится в случайный момент.</p></div>`;
  const wait=1000+Math.random()*3500;
  setTimeout(()=>{if(!playing)return;const b=document.createElement("button");b.className="play-btn";b.textContent="НАЖМИ!";b.style.position="absolute";b.style.left="40%";b.style.top="45%";const started=performance.now();b.onclick=()=>{score=Math.max(1,Math.round(100000/(performance.now()-started)));document.getElementById("score").textContent=fmt(score);endGame()};area.appendChild(b)},wait);
}
function clickGame(){
  const area=document.getElementById("game-area");area.innerHTML=`<div class="game-start"><button id="clicker" class="play-btn" style="font-size:28px">CLICK!</button><p>Кликай сколько сможешь.</p></div>`;
  document.getElementById("clicker").onclick=()=>{score+=10;document.getElementById("score").textContent=fmt(score)};
}
function dodgeGame(){
  const area=document.getElementById("game-area");
  const move=setInterval(()=>{if(!playing){clearInterval(move);return}const d=document.createElement("div");d.className="danger";d.style.left=Math.random()*90+"%";d.style.top=Math.random()*85+"%";area.appendChild(d);setTimeout(()=>d.remove(),1300);},500);
  area.onclick=e=>{if(e.target===area){score+=10;document.getElementById("score").textContent=fmt(score)}};
}
function simpleGame(){
  const area=document.getElementById("game-area");
  area.innerHTML=`<div class="game-start"><h2>Набирай очки!</h2><p>Нажимай кнопку, пока не закончится время.</p><button class="play-btn" id="simple">+ ОЧКИ</button></div>`;
  document.getElementById("simple").onclick=()=>{score+=25;document.getElementById("score").textContent=fmt(score)};
}
function endGame(){
  if(!playing)return; playing=false;clearInterval(interval);
  if(score>(data.scores[currentMode]||0)){data.scores[currentMode]=score;data.records++;data.xp+=50;save()}
  document.getElementById("game-area").innerHTML=`<div class="game-start"><h2>РЕЗУЛЬТАТ: ${fmt(score)}</h2><p>${score>(data.scores[currentMode]||0)?"Новый рекорд!":"Попробуй побить свой рекорд."}</p><button class="play-btn" id="again">ЕЩЁ РАЗ</button></div>`;
  document.getElementById("again").onclick=startGame;updateUI();
}
function countdown(){
  const now=new Date(), end=new Date(now);end.setHours(24,0,0,0);let s=Math.max(0,Math.floor((end-now)/1000));
  const h=String(Math.floor(s/3600)).padStart(2,"0"),m=String(Math.floor(s%3600/60)).padStart(2,"0"),sec=String(s%60).padStart(2,"0");
  document.getElementById("countdown").textContent=`${h}:${m}:${sec}`;
}
renderModes();renderBoard();renderAchievements();updateUI();countdown();setInterval(countdown,1000);
