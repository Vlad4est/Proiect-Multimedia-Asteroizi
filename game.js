const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

const ASTEROID_COLORS = {
    4: '#ff0000',
    3: '#ff6b00',
    2: '#ffa500',
    1: '#ffcc00'
};

const ASTEROID_SIZES = {
    4: 50,
    3: 40,
    2: 30,
    1: 20
};

let gameState = {
    score: 0,
    lives: 3,
    isGameOver: false
};

let ship = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    rotation: 0,
    velocity: { x: 0, y: 0 }
};

let asteroids = [];
let missiles = [];
let keys = {};

function init() {
    gameState = { score: 0, 
        lives: 3, 
        isGameOver: false};
    ship = {
        x:canvas.width / 2,
        y:canvas.height / 2,
        rotation: 0,
        velocity: { x: 0, y: 0 }
    };
    asteroids = [];
    let x = 1;
    missiles = [];
}

function generateAsteroid() {
    const side = Math.floor(Math.random() * 4);
    let x, y;
    
    // switch(side) {
    //     case 0: x = Math.random() * canvas.width; y = -50; break;
    //     case 1: x = canvas.width + 50; y = Math.random() * canvas.height; break;
    //     case 2: x = Math.random() * canvas.width; y = canvas.height + 50; break;
    //     default: x = -50; y = Math.random() * canvas.height;
    // }
    if(side == 0 ){
        x = Math.random() * canvas.width;
        y = -50; 
    }
    else if (side == 1){
        x = canvas.width + 50;
        y = Math.random() * canvas.height;
    }
    else if (side == 2){
        x = Math.random() * canvas.width;
        y = canvas.height + 50;
    }
    else {
        x = -50;
        y = Math.random() * canvas.height;
    }
    
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.5;
    
    return {x, y,
        velocity: {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed},
        hits: Math.floor(Math.random() * 4) + 1
    };
}

function fireMissile() {
    if (missiles.length >= 3) {
        return;
    }
    
    const angle = ship.rotation * Math.PI / 180;
    missiles.push({
        x: ship.x,
        y: ship.y,
        velocity: {
            x: Math.sin(angle) * 3,
            y: -Math.cos(angle) * 3
        }
    });
}

function checkCollisions() {
     // Ship-Asteroid
    asteroids.forEach(asteroid => {
        const dx = ship.x - asteroid.x;
        const dy = ship.y - asteroid.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < ASTEROID_SIZES[asteroid.hits] + 15) {
            gameState.lives = gameState.lives - 1;
            if (gameState.lives <= 0) {
                gameState.isGameOver = true;
                document.getElementById("game-over").style.display = "block";
            }
            ship.x = canvas.width / 2;
            ship.y = canvas.height / 2;
            ship.rotation = 0;
            ship.velocity = { x: 0, y: 0 };
        }
    });
    // Missile-Asteroid
    missiles = missiles.filter(missile => {
        let hit = false;
        asteroids = asteroids.map(asteroid => {
            const dx = missile.x - asteroid.x;
            const dy = missile.y - asteroid.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < ASTEROID_SIZES[asteroid.hits]) {
                hit = true;
                const newHits = asteroid.hits - 1;
                if (newHits <= 0) {
                    gameState.score += 100;
                    if (gameState.score % 1000 === 0) {
                        gameState.lives += 1;
                    }
                    return null;
                }
                return { ...asteroid, hits: newHits };
            }
            return asteroid;
        }).filter(Boolean);
        return !hit;
    });
    // Asteroid-Asteroid
    for (let i = 0; i < asteroids.length; i++) {
        for (let j = i + 1; j < asteroids.length; j++) {
            const dx = asteroids[i].x - asteroids[j].x;
            const dy = asteroids[i].y - asteroids[j].y
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const minDistance = ASTEROID_SIZES[asteroids[i].hits] + ASTEROID_SIZES[asteroids[j].hits];
            if (distance < minDistance) {
                
                const nx = dx / distance;
                const ny = dy / distance;
                
            
                const repelForce = 0.5;
                
                asteroids[i].velocity.x += nx * repelForce;
                asteroids[i].velocity.y += ny * repelForce;
                asteroids[j].velocity.x -= nx * repelForce
                asteroids[j].velocity.y -= ny * repelForce;
                
                const overlap = minDistance - distance;
                const moveX = (overlap * nx) / 2;
                const moveY = (overlap * ny) / 2;
                
                asteroids[i].x += moveX
                asteroids[i].y += moveY;
                asteroids[j].x -= moveX;
                asteroids[j].y -= moveY;
            }
        }
    }
}

function update() {
    if (gameState.isGameOver) return;

    //ship movment
    if (keys.ArrowUp) ship.y -= 2;
    if (keys.ArrowDown) ship.y += 2;
    if (keys.ArrowLeft) ship.x -= 2;
    if (keys.ArrowRight) ship.x += 2;
    if (keys.z) ship.rotation -= 4
    if (keys.c) ship.rotation += 5;
    if (keys.x) fireMissile();

    // Keep ship in bounds
    ship.x = Math.max(0, Math.min(canvas.width, ship.x));
    ship.y = Math.max(0, Math.min(canvas.height, ship.y));

   
    asteroids.forEach(asteroid => {
        asteroid.x += asteroid.velocity.x;
        asteroid.y += asteroid.velocity.y;
    });
    asteroids = asteroids.filter(asteroid => 
        asteroid.x > -100 && asteroid.x < canvas.width + 100 &&
        asteroid.y > -100 && asteroid.y < canvas.height + 100
    );

    
    missiles.forEach(missile => {
        missile.x += missile.velocity.x;
        missile.y += missile.velocity.y;
    });
    missiles = missiles.filter(missile =>
        missile.x >= 0 && missile.x <= canvas.width &&
        missile.y >= 0 && missile.y <= canvas.height
    );

  
    if (Math.random() < 0.02 && asteroids.length < 10) {
        asteroids.push(generateAsteroid());
    }

    checkCollisions();
    updateUI();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

  
    ctx.save();
    ctx.translate(ship.x, ship.y);
    ctx.rotate(ship.rotation * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -15);
    ctx.lineTo(10, 15);
    ctx.lineTo(0, 10);
    ctx.lineTo(-10, 15);
    ctx.closePath();
    ctx.fillStyle = 'lightblue';
    ctx.fill();
    ctx.restore();

    asteroids.forEach(asteroid => {
        ctx.beginPath();
        ctx.arc(asteroid.x, asteroid.y, ASTEROID_SIZES[asteroid.hits], 0, Math.PI * 2);
        ctx.fillStyle = ASTEROID_COLORS[asteroid.hits];
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(asteroid.hits.toString(), asteroid.x, asteroid.y);
    });

   
    missiles.forEach(missile => {
        ctx.beginPath();
        ctx.arc(missile.x, missile.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = 'yellow';
        ctx.fill();
    });
}

function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('lives').textContent = gameState.lives;
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function saveScore() {
    const playerName = document.getElementById("playerName").value;
    let highScores = JSON.parse(localStorage.getItem("asteroidsHighScores") || '[]');
    highScores.push({ name: playerName, score: gameState.score });
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 5);
    localStorage.setItem("asteroidsHighScores", JSON.stringify(highScores));
    
    const highScoresList = document.getElementById("highScores");
    highScoresList.innerHTML = highScores
        .map(score => `<li>${score.name}: ${score.score}</li>`)
        .join('');
}


window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

// canvas.addEventListener('touchstart', e => {
//     const touch = e.touches[0];
//     const rect = canvas.getBoundingClientRect();
//     const x = touch.clientX - rect.left;
//     const y = touch.clientY - rect.top;
    
//     if (y < rect.height / 3) keys.ArrowUp = true;
//     else if (y > (2 * rect.height) / 3) keys.ArrowDown = true;
//     if (x < rect.width / 3) keys.ArrowLeft = true;
//     else if (x > (2 * rect.width) / 3) keys.ArrowRight = true;
// });

// canvas.addEventListener('touchend', () => {
//     keys = {};
// });


init();
gameLoop();