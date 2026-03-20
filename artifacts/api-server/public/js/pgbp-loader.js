// /public/js/pgbp-loader.js
class PGBPModuleLoader {
    constructor() {
        this.modules = {};
        this.activeModules = new Set();
        this.moduleResults = {};
        this.init();
    }

    init() {
        // Define module paths
        this.modules = {
            "business-regular": "/pages/pgbp/regular.html",
            "business-44ad": "/pages/pgbp/44ad.html",
            "business-44ae": "/pages/pgbp/44ae.html",
            "profession-regular": "/pages/pgbp/regprof.html",
            "profession-44ada": "/pages/pgbp/44ada.html",
            speculative: "/pages/pgbp/speculative.html",
            "other-business": "/pages/pgbp/other.html",
        };

        // Add click listeners to checkboxes
        document.querySelectorAll(".module-checkbox").forEach((card) => {
            card.addEventListener("click", () =>
                this.toggleModule(card.dataset.module),
            );
        });
    }

    toggleModule(moduleId) {
        if (this.activeModules.has(moduleId)) {
            this.activeModules.delete(moduleId);
            this.removeModuleFromDOM(moduleId);
        } else {
            this.activeModules.add(moduleId);
            this.loadModule(moduleId);
        }
        this.updateResultsVisibility();
    }

    loadModule(moduleId) {
        const container = document.getElementById("modulesContainer");
        const emptyState = container.querySelector(".empty-state");
        if (emptyState) emptyState.remove();

        // Create module card
        const moduleDiv = document.createElement("div");
        moduleDiv.id = `module-${moduleId}`;
        moduleDiv.className = "module-card";
        moduleDiv.innerHTML = `
            <div class="module-header">
                <span class="module-title">${this.getModuleTitle(moduleId)}</span>
                <span class="module-result" id="result-${moduleId}">Calculating...</span>
            </div>
            <iframe 
                src="${this.modules[moduleId]}" 
                class="module-iframe" 
                id="iframe-${moduleId}"
                onload="this.style.height = this.contentWindow.document.body.scrollHeight + 'px'"
            ></iframe>
        `;
        container.appendChild(moduleDiv);

        // Listen for messages from iframe
        window.addEventListener("message", (event) => {
            if (
                event.data.type === "PGBP_RESULT" &&
                event.data.moduleId === moduleId
            ) {
                this.updateModuleResult(moduleId, event.data.amount);
            }
        });
    }

    removeModuleFromDOM(moduleId) {
        const moduleEl = document.getElementById(`module-${moduleId}`);
        if (moduleEl) moduleEl.remove();

        // Show empty state if no modules left
        if (this.activeModules.size === 0) {
            document.getElementById("modulesContainer").innerHTML = `
                <div class="empty-state">
                    <span style="font-size: 3rem;">📋</span>
                    <p>Select any business or profession type above to start calculating</p>
                </div>
            `;
        }
    }

    updateModuleResult(moduleId, amount) {
        this.moduleResults[moduleId] = amount;
        document.getElementById(`result-${moduleId}`).textContent =
            `₹${amount.toLocaleString("en-IN")}`;
        this.calculateTotal();
    }

    calculateTotal() {
        const total = Object.values(this.moduleResults).reduce(
            (sum, val) => sum + val,
            0,
        );
        document.getElementById("totalPGBP").textContent =
            `₹${total.toLocaleString("en-IN")}`;
    }

    updateResultsVisibility() {
        const resultsPanel = document.getElementById("resultsPanel");
        resultsPanel.style.display =
            this.activeModules.size > 0 ? "block" : "none";
    }

    getModuleTitle(moduleId) {
        const titles = {
            "business-regular": "Regular Business",
            "business-44ad": "Presumptive Business (44AD)",
            "business-44ae": "Transport Business (44AE)",
            "profession-regular": "Regular Profession",
            "profession-44ada": "Presumptive Profession (44ADA)",
            speculative: "Speculative Business",
            "other-business": "Other Business Income",
        };
        return titles[moduleId] || moduleId;
    }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
    window.pgbpLoader = new PGBPModuleLoader();
});
