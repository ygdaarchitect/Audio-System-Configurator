// DOM Element References
const vehicleSelect = document.getElementById('vehicleSelect');
const subSelect = document.getElementById('subSelect');
const ampSelect = document.getElementById('ampSelect');
const agmBatteryCheckbox = document.getElementById('agmBattery');
const resetBtn = document.getElementById('resetBtn');

const totalRmsEl = document.getElementById('totalRms');
const totalCurrentEl = document.getElementById('totalCurrent');
const loadStatusEl = document.getElementById('loadStatus');
const wireRecEl = document.getElementById('wireRec');
const logContent = document.getElementById('logContent');

function logMessage(msg) {
    const timestamp = new Date().toLocaleTimeString();
    logContent.innerHTML += `<br>[${timestamp}] ${msg}`;
    logContent.scrollTop = logContent.scrollHeight;
}

function calculateSystem() {
    // 1. Extract selected hardware parameters
    const selectedVehicle = vehicleSelect.options[vehicleSelect.selectedIndex];
    const alternatorRating = parseInt(selectedVehicle.dataset.alternator);

    const selectedSub = subSelect.options[subSelect.selectedIndex];
    const subRms = parseInt(selectedSub.dataset.rms);

    const selectedAmp = ampSelect.options[ampSelect.selectedIndex];
    const ampDraw = parseInt(selectedAmp.dataset.draw);

    const hasAgm = agmBatteryCheckbox.checked;

    // 2. Core Electrical Calculations (Ohm's / Power formulas estimation)
    // Assume efficiency factor for Class D (~75%) / Class AB (~50%)
    let estimatedAmpDrawFromSub = subRms > 0 ? Math.round(subRms / 13.8 / 0.75) : 0;
    let totalEstimatedDraw = estimatedAmpDrawFromSub + ampDraw;

    // Adjust capacity if secondary battery is installed
    let effectiveAlternatorCapacity = hasAgm ? alternatorRating + 60 : alternatorRating;

    // 3. Update UI Metrics
    totalRmsEl.textContent = `${subRms} W`;
    totalCurrentEl.textContent = `${totalEstimatedDraw} A`;

    // 4. Conditional Logic & System Health Evaluation
    let statusText = "Optimal";
    let statusClass = "status-safe";
    let wireRecommendation = "8 AWG OFC";

    if (totalEstimatedDraw > 200) {
        wireRecommendation = "1/0 (True 0) AWG OFC";
    } else if (totalEstimatedDraw > 100) {
        wireRecommendation = "4 AWG OFC";
    } else if (totalEstimatedDraw > 40) {
        wireRecommendation = "8 AWG OFC";
    } else {
        wireRecommendation = "10 AWG Stock";
    }

    if (totalEstimatedDraw > effectiveAlternatorCapacity) {
        if (!hasAgm) {
            statusText = "Voltage Drop Risk! Add AGM/LTO";
            statusClass = "status-danger";
            logMessage(`⚠️ WARNING: Total draw (${totalEstimatedDraw}A) exceeds stock alternator (${alternatorRating}A). Headlights will dim.`);
        } else {
            statusText = "Supported by Reserve Bank";
            statusClass = "status-warning";
            logMessage(`ℹ️ NOTE: High draw mitigated by secondary battery reserve capacity.`);
        }
    } else if (totalEstimatedDraw > (effectiveAlternatorCapacity * 0.8)) {
        statusText = "Moderate Load";
        statusClass = "status-warning";
        logMessage(`⚡ System operating near maximum thermal threshold.`);
    } else {
        statusText = "Stable & Safe";
        statusClass = "status-safe";
        logMessage(`✔ Configuration stable. Electrical overhead within safe limits.`);
    }

    loadStatusEl.textContent = statusText;
    loadStatusEl.className = `metric-value ${statusClass}`;
    wireRecEl.textContent = wireRecommendation;
}

// Event Listeners
[vehicleSelect, subSelect, ampSelect, agmBatteryCheckbox].forEach(element => {
    element.addEventListener('change', () => {
        logMessage(`Config updated: Recalculating metrics...`);
        calculateSystem();
    });
});

resetBtn.addEventListener('click', () => {
    vehicleSelect.selectedIndex = 1;
    subSelect.selectedIndex = 0;
    ampSelect.selectedIndex = 0;
    agmBatteryCheckbox.checked = false;
    logMessage(`System reset to factory defaults.`);
    calculateSystem();
});

// Initial run
calculateSystem();
