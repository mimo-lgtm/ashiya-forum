const GAS_URL = "https://script.google.com/macros/s/AKfycbzVCAYRzdj3VON7vhgk9RLz50ho0uPyMHfBu10FzPKX9ih_I500e8lFnqa1Z2bFF5LCbQ/exec";

let currentAiResult = null;

document.addEventListener("DOMContentLoaded", function () {
    const btnAiAnalysis = document.getElementById("btnAiAnalysis");
    const btnSubmitToBox = document.getElementById("btnSubmitToBox");

    if (btnAiAnalysis) {
        btnAiAnalysis.addEventListener("click", async function () {
            const content = document.getElementById("content").value.trim();
            if (!content) return alert("内容を入力してください。");

            btnAiAnalysis.disabled = true;
            btnAiAnalysis.innerHTML = "AI分析中...";

            try {
                const res = await fetch(GAS_URL, {
                    method: "POST",
                    headers: { "Content-Type": "text/plain" },
                    body: JSON.stringify({ action: "analyze", content: content })
                });
                const data = await res.json();

                if (data.status === "success") {
                    currentAiResult = data.result;
                    document.getElementById("aiResult").innerHTML = `
                        <h5>${currentAiResult["推奨タイトル"]}</h5>
                        <p><strong>分類:</strong> ${currentAiResult["大分類"]} > ${currentAiResult["中分類"]}</p>
                        <p>${currentAiResult["要約200"]}</p>
                    `;
                    document.getElementById("aiResult").classList.remove("d-none");
                } else {
                    alert("AI分析エラー: " + data.message);
                }
            } catch (err) {
                alert("通信エラー");
            } finally {
                btnAiAnalysis.disabled = false;
                btnAiAnalysis.innerHTML = "AIと壁打ちする";
            }
        });
    }

    if (btnSubmitToBox) {
        btnSubmitToBox.addEventListener("click", async function () {
            if (!currentAiResult) return alert("AI分析を先に行ってください。");

            const content = document.getElementById("content").value.trim();

            const res = await fetch(GAS_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({
                    action: "submit",
                    content: content,
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
            }
        });
    }
});
