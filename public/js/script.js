// ================= GLOBAL =================
let fieldCount = 0;
const csrfToken = document.getElementById("csrfToken")?.value;

function showToast(message, type = "info") {

    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = message;

    // reset classes
    toast.className = "toast-box show";

    if (type === "success") toast.classList.add("toast-success");
    if (type === "error") toast.classList.add("toast-error");
    if (type === "info") toast.classList.add("toast-info");

    // auto hide
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

// ================= ADD FIELD =================
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


// ================= ADD FIELD WITH DATA (EDIT PAGE) =================
function addFieldWithData(label = "", value = "", type = "text") {
    addField(label, value, type);
}


// ================= ADD FIELD BUTTON =================
document.addEventListener("DOMContentLoaded", () => {

    const addBtn = document.getElementById("addFieldBtn");

    if (addBtn) {
        addBtn.addEventListener("click", () => addField());
    }

});


// ================= TOGGLE PASSWORD =================
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


// ================= COPY =================
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

// ===== SEARCH FUNCTIONALITY =====
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


console.log("SCRIPT LOADED");

const addForm = document.getElementById("addForm");

if (addForm) {
    addForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        console.log("SUBMIT TRIGGERED");

        try {
            const formData = new FormData(addForm);
            const dataObj = Object.fromEntries(formData.entries());

            // 🔥 manually include fields (important)
            const fields = [];

            document.querySelectorAll(".field-group").forEach((group) => {
                const label = group.querySelector(".field-label")?.value;
                const value = group.querySelector(".field-value")?.value;
                const type = group.querySelector(".field-type")?.value;

                if (label && value) {
                    fields.push({ label, value, type });
                }
            });

            // 🔥 VALIDATION
            if (fields.length === 0) {
                showToast("⚠️ At least one field required", "error");
                return;
            }

            dataObj.fields = fields;

            const csrfToken = document.querySelector("[name='_csrf']").value;

            const res = await fetch("/add", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken   // 🔥 REQUIRED
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

