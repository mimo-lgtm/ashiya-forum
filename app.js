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

async function submitOpinion() {
    const getVal = (id) => {
        const el = document.getElementById(id);
        return el ? el.value.trim() : "";
    };

    const title = getVal("title");
    const summary = getVal("summary");
    const content = getVal("content");
    const bigCatName = getVal("bigCatName");
    const midCatName = getVal("midCatName");
    const author = getVal("author");

    if (!title || !summary || !content) {
        alert("タイトル・要約・内容を入力してください。先にAI壁打ちを実行してください。");
        return;
    }
    if (!bigCatName || !midCatName) {
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
        console.log('GASからの返事:', data);

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
        if (data.status !== "success") {
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
    if (!container) {
        console.error('proposal-container not found');
        return;
    }

    // 一旦全部消す
    container.innerHTML = '';
    container.style.cssText = 'font-size:10.5pt; width:100%; padding:20px 0;';

    let totalCount = 0;

    Object.keys(CATEGORY_MASTER).forEach((bigId) => {
        const big = CATEGORY_MASTER[bigId].name;
        const mids = CATEGORY_MASTER[bigId].mids;
        let bigHtml = "";
        let bigCount = 0;

        Object.keys(mids).forEach((midId) => {
            const mid = mids[midId];
            const matched = opinions.filter(o => {
                const oBig = (o.bigCatName || "").trim();
                const oMid = (o.midCatName || "").trim();
                const bigMatch = oBig.includes(big.split('（')[0]) || big.includes(oBig.split('（')[0]);
                const midMatch = oMid === mid || oMid.includes(mid) || mid.includes(oMid);
                return bigMatch && midMatch;
            });

            if (matched.length === 0) return;
            bigCount += matched.length;

            let postsHtml = '';
            matched.forEach((post) => {
                let icon = "📝";
                let borderColor = '#94a3b8';
                if (post.status == "新統合") { icon = "⭐"; borderColor = '#f59e0b'; }
                if (post.status == "元記事") { icon = "📄"; borderColor = '#64748b'; }

                postsHtml += `
                    <div style="margin:6px 0; padding:10px 12px; border-left:3px solid ${borderColor}; background:#fff; border-radius:4px;">
                        <div class="post-toggle" style="cursor:pointer; font-weight:600; color:#1e293b;">
                            ${icon} ${escapeHtml(post.title)}
                        </div>
                        <div class="post-content" style="display:none; padding:10px; margin-top:8px; background:#f8fafc; border-radius:6px; font-size:10pt; line-height:1.7;">
                            <div style="color:#475569; white-space:pre-wrap;">${escapeHtml(post.summary)}</div>
                            ${post.status == "元記事"? `<div style="margin-top:6px; font-size:9pt; color:#64748b; font-style:italic;">統合先：${escapeHtml(post.mergeTitle)}</div>` : ""}
                        </div>
                    </div>
                `;
            });

            bigHtml += `
                <div style="margin-bottom:8px; border:1px solid #e2e8f0; border-radius:8px; background:#fff;">
                    <div class="mid-toggle" style="padding:10px 14px; background:#f1f5f9; color:#334155; font-weight:600; cursor:pointer; user-select:none;">
                        ▶ ${escapeHtml(mid)} (${matched.length})
                    </div>
                    <div class="mid-content" style="display:none; padding:8px 12px;">
                        ${postsHtml}
                    </div>
                </div>
            `;
        });

        if (bigCount > 0) {
            totalCount += bigCount;
            const bigEl = document.createElement('div');
            bigEl.style.cssText = 'margin-bottom:12px; border:1px solid #cbd5e1; border-radius:10px; background:#fff; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.05);';
            bigEl.innerHTML = `
                <div class="big-toggle" style="padding:14px 18px; background:linear-gradient(90deg, #e0f2fe, #f0f9ff); color:#0c4a6e; font-weight:700; cursor:pointer; user-select:none;">
                    ▶ ${escapeHtml(big)} (${bigCount})
                </div>
                <div class="big-content" style="display:none; padding:12px 16px; background:#f8fafc; border-top:1px solid #e2e8f0;">
                    ${bigHtml}
                </div>
            `;
            container.appendChild(bigEl);
        }
    });

    if (totalCount === 0) {
        container.innerHTML = '<p style="padding:12px; color:#64748b;">表示できる提案がありません</p>';
        return;
    }

    // イベント付与：これで確実に動く
    container.querySelectorAll('.big-toggle,.mid-toggle,.post-toggle').forEach(el => {
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            const content = this.nextElementSibling;
            if (!content) return;
            const isOpen = content.style.display === 'block';
            content.style.display = isOpen? 'none' : 'block';
            this.innerHTML = this.innerHTML.replace(isOpen? '▼' : '▶', isOpen? '▶' : '▼');
        });
    });

    console.log('描画完了:', totalCount, '件');
}

// toggleTree関数はもう使わないので削除でOK

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
