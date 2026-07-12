// グローバル変数。2重読み込み対策済み
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbz7_nn1uo5pr58A0uUm1VvxxcC3uiLdiDllXJf72T4Yv8gvdcrtr5KTEVxK8t3I_UJACg/exec";
var allOpinions = window.allOpinions || [];

// 匿名ユーザーID生成。メール不要
function getUserId() {
    let uid = localStorage.getItem('anonUserId');
    if (!uid) {
        uid = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
        localStorage.setItem('anonUserId', uid);
    }
    return uid;
}
const CURRENT_USER_ID = getUserId();

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

// 1. AI固定要約 300字 × 5分類
const AI_BASE_SUMMARY = {
    "まちづくり・都市計画（住みやすさの基盤）": "芦屋市は六甲山と海に囲まれた恵まれた地形を活かし、住宅地としての品格と防災機能を両立するまちづくりが求められます。老朽化したインフラの計画的更新、駅周辺の回遊性向上、バリアフリー化を進めます。子育て世代と高齢者が安心して暮らせるよう、公園・緑地の再整備と防災拠点機能の強化を図ります。民間活力の導入により、芦屋川沿いの景観を活かした魅力ある都市空間を創出し、持続可能な住環境を実現します。",
    "子育て・教育環境（次世代を育てるまち）": "子どもたちが自ら学び、挑戦できる環境整備が急務です。画一的な教育から脱却し、個性と探究心を伸ばすプロジェクト型学習を導入します。保育士・教員のファシリテーター研修を強化し、ICT活用と体験学習を組み合わせます。放課後の居場所づくりと地域人材の参画により、学校・家庭・地域が連携した教育エコシステムを構築し、芦屋から世界で活躍する人材を育成します。",
    "福祉・健康・共生（誰も取り残さないまち）": "高齢化が進む芦屋市では、医療・介護・予防が一体となった地域包括ケアの深化が必要です。在宅医療の充実、認知症支援、介護予防事業を強化します。障害の有無や国籍に関わらず誰もが活躍できるよう、ユニバーサルデザインのまちづくりと就労支援を推進します。地域のつながりを再構築し、孤立を防ぐ見守りネットワークと多世代交流拠点を整備し、共生社会を実現します。",
    "環境・持続可能性（未来に繋ぐ芦屋）": "2050年カーボンニュートラル実現に向け、芦屋市は率先して脱炭素化を進めます。公共施設のZEB化、太陽光発電の導入拡大、EV充電インフラ整備を加速します。ごみの削減と資源循環を徹底し、プラスチック・食品ロス対策を強化します。六甲山系の豊かな自然環境を保全し、生物多様性を守ります。市民・事業者・行政が一体となり、環境先進都市として次世代に美しい芦屋を引き継ぎます。",
    "行政・市民参加・活力（未来を拓く力）": "市民と行政の協働により、芦屋の新たな価値を創造します。デジタル技術を活用した行政手続きのオンライン化と、データに基づく政策立案を推進します。市民参加型の予算編成やワークショップを拡充し、多様な声を市政に反映します。文化・芸術・スポーツ振興により都市の魅力を高め、スタートアップ支援と観光施策で地域経済を活性化します。透明で効率的な行財政運営により、持続可能な市政を実現します。"
};

// 2. 市民の声反映の説明文 100字 × 5分類
const CITIZEN_REFLECTION_TEXT = {
    "まちづくり・都市計画（住みやすさの基盤）": "市民から寄せられた「子どもの遊び場不足」「駅前の賑わい創出」等の声を踏まえ、公園再整備と回遊性向上策を重点化しました。",
    "子育て・教育環境（次世代を育てるまち）": "「詰め込み教育からの脱却」「体験学習の充実」を求める声に応え、探究型学習と地域人材活用を提案の核としました。",
    "福祉・健康・共生（誰も取り残さないまち）": "「孤独死防止」「障害者就労支援」の切実な要望を受け、見守り体制とユニバーサルな就労環境整備を優先事項としました。",
    "環境・持続可能性（未来に繋ぐ芦屋）": "「脱炭素の具体策が見えない」「ごみ減量を」等の意見を反映し、数値目標と市民参加型の施策を明確化しました。",
    "行政・市民参加・活力（未来を拓く力）": "「市役所の対応が遅い」「意見が届かない」との声に応え、DX推進と市民参加プロセスの透明化を最重点施策としました。"
};

// 3. 最終提案生成ロジック
function generateFinalProposal(bigCatName) {
    const baseText = AI_BASE_SUMMARY[bigCatName] || 'この分類のAI原案は準備中です。';
    const reflectionText = CITIZEN_REFLECTION_TEXT[bigCatName] || '';

    // 新統合記事を抽出
    const newMerged = allOpinions.filter(o => {
        const oBig = (o.bigCatName || "").trim();
        const bigMatch = oBig.includes(bigCatName.split('（')[0]) || bigCatName.includes(oBig.split('（')[0]);
        return bigMatch && o.status === '新統合';
    });

    // 市民の声150字に要約
    let citizenText = '';
    if (newMerged.length > 0) {
        citizenText = newMerged.map(p => p.summary || p.title).join('').slice(0, 150);
    } else {
        citizenText = '現在、市民からの新統合提案を募集中です。皆様の声をお寄せください。';
    }

    // 3段構成で出力
    return `【1. AI原案】\n${baseText.slice(0, 300)}\n\n【2. 市民の声を反映】\n${citizenText}\n\n【3. 反映の説明】\n${reflectionText}`;
}

function showFinalProposal(bigCatName) {
    const text = generateFinalProposal(bigCatName);
    const el = document.getElementById('final-proposal-text');
    if (el) el.innerText = text;
}

document.addEventListener("DOMContentLoaded", () => {
    fetchOpinions();

    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");
    if (btnAiAnalysis) btnAiAnalysis.addEventListener("click", aiAnalysis);
    if (btnSubmitToBox) btnSubmitToBox.addEventListener("click", submitOpinion);

    const listTabBtn = document.getElementById('list-tab-btn');
    if (listTabBtn) {
        listTabBtn.addEventListener('shown.bs.tab', () => {
            console.log('提案箱タブが表示された');
            renderProposalTree(allOpinions);
        });
    }
});

// Step1: 投稿時AIスクリーニング
async function aiAnalysis() {
    const contentEl = document.getElementById("content");
    if (!contentEl) return alert("contentが見つかりません");
    const content = contentEl.value.trim();
    if (!content) {
        alert("内容を入力してください。");
        return;
    }

    // NGワード簡易チェック
    const ngWords = ['死ね', '殺す', 'バカ', 'アホ'];
    if (ngWords.some(w => content.includes(w))) {
        alert('不適切な表現が含まれています。建設的な表現でお願いします。');
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
        const big = CATEGORY_MASTER[r.bigCatId];
        const bigCatName = big? big.name : "その他";
        const midCatName = big && big.mids[r.midCatId]? big.mids[r.midCatId] : "その他";

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
        return el? el.value.trim() : "";
    };

    const title = getVal("title");
    const summary = getVal("summary");
    const content = getVal("content");
    const bigCatName = getVal("bigCatName");
    const midCatName = getVal("midCatName");
    const author = getVal("author") || '匿名';

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
                author,
                authorId: CURRENT_USER_ID,
                status: '新提案'
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

        // GASが配列で返してくる場合と、{status, opinions}で返す場合の両対応
        if (Array.isArray(data)) {
            allOpinions = data;
        } else if (data.status === "success") {
            allOpinions = data.opinions || [];
        } else {
            console.error('GASエラー:', data.message || data);
            allOpinions = [];
        }

        renderProposalTree(allOpinions);
    } catch (err) {
        console.error('通信エラー:', err);
        allOpinions = [];
        renderProposalTree(allOpinions);
    }
}

function findMyPosts(opinions) {
    return opinions.filter(o => o.authorId === CURRENT_USER_ID);
}

function renderMyPostsPanel() {
    const myPosts = findMyPosts(allOpinions);
    const panel = document.getElementById('my-posts-panel');
    if (!panel) return;

    if (myPosts.length === 0) {
        panel.innerHTML = '<div class="p-3 text-muted">あなたの投稿はまだありません</div>';
        return;
    }

    let html = '<div class="p-3"><h6 class="mb-3">あなたの投稿一覧</h6>';
    myPosts.forEach(post => {
        let statusText = '';
        let statusClass = '';
        let locationText = `${post.bigCatName} > ${post.midCatName}`;

        if (post.status === '新提案' || post.status === '単独提案') {
            statusText = '新提案：まだ統合されていません';
            statusClass = 'status-new';
        } else if (post.status === '新統合') {
            statusText = '新統合：あなたの提案が元になって統合されました';
            statusClass = 'status-merged';
        } else if (post.status === '元記事') {
            statusText = `統合済み：統合先「${post.mergeTitle || '不明'}」に含まれています`;
            statusClass = 'status-original';
        }

        html += `
        <div class="my-post-item ${statusClass}" style="padding:12px; margin-bottom:8px; border-radius:8px; border-left:4px solid;">
            <div style="font-weight:600; margin-bottom:4px;">${escapeHtml(post.title)}</div>
            <div style="font-size:9pt; color:#64748b;">場所：${escapeHtml(locationText)}</div>
            <div style="font-size:9pt; color:#475569; margin-top:4px;">${statusText}</div>
        </div>`;
    });
    html += '</div>';
    panel.innerHTML = html;
}

function renderProposalTree(opinions) {
    const container = document.getElementById("proposal-container");
    if (!container) {
        console.error('proposal-container not found');
        return;
    }

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
                let statusCls = 'status-new';
                let borderColor = '#3b82f6';

                if (post.status == "新統合") {
                    icon = "⭐";
                    borderColor = '#f59e0b';
                    statusCls = 'status-merged';
                }
                if (post.status == "元記事") {
                    icon = "📄";
                    borderColor = '#64748b';
                    statusCls = 'status-original';
                }

                postsHtml += `
                    <div class="tree-post ${statusCls}" style="margin:6px 0; padding:10px 12px; border-left:3px solid ${borderColor}; background:#fff; border-radius:4px;">
                        <div class="post-toggle" style="cursor:pointer; font-weight:600; color:#1e293b;">
                            ${escapeHtml(post.title)}
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

    renderMyPostsPanel();
    console.log('描画完了:', totalCount, '件');
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
