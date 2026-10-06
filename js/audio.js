// 音效與日語語音引擎 (Web Audio API + Web Speech API + HTML5 Audio BGM)
const BGM_TRACKS = {
  menu: { path: 'music/Departure_Window.mp3', title: 'Departure Window', desc: '選單／整備航站' },
  'music/Departure_Window.mp3': { title: 'Departure Window', desc: '選單／整備航站' },
  'music/Intercept_Course.mp3': { title: 'Intercept Course', desc: '第 1 關・大氣層攔截航道' },
  'music/Orbit_of_the_Forgotten.mp3': { title: 'Orbit of the Forgotten', desc: '第 2~4 關・遺忘深空軌道' },
  'music/Stellar_Reactor_Breach.mp3': { title: 'Stellar Reactor Breach', desc: '第 5 關 Boss・反應爐總攻' },
  'music/Ammonia_Horizon.mp3': { title: 'Ammonia Horizon', desc: '第 6 關・氨氣地平線濁音航線' },
  'music/Path_Of_The_Frozen_Crown.mp3': { title: 'Path Of The Frozen Crown', desc: '第 7~10 關・冰冠前哨片假名' },
  'music/Titan_s_Wake.mp3': { title: "Titan's Wake", desc: '第 11 關 Boss・泰坦巨艦降臨' },
  'music/Gravity_s_Edge.mp3': { title: "Gravity's Edge", desc: '第 12~13 關・重力邊緣平片對決' },
  'music/Escape_Vector.mp3': { title: 'Escape Vector', desc: '第 14~16 關・脫離向量生活實戰' },
  'music/Where_Starlight_Ends.mp3': { title: 'Where Starlight Ends', desc: '第 17 關 Final Boss・星光終點大決戰' }
};

class AudioManager {
  constructor() {
    this.audioCtx = null;

    // === 音效 (SFX) 開關（記憶使用者上次設定） ===
    const savedSfxEnabled = localStorage.getItem('kana_defense_sfx_enabled');
    this.sfxEnabled = savedSfxEnabled !== null ? savedSfxEnabled === 'true' : true;

    // === 真人語音 (Voice) 開關（記憶使用者上次設定） ===
    const savedVoiceEnabled = localStorage.getItem('kana_defense_voice_enabled');
    this.voiceEnabled = savedVoiceEnabled !== null ? savedVoiceEnabled === 'true' : true;

    this.volume = 0.6;
    this.japaneseVoice = null;

    // === 背景音樂 (BGM) 系統 ===
    const savedBgmEnabled = localStorage.getItem('kana_defense_bgm_enabled');
    this.bgmEnabled = savedBgmEnabled !== null ? savedBgmEnabled === 'true' : true;
    
    const savedBgmVolume = localStorage.getItem('kana_defense_bgm_volume');
    this.bgmVolume = savedBgmVolume !== null ? parseFloat(savedBgmVolume) : 0.5;

    // 雙播放器平滑交叉淡入淡出 (Crossfade)
    this.bgmPlayerA = new Audio();
    this.bgmPlayerB = new Audio();
    this.bgmPlayerA.loop = true;
    this.bgmPlayerB.loop = true;
    this.bgmPlayerA.preload = 'auto';
    this.bgmPlayerB.preload = 'auto';

    this.activePlayerId = 'A'; // 'A' 或 'B'
    this.currentBgmPath = null;
    this.pendingBgmPath = null;
    this.fadeTimer = null;
    this.isDucked = false;
    this.duckFactor = 1.0;
    this.hasUserInteracted = false;

    this.initSpeech();
    this.initAutoplayUnlock();
  }

  // 註冊使用者首次互動監聽（滿足瀏覽器 Audio Autoplay 安全規範）
  initAutoplayUnlock() {
    const unlockHandler = () => {
      this.hasUserInteracted = true;
      this.ensureAudioContext();

      // 若有先前受限於 Autoplay 規範未播放的 BGM，立即播放
      if (this.pendingBgmPath && this.bgmEnabled) {
        const path = this.pendingBgmPath;
        this.pendingBgmPath = null;
        this.playBGM(path);
      } else if (!this.currentBgmPath && this.bgmEnabled) {
        // 預設播選單配樂 Departure_Window.mp3
        this.playMenuBGM();
      }

      window.removeEventListener('pointerdown', unlockHandler);
      window.removeEventListener('keydown', unlockHandler);
      window.removeEventListener('touchstart', unlockHandler);
    };

    window.addEventListener('pointerdown', unlockHandler, { passive: true });
    window.addEventListener('keydown', unlockHandler, { passive: true });
    window.addEventListener('touchstart', unlockHandler, { passive: true });
  }

  // 確保 AudioContext 在使用者互動後喚醒
  ensureAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  // 初始化 Web Speech API 日語發音語音
  initSpeech() {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        this.japaneseVoice = voices.find(v => v.lang.startsWith('ja') || v.lang === 'ja_JP' || v.name.includes('Japanese')) || null;
      };

      loadVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
  }

  // 日語真人朗讀 (Web Speech API)
  speak(text) {
    if (!this.voiceEnabled || !('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel(); // 避免堆積延遲
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ja-JP';
      utterance.rate = 0.95; // 稍微放慢，初學者聽得更清楚
      utterance.pitch = 1.05;
      utterance.volume = this.volume;
      if (this.japaneseVoice) {
        utterance.voice = this.japaneseVoice;
      }
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // ==========================================
  // === 背景音樂 (BGM) 控制核心 ===
  // ==========================================

  // 取得目前啟用的 Audio 元素
  getActivePlayer() {
    return this.activePlayerId === 'A' ? this.bgmPlayerA : this.bgmPlayerB;
  }

  // 取得備用的 Audio 元素
  getStandbyPlayer() {
    return this.activePlayerId === 'A' ? this.bgmPlayerB : this.bgmPlayerA;
  }

  // 計算目前實際應有的 BGM 增益
  getEffectiveBgmVolume() {
    if (!this.bgmEnabled) return 0;
    const base = Math.max(0, Math.min(1, this.bgmVolume));
    return base * (this.isDucked ? this.duckFactor : 1.0);
  }

  // 播放指定 BGM 軌跡（支援平滑交叉淡入淡出 Crossfade）
  playBGM(trackPath, loop = true) {
    if (!trackPath) return;

    // 若同一首曲目已在播放中，無須重新觸發淡入，只需確保播放中
    if (this.currentBgmPath === trackPath) {
      const cur = this.getActivePlayer();
      if (this.bgmEnabled && cur.paused && cur.src) {
        cur.play().catch(() => { this.pendingBgmPath = trackPath; });
      }
      this.updateBgmUI();
      return;
    }

    const curPlayer = this.getActivePlayer();
    const nextPlayer = this.getStandbyPlayer();

    // 更新目標曲目路徑
    this.currentBgmPath = trackPath;
    this.isDucked = false;
    this.duckFactor = 1.0;

    nextPlayer.src = trackPath;
    nextPlayer.loop = loop;
    nextPlayer.volume = 0;

    // 若使用者尚未點擊過網頁，暫存待觸發
    if (!this.hasUserInteracted) {
      this.pendingBgmPath = trackPath;
      this.updateBgmUI();
      // 嘗試播放一次，如果瀏覽器許可（例如已累積互動）便直接開播
      const p = nextPlayer.play();
      if (p !== undefined) {
        p.then(() => {
          this.hasUserInteracted = true;
          this.executeCrossfade(curPlayer, nextPlayer);
        }).catch(() => {
          // 被阻擋，等待使用者首次手勢解鎖
        });
      }
      return;
    }

    if (!this.bgmEnabled) {
      this.activePlayerId = this.activePlayerId === 'A' ? 'B' : 'A';
      this.updateBgmUI();
      return;
    }

    // 執行平滑交叉轉移
    const playPromise = nextPlayer.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        this.executeCrossfade(curPlayer, nextPlayer);
      }).catch(err => {
        console.warn('BGM Play blocked or failed:', err);
        this.pendingBgmPath = trackPath;
      });
    }

    this.updateBgmUI();
  }

  // 平滑淡入淡出轉移
  executeCrossfade(fromPlayer, toPlayer, durationMs = 600) {
    if (this.fadeTimer) {
      clearInterval(this.fadeTimer);
      this.fadeTimer = null;
    }

    const startTime = performance.now();
    const targetVol = this.getEffectiveBgmVolume();
    const startFromVol = fromPlayer.volume;

    this.fadeTimer = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);

      // 上一首淡出，新一首淡入
      toPlayer.volume = Math.max(0, Math.min(1, targetVol * progress));
      fromPlayer.volume = Math.max(0, Math.min(1, startFromVol * (1 - progress)));

      if (progress >= 1) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        fromPlayer.pause();
        fromPlayer.currentTime = 0;
        fromPlayer.volume = 0;
        toPlayer.volume = targetVol;
        // 切換主要指針
        this.activePlayerId = this.activePlayerId === 'A' ? 'B' : 'A';
      }
    }, 40);
  }

  // 播放選單／整備航站配樂 (Departure_Window.mp3)
  playMenuBGM() {
    this.playBGM('music/Departure_Window.mp3');
  }

  // 根據關卡資料播放對應配樂
  playStageBGM(stageIndex = 0) {
    const stages = window.CAMPAIGN_STAGES;
    let track = 'music/Intercept_Course.mp3';
    if (stages && stages[stageIndex] && stages[stageIndex].bgm) {
      track = stages[stageIndex].bgm;
    }
    this.playBGM(track);
  }

  // 暫停 BGM
  pauseBGM() {
    const cur = this.getActivePlayer();
    if (cur) cur.pause();
  }

  // 恢復 BGM
  resumeBGM() {
    if (!this.bgmEnabled) return;
    const cur = this.getActivePlayer();
    if (cur && cur.src) {
      cur.volume = this.getEffectiveBgmVolume();
      cur.play().catch(() => {});
    } else if (this.currentBgmPath) {
      this.playBGM(this.currentBgmPath);
    }
  }

  // 暫時壓低音量（如暫停選單、過關歡呼或爆炸時）
  duckBGM(duckFactor = 0.35) {
    this.isDucked = true;
    this.duckFactor = duckFactor;
    const cur = this.getActivePlayer();
    if (cur && !cur.paused) {
      cur.volume = this.getEffectiveBgmVolume();
    }
  }

  // 恢復正常音量
  restoreBGM() {
    this.isDucked = false;
    this.duckFactor = 1.0;
    const cur = this.getActivePlayer();
    if (cur && !cur.paused) {
      cur.volume = this.getEffectiveBgmVolume();
    }
  }

  // 停止 BGM
  stopBGM() {
    const cur = this.getActivePlayer();
    if (cur) {
      cur.pause();
      cur.currentTime = 0;
    }
    this.currentBgmPath = null;
    this.pendingBgmPath = null;
    this.updateBgmUI();
  }

  // 設定 BGM 啟用開關
  setBGMEnabled(enabled) {
    this.bgmEnabled = enabled;
    localStorage.setItem('kana_defense_bgm_enabled', enabled.toString());
    if (enabled) {
      if (this.currentBgmPath) {
        this.resumeBGM();
      } else {
        this.playMenuBGM();
      }
    } else {
      this.pauseBGM();
    }
    this.updateBgmUI();
  }

  // 切換 BGM 靜音開關
  toggleBGM() {
    this.setBGMEnabled(!this.bgmEnabled);
  }

  // 設定 BGM 音量 (0.0 ~ 1.0)
  setBGMVolume(vol) {
    this.bgmVolume = Math.max(0, Math.min(1, vol));
    localStorage.setItem('kana_defense_bgm_volume', this.bgmVolume.toString());
    const cur = this.getActivePlayer();
    if (cur) {
      cur.volume = this.getEffectiveBgmVolume();
    }
    this.updateBgmUI();
  }

  // 取得曲目資訊
  getCurrentTrackInfo() {
    if (!this.currentBgmPath) {
      return { title: 'Departure Window', desc: '選單／整備航站', path: 'music/Departure_Window.mp3' };
    }
    return BGM_TRACKS[this.currentBgmPath] || {
      title: this.currentBgmPath.split('/').pop().replace('.mp3', '').replace(/_/g, ' '),
      desc: '太空航行配樂',
      path: this.currentBgmPath
    };
  }

  // === 音效 (SFX) 開關與持久化 ===
  setSFXEnabled(enabled) {
    this.sfxEnabled = !!enabled;
    localStorage.setItem('kana_defense_sfx_enabled', this.sfxEnabled.toString());
    this.updateAudioUI();
  }

  toggleSFX() {
    this.setSFXEnabled(!this.sfxEnabled);
  }

  // === 真人語音 (Voice) 開關與持久化 ===
  setVoiceEnabled(enabled) {
    this.voiceEnabled = !!enabled;
    localStorage.setItem('kana_defense_voice_enabled', this.voiceEnabled.toString());
    this.updateAudioUI();
  }

  toggleVoice() {
    this.setVoiceEnabled(!this.voiceEnabled);
  }

  // 同步更新 DOM UI 上的所有音訊開關狀態、音量與歌曲標題
  updateAudioUI() {
    const info = this.getCurrentTrackInfo();

    // 1. 背景音樂 (BGM) UI
    const titleEl = document.getElementById('bgmTrackTitle');
    if (titleEl) {
      titleEl.textContent = this.bgmEnabled ? info.title : '(音樂已關閉)';
    }

    const bgmToggle = document.getElementById('bgmToggle');
    if (bgmToggle && bgmToggle.checked !== this.bgmEnabled) {
      bgmToggle.checked = this.bgmEnabled;
    }

    const pauseBgmToggle = document.getElementById('pauseBgmToggle');
    if (pauseBgmToggle && pauseBgmToggle.checked !== this.bgmEnabled) {
      pauseBgmToggle.checked = this.bgmEnabled;
    }

    const volumeSlider = document.getElementById('bgmVolumeSlider');
    if (volumeSlider) {
      volumeSlider.value = Math.round(this.bgmVolume * 100);
    }

    const volumeText = document.getElementById('bgmVolumeVal');
    if (volumeText) {
      volumeText.textContent = `${Math.round(this.bgmVolume * 100)}%`;
    }

    const quickBgmBtn = document.getElementById('quickBgmBtn');
    if (quickBgmBtn) {
      const iconSpan = quickBgmBtn.querySelector('.bgm-icon') || quickBgmBtn;
      if (quickBgmBtn.querySelector('.bgm-icon')) {
        quickBgmBtn.querySelector('.bgm-icon').textContent = this.bgmEnabled ? '🎵' : '🔇';
      } else {
        quickBgmBtn.innerHTML = this.bgmEnabled ? '🎵' : '🔇';
      }
      quickBgmBtn.title = this.bgmEnabled ? `音樂: ${info.title} (點擊關閉)` : '音樂: 已關閉 (點擊開啟)';
      if (this.bgmEnabled) {
        quickBgmBtn.classList.remove('opacity-50');
      } else {
        quickBgmBtn.classList.add('opacity-50');
      }
    }

    const quickBgmTitle = document.getElementById('quickBgmTitle');
    if (quickBgmTitle) {
      quickBgmTitle.textContent = this.bgmEnabled ? info.title : '音樂已關閉';
    }

    // 2. 街機音效 (SFX) UI
    const sfxToggle = document.getElementById('sfxToggle');
    if (sfxToggle && sfxToggle.checked !== this.sfxEnabled) {
      sfxToggle.checked = this.sfxEnabled;
    }

    const pauseSfxToggle = document.getElementById('pauseSfxToggle');
    if (pauseSfxToggle && pauseSfxToggle.checked !== this.sfxEnabled) {
      pauseSfxToggle.checked = this.sfxEnabled;
    }

    const quickSfxBtn = document.getElementById('quickSfxBtn');
    if (quickSfxBtn) {
      const sfxIcon = quickSfxBtn.querySelector('.sfx-icon') || quickSfxBtn;
      if (quickSfxBtn.querySelector('.sfx-icon')) {
        quickSfxBtn.querySelector('.sfx-icon').textContent = this.sfxEnabled ? '🔊' : '🔈';
      } else {
        quickSfxBtn.innerHTML = this.sfxEnabled ? '🔊' : '🔈';
      }
      quickSfxBtn.title = this.sfxEnabled ? '音效: 已開啟 (點擊關閉)' : '音效: 已關閉 (點擊開啟)';
      if (this.sfxEnabled) {
        quickSfxBtn.classList.remove('opacity-50');
      } else {
        quickSfxBtn.classList.add('opacity-50');
      }
    }

    const quickSfxTitle = document.getElementById('quickSfxTitle');
    if (quickSfxTitle) {
      quickSfxTitle.textContent = this.sfxEnabled ? '音效開' : '音效關';
    }

    // 3. 真人語音 (Voice) UI
    const voiceToggle = document.getElementById('voiceToggle');
    if (voiceToggle && voiceToggle.checked !== this.voiceEnabled) {
      voiceToggle.checked = this.voiceEnabled;
    }
  }

  // 向下相容
  updateBgmUI() {
    this.updateAudioUI();
  }

  // === 8-Bit / 街機合成音效 (無需下載音檔) ===

  // 1. 雷射射擊音效
  playLaser() {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;

    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(110, now + 0.12);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  // 2. 擊中爆炸音效
  playHit() {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const bufferSize = ctx.sampleRate * 0.15;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // 白噪音生成
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35 * this.volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
  }

  // 3. 連擊獎勵音效（隨連擊數升高音調）
  playCombo(combo = 1) {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    const baseFreq = 440;
    const step = Math.min(combo, 12);
    // 五聲音階加成
    const pentatonic = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
    const semitone = pentatonic[step % pentatonic.length];
    const freq = baseFreq * Math.pow(2, semitone / 12);

    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.setValueAtTime(freq * 1.25, now + 0.06);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  // 4. 輸入失誤音效
  playMiss() {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.15);

    gain.gain.setValueAtTime(0.2 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.15);
  }

  // 5. 遊戲結束音效
  playGameOver() {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const notes = [330, 311, 293, 261]; // E4, Eb4, D4, C4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.18;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.25 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.22);
    });
  }

  // 6. 升級/過關音效
  playLevelUp() {
    if (!this.sfxEnabled) return;
    this.ensureAudioContext();
    if (!this.audioCtx) return;

    const ctx = this.audioCtx;
    const notes = [261.6, 329.6, 392.0, 523.3]; // C - E - G - C5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startTime = ctx.currentTime + idx * 0.1;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2 * this.volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
  }
}

window.audioManager = new AudioManager();
