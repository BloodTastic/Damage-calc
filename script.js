const pasteArea = document.getElementById("pasteArea");
const preview = document.getElementById("preview");

pasteArea.focus();

document.addEventListener("paste", function(event){

    const items = event.clipboardData.items;

    for(let i = 0; i < items.length; i++){

        const item = items[i];

        if(item.type.indexOf("image") !== -1){

            const file = item.getAsFile();

            const reader = new FileReader();

            reader.onload = function(e){

                preview.src = e.target.result;
                preview.style.display = "block";

            };

            reader.readAsDataURL(file);

        }

    }

});
