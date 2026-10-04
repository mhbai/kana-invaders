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

    // 關卡闖關推進系統 (Campaign & Stage Clear)
    this.currentStageIndex = parseInt(localStorage.getItem('kana_current_stage_idx') || '0', 10);
    this.maxUnlockedStage = parseInt(localStorage.getItem('kana_max_unlocked_stage') || '0', 10);
    this.stageDefeated = 0;
    this.stageBreached = 0;
    this.stageTargetCount = 50;
    this.stageQueue = []; // 待發射題目隊列（每關剛好放出 50 個字，漏接/過線自動回流）
    this.floatingTexts = []; // 浮動文字提示特效隊列
    this.galaxyOffsetY = 0; // 銀河星雲向下漂移累計位移
    this.isStageCleared = false; // 街機太空戰場過關狀態
    this.stageClearStats = null; // 街機戰場過關結算數據
    this.stageClearClickZones = null; // 街機過關按鈕點擊判定熱區

    this.initCanvas();
    this.bindEvents();
    setTimeout(() => this.renderStageMap(), 50);

    // 啟動宇宙基地常態視差星空巡航循環（Ambient Space Station Cruise）
    this.lastTime = performance.now();
    this.loop();
  }

  initCanvas() {
    const resize = () => {
      const container = this.canvas.parentElement;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      const oldW = this.width;
      const oldH = this.height;

      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.resetTransform?.();
      this.ctx.scale(dpr, dpr);
      
      this.width = rect.width;
      this.height = rect.height;

      // 地球大氣層邊界（約 54% 畫面高度，進入後顯示拼音提示）
      this.hintLineY = this.height * 0.54;
      this.bottomLineY = this.height - 65;

      this.cannon.x = this.width / 2;
      this.cannon.y = this.height - 40;

      if (!this.stars || this.stars.length === 0) {
        this.initStars();
        this.initShootingStar();
        this.initSaturn();
      } else if (oldW && oldH && (oldW !== this.width || oldH !== this.height)) {
        const ratioX = this.width / oldW;
        const ratioY = this.height / oldH;
        this.stars.forEach(s => {
          s.x = (s.x || 0) * ratioX;
          s.y = (s.y || 0) * ratioY;
        });
        if (this.pleiadesCluster) {
          this.pleiadesCluster.cx *= ratioX;
          this.pleiadesCluster.cy *= ratioY;
        }
        if (this.saturn) {
          this.saturn.x *= ratioX;
          this.saturn.y *= ratioY;
        }
      }
      this.render();
    };

    window.addEventListener('resize', resize);
    resize();
  }

  // 初始化壯麗繁星系統（300+ 顆多層次星群、色彩分佈、視差速度、昴宿星團與天狼星超巨星）
  initStars() {
    this.stars = [];
    const count = 320;
    const w = this.width || 800;
    const h = this.height || 600;

    // 1. 特殊大巨星（如金星／天狼星，具備柔和光暈與四芒星衍射光線）
    this.superStar = {
      x: w * 0.86,
      y: h * 0.38,
      size: 2.4,
      speed: 0.33,
      baseAlpha: 1.0,
      color: '#ffffff',
      glowColor: '#38bdf8',
      twinkleSpeed: 1.2,
      twinklePhase: 0,
      isSuperStar: true
    };
    this.stars.push(this.superStar);

    // 2. 昴宿星團 (Pleiades / Subaru Cluster，7 顆精緻相偎的微星群，集體以固定隊形向下巡航)
    this.pleiadesCluster = {
      cx: w * 0.42,
      cy: h * 0.16,
      speed: 0.35
    };
    const clusterOffsets = [
      [-14, -10], [-7, -15], [3, -7],
      [11, -3], [-5, 7], [7, 8], [15, 3]
    ];
    this.clusterStars = [];
    for (const [dx, dy] of clusterOffsets) {
      const cs = {
        offsetX: dx,
        offsetY: dy,
        x: this.pleiadesCluster.cx + dx,
        y: this.pleiadesCluster.cy + dy,
        size: 1.1 + Math.random() * 0.5,
        baseAlpha: 0.75 + Math.random() * 0.25,
        color: '#bae6fd',
        glowColor: '#38bdf8',
        twinkleSpeed: 2.0 + Math.random() * 1.5,
        twinklePhase: Math.random() * Math.PI * 2,
        isClusterStar: true
      };
      this.clusterStars.push(cs);
      this.stars.push(cs);
    }

    // 3. 散佈於全天候的壯麗繁星群（多層次星塵、主星、耀眼亮星與天然光譜色系）
    const colorPalette = [
      '#ffffff', '#ffffff', '#ffffff', '#ffffff', // 經典鑽石白 (50%)
      '#e0f2fe', '#bae6fd', '#7dd3fc',          // 仙女座／織女星天藍色系 (35%)
      '#fef08a', '#fde68a',                      // 參宿四／大角星暖金星系 (12%)
      '#fbcfe8'                                  // 微粉星塵 (3%)
    ];

    for (let i = 0; i < count; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      const r = Math.random();
      let size, baseAlpha, speed, isBright = false;

      if (r < 0.65) {
        // 微光星塵 (Micro-stars，數量龐大營造深空深邃感，在極遠背景)
        size = 0.6 + Math.random() * 0.4;
        baseAlpha = 0.25 + Math.random() * 0.35;
        speed = 0.28 + Math.random() * 0.05; // 0.28 ~ 0.33 px/frame
      } else if (r < 0.93) {
        // 中等璀璨主星 (Medium stars，中景天體)
        size = 1.0 + Math.random() * 0.4;
        baseAlpha = 0.58 + Math.random() * 0.32;
        speed = 0.35 + Math.random() * 0.06; // 0.35 ~ 0.41 px/frame
      } else {
        // 耀眼亮星 (Major bright stars，微幅視差層次，速差細微內斂，避免雪花感)
        size = 1.4 + Math.random() * 0.4;
        baseAlpha = 0.85 + Math.random() * 0.15;
        speed = 0.42 + Math.random() * 0.06; // 0.42 ~ 0.48 px/frame
        isBright = true;
      }

      const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

      this.stars.push({
        x,
        y,
        size,
        baseAlpha,
        speed,
        color,
        twinkleSpeed: 0.8 + Math.random() * 2.8,
        twinklePhase: Math.random() * Math.PI * 2,
        isBright
      });
    }
  }

  // 更新壯麗星空與星雲向下捲動（宇宙基地多層次視差推進效果，速差細膩自然）
  updateStars(stageProgress = 0) {
    if (!this.stars || this.stars.length === 0) return;

    // 太空基地推進加速係數（隨關卡進度微幅提升，保持星空深邃穩健感）
    const warpFactor = 1.0 + stageProgress * 0.45;

    // 1. 更新銀河星雲微光帶緩慢下移
    this.galaxyOffsetY = ((this.galaxyOffsetY || 0) + 0.08 * warpFactor) % (this.height * 2);

    // 2. 更新昴宿星團整體坐標（保持星團陣型完美固定）
    if (this.pleiadesCluster) {
      this.pleiadesCluster.cy += this.pleiadesCluster.speed * warpFactor;
      if (this.pleiadesCluster.cy > this.height + 40) {
        this.pleiadesCluster.cy = -40;
        this.pleiadesCluster.cx = this.width * 0.15 + Math.random() * (this.width * 0.7);
      }
      if (this.clusterStars) {
        for (let i = 0; i < this.clusterStars.length; i++) {
          const cs = this.clusterStars[i];
          cs.x = this.pleiadesCluster.cx + cs.offsetX;
          cs.y = this.pleiadesCluster.cy + cs.offsetY;
        }
      }
    }

    // 3. 更新全天星體向下捲動（視差分層）
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      if (star.isClusterStar) continue; // 昴宿星團已隨母坐標同步位移

      star.y += (star.speed || 0.4) * warpFactor;

      if (star.isSuperStar) {
        if (star.y > this.height + 30) {
          star.y = -25;
          star.x = this.width * 0.15 + Math.random() * (this.width * 0.7);
        }
      } else {
        // 超出畫布底部時，循環重置回天頂上方，保持全天星辰無縫流轉
        if (star.y > this.height + 12) {
          star.y = -8 - Math.random() * 10;
          star.x = Math.random() * this.width;
        }
      }
    }

    // 4. 更新巨型光環土星宏偉巡航 (Majestic Ringed Saturn)
    if (this.saturn) {
      const st = this.saturn;
      if (st.active) {
        st.y += (st.speed || 0.15) * warpFactor;
        // 超出畫布底部時，進入冷卻計時，稍後在隨機橫向位置再次降臨
        if (st.y > this.height + st.ringOuterR + 45) {
          st.active = false;
          // 冷卻 45 ~ 85 秒後於天頂重新降臨
          st.nextTime = performance.now() + 45000 + Math.random() * 40000;
        }
      } else if (performance.now() >= (st.nextTime || 0)) {
        st.active = true;
        st.y = -st.ringOuterR - 35;
        st.x = this.width * 0.18 + Math.random() * (this.width * 0.64);
        st.tilt = -0.18 - Math.random() * 0.08;
      }
    }
  }

  // 初始化巨型光環土星系統 (Majestic Ringed Saturn Gas Giant - 寫實天文望遠鏡低調典雅美學)
  initSaturn() {
    const w = this.width || 800;
    const h = this.height || 600;
    this.saturn = {
      active: true,
      x: w * 0.74,
      y: h * 0.20,
      radius: 26,       // 行星本體半徑 (直徑 52px，大顆醒目)
      ringOuterR: 72,   // 光環外徑長軸 (全寬 144px)
      ringInnerR: 38,   // 光環內徑長軸
      ratio: 0.35,      // 橢圓扁率 (與參考天文照一致的優雅環角)
      tilt: -0.22,      // 自轉軸傾斜角度 (-12.6 度，典雅寫實)
      speed: 0.15,      // 宏大天體穩健巡航速度
      nextTime: 0
    };
  }

  // 初始化夜空流星系統
  initShootingStar() {
    this.shootingStar = {
      active: false,
      x: 0,
      y: 0,
      length: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      nextTime: performance.now() + 5000 + Math.random() * 7000
    };
  }

  // 更新夜空偶現流星
  updateShootingStar() {
    if (!this.shootingStar) return;
    const now = performance.now();
    if (!this.shootingStar.active && now >= this.shootingStar.nextTime) {
      this.shootingStar.active = true;
      this.shootingStar.x = Math.random() * (this.width * 0.75);
      this.shootingStar.y = 15 + Math.random() * (this.height * 0.35);
      const speed = 9 + Math.random() * 5;
      const angle = (Math.PI / 4) + (Math.random() - 0.5) * 0.35;
      this.shootingStar.vx = Math.cos(angle) * speed;
      this.shootingStar.vy = Math.sin(angle) * speed;
      this.shootingStar.life = 1.0;
      this.shootingStar.maxLife = 26 + Math.random() * 12;
      this.shootingStar.length = 40 + Math.random() * 40;
      this.shootingStar.nextTime = now + 12000 + Math.random() * 14000;
    }

    if (this.shootingStar.active) {
      this.shootingStar.x += this.shootingStar.vx;
      this.shootingStar.y += this.shootingStar.vy;
      this.shootingStar.life -= 1.0 / this.shootingStar.maxLife;
      if (this.shootingStar.life <= 0) {
        this.shootingStar.active = false;
      }
    }
  }

  bindEvents() {
    // 實體鍵盤事件
    window.addEventListener('keydown', (e) => {
      // 忽略特殊功能鍵
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      // 街機太空戰場過關狀態快捷鍵
      if (this.isStageCleared) {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          this.advanceToNextStage();
          return;
        } else if (e.key === 'r' || e.key === 'R') {
          e.preventDefault();
          this.start(this.currentStageIndex);
          return;
        }
        return;
      }

      if (!this.isPlaying || this.isPaused) {
        if (e.key === ' ' || e.key === 'Enter') {
          if (!this.isPlaying) this.start(this.currentStageIndex);
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

    // 畫布滑鼠懸停效果（過關按鈕 Hover 光標切換）
    this.canvas.addEventListener('mousemove', (e) => {
      if (this.isStageCleared && this.stageClearClickZones) {
        const rect = this.canvas.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const inNext = this.isPointInRect(mx, my, this.stageClearClickZones.next);
        const inReplay = this.isPointInRect(mx, my, this.stageClearClickZones.replay);
        this.canvas.style.cursor = (inNext || inReplay) ? 'pointer' : 'default';
      } else {
        this.canvas.style.cursor = 'default';
      }
    });

    // 點擊畫布事件（支援街機按鈕點擊 + 手機虛擬鍵盤呼叫）
    const mobileInput = document.getElementById('mobileHiddenInput');
    this.canvas.addEventListener('click', (e) => {
      window.audioManager.ensureAudioContext();

      if (this.isStageCleared) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (this.stageClearClickZones) {
          if (this.isPointInRect(clickX, clickY, this.stageClearClickZones.replay)) {
            this.start(this.currentStageIndex);
            return;
          }
        }
        // 點擊「進入下一關」按鈕或點擊畫布任意區域皆可躍遷至下一關
        this.advanceToNextStage();
        return;
      }

      if (mobileInput) {
        mobileInput.focus();
      }
    });

    if (mobileInput) {
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
      this.difficultySpeedFactor = 0.85;
      this.spawnInterval = 155;
      this.showHints = true;
    } else if (diff === 'normal') {
      this.difficultySpeedFactor = 1.0;
      this.spawnInterval = 135;
      this.showHints = true;
    } else if (diff === 'hard') {
      this.difficultySpeedFactor = 1.25;
      this.spawnInterval = 105;
      this.showHints = false;
    }
    const stage = this.getCurrentStage();
    const stageBase = (stage && stage.speed) ? stage.speed : 0.85;
    this.baseSpeed = stageBase * (this.difficultySpeedFactor || 1.0);
  }

  getCurrentStage() {
    if (!window.CAMPAIGN_STAGES || window.CAMPAIGN_STAGES.length === 0) return null;
    return window.CAMPAIGN_STAGES[this.currentStageIndex] || window.CAMPAIGN_STAGES[0];
  }

  // 取得當前關卡的題庫池
  getQuestionPool() {
    const stage = this.getCurrentStage();
    if (!stage || !stage.getPool) return [];

    const raw = stage.getPool();
    return raw.map(item => {
      if (item.displayKana) return item;
      return {
        displayKana: item.hiragana,
        subText: item.romaji[0],
        romajiList: item.romaji,
        isWord: false,
        originalData: item
      };
    });
  }

  start(stageIndex = null) {
    window.audioManager.ensureAudioContext();

    if (stageIndex !== null && typeof stageIndex === 'number') {
      this.currentStageIndex = stageIndex;
      localStorage.setItem('kana_current_stage_idx', this.currentStageIndex.toString());
    }

    const stage = this.getCurrentStage();

    this.isPlaying = true;
    this.isPaused = false;
    this.isStageCleared = false;
    this.stageClearStats = null;
    this.stageClearClickZones = null;
    if (this.canvas) this.canvas.style.cursor = 'default';
    this.lives = this.maxLives;
    this.combo = 0;
    this.maxCombo = 0;
    this.totalTyped = 0;
    this.correctTyped = 0;
    this.defeatedCount = 0;
    this.stageDefeated = 0;
    this.stageBreached = 0;
    this.stageTargetCount = stage ? stage.targetCount : 50;
    this.level = this.currentStageIndex + 1;
    this.targets = [];
    this.particles = [];
    this.lasers = [];
    this.floatingTexts = [];
    this.lockedTarget = null;
    this.mistakeList = [];
    this.spawnTimer = 0;

    // 初始化本關 50 題目的待發射隊列（總共放出 50 個字，均勻覆蓋題庫）
    this.stageQueue = [];
    const pool = this.getQuestionPool();
    if (pool && pool.length > 0) {
      while (this.stageQueue.length < this.stageTargetCount) {
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        for (const item of shuffled) {
          if (this.stageQueue.length < this.stageTargetCount) {
            this.stageQueue.push(item);
          } else {
            break;
          }
        }
      }
    }

    this.setDifficulty(this.difficulty);
    const stageSpeed = (stage && stage.speed) ? stage.speed : 0.85;
    this.baseSpeed = stageSpeed * (this.difficultySpeedFactor || 1.0);

    this.updateHUD();
    this.renderStageMap();

    document.getElementById('startModal')?.classList.add('hidden');
    document.getElementById('gameOverModal')?.classList.add('hidden');
    document.getElementById('pauseOverlay')?.classList.add('hidden');
    document.getElementById('stageClearModal')?.classList.add('hidden');

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
    }
  }

  // 浮動文字特效輔助
  createFloatingText(x, y, text, color = '#38bdf8') {
    this.floatingTexts.push({
      x: x,
      y: y,
      text: text,
      color: color,
      life: 1.0,
      vy: -1.2
    });
  }

  // 生成新的掉落目標（依序從本關 50 題隊列中發射，隊列空時不額外生成）
  spawnTarget() {
    if (!this.stageQueue || this.stageQueue.length === 0) return;

    const item = this.stageQueue.shift();
    if (!item) return;

    // 計算合適的隨機 X 位置，避免超出邊界
    const widthApprox = item.isWord ? 140 : 80;
    const padding = 50;
    const x = padding + Math.random() * (this.width - padding * 2 - widthApprox);

    // 每個敵人物件隨機微調速度，以當前關卡基礎速度為基準（不跨關累積）
    const speedVariation = 0.96 + Math.random() * 0.08;
    const initialSpeed = this.baseSpeed * speedVariation;

    const target = {
      id: Date.now() + Math.random(),
      rawItem: item, // 保留原始項目，以利漏接或過線時回流重測
      displayKana: item.displayKana,
      subText: item.subText,
      romajiList: [...(item.romajiList || item.romaji || [])],
      isWord: item.isWord,
      originalData: item.originalData,
      x: x,
      y: -50,
      width: widthApprox,
      height: item.isWord ? 55 : 65,
      baseSpeed: initialSpeed,
      speed: initialSpeed,
      currentTyped: '',
      matchedRomaji: null,
      hue: item.isWord ? 45 : (item.displayKana.charCodeAt(0) * 17) % 360,
      hitShake: 0,
      crossedAlertLine: false
    };

    this.targets.push(target);
    this.updateHUD();
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
    const alertLineY = this.hintLineY || (this.height * 0.54);
    const passedAlert = (target.y + target.height >= alertLineY) || target.crossedAlertLine;

    if (passedAlert) {
      // ⚠️ 字進入大氣層才打掉：該字不算進 GOAL 計算中，而且之後會再補進一次
      if (target.rawItem) {
        this.stageQueue.push(target.rawItem);
      }
      this.createFloatingText(target.x + target.width / 2, target.y + 10, '⚠️ 墜入大氣層擊破 (不計GOAL·已回流)', '#fbbf24');
    } else {
      // 🎯 在大氣層前打掉：算進 GOAL 計算中，不補進
      this.stageDefeated++;
      this.createFloatingText(target.x + target.width / 2, target.y + 10, '🎯 大氣外完美截擊 (+1 GOAL)', '#38bdf8');
    }

    this.defeatedCount++;
    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    // 計分公式：基礎分數 + 連擊加成
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

    this.updateHUD();

    // 檢查是否達成通關條件（只有完美擊破數累計達到 stageTargetCount 才通關）
    if (this.stageDefeated >= this.stageTargetCount) {
      this.onStageClear();
    }
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
    this.stageBreached++;
    this.combo = 0;
    this.screenShake = 12;
    this.dangerFlash = 0.4;
    window.audioManager.playMiss();

    // 依據規則：如果玩家沒打中，除了生命扣一個愛心外，該字之後會再補進一次
    if (target.rawItem) {
      this.stageQueue.push(target.rawItem);
    }
    this.createFloatingText(target.x + target.width / 2, target.y, '💔 漏接扣心！字卡回流重測', '#ef4444');

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
    const finalScoreEl = document.getElementById('finalScore');
    const finalHighScoreEl = document.getElementById('finalHighScore');
    const finalDefeatedEl = document.getElementById('finalDefeated');
    const finalComboEl = document.getElementById('finalCombo');
    const finalAccEl = document.getElementById('finalAccuracy');

    if (finalScoreEl) finalScoreEl.textContent = this.score;
    if (finalHighScoreEl) finalHighScoreEl.textContent = this.highScore;
    if (finalDefeatedEl) finalDefeatedEl.textContent = this.defeatedCount;
    if (finalComboEl) finalComboEl.textContent = this.maxCombo;
    if (finalAccEl) finalAccEl.textContent = `${accuracy}%`;

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

  // 關卡突破結算 (Stage Clear - 街機太空戰場嵌入式結算)
  onStageClear() {
    this.isPlaying = false;
    this.isStageCleared = true;
    this.stageClearTime = performance.now();
    this.targets = []; // 清空殘餘敵人，太空戰場恢復寧靜

    window.audioManager.playLevelUp();

    // 評定星級 (3星: 0失誤, 2星: 1~2失誤, 1星: 3+失誤)
    let stars = 3;
    if (this.stageBreached >= 3) stars = 1;
    else if (this.stageBreached >= 1) stars = 2;

    const stage = this.getCurrentStage();

    // 保存星級與解鎖進度
    if (stage) {
      const starKey = `kana_stage_stars_${stage.id}`;
      const oldStars = parseInt(localStorage.getItem(starKey) || '0', 10);
      if (stars > oldStars) {
        localStorage.setItem(starKey, stars.toString());
      }
    }

    const totalStages = window.CAMPAIGN_STAGES?.length || 17;
    if (this.currentStageIndex + 1 > this.maxUnlockedStage) {
      this.maxUnlockedStage = Math.min(this.currentStageIndex + 1, totalStages - 1);
      localStorage.setItem('kana_max_unlocked_stage', this.maxUnlockedStage.toString());
    }

    // 獎勵：通關回血 +1（最多至 maxLives）
    let healed = false;
    if (this.lives < this.maxLives) {
      this.lives++;
      healed = true;
    }

    // 計算命中率
    const acc = this.totalTyped > 0 ? Math.round((this.correctTyped / this.totalTyped) * 100) : 100;

    // 打包戰況數據供畫布太空戰場渲染
    this.stageClearStats = {
      stars: stars,
      healed: healed,
      score: this.score,
      defeated: `${this.stageDefeated} / ${this.stageTargetCount}`,
      combo: `${this.maxCombo}x`,
      accuracy: `${acc}%`,
      stageTitle: stage ? stage.name : 'STAGE CLEAR',
      stageSubtitle: stage ? stage.subtitle : '',
      isLastStage: this.currentStageIndex >= totalStages - 1
    };

    // 隱藏舊版對話框 Modal（全面改用街機畫布嵌入式結算）
    const modal = document.getElementById('stageClearModal');
    if (modal) modal.classList.add('hidden');

    this.renderStageMap();
    this.updateHUD();
  }

  // 街機躍遷至下一關
  advanceToNextStage() {
    this.isStageCleared = false;
    this.stageClearStats = null;
    this.stageClearClickZones = null;

    const totalStages = window.CAMPAIGN_STAGES?.length || 17;
    if (this.currentStageIndex < totalStages - 1) {
      this.start(this.currentStageIndex + 1);
    } else {
      this.start(0);
    }
  }

  // 渲染左側闖關地圖
  renderStageMap() {
    const listEl = document.getElementById('stageMapList');
    if (!listEl || !window.CAMPAIGN_STAGES) return;

    listEl.innerHTML = window.CAMPAIGN_STAGES.map((st, idx) => {
      const isCurrent = idx === this.currentStageIndex;
      const isUnlocked = idx <= this.maxUnlockedStage;
      const stars = parseInt(localStorage.getItem(`kana_stage_stars_${st.id}`) || '0', 10);
      const starIcons = stars > 0 ? '⭐'.repeat(stars) : '';

      let borderClass = 'border-slate-800 bg-slate-900/40 opacity-50 cursor-not-allowed';
      let titleClass = 'text-slate-500';
      if (isCurrent) {
        borderClass = 'border-cyan-400 bg-cyan-950/60 shadow-sm shadow-cyan-500/25 ring-1 ring-cyan-400/50';
        titleClass = 'text-cyan-300 font-bold';
      } else if (isUnlocked) {
        borderClass = 'border-slate-700/80 hover:border-slate-500 bg-slate-800/70 hover:bg-slate-800 cursor-pointer';
        titleClass = 'text-slate-200';
      }

      return `
        <div onclick="${isUnlocked ? `window.gameInstance.start(${idx})` : ''}" class="p-2 rounded-lg border transition flex items-center justify-between text-xs ${borderClass}">
          <div class="flex flex-col min-w-0 pr-1 text-left">
            <span class="truncate ${titleClass}">${st.name}</span>
            <span class="text-[10px] text-slate-400 truncate">${st.subtitle}</span>
          </div>
          <div class="shrink-0 flex items-center font-mono text-[11px]">
            ${!isUnlocked ? '<span class="text-slate-600 text-xs">🔒</span>' : (starIcons || '<span class="text-slate-500 text-[10px]">未破</span>')}
          </div>
        </div>
      `;
    }).join('');

    const activeEl = listEl.querySelector('.ring-cyan-400\\/50');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
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
    if (levelEl) levelEl.textContent = `Lv.${this.currentStageIndex + 1}`;

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

    // 關卡名稱與當前關卡擊破進度條
    const stage = this.getCurrentStage();
    const stageTitleEl = document.getElementById('hudStageTitle');
    const stageSubtitleEl = document.getElementById('hudStageSubtitle');
    const progressTextEl = document.getElementById('stageProgressText');
    const progressBarEl = document.getElementById('stageProgressBar');

    if (stageTitleEl && stage) stageTitleEl.textContent = stage.name;
    if (stageSubtitleEl && stage) {
      const pendingTotal = (this.stageQueue ? this.stageQueue.length : 0) + this.targets.length;
      stageSubtitleEl.textContent = `${stage.subtitle} (待擊: ${pendingTotal})`;
    }
    if (progressTextEl) progressTextEl.textContent = `${this.stageDefeated} / ${this.stageTargetCount}`;
    if (progressBarEl) {
      const pct = Math.min(100, Math.round((this.stageDefeated / this.stageTargetCount) * 100));
      progressBarEl.style.width = `${pct}%`;
    }

    // 即時更新隨 Stage Goal 上升的即時速度倍率指示器 (1.0x ➔ 5.0x 超極限)
    const speedBadgeEl = document.getElementById('hudSpeedBadge');
    if (speedBadgeEl) {
      const stageProgress = Math.min(1.0, this.stageDefeated / Math.max(1, this.stageTargetCount));
      const factor = 1.0 + stageProgress * 4.0;
      const spd = factor.toFixed(1);
      if (factor >= 4.2) {
        speedBadgeEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-fuchsia-600/35 text-fuchsia-100 font-mono border border-fuchsia-400/80 shadow-md shadow-fuchsia-500/60 animate-pulse font-bold tracking-wider';
        speedBadgeEl.textContent = `⚡ ${spd}x 🚀 HYPER`;
      } else if (factor >= 3.2) {
        speedBadgeEl.className = 'text-[9px] px-1.5 py-0.5 rounded bg-purple-600/30 text-purple-200 font-mono border border-purple-400/70 shadow-sm shadow-purple-500/40 animate-pulse font-semibold';
        speedBadgeEl.textContent = `⚡ ${spd}x 🔥🔥`;
      } else if (factor >= 2.2) {
        speedBadgeEl.className = 'text-[9px] px-1 py-0.5 rounded bg-rose-500/25 text-rose-300 font-mono border border-rose-500/50 animate-pulse font-medium';
        speedBadgeEl.textContent = `⚡ ${spd}x 🔥`;
      } else if (factor >= 1.5) {
        speedBadgeEl.className = 'text-[9px] px-1 py-0.5 rounded bg-amber-500/25 text-amber-300 font-mono border border-amber-500/40 font-medium';
        speedBadgeEl.textContent = `⚡ ${spd}x ⚡`;
      } else {
        speedBadgeEl.className = 'text-[9px] px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/40';
        speedBadgeEl.textContent = `⚡ ${spd}x`;
      }
    }
  }

  // 主更新循環
  update(deltaTime) {
    // 計算當前關卡擊破進度 (0.0 ~ 1.0，隨 Stage Goal 數值提升)
    const stageProgress = Math.min(1.0, this.stageDefeated / Math.max(1, this.stageTargetCount));

    // 宇宙基地多層次視差星空向下捲動（速度與關卡進度 Warp 加速連動）
    this.updateStars(stageProgress);

    // 關卡內動態加速曲線：隨 Stage Goal 數值上升自 1.0x 顯著平滑加速至最高 5.0x（換新關立即恢復 1.0x 初始速度）
    const stageSpeedFactor = 1.0 + stageProgress * 4.0;

    // 敵人生成計時：只有在隊列中還有待發射題目時才生成，隨 Stage Goal 上升適度縮短間隔
    this.spawnTimer++;
    const currentInterval = Math.max(38, Math.round(this.spawnInterval - stageProgress * 85));
    // 若畫面上完全沒有敵人且隊列中還有字，縮短等待時間迅速發射
    const effectiveInterval = (this.targets.length === 0) ? Math.min(20, currentInterval) : currentInterval;
    if (this.spawnTimer >= effectiveInterval) {
      if (this.stageQueue && this.stageQueue.length > 0) {
        this.spawnTarget();
      }
      this.spawnTimer = 0;
    }

    // 砲台角度緩動
    this.cannon.currentAngle += (this.cannon.targetAngle - this.cannon.currentAngle) * 0.2;

    // 更新目標移動（動態應用當前關卡速度曲線）
    const bottomLineY = this.bottomLineY || (this.height - 65);
    const alertLineY = this.hintLineY || (this.height * 0.54);
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      const currentSpeed = (t.baseSpeed || t.speed || this.baseSpeed) * stageSpeedFactor;
      t.speed = currentSpeed;
      t.y += currentSpeed;

      if (t.hitShake > 0) t.hitShake--;

      // 檢查是否穿入地球大氣層警戒線
      if (t.y + t.height >= alertLineY) {
        t.crossedAlertLine = true;
      }

      // 檢查是否突破底線
      if (t.y + t.height >= bottomLineY) {
        this.onTargetBreach(t);
      }
    }

    // 更新浮動提示文字
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.life -= 0.02;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
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

    // 更新夜空偶現流星
    this.updateShootingStar();

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

    // 清空背景：深邃壯麗夜空漸層（自太虛宇宙深黑過渡至地平線星空深藍）
    const skyGrad = this.ctx.createLinearGradient(0, 0, 0, this.height);
    skyGrad.addColorStop(0, '#030712');      // 天頂：太虛深黑
    skyGrad.addColorStop(0.35, '#050d22');   // 上空：午夜幽藍
    skyGrad.addColorStop(0.65, '#081738');   // 中天：星空深湛藍
    skyGrad.addColorStop(0.92, '#0c2048');   // 近地平線：夜空微光
    skyGrad.addColorStop(1.0, '#0a152b');
    this.ctx.fillStyle = skyGrad;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 繪製壯麗星空與銀河星塵 (Magnificent Starry Night Sky, Milky Way & Shooting Star)
    this.renderStarfield();

    // 1. 繪製「地球大氣層透明白霧區」(Earth Atmosphere Mist Layer)
    this.renderEarthAtmosphere();

    // 2. 繪製「地平線遠景城市天際線」(Distant City Skyline Horizon & Defense Baseline)
    this.renderCitySkyline();

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

    // 繪製浮動提示文字
    this.floatingTexts.forEach(ft => {
      this.ctx.save();
      this.ctx.font = 'bold 12px sans-serif';
      this.ctx.fillStyle = ft.color;
      this.ctx.globalAlpha = Math.max(0, ft.life);
      this.ctx.textAlign = 'center';
      this.ctx.shadowColor = ft.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fillText(ft.text, ft.x, ft.y);
      this.ctx.restore();
    });

    // 繪製街機太空戰場過關結算面板（嵌入在太空中，星空依然捲動）
    if (this.isStageCleared && this.stageClearStats) {
      this.renderArcadeStageClear();
    }

    this.ctx.restore();
  }

  // 圓角矩形繪製輔助
  drawRoundRect(ctx, x, y, w, h, r = 8) {
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
    } else {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();
    }
  }

  // 矩形碰撞判定
  isPointInRect(px, py, rect) {
    if (!rect) return false;
    return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
  }

  // 繪製街機風格太空戰場過關結算面板 (Arcade Battlefield Stage Clear HUD)
  renderArcadeStageClear() {
    if (!this.stageClearStats) return;
    const stats = this.stageClearStats;
    const time = performance.now() * 0.001;
    const isMobile = this.width < 540;

    const cardW = Math.min(this.width * 0.92, isMobile ? 380 : 500);
    const cardH = Math.min(this.height * 0.78, isMobile ? 420 : 380);
    const cx = this.width / 2;
    const cy = Math.max(cardH / 2 + 18, Math.min(this.height * 0.44, this.height - cardH / 2 - 40));
    const left = cx - cardW / 2;
    const top = cy - cardH / 2;

    this.ctx.save();

    // 1. 半透明科幻座艙玻璃面板底層（可透視後方緩緩流動的深邃星空）
    this.ctx.shadowColor = '#0284c7';
    this.ctx.shadowBlur = 24;
    this.ctx.fillStyle = 'rgba(4, 12, 32, 0.82)';
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
    this.ctx.lineWidth = 1.8;
    this.drawRoundRect(this.ctx, left, top, cardW, cardH, 18);
    this.ctx.fill();
    this.ctx.stroke();

    // 2. 街機風格轉角科技護角 (Cyber L-Corner Brackets)
    const bLen = 14;
    this.ctx.strokeStyle = '#38bdf8';
    this.ctx.lineWidth = 2.5;
    // 左上
    this.ctx.beginPath();
    this.ctx.moveTo(left - 2, top + bLen);
    this.ctx.lineTo(left - 2, top - 2);
    this.ctx.lineTo(left + bLen, top - 2);
    this.ctx.stroke();
    // 右上
    this.ctx.beginPath();
    this.ctx.moveTo(left + cardW - bLen, top - 2);
    this.ctx.lineTo(left + cardW + 2, top - 2);
    this.ctx.lineTo(left + cardW + 2, top + bLen);
    this.ctx.stroke();
    // 左下
    this.ctx.beginPath();
    this.ctx.moveTo(left - 2, top + cardH - bLen);
    this.ctx.lineTo(left - 2, top + cardH + 2);
    this.ctx.lineTo(left + bLen, top + cardH + 2);
    this.ctx.stroke();
    // 右下
    this.ctx.beginPath();
    this.ctx.moveTo(left + cardW - bLen, top + cardH + 2);
    this.ctx.lineTo(left + cardW + 2, top + cardH + 2);
    this.ctx.lineTo(left + cardW + 2, top + cardH - bLen);
    this.ctx.stroke();

    // 3. 街機霓虹標題：MISSION ACCOMPLISHED / STAGE CLEAR
    const pulse = 0.85 + Math.sin(time * 4) * 0.15;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    // 頂部慶祝圖示與字樣
    let curY = top + (isMobile ? 28 : 34);
    this.ctx.font = `bold ${isMobile ? 11 : 12}px monospace`;
    this.ctx.fillStyle = `rgba(56, 189, 248, ${pulse})`;
    this.ctx.shadowColor = '#38bdf8';
    this.ctx.shadowBlur = 10;
    this.ctx.fillText('⚡ MISSION ACCOMPLISHED ⚡', cx, curY);

    curY += (isMobile ? 24 : 28);
    this.ctx.font = `900 ${isMobile ? 22 : 28}px sans-serif`;
    this.ctx.fillStyle = '#f8fafc';
    this.ctx.shadowColor = '#06b6d4';
    this.ctx.shadowBlur = 16;
    this.ctx.fillText(stats.stageTitle || 'STAGE CLEAR', cx, curY);

    if (stats.stageSubtitle) {
      curY += (isMobile ? 18 : 22);
      this.ctx.font = `500 ${isMobile ? 11 : 13}px sans-serif`;
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.shadowBlur = 0;
      this.ctx.fillText(stats.stageSubtitle, cx, curY);
    }

    // 4. 星級評定 ⭐⭐⭐
    curY += (isMobile ? 26 : 30);
    this.ctx.font = `${isMobile ? 26 : 32}px sans-serif`;
    this.ctx.shadowColor = '#eab308';
    this.ctx.shadowBlur = 12;
    const starStr = '⭐'.repeat(stats.stars) + '☆'.repeat(3 - stats.stars);
    this.ctx.fillText(starStr, cx, curY);

    // 5. 防護回血獎勵標章
    curY += (isMobile ? 22 : 25);
    this.ctx.font = `bold ${isMobile ? 10 : 11}px sans-serif`;
    this.ctx.shadowBlur = 0;
    const healText = stats.healed ? '🛡️ 基地防衛成功 · 生命防護 +1 ❤️' : '🛡️ 基地防衛成功 · 完美守護';
    const healW = this.ctx.measureText(healText).width + 20;
    this.ctx.fillStyle = 'rgba(244, 63, 94, 0.16)';
    this.ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    this.ctx.lineWidth = 1;
    this.drawRoundRect(this.ctx, cx - healW / 2, curY - 10, healW, 20, 10);
    this.ctx.fill();
    this.ctx.stroke();
    this.ctx.fillStyle = '#fda4af';
    this.ctx.fillText(healText, cx, curY);

    // 6. 嵌入式數據看板（4 大指標：目前總分、關卡擊破、最大連擊、本關命中率）
    curY += (isMobile ? 20 : 22);
    const statItems = [
      { label: '目前總分', value: `${stats.score}`, color: '#38bdf8' },
      { label: '關卡擊破', value: `${stats.defeated}`, color: '#c084fc' },
      { label: '最大連擊', value: `${stats.combo}`, color: '#fbbf24' },
      { label: '本關命中率', value: `${stats.accuracy}`, color: '#34d399' }
    ];

    const boxGap = isMobile ? 6 : 10;
    const boxH = isMobile ? 46 : 52;
    const padX = isMobile ? 16 : 24;
    const availableW = cardW - padX * 2;

    if (cardW >= 420 && !isMobile) {
      // 4 欄單排配置 (桌面寬版)
      const colW = (availableW - boxGap * 3) / 4;
      let startX = left + padX;
      for (let i = 0; i < 4; i++) {
        const item = statItems[i];
        const bx = startX + i * (colW + boxGap);
        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        this.ctx.lineWidth = 1;
        this.drawRoundRect(this.ctx, bx, curY, colW, boxH, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '10px sans-serif';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(item.label, bx + colW / 2, curY + 14);

        this.ctx.font = 'bold 16px monospace';
        this.ctx.fillStyle = item.color;
        this.ctx.fillText(item.value, bx + colW / 2, curY + 34);
      }
      curY += boxH + 16;
    } else {
      // 2x2 雙排配置 (手機或狹窄寬度)
      const colW = (availableW - boxGap) / 2;
      for (let i = 0; i < 4; i++) {
        const item = statItems[i];
        const row = Math.floor(i / 2);
        const col = i % 2;
        const bx = left + padX + col * (colW + boxGap);
        const by = curY + row * (boxH + 6);

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.72)';
        this.ctx.strokeStyle = 'rgba(51, 65, 85, 0.7)';
        this.ctx.lineWidth = 1;
        this.drawRoundRect(this.ctx, bx, by, colW, boxH, 8);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.font = '9px sans-serif';
        this.ctx.fillStyle = '#94a3b8';
        this.ctx.fillText(item.label, bx + colW / 2, by + 13);

        this.ctx.font = 'bold 15px monospace';
        this.ctx.fillStyle = item.color;
        this.ctx.fillText(item.value, bx + colW / 2, by + 32);
      }
      curY += boxH * 2 + 18;
    }

    // 7. 街機互動按鈕區：進入下一關 + 重練本關
    const btnH = isMobile ? 38 : 42;
    const btnPadX = isMobile ? 16 : 24;
    const btnTotalW = cardW - btnPadX * 2;
    const replayW = isMobile ? 80 : 100;
    const nextW = btnTotalW - replayW - 10;

    const nextX = left + btnPadX;
    const replayX = nextX + nextW + 10;
    const btnY = curY;

    // 記錄可點擊區域供點擊判定
    this.stageClearClickZones = {
      next: { x: nextX, y: btnY, w: nextW, h: btnH },
      replay: { x: replayX, y: btnY, w: replayW, h: btnH }
    };

    // 進入下一關按鈕（漸層發光按鈕）
    const nextGrad = this.ctx.createLinearGradient(nextX, btnY, nextX + nextW, btnY + btnH);
    nextGrad.addColorStop(0, '#06b6d4');
    nextGrad.addColorStop(1, '#2563eb');
    this.ctx.fillStyle = nextGrad;
    this.ctx.shadowColor = '#06b6d4';
    this.ctx.shadowBlur = 12;
    this.drawRoundRect(this.ctx, nextX, btnY, nextW, btnH, 10);
    this.ctx.fill();
    this.ctx.shadowBlur = 0;

    this.ctx.font = `bold ${isMobile ? 12 : 14}px sans-serif`;
    this.ctx.fillStyle = '#ffffff';
    const nextText = stats.isLastStage ? '🏆 全部通關！再玩一次 ➔' : '進入下一關 ➔ (Space / Enter)';
    this.ctx.fillText(nextText, nextX + nextW / 2, btnY + btnH / 2);

    // 重練本關按鈕（低調暗色）
    this.ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.8)';
    this.ctx.lineWidth = 1;
    this.drawRoundRect(this.ctx, replayX, btnY, replayW, btnH, 10);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = `bold ${isMobile ? 11 : 12}px sans-serif`;
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.fillText('重練 🔄 (R)', replayX + replayW / 2, btnY + btnH / 2);

    this.ctx.restore();
  }

  // 繪製「壯麗星空與銀河」(Magnificent Starfield, Milky Way & Shooting Star)
  renderStarfield() {
    if (!this.stars || this.stars.length === 0) return;
    const time = performance.now() * 0.001;
    this.ctx.save();

    // 1. 銀河星雲微光帶 (Milky Way Galactic Dust Bands，隨太空基地航行緩緩向下漂移)
    const gY = (this.galaxyOffsetY || 0) % this.height;
    // 雙層無縫連續漸層，呈現深空銀河天帶
    for (const offset of [-this.height, 0]) {
      const cy = gY + offset;
      const galaxyGrad1 = this.ctx.createLinearGradient(0, cy, this.width * 0.85, cy + this.height);
      galaxyGrad1.addColorStop(0.0, 'rgba(56, 189, 248, 0)');
      galaxyGrad1.addColorStop(0.35, 'rgba(99, 102, 241, 0.045)');
      galaxyGrad1.addColorStop(0.55, 'rgba(56, 189, 248, 0.06)');
      galaxyGrad1.addColorStop(0.70, 'rgba(147, 197, 253, 0.035)');
      galaxyGrad1.addColorStop(1.0, 'rgba(30, 58, 138, 0)');
      this.ctx.fillStyle = galaxyGrad1;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    // 第二道星團核心柔和光芒（右上部星雲隨星系緩動）
    const cycleH = this.height + 400;
    const nebulaCoreY = (((this.height * 0.32 + (this.galaxyOffsetY || 0) * 0.6) % cycleH) + cycleH) % cycleH - 200;
    const galaxyGrad2 = this.ctx.createRadialGradient(
      this.width * 0.78, nebulaCoreY, 10,
      this.width * 0.78, nebulaCoreY, 220
    );
    galaxyGrad2.addColorStop(0, 'rgba(224, 242, 254, 0.06)');
    galaxyGrad2.addColorStop(0.4, 'rgba(99, 102, 241, 0.035)');
    galaxyGrad2.addColorStop(1, 'rgba(15, 23, 42, 0)');
    this.ctx.fillStyle = galaxyGrad2;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // 2. 宏偉壯麗的巨型光環土星 (Majestic Ringed Saturn Gas Giant)
    if (this.saturn && this.saturn.active) {
      this.renderSaturn(this.saturn);
    }

    // 3. 繪製壯麗繁星 (300+ 顆多層次視差星群)
    for (let i = 0; i < this.stars.length; i++) {
      const star = this.stars[i];
      const sx = star.x;
      const sy = star.y;

      // 閃爍呼吸光感 (Gentle Scintillation)
      const twinkle = 0.72 + Math.sin(time * star.twinkleSpeed + star.twinklePhase) * 0.28;
      const alpha = Math.min(1.0, Math.max(0.1, star.baseAlpha * twinkle));

      if (star.isSuperStar) {
        // 金星／天狼星級別超大巨星：多層日冕光暈 + 四芒星衍射光線 (Diffraction Spikes)
        this.ctx.save();
        this.ctx.shadowColor = star.glowColor || '#38bdf8';
        this.ctx.shadowBlur = 12;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        this.ctx.fill();

        // 柔和十字星芒 (Cross-spike diffraction)
        this.ctx.strokeStyle = `rgba(224, 242, 254, ${alpha * 0.7})`;
        this.ctx.lineWidth = 0.8;
        this.ctx.beginPath();
        // 水平星芒
        this.ctx.moveTo(sx - 9, sy);
        this.ctx.lineTo(sx + 9, sy);
        // 垂直星芒
        this.ctx.moveTo(sx, sy - 9);
        this.ctx.lineTo(sx, sy + 9);
        this.ctx.stroke();
        this.ctx.restore();
      } else if (star.isBright) {
        // 一等耀眼亮星：柔和星光圓暈
        this.ctx.save();
        this.ctx.shadowColor = star.color;
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = star.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else if (star.isClusterStar) {
        // 昴宿星團成員星
        this.ctx.save();
        this.ctx.shadowColor = '#38bdf8';
        this.ctx.shadowBlur = 4;
        this.ctx.fillStyle = star.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.beginPath();
        this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.restore();
      } else {
        // 大量背景星塵與二三等星（極致效能快繪）
        this.ctx.fillStyle = star.color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(sx, sy, star.size, star.size);
      }
    }

    // 3. 偶然劃過天際的流星 (Shooting Star / Meteor)
    if (this.shootingStar && this.shootingStar.active && this.shootingStar.life > 0) {
      const ss = this.shootingStar;
      const headX = ss.x;
      const headY = ss.y;
      const speed = Math.sqrt(ss.vx * ss.vx + ss.vy * ss.vy) || 1;
      const tailX = headX - (ss.vx / speed) * ss.length;
      const tailY = headY - (ss.vy / speed) * ss.length;

      const meteorGrad = this.ctx.createLinearGradient(tailX, tailY, headX, headY);
      meteorGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
      meteorGrad.addColorStop(0.65, `rgba(56, 189, 248, ${ss.life * 0.45})`);
      meteorGrad.addColorStop(1, `rgba(255, 255, 255, ${ss.life * 0.95})`);

      this.ctx.save();
      this.ctx.strokeStyle = meteorGrad;
      this.ctx.lineWidth = 1.6;
      this.ctx.beginPath();
      this.ctx.moveTo(tailX, tailY);
      this.ctx.lineTo(headX, headY);
      this.ctx.stroke();

      // 流星頭部微芒
      this.ctx.shadowColor = '#38bdf8';
      this.ctx.shadowBlur = 6;
      this.ctx.fillStyle = `rgba(255, 255, 255, ${ss.life})`;
      this.ctx.beginPath();
      this.ctx.arc(headX, headY, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
    }

    this.ctx.restore();
  }

  // 繪製浩瀚壯麗的巨型光環土星 (Majestic Ringed Saturn Gas Giant - 參考天文觀測照之低調沉穩色彩)
  renderSaturn(st) {
    if (!st || !st.active) return;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(st.x, st.y);
    ctx.rotate(st.tilt);

    const r = st.radius;          // 行星半徑 (約 26px)
    const outR = st.ringOuterR;    // 光環外長軸 (約 72px)
    const inR = st.ringInnerR;     // 光環內長軸 (約 38px)
    const ratio = st.ratio || 0.35; // 橢圓扁率 (短軸/長軸)

    // --- A. 光環後半段（位於行星球體後方，y < 0）---
    ctx.save();
    ctx.beginPath();
    ctx.rect(-outR - 20, -outR - 20, (outR + 20) * 2, outR + 20);
    ctx.clip();
    this.drawSaturnRings(ctx, outR, inR, ratio, r);
    ctx.restore();

    // --- B. 土星本體球體 (Gas Giant Sphere with Muted Atmospheric Bands) ---
    ctx.save();
    // 極淡微光暈（去除刺眼高飽和黃光，營造深空真實沉靜感）
    ctx.shadowColor = 'rgba(215, 210, 195, 0.12)';
    ctx.shadowBlur = 6;

    // 球體 3D 漸層（低飽和米杏、灰褐、暗石板陰影，呈現真實天文望遠鏡質感）
    const sphereGrad = ctx.createRadialGradient(
      -r * 0.32, -r * 0.32, r * 0.06,
      0, 0, r
    );
    sphereGrad.addColorStop(0.0, '#ded5bf'); // 陽照高光：低調柔和米白灰
    sphereGrad.addColorStop(0.28, '#c4b99f'); // 柔和淺卡其砂色
    sphereGrad.addColorStop(0.55, '#9e957e'); // 灰褐色過渡
    sphereGrad.addColorStop(0.78, '#6e6755'); // 暗石板橄欖灰
    sphereGrad.addColorStop(0.92, '#3e3a30'); // 背光陰影
    sphereGrad.addColorStop(1.0, '#1a1915');  // 深邃太空邊緣

    ctx.fillStyle = sphereGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // 行星表面水平氣體條紋（低對比淡雅雲帶）
    ctx.clip();
    const bands = [
      { y: -r * 0.58, h: 3.2, color: 'rgba(75, 70, 58, 0.25)' },
      { y: -r * 0.36, h: 4.0, color: 'rgba(210, 202, 182, 0.18)' },
      { y: -r * 0.15, h: 3.5, color: 'rgba(95, 90, 75, 0.22)' },
      { y:  r * 0.08, h: 4.5, color: 'rgba(225, 218, 198, 0.22)' },
      { y:  r * 0.30, h: 5.0, color: 'rgba(145, 138, 118, 0.20)' },
      { y:  r * 0.54, h: 3.5, color: 'rgba(60, 56, 45, 0.30)' }
    ];
    for (const b of bands) {
      ctx.fillStyle = b.color;
      ctx.fillRect(-r, b.y, r * 2, b.h);
    }

    // 光環在土星本體上投影的細膩暗影 (Shadow of Ring on Planet)
    ctx.fillStyle = 'rgba(18, 16, 14, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.12, r * 0.96, r * 0.10, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // --- C. 光環前半段（穿過行星前方，y >= 0）---
    ctx.save();
    ctx.beginPath();
    ctx.rect(-outR - 20, 0, (outR + 20) * 2, outR + 20);
    ctx.clip();
    this.drawSaturnRings(ctx, outR, inR, ratio, r);
    ctx.restore();

    ctx.restore();
  }

  // 繪製土星多層次精緻光環結構 (A環、卡西尼環縫、B環、C環 - 低調銀灰骨白質感)
  drawSaturnRings(ctx, outR, inR, ratio, planetR) {
    ctx.save();
    ctx.scale(1, ratio); // 將同心圓縮放為橢圓，使放射狀漸層完全貼合橢圓環帶

    // 1. C環（最內圈暗淡薄環 / Crepe Ring）
    ctx.beginPath();
    ctx.arc(0, 0, inR, 0, Math.PI * 2);
    ctx.arc(0, 0, inR * 0.80, 0, Math.PI * 2, true);
    ctx.fillStyle = 'rgba(110, 105, 95, 0.15)';
    ctx.fill('evenodd');

    // 2. B環（最亮主冰環：低飽和銀灰與低調骨白）
    const bOuterR = outR * 0.79;
    ctx.beginPath();
    ctx.arc(0, 0, bOuterR, 0, Math.PI * 2);
    ctx.arc(0, 0, inR, 0, Math.PI * 2, true);
    const bGrad = ctx.createRadialGradient(0, 0, inR, 0, 0, bOuterR);
    bGrad.addColorStop(0.0, 'rgba(145, 140, 126, 0.25)'); // 內側過渡
    bGrad.addColorStop(0.38, 'rgba(202, 196, 178, 0.65)'); // 最亮核心區：骨白銀灰
    bGrad.addColorStop(0.82, 'rgba(178, 172, 155, 0.58)'); // 主環中外層
    bGrad.addColorStop(1.0, 'rgba(135, 130, 115, 0.38)');  // 環縫前收邊
    ctx.fillStyle = bGrad;
    ctx.fill('evenodd');

    // 3. 卡西尼環縫 (Cassini Division): bOuterR (0.79) 到 aInnerR (0.83) 自然留空，深空背景透出！

    // 4. A環（外側光環：略暗於B環的細膩石板灰銀）
    const aInnerR = outR * 0.83;
    ctx.beginPath();
    ctx.arc(0, 0, outR, 0, Math.PI * 2);
    ctx.arc(0, 0, aInnerR, 0, Math.PI * 2, true);
    const aGrad = ctx.createRadialGradient(0, 0, aInnerR, 0, 0, outR);
    aGrad.addColorStop(0.0, 'rgba(148, 142, 128, 0.38)');
    aGrad.addColorStop(0.55, 'rgba(165, 160, 145, 0.46)');
    aGrad.addColorStop(0.92, 'rgba(125, 120, 108, 0.28)');
    aGrad.addColorStop(1.0, 'rgba(88, 84, 75, 0.05)');
    ctx.fillStyle = aGrad;
    ctx.fill('evenodd');

    // 5. 光環最外側微細柔化外緣（極細低調微光，不刺眼）
    ctx.strokeStyle = 'rgba(185, 180, 165, 0.20)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 0, outR, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 繪製「地球大氣層」(如同太空俯瞰地球大氣層邊緣：淡淡一層藍白漸層，靜態優雅，不喧賓奪主)
  renderEarthAtmosphere() {
    const hintLineY = this.hintLineY || (this.height * 0.54);
    this.ctx.save();

    // 淡淡一層藍白漸層帶（總高度約 38px，平滑自然過渡）
    // 依據真實地球太空觀測照：太空深黑 ➔ 幽深寶藍 ➔ 鮮亮天藍 ➔ 地平線白藍光暈 ➔ 漸隱
    const bandTop = hintLineY - 16;
    const bandHeight = 40;
    const atmosGrad = this.ctx.createLinearGradient(0, bandTop, 0, bandTop + bandHeight);

    atmosGrad.addColorStop(0.00, 'rgba(0, 20, 80, 0)');        // 頂部太空：完全透明
    atmosGrad.addColorStop(0.25, 'rgba(2, 132, 199, 0.08)');    // 外大氣層：淡淡寶藍微光
    atmosGrad.addColorStop(0.48, 'rgba(56, 189, 248, 0.22)');   // 平流層：澄澈天藍
    atmosGrad.addColorStop(0.58, 'rgba(224, 242, 254, 0.35)');  // 核心地平線：柔和白藍
    atmosGrad.addColorStop(0.72, 'rgba(56, 189, 248, 0.16)');   // 低空層：淡天藍
    atmosGrad.addColorStop(0.88, 'rgba(2, 132, 199, 0.05)');    // 漸變餘韻
    atmosGrad.addColorStop(1.00, 'rgba(0, 0, 0, 0)');          // 柔和融入背景

    this.ctx.fillStyle = atmosGrad;
    this.ctx.fillRect(0, bandTop, this.width, bandHeight);

    // 核心微弱天際輪廓細線（極細 1px，半透明柔白）
    this.ctx.strokeStyle = 'rgba(240, 249, 255, 0.28)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(0, hintLineY);
    this.ctx.lineTo(this.width, hintLineY);
    this.ctx.stroke();

    // 右側低調字樣（極淺字色，不干擾畫面中央焦點）
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = 'rgba(186, 230, 253, 0.30)';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'bottom';
    this.ctx.fillText('☁️ 大氣層 (提示顯現)', this.width - 12, hintLineY - 3);

    this.ctx.restore();
  }

  // 繪製「地平線遠景高樓天際線」(取代呆板虛線，彷彿遠眺橫濱港夜景，高樓微凸於地面)
  renderCitySkyline() {
    const bottomLineY = this.bottomLineY || (this.height - 65);
    this.ctx.save();

    // 1. 城市夜空微光 (Nocturnal Urban Haze / Horizon Glow)
    const glowH = 35;
    const glowGrad = this.ctx.createLinearGradient(0, bottomLineY - glowH, 0, bottomLineY);
    glowGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
    glowGrad.addColorStop(0.5, 'rgba(30, 58, 138, 0.08)');
    glowGrad.addColorStop(1, 'rgba(56, 189, 248, 0.12)');
    this.ctx.fillStyle = glowGrad;
    this.ctx.fillRect(0, bottomLineY - glowH, this.width, glowH);

    // 2. 模組化遠景城市高樓 (Procedural Distant City Blocks, 寬度約 260px 循環鋪滿地平線)
    const moduleW = 260;
    const repeatCount = Math.ceil(this.width / moduleW) + 1;

    for (let m = 0; m < repeatCount; m++) {
      const ox = m * moduleW;

      // --- 後排遠景建築剪影（較暗深藍，營造縱深）---
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      this.ctx.fillRect(ox + 8, bottomLineY - 24, 18, 24);
      this.ctx.fillRect(ox + 42, bottomLineY - 18, 22, 18);
      this.ctx.fillRect(ox + 95, bottomLineY - 28, 16, 28);
      this.ctx.fillRect(ox + 140, bottomLineY - 20, 26, 20);
      this.ctx.fillRect(ox + 195, bottomLineY - 22, 15, 22);

      // 後排微弱白光窗戶
      this.ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
      for (let r = 0; r < 4; r++) {
        this.ctx.fillRect(ox + 11, bottomLineY - 21 + r * 5, 2, 2);
        this.ctx.fillRect(ox + 16, bottomLineY - 21 + r * 5, 2, 2);
        this.ctx.fillRect(ox + 144, bottomLineY - 17 + r * 4, 3, 1.5);
        this.ctx.fillRect(ox + 152, bottomLineY - 17 + r * 4, 3, 1.5);
      }

      // --- 前排精緻城市建築群（微微凸起的高樓與地標輪廓）---
      // 建築 1: 橫濱地標塔風 (Yokohama Landmark Tower) - 梯形逐層收窄 + 頂部天線
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(ox + 20, bottomLineY - 24, 15, 24);
      this.ctx.fillRect(ox + 22, bottomLineY - 30, 11, 6);
      this.ctx.fillRect(ox + 24, bottomLineY - 34, 7, 4);
      // 頂部避雷天線與微紅信標
      this.ctx.fillStyle = '#64748b';
      this.ctx.fillRect(ox + 27, bottomLineY - 40, 1, 6);
      this.ctx.fillStyle = '#ef4444';
      this.ctx.fillRect(ox + 27, bottomLineY - 41, 1.5, 1.5);
      // 亮藍與暖黃窗景
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(ox + 23, bottomLineY - 22, 2, 3);
      this.ctx.fillRect(ox + 28, bottomLineY - 22, 2, 3);
      this.ctx.fillStyle = '#fde047';
      this.ctx.fillRect(ox + 23, bottomLineY - 15, 2, 3);
      this.ctx.fillRect(ox + 28, bottomLineY - 15, 2, 3);
      this.ctx.fillRect(ox + 25, bottomLineY - 28, 2, 2);

      // 建築 2: 帆船造型洲際飯店風 (InterContinental Sail silhouette)
      this.ctx.fillStyle = '#111d33';
      this.ctx.beginPath();
      this.ctx.moveTo(ox + 65, bottomLineY);
      this.ctx.lineTo(ox + 65, bottomLineY - 25);
      this.ctx.quadraticCurveTo(ox + 78, bottomLineY - 25, ox + 80, bottomLineY);
      this.ctx.closePath();
      this.ctx.fill();
      // 弧形窗光
      this.ctx.fillStyle = '#7dd3fc';
      this.ctx.fillRect(ox + 68, bottomLineY - 20, 2, 2);
      this.ctx.fillRect(ox + 72, bottomLineY - 18, 2, 2);
      this.ctx.fillRect(ox + 68, bottomLineY - 14, 2, 2);
      this.ctx.fillRect(ox + 73, bottomLineY - 12, 2, 2);

      // 建築 3: 摩天輪 (Cosmo Clock 21 Ferris Wheel)
      const fx = ox + 115;
      const fy = bottomLineY - 10;
      this.ctx.strokeStyle = 'rgba(236, 72, 153, 0.45)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(fx, fy, 8, 0, Math.PI * 2);
      this.ctx.stroke();
      // 摩天輪七彩光點
      this.ctx.fillStyle = '#f472b6';
      this.ctx.fillRect(fx - 1, fy - 8, 1.5, 1.5);
      this.ctx.fillRect(fx - 1, fy + 7, 1.5, 1.5);
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(fx - 8, fy - 1, 1.5, 1.5);
      this.ctx.fillRect(fx + 7, fy - 1, 1.5, 1.5);
      this.ctx.fillStyle = '#fde047';
      this.ctx.fillRect(fx - 5, fy - 5, 1.5, 1.5);
      this.ctx.fillRect(fx + 4, fy + 4, 1.5, 1.5);

      // 建築 4: 現代方正辦公大樓 (垂直藍霓虹飾條)
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(ox + 135, bottomLineY - 22, 18, 22);
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(ox + 138, bottomLineY - 20, 1.5, 16); // 藍色垂直光條
      this.ctx.fillStyle = '#fef08a';
      for (let r = 0; r < 3; r++) {
        this.ctx.fillRect(ox + 144, bottomLineY - 19 + r * 5, 4, 2);
      }

      // 建築 5: 紅磚倉庫／低矮商業街廓 (Red Brick Warehouse)
      this.ctx.fillStyle = '#1e293b';
      this.ctx.fillRect(ox + 162, bottomLineY - 11, 26, 11);
      this.ctx.fillStyle = '#fbbf24';
      for (let w = 0; w < 4; w++) {
        this.ctx.fillRect(ox + 166 + w * 5, bottomLineY - 7, 2.5, 2.5);
      }

      // 建築 6: 階梯式玻璃大廈 (Stepped Glass Tower)
      this.ctx.fillStyle = '#0d1527';
      this.ctx.fillRect(ox + 200, bottomLineY - 18, 16, 18);
      this.ctx.fillRect(ox + 203, bottomLineY - 23, 10, 5);
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(ox + 207, bottomLineY - 27, 1, 4);
      this.ctx.fillStyle = '#f0f9ff';
      this.ctx.fillRect(ox + 204, bottomLineY - 15, 2, 2);
      this.ctx.fillRect(ox + 209, bottomLineY - 15, 2, 2);
      this.ctx.fillRect(ox + 204, bottomLineY - 9, 2, 2);
      this.ctx.fillRect(ox + 209, bottomLineY - 9, 2, 2);

      // 建築 7: 細長電波塔
      this.ctx.fillStyle = '#475569';
      this.ctx.fillRect(ox + 235, bottomLineY - 28, 1.5, 28);
      this.ctx.fillStyle = '#38bdf8';
      this.ctx.fillRect(ox + 234, bottomLineY - 29, 3, 1.5);

      // 建築 8: 矮平房交錯填補
      this.ctx.fillStyle = '#131d33';
      this.ctx.fillRect(ox + 242, bottomLineY - 8, 16, 8);
      this.ctx.fillStyle = '#f59e0b';
      this.ctx.fillRect(ox + 246, bottomLineY - 5, 2, 2);
      this.ctx.fillRect(ox + 252, bottomLineY - 5, 2, 2);
    }

    // 3. 水面／地面底座與夜景微光倒影 (Waterfront Base & Light Reflections)
    const baseH = this.height - bottomLineY;
    const baseGrad = this.ctx.createLinearGradient(0, bottomLineY, 0, this.height);
    baseGrad.addColorStop(0, '#0c1322');
    baseGrad.addColorStop(1, '#060a12');
    this.ctx.fillStyle = baseGrad;
    this.ctx.fillRect(0, bottomLineY, this.width, baseH);

    // 水面微弱垂直彩色倒影（波光粼粼）
    for (let m = 0; m < repeatCount; m++) {
      const ox = m * moduleW;
      // 地標塔金藍倒影
      this.ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
      this.ctx.fillRect(ox + 22, bottomLineY + 2, 10, 16);
      // 洲際飯店天藍倒影
      this.ctx.fillStyle = 'rgba(125, 211, 252, 0.05)';
      this.ctx.fillRect(ox + 67, bottomLineY + 2, 12, 12);
      // 摩天輪粉紅倒影
      this.ctx.fillStyle = 'rgba(244, 114, 182, 0.05)';
      this.ctx.fillRect(ox + 112, bottomLineY + 2, 8, 14);
      // 紅磚倉庫暖黃倒影
      this.ctx.fillStyle = 'rgba(251, 191, 36, 0.06)';
      this.ctx.fillRect(ox + 165, bottomLineY + 2, 20, 10);
    }

    // 4. 地平線防禦實線（告別粗硬虛線，以 1.2px 柔和天藍細線勾勒岸線）
    this.ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
    this.ctx.lineWidth = 1.2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, bottomLineY);
    this.ctx.lineTo(this.width, bottomLineY);
    this.ctx.stroke();

    // 5. 右下角低調文字標註（不干擾中央防空砲火）
    this.ctx.font = '10px monospace';
    this.ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText('🏙️ 地表防線', this.width - 12, bottomLineY + 6);

    this.ctx.restore();
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
    const isPastHintLine = (t.y + t.height >= (this.hintLineY || this.height * 0.54));

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
    } else if (isPastHintLine) {
      // 穿入地球大氣層：微光淡天藍邊框，柔和不刺眼
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      this.ctx.strokeStyle = '#38bdf8';
      this.ctx.lineWidth = 1.6;
      this.ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
      this.ctx.shadowBlur = 8;
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
    const hintY = t.isWord ? drawY + 42 : drawY + 50;

    if (typed.length > 0) {
      const typedPart = defaultRomaji.substring(0, typed.length);
      this.ctx.font = 'bold 12px monospace';

      // 只有在已穿入地球大氣層且開啟提示時，才顯示剩餘未打的明碼字母；
      // 若仍在防護區外（上方），僅顯示已打字母，其餘字元保持遮罩（•），絕不洩漏未打拼音！
      const showFullRemaining = isPastHintLine && this.showHints;

      if (showFullRemaining) {
        const remainingPart = defaultRomaji.substring(typed.length);
        const fullWidth = this.ctx.measureText(defaultRomaji).width;
        let curX = drawX + t.width / 2 - fullWidth / 2;

        this.ctx.textAlign = 'left';
        // 已輸入字母（高亮綠色）
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillText(typedPart, curX, hintY);
        curX += this.ctx.measureText(typedPart).width;

        // 剩餘字母（明碼琥珀黃，緊急輔助）
        this.ctx.fillStyle = '#fbbf24';
        this.ctx.fillText(remainingPart, curX, hintY);
      } else {
        // 大氣層外：已打字母顯示綠色，未打字母顯示遮罩圓點，強迫大腦繼續回想！
        const remainingMask = '•'.repeat(defaultRomaji.length - typed.length);
        const displayStr = typedPart + remainingMask;
        const fullWidth = this.ctx.measureText(displayStr).width;
        let curX = drawX + t.width / 2 - fullWidth / 2;

        this.ctx.textAlign = 'left';
        // 已輸入字母（高亮綠色，確認命中）
        this.ctx.fillStyle = '#4ade80';
        this.ctx.fillText(typedPart, curX, hintY);
        curX += this.ctx.measureText(typedPart).width;

        // 剩餘未打字母（暗色圓點遮罩，不透漏拼音內容）
        this.ctx.fillStyle = '#64748b';
        this.ctx.fillText(remainingMask, curX, hintY);
      }
    } else if (isPastHintLine && this.showHints) {
      // 尚未輸入，但已過「地球大氣層邊界」：亮起大氣穿透拼音提示！
      this.ctx.font = 'bold 11px monospace';
      this.ctx.fillStyle = '#fde047'; // 醒目大氣金黃光提示
      const hintText = t.isWord 
        ? `☁️ ${defaultRomaji} · ${t.subText.split(' [')[0]}`
        : `☁️ ${defaultRomaji}`;
      this.ctx.fillText(hintText, drawX + t.width / 2, hintY);
    } else if (t.isWord) {
      // 尚未穿入大氣層且為單字：只顯示中文意思提供語意聯想，隱藏羅馬拼音！
      this.ctx.font = '11px sans-serif';
      this.ctx.fillStyle = '#64748b'; // 低調灰
      this.ctx.fillText(t.subText.split(' [')[0], drawX + t.width / 2, hintY);
    } else {
      // 五十音在大氣層前完全不顯示拼音！強迫大腦主動聯想發音！
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
    const deltaTime = timestamp - (this.lastTime || timestamp);
    this.lastTime = timestamp;

    if (this.isPlaying && !this.isPaused) {
      this.update(deltaTime);
    } else {
      // 待機、暫停或過關結算狀態下，維持宇宙基地背景多層次視差星空航行（Ambient Drift）
      // 過關時星空依然平穩或以巡航速度捲動，沒有任何敵人出現
      const cruiseProgress = this.isStageCleared ? 0.35 : 0;
      this.updateStars(cruiseProgress);
      this.updateShootingStar();

      // 更新過關時尚未消失的剩餘爆炸粒子
      if (this.particles && this.particles.length > 0) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
          const p = this.particles[i];
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          if (p.life <= 0) this.particles.splice(i, 1);
        }
      }
    }
    this.render();

    this.animationFrameId = requestAnimationFrame(t => this.loop(t));
  }
}

window.KanaTypingGame = KanaTypingGame;
