// ========================================
// 設定
// ========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycby_OQ5DcuYRTVJ2xgHGB88oQJHA0lzrjpG1eFD5Q6Aa0A_vf5h5cZjEUbn6k623ojibvg/exec"; // ★変更

const CATEGORY_MASTER = {
  "まちづくり・都市計画": { small: ["都市計画・再開発", "公園・緑地", "道路・交通インフラ", "防災・防犯", "景観・街並み", "住宅政策"] },
  "子育て・教育": { small: ["保育・幼児教育", "学校教育", "青少年育成", "子育て支援", "特別支援教育", "社会教育"] },
  "福祉・健康・共生": { small: ["高齢者福祉", "障害者福祉", "医療・健康", "地域共生", "生活困窮者支援", "男女共同参画"] },
  "環境・持続可能性": { small: ["ごみ・リサイクル", "エネルギー・温暖化対策", "自然保護・生物多様性", "公害対策", "環境学習", "気候変動適応"] },
  "行政・市民参加・活力": { small: ["市民協働・参画", "行財政改革", "産業・雇用", "文化・スポーツ", "観光・交流", "DX・デジタル化"] }
};

const AI_BASE_SUMMARY = {
  "まちづくり・都市計画": "まちづくり・都市計画の現状：芦屋市では高経年マンションの建替え需要が顕在化しており、南芦屋浜地区の再開発と既成市街地の景観保全の両立が課題です。阪神間の住宅都市として、JR芦屋駅・阪神芦屋駅周辺の歩行者空間再編、自転車走行環境整備、緑地の質向上が求められています。防災面では南海トラフ地震を想定した津波避難対策、土砂災害警戒区域の対策、密集市街地の耐震化促進が急務です。市民参加型の都市計画マスタープラン策定が進行中で、地域特性を活かしたまちづくりが模索されています。",
  "子育て・教育": "子育て・教育環境の現状：待機児童は解消傾向にあるものの、保育の質向上と多様な保育ニーズへの対応が課題です。小中学校では35人学級が実現し、1人1台端末によるICT教育環境も整備されましたが、教員の働き方改革と不登校児童生徒への支援体制充実が求められています。放課後児童クラブの待機解消、医療的ケア児支援、ひとり親家庭支援、子育て世帯の孤立防止が重点施策です。芦屋市教育大綱では「自立と共生」を理念に掲げ、探究的な学びを推進しています。",
  "福祉・健康・共生": "福祉・健康・共生の現状：高齢化率28%に達し、2040年には35%を超える見込みです。要介護認定者数が増加する中、介護人材不足が深刻化しており、地域包括ケアシステムの深化と介護予防の推進が急務です。障害者の社会参加促進、認知症施策の推進、生活困窮者自立支援、ひきこもり支援の強化が図られています。健康寿命延伸に向け、特定健診受診率向上、がん検診推進、フレイル予防に取り組んでいます。多文化共生、性的マイノリティ支援、男女共同参画も重要課題として位置づけられています。",
  "環境・持続可能性": "環境・持続可能性の現状：2050年カーボンニュートラル達成に向け、公共施設のZEB化推進と住宅用太陽光発電・蓄電池補助を拡充しています。ごみ総量は微減傾向ですが、プラスチック資源循環法への対応強化が必要です。芦屋川・六甲山系の自然環境保全と生物多様性保全が重要課題で、外来種対策も進めています。気候変動適応策として、熱中症対策、豪雨災害への備え、グリーンインフラ整備を強化しています。環境学習センターを拠点とした環境教育と、市民・事業者との協働による環境まちづくりを推進しています。",
  "行政・市民参加・活力": "行政・市民参加・活力の現状：人口減少と生産年齢人口減により将来的な税収減が見込まれる中、行財政改革と公共施設マネジメントの推進が急務です。市民協働では、まちづくり協議会やNPOとの連携を強化していますが、若年層や現役世代の市政参加促進が課題です。DX推進により、マイナンバーカードを活用した行政手続きのオンライン化、キャッシュレス決済導入を進めています。産業面では起業支援、商店街活性化、テレワーク環境整備に取り組んでいます。文化面では芦屋市立美術博物館を核とした文化創造都市を目指し、スポーツ振興も図っています。"
};

let currentUserId = null;
let tempAiAnalysisJson = null;
let currentBigCat = null;
let currentSmallCat = null;

// ========================================
// 初期化
// ========================================
document.addEventListener('DOMContentLoaded', () => {
  initUserId();
  initTabs();
  initFilters();
  fetchOpinions();
});

function initUserId() {
  currentUserId = localStorage.getItem('ashiya_user_id');
  if (!currentUserId) {
    currentUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('ashiya_user_id', currentUserId);
  }
}

function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');
      const tabId = e.target.id.replace('-btn', '');
      document.getElementById(tabId).classList.add('active');
      if (tabId === 'map-tab') renderBaseSummary();
      if (tabId === 'list-tab') fetchOpinions();
    });
  });
}

function initFilters() {
  const bigSelect = document.getElementById('filterBigCat');
  Object.keys(CATEGORY_MASTER).forEach(bigName => {
    const opt = document.createElement('option');
    opt.value = bigName;
    opt.textContent = bigName;
    bigSelect.appendChild(opt);
  });

  bigSelect.addEventListener('change', (e) => {
    const smallSelect = document.getElementById('filterSmallCat');
    smallSelect.innerHTML = '<option value="">すべての中分類</option>';
    const selected = CATEGORY_MASTER[e.target.value];
    if (selected) {
      selected.small.forEach(small => {
        const opt = document.createElement('option');
        opt.value = small;
        opt.textContent = small;
        smallSelect.appendChild(opt);
      });
    }
  });
}

// ========================================
// 提案作成タブ
// ========================================
async function aiAnalysis() {
  const content = document.getElementById("content").value.trim();
  if (!content) {
    showStatus('submitStatus', '提案内容を入力してください', 'error');
    return;
  }

  const btn = document.getElementById("aiAnalysisBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> AI分析中...';
  document.getElementById("aiResult").innerHTML = '<span style="color: #6b7280;">AI分析中...</span>';

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: "analyze",
        content,
        userId: currentUserId
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === "success") {
      document.getElementById("aiResult").innerHTML = data.result;
      tempAiAnalysisJson = data.aiAnalysisJson;
      currentBigCat = data.bigCat;
      currentSmallCat = data.smallCat;
    } else {
      document.getElementById("aiResult").innerHTML = `<span style="color: #dc2626;">エラー: ${escapeHtml(data.message)}</span>`;
    }
  } catch (err) {
    console.error('AI Analysis Error:', err);
    document.getElementById("aiResult").innerHTML = `<span style="color: #dc2626;">通信エラー: ${escapeHtml(err.message)}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function submitOpinion() {
  const content = document.getElementById("content").value.trim();
  if (!content) {
    showStatus('submitStatus', '提案内容を入力してください', 'error');
    return;
  }

  if (!currentBigCat ||!currentSmallCat) {
    showStatus('submitStatus', '先に「AI壁打ち実行」を押して分類してください', 'error');
    return;
  }

  const btn = document.getElementById("submitBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.textContent = "登録中...";

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: "submit",
        content,
        bigCatName: currentBigCat,
        smallCatName: currentSmallCat,
        userId: currentUserId,
        aiAnalysisJson: tempAiAnalysisJson || ''
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === "success") {
      showStatus('submitStatus', '提案を登録しました！', 'success');
      document.getElementById("content").value = "";
      tempAiAnalysisJson = null;
      currentBigCat = null;
      currentSmallCat = null;
      document.getElementById("aiResult").innerHTML = '<span style="color: #9ca3af;">「AI壁打ち実行」を押すと、AIが自動分類と改善アドバイスを表示します</span>';
      setTimeout(() => {
        document.getElementById('list-tab-btn').click();
      }, 1500);
    } else {
      showStatus('submitStatus', `登録失敗: ${data.message}`, 'error');
    }
  } catch (err) {
    console.error('Submit Error:', err);
    showStatus('submitStatus', `通信エラー: ${err.message}`, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ========================================
// 提案一覧タブ
// ========================================
async function fetchOpinions() {
  const list = document.getElementById("opinionsList");
  list.innerHTML = '<span style="color: #6b7280;"><span class="loading"></span> 読み込み中...</span>';

  const bigCat = document.getElementById("filterBigCat").value;
  const smallCat = document.getElementById("filterSmallCat").value;
  const sortBy = document.getElementById("sortBy").value;

  try {
    const url = new URL(GAS_URL);
    url.searchParams.append('action', 'list');
    url.searchParams.append('userId', currentUserId);
    if (bigCat) url.searchParams.append('bigCat', bigCat);
    if (smallCat) url.searchParams.append('smallCat', smallCat);
    if (sortBy) url.searchParams.append('sortBy', sortBy);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === "success") {
      if (data.opinions && data.opinions.length > 0) {
        list.innerHTML = data.opinions.map(op => `
          <div class="opinion-item">
            <div class="opinion-meta">
              <span class="badge badge-blue">${escapeHtml(op.big_category)}</span>
              <span class="badge badge-green">${escapeHtml(op.small_category)}</span>
              <span>${new Date(op.timestamp).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span>👍 ${op.like_count || 0}</span>
            </div>
            ${op.recommended_title? `<div style="margin-bottom: 8px; font-weight: 600; color: #1e40af;">${escapeHtml(op.recommended_title)}</div>` : ''}
            <div class="opinion-content">${escapeHtml(op.content)}</div>
            <button class="like-btn ${op.user_liked? 'liked' : ''}" onclick="toggleLike(${op.id}, ${op.user_liked})">
              ${op.user_liked? '❤️ いいね済み' : '🤍 いいね'} (${op.like_count || 0})
            </button>
          </div>
        `).join('');
      } else {
        list.innerHTML = '<div style="text-align: center; padding: 40px; color: #9ca3af;">提案がありません</div>';
      }
    } else {
      list.innerHTML = `<div class="status-message status-error">エラー: ${escapeHtml(data.message)}</div>`;
    }
  } catch (err) {
    console.error('Fetch Opinions Error:', err);
    list.innerHTML = `<div class="status-message status-error">通信エラー: ${escapeHtml(err.message)}</div>`;
  }
}

async function toggleLike(opinionId, currentlyLiked) {
  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: "toggleLike",
        opinionId,
        like:!currentlyLiked,
        userId: currentUserId
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.status === "success") {
      fetchOpinions();
    } else {
      alert(`エラー: ${data.message}`);
    }
  } catch (err) {
    console.error('Toggle Like Error:', err);
    alert(`通信エラー: ${err.message}`);
  }
}

// ========================================
// アイデアの地図タブ
// ========================================
function renderBaseSummary() {
  const container = document.getElementById("baseSummaryContainer");
  if (!container) return;

  let html = "";
  Object.keys(CATEGORY_MASTER).forEach((bigName, idx) => {
    const summary = AI_BASE_SUMMARY[bigName] || "要約未設定";
    const smallCats = CATEGORY_MASTER[bigName].small.map(s => `<span class="badge badge-purple" style="margin: 2px;">${s}</span>`).join('');

    html += `
      <div class="card">
        <h4 style="margin: 0 0 12px 0; color: #1f2937; font-size: 18px; display: flex; align-items: center; gap: 10px;">
          <span class="badge badge-blue" style="font-size: 13px;">BIG-${idx + 1}</span>
          ${bigName}
        </h4>
        <p style="margin: 0 0 12px 0; font-size: 15px; line-height: 1.9; color: #374151;">${summary}</p>
        <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
          <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px; font-weight: 600;">中分類:</div>
          <div>${smallCats}</div>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

async function generateFinalProposal() {
  const originalContent = document.getElementById("content").value.trim();
  if (!originalContent) {
    alert("先に「提案作成」タブで提案内容を入力し、AI壁打ちを実行してください");
    document.getElementById('create-tab-btn').click();
    return;
  }

  if (!currentBigCat) {
    alert("先に「AI壁打ち実行」を押して分類してください");
    return;
  }

  const btn = document.getElementById("generateFinalBtn");
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = '<span class="loading"></span> 生成中...';
  document.getElementById("finalProposalText").innerHTML = '<span style="color: #6b7280;"><span class="loading"></span> AIが市民の声を統合して300字の政策提言を生成中...</span>';

  try {
    const res = await fetch(GAS_URL, {
      method: "POST",
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({
        action: "generateFinal",
        originalContent,
        bigCatName: currentBigCat,
        userId: currentUserId
      })
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    if (data.status === "success") {
      document.getElementById("finalProposalText").innerHTML = `
        ${escapeHtml(data.result)}
        <div style="margin-top: 16px; padding-top: 16px; border-top: 2px solid #e5e7eb; font-size: 13px; color: #6b7280; display: flex; align-items: center; gap: 8px;">
          <span class="badge badge-orange">統合済み</span>
          同大分類の市民の声 ${data.citizenCount || 0}件を統合して生成（${data.charCount}字）
        </div>
      `;
    } else {
      document.getElementById("finalProposalText").innerHTML = `<span style="color: #dc2626;">生成失敗: ${escapeHtml(data.message)}</span>`;
    }
  } catch (err) {
    console.error('Generate Final Proposal Error:', err);
    document.getElementById("finalProposalText").innerHTML = `<span style="color: #dc2626;">通信エラー: ${escapeHtml(err.message)}</span>`;
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// ========================================
// ユーティリティ
// ========================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showStatus(elementId, message, type) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `status-message status-${type}`;
  el.textContent = message;
  setTimeout(() => {
    el.textContent = '';
    el.className = '';
  }, 4000);
}
