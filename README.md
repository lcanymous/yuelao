# 月老 YUELAO AI 🧧

> *「天下有情人，終成眷屬——除非你的要求比你的條件好太多。」*

AI 月老。不生假人清單，也不說廢話。
直接幫你算命定對象、分析你現在在追的人、然後順便戳破你的戀愛腦。

**👉 [yuelao69.netlify.app](https://yuelao69.netlify.app)**

免費。不用下載。不用登入。30 秒出結果。

---

## 功能

### 🔴 配對命定
填你的靈魂檔案（生日、星座、MBTI、職業、收入、習慣），設定理想對象條件，月老生成 **TOP 3 命定對象**，附契合度分析、命定理由、AI 人像。

### 🔍 真人分析
不想要假人？**直接描述你現在喜歡的真實對象**。月老分析你們的相容性，給你：
- 相容指數（0–100）
- 優勢與潛在風險（紅/黃旗分級）
- 月老最想對你說的一句話
- 3 個具體可執行的下一步

### 🔥 毒舌模式
開啟後月老不再溫柔。AI 犀利批評你的不切實際、矛盾條件、戀愛腦思維。
語氣：見過太多傻瓜的老神仙，乾式幽默，句句到肉。

### 🪬 月老現實指數
純前端即時計算，不消耗 API。偵測你的自身條件 vs 要求條件之間的落差：
- 收入落差（你月收 3 萬要找財務自由的人？）
- 學歷落差
- 條件清單複雜度
- 資料空白卻要求很多

有矛盾才顯示，沒矛盾不打擾。

### 💬 追問月老
結果出來後可以繼續問 3 次（免費）。配對模式問「第一個對象平常喜歡做什麼」，真人分析模式問「他這個行為代表什麼」。

---

## AI 引擎

| 模式 | 說明 |
|------|------|
| 月老雲端 AI（預設） | Netlify Function 代理，使用者免設定 |
| Gemini 2.5 Flash | 自帶 Google API Key |
| OpenRouter | 自帶 Key，可自選模型 |

右上角設定齒輪切換。

---

## 本地開發

純靜態網頁，沒有 build step。

```bash
git clone https://github.com/lcanymous/yuelao.git
cd yuelao
# 用任意 HTTP server 開起來即可，例如：
npx serve .
# 或
python3 -m http.server 8080
```

Serverless function 需要 Netlify CLI：

```bash
npm install -g netlify-cli
netlify dev
```

在 Netlify Dashboard 設定環境變數 `OPENROUTER_API_KEY`。

---

## CLI 版（Terminal 互動）

```bash
export OPENROUTER_API_KEY=sk-or-xxxx
node cli/yuelao.mjs
```

---

## 技術棧

- **Frontend**: 原生 HTML / CSS / JavaScript（無框架）
- **樣式**: Tailwind CSS (CDN) + 自訂 CSS
- **Icons**: Lucide Icons
- **Backend**: Netlify Functions (Node.js)
- **AI**: OpenRouter / Gemini 2.5 Flash
- **圖像**: Pollinations.ai（AI 生圖）+ DiceBear（fallback）
- **部署**: Netlify（免費方案）

---

## 專案結構

```
yuelao/
├── index.html              # 單頁主體
├── css/style.css           # 自訂樣式
├── js/
│   ├── wizard.js           # 步驟控制
│   ├── loading.js          # 月老施法動畫
│   ├── api.js              # AI 呼叫（三模式）
│   └── app.js              # 主邏輯
├── netlify/functions/
│   ├── match.js            # AI 配對 proxy
│   └── genimage.js         # AI 生圖 proxy
├── netlify.toml
└── cli/yuelao.mjs          # Terminal 版
```

---

Made with 🧧 by **[Lawrence Chen](https://github.com/lcanymous)**

*「紅線一繫，月老不負責後續。」*
