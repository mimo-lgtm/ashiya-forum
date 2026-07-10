// ==========================================
// 1. 設定
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbxmM8xb0WjGw32yLSVacv30nz2y1LabmGu0aKfFa9DBPRJUw6R_U9Q6odT5HA1A-t2I/exec";

let allOpinions = [];
let currentAiResult = null;

// ==========================================
// 2. メイン処理
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis"); 
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");

    // データ読み込み
    fetchOpinions();

    // AI壁打ち
    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const contentValue = document.getElementById("content").value.trim();
            if (!contentValue) return alert("内容を入力してください。");

            btnAiAnalysis.disabled = true;
            btnAiAnalysis.innerHTML = "AI思考中...";

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "analyze", content: contentValue })
                });
                const data = await res.json();

                if (data.status === "success") {
                    currentAiResult = data.result;
                    alert("AI分析完了: " + currentAiResult["推奨タイトル"]);
                }
            } catch (err) {
                alert("通信エラー");
            } finally {
                btnAiAnalysis.disabled = false;
                btnAiAnalysis.innerHTML = "AIと壁打ちする";
            }
        });
    }

    // 投稿
    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return alert("AI分析を先に行ってください。");

            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";

            if (!confirm(`投稿しますか？\n（${bigCat} > ${midCat}）`)) return;

            const rawText = document.getElementById("content").value.trim();

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({
                        action: "submit",
                        content: rawText,
                        title: currentAiResult["推奨タイトル"] || "無題の提案",
                        summary: currentAiResult["要約200"] || "",
                        bigCatName: bigCat,
                        midCatName: midCat,
                        aiResult: currentAiResult
                    })
                });
                const data = await res.json();

                if (data.status === "success") {
                    alert("投稿完了！");
                    document.getElementById("content").value = "";
                    fetchOpinions();
                }
            } catch (err) {
                alert("送信エラー");
            }
        });
    }
});

// データ取得
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();
        allOpinions = Array.isArray(data) ? data : (data?.opinions || []);
        renderStructuredIdeas(allOpinions);
    } catch (e) {
        console.error(e);
    }
}

// 提案箱表示
function renderStructuredIdeas(ideasDataset) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const pillarRules = [
        { id: 1, bigName: "🌆 1. まちづくり・都市計画" },
        { id: 2, bigName: "👨‍👩‍👧 2. 子育て・教育環境" },
        { id: 3, bigName: "❤️ 3. 福祉・健康・共生" },
        { id: 4, bigName: "🌱 4. 環境・持続可能性" },
        { id: 5, bigName: "🤝 5. 行政・市民参加・活力" }
    ];

    pillarRules.forEach(rule => {
        const pillarIdeas = ideasDataset.filter(item => {
            const cat = String(item.bigCatName || item.category || "").trim();
            return cat.includes(rule.bigName) || rule.bigName.includes(cat);
        });

        if (pillarIdeas.length === 0) return;

        const section = document.createElement("div");
        section.className = "mb-4 p-3 border rounded bg-light shadow-sm";
        section.innerHTML = `<h5 class="fw-bold">${rule.bigName} <span class="badge bg-secondary">${pillarIdeas.length}件</span></h5>`;

        pillarIdeas.forEach(idea => {
            const card = document.createElement("div");
            card.className = "card mb-2 p-3 cursor-pointer";
            card.innerHTML = `
                <strong>${idea.title || "無題"}</strong><br>
                <small class="text-muted">${idea.summary || ""}</small>
            `;
            card.onclick = () => alert(idea.content || idea.summary);
            section.appendChild(card);
        });

        container.appendChild(section);
    });
}