// app.js
const SHEET_ID = "1AzUUpqhrrR7qis6_ylAC3Xe3XZkzl5b2obLES3mzWT4";
const API_KEY = ""; // 必要ならここにGoogle API Key（公開シートなら不要な場合あり）

const categories = [ /* 前の5分類と同じ */ ];

// スプレッドシートからデータ取得（CORS対応でApps Script Web App推奨）
async function loadPosts() {
    // 簡易版：公開シートURLからJSON取得（Google Apps Scriptでラップ推奨）
    console.log("スプレッドシートから投稿を読み込み中...");
    // 実際は fetch で Apps Script エンドポイントを呼ぶ
}

// 投稿処理
async function submitVoice() {
    const text = document.getElementById('voiceInput').value;
    if (!text) return;

    // AI分析シミュレーション → 本番はサーバーサイド or Grok API
    const analysis = simulateAIAnalysis(text);
    
    // スプレッドシートに追加（後で実装）
    alert("分析完了！ スプレッドシートに保存します。");
    
    document.getElementById('analysisResult').innerHTML = analysis;
}

// ボード描画
function renderBoard(posts) {
    // 大分類 → 中分類 → タイトル のツリー生成
    // status = "統合済" なら統合先表示など
}
