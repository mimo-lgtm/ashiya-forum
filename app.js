var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbz7_nn1uo5pr58A0uUm1VvxxcC3uiLdiDllXJf72T4Yv8gvdcrtr5KTEVxK8t3I_UJACg/exec";
var allOpinions = [];

const CATEGORY_MASTER = {
  "BIG-1": { name: "まちづくり・都市計画（住みやすさの基盤）", mids: { "MID-1": "住宅・まちなみ", "MID-2": "交通・移動手段", "MID-3": "公園・緑地・景観", "MID-4": "防災・レジリエンス", "MID-5": "その他" } },
  "BIG-2": { name: "子育て・教育環境（次世代を育てるまち）", mids: { "MID-1": "保育・教育施設", "MID-2": "子ども・若者の居場所", "MID-3": "学びの機会（生涯学習）", "MID-4": "家族支援", "MID-5": "その他" } },
  "BIG-3": { name: "福祉・健康・共生（誰も取り残さないまち）", mids: { "MID-1": "高齢者支援", "MID-2": "障害者・多様な人々の支援", "MID-3": "健康づくり", "MID-4": "地域コミュニティ", "MID-5": "その他" } },
  "BIG-4": { name: "環境・持続可能性（未来に繋ぐ芦屋）", mids: { "MID-1": "気候変動対策", "MID-2": "資源循環・ごみ問題", "MID-3": "自然環境保全", "MID-4": "エネルギー・脱炭素", "MID-5": "その他" } },
  "BIG-5": { name: "行政・市民参加・活力（未来を拓く力）", mids: { "MID-1": "行政の透明性・効率化", "MID-2": "市民参加・協働", "MID-3": "文化・芸術・スポーツ", "MID-4": "産業・雇用・にぎわい", "MID-5": "その他" } }
};

document.addEventListener("DOMContentLoaded", () => {
  fetchOpinions();
  document.getElementById("btnAiAnalysis")?.addEventListener("click", aiAnalysis);
  document.getElementById("btnSubmitToBox")?.addEventListener("click", submitOpinion);
  document.getElementById('list-tab-btn')?.addEventListener('shown.bs.tab', () => renderProposalTree(allOpinions));
});

async function aiAnalysis() {
  const content = document.getElementById("content").value.trim();
  if (!content) return alert("内容を入力してください");

  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ action: "analyze", content })
  });
  const data = await res.json();
  if (data.status!== "success") return alert("AI解析失敗");

  const r = data.result;
  const big = CATEGORY_MASTER[r.bigCatId];
  const bigCatName = big? big.name : "その他";
  const midCatName = big && big.mids[r.midCatId]? big.mids[r.midCatId] : "その他";

  document.getElementById("title").value = r["推奨タイトル"];
  document.getElementById("summary").value = r["要約200"];
  document.getElementById("bigCatName").value = bigCatName;
  document.getElementById("midCatName").value = midCatName;

  document.getElementById("aiSummaryText").innerHTML = `
<div><b>大分類:</b> ${bigCatName}</div>
<div><b>中分類:</b> ${midCatName}</div>
<hr>
<b>タイトル:</b> ${r["推奨タイトル"]}<br>
<b>要約:</b> ${r["要約200"]}<br>
<b>核心:</b> ${r["核心"]}<br>
<b>期待される変化:</b> ${r["変化"]}<br>
<b>成功事例:</b> ${r["成功事例"]}<br>
<b>懸念点:</b> ${r["懸念点"]}<br>
<b>AIからの問い:</b> ${r["問い"]}
`;

  document.getElementById("aiPlaceholder")?.classList.add("d-none");
  document.getElementById("aiAssistBox")?.classList.remove("d-none");
}

async function submitOpinion() {
  const title = document.getElementById("title").value.trim();
  const summary = document.getElementById("summary").value.trim();
  const content = document.getElementById("content").value.trim();
  const bigCatName = document.getElementById("bigCatName").value.trim();
  const midCatName = document.getElementById("midCatName").value.trim();
  const author = document.getElementById("author").value.trim();

  if (!title ||!summary ||!content) return alert("AI壁打ちを先に実行してください");

  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify({ action: "addOpinion", title, summary, content, bigCatName, midCatName, author })
  });
  const data = await res.json();

  if (data.status === "success") {
    await fetchOpinions();
    alert("提案を登録しました");
    clearForm();
    // ★タブ3に自動移動
    document.getElementById('list-tab-btn')?.click();
  } else {
    alert("登録に失敗しました");
  }
}

async function fetchOpinions() {
  const res = await fetch(GAS_URL + "?action=get");
  const data = await res.json();
  allOpinions = data.opinions || [];
  renderProposalTree(allOpinions);
}

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
      const matched = opinions.filter(o =>
        o.bigCatName?.includes(big.split('（')[0]) && o.midCatName === mid
      );

      if (matched.length === 0) return;
      bigCount += matched.length;

      let postsHtml = matched.map(post => `
        <div style="margin:6px 0; padding:10px; border-left:3px solid #94a3b8; background:#fff;">
          <div style="font-weight:600;">📝 ${post.title}</div>
          <div style="font-size:9pt; color:#64748b;">投稿者: ${post.author || '匿名'}</div>
        </div>
      `).join('');

      bigHtml += `
        <div style="margin:8px 0; border:1px solid #e2e8f0; border-radius:8px;">
          <div style="padding:10px; background:#f1f5f9; font-weight:600;">▶ ${mid} (${matched.length})</div>
          <div style="padding:8px;">${postsHtml}</div>
        </div>
      `;
    });

    if (bigCount > 0) {
      container.innerHTML += `
        <div style="margin-bottom:12px; border:1px solid #cbd5e1; border-radius:10px;">
          <div style="padding:14px; background:#e0f2fe; font-weight:700;">▶ ${big} (${bigCount})</div>
          <div style="padding:12px;">${bigHtml}</div>
        </div>
      `;
    }
  });

  if (container.innerHTML === '') {
    container.innerHTML = '<p>表示できる提案がありません</p>';
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
