// ==========================================
// 1. 設定・定数・グローバル変数定義。
// ==========================================
const GAS_URL = "https://script.google.com/macros/s/AKfycbzVCAYRzdj3VON7vhgk9RLz50ho0uPyMHfBu10FzPKX9ih_I500e8lFnqa1Z2bFF5LCbQ/exec";

const MAIN_CATEGORIES = [
    "まちづくり・都市計画",
    "子育て・教育環境",
    "福祉・健康・共生",
    "環境・持続可能性",
    "行政・市民参加・活力"
];

// 唯一の定義：名称ベースで管理
const CATEGORY_STRUCTURE = {
    "まちづくり・都市計画": ["住宅・まちなみ", "交通・移動手段", "公園・緑地・景観", "防災・レジリエンス", "その他"],
    "子育て・教育環境": ["保育・教育施設", "子ども・若者の居場所", "学びの機会（生涯学習）", "家族支援", "その他"],
    "福祉・健康・共生": ["高齢者支援", "障害者・多様な人々の支援", "健康づくり", "地域コミュニティ", "その他"],
    "環境・持続可能性": ["気候変動対策", "資源循環・ごみ問題", "自然環境保全", "エネルギー・脱炭素", "その他"],
    "行政・市民参加・活力": ["行政の透明性・効率化", "市民参加・協働", "文化・芸術・スポーツ", "産業・雇用・にぎわい", "その他"]
};

let allOpinions = [];
let currentAiResult = null;

// ==========================================
// 2. メイン処理（画面初期化・イベント設定）
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    const aiPlaceholder = document.getElementById("aiPlaceholder");
    const aiAssistBox = document.getElementById("aiAssistBox");
    const aiSummaryText = document.getElementById("aiSummaryText");
    const aiPerspectivesText = document.getElementById("aiPerspectivesText");
    const aiTitleText = document.getElementById("aiTitleText");
    const aiRefinedText = document.getElementById("aiRefinedText");

    fetchOpinions();

    // AI分析ボタン
    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const txtContent = document.getElementById("content");
            const contentValue = txtContent ? txtContent.value.trim() : "";

            if (!contentValue) {
                alert("あなたの想いやアイデアを自由に入力してください。");
                return;
            }

            btnAiAnalysis.disabled = true;
            btnAiAnalysis.innerHTML = `<span class="spinner-border spinner-border-sm"></span> AIが思考を整理中...`;

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "analyze", content: contentValue })
                });
                const data = await res.json();

                if (data.status === "success") {
                    currentAiResult = data.result;

                    const bigCat = currentAiResult["大分類"] || "その他";
                    const midCat = currentAiResult["中分類"] || "その他";

                    aiSummaryText.innerHTML = `<strong>【自動分類】</strong> ${bigCat} ＞ ${midCat}`;

                    aiPerspectivesText.innerHTML = `
<div class="mb-3"><strong>a. 核心</strong><br>${currentAiResult["核心"] || "分析中"}</div>
<div class="mb-3"><strong>b. 変化</strong><br>${currentAiResult["変化"] || "分析中"}</div>
<div class="mb-3"><strong>c. 成功事例</strong><br>${currentAiResult["成功事例"] || "分析中"}</div>
<div class="mb-3"><strong>d. 懸念点</strong><br>${currentAiResult["懸念点"] || "分析中"}</div>
<div class="mb-1"><strong>e. 問い</strong><br>${currentAiResult["問い"] || "分析中"}</div>
                    `.trim();

                    aiTitleText.textContent = currentAiResult["推奨タイトル"] || "無題の提案";
                    aiRefinedText.textContent = currentAiResult["要約200"] || "";

                    aiPlaceholder.style.setProperty("display", "none", "important");
                    aiAssistBox.style.setProperty("display", "flex", "important");
                    aiAssistBox.classList.remove("d-none");
                } else {
                    alert("AI分析エラー: " + data.message);
                }
            } catch (err) {
                console.error(err);
                alert("通信エラーが発生しました。");
            } finally {
                btnAiAnalysis.disabled = false;
                btnAiAnalysis.innerHTML = `✨ 1. 意見を送信してAIと壁打ちする`;
            }
        });
    }

    // 投稿ボタン
    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;

            const bigCat = currentAiResult["大分類"] || "その他";
            const midCat = currentAiResult["中分類"] || "その他";

            const message = `正式に提案箱へ投稿しますか？\n(大分類「${bigCat}」 > 中分類「${midCat}」へ格納されます)`;
            if (!confirm(message)) return;

            const txtContent = document.getElementById("content");
            const rawText = txtContent ? txtContent.value.trim() : "";

            btnSubmitToBox.disabled = true;
            btnSubmitToBox.innerHTML = `<span class="spinner-border spinner-border-sm"></span> 投稿中...`;

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
                    alert(`📥 投稿が完了しました！`);

                    txtContent.value = "";
                    aiAssistBox.classList.add("d-none");
                    aiPlaceholder.style.removeProperty("display");
                    currentAiResult = null;

                    await fetchOpinions();

                    const listTabBtn = document.getElementById("list-tab-btn");
                    if (listTabBtn) listTabBtn.click();
                } else {
                    alert("投稿エラー: " + (data.message || "不明なエラー"));
                    btnSubmitToBox.disabled = false;
                }
            } catch (err) {
                console.error(err);
                alert("送信エラーが発生しました。");
                btnSubmitToBox.disabled = false;
            }
        });
    }
});

// ==========================================
// 3. データ取得
// ==========================================
async function fetchOpinions() {
    try {
        const res = await fetch(GAS_URL + "?action=get");
        const data = await res.json();

        if (data.status !== "success") {
            console.error(data.message);
            return;
        }

        allOpinions = data.opinions || [];
        renderStructuredIdeas(allOpinions);

    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// 4. 描画ロジック
// ==========================================
function renderStructuredIdeas(opinions) {

    const container = document.getElementById("proposal-container");
    if (!container) return;

    container.innerHTML = "";

    // 固定ツリー
    const CATEGORY = {
        "まちづくり・都市計画（住みやすさの基盤）": ["住宅・まちなみ", "交通・移動手段", "公園・緑地・景観", "防災・レジリエンス", "その他"],
        "子育て・教育環境（次世代を育てるまち）": ["保育・教育施設", "子ども・若者の居場所", "学びの機会（生涯学習）", "家族支援", "その他"],
        "福祉・健康・共生（誰も取り残さないまち）": ["高齢者支援", "障害者・多様な人々の支援", "健康づくり", "地域コミュニティ", "その他"],
        "環境・持続可能性（未来に繋ぐ芦屋）": ["気候変動対策", "資源循環・ごみ問題", "自然環境保全", "エネルギー・脱炭素", "その他"],
        "行政・市民参加・活力（より良い市政へ）": ["行政の透明性・効率化", "市民参加・協働", "文化・芸術・スポーツ", "産業・雇用・にぎわい", "その他"]
    };

    // AI名称 → 固定ツリー名称変換
    const BIGMAP = {
        "まちづくり・都市計画": "まちづくり・都市計画（住みやすさの基盤）",
        "子育て・教育環境": "子育て・教育環境（次世代を育てるまち）",
        "福祉・健康・共生": "福祉・健康・共生（誰も取り残さないまち）",
        "環境・持続可能性": "環境・持続可能性（未来に繋ぐ芦屋）",
        "行政・市民参加・活力": "行政・市民参加・活力（より良い市政へ）"
    };

    let html = "";
    let bigIndex = 0;

    Object.keys(CATEGORY).forEach(big => {

        html += `
<div class="accordion mb-3">
<div class="accordion-item">
<h2 class="accordion-header">
<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#big${bigIndex}">
🌳 ${big}
</button>
</h2>
<div id="big${bigIndex}" class="accordion-collapse collapse">
<div class="accordion-body">
`;

        let midIndex = 0;

        CATEGORY[big].forEach(mid => {

            html += `
<div class="accordion mb-2">
<div class="accordion-item">
<h2 class="accordion-header">
<button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#mid${bigIndex}_${midIndex}">
📂 ${mid}
</button>
</h2>
<div id="mid${bigIndex}_${midIndex}" class="accordion-collapse collapse">
<div class="accordion-body">
`;

            opinions
                .filter(op => {
                    const bigName = BIGMAP[op.bigCatName] || op.bigCatName;
                    return bigName === big && op.midCatName === mid;
                })
                .forEach((post, p) => {

                    html += `
<div class="accordion mb-2">
<div class="accordion-item">
<h2 class="accordion-header">
<button class="accordion-button collapsed" data-bs-toggle="collapse" data-bs-target="#post${bigIndex}_${midIndex}_${p}">
📝 ${post.title}
</button>
</h2>
<div id="post${bigIndex}_${midIndex}_${p}" class="accordion-collapse collapse">
<div class="accordion-body">
${post.summary}
</div>
</div>
</div>
</div>
`;
                });

            html += `
</div>
</div>
</div>
</div>
`;

            midIndex++;
        });

        html += `
</div>
</div>
</div>
</div>
`;

        bigIndex++;
    });

    container.innerHTML = html;
}
