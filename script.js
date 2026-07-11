const upload = document.getElementById("imageUpload");

upload.addEventListener("change", async function(){

    const file = upload.files[0];

    if(!file) return;

    const result = await Tesseract.recognize(
        file,
        "eng"
    );

    console.log(result.data.text);

});
