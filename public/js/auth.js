document.addEventListener("DOMContentLoaded", () => {

    console.log("AUTH JS LOADED");

    const csrfToken = document.getElementById("csrfToken")?.value;

    const otpInput = document.querySelector(".otp-input");

    if (otpInput) {

        otpInput.focus();

        otpInput.addEventListener("input", () => {

            // 🔢 Allow only digits
            otpInput.value = otpInput.value.replace(/[^0-9]/g, "");

            // ⚡ Auto submit when 6 digits entered
            if (otpInput.value.length === 6) {

                // Trigger form submit
                document.getElementById("otpForm").dispatchEvent(
                    new Event("submit", { cancelable: true })
                );
            }
        });
    }

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
            if (otpForm.dataset.submitting === "true") return;
            otpForm.dataset.submitting = "true";
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

            otpForm.dataset.submitting = "false";

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


// ================= OTP COUNTDOWN =================
let timer = 60;
let interval;

function startCountdown() {

    const countdownEl = document.getElementById("countdown");
    const resendLink = document.getElementById("resendLink");

    if (!countdownEl || !resendLink) return;

    resendLink.classList.add("disabled-link");

    interval = setInterval(() => {

        countdownEl.innerText = `Resend available in ${timer}s`;

        timer--;

        if (timer < 0) {
            clearInterval(interval);
            countdownEl.innerText = "";

            resendLink.classList.remove("disabled-link");
        }

    }, 1000);
}

// START TIMER ON LOAD
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("resendLink")) {
        startCountdown();
    }
});


// ================= RESEND OTP =================
document.addEventListener("click", async (e) => {

    if (e.target.id === "resendLink" && !e.target.classList.contains("disabled-link")) {

        e.preventDefault();

        const csrfToken = document.getElementById("csrfToken")?.value;

        const res = await fetch("/resend-otp", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CSRF-Token": csrfToken
            }
        });

        const data = await res.json();

        if (data.success) {

            // restart timer
            timer = 60;
            startCountdown();

            document.getElementById("error").innerText = "OTP resent successfully";
        } else {
            document.getElementById("error").innerText = data.message;
        }
    }

});


// ================= OTP BOX LOGIC =================
const otpBoxes = document.querySelectorAll(".otp-box");

if (otpBoxes.length > 0) {

    otpBoxes[0].focus();

    otpBoxes.forEach((box, index) => {

        box.addEventListener("input", (e) => {

            box.value = box.value.replace(/[^0-9]/g, "");

            if (box.value && index < otpBoxes.length - 1) {
                otpBoxes[index + 1].focus();
            }

            // 🔥 AUTO SUBMIT
            const otp = Array.from(otpBoxes).map(b => b.value).join("");

            if (otp.length === 6) {
                submitOTP(otp);
            }
        });

        // BACKSPACE MOVE
        box.addEventListener("keydown", (e) => {
            if (e.key === "Backspace" && !box.value && index > 0) {
                otpBoxes[index - 1].focus();
            }
        });

    });
}


window.showErrors = showErrors;
window.clearErrors = clearErrors;