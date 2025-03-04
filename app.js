const app = new Vue({
  el: '#app',
  data: {
    gridSize: 10,
    minesCount: 10,
    grid: [],
    gameOver: false,
    markedMines: 0
  },
  methods: {
    createGrid() {
      this.grid = Array.from({length: this.gridSize}, (_, x) => 
        Array.from({length: this.gridSize}, (_, y) => ({
          isMine: false,
          revealed: false,
          neighborMines: 0,
          flagged: false
        }))
      );

      let minesPlaced = 0;
      while (minesPlaced < this.minesCount) {
        const x = Math.floor(Math.random() * this.gridSize);
        const y = Math.floor(Math.random() * this.gridSize);
        if (!this.grid[x][y].isMine) {
          this.$set(this.grid[x], y, {...this.grid[x][y], isMine: true});
          minesPlaced++;
        }
      }

      this.grid.forEach((row, x) => row.forEach((cell, y) => {
        if (!cell.isMine) {
          this.$set(this.grid[x], y, {...cell, neighborMines: this.countNeighborMines(x, y)});
        }
      }));
    },

    countNeighborMines(x, y) {
      return [-1,0,1].reduce((count, i) => 
        count + [-1,0,1].reduce((subCount, j) => {
          const newX = x + i;
          const newY = y + j;
          return subCount + (
            newX >= 0 && newX < this.gridSize &&
            newY >= 0 && newY < this.gridSize &&
            this.grid[newX][newY].isMine
          ) ? 1 : 0;
        }, 0)
      , 0);
    },

    revealCell(x, y) {
      if (this.gameOver || this.grid[x][y].revealed) return;

      this.$set(this.grid[x], y, {...this.grid[x][y], revealed: true});

      if (this.grid[x][y].isMine) {
        this.gameOver = true;
        this.showLoseModal();
        return;
      }

      if (this.grid[x][y].neighborMines === 0) {
        [-1,0,1].forEach(i => [-1,0,1].forEach(j => {
          const newX = x + i;
          const newY = y + j;
          if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            this.revealCell(newX, newY);
          }
        }));
      }

      this.checkWin();
    },

    markMine(x, y) {
      if (this.gameOver || this.grid[x][y].revealed) return;
      
      const newFlagged = !this.grid[x][y].flagged;
      this.$set(this.grid[x], y, {...this.grid[x][y], flagged: newFlagged});
      this.markedMines += newFlagged ? 1 : -1;
    },

    checkWin() {
      const revealedSafe = this.grid.flat().filter(cell => 
        !cell.isMine && cell.revealed
      ).length;
      
      if (revealedSafe === this.gridSize ** 2 - this.minesCount) {
        this.gameOver = true;
        this.createFireworks();
        setTimeout(this.showWinModal, 1000);
      }
    },

    handleDoubleClick(x, y) {
      if (this.gameOver || !this.grid[x][y].revealed || this.grid[x][y].neighborMines === 0) return;
      
      let flagCount = 0;
      [-1,0,1].forEach(i => [-1,0,1].forEach(j => {
        const newX = x + i;
        const newY = y + j;
        if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
          if (this.grid[newX][newY].flagged) flagCount++;
        }
      }));
      
      if (flagCount === this.grid[x][y].neighborMines) {
        [-1,0,1].forEach(i => [-1,0,1].forEach(j => {
          const newX = x + i;
          const newY = y + j;
          if (newX >= 0 && newX < this.gridSize && newY >= 0 && newY < this.gridSize) {
            if (!this.grid[newX][newY].flagged) {
              this.revealCell(newX, newY);
            }
          }
        }));
      }
    },
    createFireworks() {
      const canvas = document.createElement('canvas');
      canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;';
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
          this.alpha -= 0.005;
        }
      }
      
      for (let i = 0; i < 200; i++) {
        particles.push(new Particle(
          canvas.width / 2 + Math.random() * 50 - 25,
          canvas.height / 2 + Math.random() * 50 - 25
        ));
      }
      
      const animate = () => {
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
      };
      animate();
    },
    showWinModal() {
      this.gameWon = true;
      this.gameOver = true;
    },
    showLoseModal() {
      this.gameWon = false;
      this.gameOver = true;
    }
  },
  mounted() {
    this.createGrid();
  }
});