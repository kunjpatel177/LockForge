document.addEventListener("input", function (e) {

    if (e.target.classList.contains("form-control")) {

        if (e.target.value.trim() === "") {
            e.target.classList.add("is-invalid");
        } else {
            e.target.classList.remove("is-invalid");
            e.target.classList.add("is-valid");
        }

    }
});

const passwordInput = document.querySelector("#password");

if (passwordInput) {
    passwordInput.addEventListener("input", () => {
        const val = passwordInput.value;

        if (val.length < 6) {
            passwordInput.classList.add("is-invalid");
        } else {
            passwordInput.classList.remove("is-invalid");
            passwordInput.classList.add("is-valid");
        }
    });
}