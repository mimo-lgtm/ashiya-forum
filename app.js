const GAS_URL = "https://script.google.com/macros/s/AKfycbzVCAYRzdj3VON7vhgk9RLz50ho0uPyMHfBu10FzPKX9ih_I500e8lFnqa1Z2bFF5LCbQ/exec";

let allOpinions = [];
let currentAiResult = null;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis"); 
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");

    fetchOpinions();

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const contentValue = document.getElementById("content").value.trim();
            if (!contentValue) return alert("内容を入力してください。");

            const res = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ action: "analyze", content: contentValue })
            });
            const data = await res.json();

            if (data.status === "success") {
                currentAiResult = data.result;
                document.getElementById("aiSummaryText").innerHTML = `<strong>【分類】</strong> ${currentAiResult["大分類"]} > ${currentAiResult["中分類"]}`;
                document.getElementById("aiTitleText").textContent = currentAiResult["推奨タイトル"];
                document.getElementById("aiAssistBox").classList.remove("d-none");
            }
        });
    }

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return;

            const rawText = document.getElementById("content").value.trim();

            const res = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "submit",
                    content: rawText,
                    title: currentAiResult["推奨タイトル"],
                    summary: currentAiResult["要約200"],
                    bigCatName: currentAiResult["大分類"] || "その他",
                    midCatName: currentAiResult["中分類"] || "その他"
                })
            });
            const data = await res.json();

            if (data.status === "success") {
                alert("投稿完了！");
                document.getElementById("content").value = "";
                fetchOpinions();
            }
        });
    }
});

async function fetchOpinions() {
    const res = await fetch(GAS_URL + "?action=get");
    const data = await res.json();
    allOpinions = Array.isArray(data) ? data : (data?.opinions || []);
    renderStructuredIdeas(allOpinions);
}

function renderStructuredIdeas(ideasDataset) {
    const container = document.getElementById("proposal-container");
    if (!container) return;
    container.innerHTML = "";

    const categories = ["まちづくり", "子育て", "福祉", "環境", "行政"];

    categories.forEach(cat => {
        const section = document.createElement("div");
        section.className = "mb-4";
        section.innerHTML = `<h5>${cat}</h5>`;
        container.appendChild(section);
    });
}
