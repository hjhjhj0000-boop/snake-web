const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const rankingList = document.getElementById('rankingList');
const pauseBtn = document.getElementById('pauseBtn');

const box = 20;
const canvasSize = 400;
const count = canvasSize / box;

let snake, direction, food, score, gameInterval, speed;
let paused = false;
let difficulty = 'easy';

function init() {
  snake = [{x: 9, y: 9}];
  direction = 'RIGHT';
  food = spawnFood();
  score = 0;
  speed = 100;
  paused = false;
  updateScore();
  drawRanking();
  if (gameInterval) clearInterval(gameInterval);
  gameInterval = setInterval(gameLoop, speed);
  updatePauseBtn();
}

function setSpeed(newSpeed) {
  speed = newSpeed;
  if (!paused) {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, speed);
  }
}

function restartGame() {
  init();
}

function setDifficulty(diff) {
  difficulty = diff;
  restartGame();
}

function togglePause() {
  paused = !paused;
  updatePauseBtn();
  if (paused) {
    clearInterval(gameInterval);
  } else {
    gameInterval = setInterval(gameLoop, speed);
  }
}

function updatePauseBtn() {
  if (pauseBtn) pauseBtn.textContent = paused ? '계속' : '멈춤';
}

function spawnFood() {
  let x, y;
  if (difficulty === 'easy') {
    // 벽에서 2칸 이상 떨어진 곳에만 생성
    do {
      x = Math.floor(Math.random() * (count - 4)) + 2;
      y = Math.floor(Math.random() * (count - 4)) + 2;
    } while (snake.some(seg => seg.x === x && seg.y === y));
  } else if (difficulty === 'hard') {
    // 벽에서 1칸 이내(가장자리) 또는 뱀 머리 근처에 생성
    let candidates = [];
    // 가장자리
    for (let i = 0; i < count; i++) {
      candidates.push({x: i, y: 0});
      candidates.push({x: i, y: count-1});
      candidates.push({x: 0, y: i});
      candidates.push({x: count-1, y: i});
    }
    // 뱀 머리 근처(2칸 이내)
    let head = snake[0];
    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        let nx = head.x + dx, ny = head.y + dy;
        if (nx >= 0 && nx < count && ny >= 0 && ny < count) {
          candidates.push({x: nx, y: ny});
        }
      }
    }
    // 뱀 몸통과 겹치지 않는 위치만
    candidates = candidates.filter(pos => !snake.some(seg => seg.x === pos.x && seg.y === pos.y));
    let pick = candidates[Math.floor(Math.random() * candidates.length)];
    if (pick) {
      x = pick.x;
      y = pick.y;
    } else {
      // fallback: 아무데나
      do {
        x = Math.floor(Math.random() * count);
        y = Math.floor(Math.random() * count);
      } while (snake.some(seg => seg.x === x && seg.y === y));
    }
  } else {
    // 기본: 아무데나
    do {
      x = Math.floor(Math.random() * count);
      y = Math.floor(Math.random() * count);
    } while (snake.some(seg => seg.x === x && seg.y === y));
  }
  return {x, y};
}

function gameLoop() {
  if (paused) return;
  draw();
}

function draw() {
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  // Draw snake
  ctx.fillStyle = 'lime';
  snake.forEach(seg => ctx.fillRect(seg.x * box, seg.y * box, box, box));

  // Draw food
  ctx.fillStyle = 'red';
  ctx.fillRect(food.x * box, food.y * box, box, box);

  // Move snake
  let head = { ...snake[0] };
  if (direction === 'LEFT') head.x--;
  if (direction === 'RIGHT') head.x++;
  if (direction === 'UP') head.y--;
  if (direction === 'DOWN') head.y++;

  // Check collision
  if (
    head.x < 0 || head.x >= count ||
    head.y < 0 || head.y >= count ||
    snake.some(seg => seg.x === head.x && seg.y === head.y)
  ) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Eat food
  if (head.x === food.x && head.y === food.y) {
    score++;
    updateScore();
    food = spawnFood();
  } else {
    snake.pop();
  }
}

function updateScore() {
  scoreEl.textContent = score;
}

function gameOver() {
  clearInterval(gameInterval);
  setTimeout(() => {
    const name = prompt('게임 오버! 이름을 입력하세요:');
    if (name) saveRanking(name, score);
    drawRanking();
    restartGame();
  }, 100);
}

function saveRanking(name, score) {
  let ranking = JSON.parse(localStorage.getItem('snakeRanking') || '[]');
  ranking.push({ name, score });
  ranking.sort((a, b) => b.score - a.score);
  ranking = ranking.slice(0, 10); // Top 10
  localStorage.setItem('snakeRanking', JSON.stringify(ranking));
}

function drawRanking() {
  let ranking = JSON.parse(localStorage.getItem('snakeRanking') || '[]');
  rankingList.innerHTML = '';
  ranking.forEach(r => {
    const li = document.createElement('li');
    li.textContent = `${r.name}: ${r.score}`;
    rankingList.appendChild(li);
  });
}

document.addEventListener('keydown', e => {
  if (e.key === ' ') {
    togglePause();
  }
  if (!paused) {
    if (e.key === 'ArrowLeft' && direction !== 'RIGHT') direction = 'LEFT';
    if (e.key === 'ArrowUp' && direction !== 'DOWN') direction = 'UP';
    if (e.key === 'ArrowRight' && direction !== 'LEFT') direction = 'RIGHT';
    if (e.key === 'ArrowDown' && direction !== 'UP') direction = 'DOWN';
  }
});

init();
