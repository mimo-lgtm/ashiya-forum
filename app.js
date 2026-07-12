// ===============================
// グローバル変数
// ===============================
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbzC1QGiSuBZ0yzvsQVd9St0NbwxOOTanOilNesWl8A7vC83vKEzevLAq04wLOOXs1TPYg/exec";
var allOpinions = [];

// ===============================
// カテゴリマスター（code.gs と一致）
// ===============================
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

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", () => {

    fetchOpinions();

    document.getElementById("btnAiAnalysis")?.addEventListener("click", aiAnalysis);
    document.getElementById("btnSubmitToBox")?.addEventListener("click", submitOpinion);

    // タブ3が開かれたら再描画
    document.getElementById('list-tab-btn')?.addEventListener('shown.bs.tab', () => {
        renderProposalTree(allOpinions);
    });
});

// ===============================
// AI壁打ち
// ===============================
async function aiAnalysis() {
    const contentEl = document.getElementById("content");
    const content = contentEl.value.trim();
    if (!content) return alert("内容を入力してください。");

    try {
        const res = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({ action: "analyze", content })
        });
        const data = await res.json();

        if (data.status !== "success") {
            alert(data.message || "AI解析に失敗しました");
            return;
        }

        const r = data.result;

        // hidden input に保存
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };
        setVal("title", r["推奨タイトル"]);
        setVal("summary", r["要約200"]);
        setVal("bigCatName", r.bigCatName);
        setVal("midCatName", r.midCatName);

        // 表示
        document.getElementById("aiTitleText").textContent = r["推奨タイトル"];
        document.getElementById("aiRefinedText").textContent = r["要約200"];

        document.getElementById("aiSummaryText").innerHTML = `
<div class="mb-2"><span class="badge bg-info">大分類</span> ${escapeHtml(r.bigCatName)}</div>
<div class="mb-3"><span class="badge bg-secondary">中分類</span> ${escapeHtml(r.midCatName)}</div>
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

// ===============================
// 投稿
// ===============================
async function submitOpinion() {
    const getVal = id => document.getElementById(id)?.value.trim() || "";

    const title = getVal("title");
    const summary = getVal("summary");
    const content = getVal("content");
    const bigCatName = getVal("bigCatName");
    const midCatName = getVal("midCatName");
    const author = getVal("author");

    if (!title || !summary || !content) {
        alert("AI壁打ちを実行してください。");
        return;
    }

    try {
        const res = await fetch(GAS_URL, {
            method: "POST",
            body: JSON.stringify({
                action: "submit",
                title,
                summary,
                content,
                bigCatName,
                midCatName,
                author
            })
        });

        const data = await res.json();
        if (data.status === "success") {
            await fetchOpinions();
            alert("提案を登録しました");
            clearForm();
        } else {
            alert(data.message || "登録に失敗しました");
        }

    } catch (err) {
        console.error(err);
        alert("通信エラー");
    }
}

// ===============================
// 一覧取得
// ===============================
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        if (data.status !== "success") return;

        allOpinions = data.opinions || [];
        renderProposalTree(allOpinions);

    } catch (err) {
        console.error(err);
    }
}

// ===============================
// 提案箱ツリー描画
// ===============================
function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;

    container.innerHTML = '';
    container.style.cssText = 'font-size:10.5pt; width:100%; padding:20px 0;';

    let totalCount = 0;

    Object.keys(CATEGORY_MASTER).forEach(bigId => {
        const big = CATEGORY_MASTER[bigId].name;
        const mids = CATEGORY_MASTER[bigId].mids;

        let bigHtml = "";
        let bigCount = 0;

        Object.keys(mids).forEach(midId => {
            const mid = mids[midId];

            const matched = opinions.filter(o => {
                const oBig = (o.bigCatName || "").split("（")[0];
                const bigName = big.split("（")[0];
                const oMid = (o.midCatName || "").trim();

                return oBig === bigName && oMid === mid;
            });

            if (matched.length === 0) return;
            bigCount += matched.length;

            let postsHtml = "";
            matched.forEach(post => {
                let icon = "📝";
                let borderColor = "#94a3b8";

                if (post.status === "新統合") { icon = "⭐"; borderColor = "#f59e0b"; }
                if (post.status === "元記事") { icon = "📄"; borderColor = "#64748b"; }

                postsHtml += `
<div style="margin:6px 0; padding:10px 12px; border-left:3px solid ${borderColor}; background:#fff; border-radius:4px;">
  <div class="post-toggle" style="cursor:pointer; font-weight:600; color:#1e293b;">
    ${icon} ${escapeHtml(post.title)}
  </div>

  <div class="post-content" style="display:none; padding:10px; margin-top:8px; background:#f8fafc; border-radius:6px; font-size:10pt; line-height:1.7;">
    <div style="color:#475569; white-space:pre-wrap;">${escapeHtml(post.summary)}</div>

    ${post.mergeTitle ? `<div class="merge-info" style="margin-top:6px; font-size:9pt; color:#64748b;">統合先：${escapeHtml(post.mergeTitle)}</div>` : ""}

    ${post.mergeReason ? `<div style="margin-top:6px; font-size:9pt; color:#64748b;">統合理由：${escapeHtml(post.mergeReason)}</div>` : ""}

    ${post.crossAnalysis ? `<div style="margin-top:6px; font-size:9pt; color:#475569;">クロス分析：${escapeHtml(post.crossAnalysis)}</div>` : ""}

    ${post.layoutReason ? `<div style="margin-top:6px; font-size:9pt; color:#475569;">配置理由：${escapeHtml(post.layoutReason)}</div>` : ""}

    ${post.authorId ? `<div style="margin-top:6px; font-size:9pt; color:#334155;">投稿者ID：${escapeHtml(post.authorId)}</div>` : ""}
  </div>
</div>
`;
