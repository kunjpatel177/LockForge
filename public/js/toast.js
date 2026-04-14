document.addEventListener("DOMContentLoaded", () => {

    const toasts = document.querySelectorAll(".toast");

    toasts.forEach(toast => {
        setTimeout(() => {
            toast.classList.remove("show");
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    });

    // manual close
    document.addEventListener("click", (e) => {
        if (e.target.classList.contains("close-toast")) {
            const toast = e.target.closest(".toast");
            toast.remove();
        }
    });
});