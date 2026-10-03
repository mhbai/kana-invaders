// 假名打字擊墜戰核心引擎 (Kana Typing Defense)
class KanaTypingGame {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // 遊戲狀態
    this.isPlaying = false;
    this.isPaused = false;
    this.animationFrameId = null;

    // 玩家屬性
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('kana_defense_high_score') || '0', 10);
    this.maxLives = 5;
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalTyped = 0;
    this.correctTyped = 0;
    this.defeatedCount = 0;

    // 實體清單
    this.targets = [];
    this.particles = [];
    this.lasers = [];
    this.lockedTarget = null;
    this.mistakeList = []; // 儲存本局失誤的項目供覆盤

    // 遊戲設定
    this.mode = 'seion'; // 'seion', 'dakuon', 'yoon', 'katakana', 'mixed', 'words'
    this.difficulty = 'normal'; // 'easy', 'normal', 'hard'
    this.showHints = true;

    // 掉落與難度參數
    this.spawnTimer = 0;
    this.spawnInterval = 140; // 幾幀生成一個
    this.baseSpeed = 1.0;
    this.level = 1;

    // 砲台位置
    this.cannon = {
      x: 0,
      y: 0,
      targetAngle: -Math.PI / 2,
      currentAngle: -Math.PI / 2
    };

    // 畫面震動與閃爍
    this.screenShake = 0;
    this.dangerFlash = 0;

    this.initCanvas();
    this.bindEvents();
  }

  initCanvas() {
    const resize = () => {
      const container = this.canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
      
      this.width = rect.width;
      this.height = rect.height;

      // 拼音提示警戒線（約 55% 畫面高度，過線後才顯示拼音）
      this.hintLineY = this.height * 0.54;
      this.bottomLineY = this.height - 65;

      this.cannon.x = this.width / 2;
      this.cannon.y = this.height - 40;
    };

    window.addEventListener('resize', resize);
    resize();
  }

  bindEvents() {
    // 實體鍵盤事件
    window.addEventListener('keydown', (e) => {
      // 忽略特殊功能鍵
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      if (!this.isPlaying || this.isPaused) {
        if (e.key === ' ' || e.key === 'Enter') {
          if (!this.isPlaying) this.start();
        }
        return;
      }

      const key = e.key.toLowerCase();
      // 支援英文字母與連字號（例如長音 ra-men）
      if (/^[a-z\-]$/.test(key)) {
        e.preventDefault();
        this.handleKeyPress(key);
      } else if (e.key === 'Escape') {
        this.togglePause();
      }
    });

    // 點擊畫布以激活隱藏的文字輸入框（支援手機平板虛擬鍵盤）
    const mobileInput = document.getElementById('mobileHiddenInput');
    if (mobileInput) {
      this.canvas.addEventListener('click', () => {
        mobileInput.focus();
        window.audioManager.ensureAudioContext();
      });
      mobileInput.addEventListener('input', (e) => {
        if (!this.isPlaying || this.isPaused) return;
        const val = mobileInput.value.toLowerCase();
        if (val.length > 0) {
          const char = val[val.length - 1];
          if (/^[a-z\-]$/.test(char)) {
            this.handleKeyPress(char);
          }
        }
        mobileInput.value = '';
      });
    }
  }

  // 設定切換
  setMode(mode) {
    this.mode = mode;
  }

  setDifficulty(diff) {
    this.difficulty = diff;
    if (diff === 'easy') {
      this.baseSpeed = 0.75;
      this.spawnInterval = 170;
      this.showHints = true;
    } else if (diff === 'normal') {
      this.baseSpeed = 1.1;
      this.spawnInterval = 135;
      this.showHints = true;
    } else if (diff === 'hard') {
      this.baseSpeed = 1.6;
      this.spawnInterval = 100;
      this.showHints = false;
    }
  }

  // 取得當前模式的題庫池
  getQuestionPool() {
    if (this.mode === 'words') {
      return window.VOCAB_DATA.map(item => ({
        displayKana: item.kana,
        subText: `${item.meaning} [${item.kanji || item.kana}]`,
        romajiList: item.romaji,
        isWord: true,
        originalData: item
      }));
    }

    let kanaList = [];
    if (this.mode === 'seion') {
      kanaList = window.KANA_DATA.filter(k => k.group === 'seion');
    } else if (this.mode === 'dakuon') {
      kanaList = window.KANA_DATA.filter(k => k.group === 'dakuon' || k.group === 'handakuon');
    } else if (this.mode === 'yoon') {
      kanaList = window.KANA_DATA.filter(k => k.group === 'yoon');
    } else if (this.mode === 'katakana') {
      return window.KANA_DATA.filter(k => k.group === 'seion').map(k => ({
        displayKana: k.katakana,
        subText: k.hiragana,
        romajiList: k.romaji,
        isWord: false,
        originalData: k
      }));
    } else if (this.mode === 'mixed') {
      return window.KANA_DATA.map(k => {
        const isKatakana = Math.random() > 0.5;
        return {
          displayKana: isKatakana ? k.katakana : k.hiragana,
          subText: isKatakana ? `平: ${k.hiragana}` : `片: ${k.katakana}`,
          romajiList: k.romaji,
          isWord: false,
          originalData: k
        };
      });
    }

    return kanaList.map(k => ({
      displayKana: k.hiragana,
      subText: k.romaji[0],
      romajiList: k.romaji,
      isWord: false,
      originalData: k
    }));
  }

  start() {
    window.audioManager.ensureAudioContext();

    this.isPlaying = true;
    this.isPaused = false;
    this.score = 0;
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalTyped = 0;
    this.correctTyped = 0;
    this.defeatedCount = 0;
    this.level = 1;
    this.targets = [];
    this.particles = [];
    this.lasers = [];
    this.lockedTarget = null;
    this.mistakeList = [];
    this.spawnTimer = 0;
    this.setDifficulty(this.difficulty);

    this.updateHUD();

    document.getElementById('startModal')?.classList.add('hidden');
    document.getElementById('gameOverModal')?.classList.add('hidden');
    document.getElementById('pauseOverlay')?.classList.add('hidden');

    // 聚焦手機輸入欄
    document.getElementById('mobileHiddenInput')?.focus();

    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.lastTime = performance.now();
    this.loop();
  }

  togglePause() {
    if (!this.isPlaying) return;
    this.isPaused = !this.isPaused;
    const pauseOverlay = document.getElementById('pauseOverlay');
    if (this.isPaused) {
      pauseOverlay?.classList.remove('hidden');
    } else {
      pauseOverlay?.classList.add('hidden');
      this.lastTime = performance.now();
      this.loop();
    }
  }

  // 生成新的掉落目標
  spawnTarget() {
    const pool = this.getQuestionPool();
    if (pool.length === 0) return;

    const item = pool[Math.floor(Math.random() * pool.length)];

    // 計算合適的隨機 X 位置，避免超出邊界
    const widthApprox = item.isWord ? 140 : 80;
    const padding = 50;
    const x = padding + Math.random() * (this.width - padding * 2 - widthApprox);

    // 稍微根據難度與關卡增加移動速度
    const speed = (this.baseSpeed + (this.level - 1) * 0.15) * (0.9 + Math.random() * 0.25);

    const target = {
      id: Date.now() + Math.random(),
      displayKana: item.displayKana,
      subText: item.subText,
      romajiList: [...(item.romajiList || item.romaji || [])],
      isWord: item.isWord,
      originalData: item.originalData,
      x: x,
      y: -50,
      width: widthApprox,
      height: item.isWord ? 55 : 65,
      speed: speed,
      currentTyped: '',
      matchedRomaji: null, // 鎖定正在匹配的拼音字串
      hue: item.isWord ? 45 : (item.displayKana.charCodeAt(0) * 17) % 360,
      hitShake: 0
    };

    this.targets.push(target);
  }

  // 處理按鍵輸入
  handleKeyPress(char) {
    this.totalTyped++;

    // 1. 如果已有鎖定目標
    if (this.lockedTarget) {
      const nextTyped = this.lockedTarget.currentTyped + char;
      // 檢查是否符合鎖定目標的任一可能拼音前綴
      const validMatches = this.lockedTarget.romajiList.filter(r => r.startsWith(nextTyped));

      if (validMatches.length > 0) {
        // 命中！
        this.correctTyped++;
        this.lockedTarget.currentTyped = nextTyped;
        this.lockedTarget.matchedRomaji = validMatches[0];
        this.fireLaser(this.lockedTarget);
        this.lockedTarget.hitShake = 5;

        // 檢查是否完全拼寫完成
        const exactMatch = validMatches.find(r => r === nextTyped);
        if (exactMatch) {
          this.destroyTarget(this.lockedTarget);
          this.lockedTarget = null;
        }
        this.updateHUD();
        return;
      } else {
        // 在已鎖定目標時按錯
        this.onTypingMistake();
        return;
      }
    }

    // 2. 如果目前尚未鎖定目標，尋找畫面中能以該字母為開頭的目標
    // 優先挑選距離底線最近（Y 最大 / 最緊急）的目標
    const candidates = this.targets
      .filter(t => t.romajiList.some(r => r.startsWith(char)))
      .sort((a, b) => b.y - a.y);

    if (candidates.length > 0) {
      const target = candidates[0];
      this.lockedTarget = target;
      this.correctTyped++;
      target.currentTyped = char;
      target.matchedRomaji = target.romajiList.find(r => r.startsWith(char));
      this.fireLaser(target);
      target.hitShake = 5;

      // 檢查單字母假名是否直接消除 (例如 a, i, u, e, o)
      if (target.romajiList.includes(char)) {
        this.destroyTarget(target);
        this.lockedTarget = null;
      }
      this.updateHUD();
    } else {
      // 畫面上沒有任何字能以此字母開頭
      this.onTypingMistake();
    }
  }

  // 打字失誤處理
  onTypingMistake() {
    this.combo = 0;
    this.screenShake = 3;
    window.audioManager.playMiss();
    this.updateHUD();
  }

  // 發射雷射攻擊
  fireLaser(target) {
    window.audioManager.playLaser();
    const targetCenterX = target.x + target.width / 2;
    const targetCenterY = target.y + target.height / 2;

    // 更新砲台瞄準角度
    this.cannon.targetAngle = Math.atan2(targetCenterY - this.cannon.y, targetCenterX - this.cannon.x);

    this.lasers.push({
      startX: this.cannon.x,
      startY: this.cannon.y,
      endX: targetCenterX,
      endY: targetCenterY,
      progress: 0,
      color: `hsl(${target.hue}, 100%, 70%)`
    });
  }

  // 擊破目標
  destroyTarget(target) {
    this.defeatedCount++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // 計分公式：基礎分數 + 連擊加成 + 等級加成
    const basePoints = target.isWord ? 200 : 100;
    const comboBonus = Math.min(this.combo * 15, 300);
    const points = basePoints + comboBonus;
    this.score += points;

    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('kana_defense_high_score', this.highScore.toString());
    }

    // 音效與真人日語朗讀！
    window.audioManager.playHit();
    window.audioManager.playCombo(this.combo);
    window.audioManager.speak(target.displayKana);

    // 產生擊毀粒子
    this.createExplosion(target.x + target.width / 2, target.y + target.height / 2, target.hue);

    // 從陣列中移除
    this.targets = this.targets.filter(t => t.id !== target.id);

    // 每擊破 10 個目標升一級
    if (this.defeatedCount % 10 === 0) {
      this.level++;
      window.audioManager.playLevelUp();
    }

    this.updateHUD();
  }

  // 爆炸粒子
  createExplosion(x, y, hue) {
    const count = 22;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1.0,
        decay: 0.025 + Math.random() * 0.02,
        size: 3 + Math.random() * 4,
        color: `hsl(${hue}, 100%, 65%)`
      });
    }
  }

  // 目標突破防線（到達底部）
  onTargetBreach(target) {
    this.lives--;
    this.combo = 0;
    this.screenShake = 12;
    this.dangerFlash = 0.4;
    window.audioManager.playMiss();

    // 記錄到失誤清單，方便賽後複習
    if (!this.mistakeList.some(m => m.displayKana === target.displayKana)) {
      this.mistakeList.push({
        displayKana: target.displayKana,
        subText: target.subText,
        romaji: target.romajiList.join(' / '),
        meaning: target.isWord ? target.subText : ''
      });
    }

    if (this.lockedTarget && this.lockedTarget.id === target.id) {
      this.lockedTarget = null;
    }

    this.targets = this.targets.filter(t => t.id !== target.id);
    this.updateHUD();

    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  gameOver() {
    this.isPlaying = false;
    window.audioManager.playGameOver();

    // 計算準確率
    const accuracy = this.totalTyped > 0 
      ? Math.round((this.correctTyped / this.totalTyped) * 100) 
      : 100;

    // 填充結算畫面
    document.getElementById('finalScore').textContent = this.score;
    document.getElementById('finalHighScore').textContent = this.highScore;
    document.getElementById('finalDefeated').textContent = this.defeatedCount;
    document.getElementById('finalCombo').textContent = this.maxCombo;
    document.getElementById('finalAccuracy').textContent = `${accuracy}%`;

    // 渲染弱點複習清單
    const reviewContainer = document.getElementById('mistakeReviewList');
    if (reviewContainer) {
      if (this.mistakeList.length === 0) {
        reviewContainer.innerHTML = '<p class="text-emerald-400 py-3 text-center">太神了！本局零失誤完全防守！🎯</p>';
      } else {
        reviewContainer.innerHTML = this.mistakeList.map(item => `
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hover:border-cyan-500/50 transition">
            <div class="flex items-center gap-3">
              <span class="text-2xl font-bold text-amber-300 font-jp">${item.displayKana}</span>
              <div>
                <div class="text-sm font-semibold text-cyan-300">${item.romaji}</div>
                ${item.meaning ? `<div class="text-xs text-slate-400">${item.meaning}</div>` : ''}
              </div>
            </div>
            <button onclick="window.audioManager.speak('${item.displayKana}')" class="px-3 py-1 text-xs rounded bg-slate-700 hover:bg-cyan-600 text-white flex items-center gap-1 transition" title="點擊聆聽真人發音">
              🔊 發音
            </button>
          </div>
        `).join('');
      }
    }

    document.getElementById('gameOverModal')?.classList.remove('hidden');
  }

  updateHUD() {
    const scoreEl = document.getElementById('hudScore');
    const comboEl = document.getElementById('hudCombo');
    const levelEl = document.getElementById('hudLevel');
    const livesContainer = document.getElementById('hudLives');

    if (scoreEl) scoreEl.textContent = this.score;
    if (comboEl) {
      comboEl.textContent = `${this.combo}x`;
      if (this.combo >= 5) {
        comboEl.classList.add('scale-125', 'text-amber-400');
      } else {
        comboEl.classList.remove('scale-125', 'text-amber-400');
      }
    }
    if (levelEl) levelEl.textContent = `Lv.${this.level}`;

    if (livesContainer) {
      let heartsHtml = '';
      for (let i = 0; i < this.maxLives; i++) {
        heartsHtml += `<span class="transition duration-300 ${i < this.lives ? 'text-rose-500 scale-100' : 'text-slate-600 opacity-40 scale-75'}">❤️</span>`;
      }
      livesContainer.innerHTML = heartsHtml;
    }

    // 側邊欄額外統計：命中率與擊破數
    const accuracyEl = document.getElementById('hudAccuracy');
    const defeatedEl = document.getElementById('hudDefeated');
    if (accuracyEl) {
      const acc = this.totalTyped > 0 ? Math.round((this.correctTyped / this.totalTyped) * 100) : 100;
      accuracyEl.textContent = `${acc}%`;
    }
    if (defeatedEl) {
      defeatedEl.textContent = this.defeatedCount;
    }
  }

  // 主更新循環
  update(deltaTime) {
    // 難度與敵人生成計時
    this.spawnTimer++;
    const currentInterval = Math.max(50, this.spawnInterval - (this.level - 1) * 6);
    if (this.spawnTimer >= currentInterval) {
      this.spawnTarget();
      this.spawnTimer = 0;
    }

    // 砲台角度緩動
    this.cannon.currentAngle += (this.cannon.targetAngle - this.cannon.currentAngle) * 0.2;

    // 更新目標移動
    const bottomLineY = this.bottomLineY || (this.height - 65);
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.y += t.speed;

      if (t.hitShake > 0) t.hitShake--;

      // 檢查是否突破底線
      if (t.y + t.height >= bottomLineY) {
        this.onTargetBreach(t);
      }
    }

    // 更新雷射射線
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.progress += 0.22;
      if (l.progress >= 1) {
        this.lasers.splice(i, 1);
      }
    }

    // 更新粒子
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 畫面震動衰退
    if (this.screenShake > 0) this.screenShake *= 0.85;
    if (this.screenShake < 0.2) this.screenShake = 0;

    // 紅色警報閃爍衰退
    if (this.dangerFlash > 0) this.dangerFlash -= 0.02;
    if (this.dangerFlash < 0) this.dangerFlash = 0;
  }

  // 繪製
  render() {
    this.ctx.save();

    // 畫面震動位移
    if (this.screenShake > 0) {
      const dx = (Math.random() - 0.5) * this.screenShake * 2;
      const dy = (Math.random() - 0.5) * this.screenShake * 2;
      this.ctx.translate(dx, dy);
    }

    // 清空背景
    this.ctx.fillStyle = '#090d16';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 繪製科技星光微粒背景
    this.renderStarfield();

    // 1. 繪製「拼音警戒線」(Romaji Alert / Hint Line)
    const hintLineY = this.hintLineY || (this.height * 0.54);
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([6, 5]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, hintLineY);
    this.ctx.lineTo(this.width, hintLineY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = 'rgba(245, 158, 11, 0.65)';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚠️ 警戒防護層 · 進入後顯現拼音提示 ⚠️', this.width / 2, hintLineY - 6);
    this.ctx.restore();

    // 2. 繪製「底線防禦網」(Defense Baseline)
    const bottomLineY = this.bottomLineY || (this.height - 65);
    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([8, 6]);
    this.ctx.beginPath();
    this.ctx.moveTo(0, bottomLineY);
    this.ctx.lineTo(this.width, bottomLineY);
    this.ctx.stroke();
    this.ctx.setLineDash([]);

    this.ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
    this.ctx.font = '10px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ DEFENSE PERIMETER ⚡', this.width / 2, bottomLineY + 14);
    this.ctx.restore();

    // 繪製掉落目標
    this.targets.forEach(t => this.renderTarget(t));

    // 繪製雷射射擊
    this.lasers.forEach(l => {
      this.ctx.save();
      this.ctx.strokeStyle = l.color;
      this.ctx.lineWidth = 3;
      this.ctx.shadowColor = l.color;
      this.ctx.shadowBlur = 12;

      this.ctx.beginPath();
      this.ctx.moveTo(l.startX, l.startY);
      this.ctx.lineTo(l.endX, l.endY);
      this.ctx.stroke();
      this.ctx.restore();
    });

    // 繪製爆炸粒子
    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = Math.max(0, p.life);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    });

    // 繪製雷射防禦砲台
    this.renderCannon();

    // 受傷紅色危險閃爍覆蓋
    if (this.dangerFlash > 0) {
      this.ctx.fillStyle = `rgba(239, 68, 68, ${this.dangerFlash})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    this.ctx.restore();
  }

  renderStarfield() {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    const time = performance.now() * 0.001;
    for (let i = 0; i < 35; i++) {
      const sx = ((i * 97) % this.width);
      const sy = ((i * 123 + time * 35) % this.height);
      this.ctx.fillRect(sx, sy, (i % 3 === 0 ? 2 : 1), (i % 3 === 0 ? 2 : 1));
    }
  }

  renderCannon() {
    const { x, y, currentAngle } = this.cannon;

    this.ctx.save();
    this.ctx.translate(x, y);

    // 砲台底座
    this.ctx.fillStyle = '#1e293b';
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(0, 15, 26, Math.PI, 0);
    this.ctx.fill();
    this.ctx.stroke();

    // 砲管
    this.ctx.rotate(currentAngle + Math.PI / 2);
    this.ctx.fillStyle = '#38bdf8';
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;
    this.ctx.fillRect(-4, -32, 8, 28);

    // 砲口光暈
    this.ctx.fillStyle = '#e0f2fe';
    this.ctx.beginPath();
    this.ctx.arc(0, -32, 5, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.restore();
  }

  renderTarget(t) {
    const isLocked = this.lockedTarget && this.lockedTarget.id === t.id;
    let shakeX = 0;
    if (t.hitShake > 0) {
      shakeX = (Math.random() - 0.5) * t.hitShake;
    }

    const drawX = t.x + shakeX;
    const drawY = t.y;

    this.ctx.save();

    // 1. 卡片背景底框
    this.ctx.beginPath();
    const radius = 10;
    this.ctx.roundRect(drawX, drawY, t.width, t.height, radius);

    // 邊框與陰影特效
    if (isLocked) {
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2.5;
      this.ctx.shadowColor = '#f59e0b';
      this.ctx.shadowBlur = 15;
    } else {
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
      this.ctx.strokeStyle = `hsl(${t.hue}, 80%, 55%)`;
      this.ctx.lineWidth = 1.5;
      this.ctx.shadowColor = `hsl(${t.hue}, 80%, 55%)`;
      this.ctx.shadowBlur = 6;
    }
    this.ctx.fill();
    this.ctx.stroke();

    // 2. 假名文字渲染
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.font = t.isWord ? 'bold 22px "Noto Sans JP", sans-serif' : 'bold 28px "Noto Sans JP", sans-serif';
    this.ctx.fillStyle = isLocked ? '#fef08a' : '#ffffff';
    this.ctx.shadowBlur = 0;

    const textCenterY = t.isWord ? drawY + 22 : drawY + 26;
    this.ctx.fillText(t.displayKana, drawX + t.width / 2, textCenterY);

    // 3. 拼音比對進度與提示
    const defaultRomaji = t.matchedRomaji || t.romajiList[0];
    const typed = t.currentTyped;
    const isPastHintLine = (t.y + t.height >= (this.hintLineY || this.height * 0.54));
    const hintY = t.isWord ? drawY + 42 : drawY + 50;

    if (typed.length > 0) {
      // 已經打了部分字母：已輸入顯示綠色，未輸入顯示灰色
      const typedPart = defaultRomaji.substring(0, typed.length);
      const remainingPart = defaultRomaji.substring(typed.length);

      this.ctx.font = 'bold 12px monospace';
      const fullWidth = this.ctx.measureText(defaultRomaji).width;
      let curX = drawX + t.width / 2 - fullWidth / 2;

      this.ctx.textAlign = 'left';
      // 已輸入（高亮綠色）
      this.ctx.fillStyle = '#4ade80';
      this.ctx.fillText(typedPart, curX, hintY);
      curX += this.ctx.measureText(typedPart).width;

      // 剩餘字母（淺灰色）
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText(remainingPart, curX, hintY);
    } else if (isPastHintLine && this.showHints) {
      // 尚未輸入，但已過「拼音警戒防護層」：亮起緊急拼音提示！
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillStyle = '#fbbf24'; // 醒目琥珀黃提示
      const hintText = t.isWord 
        ? `⚡ ${defaultRomaji} · ${t.subText.split(' [')[0]}`
        : `⚡ ${defaultRomaji}`;
      this.ctx.fillText(hintText, drawX + t.width / 2, hintY);
    } else if (t.isWord) {
      // 尚未過警戒線且為單字：只顯示中文意思提供語意聯想，隱藏羅馬拼音！
      this.ctx.font = '11px sans-serif';
      this.ctx.fillStyle = '#64748b'; // 低調灰
      this.ctx.fillText(t.subText.split(' [')[0], drawX + t.width / 2, hintY);
    } else {
      // 五十音在過線前完全不顯示拼音！強迫大腦主動聯想發音！
      this.ctx.font = '10px monospace';
      this.ctx.fillStyle = '#334155';
      this.ctx.fillText('• • •', drawX + t.width / 2, hintY);
    }

    // 鎖定角標指示 (Lock-on cursor)
    if (isLocked) {
      this.ctx.strokeStyle = '#f59e0b';
      this.ctx.lineWidth = 2;
      const corner = 7;
      // 左上
      this.ctx.beginPath();
      this.ctx.moveTo(drawX - 4, drawY - 4 + corner);
      this.ctx.lineTo(drawX - 4, drawY - 4);
      this.ctx.lineTo(drawX - 4 + corner, drawY - 4);
      this.ctx.stroke();
      // 右下
      this.ctx.beginPath();
      this.ctx.moveTo(drawX + t.width + 4, drawY + t.height + 4 - corner);
      this.ctx.lineTo(drawX + t.width + 4, drawY + t.height + 4);
      this.ctx.lineTo(drawX + t.width + 4 - corner, drawY + t.height + 4);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  loop(timestamp = 0) {
    if (!this.isPlaying || this.isPaused) return;

    const deltaTime = timestamp - (this.lastTime || timestamp);
    this.lastTime = timestamp;

    this.update(deltaTime);
    this.render();

    this.animationFrameId = requestAnimationFrame(t => this.loop(t));
  }
}

window.KanaTypingGame = KanaTypingGame;
