/**
 * formulas.js - Tax Formula Fetcher from Google Sheets
 * Author: Your Name
 * Description: Fetches latest tax formulas from Google Sheets via AppScript
 * Last Updated: March 2024
 */

// ===== CONFIGURATION =====
// Replace with your Google AppScript URL after deployment
const APPSCRIPT_URL = "YOUR_GOOGLE_APPSCRIPT_URL_HERE";

// Cache duration (in minutes)
const CACHE_DURATION = 60;

// ===== GLOBAL FORMULAS OBJECT =====
let taxFormulas = null;
let lastFetchTime = null;

// ===== FETCH FORMULAS FROM GOOGLE SHEETS =====
async function fetchTaxFormulas(forceRefresh = false) {
    try {
        // Check if we have cached formulas and they're still valid
        if (!forceRefresh && taxFormulas && lastFetchTime) {
            const minutesSinceFetch =
                (Date.now() - lastFetchTime) / (1000 * 60);
            if (minutesSinceFetch < CACHE_DURATION) {
                console.log("Using cached formulas");
                return taxFormulas;
            }
        }

        console.log("Fetching fresh formulas from Google Sheets...");

        // Show loading state (optional)
        updateLastUpdated("Loading...");

        // Fetch from Google AppScript
        const response = await fetch(APPSCRIPT_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Validate data structure
        if (!validateFormulas(data)) {
            throw new Error("Invalid formula data structure");
        }

        // Store in memory
        taxFormulas = data;
        lastFetchTime = Date.now();

        // Update UI with last updated time
        updateLastUpdated(new Date().toLocaleString());

        console.log("Formulas updated successfully");
        return taxFormulas;
    } catch (error) {
        console.error("Error fetching formulas:", error);

        // If fetch fails and we have old formulas, use them with warning
        if (taxFormulas) {
            console.warn("Using cached formulas due to fetch error");
            return taxFormulas;
        }

        // If no formulas at all, use fallback defaults
        return getFallbackFormulas();
    }
}

// ===== VALIDATE FORMULA STRUCTURE =====
function validateFormulas(data) {
    // Check required sections exist
    const requiredSections = [
        "new_regime_slabs",
        "old_regime_slabs",
        "deductions",
        "cess",
        "rebate",
    ];

    for (const section of requiredSections) {
        if (!data[section]) {
            console.error(`Missing required section: ${section}`);
            return false;
        }
    }

    return true;
}

// ===== FALLBACK FORMULAS (when Google Sheets unavailable) =====
function getFallbackFormulas() {
    console.warn("Using fallback default formulas");
    return {
        // New regime slabs FY 2024-25
        new_regime_slabs: [
            { min: 0, max: 300000, rate: 0 },
            { min: 300001, max: 600000, rate: 5 },
            { min: 600001, max: 900000, rate: 10 },
            { min: 900001, max: 1200000, rate: 15 },
            { min: 1200001, max: 1500000, rate: 20 },
            { min: 1500001, max: Infinity, rate: 30 },
        ],
        // Old regime slabs FY 2024-25
        old_regime_slabs: [
            { min: 0, max: 250000, rate: 0 },
            { min: 250001, max: 500000, rate: 5 },
            { min: 500001, max: 1000000, rate: 20 },
            { min: 1000001, max: Infinity, rate: 30 },
        ],
        // Deduction limits
        deductions: {
            section80C: 150000,
            section80D: {
                self: 25000,
                senior: 50000,
                parents: 25000,
            },
            standardDeduction: 50000,
            homeLoanInterest: 200000,
        },
        // Cess percentage
        cess: 4,
        // Rebate under section 87A
        rebate: {
            maxIncome: 500000,
            amount: 12500,
        },
        // HRA exemption cities
        hraCities: {
            metro: 50, // 50% for metro cities
            nonMetro: 40, // 40% for other cities
        },
        // Capital gains holding periods
        capitalGains: {
            shortTermEquity: 12, // months
            longTermEquity: 12, // months
            shortTermOther: 36, // months
            longTermOther: 36, // months
        },
        // Last updated date
        lastUpdated: "2024-03-19",
    };
}

// ===== UPDATE UI WITH LAST FETCHED TIME =====
function updateLastUpdated(timestamp) {
    const elements = document.querySelectorAll(".last-updated");
    elements.forEach((el) => {
        if (el) {
            el.textContent = `Last Updated: ${timestamp}`;
        }
    });
}

// ===== GET SPECIFIC FORMULA SECTIONS =====
function getNewRegimeSlabs() {
    return (
        taxFormulas?.new_regime_slabs || getFallbackFormulas().new_regime_slabs
    );
}

function getOldRegimeSlabs() {
    return (
        taxFormulas?.old_regime_slabs || getFallbackFormulas().old_regime_slabs
    );
}

function getDeductionLimit(section) {
    return (
        taxFormulas?.deductions?.[section] ||
        getFallbackFormulas().deductions[section]
    );
}

function getCessRate() {
    return (taxFormulas?.cess || getFallbackFormulas().cess) / 100;
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener("DOMContentLoaded", () => {
    // Fetch formulas when page loads
    fetchTaxFormulas();

    // Optional: Refresh every hour
    setInterval(() => fetchTaxFormulas(true), CACHE_DURATION * 60 * 1000);
});
// Add to formula.js - at the very top or bottom
// Add to formula.js - at the very top or bottom
(function addFavicon() {
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement("link");
        favicon.rel = "icon";
        favicon.type = "image/png";
        favicon.href = "/fav.png"; // Change to your actual filename
        document.head.appendChild(favicon);
    }
})();
