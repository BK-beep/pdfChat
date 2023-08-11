let dd = document.querySelector(".dragdrop");
let fn=document.querySelector("#filename");
dd.addEventListener("dragstart", (e) => {
    e.preventDefault();
    console.log("Drag started");
});

dd.addEventListener("dragover", (e) => {
    e.preventDefault(); // Allow dropping
    console.log("Dragged over");
});

dd.addEventListener("dragleave", (e) => {
    e.preventDefault();
    console.log("Dragged out");
});

dd.addEventListener("drop", (e) => {
    e.preventDefault();
    fn.innerHTML="file name :" +e.dataTransfer.files[0].name;
});




const fileInput = document.getElementById("actual-btn");

let inputQuery=document.querySelector("#query");
inputQuery.disabled = true;
fileInput.addEventListener("change", () => {
    inputQuery.disabled = false;
});

fileInput.addEventListener("change", () => {
    const selectedFile = fileInput.files[0]; // Get the first selected file

    if (selectedFile) {
        const fileName = selectedFile.name;
        fn.innerHTML="file name :"+fileName;
    } else {
        fn.innerHTML="No file selected.";
    }
});


document.getElementById("fileupload").addEventListener("submit",async function(event) {
    event.preventDefault();
    const form = new FormData(this);
    const url=this.action;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: form
        });
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const jsonResponse = await response.json();
        console.log(jsonResponse);
    } catch (error) {
        console.log("fetch error",error);
    }
});

document.getElementById("queryElement").addEventListener("submit", async function(event) {
    event.preventDefault();
    const form = new FormData(this);
    const url = this.action;

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: form,
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const textResponse = await response.text();
        let jsonResponse;

        try {
            jsonResponse = JSON.parse(textResponse);
        } catch (parseError) {
            console.log("JSON parsing error", parseError);
            return;
        }
        console.log(jsonResponse);
        const res=document.getElementById("result");
        res.innerHTML = jsonResponse.msgs.pop().text;
        res.style.display = "grid";
    } catch (error) {
        console.log("fetch error", error);
    }
});
