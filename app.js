// グローバル変数。2重読み込み対策済み
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbz7_nn1uo5pr58A0uUm1VvxxcC3uiLdiDllXJf72T4Yv8gvdcrtr5KTEVxK8t3I_UJACg/exec";
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
    fetchOpinions();
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    if (btnAiAnalysis) btnAiAnalysis.addEventListener("click", aiAnalysis);
    if (btnSubmitToBox) btnSubmitToBox.addEventListener("click", submitOpinion);
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
        if (data.status!== "success") {
            alert(data.message || "AI解析に失敗しました");
            return;
        }

        const r = data.result;
        // ID→名前に変換
        const big = CATEGORY_MASTER[r.bigCatId];
        const bigCatName = big? big.name : "その他";
        const midCatName = big && big.mids[r.midCatId]? big.mids[r.midCatId] : "その他";

        // hidden inputに保存。無ければスキップ
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };
        setVal("title", r["推奨タイトル"]);
        setVal("summary", r["要約200"]);
        setVal("bigCatName", bigCatName);
        setVal("midCatName", midCatName);

        // 画面表示用
        const titleEl = document.getElementById("aiTitleText");
        if (titleEl) titleEl.textContent = r["推奨タイトル"] || "";

        const refinedEl = document.getElementById("aiRefinedText");
        if (refinedEl) refinedEl.textContent = r["要約200"] || "";

        // 分類を表示する
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

async function submitOpinion() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el? el.value.trim() : "";
    };

    const title = getVal("title");
    const summary = getVal("summary");
    const content = getVal("content");
    const bigCatName = getVal("bigCatName");
    const midCatName = getVal("midCatName");
    const author = getVal("author");

    if (!title ||!summary ||!content) {
        alert("タイトル・要約・内容を入力してください。先にAI壁打ちを実行してください。");
        return;
    }
    if (!bigCatName ||!midCatName) {
        alert("分類が判定できませんでした。AI壁打ちをやり直してください。");
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
        console.log('GASからの返事:', data); // デバッグ用

        if (data.status == "success") {
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

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return console.error('proposal-containerが無い');
    container.innerHTML = "";

    console.log('描画開始: 全', opinions.length, '件');

    let html = "";
    let totalMatched = 0;

    Object.keys(CATEGORY_MASTER).forEach((bigId) => {
        const big = CATEGORY_MASTER[bigId].name;
        const mids = CATEGORY_MASTER[bigId].mids;
        let bigHtml = "";
        let bigCount = 0;

        Object.keys(mids).forEach((midId) => {
            const mid = mids[midId];
            const matched = opinions.filter(o => {
                const oBig = (o.bigCatName || "").trim().replace(/\s+/g,'');
                const oMid = (o.midCatName || "").trim();
                const cBig = big.trim().replace(/\s+/g,'');
                const cMid = mid.trim();
                // 括弧付きを優先、無ければ部分一致
                const bigMatch = oBig === cBig || oBig.includes(cBig) || cBig.includes(oBig);
                return bigMatch && oMid === cMid;
            });

            if (matched.length === 0) return;
            bigCount += matched.length;

            bigHtml += `
    <div class="tree-mid">
      <div class="tree-mid-title" onclick="toggleTree(this)">▶ ${escapeHtml(mid)} (${matched.length})</div>
      <div class="tree-mid-body">
`;
            matched.forEach((post) => {
                let icon = "📝";
                let cls = "single";
                if (post.status == "新統合") { icon = "⭐"; cls = "merged"; }
                if (post.status == "元記事") { icon = "📄"; cls = "original"; }
                bigHtml += `
        <div class="tree-post ${cls}">
          <div class="tree-post-title" onclick="toggleTree(this)">
            ${icon} ${escapeHtml(post.title)}
          </div>
          <div class="tree-post-body">
            <div class="proposal-summary">${escapeHtml(post.summary)}</div>
            ${post.status == "元記事"? `<div class="merge-info">統合先：${escapeHtml(post.mergeTitle)}</div>` : ""}
          </div>
        </div>
`;
            });
            bigHtml += `</div></div>`;
        });

        if (bigCount > 0) {
            totalMatched += bigCount;
            html += `
<div class="tree-big">
  <div class="tree-big-title" onclick="toggleTree(this)">▼ ${escapeHtml(big)} (${bigCount})</div>
  <div class="tree-big-body" style="display:block">
    ${bigHtml}
  </div>
</div>
`;
            console.log(`${big}: ${bigCount}件マッチ`);
        }
    });

    container.innerHTML = html || '<p class="text-muted">表示できる提案がありません</p>';
    console.log(`描画完了: ${totalMatched}/${opinions.length}件表示`);
}
function toggleTree(element) {
    const body = element.nextElementSibling;
    if (!body) return;
    
    // getComputedStyleで初期状態を取得。空文字ならnone扱い
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
