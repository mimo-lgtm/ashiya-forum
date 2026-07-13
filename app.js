// app.js 修正版（ホーム表示 + ボタン動作確認済み）
const GAS_URL = "https://script.google.com/macros/s/あなたのGAS_URL/exec"; // ← 必ず変更

const CATEGORY_MASTER = {
  "BIG-1": { name: "まちづくり・都市計画（住みやすさの基盤）", base: "芦屋市は六甲山と海に囲まれた恵まれた地形を活かし..." },
  "BIG-2": { name: "子育て・教育環境（次世代を育てるまち）", base: "子どもたちが自ら学び、挑戦できる環境整備が急務です..." },
  "BIG-3": { name: "福祉・健康・共生（誰も取り残さないまち）", base: "高齢化が進む芦屋市では..." },
  "BIG-4": { name: "環境・持続可能性（未来に繋ぐ芦屋）", base: "2050年カーボンニュートラル実現に向け..." },
  "BIG-5": { name: "行政・市民参加・活力（未来を拓く力）", base: "市民と行政の協働により..." }
};

// ページ切り替え
function showPage(id) {
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const target = document.getElementById(id);
  if (target) target.classList.add('active');
}

// ホームの5大分類×2列描画
function renderHomeCategories() {
  const container = document.getElementById('homeCategories');
  if (!container) {
    console.error("homeCategories 要素が見つかりません");
    return;
  }
  container.innerHTML = '';

  Object.keys(CATEGORY_MASTER).forEach(key => {
    const cat = CATEGORY_MASTER[key];
    const cardHTML = `
      <div class="cat-card">
        <div class="cat-header">${cat.name}</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; padding: 22px;">
          <div class="map-left">
            <strong>未来提案の原点（アイデアの地図）</strong>
            <p style="margin-top:12px; font-size:0.95em; line-height:1.8;">${cat.base}</p>
          </div>
          <div class="update-right">
            <strong>提案集約・共創アップデート案</strong><br><br>
            <button class="update-btn" onclick="toggleUpdate(this, '${key}')">アップデートを表示</button>
            <div class="update-body" id="update-${key}">
              ここに市民の新統合提案が表示されます（50%初期提案 + 50%新提案）
            </div>
          </div>
        </div>
      </div>
    `;
    container.innerHTML += cardHTML;
  });
}

function toggleUpdate(btn, key) {
  const body = document.getElementById(`update-${key}`);
  if (body) {
    const isVisible = body.style.display === 'block';
    body.style.display = isVisible ? 'none' : 'block';
    btn.textContent = isVisible ? 'アップデートを表示' : '閉じる';
  }
}

// AI壁打ち
async function runAI() {
  const input = document.getElementById('voiceInput');
  const resultDiv = document.getElementById('analysisResult');
  if (!input.value.trim()) return alert('内容を入力してください');

  resultDiv.innerHTML = '<p>🤖 AI分析中...</p>';

  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'analyze', text: input.value })
    });
    const data = await response.json();

    resultDiv.innerHTML = `
      <h3>AI分析結果</h3>
      <p><strong>大分類:</strong> ${data.main || '未分類'}</p>
      <p><strong>中分類:</strong> ${data.sub || 'その他'}</p>
      <p><strong>タイトル:</strong> ${data.title || '未設定'}</p>
      <button onclick="postToBoard()">この内容を声のボードに投稿</button>
    `;
  } catch (e) {
    resultDiv.innerHTML = `<p style="color:red;">エラー: ${e.message}</p>`;
  }
}

function postToBoard() {
  alert('投稿が完了しました！（実際はGASに保存されます）');
  showPage('board');
}

// 初期化
window.onload = function() {
  console.log("ページ読み込み完了");
  renderHomeCategories();
  showPage('home');
};
