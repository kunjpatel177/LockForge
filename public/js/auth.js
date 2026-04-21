document.addEventListener("DOMContentLoaded", () => {

    console.log("AUTH JS LOADED");

    const csrfToken = document.getElementById("csrfToken")?.value;

    // ================= LOGIN =================
    const loginForm = document.getElementById("loginForm");

    if (loginForm) {
        console.log("LOGIN FORM FOUND");

        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(loginForm);
            console.log("--------", formData)

            const dataObj = Object.fromEntries(formData.entries());

            const res = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken
                },
                body: JSON.stringify(dataObj),
                credentials: "same-origin"
            });

            // const data = await res.json();
            let data;

            try {
                data = await res.json();
            } catch (err) {
                alert("Session expired. Please refresh and try again.");
                return;
            }

            if (res.status === 403) {
                alert("Session expired. Please refresh page.");
                return;
            }
            // console.log(res)
            if (data.csrfToken) {
                document.getElementById("csrfToken").value = data.csrfToken;
            }

            if (data.requireOTP) {
                window.location.href = "/verify-otp";
            } else if (data.success) {
                window.location.href = "/dashboard";
            } else {
                showErrors(data.errors)
            }
        });
    }

    // ================= OTP =================
    const otpForm = document.getElementById("otpForm");

    if (otpForm) {
        console.log("OTP FORM FOUND");

        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            console.log("OTP SUBMIT TRIGGERED");

            const formData = new FormData(otpForm);
            const dataObj = Object.fromEntries(formData.entries());

            const res = await fetch("/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken
                },
                body: JSON.stringify(dataObj),
                credentials: "same-origin"
            });

            const data = await res.json();

            console.log("OTP RESPONSE:", data);
            if (data.csrfToken) {
                document.getElementById("csrfToken").value = data.csrfToken;
            }

            if (data.success) {
                window.location.href = "/dashboard";
            } else {
                document.getElementById("error").innerText =
                    data.message || "Invalid OTP";
            }
        });
    }

});


// ================= REGISTER =================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        clearErrors();

        try {
            const formData = new FormData(registerForm);

            const dataObj = Object.fromEntries(formData.entries());

            const res = await fetch("/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "CSRF-Token": csrfToken
                },
                body: JSON.stringify(dataObj)
            });

            const data = await res.json();

            if (!data.success) {
                // console.log("Errors --> ",data.errors)
                showErrors(data.errors);
            } else {
                window.location.href = "/login";
            }

        } catch (err) {
            console.error("Register error:", err);
            alert("Something went wrong. Try again.");
        }
    });
}


// ================= CLEAR ERRORS =================
function clearErrors() {

    document.querySelectorAll(".invalid-feedback").forEach(el => el.remove());

    document.querySelectorAll(".form-control").forEach(el => {
        el.classList.remove("is-invalid");
    });
}

// ================= SHOW ERRORS =================
function showErrors(errors) {

    for (let key in errors) {

        const input = document.querySelector(`[name="${key}"]`);

        if (!input) continue;

        input.classList.add("is-invalid");

        const div = document.createElement("div");
        div.className = "invalid-feedback d-block";
        div.innerText = errors[key];

        // input.parentNode.appendChild(div);
        // 🔥 FIX: append AFTER parent container (not inside)
        const parent = input.closest(".mb-3") || input.parentNode;
        parent.appendChild(div);
    }
}


// ================= TOGGLE PASSWORD =================
document.addEventListener("click", function (e) {
    
    if (e.target.closest(".toggle-password")) {
        
        const btn = e.target.closest(".toggle-password");
        const inputId = btn.dataset.target;
        
        const input = document.getElementById(inputId);
        const icon = btn.querySelector("i");
        
        if (!input) return;
        
        if (input.type === "password") {
            input.type = "text";
            icon.classList.remove("fa-eye");
            icon.classList.add("fa-eye-slash");
        } else {
            input.type = "password";
            icon.classList.remove("fa-eye-slash");
            icon.classList.add("fa-eye");
        }
    }
});


window.showErrors = showErrors;
window.clearErrors = clearErrors;