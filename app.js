const GAS_URL = "https://script.google.com/macros/s/AKfycbyPuJR6_B_QcpwVXwPat6YxQeQXukQhU57YbQ2eO5cyzqsafo0_ztkpcf0tG8_6ODnPsA/exec";

let allOpinions = [];

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

    const content = document.getElementById("content").value.trim();

    if (!content) {
        alert("内容を入力してください。");
        return;
    }

    try {

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

        const r = data.result;

        document.getElementById("title").value = r["推奨タイトル"] || "";

        document.getElementById("summary").value = r["要約200"] || "";

        document.getElementById("bigCatName").value = r.bigCatName || "";

        document.getElementById("midCatName").value = r.midCatName || "";

        document.getElementById("aiResult").innerHTML = `

<b>核心</b><br>
${r["核心"]}<br><br>

<b>期待される変化</b><br>
${r["変化"]}<br><br>

<b>成功事例</b><br>
${r["成功事例"]}<br><br>

<b>懸念点</b><br>
${r["懸念点"]}<br><br>

<b>AIからの問い</b><br>
${r["問い"]}

`;

    }

    catch(err){

        console.error(err);

        alert("AI通信エラー");

    }

}

async function submitOpinion() {

    const title = document.getElementById("title").value.trim();

    const summary = document.getElementById("summary").value.trim();

    const content = document.getElementById("content").value.trim();

    const bigCatName = document.getElementById("bigCatName").value.trim();

    const midCatName = document.getElementById("midCatName").value.trim();

    const author = document.getElementById("author")
        ? document.getElementById("author").value.trim()
        : "";

    if (!title || !summary || !content) {

        alert("入力不足です");

        return;

    }

    try {

        const res = await fetch(GAS_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

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

        } else {

            alert(data.message);

        }

    } catch (err) {

        console.error(err);

        alert("通信エラー");

    }

}

async function fetchOpinions() {

    try {

        const res = await fetch(
            GAS_URL + "?action=get"
        );

        const data = await res.json();

        if (data.status !== "success") {

            console.error(data.message);

            return;

        }

        allOpinions = data.opinions || [];

        renderProposalTree(allOpinions);

    }

    catch (err) {

        console.error(err);

    }

}

function renderProposalTree(opinions) {

    const container = document.getElementById("proposal-container");

    if (!container) return;

    const tree = {};

    opinions.forEach(op => {

        const big = op.bigCatName || "その他";
        const mid = op.midCatName || "その他";

        if (!tree[big]) tree[big] = {};

        if (!tree[big][mid]) tree[big][mid] = [];

        tree[big][mid].push(op);

    });

    let html = "";

    Object.keys(tree).forEach(big => {

        html += `
<div class="tree-big">

<div class="tree-big-title"
onclick="toggleTree(this)">
▶ ${big}
</div>

<div class="tree-big-body">
`;

        Object.keys(tree[big]).forEach(mid => {

            html += `
<div class="tree-mid">

<div class="tree-mid-title"
onclick="toggleTree(this)">
▶ ${mid}
</div>

<div class="tree-mid-body">
`;

            tree[big][mid].forEach(post => {

                html += `
<div class="tree-post">

<div class="tree-post-title"
onclick="toggleTree(this)">
📝 ${post.title}
</div>

<div class="tree-post-body">

${post.summary}

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

    if (aiResult) {

        aiResult.innerHTML = "";

    }

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

// proposal-tree.js

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

    Object.keys(MASTER).forEach((big, b) => {

        html += `
<div class="tree-big">

<div class="tree-big-title"
onclick="toggleTree(this)">
▶ ${big}
</div>

<div class="tree-big-body">
`;

        MASTER[big].forEach((mid, m) => {

            html += `
<div class="tree-mid">

<div class="tree-mid-title"
onclick="toggleTree(this)">
▶ ${mid}
</div>

<div class="tree-mid-body">
`;

            opinions
                .filter(o =>
                    o.bigCatName == big &&
                    o.midCatName == mid
                )
                .forEach((post, p) => {

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

<div class="tree-post-title"
onclick="toggleTree(this)">
${icon} ${post.title}
</div>

<div class="tree-post-body">

<div class="proposal-summary">

${post.summary}

</div>

`;

                    if (post.status == "元記事") {

                        html += `

<div class="merge-info">

統合先：${post.mergeTitle}

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

