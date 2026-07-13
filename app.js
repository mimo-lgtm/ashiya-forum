// app.js 完全版（ルート直下に置く）
const GAS_URL = "https://script.google.com/macros/s/AKfycbzhgqr0kNu0e53XuiTnB4wSS1N8n279GLGoT2iiiowWD7owb9U5pj6nL01eO_QTF0DHKg/exec";  // ← ここを自分のGAS URLに変更

const CATEGORY_MASTER = {
  "BIG-1": { name: "まちづくり・都市計画（住みやすさの基盤）", base: "芦屋市は六甲山と海に囲まれた恵まれた地形を活かし、住宅地としての品格と防災機能を両立するまちづくりが求められます..." },
  "BIG-2": { name: "子育て・教育環境（次世代を育てるまち）", base: "子どもたちが自ら学び、挑戦できる環境整備が急務です..." },
  "BIG-3": { name: "福祉・健康・共生（誰も取り残さないまち）", base: "高齢化が進む芦屋市では、医療・介護・予防が一体となった地域包括ケアの深化が必要です..." },
  "BIG-4": { name: "環境・持続可能性（未来に繋ぐ芦屋）", base: "2050年カーボンニュートラル実現に向け..." },
  "BIG-5": { name: "行政・市民参加・活力（未来を拓く力）", base: "市民と行政の協働により..." }
};

// ホーム描画
function renderHome() {
  const container = document.getElementById('homeCategories');
  container.innerHTML = '';

  Object.keys(CATEGORY_MASTER).forEach(key => {
    const cat = CATEGORY_MASTER[key];
    const card = document.createElement('div');
    card.className = 'cat-card';
    card.innerHTML = `
      <div class="cat-header">${cat.name}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;padding:22px;">
        <div class="map-left">
          <strong>未来提案の原点（アイデアの地図）</strong>
          <p style="margin-top:12px;font-size:0.95em;">${cat.base}</p>
        </div>
        <div class="update-right">
          <strong>提案集約・共創アップデート案</strong><br><br>
          <button class="update-btn" onclick="toggleUpdate(this, '${key}')">アップデートを表示</button>
          <div class="update-body" id="update-${key}">市民の新統合提案がここに表示されます（50%初期 + 50%新提案）</div>
        </div>
      </div>
    `;
    container.appendChild(card);
  });
}

function toggleUpdate(btn, key) {
  const body = document.getElementById(`update-${key}`);
  if (body) {
    const show = body.style.display !== 'block';
    body.style.display = show ? 'block' : 'none';
    btn.textContent = show ? '閉じる' : 'アップデートを表示';
  }
}

// AI壁打ち
async function runAI() {
  const text = document.getElementById('voiceInput').value.trim();
  if (!text) return alert('内容を入力してください');

  const resultDiv = document.getElementById('analysisResult');
  resultDiv.innerHTML = '<p>AI分析中...</p>';

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({ mode: 'analyze', text })
    });
    const data = await res.json();

    resultDiv.innerHTML = `
      <h3>分析結果</h3>
      <p><strong>大分類:</strong> ${data.main}</p>
      <p><strong>中分類:</strong> ${data.sub}</p>
      <p><strong>タイトル:</strong> ${data.title}</p>
      <button onclick="postToBoard()">この内容をボードに投稿</button>
    `;
  } catch(e) {
    resultDiv.innerHTML = `<p style="color:red">エラー: ${e.message}</p>`;
  }
}

function postToBoard() {
  alert('投稿完了！（実際はGASに保存されます）');
  showPage('board');
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

window.onload = () => {
  renderHome();
  showPage('home');
};
