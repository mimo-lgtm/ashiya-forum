// app.js 完全版
const GAS_URL = "あなたのGAS再デプロイURLをここに入れてください";  // ← 必須

const CATEGORY_MASTER = {
  "BIG-1": { name: "まちづくり・都市計画", mids: { "MID-1": "住宅・まちなみ", "MID-2": "交通・移動手段", "MID-3": "公園・緑地・景観", "MID-4": "防災・レジリエンス", "MID-5": "その他" } },
  "BIG-2": { name: "子育て・教育環境", mids: { "MID-1": "保育・教育施設", "MID-2": "子ども・若者の居場所", "MID-3": "学びの機会（生涯学習）", "MID-4": "家族支援", "MID-5": "その他" } },
  "BIG-3": { name: "福祉・健康・共生", mids: { "MID-1": "高齢者支援", "MID-2": "障害者・多様な人々の支援", "MID-3": "健康づくり", "MID-4": "地域コミュニティ", "MID-5": "その他" } },
  "BIG-4": { name: "環境・持続可能性", mids: { "MID-1": "気候変動対策", "MID-2": "資源循環・ごみ問題", "MID-3": "自然環境保全", "MID-4": "エネルギー・脱炭素", "MID-5": "その他" } },
  "BIG-5": { name: "行政・市民参加・活力", mids: { "MID-1": "行政の透明性・効率化", "MID-2": "市民参加・協働", "MID-3": "文化・芸術・スポーツ", "MID-4": "産業・雇用・にぎわい", "MID-5": "その他" } }
};

let currentPost = {};

// AI壁打ち
async function runAI() {
  const text = document.getElementById('voiceInput').value.trim();
  if (!text) return alert('内容を入力してください');

  const resultDiv = document.getElementById('analysisResult');
  resultDiv.innerHTML = '<p>AI分析中...</p>';

  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({mode: 'analyze', text})
    });
    const data = await res.json();

    currentPost = {
      big: data.category,
      main: data.main,
      sub: data.sub || 'MID-5',
      title: data.title || '未設定',
      summary200: data.summary200 || '',
      fullText: text
    };

    resultDiv.innerHTML = `
      <h3>分析結果</h3>
      <p><strong>大分類:</strong> ${data.main}</p>
      <p><strong>中分類:</strong> ${data.sub}</p>
      <p><strong>タイトル:</strong> ${data.title}</p>
      <button onclick="postToBoard()">この内容を投稿する</button>
    `;
  } catch(e) {
    resultDiv.innerHTML = `<p style="color:red">エラー: ${e.message}</p>`;
  }
}

// 投稿 + 即時統合チェック
async function postToBoard() {
  try {
    await fetch(GAS_URL, {
      method: 'POST',
      body: JSON.stringify({mode: 'save', ...currentPost})
    });
    alert('投稿完了！ 声のボードで確認してください。');
    showPage('board');
    loadBoard();
  } catch(e) {
    alert('投稿エラー');
  }
}

function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ボード描画
async function loadBoard() {
  // 実装省略（必要なら追加）
  console.log('ボード読み込み');
}

// 初期化
window.onload = () => {
  showPage('home');
  // ホームの5大分類描画処理など
};
