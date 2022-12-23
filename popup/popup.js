const tabs = await chrome.tabs.query({currentWindow: true,})
async function exportTabs() {
    const tabExport = tabs.map(tab => tab.url).join("\n");
    await navigator.clipboard.writeText(tabExport);
}

document.querySelector("#exportbutton").addEventListener("click", exportTabs)
document.querySelector("#tabCount").textContent = tabs.length.toString(10);
