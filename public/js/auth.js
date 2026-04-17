let abcform = "abc"

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
            abcform = formData
            
            const dataObj = Object.fromEntries(formData.entries());
            // dataform = dataObj
            // console.log(dataform)
            // console.log(dataObj)

            const res = await fetch("/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataObj),
                credentials: "same-origin"
            });

            const data = await res.json();

            if (data.requireOTP) {
                window.location.href = "/verify-otp";
            } else if (data.success) {
                window.location.href = "/dashboard";
            } else {
                alert("Invalid credentials");
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

            if (data.success) {
                window.location.href = "/dashboard";
            } else {
                document.getElementById("error").innerText =
                    data.message || "Invalid OTP";
            }
        });
    }

});

module.exports.abcform1 = () => {
    console.log(abcform)
}


// ================= GLOBAL CSRF TOKEN =================
// const csrfToken = document.getElementById("csrfToken")?.value;


// ================= LOGIN =================
// const loginForm = document.getElementById("loginForm");

// if (loginForm) {
//     loginForm.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         try {
//             const formData = new FormData(loginForm);
//             const dataObj = Object.fromEntries(formData.entries());

//             const res = await fetch("/login", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json"
//                 },
//                 body: JSON.stringify(dataObj),
//                 credentials: "same-origin"
//             });

//             const data = await res.json();

//             // 🔥 IMPORTANT: handle OTP FIRST
//             if (data.requireOTP) {
//                 window.location.href = "/verify-otp";
//             }
//             else if (data.success) {
//                 window.location.href = "/dashboard";
//             }
//             else {
//                 alert(data.message || "Invalid credentials");
//             }

//         } catch (err) {
//             console.error("Login error:", err);
//             alert("Something went wrong");
//         }
//     });
// }
//-----------------------------------------
// const loginForm = document.getElementById("loginForm");

// if (loginForm) {
//     loginForm.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         clearErrors();

//         try {
//             // ✅ FIXED: use loginForm
//             const formData = new FormData(loginForm);

//             const dataObj = Object.fromEntries(formData.entries());

//             const res = await fetch("/login", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "CSRF-Token": csrfToken
//                 },
//                 body: JSON.stringify(dataObj)
//             });

//             const data = await res.json();

//             if (!data.success) {
//                 showErrors(data.errors);
//             } else {
//                 window.location.href = "/dashboard";
//             }

//         } catch (err) {
//             console.error("Login error:", err);
//             alert("Something went wrong. Try again.");
//         }
//     });
// }


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

        input.parentNode.appendChild(div);
    }
}


// ===== OTP VERIFY =====
// console.log("OTP SCRIPT LOADED");
// const otpForm = document.getElementById("otpForm");

// if (otpForm) {
//     console.log("OTP FORM FOUND");
//     otpForm.addEventListener("submit", async (e) => {
//         e.preventDefault();

//         console.log("OTP SUBMIT TRIGGERED");

//         const formData = new FormData(otpForm);
//         const dataObj = Object.fromEntries(formData.entries());

//         try {
//             const res = await fetch("/verify-otp", {
//                 method: "POST",
//                 headers: {
//                     "Content-Type": "application/json",
//                     "CSRF-Token": csrfToken   // 🔥 REQUIRED
//                 },
//                 body: JSON.stringify(dataObj),
//                 credentials: "same-origin"
//             });

//             const data = await res.json();
//             console.log("OTP RESPONSE:", data);

//             if (data.success) {
//                 window.location.href = "/dashboard";
//             } else {
//                 document.getElementById("error").innerText =
//                     data.message || "Invalid OTP";
//             }

//         } catch (err) {
//             console.error("OTP error:", err);
//             alert("Something went wrong");
//         }
//     });
// }