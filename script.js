const pasteArea = document.getElementById("pasteArea");

async function processImage(image) {

    console.log("Reading image...");

    const result = await Tesseract.recognize(
        image,
        "eng"
    );

    console.log(result.data.text);

}

document.addEventListener("paste", (event)=>{

    const items = event.clipboardData.items;

    for(const item of items){

        if(item.type.startsWith("image")){

            const file = item.getAsFile();

            processImage(file);

        }

    }

});
