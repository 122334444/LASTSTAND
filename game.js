const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const frontPage = document.getElementById('frontPage');
const startButton = document.getElementById('startButton');
const controls = document.querySelector('.controls');

startButton.addEventListener('click', () => {
    frontPage.style.display = 'none';
    canvas.style.display = 'block';
    controls.style.display = 'block';
    init();
});

// Game variables
const gravity = 0.5;
let survivor;
let zombies = [];
let bullets = [];
let keys = {};
let score = 0;
let isPaused = false;

const zombieSprite = new Image();
const halfDeadZombieSprite = new Image();
zombieSprite.src = 'zombie.png';
halfDeadZombieSprite.src = 'half_dead_zombie.png';

let imagesLoaded = 0;
zombieSprite.onload = halfDeadZombieSprite.onload = () => {
    imagesLoaded++;
    if (imagesLoaded === 2) {
        // The game will start when the Play button is clicked
    }
};

// Initialize game objects and start the loop
function init() {
    survivor = new Survivor();
    gameLoop();
    setupButtonListeners();
}

// Game loop
function gameLoop() {
    if (!isPaused) {
        update();
        draw();
    }
    requestAnimationFrame(gameLoop);
}

// Update game objects
function update() {
    survivor.update();
    zombies.forEach(zombie => zombie.update());
    bullets.forEach(bullet => bullet.update());
    handleCollisions();
    spawnZombies();
}

// Draw game objects
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    survivor.draw();
    zombies.forEach(zombie => zombie.draw());
    bullets.forEach(bullet => bullet.draw());
    drawScore();
}


// Handle collisions
function handleCollisions() {
    bullets.forEach((bullet, bulletIndex) => {
        zombies.forEach((zombie, zombieIndex) => {
            if (bullet.isCollidingWith(zombie)) {
                zombies.splice(zombieIndex, 1);
                bullets.splice(bulletIndex, 1);
                score += 10;
            }
        });
    });

    zombies.forEach(zombie => {
        if (zombie.isCollidingWith(survivor)) {
            survivor.health -= 10;
            if (survivor.health <= 0) {
                alert('Game Over! Your score: ' + score);
                saveHighScore(score);
                document.location.reload();
            }
        }
    });
}

// Spawn zombies at intervals
let zombieSpawnTimer = 0;
function spawnZombies() {
    zombieSpawnTimer++;
    if (zombieSpawnTimer > 100) { // Adjust to control spawn rate
        zombies.push(new Zombie());
        zombieSpawnTimer = 0;
    }
}

// Draw score
function drawScore() {
    ctx.font = '15px Arial';
    ctx.fillStyle = 'white';
    ctx.fillText('Score: ' + score, 10, 20);
}

// Save high score to local storage
function saveHighScore(score) {
    let highScores = JSON.parse(localStorage.getItem('highScores')) || [];
    highScores.push(score);
    highScores.sort((a, b) => b - a);
    highScores = highScores.slice(0, 5);
    localStorage.setItem('highScores', JSON.stringify(highScores));
}

// Survivor class
class Survivor {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 60;
        this.width = 50;
        this.height = 50;
        this.color = 'blue';
        this.speed = 5;
        this.jumpSpeed = 10;
        this.dy = 0;
        this.isJumping = false;
        this.canShoot = true;
        this.angle = 0;
        this.health = 100;
    }

    update() {
        if (keys['ArrowLeft']) this.x -= this.speed;
        if (keys['ArrowRight']) this.x += this.speed;
        if (keys['ArrowUp']) this.angle -= 0.1;
        if (keys['ArrowDown']) this.angle += 0.1;

        if (this.angle < 0) this.angle += 2 * Math.PI;
        if (this.angle > 2 * Math.PI) this.angle -= 2 * Math.PI;

        if (keys['Space'] && !this.isJumping) {
            this.dy = -this.jumpSpeed;
            this.isJumping = true;
        }

        this.dy += gravity;
        this.y += this.dy;

        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.dy = 0;
            this.isJumping = false;
        }

        zombies.forEach(zombie => {
            if (!zombie.hasBeenJumpedOver && this.y + this.height <= zombie.y &&
                this.x + this.width > zombie.x && this.x < zombie.x + zombie.width) {
                score += 5;
                zombie.hasBeenJumpedOver = true;
            }
        });

        if (keys['KeyF'] && this.canShoot) {
            bullets.push(new Bullet(this.x + this.width / 2, this.y + this.height / 2, this.angle));
            this.canShoot = false;
            setTimeout(() => { this.canShoot = true; }, 200);
        }
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width / 2 + Math.cos(this.angle) * 30, this.y + this.height / 2 + Math.sin(this.angle) * 30);
        ctx.stroke();

        ctx.fillStyle = 'red';
        ctx.fillRect(this.x, this.y - 10, this.width * (this.health / 100), 5);
    }

    isCollidingWith(zombie) {
        return this.x < zombie.x + zombie.width &&
               this.x + this.width > zombie.x &&
               this.y < zombie.y + zombie.height &&
               this.y + this.height > zombie.y;
    }
}



// Zombie class
class Zombie {
    constructor() {
        this.fromLeft = Math.random() < 0.5;
        this.x = this.fromLeft ? 0 : canvas.width - 50;
        this.y = canvas.height - 60;
        this.width = 30;
        this.height = 50;
        this.speed = Math.random() * 1.5 + 0.5; // Different speeds
        this.frame = 0;
        this.frameCount = 4;
        this.spriteWidth = 50;
        this.spriteHeight = 50;
        this.sprite = Math.random() < 0.5 ? zombieSprite : halfDeadZombieSprite;
        this.frameInterval = 5;
        this.frameTimer = 0;
        this.hasBeenJumpedOver = false;
    }

    update() {
        if (this.fromLeft) {
            this.x += this.speed;
        } else {
            this.x -= this.speed;
        }

        this.frameTimer++;
        if (this.frameTimer >= this.frameInterval) {
            this.frame = (this.frame + 1) % this.frameCount;
            this.frameTimer = 0;
        }
    }

    draw() {
        ctx.drawImage(this.sprite, this.frame * this.spriteWidth, 0, 
                      this.spriteWidth, this.spriteHeight, 
                      this.x, this.y, this.spriteWidth, this.spriteHeight);
    }

    isCollidingWith(object) {
        return this.x < object.x + object.width &&
               this.x + this.width > object.x &&
               this.y < object.y + object.height &&
               this.y + this.height > object.y;
    }
}
// Bullet class
class Bullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.color = 'red';
        this.speed = 5; // Reduced speed to half
        this.angle = angle;
        this.dx = this.speed * Math.cos(angle);
        this.dy = this.speed * Math.sin(angle) - 5;
    }

    update() {
        this.x += this.dx;
        this.y += this.dy;
        this.dy += gravity * 0.1; // Simulate projectile motion
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();
    }

    isCollidingWith(zombie) {
        const distX = this.x - (zombie.x + zombie.width / 2);
        const distY = this.y - (zombie.y + zombie.height / 2);
        const distance = Math.sqrt(distX * distX + distY * distY);
        return distance < this.radius + zombie.width / 2;
    }
}
// Setup button event listeners
function setupButtonListeners() {
    document.getElementById('leftShiftButton').addEventListener('mousedown', () => {
        keys['ArrowLeft'] = true;
    });
    document.getElementById('leftShiftButton').addEventListener('mouseup', () => {
        keys['ArrowLeft'] = false;
    });

    document.getElementById('rightShiftButton').addEventListener('mousedown', () => {
        keys['ArrowRight'] = true;
    });
    document.getElementById('rightShiftButton').addEventListener('mouseup', () => {
        keys['ArrowRight'] = false;
    });

    document.getElementById('jumpButton').addEventListener('mousedown', () => {
        keys['Space'] = true;
    });
    document.getElementById('jumpButton').addEventListener('mouseup', () => {
        keys['Space'] = false;
    });

    document.getElementById('rotateGunButton').addEventListener('mousedown', () => {
        keys['ArrowUp'] = true;
    });
    document.getElementById('rotateGunButton').addEventListener('mouseup', () => {
        keys['ArrowUp'] = false;
    });

    document.getElementById('fireGunButton').addEventListener('mousedown', () => {
        keys['KeyF'] = true;
    });
    document.getElementById('fireGunButton').addEventListener('mouseup', () => {
        keys['KeyF'] = false;
    });
}

// Handle key events
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyP') {
        isPaused = !isPaused;
    } else {
        keys[e.code] = true;
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});