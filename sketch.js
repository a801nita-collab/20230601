let particles = [];
let missiles = [];
let explosions = [];
const palette = ['#f94144', '#f3722c', '#f8961e', '#f9844a', '#f9c74f', '#90be6d', '#43aa8b', '#4d908e', '#577590', '#277da1'];
let lastSpawnTime = 0;
let score = 0;
let shakeIntensity = 0; // 震動強度變數
const MAX_PARTICLES = 30; // 新增粒子數量上限
let overloadStartTime = 0; // 記錄粒子超過20個的開始時間
let restartBtn;

function setup() {
  // 建立全螢幕畫布
  createCanvas(windowWidth, windowHeight);
  
  // 建立重新開始按鈕
  restartBtn = createButton('重新開始');
  restartBtn.position(width / 2 - 50, height / 2 + 80);
  restartBtn.style('font-size', '20px');
  restartBtn.style('padding', '10px 20px');
  restartBtn.style('background-color', '#f9c74f');
  restartBtn.style('cursor', 'pointer');
  restartBtn.style('border', 'none');
  restartBtn.style('border-radius', '5px');
  restartBtn.mousePressed(resetGame);
  restartBtn.hide();

  // 初始產生 10 個物件
  initParticles();
  lastSpawnTime = millis();
}

function draw() {
  background(0); // 全螢幕背景顏色為黑

  // 粒子產生速度隨著分數加快
  // 每 10 分減少 200ms 間隔，最低限制在 600ms，且檢查是否超過數量上限
  let spawnInterval = max(600, 5000 - (score * 20));
  if (millis() - lastSpawnTime > spawnInterval && particles.length < MAX_PARTICLES) {
    particles.push(new Particle());
    lastSpawnTime = millis();
  }

  // 處理震動特效
  push();
  if (shakeIntensity > 0) {
    // 根據強度隨機位移畫布
    translate(random(-shakeIntensity, shakeIntensity), random(-shakeIntensity, shakeIntensity));
    shakeIntensity *= 0.85; // 震動衰減
    if (shakeIntensity < 0.1) shakeIntensity = 0;
  }

  // 繪製中心指標（箭頭）
  drawCenterArrow();

  // 更新與顯示所有粒子物件
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    
    // 粒子間碰撞
    for (let j = i + 1; j < particles.length; j++) {
      particles[i].checkCollision(particles[j]);
    }

    // 檢查是否被飛彈擊中
    for (let m = missiles.length - 1; m >= 0; m--) {
      let d = dist(particles[i].x, particles[i].y, missiles[m].x, missiles[m].y);
      if (d < particles[i].size / 2) {
        // 產生爆炸特效
        explosions.push(new Explosion(particles[i].x, particles[i].y, particles[i].color));
        // 移除粒子與飛彈
        particles.splice(i, 1);
        missiles.splice(m, 1);
        shakeIntensity = 15; // 擊中時產生震動
        score += 10; // 計分動作
        break; 
      }
    }

    if (particles[i]) particles[i].display();
  }

  // 更新與顯示飛彈
  for (let i = missiles.length - 1; i >= 0; i--) {
    missiles[i].update();
    missiles[i].display();
    if (missiles[i].offScreen()) {
      missiles.splice(i, 1);
    }
  }

  // 更新與顯示爆炸畫面
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].display();
    if (explosions[i].isFinished()) {
      explosions.splice(i, 1);
    }
  }

  displayScore();

  pop(); // 結束震動影響範圍

  // 檢查失敗條件：粒子超過20個持續8秒
  if (particles.length > 20) {
    if (overloadStartTime === 0) overloadStartTime = millis();
    let elapsed = millis() - overloadStartTime;
    
    if (elapsed > 8000) {
      background(150, 0, 0, 180); // 失敗時顯示紅色遮罩
      fill(255);
      textSize(100);
      textAlign(CENTER, CENTER);
      text("通關失敗", width / 2, height / 2);
      restartBtn.show();
      noLoop();
    } else {
      // 在畫面上方顯示警告倒數
      fill(255, 50, 50);
      textSize(24);
      textAlign(CENTER);
      text("警告：粒子過多！剩餘 " + nf((8000 - elapsed) / 1000, 1, 1) + "s", width / 2, height / 2 + 150);
    }
  } else {
    overloadStartTime = 0; // 數量降回 20 個以下則重置計時器
  }

  // 檢查勝利條件：分數達 1000 遊戲停止
  if (score >= 1000) {
    background(0, 150); // 加上一層半透明黑色遮罩，讓文字更突出
    fill(255, 255, 0); // 使用醒目的黃色
    textSize(100);
    textAlign(CENTER, CENTER);
    text("你成功了", width / 2, height / 2);
    restartBtn.show(); // 顯示重新開始按鈕
    noLoop(); // 停止 p5.js 的 draw 迴圈，遊戲畫面會凍結
  }
}

function initParticles() {
  particles = [];
  for (let i = 0; i < 10; i++) {
    particles.push(new Particle());
  }
}

function resetGame() {
  score = 0;
  missiles = [];
  explosions = [];
  overloadStartTime = 0; // 重置計時器
  initParticles();
  lastSpawnTime = millis();
  restartBtn.hide();
  loop(); // 重新啟動繪圖迴圈
}

function drawCenterArrow() {
  push();
  translate(width / 2, height / 2);
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  rotate(angle);
  
  stroke(255);
  strokeWeight(3);
  line(0, 0, 60, 0); // 箭頭主線
  line(60, 0, 45, -10); // 箭頭側邊
  line(60, 0, 45, 10);
  
  fill(255);
  noStroke();
  ellipse(0, 0, 15, 15); // 中心圓點
  pop();
}

function displayScore() {
  fill(255);
  noStroke();
  textSize(28);
  textAlign(LEFT, TOP);
  text("SCORE: " + score, 30, 30);
}

function mousePressed() {
  if (mouseButton === LEFT) {
    // 按下左鍵發射飛彈
    fireMissile();
  }
}

function keyPressed() {
  if (key === ' ') {
    // 按下空白鍵也可以發射飛彈
    fireMissile();
  }
}

function fireMissile() {
  // 共通的飛彈發射邏輯
  let angle = atan2(mouseY - height / 2, mouseX - width / 2);
  missiles.push(new Missile(width / 2, height / 2, angle));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  restartBtn.position(width / 2 - 50, height / 2 + 80);
}

class Particle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.size = random(60, 110); // 隨機大小
    this.color = color(random(palette)); // 隨機採用指定的顏色
    this.vx = random(-2.5, 2.5); // 每個粒子移動速度不一樣
    this.vy = random(-2.5, 2.5);
    
    // 預先計算星狀頂點的縮放比例，增加每個物件獨有的破碎感
    this.points = 12;
    this.offsets = [];
    for (let i = 0; i < this.points; i++) {
      this.offsets.push(random(0.75, 1.25));
    }
  }

  update() {
    // 讓物件在畫面上緩慢移動
    this.x += this.vx;
    this.y += this.vy;

    // 簡單的邊界碰撞檢測
    if (this.x < 0 || this.x > width) this.vx *= -1;
    if (this.y < 0 || this.y > height) this.vy *= -1;
  }

  checkCollision(other) {
    let dx = other.x - this.x;
    let dy = other.y - this.y;
    let distance = sqrt(dx * dx + dy * dy);
    let minDistance = (this.size + other.size) / 2;

    if (distance < minDistance) {
      // 計算碰撞角度
      let angle = atan2(dy, dx);
      let overlap = minDistance - distance;

      // 1. 修正重疊問題 (防止物件黏在一起)
      this.x -= cos(angle) * (overlap / 2);
      this.y -= sin(angle) * (overlap / 2);
      other.x += cos(angle) * (overlap / 2);
      other.y += sin(angle) * (overlap / 2);

      // 2. 簡單的速度交換 (模擬彈開效果)
      let tempVx = this.vx;
      let tempVy = this.vy;
      this.vx = other.vx;
      this.vy = other.vy;
      other.vx = tempVx;
      other.vy = tempVy;
    }
  }

  display() {
    push();
    translate(this.x, this.y);

    let d = dist(mouseX, mouseY, this.x, this.y);
    let isNear = d < this.size * 1.2; // 偵測滑鼠是否靠近

    fill(this.color);
    noStroke();

    if (isNear) {
      // 滑鼠靠近時變為圓圈
      ellipse(0, 0, this.size);
    } else {
      // 平時為星狀圓弧外表
      beginShape();
      for (let i = 0; i < this.points; i++) {
        let angle = map(i, 0, this.points, 0, TWO_PI);
        let r = (this.size / 2) * this.offsets[i];
        vertex(r * cos(angle), r * sin(angle));
      }
      endShape(CLOSE);
    }

    // 繪製眼睛（白色部分）
    fill(255);
    let eyeX = this.size * 0.2;
    let eyeY = -this.size * 0.12;
    let eyeSize = this.size * 0.25;
    ellipse(-eyeX, eyeY, eyeSize);
    ellipse(eyeX, eyeY, eyeSize);

    // 繪製黑眼珠（計算與滑鼠的夾角）
    fill(0);
    let pupilSize = eyeSize * 0.5;
    let angle = atan2(mouseY - (this.y + eyeY), mouseX - this.x);
    let pupilOffset = eyeSize * 0.2;
    
    // 左、右眼珠隨滑鼠移動
    ellipse(-eyeX + cos(angle) * pupilOffset, eyeY + sin(angle) * pupilOffset, pupilSize);
    ellipse(eyeX + cos(angle) * pupilOffset, eyeY + sin(angle) * pupilOffset, pupilSize);

    // 繪製圓弧笑嘴
    noFill();
    stroke(0);
    strokeWeight(this.size * 0.04);
    arc(0, this.size * 0.15, this.size * 0.45, this.size * 0.3, 0.2, PI - 0.2);

    pop();
  }
}

class Missile {
  constructor(x, y, angle) {
    this.x = x;
    this.y = y;
    this.speed = 8;
    this.vx = cos(angle) * this.speed;
    this.vy = sin(angle) * this.speed;
    this.size = 8;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
  }

  display() {
    fill(255, 255, 0); // 飛彈為黃色
    noStroke();
    ellipse(this.x, this.y, this.size);
  }

  offScreen() {
    return (this.x < 0 || this.x > width || this.y < 0 || this.y > height);
  }
}

class Explosion {
  constructor(x, y, col) {
    this.x = x;
    this.y = y;
    this.particles = [];
    this.alpha = 255;
    // 產生 15 個碎片
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        vx: random(-3, 3),
        vy: random(-3, 3),
        x: 0,
        y: 0
      });
    }
    this.color = col;
  }

  update() {
    for (let p of this.particles) {
      p.x += p.vx;
      p.y += p.vy;
    }
    this.alpha -= 5; // 逐漸淡出
  }

  display() {
    push();
    translate(this.x, this.y);
    stroke(this.color.levels[0], this.color.levels[1], this.color.levels[2], this.alpha);
    strokeWeight(3);
    for (let p of this.particles) {
      point(p.x, p.y);
    }
    pop();
  }

  isFinished() {
    return this.alpha <= 0;
  }
}
