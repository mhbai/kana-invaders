# 👾 Kana Invaders (假名特攻隊)

一個專為日語初學者打造的復古街機風格打字防衛遊戲。透過鍵盤敲擊消除降落的假名與單字，零死背輕鬆掌握**日語五十音（平假名／片假名）**與 **JLPT N5 核心單字**！

> 🌟 **100% 純靜態網頁架構**：無須後端伺服器，支援直接部署至 **GitHub Pages** 免費上線，手機與電腦隨開隨玩！

---

## 🎮 遊戲特色

- 👾 **經典太空侵略者玩法**：敵艦帶有假名或單字不斷降落，敲擊對應的**羅馬拼音**即可發射雷射砲擊破！
- 🗣️ **Web Speech API 原生真人發音**：每次擊破或點選假名，自動播放純正標準日語朗讀。
- 🔊 **8-Bit 街機合成音效**：內建 Web Audio API 音效，秒速載入無延遲。
- 🎯 **多種學習範圍**：支援清音、濁音/半濁音、拗音、片假名專項、平片混合，以及 N5 實戰生活單字。
- ⚡ **彈性拼音輸入**：相容標準赫本式與訓令式（如 `shi/si`、`tsu/tu`、`chi/ti`）。
- 📝 **弱點覆盤複習**：結算畫面統整所有失誤項目，點擊立即聽音溫習。
- 📖 **內建速查庫**：隨時查閱五十音對照表與單字釋義。

---

## 🌐 如何部署到 GitHub Pages？

本專案採用純靜態資源（HTML + CSS + Vanilla JS），所有路徑均為相對路徑，非常適合託管於 GitHub Pages：

1. **在 GitHub 上建立名為 `kana-invaders` 的儲存庫**
2. **在本地專案目錄初始化並推送到 GitHub**：
   ```bash
   git init
   git add .
   git commit -m "feat: initial release of kana-invaders"
   git branch -M main
   git remote add origin https://github.com/mhbai/kana-invaders.git
   git push -u origin main
   ```
3. **開啟 GitHub Pages 免費託管**：
   - 進入該 GitHub 專案的 **Settings** ➔ **Pages**。
   - 在 **Build and deployment** 來源選擇 **Deploy from a branch**。
   - Branch 選擇 **`main`**，資料夾選擇 **`/(root)`**，點擊 **Save**。
4. **立即遊玩**：
   - 約等待 1~2 分鐘後，即可透過 `https://mhbai.github.io/kana-invaders/` 在任何設備上在線遊玩！

---

## 💻 本地離線運行

如需在本地端電腦運行測試，直接透過 Python 啟動輕量 HTTP 伺服器即可：

```bash
python3 -m http.server 8080
```
在瀏覽器打開：`http://localhost:8080`
