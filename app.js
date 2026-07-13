// ===============================
// グローバル変数
// ===============================
var GAS_URL = window.GAS_URL || "https://script.google.com/macros/s/AKfycbzC1QGiSuBZ0yzvsQVd9St0NbwxOOTanOilNesWl8A7vC83vKEzevLAq04wLOOXs1TPYg/exec";
var allOpinions = [];

// ===============================
// カテゴリマスター
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
// 300字固定文（アイデアの地図 左側）
// ===============================
const AI_BASE_SUMMARY = {
    "まちづくり・都市計画（住みやすさの基盤）": "芦屋市は六甲山と海に囲まれた恵まれた地形を活かし、住宅地としての品格と防災機能を両立するまちづくりが求められます。老朽化したインフラの計画的更新、駅周辺の回遊性向上、バリアフリー化を進めます。子育て世代と高齢者が安心して暮らせるよう、公園・緑地の再整備と防災拠点機能の強化を図ります。民間活力の導入により、芦屋川沿いの景観を活かした魅力ある都市空間を創出し、持続可能な住環境を実現します。",
    "子育て・教育環境（次世代を育てるまち）": "子どもたちが自ら学び、挑戦できる環境整備が急務です。画一的な教育から脱却し、個性と探究心を伸ばすプロジェクト型学習を導入します。保育士・教員のファシリテーター研修を強化し、ICT活用と体験学習を組み合わせます。放課後の居場所づくりと地域人材の参画により、学校・家庭・地域が連携した教育エコシステムを構築し、芦屋から世界で活躍する人材を育成します。",
    "福祉・健康・共生（誰も取り残さないまち）": "高齢化が進む芦屋市では、医療・介護・予防が一体となった地域包括ケアの深化が必要です。在宅医療の充実、認知症支援、介護予防事業を強化します。障害の有無や国籍に関わらず誰もが活躍できるよう、ユニバーサルデザインのまちづくりと就労支援を推進します。地域のつながりを再構築し、孤立を防ぐ見守りネットワークと多世代交流拠点を整備し、共生社会を実現します。",
    "環境・持続可能性（未来に繋ぐ芦屋）": "2050年カーボンニュートラル実現に向け、芦屋市は率先して脱炭素化を進めます。公共施設のZEB化、太陽光発電の導入拡大、EV充電インフラ整備を加速します。ごみの削減と資源循環を徹底し、プラスチック・食品ロス対策を強化します。六甲山系の豊かな自然環境を保全し、生物多様性を守ります。市民・事業者・行政が一体となり、環境先進都市として次世代に美しい芦屋を引き継ぎます。",
    "行政・市民参加・活力（未来を拓く力）": "市民と行政の協働により、芦屋の新たな価値を創造します。デジタル技術を活用した行政手続きのオンライン化と、データに基づく政策立案を推進します。市民参加型の予算編成やワークショップを拡充し、多様な声を市政に反映します。文化・芸術・スポーツ振興により都市の魅力を高め、スタートアップ支援と観光施策で地域経済を活性化します。透明で効率的な行財政運営により、持続可能な市政を実現します。"
};

// ===============================
// 初期化
// ===============================
document.addEventListener("DOMContentLoaded", () => {
    fetchOpinions();

    document.getElementById("btnAiAnalysis")?.addEventListener("click", aiAnalysis);
    document.getElementById("btnSubmitToBox")?.addEventListener("click", submitOpinion);

    // 提案箱タブ
    document.getElementById('list-tab-btn')?.addEventListener('shown.bs.tab', () => {
        renderProposalTree(allOpinions);
    });

    // アイデアの地図タブ
    document.getElementById('map-tab-btn')?.addEventListener('shown.bs.tab', () => {
        renderIdeaMap();
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

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || "";
        };
        setVal("title", r["推奨タイトル"]);
        setVal("summary", r["要約200"]);
        setVal("bigCatName", r.bigCatName);
        setVal("midCatName", r.midCatName);

        document.getElementById("aiTitleText").textContent = r["推奨タイトル"];
        document.getElementById("aiRefinedText").textContent = r["要約200"];

        document.getElementById("aiSummaryText").innerHTML = `
<div class="mb-2"><span class="badge bg-info">大分類</span> ${r.bigCatName}</div>
<div class="mb-3"><span class="badge bg-secondary">中分類</span> ${r.midCatName}</div>
<b>核心</b><br>${r["核心"]}<br><br>
<b>期待される変化</b><br>${r["変化"]}<br><br>
<b>成功事例</b><br>${r["成功事例"]}<br><br>
<b>懸念点</b><br>${r["懸念点"]}<br><br>
<b>AIからの問い</b><br>${r["問い"]}
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
