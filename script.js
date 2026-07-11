const upload = document.getElementById("imageUpload");
const pasteArea = document.getElementById("pasteArea");

async function processImage(image) {

    const result = await Tesseract.recognize(
        image,
        "eng"
    );

    console.log(result.data.text);

}

upload.addEventListener("change", () => {

    const file = upload.files[0];

    if(file){
        processImage(file);
    }

});

document.addEventListener("paste", (event)=>{

    const items = event.clipboardData.items;

    for(const item of items){

        if(item.type.startsWith("image")){

            const file = item.getAsFile();

            processImage(file);

        }

    }

});
