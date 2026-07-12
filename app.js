// グローバル変数。2重読み込み対策済み
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbyv4Hp_R9RP29hlrDkreNbrxBcFbLtm7ajSjl2QmpJKnm1X2HaiibwkI0ahW4Osf71x6Q/exec";
var allOpinions = window.allOpinions || [];

const CATEGORY_MASTER = {
  "BIG-1": { 
    name: "まちづくり・都市計画（住みやすさの基盤）", 
    mids: { "MID-1": "住宅・まちなみ", "MID-2": "交通・移動手段", "MID-3": "公園・緑地・景観", "MID-4": "防災・レジリエンス", "MID-5": "その他" } 
  },
  "BIG-2": { 
    name: "子育て・教育環境（次世代を育てるまち）", 
    mids: { "MID-1": "保育・教育施設", "MID-2": "子ども・若者の居場所", "MID-3": "学びの機会（生涯学習）", "MID-4": "家族支援", "MID-5": "その他" } 
  },
  "BIG-3": { 
    name: "福祉・健康・共生（誰も取り残さないまち）", 
    mids: { "MID-1": "高齢者支援", "MID-2": "障害者・多様な人々の支援", "MID-3": "健康づくり", "MID-4": "地域コミュニティ", "MID-5": "その他" } 
  },
  "BIG-4": { 
    name: "環境・持続可能性（未来に繋ぐ芦屋）", 
    mids: { "MID-1": "気候変動対策", "MID-2": "資源循環・ごみ問題", "MID-3": "自然環境保全", "MID-4": "エネルギー・脱炭素", "MID-5": "その他" } 
  },
  "BIG-5": { 
    name: "行政・市民参加・活力（未来を拓く力）", 
    mids: { "MID-1": "行政の透明性・効率化", "MID-2": "市民参加・協働", "MID-3": "文化・芸術・スポーツ", "MID-4": "産業・雇用・にぎわい", "MID-5": "その他" } 
  }
};

document.addEventListener("DOMContentLoaded", () => {
    // 初回読み込み
    fetchOpinions();
    
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    if (btnAiAnalysis) btnAiAnalysis.addEventListener("click", aiAnalysis);
    if (btnSubmitToBox) btnSubmitToBox.addEventListener("click", submitOpinion);
    
    // ★修正: タブ3「届いた提案箱」をクリックしたら再描画
    const listTabBtn = document.getElementById('list-tab-btn');
    if (listTabBtn) {
        listTabBtn.addEventListener('shown.bs.tab', () => {
            console.log('提案箱タブが表示された');
            renderProposalTree(allOpinions);
        });
    }
});

async function aiAnalysis() {
    const contentEl = document.getElementById("content");
    if (!contentEl) return alert("contentが見つかりません");
    const content = contentEl.value.trim();
    if (!content) {
        alert("内容を入力してください。");
        return;
    }

    try {
        const res = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "analyze", content: content })
        });
        const data = await res.json();
        if (data.status !== "success") {
            alert(data.message || "AI解析に失敗しました");
            return;
        }

        const r = data.result;
        const big = CATEGORY_MASTER[r.bigCatId];
        const bigCatName = big ? big.name : "その他";
        const midCatName = big && big.mids[r.midCatId] ? big.mids[r.midCatId] : "その他";

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };
        setVal("title", r["推奨タイトル"]);
        setVal("summary", r["要約200"]);
        setVal("bigCatName", bigCatName);
        setVal("midCatName", midCatName);

        const titleEl = document.getElementById("aiTitleText");
        if (titleEl) titleEl.textContent = r["推奨タイトル"] || "";

        const refinedEl = document.getElementById("aiRefinedText");
        if (refinedEl) refinedEl.textContent = r["要約200"] || "";

        const summaryEl = document.getElementById("aiSummaryText");
        if (summaryEl) summaryEl.innerHTML = `
<div class="mb-2"><span class="badge bg-info">大分類</span> ${escapeHtml(bigCatName)}</div>
<div class="mb-3"><span class="badge bg-secondary">中分類</span> ${escapeHtml(midCatName)}</div>
<b>核心</b><br>${escapeHtml(r["核心"])}<br><br>
<b>期待される変化</b><br>${escapeHtml(r["変化"])}<br><br>
<b>成功事例</b><br>${escapeHtml(r["成功事例"])}<br><br>
<b>懸念点</b><br>${escapeHtml(r["懸念点"])}<br><br>
<b>AIからの問い</b><br>${escapeHtml(r["問い"])}
`;

        document.getElementById("aiPlaceholder")?.classList.add("d-none");
        document.getElementById("aiAssistBox")?.classList.remove("d-none");

    } catch (err) {
        console.error(err);
        alert("AI通信エラー");
    }
}

// 1. 最初にこれ
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        if (data.status!== "success") {
            console.error(data.message);
            return;
        }
        allOpinions = data.opinions || [];
        renderProposalTree(allOpinions);
    } catch (err) {
        console.error(err);
    }
}

// 2. 次にこれ
async function submitOpinion() {
  const title = document.getElementById("title").value.trim();
  const summary = document.getElementById("summary").value.trim();
  const content = document.getElementById("content").value.trim();
  const bigCatName = document.getElementById("bigCatName").value.trim();
  const midCatName = document.getElementById("midCatName").value.trim();
  const author = document.getElementById("author").value.trim();

  // ★送る前にチェック
  console.log('=== 登録前の値 ===');
  console.log('title:', title);
  console.log('bigCatName:', bigCatName);
  console.log('midCatName:', midCatName);

  if (!title) return alert("タイトルが空です。AI壁打ちを実行してください");
  if (!bigCatName) return alert("大分類が空です。AI壁打ちを実行してください");

  try {
    const payload = { action: "addOpinion", title, summary, content, bigCatName, midCatName, author };
    console.log('=== GASに送るデータ ===', payload);

    const res = await fetch(GAS_URL, {
      method: "POST",
      body: JSON.stringify(payload)
    });
    
    const data = await res.json();
    console.log('=== GASからの返事 ===', data);

    if (data.status === "success") {
      await fetchOpinions();
      alert(`提案を登録しました。\n\nあなたの投稿は「${bigCatName}」→「${midCatName}」に格納されました。`);
      clearForm();
      document.getElementById('list-tab-btn')?.click();
      renderProposalTree(allOpinions);
    } else {
      alert("登録失敗\n理由: " + (data.message || JSON.stringify(data)));
    }
  } catch (err) {
    console.error('=== 通信エラー詳細 ===', err);
    alert("通信エラー\n" + err.toString());
  }
}
// 3. 最後にこれ
function renderProposalTree(opinions) {
  const container = document.getElementById("proposal-container");
  if (!container) return;
  container.innerHTML = '';

  Object.keys(CATEGORY_MASTER).forEach(bigId => {
    const big = CATEGORY_MASTER[bigId].name;
    const mids = CATEGORY_MASTER[bigId].mids;
    let bigHtml = "";
    let bigCount = 0;

    Object.keys(mids).forEach(midId => {
      const mid = mids[midId];
      const matched = opinions.filter(o => o.bigCatName === big && o.midCatName === mid);

      if (matched.length === 0) return;
      bigCount += matched.length;

      const newPosts = matched.filter(p => p.status === "新規" || p.status === "新提案" ||!p.status);
      const mergedPosts = matched.filter(p => p.status === "新統合");
      const originalPosts = matched.filter(p => p.status === "元記事");

      let postsHtml = '';

      newPosts.forEach(post => {
        postsHtml += `
          <div style="margin:6px 0; padding:10px; border-left:3px solid #198754; background:#fff;">
            <span class="badge bg-success">新提案</span>
            <div style="font-weight:600; margin-top:4px;">${escapeHtml(post.title)}</div>
            <div style="font-size:9pt; color:#666;">投稿者: ${escapeHtml(post.author || '匿名')}</div>
          </div>
        `;
      });

      mergedPosts.forEach(post => {
        postsHtml += `
          <div style="margin:6px 0; padding:10px; border-left:3px solid #ffc107; background:#fff;">
            <span class="badge bg-warning text-dark">新統合</span>
            <div style="font-weight:600; margin-top:4px;">${escapeHtml(post.title)}</div>
            <div style="font-size:9pt; color:#666;">投稿者: ${escapeHtml(post.author || '匿名')}</div>
          </div>
        `;
      });

      if (originalPosts.length > 0) {
        postsHtml += `
          <div style="margin:8px 0; border:1px dashed #6c757d; border-radius:6px;">
            <div class="original-toggle" style="padding:8px 10px; background:#f8f9fa; cursor:pointer; user-select:none;">
              ▶ 元記事 (${originalPosts.length}件) を表示
            </div>
            <div class="original-content" style="display:none; padding:8px;">
              ${originalPosts.map(post => `
                <div style="margin:4px 0; padding:8px; border-left:3px solid #6c757d; background:#fff; font-size:9.5pt;">
                  <span class="badge bg-secondary">元記事</span>
                  <div style="margin-top:2px;">${escapeHtml(post.title)}</div>
                  <div style="font-size:8pt; color:#666;">${escapeHtml(post.author || '匿名')}</div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      bigHtml += `
        <div style="margin:8px 0; border:1px solid #dee2e6; border-radius:8px;">
          <div class="mid-toggle" style="padding:10px; background:#f8f9fa; font-weight:600; cursor:pointer;">
            ▶ ${mid} (${matched.length}件)
          </div>
          <div class="mid-content" style="display:none; padding:8px;">
            ${postsHtml}
          </div>
        </div>
      `;
    });

    if (bigCount > 0) {
      container.innerHTML += `
        <div style="margin-bottom:16px; border:2px solid #0d6efd; border-radius:10px;">
          <div class="big-toggle" style="padding:14px; background:#0d6efd; color:#fff; font-weight:700; cursor:pointer;">
            ▶ ${big} (${bigCount}件)
          </div>
          <div class="big-content" style="display:none; padding:12px;">
            ${bigHtml}
          </div>
        </div>
      `;
    }
  });

  if (container.innerHTML === '') {
    container.innerHTML = '<div class="alert alert-secondary">まだ提案がありません</div>';
  }

  container.querySelectorAll('.big-toggle,.mid-toggle,.original-toggle').forEach(el => {
    el.addEventListener('click', function(e) {
      e.stopPropagation();
      const content = this.nextElementSibling;
      if (!content) return;
      const isOpen = content.style.display === 'block';
      content.style.display = isOpen? 'none' : 'block';
      this.innerHTML = this.innerHTML.replace(isOpen? '▼' : '▶', isOpen? '▶' : '▼');
    });
  });
}

function escapeHtml(text) {
  if (!text) return "";
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function toggleTree(element) {
    const body = element.nextElementSibling;
    if (!body) return;

    const isOpen = body.style.display === 'block';

    if (isOpen) {
        body.style.display = "none";
        element.innerHTML = element.innerHTML.replace("▼", "▶");
    } else {
        body.style.display = "block";
        element.innerHTML = element.innerHTML.replace("▶", "▼");
    }
}
function toggleTree(element) {
    const body = element.nextElementSibling;
    if (!body) return;

    const isOpen = body.style.display === 'block';

    if (isOpen) {
        body.style.display = "none";
        element.innerHTML = element.innerHTML.replace("▼", "▶");
    } else {
        body.style.display = "block";
        element.innerHTML = element.innerHTML.replace("▶", "▼");
    }
}

function toggleTree(element) {
    const body = element.nextElementSibling;
    if (!body) return;
    
    const currentDisplay = window.getComputedStyle(body).display;
    const isOpen = currentDisplay !== 'none';
    
    if (isOpen) {
        body.style.display = "none";
        element.innerHTML = element.innerHTML.replace("▼", "▶");
    } else {
        body.style.display = "block";
        element.innerHTML = element.innerHTML.replace("▶", "▼");
    }
}

function clearForm() {
    ["title","summary","content","bigCatName","midCatName","author"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });
    document.getElementById("aiPlaceholder")?.classList.remove("d-none");
    document.getElementById("aiAssistBox")?.classList.add("d-none");
}

function escapeHtml(text) {
    if (!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
