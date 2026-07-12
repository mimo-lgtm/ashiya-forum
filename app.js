const GAS_URL = "https://script.google.com/macros/s/AKfycbwfYPef4DCgrU7Bd9GeCJtHd1KSEAzS03jXEuPSpEJ-IVcWqiJUu5arX9lY4I883IliNA/exec";

let aiAnalysisJson = "";
let currentBigCat = "";
let currentSmallCat = "";

document.addEventListener("DOMContentLoaded", () => {
    fetchOpinions();

    document.getElementById("btnAiAnalysis")
        .addEventListener("click", analyzeAI);

    document.getElementById("btnSubmit")
        .addEventListener("click", submitOpinion);
});

async function analyzeAI() {

    const content = document.getElementById("content").value.trim();

    if (!content) {
        alert("提案内容を入力してください。");
        return;
    }

    const res = await fetch(GAS_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            action: "analyze",

            content: content

        })

    });

    const data = await res.json();

    if (data.status !== "success") {

        alert(data.message);

        return;

    }

    aiAnalysisJson = data.aiAnalysisJson;

    currentBigCat = data.bigCat;

    currentSmallCat = data.smallCat;

    document.getElementById("title").value = data.recommendedTitle;

    document.getElementById("summary").value = data.summary200;

    document.getElementById("aiResult").innerHTML = data.result;

}

async function submitOpinion() {

    const content = document.getElementById("content").value.trim();

    if (!content) {

        alert("提案内容を入力してください。");

        return;

    }

    const res = await fetch(GAS_URL, {

        method: "POST",

        headers: {

            "Content-Type": "application/json"

        },

        body: JSON.stringify({

            action: "submit",

            content: content,

            userId: localStorage.getItem("authorId") || "",

            aiAnalysisJson: aiAnalysisJson

        })

    });

    const data = await res.json();

    if (data.status === "success") {

        alert("提案を登録しました。");

        document.getElementById("content").value = "";

        document.getElementById("title").value = "";

        document.getElementById("summary").value = "";

        document.getElementById("aiResult").innerHTML = "";

        fetchOpinions();

    } else {

        alert(data.message);

    }

}

async function fetchOpinions() {

    const res = await fetch(GAS_URL + "?action=list");

    const data = await res.json();

    if (data.status !== "success") {

        console.error(data.message);

        return;

    }

    allOpinions = data.opinions || [];

    renderProposalTree(allOpinions);

}

function renderProposalTree(opinions) {

    const container = document.getElementById("proposal-container");

    if (!container) return;

    container.innerHTML = "";

    const tree = {};

    opinions.forEach(op => {

        const big = op.bigCatName || "その他";
        const mid = op.midCatName || "その他";

        if (!tree[big]) tree[big] = {};

        if (!tree[big][mid]) tree[big][mid] = [];

        tree[big][mid].push(op);

    });

    Object.keys(tree).forEach(big => {

        const bigDiv = document.createElement("div");
        bigDiv.className = "tree-big";

        bigDiv.innerHTML = `
<div class="tree-big-title" onclick="toggleTree(this)">▶ ${big}</div>
<div class="tree-big-body"></div>
`;

        const bigBody = bigDiv.querySelector(".tree-big-body");

        Object.keys(tree[big]).forEach(mid => {

            const midDiv = document.createElement("div");

            midDiv.className = "tree-mid";

            midDiv.innerHTML = `
<div class="tree-mid-title" onclick="toggleTree(this)">▶ ${mid}</div>
<div class="tree-mid-body"></div>
`;

            const midBody = midDiv.querySelector(".tree-mid-body");

            ["新統合","新提案","元記事"].forEach(status=>{

                tree[big][mid]
                .filter(x=>x.status===status)
                .forEach(post=>{

                    const postDiv=document.createElement("div");

                    postDiv.className="tree-post";

                    postDiv.innerHTML=`
<div class="tree-post-title" onclick="toggleTree(this)">
${status==="新統合"?"⭐":status==="新提案"?"📝":"📄"} ${post.title}
</div>

<div class="tree-post-body">

${post.summary}

</div>
`;

                    midBody.appendChild(postDiv);

                });

            });

            bigBody.appendChild(midDiv);

        });

        container.appendChild(bigDiv);

    });

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

        "content",

        "title",

        "summary"

    ];

    ids.forEach(id => {

        const el = document.getElementById(id);

        if (el) el.value = "";

    });

    aiAnalysisJson = "";

    currentBigCat = "";

    currentSmallCat = "";

    const aiResult = document.getElementById("aiResult");

    if (aiResult) aiResult.innerHTML = "";

}

// proposal-tree.js

function renderProposalTree(opinions) {

    const container = document.getElementById("proposal-container");

    if (!container) return;

    const MASTER = {
        "まちづくり・都市計画": [
            "都市計画・再開発",
            "公園・緑地",
            "道路・交通インフラ",
            "防災・防犯",
            "景観・街並み",
            "住宅政策"
        ],
        "子育て・教育": [
            "保育・幼児教育",
            "学校教育",
            "青少年育成",
            "子育て支援",
            "特別支援教育",
            "社会教育"
        ],
        "福祉・健康・共生": [
            "高齢者福祉",
            "障害者福祉",
            "医療・健康",
            "地域共生",
            "生活困窮者支援",
            "男女共同参画"
        ],
        "環境・持続可能性": [
            "ごみ・リサイクル",
            "エネルギー・温暖化対策",
            "自然保護・生物多様性",
            "公害対策",
            "環境学習",
            "気候変動適応"
        ],
        "行政・市民参加・活力": [
            "市民協働・参画",
            "行財政改革",
            "産業・雇用",
            "文化・スポーツ",
            "観光・交流",
            "DX・デジタル化"
        ]
    };

    let html = "";

    Object.keys(MASTER).forEach(big => {

        html += `
<div class="tree-big">

<div class="tree-big-title" onclick="toggleTree(this)">
▶ ${big}
</div>

<div class="tree-big-body">
`;

        MASTER[big].forEach(mid => {

            html += `
<div class="tree-mid">

<div class="tree-mid-title" onclick="toggleTree(this)">
▶ ${mid}
</div>

<div class="tree-mid-body">
`;

            ["新統合","新提案","元記事"].forEach(status=>{

                opinions
                .filter(p =>
                    p.bigCatName === big &&
                    p.midCatName === mid &&
                    p.status === status
                )
                .forEach(post=>{

                    const icon =
                        status==="新統合" ? "⭐" :
                        status==="新提案" ? "📝" : "📄";

                    html += `
<div class="tree-post">

<div class="tree-post-title" onclick="toggleTree(this)">
${icon} ${post.title}
</div>

<div class="tree-post-body">

${post.summary}

</div>

</div>
`;

                });

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

<!-- index.html -->

<div class="col-12">

    <div id="proposal-container"></div>

</div>

<input type="hidden" id="title">
<input type="hidden" id="summary">

<script src="proposal-tree.js"></script>
<script src="app.js"></script>

