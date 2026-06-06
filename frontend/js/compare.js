var API = "http://127.0.0.1:5000/api";

var layerLabels = {
    complete_identity: "Complete Identity",
    isotope:           "Isotope Independence",
    salt:              "Salt Independence",
    charge:            "Charge Independence",
    double_bond:       "Double Bond Independence",
    stereo_cis_trans:  "Cis/Trans Independence",
    tautomer:          "Tautomer Independence",
};

/* ── Compare ──────────────────────────────────────────────────────────────── */

function compare(isAdvanced) {
    isAdvanced = !!isAdvanced;
    var inchi1 = val(isAdvanced ? "inchi1_adv" : "inchi1");
    var inchi2 = val(isAdvanced ? "inchi2_adv" : "inchi2");
    if (!inchi1 || !inchi2) { showToast("Please enter both InChIs", "error"); return; }

    if (isAdvanced) {
        var selectedLevels = Array.from(
            document.querySelectorAll(".level-checkbox:checked")
        ).map(function(cb) { return cb.value; });

        if (selectedLevels.length === 0) {
            showLevelsError();
            return;
        }
    }

    updateLayers({}, isAdvanced);
    setLoadingState(true);

    var url  = isAdvanced ? API + "/compare_inchis_custom" : API + "/compare_inchis";
    var body = { inchi1: inchi1, inchi2: inchi2 };
    if (isAdvanced) {
        body.levels = Array.from(
            document.querySelectorAll(".level-checkbox:checked")
        ).map(function(cb) { return cb.value; });
    }

    fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
    })
    .then(function(res) {
        return res.json().then(function(data) {
            if (!res.ok) throw new Error(data.message || "Error");
            return data;
        });
    })
    .then(function(data) {
        draw(inchi1, inchi2);
        updateLayers(mapResults(data.results), isAdvanced);
    })
    .catch(function(err) {
        showToast(err.message || "Server error", "error");
    })
    .finally(function() {
        setLoadingState(false);
    });
}

/* ── Levels error (toast + light shake on the checkboxes list) ───────────── */

function showLevelsError() {
    showToast("Select at least one identity level", "error");

    var layersEl = document.getElementById("layers-advanced");
    if (!layersEl) return;

    /* Remove and re-add the class so the animation restarts on repeat clicks */
    layersEl.classList.remove("layers-shake");
    void layersEl.offsetWidth; /* force reflow */
    layersEl.classList.add("layers-shake");

    layersEl.addEventListener("animationend", function handler() {
        layersEl.classList.remove("layers-shake");
        layersEl.removeEventListener("animationend", handler);
    });
}

/* ── Layers ───────────────────────────────────────────────────────────────── */

function updateLayers(results, isAdvanced) {
    isAdvanced = !!isAdvanced;
    document.querySelectorAll(".layer").forEach(function(layer) {
        var cb  = layer.querySelector("input");
        var key = cb ? cb.value : layer.dataset.key;
        if (!key) return;
        if (isAdvanced && cb && !cb.checked) { layer.style.display = "none"; return; }
        layer.style.display = "";
        var result = results[key];
        var badge  = layer.querySelector(".badge");
        if (!badge) { badge = document.createElement("span"); badge.className = "badge"; layer.appendChild(badge); }
        if      (result === true)  { layer.className = "layer match";   badge.className = "badge green"; badge.textContent = "EQUAL"; }
        else if (result === false) { layer.className = "layer nomatch"; badge.className = "badge red";   badge.textContent = "DIFF";  }
        else                       { layer.className = "layer";         badge.className = "badge";       badge.textContent = "N/A";   }
    });
}

function clearAdvancedSelection() {
    document.querySelectorAll(".level-checkbox").forEach(function(cb) { cb.checked = false; });
    document.querySelectorAll("#layers-advanced .layer").forEach(function(layer) {
        layer.style.display = "";
        layer.className = "layer";
        var b = layer.querySelector(".badge");
        if (b) { b.textContent = ""; b.className = "badge"; }
    });
    showToast("Selection cleared", "info");
}

function mapResults(raw) {
    raw = raw || {};
    return {
        complete_identity: raw.COMPLETE_IDENTITY                     != null ? raw.COMPLETE_IDENTITY                     : null,
        isotope:           raw.ISOTOPIC_INDEPENDENCE                 != null ? raw.ISOTOPIC_INDEPENDENCE                 : null,
        salt:              raw.SALTS_INDEPENDENCE                    != null ? raw.SALTS_INDEPENDENCE                    : null,
        charge:            raw.CHARGES_INDEPENDENCE                  != null ? raw.CHARGES_INDEPENDENCE                  : null,
        stereo_cis_trans:  raw.STEREOCHEMICAL_CIS_TRANS_INDEPENDENCE != null ? raw.STEREOCHEMICAL_CIS_TRANS_INDEPENDENCE : null,
        double_bond:       raw.DOUBLE_BONDS_INDEPENDENCE             != null ? raw.DOUBLE_BONDS_INDEPENDENCE             : null,
        tautomer:          raw.TAUTOMER_INDEPENDENCE                 != null ? raw.TAUTOMER_INDEPENDENCE                 : null,
    };
}

/* ── UI utilities ─────────────────────────────────────────────────────────── */

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
    // Files pages need body scroll; compare/advanced fit in the viewport
    var FILES_PAGES = ["files.html", "files-pairwise.html", "files-cross.html"];
    var page = location.pathname.split("/").pop();
    document.body.classList.toggle("allow-scroll", FILES_PAGES.indexOf(page) !== -1);
    document.querySelectorAll(".nav a, .dropdown-menu a").forEach(function(a) {
        a.classList.toggle("active", a.getAttribute("href") === page);
    });
}

function val(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : "";
}
