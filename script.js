document.addEventListener("paste", function(event) {

    console.log("PASTE DETECTED");

    const items = event.clipboardData.items;

    for (let item of items) {

        console.log("Clipboard item:", item.type);

        if (item.type.startsWith("image")) {

            console.log("IMAGE FOUND");

            const file = item.getAsFile();

            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.style.width = "400px";

            document.body.appendChild(img);
        }
    }
});
