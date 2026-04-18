class ChessEngine {
    constructor() {
        this.board = this.createBoard();
        this.turn = 'w';
        this.moveHistory = [];
        this.kingPos = {w: {r:7,c:4}, b: {r:0,c:4}};
        this.castle = {w: {k:true,q:true}, b: {k:true,q:true}};
        this.enPassant = null;
        this.halfmove = 0;
    }

    createBoard() {
        const back = ['r','n','b','q','k','b','n','r'];
        const b = [];
        for(let r=0; r<8; r++) {
            b[r] = [];
            for(let c=0; c<8; c++) {
                if(r===0) b[r][c] = {t:back[c],c:'b'};
                else if(r===1) b[r][c] = {t:'p',c:'b'};
                else if(r===6) b[r][c] = {t:'p',c:'w'};
                else if(r===7) b[r][c] = {t:back[c],c:'w'};
                else b[r][c] = null;
            }
        }
        return b;
    }

    get(r,c) { return (r<0||r>7||c<0||c>7)?null:this.board[r][c]; }
    empty(r,c) { return this.get(r,c)===null; }
    enemy(r,c,color) { const p=this.get(r,c); return p&&p.c!==color; }

    getMoves(r,c) {
        const p=this.get(r,c); if(!p||p.c!==this.turn) return [];
        const moves=[], color=p.c;
        
        if(p.t==='p') {
            const d=color==='w'?-1:1, start=color==='w'?6:1;
            if(this.empty(r+d,c)) {
                moves.push({r:r+d,c:c});
                if(r===start && this.empty(r+2*d,c)) moves.push({r:r+2*d,c:c,enPassant:true});
            }
            for(let dc of [-1,1]) {
                if(this.enemy(r+d,c+dc,color)) moves.push({r:r+d,c:c+dc,capture:true});
                if(this.enPassant && this.enPassant.r===r+d && this.enPassant.c===c+dc) 
                    moves.push({r:r+d,c:c+dc,ep:true});
            }
        }
        else if(p.t==='r') this.lineMoves(moves,r,c,[[0,1],[0,-1],[1,0],[-1,0]],color);
        else if(p.t==='n') {
            const kms=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
            for(let [dr,dc] of kms) {
                const nr=r+dr, nc=c+dc;
                if(this.empty(nr,nc)||this.enemy(nr,nc,color)) moves.push({r:nr,c:nc});
            }
        }
        else if(p.t==='b') this.lineMoves(moves,r,c,[[1,1],[1,-1],[-1,1],[-1,-1]],color);
        else if(p.t==='q') this.lineMoves(moves,r,c,[[0,1],[0,-1],[1,0],[-1,0],[1,1],[1,-1],[-1,1],[-1,-1]],color);
        else if(p.t==='k') {
            for(let dr=-1; dr<=1; dr++) for(let dc=-1; dc<=1; dc++) {
                if(dr===0 && dc===0) continue;
                const nr=r+dr, nc=c+dc;
                if(this.empty(nr,nc)||this.enemy(nr,nc,color)) moves.push({r:nr,c:nc});
            }
            if(this.canCastle(color,'k')) moves.push({r:r,c:c+2,castle:'k'});
            if(this.canCastle(color,'q')) moves.push({r:r,c:c-2,castle:'q'});
        }
        
        return moves.filter(m => {
            const test=this.clone();
            test.move({from:{r,c},to:m});
            return !test.inCheck(color);
        });
    }

    lineMoves(moves,r,c,dirs,color) {
        for(let [dr,dc] of dirs) {
            let nr=r+dr, nc=c+dc;
            while(this.empty(nr,nc)) { moves.push({r:nr,c:nc}); nr+=dr; nc+=dc; }
            if(this.enemy(nr,nc,color)) moves.push({r:nr,c:nc,capture:true});
        }
    }

    canCastle(color,side) {
        const row=color==='w'?7:0, kc=4, rc=side==='k'?7:0;
        const start=Math.min(kc,rc)+1, end=Math.max(kc,rc);
        for(let c=start; c<end; c++) if(!this.empty(row,c)) return false;
        if(this.inCheck(color)) return false;
        const path=side==='k'?[5,6]:[3,2];
        for(let c of path) {
            const test=this.clone();
            test.board[row][c]=test.board[row][kc]; test.board[row][kc]=null;
            if(test.inCheck(color)) return false;
        }
        return true;
    }

    move(m) {
        const {from,to}=m, p=this.board[from.r][from.c], cap=this.board[to.r][to.c];
        this.moveHistory.push({from,to,p,cap,castle:JSON.parse(JSON.stringify(this.castle)),ep:this.enPassant});
        
        this.board[to.r][to.c]=p; this.board[from.r][from.c]=null;
        if(p.t==='k') this.kingPos[p.c]={r:to.r,c:to.c};
        
        if(to.ep) {
            const epRow=p.c==='w'?to.r+1:to.r-1;
            this.board[epRow][to.c]=null;
        }
        if(to.promo) this.board[to.r][to.c]={t:to.promo,c:p.c};
        if(to.castle) {
            const row=from.r;
            if(to.castle==='k') { this.board[row][5]=this.board[row][7]; this.board[row][7]=null; }
            else { this.board[row][3]=this.board[row][0]; this.board[row][0]=null; }
        }
        
        if(p.t==='k') this.castle[p.c]={k:false,q:false};
        if(p.t==='r') {
            if(from.c===0) this.castle[p.c].q=false;
            if(from.c===7) this.castle[p.c].k=false;
        }
        
        this.enPassant=to.enPassant?{r:(from.r+to.r)/2,c:from.c}:null;
        if(p.t==='p'||cap) this.halfmove=0; else this.halfmove++;
        this.turn=this.turn==='w'?'b':'w';
        
        return {capture:!!cap||to.ep, check:this.inCheck(this.turn)};
    }

    inCheck(color) {
        const kp=this.kingPos[color], ec=color==='w'?'b':'w';
        const pd=color==='w'?-1:1;
        for(let dc of [-1,1]) {
            const p=this.get(kp.r+pd,kp.c+dc);
            if(p&&p.t==='p'&&p.c===ec) return true;
        }
        const kms=[[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
        for(let [dr,dc] of kms) {
            const p=this.get(kp.r+dr,kp.c+dc);
            if(p&&p.t==='n'&&p.c===ec) return true;
        }
        const dirs=[[[0,1],[0,-1],[1,0],[-1,0]],[[1,1],[1,-1],[-1,1],[-1,-1]]];
        for(let i=0; i<2; i++) for(let [dr,dc] of dirs[i]) {
            let r=kp.r+dr, c=kp.c+dc;
            while(this.empty(r,c)) { r+=dr; c+=dc; }
            const p=this.get(r,c);
            if(p&&p.c===ec) {
                if(i===0&&(p.t==='r'||p.t==='q')) return true;
                if(i===1&&(p.t==='b'||p.t==='q')) return true;
            }
        }
        return false;
    }

    checkmate(color) { return this.inCheck(color) && !this.hasMoves(color); }
    stalemate(color) { return !this.inCheck(color) && !this.hasMoves(color); }
    hasMoves(color) {
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p=this.get(r,c);
            if(p&&p.c===color && this.getMoves(r,c).length>0) return true;
        }
        return false;
    }

    gameState() {
        const c=this.turn;
        if(this.checkmate(c)) return {status:'checkmate',winner:c==='w'?'b':'w'};
        if(this.stalemate(c)||this.halfmove>=100) return {status:'draw'};
        return {status:'playing',check:this.inCheck(c)};
    }

    clone() {
        const g=new ChessEngine();
        g.board=this.board.map(r=>r.map(c=>c?{...c}:null));
        g.turn=this.turn; 
        g.kingPos={w:{...this.kingPos.w},b:{...this.kingPos.b}};
        g.castle=JSON.parse(JSON.stringify(this.castle));
        g.enPassant=this.enPassant?{...this.enPassant}:null;
        g.halfmove=this.halfmove;
        return g;
    }

    allMoves(color) {
        const moves=[];
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p=this.get(r,c);
            if(p&&p.c===color) {
                const ms=this.getMoves(r,c);
                for(let m of ms) moves.push({from:{r,c},to:m,piece:p.t});
            }
        }
        return moves;
    }

    evaluate() {
        const vals={p:100,n:320,b:330,r:500,q:900,k:20000};
        let score=0;
        for(let r=0; r<8; r++) for(let c=0; c<8; c++) {
            const p=this.get(r,c);
            if(p) {
                let v=vals[p.t];
                if(p.t==='p') v+=p.c==='w'?(6-r)*10:(r-1)*10;
                score+=p.c==='w'?v:-v;
            }
        }
        return this.turn==='w'?score:-score;
    }
}
