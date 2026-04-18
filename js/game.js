let game, ai, selected=null, validMoves=[], player='w', char='', diff='';
let wTime=600, bTime=600, timer, promoPending=null;
let soundEnabled=true;
let bgMusicPlaying=false;

const piecePaths={
    w:{k:'assets/images/pieces/w-king.png',q:'assets/images/pieces/w-queen.png',r:'assets/images/pieces/w-rook.png',b:'assets/images/pieces/w-bishop.png',n:'assets/images/pieces/w-knight.png',p:'assets/images/pieces/w-pawn.png'},
    b:{k:'assets/images/pieces/b-king.png',q:'assets/images/pieces/b-queen.png',r:'assets/images/pieces/b-rook.png',b:'assets/images/pieces/b-bishop.png',n:'assets/images/pieces/b-knight.png',p:'assets/images/pieces/b-pawn.png'}
};

// Video intro
window.onload=function(){
    const video=document.getElementById('video-player');
    const overlay=document.getElementById('intro-video');
    
    video.onended=skipIntro;
    
    setTimeout(()=>{
        if(!overlay.classList.contains('hidden')) skipIntro();
    },8000);
};

function skipIntro(){
    document.getElementById('intro-video').classList.add('hidden');
    if(!bgMusicPlaying) toggleBgMusic();
}

// Sonidos
function playSound(id){
    if(!soundEnabled) return;
    const snd=document.getElementById('snd-'+id);
    if(snd){
        snd.currentTime=0;
        snd.play().catch(e=>{});
    }
}

function toggleSound(){
    soundEnabled=!soundEnabled;
    const btn=document.getElementById('sound-btn');
    btn.textContent=soundEnabled?'🔊 Sonido ON':'🔇 Sonido OFF';
    btn.classList.toggle('active',soundEnabled);
}

function toggleBgMusic(){
    const bg=document.getElementById('snd-bg');
    if(bgMusicPlaying){
        bg.pause();
        bgMusicPlaying=false;
    } else {
        bg.volume=0.3;
        bg.play().catch(e=>{});
        bgMusicPlaying=true;
    }
}

// Navegación
function selectChar(c){
    char=c;
    show('screen-diff');
    document.getElementById('diff-title').textContent='Jugar contra '+(c==='agnes'?'Agnes':'Rick');
');
    
    
    const container=document.getElementById('diff-container');
    container.innerHTML='';
    
    const diffs=c==='agnes'
        ?[['easy','Fácil'],['medium','Normal'],['hard','Difícil'],['extreme','Extremo'],['mega','🔥 Mega Extremo']]
        :[['easy','Fácil'],['medium','Normal'],['hard','Difícil'],['extreme','Extremo']];
    
    for(let [d,n] of diffs){
        const btn=document.createElement('button');
        btn.className='diff-btn '+d;
        btn.innerHTML=n;
        btn.onclick=()=>startGame(d);
        container.appendChild(btn);
    }
    
    playSound('click');
}

function startGame(d){
    playSound('click');
    diff=d;
    game=new ChessEngine();
    ai=new ChessAI(d,char);
    player='w';
    wTime=600; bTime=600;
    
    show('screen-game');
    document.getElementById('opponent-name').textContent=char==='agnes'?'Agnes':'Rick';
    document.getElementById('opponent-img').src='assets/images/'+char+'.png';
    
    startTimer();
    draw();
    updateStatus();
}

function show(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

// Tablero
function draw(){
    const b=document.getElementById('board');
    b.innerHTML='';
    
    for(let r=0; r<8; r++){
        for(let c=0; c<8; c++){
            const div=document.createElement('div');
            div.className='square '+((r+c)%2===0?'light':'dark');
            div.dataset.r=r;
            div.dataset.c=c;
            
            const p=game.get(r,c);
            if(p){
                const img=document.createElement('img');
                img.src=piecePaths[p.c][p.t];
                img.className='piece-img';
                img.alt=p.t;
                div.appendChild(img);
            }
            
            if(selected && selected.r===r && selected.c===c) div.classList.add('selected');
            if(validMoves.some(m=>m.r===r && m.c===c)) div.classList.add('valid-move');
            if(p && p.t==='k' && game.inCheck(p.c)) div.classList.add('check');
            
            div.onclick=()=>click(r,c);
            b.appendChild(div);
        }
    }
}

function click(r,c){
    if(game.turn!==player) return;
    
    const p=game.get(r,c);
    
    if(selected){
        const m=validMoves.find(x=>x.r===r && x.c===c);
        if(m){
            doMove(selected,m);
            return;
        }
    }
    
    if(p && p.c===player){
        selected={r,c};
        validMoves=game.getMoves(r,c);
        playSound('click');
        draw();
    } else {
        selected=null;
        validMoves=[];
        draw();
    }
}

function doMove(from,to){
    const p=game.get(from.r,from.c);
    
    if(p.t==='p' && (to.r===0 || to.r===7)){
        promoPending={from,to};
        document.getElementById('promo-modal').classList.add('active');
        return;
    }
    
    finishMove(from,to);
}

function promote(type){
    if(!promoPending) return;
    promoPending.to.promo=type;
    finishMove(promoPending.from,promoPending.to);
    document.getElementById('promo-modal').classList.remove('active');
    promoPending=null;
    playSound('promote');
}

function finishMove(from,to){
    const result=game.move({from,to});
    
    selected=null;
    validMoves=[];
    
    if(result.capture) playSound('capture');
    else if(to.castle) playSound('castle');
    else playSound('move');
    
    if(result.check) setTimeout(()=>playSound('check'),300);
    
    draw();
    updateStatus();
    
    const state=game.gameState();
    if(state.status!=='playing'){
        setTimeout(()=>endGame(state),500);
        return;
    }
    
    if(game.turn!==player){
        setTimeout(aiTurn,800);
    }
}

function aiTurn(){
    const m=ai.getMove(game);
    if(m){
        const result=game.move(m);
        
        if(result.capture) playSound('capture');
        else if(m.to.castle) playSound('castle');
        else playSound('move');
        
        if(result.check) setTimeout(()=>playSound('check'),300);
        
        draw();
        updateStatus();
        
        const state=game.gameState();
        if(state.status!=='playing'){
            setTimeout(()=>endGame(state),500);
        }
    }
}

function updateStatus(){
    const s=game.gameState();
    const statusEl=document.getElementById('game-status');
    const textEl=document.getElementById('status-text');
    
    if(game.turn===player){
        statusEl.textContent='TU TURNO';
        statusEl.style.color='#27ae60';
    } else {
        statusEl.textContent=char==='agnes'?'AGNES PIENSA...':'RICK PIENSA...';
        statusEl.style.color='#f39c12';
    }
    
    if(s.check){
        textEl.textContent='¡JAQUE!';
        textEl.style.color='#e74c3c';
    } else {
        textEl.textContent='';
    }
}

// Timer
function startTimer(){
    clearInterval(timer);
    timer=setInterval(()=>{
        if(game.turn==='w') wTime--; else bTime--;
        document.getElementById('timer-white').textContent=fmt(wTime);
        document.getElementById('timer-black').textContent=fmt(bTime);
        if(wTime<=0 || bTime<=0){
            endGame({status:'timeout',winner:wTime<=0?'b':'w'});
        }
    },1000);
}

function fmt(s){
    const m=Math.floor(s/60), sec=s%60;
    return m+':'+(sec<10?'0':'')+sec;
}

// Fin del juego
function endGame(state){
    clearInterval(timer);
    const modal=document.getElementById('end-modal');
    const title=document.getElementById('end-title');
    const msg=document.getElementById('end-msg');
    const img=document.getElementById('end-img');
    
    modal.classList.add('active');
    
    if(state.status==='checkmate'){
        if(state.winner===player){
            title.textContent='¡VICTORIA!';
            title.style.color='#27ae60';
            msg.textContent=diff==='mega' && char==='agnes'?'¡IMPOSIBLE! Derrotaste a Agnes en Mega Extremo':'¡Ganaste la partida!';
            img.src='assets/images/winner.png';
            playSound('win');
        } else {
            title.textContent='DERROTA';
            title.style.color='#e74c3c';
            msg.textContent=char==='agnes'?'Agnes te ha destruido con su estrategia':'Rick ha ganado esta vez';
            img.src='assets/images/'+char+'.png';
            playSound('lose');
        }
    } else if(state.status==='draw'){
        title.textContent='TABLAS';
        title.style.color='#f39c12';
        msg.textContent='La partida terminó en empate';
        img.src='assets/images/draw.png';
        playSound('draw');
    } else {
        title.textContent=state.winner===player?'¡VICTORIA!':'DERROTA';
        msg.textContent='Se acabó el tiempo';
        img.src=state.winner===player?'assets/images/winner.png':'assets/images/'+char+'.png';
        playSound(state.winner===player?'win':'lose');
    }
}

// Controles
function resign(){
    if(confirm('¿Seguro que quieres rendirte?')){
        playSound('click');
        endGame({status:'resign',winner:game.turn==='w'?'b':'w'});
    }
}

function newGame(){
    playSound('click');
    if(confirm('¿Empezar nueva partida?')){
        show('screen-start');
    }
}

function toMenu(){
    playSound('click');
    document.getElementById('end-modal').classList.remove('active');
    show('screen-start');
}

function rematch(){
    playSound('click');
    document.getElementById('end-modal').classList.remove('active');
    startGame(diff);
}

function goBack(){
    playSound('click');
    show('screen-start');
}
