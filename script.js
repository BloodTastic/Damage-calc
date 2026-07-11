// ------------------------------
// GET PAGE ELEMENTS
// ------------------------------

const pasteArea = document.getElementById("pasteArea");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");

const previewSection = document.getElementById("previewSection");
const preview = document.getElementById("preview");

const status = document.getElementById("status");

const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

const ocrOutput = document.getElementById("ocrOutput");

const atkInput = document.getElementById("atk");
const skillDamageInput = document.getElementById("skillDamage");
const critRateInput = document.getElementById("critRate");
const critDamageInput = document.getElementById("critDamage");

const atkStatus = document.getElementById("atkStatus");
const skillDamageStatus = document.getElementById("skillDamageStatus");
const critRateStatus = document.getElementById("critRateStatus");
const critDamageStatus = document.getElementById("critDamageStatus");

const calculateButton = document.getElementById("calculateButton");
const scoreElement = document.getElementById("score");


// ------------------------------
// UPLOAD BUTTON
// ------------------------------

uploadButton.addEventListener("click", function(event) {

    event.stopPropagation();

    fileInput.click();

});


// Clicking the whole paste area also opens file picker,
// except when clicking the upload button itself.

pasteArea.addEventListener("click", function(event) {

    if (event.target !== uploadButton) {
        pasteArea.focus();
    }

});


// ------------------------------
// FILE UPLOAD
// ------------------------------

fileInput.addEventListener("change", function() {

    const file = fileInput.files[0];

    if (file) {
        handleImage(file);
    }

});


// ------------------------------
// PASTE IMAGE
// ------------------------------

document.addEventListener("paste", function(event) {

    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {

        const item = items[i];

        if (item.type.startsWith("image/")) {

            const file = item.getAsFile();

            handleImage(file);

            return;
        }

    }

    showStatus("No image was found in your clipboard.");

});


// ------------------------------
// DRAG AND DROP
// ------------------------------

pasteArea.addEventListener("dragover", function(event) {

    event.preventDefault();

    pasteArea.classList.add("dragging");

});


pasteArea.addEventListener("dragleave", function() {

    pasteArea.classList.remove("dragging");

});


pasteArea.addEventListener("drop", function(event) {

    event.preventDefault();

    pasteArea.classList.remove("dragging");

    const file = event.dataTransfer.files[0];

    if (file && file.type.startsWith("image/")) {

        handleImage(file);

    } else {

        showStatus("Please drop an image file.");

    }

});


// ------------------------------
// HANDLE IMAGE
// ------------------------------

function handleImage(file) {

    if (!file || !file.type.startsWith("image/")) {

        showStatus("Please choose a valid image.");

        return;
    }

    resetResults();

    const reader = new FileReader();

    reader.onload = function(event) {

        preview.src = event.target.result;

        previewSection.classList.remove("hidden");

        runOCR(event.target.result);

    };

    reader.readAsDataURL(file);

}


// ------------------------------
// RUN OCR
// ------------------------------

async function runOCR(imageSource) {

    try {

        showStatus("Reading screenshot...");

        progressContainer.classList.remove("hidden");

        progressBar.style.width = "0%";
        progressText.textContent = "Reading image... 0%";


        const result = await Tesseract.recognize(

            imageSource,

            "eng",

            {

                logger: function(message) {

                    if (
                        message.status === "recognizing text" &&
                        typeof message.progress === "number"
                    ) {

                        const percent = Math.round(message.progress * 100);

                        progressBar.style.width = percent + "%";

                        progressText.textContent =
                            "Reading image... " + percent + "%";

                    }

                }

            }

        );


        const detectedText = result.data.text;


        // Show exactly what OCR saw.

        ocrOutput.textContent = detectedText;


        // Find our four stats.

        const stats = extractStats(detectedText);


        // Put values into editable fields.

        displayStats(stats);


        progressBar.style.width = "100%";

        progressText.textContent = "Reading complete!";

        showStatus("Screenshot processed. Check the detected values below.");

    }

    catch (error) {

        console.error(error);

        showStatus(
            "Something went wrong while reading the image. Please try again."
        );

        progressText.textContent = "OCR failed.";

    }

}


// ------------------------------
// EXTRACT STATS FROM OCR TEXT
// ------------------------------

function extractStats(text) {

    // Clean up OCR text.

    const cleanedText = text
        .replace(/\r/g, "")
        .replace(/[|]/g, "I");


    // Split text into separate lines.

    const lines = cleanedText
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.length > 0);


    const stats = {

        atk: null,

        skillDamage: null,

        critRate: null,

        critDamage: null

    };


    for (const line of lines) {

        const normalized = line.toLowerCase();


        // --------------------------
        // ATK
        // Example:
        // ATK 8225(3477+38+4710)
        // --------------------------

        if (
            stats.atk === null &&
            /\batk\b/i.test(line)
        ) {

            const numbers = line.match(/\d[\d,]*/g);

            if (numbers && numbers.length > 0) {

                stats.atk = parseInt(
                    numbers[0].replace(/,/g, ""),
                    10
                );

            }

        }


        // --------------------------
        // SKILL DAMAGE
        // Example:
        // Skill Damage +166%
        // --------------------------

        if (
            stats.skillDamage === null &&
            (
                normalized.includes("skill damage") ||
                normalized.includes("skilldamage") ||
                normalized.includes("skill darnage")
            )
        ) {

            stats.skillDamage = getPercentage(line);

        }


        // --------------------------
        // CRIT RATE
        // Example:
        // Crit Rate +101%
        // --------------------------

        if (
            stats.critRate === null &&
            (
                normalized.includes("crit rate") ||
                normalized.includes("critrate") ||
                normalized.includes("critic rate")
            )
        ) {

            stats.critRate = getPercentage(line);

        }


        // --------------------------
        // CRIT DAMAGE
        // Example:
        // Crit Damage +178%(20%+158%)
        //
        // We want the first percentage:
        // 178
        // --------------------------

        if (
            stats.critDamage === null &&
            (
                normalized.includes("crit damage") ||
                normalized.includes("critdamage") ||
                normalized.includes("critic damage")
            )
        ) {

            stats.critDamage = getPercentage(line);

        }

    }


    return stats;

}


// ------------------------------
// GET FIRST PERCENTAGE FROM LINE
// ------------------------------

function getPercentage(line) {

    // First try to find a number followed by %

    const percentageMatch = line.match(/([+-]?\d+(?:\.\d+)?)\s*%/);

    if (percentageMatch) {

        return parseFloat(percentageMatch[1]);

    }


    // If OCR missed the % sign,
    // try the first standalone number.

    const numberMatch = line.match(/[+-]?\d+(?:\.\d+)?/);

    if (numberMatch) {

        return parseFloat(numberMatch[0]);

    }


    return null;

}


// ------------------------------
// DISPLAY DETECTED STATS
// ------------------------------

function displayStats(stats) {

    setStat(
        atkInput,
        atkStatus,
        stats.atk
    );

    setStat(
        skillDamageInput,
        skillDamageStatus,
        stats.skillDamage
    );

    setStat(
        critRateInput,
        critRateStatus,
        stats.critRate
    );

    setStat(
        critDamageInput,
        critDamageStatus,
        stats.critDamage
    );

}


// ------------------------------
// SET ONE STAT
// ------------------------------

function setStat(input, statusElement, value) {

    if (value !== null && !Number.isNaN(value)) {

        input.value = value;

        statusElement.textContent = "✓";

        statusElement.className = "stat-status success";

    } else {

        input.value = "";

        statusElement.textContent = "✕";

        statusElement.className = "stat-status failed";

    }

}


// ------------------------------
// CALCULATE BUTTON
// ------------------------------

calculateButton.addEventListener("click", function() {

    const atk = parseFloat(atkInput.value);
    const skillDamagePercent = parseFloat(skillDamageInput.value);
    const critRatePercent = parseFloat(critRateInput.value);
    const critDamagePercent = parseFloat(critDamageInput.value);


    // Make sure all four stats contain valid numbers.

    if (
        Number.isNaN(atk) ||
        Number.isNaN(skillDamagePercent) ||
        Number.isNaN(critRatePercent) ||
        Number.isNaN(critDamagePercent)
    ) {

        scoreElement.textContent = "Missing stats";

        showStatus(
            "Please fill in all four stat values before calculating."
        );

        return;
    }


    // Convert percentage values to decimals.
    //
    // Examples:
    // 166% becomes 1.66
    // 87% becomes 0.87
    // 178% becomes 1.78

    const skillDamage = skillDamagePercent / 100;

    const critDamage = critDamagePercent / 100;


    // Convert Crit Rate to a decimal and cap it at 1.00.
    //
    // Examples:
    // 50%  becomes 0.50
    // 87%  becomes 0.87
    // 100% becomes 1.00
    // 140% also becomes 1.00

    const critRate = Math.min(
        Math.max(critRatePercent / 100, 0),
        1
    );


    // Formula:
    //
    // ATK × (1 + Skill Damage)
    //     × (1 + Crit Rate × Crit Damage)

    const power =
        atk *
        (1 + skillDamage) *
        (1 + critRate * critDamage);


    // Display the final result as a rounded whole number.

    scoreElement.textContent =
        Math.round(power).toLocaleString();


    showStatus(
        "Calculation complete. Crit Rate used: " +
        (critRate * 100).toFixed(0) +
        "%."
    );

});

// ------------------------------
// STATUS MESSAGE
// ------------------------------

function showStatus(message) {

    status.textContent = message;

    status.classList.remove("hidden");

}


// ------------------------------
// RESET RESULTS
// ------------------------------

function resetResults() {

    atkInput.value = "";
    skillDamageInput.value = "";
    critRateInput.value = "";
    critDamageInput.value = "";

    atkStatus.textContent = "—";
    skillDamageStatus.textContent = "—";
    critRateStatus.textContent = "—";
    critDamageStatus.textContent = "—";

    atkStatus.className = "stat-status";
    skillDamageStatus.className = "stat-status";
    critRateStatus.className = "stat-status";
    critDamageStatus.className = "stat-status";

    scoreElement.textContent = "—";

    ocrOutput.textContent = "Processing image...";

}
