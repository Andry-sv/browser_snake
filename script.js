const startGame = document.getElementById('start');
const vSpeed = document.getElementById('viewSpeed');
const cSpeed = document.getElementById('currentSpeed');
const vSound = document.getElementById('viewSound');
const cSound = document.getElementById('currentSound');

const defeatMes = document.getElementById('defeatMessage');
const winMes = document.getElementById('winMessage');
const menu = document.getElementById('gameMenu');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sounds = {apple: new Audio('./assets/sounds/EAT.mp3'),
    win: new Audio('./assets/sounds/end_WIN.mp3'),
    death: new Audio('./assets/sounds/end_DEATH.mp3'),
    up: new Audio('./assets/sounds/UP.mp3'),
    down: new Audio('./assets/sounds/DOWN.mp3'),
    left: new Audio('./assets/sounds/LEFT.mp3'),
    right: new Audio('./assets/sounds/RIGHT.mp3'),
    portal: new Audio('./assets/sounds/PORTAL.mp3'),
    throughWall: new Audio('./assets/sounds/GATE.mp3')
};

const cellSize = 40;
const bodySize = 30;
const tailSize = 26;
const radius = 7;
const eyeSize = 3.5;

const eye_sets = {
    '0,-1':  [{dx: 0.3, dy: 0.3}, {dx: 0.7, dy: 0.3}], 
    '0,1':   [{dx: 0.3, dy: 0.7}, {dx: 0.7, dy: 0.7}], 
    '-1,0':  [{dx: 0.3, dy: 0.3}, {dx: 0.3, dy: 0.7}], 
    '1,0':   [{dx: 0.7, dy: 0.3}, {dx: 0.7, dy: 0.7}] 
};

const strategies = {
    'standart': {
        'initApple': 1,
        onApple(newHead) {
            sounds.apple.play();
            apples.splice(apples.findIndex(el => el.x === newHead.x && el.y === newHead.y), 1);
            score++;
            spawnApple(1);
            return true;
        },
        onWall() { 
            loseGame(); 
            return false;
        },
        onSelf() {
            loseGame(); 
            return false;
        },
        none() {
            return false
        }
    },
    'manyApples': {
        'initApple': 3,
        onApple(newHead) {
            sounds.apple.play();
            apples.splice(apples.findIndex(el => el.x === newHead.x && el.y === newHead.y), 1);
            score++;
            spawnApple(1);
            return true;
        },
        onWall() { 
            loseGame(); 
            return false;
        },
        onSelf() {
            loseGame(); 
            return false;
        },
        none() {
            return false
        }
    },
    'portal': {
        'initApple': 2,
        onApple(newHead) {
            sounds.portal.play();
            apples.splice(apples.findIndex(el => el.x === newHead.x && el.y === newHead.y), 1);
            snake.unshift([newHead.x, newHead.y]);
            newHead.x = apples[0].x; 
            newHead.y = apples[0].y;
            apples.length = 0;
            score++;
            spawnApple(2);
            return false;
        },
        onWall() { 
            loseGame(); 
            return false;
        },
        onSelf() {
            loseGame(); 
            return false;
        },
        none() {
            return false
        }
        
    },
    'safeWall': {
        'initApple': 1,
        onApple(newHead) {
            sounds.apple.play();
            apples.splice(apples.findIndex(el => el.x === newHead.x && el.y === newHead.y), 1);
            score++;
            spawnApple(1);
            return true;
        },
        onWall(newHead) {
            sounds.throughWall.play();
            if (newHead.x < 0) newHead.x = fieldSize - 1;
            if (newHead.x >= fieldSize) newHead.x = 0;
            if (newHead.y < 0) newHead.y = fieldSize - 1;
            if (newHead.y >= fieldSize) newHead.y = 0;
            
            return checkPos(newHead) == "onApple" ? strategies['safeWall'].onApple(newHead) : false;
        },
        onSelf() {
            loseGame(); 
            return false;
        },
        none() {
            return false
        }
    }
}

let score;
let game;
let gameMode = 'standart';
let speed = 1.0;            
let fieldSize = 6;
let inputDir;
let direction = {x: 0, y: -1};
const apples = [];
const freeCells = [];
const snake = [];

function initGame(strategy) {
    direction = {x: 0, y: -1, dir: 'up'};
    inputDir = {x: 0, y: -1, dir: 'up'};
    initFreeCells(fieldSize);
    fieldDraw(fieldSize);
    spawnApple(strategy.initApple);
    score = 0;
    game = setInterval(() => perTick(strategy), 500/speed);
}

function initFreeCells(size) {
    snake.length = 0;
    apples.length = 0;
    for (let i = 0; i <= Math.ceil(size/4); i++){
        snake.push([Math.floor(size/2), Math.floor(size/2)+i]);
    }
    freeCells.length = 0;
    for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++)
            if (!snake.some(el => el[0] === x && el[1] === y))
                freeCells.push([x,y]);
};

function fieldDraw(size) {
    fieldSize = size;
    canvas.width = fieldSize*cellSize;
    canvas.height = fieldSize*cellSize; 
    ctx.lineWidth=0.3;
    ctx.beginPath();
    for (let i=0; i<canvas.width; i+=cellSize){
        ctx.moveTo(i,0);
        ctx.lineTo(i,canvas.width);
        ctx.moveTo(0,i);
        ctx.lineTo(canvas.width,i);
    }
    ctx.stroke();

    snake.slice(1,-1).forEach(el => bodyDraw(...el));
    headDraw(...snake[0]);
    tailDraw(...snake.slice(-1)[0]);
}

function headDraw(i,j) {
    let x = (cellSize-bodySize)/2 + cellSize*i;
    let y = (cellSize-bodySize)/2 + cellSize*j;
    let eyes = eye_sets[`${direction.x},${direction.y}`];
    ctx.beginPath();
    ctx.fillStyle='#1ea137';
    ctx.moveTo(x+radius, y);
    ctx.lineTo(x+bodySize-radius, y);
    ctx.arcTo(x+bodySize, y, x+bodySize, y+radius, radius);
    ctx.lineTo(x+bodySize, y+bodySize-radius);
    ctx.arcTo(x+bodySize, y+bodySize, x+bodySize-radius, y+bodySize, radius);
    ctx.lineTo(x+radius, y+bodySize);
    ctx.arcTo(x, y+bodySize, x, y+bodySize-radius, radius);
    ctx.lineTo(x, y+radius);
    ctx.arcTo(x, y, x+radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'black';
    eyes.forEach(eye => {
        ctx.arc(cellSize*i + eye.dx*cellSize,
        cellSize*j + eye.dy*cellSize, eyeSize, 0, 2*Math.PI)
    });
    ctx.closePath();
    ctx.fill();
}

function bodyDraw(i,j) {
    let x = (cellSize-bodySize)/2 + cellSize*i;
    let y = (cellSize-bodySize)/2 + cellSize*j;
    ctx.beginPath();
    ctx.fillStyle='#1eb137';
    ctx.moveTo(x+radius, y);
    ctx.lineTo(x+bodySize-radius, y);
    ctx.arcTo(x+bodySize, y, x+bodySize, y+radius, radius);
    ctx.lineTo(x+bodySize, y+bodySize-radius);
    ctx.arcTo(x+bodySize, y+bodySize, x+bodySize-radius, y+bodySize, radius);
    ctx.lineTo(x+radius, y+bodySize);
    ctx.arcTo(x, y+bodySize, x, y+bodySize-radius, radius);
    ctx.lineTo(x, y+radius);
    ctx.arcTo(x, y, x+radius, y, radius);
    ctx.closePath();
    ctx.fill();
}

function tailDraw(i,j) {
    let x = (cellSize-tailSize)/2 + cellSize*i;
    let y = (cellSize-tailSize)/2 + cellSize*j;
    ctx.beginPath();
    ctx.fillStyle='#1ec137';
    ctx.moveTo(x+radius, y);
    ctx.lineTo(x+tailSize-radius, y);
    ctx.arcTo(x+tailSize, y, x+tailSize, y+radius, radius);
    ctx.lineTo(x+tailSize, y+tailSize-radius);
    ctx.arcTo(x+tailSize, y+tailSize, x+tailSize-radius, y+tailSize, radius);
    ctx.lineTo(x+radius, y+tailSize);
    ctx.arcTo(x, y+tailSize, x, y+tailSize-radius, radius);
    ctx.lineTo(x, y+radius);
    ctx.arcTo(x, y, x+radius, y, radius);
    ctx.closePath();
    ctx.fill();
}

function appleDraw(i, j) {
    let x = cellSize * i + cellSize / 2;
    let y = cellSize * j + cellSize / 2+5;
    
    let appSize = cellSize * 0.26; 
    let offset = appSize * 0.35;

    ctx.beginPath();
    ctx.fillStyle = '#f75145';
    ctx.arc(x, y, appSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#90db64';
    ctx.ellipse(x + offset, y - appSize, 
        appSize * 0.5, appSize * 0.25, 
        -Math.PI / 4, 0, Math.PI * 2
    );
    ctx.fill();
}

function checkPos(newHead) {
    if (snake.slice(0,-1).some(el => el[0]===newHead.x && el[1]===newHead.y))
        return 'onSelf';
    if (newHead.x>=fieldSize || newHead.x<0 || newHead.y>=fieldSize || newHead.y<0)
        return "onWall";
    if (apples.some(el => newHead.x === el.x && newHead.y === el.y))
        return "onApple";
    return 'none';
}

function spawnApple(i) {
    if (freeCells.length === 0) return;
    for (; i>0; i--) {
        let pos = Math.floor(Math.random() *freeCells.length);
        let apple = {
            x: freeCells[pos][0],
            y: freeCells[pos][1]
        };
        appleDraw(apple.x,apple.y);
        apples.push(apple);
        freeCells.splice(pos, 1);
    }
}

function winGame() {
    sounds.win.play();
    clearInterval(game); 
    game = null;
    headDraw(...snake[0]);
    setTimeout(() => winMes.showModal(), 200);
}

function loseGame() {
    sounds.death.play();
    clearInterval(game); 
    game = null;
    headDraw(...snake[0]);
    defeatMes.querySelector('#currentScore').textContent = score;
    setTimeout(() => defeatMes.showModal(), 200);
}

function perTick(strategy) {
    if (!(direction.x === inputDir.x && direction.y === inputDir.y)) {
        direction = inputDir;
        sounds[direction.dir].play();
    }
    let newHead = {x: snake[0][0]+direction.x, y: snake[0][1]+direction.y};
    let position = checkPos(newHead);
    if (!strategy[position](newHead)) {
        ctx.clearRect(snake[snake.length-1][0]*cellSize+1,snake[snake.length-1][1]*cellSize+1, cellSize-2,cellSize-2);
        ctx.clearRect(snake[snake.length-2][0]*cellSize+3,snake[snake.length-2][1]*cellSize+3, cellSize-6,cellSize-6);
        freeCells.push(snake.pop());
    }
    
    if (freeCells.length === 0 && apples.length === 0) winGame();
    const headIx = freeCells.findIndex(el => el[0] === newHead.x && el[1] === newHead.y);
    if (headIx !== -1) freeCells.splice(headIx, 1);
    snake.unshift([newHead.x, newHead.y]);
    snake.slice(1,-1).forEach(el => bodyDraw(...el));
    tailDraw(...snake.slice(-1)[0]);
    headDraw(...snake[0]);
}

function showMenu() {
    menu.showModal();
    window.removeEventListener('click', showMenu);
}

window.addEventListener('keydown', (event) => {
    if (event.key == 'ArrowUp' && direction.y != 1) inputDir = {x:0, y:-1, dir: 'up'};
    else if (event.key == 'ArrowDown' && direction.y != -1) inputDir = {x:0, y:1, dir: 'down'};
    else if (event.key == 'ArrowLeft' && direction.x != 1) inputDir = {x:-1, y:0, dir: 'left'};
    else if (event.key == 'ArrowRight' && direction.x != -1) inputDir = {x:1, y:0, dir: 'right'};
});

window.addEventListener('click', showMenu);

defeatMes.addEventListener('close', () => {
if(+defeatMes.returnValue)
    showMenu();
else
    initGame(strategies[gameMode]);
});

winMes.addEventListener('close', () => {
if(+winMes.returnValue)
    showMenu();
else
    initGame(strategies[gameMode]);
});

startGame.addEventListener('click', () => {
    initGame(strategies[gameMode])
});

menu.querySelectorAll('#sizeBox button[type="button"]').forEach((but) => {
    but.addEventListener('click', (event) => {
        let curActiv = menu.querySelector('#sizeBox .activ');
        curActiv.classList.remove('activ');
        fieldSize = +event.currentTarget.value;
        event.currentTarget.classList.add('activ');
    });
});

menu.querySelectorAll('#modeBox button[type="button"]').forEach((but) => {
    but.addEventListener('click', (event) => {
        let curActiv = menu.querySelector('#modeBox .activ');
        curActiv.classList.remove('activ');
        gameMode = event.currentTarget.value;
        event.currentTarget.classList.add('activ');
    });
});

cSpeed.addEventListener('input', (event) => {
    let val = +event.currentTarget.value;
    vSpeed.textContent = val;
    speed = val;
});

cSound.addEventListener('input', (event) => {
    let val = +event.currentTarget.value;
    if (val==0)
        vSound.innerHTML = '&#128263;';
    else if (val<=0.4)
        vSound.innerHTML = '&#128264;';
    else 
        vSound.innerHTML = '&#128266;';
    Object.values(sounds).forEach(el => el.volume = val);
});

