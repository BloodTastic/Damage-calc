const pasteArea = document.getElementById("pasteArea");

document.addEventListener("paste", (event) => {

    const items = event.clipboardData.items;

    for (const item of items) {

        if (item.type.startsWith("image")) {

            const file = item.getAsFile();

            console.log("Image pasted:", file);

            // Show the image on the page
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.style.maxWidth = "500px";
            img.style.marginTop = "20px";

            document.body.appendChild(img);

            // Run OCR
            readImage(file);
        }
    }
});


async function readImage(image) {

    console.log("Starting OCR...");

    const result = await Tesseract.recognize(
        image,
        "eng",
        {
            logger: info => console.log(info)
        }
    );

    console.log("OCR Result:");
    console.log(result.data.text);

}
