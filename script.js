// ==========================================
// DAMAGE CALCULATOR - TWO BUILD COMPARISON
// ==========================================


// Store each build's calculated score.

let buildAScore = null;
let buildBScore = null;


// Track which paste area the user most recently selected.
// This determines whether Ctrl+V goes to Build A or Build B.

let activeBuild = "A";


// ==========================================
// BUILD CONFIGURATION
// ==========================================

const builds = {

    A: {

        pasteArea: document.getElementById("pasteAreaA"),
        uploadButton: document.getElementById("uploadButtonA"),
        fileInput: document.getElementById("fileInputA"),

        status: document.getElementById("statusA"),

        progressContainer:
            document.getElementById("progressContainerA"),

        progressBar:
            document.getElementById("progressBarA"),

        progressText:
            document.getElementById("progressTextA"),

        previewSection:
            document.getElementById("previewSectionA"),

        preview:
            document.getElementById("previewA"),

        ocrOutput:
            document.getElementById("ocrOutputA"),

        atkInput:
            document.getElementById("atkA"),

        skillDamageInput:
            document.getElementById("skillDamageA"),

        critRateInput:
            document.getElementById("critRateA"),

        critDamageInput:
            document.getElementById("critDamageA"),

        atkStatus:
            document.getElementById("atkStatusA"),

        skillDamageStatus:
            document.getElementById("skillDamageStatusA"),

        critRateStatus:
            document.getElementById("critRateStatusA"),

        critDamageStatus:
            document.getElementById("critDamageStatusA"),

        calculateButton:
            document.getElementById("calculateButtonA"),

        scoreElement:
            document.getElementById("scoreA"),

        critUsed:
            document.getElementById("critUsedA")

    },


    B: {

        pasteArea: document.getElementById("pasteAreaB"),
        uploadButton: document.getElementById("uploadButtonB"),
        fileInput: document.getElementById("fileInputB"),

        status: document.getElementById("statusB"),

        progressContainer:
            document.getElementById("progressContainerB"),

        progressBar:
            document.getElementById("progressBarB"),

        progressText:
            document.getElementById("progressTextB"),

        previewSection:
            document.getElementById("previewSectionB"),

        preview:
            document.getElementById("previewB"),

        ocrOutput:
            document.getElementById("ocrOutputB"),

        atkInput:
            document.getElementById("atkB"),

        skillDamageInput:
            document.getElementById("skillDamageB"),

        critRateInput:
            document.getElementById("critRateB"),

        critDamageInput:
            document.getElementById("critDamageB"),

        atkStatus:
            document.getElementById("atkStatusB"),

        skillDamageStatus:
            document.getElementById("skillDamageStatusB"),

        critRateStatus:
            document.getElementById("critRateStatusB"),

        critDamageStatus:
            document.getElementById("critDamageStatusB"),

        calculateButton:
            document.getElementById("calculateButtonB"),

        scoreElement:
            document.getElementById("scoreB"),

        critUsed:
            document.getElementById("critUsedB")

    }

};


// ==========================================
// SET UP EACH BUILD
// ==========================================

setupBuild("A");
setupBuild("B");


function setupBuild(buildId) {

    const build = builds[buildId];


    // Remember which build was clicked.

    build.pasteArea.addEventListener("click", function(event) {

        activeBuild = buildId;

        build.pasteArea.focus();

        if (event.target === build.uploadButton) {
            return;
        }

    });


    build.pasteArea.addEventListener("focus", function() {

        activeBuild = buildId;

    });


    // Upload button.

    build.uploadButton.addEventListener("click", function(event) {

        event.stopPropagation();

        activeBuild = buildId;

        build.fileInput.click();

    });


    // File selected.

    build.fileInput.addEventListener("change", function() {

        const file = build.fileInput.files[0];

        if (file) {

            handleImage(file, buildId);

        }

        // Allow selecting the same file again later.

        build.fileInput.value = "";

    });


    // Drag over.

    build.pasteArea.addEventListener("dragover", function(event) {

        event.preventDefault();

        build.pasteArea.classList.add("dragging");

    });


    // Drag leave.

    build.pasteArea.addEventListener("dragleave", function() {

        build.pasteArea.classList.remove("dragging");

    });


    // Drop image.

    build.pasteArea.addEventListener("drop", function(event) {

        event.preventDefault();

        build.pasteArea.classList.remove("dragging");

        activeBuild = buildId;

        const file = event.dataTransfer.files[0];

        if (file && file.type.startsWith("image/")) {

            handleImage(file, buildId);

        } else {

            showStatus(
                buildId,
                "Please drop a valid image file."
            );

        }

    });


    // Calculate button.

    build.calculateButton.addEventListener("click", function() {

        calculateBuild(buildId);

    });

}


// ==========================================
// PASTE IMAGE
// ==========================================

document.addEventListener("paste", function(event) {

    const items = event.clipboardData.items;

    for (let i = 0; i < items.length; i++) {

        const item = items[i];

        if (item.type.startsWith("image/")) {

            const file = item.getAsFile();

            handleImage(file, activeBuild);

            return;

        }

    }


    showStatus(
        activeBuild,
        "No image was found in your clipboard."
    );

});


// ==========================================
// HANDLE IMAGE
// ==========================================

function handleImage(file, buildId) {

    const build = builds[buildId];


    if (!file || !file.type.startsWith("image/")) {

        showStatus(
            buildId,
            "Please choose a valid image."
        );

        return;

    }


    resetBuild(buildId);


    const reader = new FileReader();


    reader.onload = function(event) {

        build.preview.src = event.target.result;

        build.previewSection.classList.remove("hidden");

        runOCR(
            event.target.result,
            buildId
        );

    };


    reader.readAsDataURL(file);

}


// ==========================================
// RUN OCR
// ==========================================

async function runOCR(imageSource, buildId) {

    const build = builds[buildId];


    try {

        showStatus(
            buildId,
            "Reading screenshot..."
        );


        build.progressContainer.classList.remove("hidden");

        build.progressBar.style.width = "0%";

        build.progressText.textContent =
            "Reading image... 0%";


        const result = await Tesseract.recognize(

            imageSource,

            "eng",

            {

                logger: function(message) {

                    if (
                        message.status === "recognizing text" &&
                        typeof message.progress === "number"
                    ) {

                        const percent =
                            Math.round(message.progress * 100);


                        build.progressBar.style.width =
                            percent + "%";


                        build.progressText.textContent =
                            "Reading image... " +
                            percent +
                            "%";

                    }

                }

            }

        );


        const detectedText = result.data.text;


        build.ocrOutput.textContent = detectedText;


        const stats = extractStats(detectedText);


        displayStats(
            stats,
            buildId
        );


        build.progressBar.style.width = "100%";

        build.progressText.textContent =
            "Reading complete!";


        showStatus(
            buildId,
            "Screenshot processed. Check the detected values below."
        );


        // Automatically calculate if all four values were found.

        if (
            stats.atk !== null &&
            stats.skillDamage !== null &&
            stats.critRate !== null &&
            stats.critDamage !== null
        ) {

            calculateBuild(buildId);

        }

    }


    catch (error) {

        console.error(error);


        showStatus(
            buildId,
            "Something went wrong while reading the image. Please try again."
        );


        build.progressText.textContent =
            "OCR failed.";

    }

}


// ==========================================
// EXTRACT STATS FROM OCR TEXT
// ==========================================

function extractStats(text) {

    const cleanedText = text
        .replace(/\r/g, "")
        .replace(/[|]/g, "I");


    const lines = cleanedText
        .split("\n")
        .map(function(line) {
            return line.trim();
        })
        .filter(function(line) {
            return line.length > 0;
        });


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
        // --------------------------

        if (
            stats.atk === null &&
            /\batk\b/i.test(line)
        ) {

            const numbers =
                line.match(/\d[\d,]*/g);


            if (numbers && numbers.length > 0) {

                stats.atk = parseInt(
                    numbers[0].replace(/,/g, ""),
                    10
                );

            }

        }


        // --------------------------
        // SKILL DAMAGE
        // --------------------------

        if (
            stats.skillDamage === null &&
            (
                normalized.includes("skill damage") ||
                normalized.includes("skilldamage") ||
                normalized.includes("skill darnage")
            )
        ) {

            stats.skillDamage =
                getPercentage(line);

        }


        // --------------------------
        // CRIT RATE
        // --------------------------

        if (
            stats.critRate === null &&
            (
                normalized.includes("crit rate") ||
                normalized.includes("critrate") ||
                normalized.includes("critic rate")
            )
        ) {

            stats.critRate =
                getPercentage(line);

        }


        // --------------------------
        // CRIT DAMAGE
        // --------------------------

        if (
            stats.critDamage === null &&
            (
                normalized.includes("crit damage") ||
                normalized.includes("critdamage") ||
                normalized.includes("critic damage")
            )
        ) {

            stats.critDamage =
                getPercentage(line);

        }

    }


    return stats;

}


// ==========================================
// GET FIRST PERCENTAGE FROM LINE
// ==========================================

function getPercentage(line) {

    const percentageMatch =
        line.match(/([+-]?\d+(?:\.\d+)?)\s*%/);


    if (percentageMatch) {

        return parseFloat(
            percentageMatch[1]
        );

    }


    // Fallback if OCR misses the % symbol.

    const numberMatch =
        line.match(/[+-]?\d+(?:\.\d+)?/);


    if (numberMatch) {

        return parseFloat(
            numberMatch[0]
        );

    }


    return null;

}


// ==========================================
// DISPLAY DETECTED STATS
// ==========================================

function displayStats(stats, buildId) {

    const build = builds[buildId];


    setStat(
        build.atkInput,
        build.atkStatus,
        stats.atk
    );


    setStat(
        build.skillDamageInput,
        build.skillDamageStatus,
        stats.skillDamage
    );


    setStat(
        build.critRateInput,
        build.critRateStatus,
        stats.critRate
    );


    setStat(
        build.critDamageInput,
        build.critDamageStatus,
        stats.critDamage
    );

}


// ==========================================
// SET ONE STAT
// ==========================================

function setStat(input, statusElement, value) {

    if (
        value !== null &&
        !Number.isNaN(value)
    ) {

        input.value = value;

        statusElement.textContent = "✓";

        statusElement.className =
            "stat-status success";

    } else {

        input.value = "";

        statusElement.textContent = "✕";

        statusElement.className =
            "stat-status failed";

    }

}


// ==========================================
// CALCULATE ONE BUILD
// ==========================================

function calculateBuild(buildId) {

    const build = builds[buildId];


    const atk =
        parseFloat(build.atkInput.value);


    const skillDamagePercent =
        parseFloat(build.skillDamageInput.value);


    const critRatePercent =
        parseFloat(build.critRateInput.value);


    const critDamagePercent =
        parseFloat(build.critDamageInput.value);


    // Make sure all values are valid.

    if (
        Number.isNaN(atk) ||
        Number.isNaN(skillDamagePercent) ||
        Number.isNaN(critRatePercent) ||
        Number.isNaN(critDamagePercent)
    ) {

        build.scoreElement.textContent =
            "Missing stats";


        build.critUsed.textContent = "";


        showStatus(
            buildId,
            "Please fill in all four stat values before calculating."
        );


        if (buildId === "A") {

            buildAScore = null;

        } else {

            buildBScore = null;

        }


        updateComparison();

        return;

    }


    // Convert percentages to decimal values.

    const skillDamage =
        skillDamagePercent / 100;


    const critDamage =
        critDamagePercent / 100;


    // Crit Rate:
    //
    // 87%  -> 0.87
    // 100% -> 1.00
    // 123% -> 1.00
    //
    // It is also prevented from going below zero.

    const critRate = Math.min(
        Math.max(critRatePercent / 100, 0),
        1
    );


    // YOUR FORMULA:
    //
    // ATK × (1 + Skill Damage)
    //     × (1 + Crit Rate × Crit Damage)

    const power =
        atk *
        (1 + skillDamage) *
        (1 + critRate * critDamage);


    // Display rounded whole number.

    build.scoreElement.textContent =
        Math.round(power).toLocaleString();


    build.critUsed.textContent =
        "Crit Rate used: " +
        formatPercentage(critRate * 100) +
        "%";


    showStatus(
        buildId,
        "Calculation complete. Crit Rate used: " +
        formatPercentage(critRate * 100) +
        "%."
    );


    // Save score for comparison.

    if (buildId === "A") {

        buildAScore = power;

    } else {

        buildBScore = power;

    }


    updateComparison();

}


// ==========================================
// FORMAT PERCENTAGE
// ==========================================

function formatPercentage(value) {

    if (Number.isInteger(value)) {

        return value.toString();

    }


    return value
        .toFixed(2)
        .replace(/\.?0+$/, "");

}


// ==========================================
// UPDATE BUILD COMPARISON
// ==========================================

function updateComparison() {

    const winnerText =
        document.getElementById("winnerText");


    const differenceText =
        document.getElementById("differenceText");


    // Wait until both builds have valid scores.

    if (
        buildAScore === null ||
        buildBScore === null
    ) {

        winnerText.textContent =
            "Calculate both builds to compare them.";


        differenceText.textContent = "";


        return;

    }


    // Exact tie.

    if (buildAScore === buildBScore) {

        winnerText.textContent =
            "It's a tie!";


        differenceText.textContent =
            "Both builds have the same Power Score.";


        return;

    }


    // Determine winner and loser.

    let winnerName;
    let winnerScore;
    let loserScore;


    if (buildAScore > buildBScore) {

        winnerName = "Build A";

        winnerScore = buildAScore;

        loserScore = buildBScore;

    } else {

        winnerName = "Build B";

        winnerScore = buildBScore;

        loserScore = buildAScore;

    }


    // Absolute difference.

    const difference =
        winnerScore - loserScore;


    // Percentage advantage relative to losing build.

    const percentAdvantage =
        loserScore === 0
            ? 0
            : (difference / loserScore) * 100;


    winnerText.textContent =
        winnerName + " wins!";


    differenceText.textContent =
        "+" +
        Math.round(difference).toLocaleString() +
        " Power (" +
        percentAdvantage.toFixed(2) +
        "% stronger)";

}


// ==========================================
// SHOW STATUS
// ==========================================

function showStatus(buildId, message) {

    const build = builds[buildId];


    build.status.textContent = message;

    build.status.classList.remove("hidden");

}


// ==========================================
// RESET ONE BUILD
// ==========================================

function resetBuild(buildId) {

    const build = builds[buildId];


    build.atkInput.value = "";
    build.skillDamageInput.value = "";
    build.critRateInput.value = "";
    build.critDamageInput.value = "";


    build.atkStatus.textContent = "—";
    build.skillDamageStatus.textContent = "—";
    build.critRateStatus.textContent = "—";
    build.critDamageStatus.textContent = "—";


    build.atkStatus.className =
        "stat-status";

    build.skillDamageStatus.className =
        "stat-status";

    build.critRateStatus.className =
        "stat-status";

    build.critDamageStatus.className =
        "stat-status";


    build.scoreElement.textContent = "—";

    build.critUsed.textContent = "";


    build.ocrOutput.textContent =
        "Processing image...";


    if (buildId === "A") {

        buildAScore = null;

    } else {

        buildBScore = null;

    }


    updateComparison();

}
