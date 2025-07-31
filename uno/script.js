class Card {
    constructor(color, value) {
        this.color = color; // 颜色: red, yellow, green, blue, black
        this.value = value; // 数值: 0-9, draw2, reverse, skip, wild, wild4
        this.element = null;
    }

    // 创建卡牌元素
    createElement() {
        const card = document.createElement('div');
        card.className = `card ${this.color}`;
        card.dataset.color = this.color;
        card.dataset.value = this.value;
        card.textContent = this.getValueText();
        this.element = card;
        return card;
    }

    // 获取卡牌显示文本
    getValueText() {
        const valueMap = {
            'draw2': '+2',
            'reverse': '↺',
            'skip': '⊘',
            'wild': 'W',
            'wild4': 'W+4'
        };
        return valueMap[this.value] || this.value;
    }
}

class Deck {
    constructor() {
        this.cards = [];
        this.createDeck();
        this.shuffle();
    }

    // 创建一副完整的UNO牌
    createDeck() {
        const colors = ['red', 'yellow', 'green', 'blue'];
        const values = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'draw2', 'reverse', 'skip'];

        // 添加普通牌
        colors.forEach(color => {
            // 0牌每种颜色1张
            this.cards.push(new Card(color, '0'));
            // 1-9和功能牌每种颜色2张
            values.slice(1).forEach(value => {
                this.cards.push(new Card(color, value));
                this.cards.push(new Card(color, value));
            });
        });

        // 添加万能牌
        for (let i = 0; i < 4; i++) {
            this.cards.push(new Card('black', 'wild'));
            this.cards.push(new Card('black', 'wild4'));
        }
    }

    // 洗牌
    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    // 抽牌
    draw() {
        return this.cards.pop();
    }
}

class Player {
    constructor(isComputer = false) {
        this.hand = [];
        this.isComputer = isComputer;
    }

    // 添加卡牌到手牌
    addCard(card) {
        this.hand.push(card);
        if (!this.isComputer) {
            this.sortHand();
        }
    }

    // 从手牌移除卡牌
    removeCard(card) {
        const index = this.hand.indexOf(card);
        if (index > -1) {
            this.hand.splice(index, 1);
            return true;
        }
        return false;
    }

    // 排序手牌（按颜色和数值）
    sortHand() {
        const colorOrder = { 'red': 0, 'yellow': 1, 'green': 2, 'blue': 3, 'black': 4 };
        const valueOrder = {
            '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
            'skip': 10, 'reverse': 11, 'draw2': 12, 'wild': 13, 'wild4': 14
        };

        this.hand.sort((a, b) => {
            if (colorOrder[a.color] !== colorOrder[b.color]) {
                return colorOrder[a.color] - colorOrder[b.color];
            }
            return valueOrder[a.value] - valueOrder[b.value];
        });
    }

    // 检查是否有可打的牌
    hasValidCard(topCard, currentColor) {
        return this.hand.some(card => {
            if (card.color === 'black') return true; // 万能牌总是可以打
            if (card.color === currentColor) return true;
            if (card.value === topCard.value) return true;
            return false;
        });
    }

    // 获取可打的牌
    getValidCards(topCard, currentColor) {
        return this.hand.filter(card => {
            if (card.color === 'black') return true;
            if (card.color === currentColor) return true;
            if (card.value === topCard.value) return true;
            return false;
        });
    }
}

class Game {
    constructor() {
        this.player = new Player();
        this.computer = new Player(true);
        this.deck = new Deck();
        this.discardPile = [];
        this.currentPlayer = null;
        this.currentColor = null;
        this.gameActive = false;
        this.direction = 1; // 1: 顺时针, -1: 逆时针
        this.wildColor = null;

        // DOM元素
        this.discardPileElement = document.getElementById('discardPile');
        this.drawPileElement = document.getElementById('drawPile');
        this.playerHandElement = document.getElementById('playerHand');
        this.playerCardCountElement = document.getElementById('player-card-count');
        this.computerCardCountElement = document.getElementById('computer-card-count');
        this.startButton = document.getElementById('startGame');
        this.statusMessageElement = document.getElementById('statusMessage');
        this.colorSelection = document.getElementById('colorSelection');
        this.colorOptions = document.querySelectorAll('.color-option');

        // 事件监听
        this.startButton.addEventListener('click', () => this.startGame());
        this.drawPileElement.addEventListener('click', () => this.drawCard());
    }

    // 开始游戏
    startGame() {
        // 重置游戏状态
        this.resetGame();

        // 发牌
        for (let i = 0; i < 7; i++) {
            this.player.addCard(this.deck.draw());
            this.computer.addCard(this.deck.draw());
        }

        // 初始化弃牌堆
        do {
            const topCard = this.deck.draw();
            this.discardPile.push(topCard);
            this.currentColor = topCard.color !== 'black' ? topCard.color : 'red';
        } while (this.discardPile[0].color === 'black'); // 确保首张不是万能牌

        // 设置当前玩家
        this.currentPlayer = this.player;
        this.gameActive = true;

        // 更新UI
        this.updateUI();
        this.updateStatusMessage('你的回合，请出牌');
        this.startButton.disabled = true;
    }

    // 重置游戏
    resetGame() {
        this.player = new Player();
        this.computer = new Player(true);
        this.deck = new Deck();
        this.discardPile = [];
        this.currentPlayer = null;
        this.currentColor = null;
        this.gameActive = false;
        this.direction = 1;
        this.wildColor = null;

        // 清空UI
        this.playerHandElement.innerHTML = '';
        this.discardPileElement.innerHTML = '';
        this.drawPileElement.innerHTML = 'UNO';
    }

    // 更新UI
    updateUI() {
        // 更新玩家手牌
        this.playerHandElement.innerHTML = '';
        this.player.hand.forEach(card => {
            const cardElement = card.createElement();
            cardElement.addEventListener('click', async () => await this.playCard(card));
            this.playerHandElement.appendChild(cardElement);
        });

        // 更新牌堆显示
        this.discardPileElement.innerHTML = '';
        if (this.discardPile.length > 0) {
            const topCard = this.discardPile[this.discardPile.length - 1];
            const cardElement = topCard.createElement();
            this.discardPileElement.appendChild(cardElement);
        }

        // 更新卡牌数量
        this.playerCardCountElement.textContent = this.player.hand.length;
        this.computerCardCountElement.textContent = this.computer.hand.length;
    }

    // 更新状态消息
    updateStatusMessage(message) {
        this.statusMessageElement.textContent = message;
    }

    // 抽牌
    drawCard() {
        if (!this.gameActive || this.currentPlayer !== this.player) return;

        const card = this.deck.draw();
        if (card) {
            this.player.addCard(card);
            this.updateUI();
            this.updateStatusMessage('你抽了一张牌');

            // 如果抽到的牌可以打，给玩家一个出牌机会
            if (!this.player.hasValidCard(this.getTopCard(), this.getCurrentColor())) {
                setTimeout(() => this.switchPlayer(), 1000);
            }
        } else {
            // 牌堆为空，重新洗牌弃牌堆（保留最上面一张）
            this.reshuffleDeck();
            this.updateStatusMessage('牌堆已重新洗牌');
        }
    }

    // 重新洗牌弃牌堆
    reshuffleDeck() {
        const topCard = this.discardPile.pop();
        this.deck.cards = this.discardPile;
        this.discardPile = [topCard];
        this.deck.shuffle();
    }

    // 出牌
    async playCard(card) {
        if (!this.gameActive || this.currentPlayer !== this.player) return;

        const topCard = this.getTopCard();
        const currentColor = this.getCurrentColor();

        // 检查牌是否可以打
        if (!this.isValidMove(card, topCard, currentColor)) {
            this.updateStatusMessage('不能打这张牌，请选择其他牌');
            return;
        }

        // 从手牌移除并添加到弃牌堆
        this.player.removeCard(card);
        this.discardPile.push(card);

        // 处理特殊牌效果
        await this.handleSpecialCard(card);

        // 检查是否获胜
        if (this.player.hand.length === 0) {
            this.endGame(this.player);
            return;
        }

        // 检查UNO喊叫（简单处理，实际游戏需要玩家自己喊UNO）
        if (this.player.hand.length === 1) {
            this.updateStatusMessage('UNO!');
        }

        // 切换玩家
        this.switchPlayer();
    }

    // 检查是否是有效移动
    isValidMove(card, topCard, currentColor) {
        if (card.color === 'black') return true;
        if (card.color === currentColor) return true;
        if (card.value === topCard.value) return true;
        return false;
    }

    // 处理特殊牌效果
    async handleSpecialCard(card) {
        switch (card.value) {
            case 'skip':
                this.switchPlayer(); // 跳过下一个玩家
                break;
            case 'reverse':
                this.direction *= -1;
                this.updateStatusMessage('方向已反转');
                break;
            case 'draw2':
                this.handleDrawCards(2);
                break;
            case 'wild':
                await this.chooseWildColor();
                break;
            case 'wild4':
                await this.chooseWildColor();
                this.handleDrawCards(4);
                break;
        }

        // 如果不是黑色牌，更新当前颜色
        if (card.color !== 'black') {
            this.currentColor = card.color;
        }
    }

    // 选择万能牌颜色
    chooseWildColor() {
        return new Promise((resolve) => {
            if (this.currentPlayer === this.player) {
                // 玩家选择颜色 - 使用UI界面替代prompt
                this.colorSelection.classList.add('active');
                this.updateStatusMessage('请选择一个颜色');

                const handleColorSelect = (e) => {
                    const selectedColor = e.target.dataset.color;
                    this.currentColor = selectedColor;
                    this.colorSelection.classList.remove('active');
                    this.updateStatusMessage(`你选择了${this.getColorName(this.currentColor)}`);

                    // 移除事件监听器
                    this.colorOptions.forEach(option => {
                        option.removeEventListener('click', handleColorSelect);
                    });
                    resolve();
                };

                // 添加事件监听器
                this.colorOptions.forEach(option => {
                    option.addEventListener('click', handleColorSelect);
                });
            } else {
            // 电脑选择颜色（选择手牌中数量最多的颜色）
            const colorCount = {
                'red': 0,
                'yellow': 0,
                'green': 0,
                'blue': 0
            };

            this.computer.hand.forEach(card => {
                if (colorCount.hasOwnProperty(card.color)) {
                    colorCount[card.color]++;
                }
            });

            // 找出数量最多的颜色
            let maxCount = 0;
            let chosenColor = 'red';
            for (const color in colorCount) {
                if (colorCount[color] > maxCount) {
                    maxCount = colorCount[color];
                    chosenColor = color;
                }
            }

            this.currentColor = chosenColor;
            this.updateStatusMessage(`电脑选择了${this.getColorName(this.currentColor)}`);
        }
        })
    }

    // 获取颜色名称
    getColorName(color) {
        const colorNames = {
            'red': '红色',
            'yellow': '黄色',
            'green': '绿色',
            'blue': '蓝色'
        };
        return colorNames[color] || color;
    }

    // 处理抽牌效果
    handleDrawCards(count) {
        const nextPlayer = this.getNextPlayer();
        for (let i = 0; i < count; i++) {
            if (this.deck.cards.length === 0) {
                this.reshuffleDeck();
            }
            nextPlayer.addCard(this.deck.draw());
        }
        this.updateUI();
    }

    // 切换玩家
    switchPlayer() {
        this.currentPlayer = this.getNextPlayer();
        this.updateUI();

        if (this.currentPlayer === this.player) {
            this.updateStatusMessage('你的回合，请出牌');
        } else {
            this.updateStatusMessage('电脑正在思考...');
            setTimeout(() => this.computerTurn(), 1000);
        }
    }

    // 获取下一个玩家
    getNextPlayer() {
        return this.currentPlayer === this.player ? this.computer : this.player;
    }

    // 电脑回合
    computerTurn() {
        if (!this.gameActive || this.currentPlayer !== this.computer) return;

        const topCard = this.getTopCard();
        const currentColor = this.getCurrentColor();
        const validCards = this.computer.getValidCards(topCard, currentColor);

        if (validCards.length > 0) {
            // 简单AI：优先打功能牌，然后是普通牌
            const specialCards = validCards.filter(card => 
                card.value === 'draw2' || card.value === 'reverse' || card.value === 'skip' || 
                card.value === 'wild' || card.value === 'wild4'
            );

            const chosenCard = specialCards.length > 0 ? specialCards[0] : validCards[0];
            this.computer.removeCard(chosenCard);
            this.discardPile.push(chosenCard);

            this.updateStatusMessage(`电脑打了${this.getCardName(chosenCard)}`);
            this.handleSpecialCard(chosenCard);

            // 检查电脑是否获胜
            if (this.computer.hand.length === 0) {
                this.endGame(this.computer);
                return;
            }

            // 电脑UNO
            if (this.computer.hand.length === 1) {
                this.updateStatusMessage('电脑喊UNO!');
            }

            setTimeout(() => this.switchPlayer(), 1500);
        } else {
            // 电脑抽牌
            this.updateStatusMessage('电脑没有可打的牌，抽了一张牌');
            this.computer.addCard(this.deck.draw());
            this.updateUI();

            // 检查抽牌后是否可以打
            setTimeout(() => {
                const newValidCards = this.computer.getValidCards(topCard, currentColor);
                if (newValidCards.length > 0) {
                    this.updateStatusMessage('电脑抽到了可以打的牌');
                    setTimeout(() => this.computerTurn(), 1000);
                } else {
                    this.updateStatusMessage('电脑仍然没有可打的牌，轮到你了');
                    setTimeout(() => this.switchPlayer(), 1000);
                }
            }, 1000);
        }

        this.updateUI();
    }

    // 获取卡牌名称
    getCardName(card) {
        let colorName = this.getColorName(card.color);
        if (card.color === 'black') {
            return card.value === 'wild' ? '万能牌' : '万能+4牌';
        }

        switch (card.value) {
            case 'draw2': return `${colorName}+2`;
            case 'reverse': return `${colorName}反转`;
            case 'skip': return `${colorName}跳过`;
            default: return `${colorName}${card.value}`;
        }
    }

    // 检查游戏是否结束
    endGame(winner) {
        this.gameActive = false;
        this.startButton.disabled = false;

        if (winner === this.player) {
            this.updateStatusMessage('恭喜你赢了！点击"开始游戏"再来一局');
            this.showWinAnimation();
        } else {
            this.updateStatusMessage('电脑赢了！点击"开始游戏"再来一局');
        }
    }

    // 显示胜利动画
    showWinAnimation() {
        const container = document.querySelector('.game-container');
        container.classList.add('win-animation');
        setTimeout(() => container.classList.remove('win-animation'), 2000);
    }

    // 获取当前弃牌堆顶的牌
    getTopCard() {
        return this.discardPile[this.discardPile.length - 1];
    }

    // 获取当前颜色
    getCurrentColor() {
        return this.currentColor;
    }

    // 检查移动是否有效
    isValidMove(card, topCard, currentColor) {
        if (card.color === 'black') return true;
        if (card.color === currentColor) return true;
        if (card.value === topCard.value) return true;
        return false;
    }
}

// 初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    const game = new Game();
});