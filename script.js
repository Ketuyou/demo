const GRID_SIZE = 10;
const MINES_COUNT = 10;

let grid = [];
let gameOver = false;
let markedMines = 0;

function createGrid() {
  // 初始化网格
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = {
        isMine: false,
        revealed: false,
        neighborMines: 0
      };
    }
  }

  // 随机布置地雷
  let minesPlaced = 0;
  while (minesPlaced < MINES_COUNT) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!grid[x][y].isMine) {
      grid[x][y].isMine = true;
      minesPlaced++;
    }
  }

  // 计算周围地雷数量
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!grid[i][j].isMine) {
        grid[i][j].neighborMines = countNeighborMines(i, j);
      }
    }
  }
}

function countNeighborMines(x, y) {
  let count = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newX = x + i;
      const newY = y + j;
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
        if (grid[newX][newY].isMine) count++;
      }
    }
  }
  return count;
}

function revealCell(x, y) {
  if (gameOver || grid[x][y].revealed) return;

  grid[x][y].revealed = true;
  const cell = document.getElementById(`cell-${x}-${y}`);
  
  if (grid[x][y].isMine) {
    cell.classList.add('mine');
    gameOver = true;
    showLoseModal();
    return;
  }

  cell.classList.add('revealed');
  cell.textContent = grid[x][y].neighborMines || '';

  if (grid[x][y].neighborMines === 0) {
    // 自动展开周围空白单元格
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
          revealCell(newX, newY);
        }
      }
    }
  }

  checkWin();
}

function createFireworks() {
  const canvas = document.createElement('canvas');
  canvas.id = 'fireworks';
  canvas.style.position = 'fixed';
  canvas.style.top = 0;
  canvas.style.left = 0;
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.alpha = 1;
      this.color = `hsl(${Math.random() * 360}, 100%, 50%)`;
      this.velocity = {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8
      };
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
    update() {
      this.x += this.velocity.x;
      this.y += this.velocity.y;
      this.alpha -= 0.005; // 减慢alpha衰减速度延长动画时间
    }
  }

  for (let i = 0; i < 200; i++) {
    particles.push(new Particle(
      canvas.width / 2 + Math.random() * 50 - 25,
      canvas.height / 2 + Math.random() * 50 - 25
    ));
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach((particle, i) => {
      if (particle.alpha > 0) {
        particle.draw();
        particle.update();
      } else {
        particles.splice(i, 1);
      }
    });
    if (particles.length > 0) {
      requestAnimationFrame(animate);
    } else {
      canvas.remove();
    }
  }
  animate();
}

function showWinModal() {
  const modal = document.createElement('div');
  modal.id = 'win-modal';
  modal.style.position = 'fixed';
  modal.style.bottom = '20px';
  modal.style.left = '50%';
  modal.style.transform = 'translateX(-50%)';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>🎉 胜利！🎉</h2>
      <button onclick="location.reload()">再玩一次</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function showLoseModal() {
  const modal = document.createElement('div');
  modal.id = 'win-modal';
  modal.style.position = 'fixed';
  modal.style.bottom = '20px';
  modal.style.left = '50%';
  modal.style.transform = 'translateX(-50%)';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>💥 游戏结束！💥</h2>
      <button onclick="location.reload()">重新开始</button>
    </div>
  `;
  document.body.appendChild(modal);
}

function checkWin() {
  let revealedSafeCells = 0;
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!grid[i][j].isMine && grid[i][j].revealed) {
        revealedSafeCells++;
      }
    }
  }
  if (revealedSafeCells === GRID_SIZE * GRID_SIZE - MINES_COUNT) {
    gameOver = true;
    createFireworks();
    setTimeout(showWinModal, 1000);
  }
}

function initGame() {
  const gridContainer = document.getElementById('minesweeperGrid');
  gridContainer.innerHTML = '';
  
  createGrid();
  
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.id = `cell-${i}-${j}`;
      cell.addEventListener('click', () => revealCell(i, j));
      cell.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        markMine(i, j);
      });
      cell.addEventListener('dblclick', (e) => {
        handleDoubleClick(i, j, e);
      });
      gridContainer.appendChild(cell);
    }
  }
}

function markMine(x, y) {
  if (gameOver || grid[x][y].revealed) return;
  const cell = document.getElementById(`cell-${x}-${y}`);
  
  if (cell.classList.contains('flagged')) {
    cell.classList.remove('flagged');
    markedMines--;
  } else if (markedMines < MINES_COUNT) {
    cell.classList.add('flagged');
    markedMines++;
  }
  document.getElementById('mineCount').textContent = MINES_COUNT - markedMines;
}

function handleDoubleClick(x, y, e) {
  e.preventDefault();
  if (gameOver || !grid[x][y].revealed || grid[x][y].neighborMines === 0) return;
  
  let flagCount = 0;
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const newX = x + i;
      const newY = y + j;
      if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
        const cell = document.getElementById(`cell-${newX}-${newY}`);
        if (cell.classList.contains('flagged')) flagCount++;
      }
    }
  }
  
  if (flagCount === grid[x][y].neighborMines) {
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
          const cell = document.getElementById(`cell-${newX}-${newY}`);
          if (!cell.classList.contains('flagged')) {
            revealCell(newX, newY);
          }
        }
      }
    }
  }
}

// 初始化游戏
initGame();