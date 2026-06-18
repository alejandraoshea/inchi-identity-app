function showToast(message, type) {
    type = type || "info";
    var container = document.getElementById("toast-container");
    if (!container) return;
    var toast = document.createElement("div");
    toast.classList.add("toast", "toast-" + type);
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function() {
        toast.style.animation = "fadeOut 0.3s ease forwards";
        setTimeout(function() { toast.remove(); }, 300);
    }, 1800);
}

function setLoadingState(isLoading) {
    var btn = document.querySelector("button[data-compare]");
    if (btn) {
        btn.disabled    = isLoading;
        btn.textContent = isLoading ? "Comparing..." : "Compare";
    }
}

function autoResizeTextarea(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}

function initTextareas() {
    document.querySelectorAll("textarea").forEach(function(ta) {
        ta.addEventListener("input", function() { autoResizeTextarea(ta); });
        autoResizeTextarea(ta);
    });
}

function markActiveNav() {
    var FILES_PAGES = ["text_files.html", "mgf_files.html"];
    var path = location.pathname;
    var page = path.split("/").pop() || "index.html";
    document.body.classList.toggle("allow-scroll", FILES_PAGES.indexOf(page) !== -1);
    document.querySelectorAll(".nav a, .dropdown-menu a").forEach(function(a) {
        var href = a.getAttribute("href");
        var isCompare = href === "/" && (path === "/" || page === "compare.html" || page === "index.html");
        a.classList.toggle("active", isCompare || href === page || href === path);
    });
}

function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
