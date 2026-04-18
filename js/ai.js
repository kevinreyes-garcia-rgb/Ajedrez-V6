class ChessAI {
    constructor(diff, char) {
        this.diff=diff; 
        this.char=char;
        this.depth={easy:2,medium:3,hard:4,extreme:5,mega:6}[diff]||3;
    }

    getMove(game) {
        const moves=game.allMoves(game.turn);
        if(moves.length===0) return null;
        
        if(this.diff==='mega' && this.char==='agnes') {
            return this.bestMove(game,this.depth);
        }
        
        const best=this.bestMove(game,this.depth);
        const rand=Math.random();
        
        if(this.diff==='easy' && rand<0.4) return this.randomMove(moves);
        if(this.diff==='medium' && rand<0.2) return this.randomMove(moves);
        if(this.diff==='hard' && rand<0.05) return this.randomMove(moves);
        
        return best;
    }

    randomMove(moves) {
        return moves[Math.floor(Math.random()*moves.length)];
    }

    bestMove(game,depth) {
        const moves=game.allMoves(game.turn);
        let best=moves[0], bestVal=-Infinity;
        const isMax=game.turn==='w';
        
        for(let m of moves) {
            const test=game.clone();
            test.move(m);
            const val=this.minimax(test,depth-1,-Infinity,Infinity,!isMax);
            if(val>bestVal) { bestVal=val; best=m; }
        }
        return best;
    }

    minimax(game,d,alpha,beta,isMax) {
        const state=game.gameState();
        if(state.status==='checkmate') return isMax?-1000000:1000000;
        if(state.status==='draw') return 0;
        if(d===0) return game.evaluate();

        const moves=game.allMoves(game.turn);
        
        if(isMax) {
            let maxEval=-Infinity;
            for(let m of moves) {
                const test=game.clone();
                test.move(m);
                const eval_=this.minimax(test,d-1,alpha,beta,false);
                maxEval=Math.max(maxEval,eval_);
                alpha=Math.max(alpha,eval_);
                if(beta<=alpha) break;
            }
            return maxEval;
        } else {
            let minEval=Infinity;
            for(let m of moves) {
                const test=game.clone();
                test.move(m);
                const eval_=this.minimax(test,d-1,alpha,beta,true);
                minEval=Math.min(minEval,eval_);
                beta=Math.min(beta,eval_);
                if(beta<=alpha) break;
            }
            return minEval;
        }
    }
}
