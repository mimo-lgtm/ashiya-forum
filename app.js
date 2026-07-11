// グローバル変数。2重読み込み対策済み
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbz7_nn1uo5pr58A0uUm1VvxxcC3uiLdiDllXJf72T4Yv8gvdcrtr5KTEVxK8t3I_UJACg/exec";
var allOpinions = window.allOpinions || [];

document.addEventListener("DOMContentLoaded", () => {
    fetchOpinions();

    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", aiAnalysis);
    }

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", submitOpinion);
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
            body: JSON.stringify({
                action: "analyze",
                content: content
            })
        });

        const data = await res.json();

        if (data.status!== "success") {
            alert(data.message || "AI解析に失敗しました");
            return;
        }

        const r = data.result;

        // hidden input用。要素が無ければスキップするのでエラーにならない
        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };
        setVal("title", r["推奨タイトル"]);
        setVal("summary", r["要約200"]);
        setVal("bigCatName", r.bigCatName);
        setVal("midCatName", r.midCatName);

        // 画面表示用
        const titleEl = document.getElementById("aiTitleText");
        if (titleEl) titleEl.textContent = r["推奨タイトル"] || "";

        const refinedEl = document.getElementById("aiRefinedText");
        if (refinedEl) refinedEl.textContent = r["要約200"] || "";

        const summaryEl = document.getElementById("aiSummaryText");
        if (summaryEl) summaryEl.innerHTML = `
<b>核心</b><br>
${escapeHtml(r["核心"])}<br><br>
<b>期待される変化</b><br>
${escapeHtml(r["変化"])}<br><br>
<b>成功事例</b><br>
${escapeHtml(r["成功事例"])}<br><br>
<b>懸念点</b><br>
${escapeHtml(r["懸念点"])}<br><br>
<b>AIからの問い</b><br>
${escapeHtml(r["問い"])}
`;

        // 結果ボックスを表示
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
        alert("タイトル・要約・内容を入力してください");
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

// MASTERを使って全カテゴリを表示する版だけ残す。重複削除済み
function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) return;

    container.innerHTML = "";

    const MASTER = {
        "教育・子育て": [
            "学校教育",
            "幼児教育",
            "家庭・子育て支援",
            "その他"
        ],
        "福祉・健康": [
            "高齢者福祉",
            "障がい福祉",
            "健康づくり",
            "その他"
        ],
        "防災・安全": [
            "防災",
            "防犯",
            "交通安全",
            "その他"
        ],
        "環境・都市": [
            "公園・緑",
            "道路・交通",
            "景観・まちづくり",
            "その他"
        ],
        "地域・行政": [
            "地域コミュニティ",
            "行政サービス",
            "市民参加",
            "その他"
        ]
    };

    let html = "";

    Object.keys(MASTER).forEach((big) => {
        html += `
<div class="tree-big">
  <div class="tree-big-title" onclick="toggleTree(this)">
    ▶ ${big}
  </div>
  <div class="tree-big-body">
`;

        MASTER[big].forEach((mid) => {
            html += `
    <div class="tree-mid">
      <div class="tree-mid-title" onclick="toggleTree(this)">
        ▶ ${mid}
      </div>
      <div class="tree-mid-body">
`;

            opinions
               .filter(o => o.bigCatName == big && o.midCatName == mid)
               .forEach((post) => {
                    let icon = "📝";
                    let cls = "single";

                    if (post.status == "新統合") {
                        icon = "⭐";
                        cls = "merged";
                    }
                    if (post.status == "元記事") {
                        icon = "📄";
                        cls = "original";
                    }

                    html += `
        <div class="tree-post ${cls}">
          <div class="tree-post-title" onclick="toggleTree(this)">
            ${icon} ${escapeHtml(post.title)}
          </div>
          <div class="tree-post-body">
            <div class="proposal-summary">
              ${escapeHtml(post.summary)}
            </div>
`;

                    if (post.status == "元記事") {
                        html += `
            <div class="merge-info">
              統合先：${escapeHtml(post.mergeTitle)}
            </div>
`;
                    }

                    html += `
          </div>
        </div>
`;
                });

            html += `
      </div>
    </div>
`;
        });

        html += `
  </div>
</div>
`;
    });

    container.innerHTML = html;
}

function toggleTree(element) {
    const body = element.nextElementSibling;
    if (!body) return;

    if (body.style.display === "block") {
        body.style.display = "none";
        element.innerHTML = element.innerHTML.replace("▼", "▶");
    } else {
        body.style.display = "block";
        element.innerHTML = element.innerHTML.replace("▶", "▼");
    }
}

function clearForm() {
    const ids = [
        "title",
        "summary",
        "content",
        "bigCatName",
        "midCatName",
        "author"
    ];

    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = "";
    });

    const aiResult = document.getElementById("aiResult");
    if (aiResult) aiResult.innerHTML = "";

    document.getElementById("aiPlaceholder")?.classList.remove("d-none");
    document.getElementById("aiAssistBox")?.classList.add("d-none");
}

function escapeHtml(text) {
    if (!text) return "";
    return text
       .replace(/&/g, "&amp;")
       .replace(/</g, "&lt;")
       .replace(/>/g, "&gt;")
       .replace(/"/g, "&quot;")
       .replace(/'/g, "&#039;");
}
