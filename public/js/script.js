let fieldCount = 0;
const csrfToken = document.getElementById("csrfToken")?.value;

function showToast(message, type = "info") {

    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = message;

    // RESET CLASSES
    toast.className = "toast-box show";

    if (type === "success") toast.classList.add("toast-success");
    if (type === "error") toast.classList.add("toast-error");
    if (type === "info") toast.classList.add("toast-info");

    // AUTO HIDE
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ADD FIELD
function addField(label = "", value = "", type = "text") {

    const container = document.getElementById("fieldsContainer");
    if (!container) return;

    const index = fieldCount;

    const div = document.createElement("div");
    div.className = "field-group mb-2";
    div.id = `field-${index}`;


    // LABEL INPUT
    const labelInput = document.createElement("input");
    labelInput.type = "text";
    labelInput.name = `fields[${index}][label]`;
    labelInput.placeholder = "Label";
    labelInput.className = "form-control field-label";
    labelInput.value = label;


    // VALUE INPUT
    const valueInput = document.createElement("input");
    valueInput.type = type === "password" ? "password" : "text";
    valueInput.name = `fields[${index}][value]`;
    valueInput.placeholder = "Value";
    valueInput.className = "form-control field-value";
    valueInput.value = value;


    // SELECT TYPE
    const select = document.createElement("select");
    select.name = `fields[${index}][type]`;
    select.className = "form-select field-type";

    ["text", "password", "otp"].forEach(opt => {
        const option = document.createElement("option");
        option.value = opt;
        option.textContent = opt.toUpperCase();
        if (opt === type) option.selected = true;
        select.appendChild(option);
    });


    // GENERATE BUTTON
    const genBtn = document.createElement("button");
    genBtn.type = "button";
    genBtn.className = "btn btn-outline-success btn-sm generate-btn";
    genBtn.textContent = "Generate";

    if (type !== "password") {
        genBtn.style.display = "none";
    }


    // REMOVE BUTTON
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "btn btn-outline-danger btn-sm remove-btn";
    removeBtn.textContent = "Remove";


    // TYPE CHANGE → SHOW/HIDE GENERATE
    select.addEventListener("change", () => {
        if (select.value === "password") {
            valueInput.type = "password";
            genBtn.style.display = "inline-block";
        } else {
            valueInput.type = "text";
            genBtn.style.display = "none";
        }
    });


    // REMOVE FIELD
    removeBtn.addEventListener("click", () => {
        const allFields = document.querySelectorAll(".field-group");

        if (allFields.length <= 1) {
            showToast("At least one field required", "error");
            return;
        }
        div.remove();
    });


    // GENERATE PASSWORD
    genBtn.addEventListener("click", () => {
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
        let password = "";

        for (let i = 0; i < 12; i++) {
            password += chars[Math.floor(Math.random() * chars.length)];
        }

        valueInput.value = password;
    });


    // APPEND
    div.appendChild(labelInput);
    div.appendChild(valueInput);
    div.appendChild(select);
    div.appendChild(genBtn);
    div.appendChild(removeBtn);

    container.appendChild(div);

    fieldCount++;
}


// ADD FIELD WITH DATA --> EDIT PAGE
function addFieldWithData(label = "", value = "", type = "text") {
    addField(label, value, type);
}


// ADD FIELD BUTTON
document.addEventListener("DOMContentLoaded", () => {

    const addBtn = document.getElementById("addFieldBtn");

    if (addBtn) {
        addBtn.addEventListener("click", () => addField());
    }

});


// TOGGLE PASSWORD
document.addEventListener("click", function (e) {

    if (e.target.closest(".toggle-btn")) {

        const btn = e.target.closest(".toggle-btn");
        const id = btn.dataset.id;

        const hidden = document.getElementById(`hidden-${id}`);
        const real = document.getElementById(`real-${id}`);

        if (!hidden || !real) return;

        if (real.style.display === "none") {
            real.style.display = "inline";
            hidden.style.display = "none";
            btn.innerHTML = '<i class="fa fa-eye-slash"></i>';
        } else {
            real.style.display = "none";
            hidden.style.display = "inline";
            btn.innerHTML = '<i class="fa fa-eye"></i>';
        }
    }
});


// COPY
document.addEventListener("click", function (e) {

    if (e.target.closest(".copy-btn")) {

        const btn = e.target.closest(".copy-btn");
        const value = btn.dataset.value;

        if (!value) return;

        navigator.clipboard.writeText(value);

        btn.innerHTML = '<i class="fa fa-check"></i>';

        setTimeout(() => {
            btn.innerHTML = '<i class="fa fa-copy"></i>';
        }, 1000);
    }
});

// SEARCH FUNCTIONALITY
const input = document.getElementById("searchInput");

if (input) {

    input.addEventListener("input", function () {

        const query = this.value.toLowerCase().trim();

        const cards = document.querySelectorAll(".credential-item");

        cards.forEach(card => {

            const text = card.dataset.search || "";
            const col = card.closest(".col-md-6");

            if (!col) return;

            if (query === "") {
                col.style.display = ""; // reset
                return;
            }

            if (text.includes(query)) {
                col.style.display = "";
            } else {
                col.style.display = "none";
            }

        });

    });
}


const addForm = document.getElementById("addForm");

if (addForm) {
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        try {
            const formData = new FormData(addForm);
            const dataObj = Object.fromEntries(formData.entries());

            let valid = true;

            // manually include fields
            const fields = [];

            document.querySelectorAll(".field-group").forEach((group) => {
                const label = group.querySelector(".field-label")?.value;
                const value = group.querySelector(".field-value")?.value;
                const type = group.querySelector(".field-type")?.value;

                if (label && value) {
                    fields.push({ label, value, type });
                } else {
                    valid = false;
                }
            });

            // VALIDATION
            if (fields.length === 0) {
                showToast("At least one field required", "error");
                return;
            }

            if (!valid) {
                showToast("Fields cannot be empty", "error");
                return;
            }

            dataObj.fields = fields;

            const csrfToken = document.querySelector("[name='_csrf']").value;

            const res = await fetch("/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken  
                },
                body: JSON.stringify(dataObj),
                credentials: "same-origin"
            });

            const data = await res.json();

            console.log("STATUS:", res.status, data);

            if (data.success) {
                window.location.reload();
            } else {
                alert("Error: " + (data.message || "Failed"));
            }

        } catch (err) {
            console.error(err);
            alert("Something went wrong");
        }
    });
}

// EDIT FORM VALIDATION
const editForm = document.getElementById("editForm");

if (editForm) {
    editForm.addEventListener("submit", (e) => {

        let valid = true;

        const fields = document.querySelectorAll(".field-group");

        // Check if at least 1 field exists
        if (fields.length === 0) {
            e.preventDefault();
            showToast("At least one field required", "error");
            return;
        }

        // Validate each field
        fields.forEach(group => {
            const label = group.querySelector(".field-label")?.value.trim();
            const value = group.querySelector(".field-value")?.value.trim();

            if (!label || !value) {
                valid = false;
            }
        });

        if (!valid) {
            e.preventDefault();
            showToast("Fields cannot be empty", "error");
        }

    });
}


// SEARCH FUNCTIONALITY
document.addEventListener("DOMContentLoaded", () => {

    const input = document.getElementById("searchInput");
    const noResults = document.getElementById("noResults");

    if (!input) return;

    input.addEventListener("input", function () {

        const query = this.value.toLowerCase().trim();
        const cards = document.querySelectorAll(".credential-item");

        let found = false;

        cards.forEach(card => {

            const text = card.dataset.search || "";
            const col = card.closest(".col-md-6");

            if (!col) return;

            if (query === "") {
                col.classList.remove("d-none");
                found = true;
                return;
            }

            if (text.includes(query)) {
                col.classList.remove("d-none");
                found = true;
            } else {
                col.classList.add("d-none");
            }

        });

        // NO RESULT MESSAGE
        if (!found) {
            noResults.style.display = "block";
        } else {
            noResults.style.display = "none";
        }

    });

});


// DELETE ACCOUNT
document.addEventListener("click", async (e) => {

    const btn = e.target.closest("#confirmDelete");
    // console.log(btn)

    if (!btn) return;

    const passwordInput = document.getElementById("deletePassword");
    const errorBox = document.getElementById("deleteError");

    const password = passwordInput?.value.trim();

    if (!password) {
        errorBox.innerText = "Password required";
        return;
    }

    try {
        const csrfToken = document.querySelector("[name='_csrf']").value;

        const res = await fetch("/delete-account", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            },
            body: JSON.stringify({ password }),
            credentials: "same-origin"
        });

        const data = await res.json();

        if (data.success) {
            showToast("Account deleted successfully", "success");

            setTimeout(() => {
                window.location.href = "/";
            }, 1500);
        } else {
            errorBox.innerText = data.message || "Error";
        }

    } catch (err) {
        console.error("Delete error:", err);
        errorBox.innerText = "Something went wrong";
    }
});



function openExportModal() {
    const modal = new bootstrap.Modal(document.getElementById("exportModal"));
    modal.show();
}

async function exportPDF() {

    clearErrors();

    const password = document.getElementById("exportPassword").value;

    const csrfToken = document.querySelector("[name='_csrf']").value;

    const res = await fetch("/export", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "CSRF-Token": csrfToken
        },
        body: JSON.stringify({ password })
    });

    if (res.headers.get("content-type") === "application/pdf") {
        const blob = await res.blob();

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = "credentials.pdf";
        a.click();

        window.URL.revokeObjectURL(url);
    } else {
        const data = await res.json();
        // alert(data.message || "Failed");
        showErrors({password: data.message})
    }
}