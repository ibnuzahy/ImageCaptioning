const previewImage = () => {
    const fileInput = document.getElementById("imageFile");
    const preview = document.getElementById("preview");
    const file = fileInput.files[0];

    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            preview.src = e.target.result;
            preview.style.display = "block";
        };
        reader.readAsDataURL(file);
    } else {
        preview.src = "#";
        preview.style.display = "none";
    }
};

const RunImg2Text = () => {
    const fileInput = document.getElementById("imageFile");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file first!");
        return;
    }

    const formData = new FormData();
    formData.append("imageFile", file);

    const xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4) {
            const responseBox = document.getElementById("system_response");
            if (xhttp.status === 200) {
                responseBox.innerHTML = xhttp.responseText;
                fetchHistory();
            } else {
                responseBox.innerHTML = `Error: ${xhttp.responseText}`;
            }
        }
    };
    xhttp.open("POST", "/upload", true);
    xhttp.send(formData);
};

const fetchHistory = () => {
    fetch("/history")
        .then((response) => response.json())
        .then((data) => {
            const historySection = document.getElementById("history_section");
            if (data.length === 0) {
                historySection.innerHTML = "<p>No uploads yet.</p>";
                return;
            }

            const historyHTML = data
                .slice()
                .reverse()
                .map(item => `
                    <div class="border-bottom pb-3 mb-3">
                        <img src="/uploads/${item.filename}" alt="${item.filename}" class="img-thumbnail" style="max-height: 100px;">
                        <p><strong>Caption:</strong> ${item.caption}</p>
                        <p><em>Uploaded at: ${item.upload_date}</em></p>
                    </div>
                `).join("");

            historySection.innerHTML = historyHTML;
        });
};

const confirmDeleteHistory = () => {
    if (confirm("Yakin nih? Semua riwayat akan dihapus!")) {
        deleteHistory();
    }
};

const deleteHistory = () => {
    const xhttp = new XMLHttpRequest();
    xhttp.open("POST", "/delete_history", true);
    xhttp.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            alert("Riwayat berhasil dihapus.");
            fetchHistory();
        }
    };
    xhttp.send();
};

const loadHistory = () => {
    const xhttp = new XMLHttpRequest();
    xhttp.open("GET", "/history", true);
    xhttp.onreadystatechange = () => {
        if (xhttp.readyState === 4 && xhttp.status === 200) {
            const data = JSON.parse(xhttp.responseText);
            const container = document.getElementById("historyList");
            container.innerHTML = "";

            if (data.length === 0) {
                container.innerHTML = "<p>Tidak ada riwayat.</p>";
            } else {
                data.forEach(entry => {
                    const div = document.createElement("div");
                    div.innerHTML = `
                        <p><strong>${entry.filename}</strong>: ${entry.caption}</p>
                        <hr/>
                    `;
                    container.appendChild(div);
                });
            }
        }
    };
    xhttp.send();
};

const toggleDarkMode = () => {
    const body = document.body;
    const toggleBtn = document.getElementById("darkModeToggle");
    const isDarkMode = body.classList.toggle("dark-mode");

    localStorage.setItem("mode", isDarkMode ? "dark" : "light");
    toggleBtn.innerText = isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode";
};

window.onload = () => {
    fetchHistory();

    const savedMode = localStorage.getItem("mode");
    const body = document.body;
    const toggleBtn = document.getElementById("darkModeToggle");

    if (savedMode === "dark") {
        body.classList.add("dark-mode");
        toggleBtn.innerText = "Switch to Light Mode";
    } else {
        toggleBtn.innerText = "Switch to Dark Mode";
    }
};