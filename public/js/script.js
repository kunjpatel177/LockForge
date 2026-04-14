// ================= GLOBAL STATE =================
let fieldCount = 0;

// ================= ADD FIELD (SAFE DOM VERSION) =================
function addField(label = "", value = "", type = "text") {
    const container = document.getElementById("fieldsContainer");
    const template = document.getElementById("field-template");

    if (!container || !template) {
        console.error("Template or container not found");
        return;
    }

    const clone = template.content.cloneNode(true);

    const index = fieldCount;

    const wrapper = clone.querySelector(".field-group");
    wrapper.id = `field-${index}`;

    const labelInput = clone.querySelector(".field-label");
    const valueInput = clone.querySelector(".field-value");
    const select = clone.querySelector(".field-type");
    const genBtn = clone.querySelector(".generate-btn");
    const removeBtn = clone.querySelector(".remove-btn");

    // Assign names (IMPORTANT for backend)
    labelInput.name = `fields[${index}][label]`;
    valueInput.name = `fields[${index}][value]`;
    select.name = `fields[${index}][type]`;

    // Set values
    labelInput.value = label;
    valueInput.value = typeof value === "string" ? value : "";
    select.value = type;

    // Set type for password field
    // if (type === "password") {
    //     valueInput.type = "password";
    // }
    if (type === "password") {
        valueInput.type = "password";
        genBtn.classList.remove("d-none");
    } else {
        genBtn.classList.add("d-none");
    }

    // Attach dataset IDs
    genBtn.dataset.id = index;
    removeBtn.dataset.id = index;

    container.appendChild(clone);

    // 🔥 animation trigger
    const newField = container.lastElementChild;

    // force reflow (important)
    newField.offsetHeight;

    // add class to animate
    newField.classList.add("show");

    fieldCount++;
}

function addFieldWithData(label = "", value = "", type = "text") {
    const container = document.getElementById("fieldsContainer");
    const template = document.getElementById("field-template");

    if (!container || !template) return;

    const clone = template.content.cloneNode(true);

    const index = fieldCount;

    const wrapper = clone.querySelector(".field-group");
    wrapper.id = `field-${index}`;

    const labelInput = clone.querySelector(".field-label");
    const valueInput = clone.querySelector(".field-value");
    const select = clone.querySelector(".field-type");
    const genBtn = clone.querySelector(".generate-btn");
    const removeBtn = clone.querySelector(".remove-btn");

    // assign names
    labelInput.name = `fields[${index}][label]`;
    valueInput.name = `fields[${index}][value]`;
    select.name = `fields[${index}][type]`;

    // set values
    labelInput.value = label;
    valueInput.value = typeof value === "string" ? value : "";
    select.value = type;

    if (type === "password") {
        // valueInput.type = "password";
        genBtn.classList.remove("d-none");
    } else {
        genBtn.classList.add("d-none");
    }

    // attach ids
    genBtn.dataset.id = index;
    removeBtn.dataset.id = index;

    container.appendChild(clone);

    fieldCount++;
}

// ================= REMOVE FIELD =================
function removeField(id) {
    const el = document.getElementById(`field-${id}`);
    if (el) el.remove();
}

// ================= PASSWORD GENERATOR =================
function generatePassword() {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";

    let password = "";
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
}

// ================= AUTO FILL PASSWORD =================
function autoFillPassword(index) {
    const input = document.querySelector(
        `input[name="fields[${index}][value]"]`
    );

    if (input) {
        input.value = generatePassword();
    }
}

// ================= TOGGLE PASSWORD =================
function toggle(id) {
    const hidden = document.getElementById(`hidden-${id}`);
    const real = document.getElementById(`real-${id}`);

    if (!hidden || !real) return;

    if (real.style.display === "none") {
        real.style.display = "inline";
        hidden.style.display = "none";
    } else {
        real.style.display = "none";
        hidden.style.display = "inline";
    }
}

// ================= COPY TEXT =================
function copyText(text) {
    navigator.clipboard.writeText(text);
    alert("Copied!");
}

// ================= EVENT LISTENERS =================
// document.addEventListener("DOMContentLoaded", function () {

//     // Add Field Button
//     const addBtn = document.getElementById("addFieldBtn");
//     if (addBtn) {
//         addBtn.addEventListener("click", () => addField());
//     }

//     // Default fields on load
//     // addField("email", "", "text");
//     // addField("password", "", "password");
// });

document.addEventListener("DOMContentLoaded", function () {

    const addBtn = document.getElementById("addFieldBtn");

    if (addBtn) {
        addBtn.addEventListener("click", () => addField());
    }

    // Default fields on load
    // addField("email", "", "text");
    // addField("password", "", "password");

    // 🔥 HANDLE EDIT PAGE DATA
    const editDataScript = document.getElementById("edit-data");

    if (editDataScript) {
        try {
            const fields = JSON.parse(editDataScript.textContent);

            fieldCount = 0;

            if (fields.length > 0) {
                fields.forEach(field => {
                    addFieldWithData(field.label, field.value, field.type);
                });
            }

        } catch (err) {
            console.error("Error parsing edit data", err);
        }
    }
});

// ================= GLOBAL CLICK HANDLER =================
document.addEventListener("click", function (e) {

    // Remove field
    if (e.target.classList.contains("remove-btn")) {
        const id = e.target.getAttribute("data-id");
        removeField(id);
    }

    // Generate password
    if (e.target.classList.contains("generate-btn")) {
        const id = e.target.getAttribute("data-id");
        autoFillPassword(id);
    }

    // ================= TOGGLE PASSWORD =================
    if (e.target.classList.contains("toggle-btn")) {
        const id = e.target.getAttribute("data-id");
        toggle(id);
    }

    // ================= COPY TEXT =================
    if (e.target.classList.contains("copy-btn")) {
        const text = e.target.getAttribute("data-value");
        copyText(text);
    }

    // DELETE CONFIRM
    if (e.target.classList.contains("delete-btn")) {
        const confirmDelete = confirm("Are you sure?");
        if (!confirmDelete) {
            e.preventDefault();
        }
    }
});

document.addEventListener("change", function (e) {
    if (e.target.classList.contains("field-type")) {

        const fieldGroup = e.target.closest(".field-group");
        const genBtn = fieldGroup.querySelector(".generate-btn");
        // const valueInput = fieldGroup.querySelector(".field-value");

        const selectedType = e.target.value;

        // change input type
        if (selectedType === "password") {
            // valueInput.type = "text";
            genBtn.classList.remove("d-none");
        } else {
            // valueInput.type = "text";
            genBtn.classList.add("d-none");
        }
    }
});




// let fieldCount = 0;

// function addField(label = "", value = "", type = "text") {
//     const container = document.getElementById("fieldsContainer");

//     const div = document.createElement("div");
//     div.className = "field-group";
//     div.id = `field-${fieldCount}`;

//     div.innerHTML = `
//         <input
//             type="text"
//             name="fields[${fieldCount}][label]"
//             placeholder="Label (e.g. email)"
//             value="${label}"
//             required
//         >

//         <input
//             type="${type === "password" ? "password" : "text"}"
//             name="fields[${fieldCount}][value]"
//             placeholder="Value"
//             value="${value}"
//             required
//         >

//         <select name="fields[${fieldCount}][type]">
//             <option value="text" ${type === "text" ? "selected" : ""}>Text</option>
//             <option value="password" ${type === "password" ? "selected" : ""}>Password</option>
//             <option value="otp" ${type === "otp" ? "selected" : ""}>OTP</option>
//         </select>

//         <button type="button" onclick="autoFillPassword(${fieldCount})">
//             Generate
//         </button>

//         <button type="button" onclick="removeField(${fieldCount})">
//             Remove
//         </button>

//         <br><br>
//     `;

//     container.appendChild(div);
//     fieldCount++;
// }

// function removeField(id) {
//     const el = document.getElementById(`field-${id}`);
//     if (el) el.remove();
// }

// function toggle(id) {
//     const hidden = document.getElementById(`val-${id}`);
//     const real = document.getElementById(`real-${id}`);

//     if (real.style.display === "none") {
//         real.style.display = "inline";
//         hidden.style.display = "none";
//     } else {
//         real.style.display = "none";
//         hidden.style.display = "inline";
//     }
// }

// function copyText(text) {
//     navigator.clipboard.writeText(text);
//     alert("Copied!");
// }

// function generatePassword() {
//     const chars =
//         "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&";

//     let password = "";
//     for (let i = 0; i < 12; i++) {
//         password += chars.charAt(Math.floor(Math.random() * chars.length));
//     }

//     return password;
// }

// function autoFillPassword(index) {
//     const input = document.querySelector(
//         `input[name="fields[${index}][value]"]`
//     );

//     if (input) {
//         input.value = generatePassword();
//     }
// }