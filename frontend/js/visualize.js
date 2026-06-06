var RDKit = null;
var rdkitReady = initRDKitModule().then(function(inst) { RDKit = inst; }).catch(function() {});
var sdfCache = {};
var fetching = {};

var modalBackdrop   = null;
var modalInchiLabel = null;
var modalCanvas     = null;
var modalViewer     = null;
var modalBuilt      = false;

function visualizeFromInchi(containerId, inchi) {
    var element = document.getElementById(containerId);
    if (!element || !inchi) return;
    renderCard(element, inchi);
}

var visualizeFromInChI = visualizeFromInchi;

function draw(inchi1, inchi2, id1, id2) {
    visualizeFromInchi(id1 || "mol1", inchi1);
    visualizeFromInchi(id2 || "mol2", inchi2);
}

function drawPair(leftEl, rightEl, inchi1, inchi2) {
    if (leftEl  && inchi1) renderCard(leftEl,  inchi1);
    if (rightEl && inchi2) renderCard(rightEl, inchi2);
}

function render2DFallback(element, sdf, inchi) {
    rdkitReady.then(function() {
        try {
            var mol = RDKit.get_mol(sdf);
            if (!mol || !mol.is_valid()) throw new Error("invalid");
            var smiles = mol.get_smiles();
            mol.delete();

            var mol2d = RDKit.get_mol(smiles);
            if (!mol2d || !mol2d.is_valid()) throw new Error("invalid 2d");

            if (typeof mol2d.set_new_coords === 'function') mol2d.set_new_coords();

            var svgText = mol2d.get_svg_with_highlights("{}");
            mol2d.delete();

            svgText = svgText
                .replace(/\s+width="[^"]*"/, ' width="100%"')
                .replace(/\s+height="[^"]*"/, ' height="100%"');

            element.innerHTML = svgText;

            var svgEl = element.querySelector("svg");
            if (svgEl) {
                svgEl.style.cssText = "display:block;width:100%;height:100%;cursor:pointer;";
                svgEl.setAttribute("preserveAspectRatio", "xMidYMid meet");
            }

            addHintAndClick(element, inchi);

        } catch(e) {
            element.innerHTML = "<div class='mol-error'>Could not render structure</div>";
        }
    });
}

function addHintAndClick(element, inchi) {
    var hint = document.createElement("div");
    hint.className = "mol-hint";
    hint.textContent = "click for 3D \u2197";
    element.appendChild(hint);
    element.style.cursor = "pointer";
    element.title = "Click for interactive 3D";
    element.addEventListener("click", function(e) {
        e.stopPropagation();
        openModal(inchi);
    });
}

function renderCard(element, inchi) {
    element.innerHTML = "<div class='mol-loading'></div>";

    fetchSDF(inchi).then(function(sdf) {
        if (!sdf) {
            element.innerHTML = "<div class='mol-error'>Could not render structure</div>";
            return;
        }

        try {
            var offscreen = document.createElement("div");
            offscreen.style.cssText = "position:fixed;left:-9999px;top:-9999px;width:600px;height:400px;background:white;";
            document.body.appendChild(offscreen);

            var viewer = $3Dmol.createViewer(offscreen, {
                backgroundColor: "white",
                antialias: true
            });

            viewer.addModel(sdf, "sdf");
            viewer.setStyle({}, {
                stick: { radius: 0.12, colorscheme: "Jmol" },
                sphere: { scale: 0.22, colorscheme: "Jmol" }
            });
            viewer.zoomTo();
            viewer.zoom(0.85);
            viewer.render();

            var attempts = 0;
            var maxAttempts = 6;
            var interval = setInterval(function() {
                attempts++;
                try {
                    var pngUri = viewer.pngURI();
                    var isBlank = !pngUri || pngUri.length < 2000;

                    if (isBlank && attempts < maxAttempts) return;

                    clearInterval(interval);
                    document.body.removeChild(offscreen);

                    if (isBlank) throw new Error("blank");

                    element.innerHTML = "";

                    var img = document.createElement("img");
                    img.src = pngUri;
                    img.style.cssText = "width:100%;height:100%;object-fit:contain;display:block;cursor:pointer;";
                    element.appendChild(img);

                    addHintAndClick(element, inchi);

                } catch(e) {
                    clearInterval(interval);
                    try { document.body.removeChild(offscreen); } catch(_) {}
                    element.innerHTML = "";
                    render2DFallback(element, sdf, inchi);
                }
            }, 300); 

        } catch(e) {
            element.innerHTML = "";
            render2DFallback(element, sdf, inchi);
        }
    });
}

function buildModal() {
    if (modalBuilt) return;
    modalBuilt = true;

    var backdrop = document.createElement("div");
    backdrop.className = "mol-modal-backdrop";
    backdrop.style.display = "none";

    var box = document.createElement("div");
    box.className = "mol-modal";
    box.style.padding = "16px";

    var headerRow = document.createElement("div");
    headerRow.className = "mol-modal-header";

    var inchiLabel = document.createElement("div");
    inchiLabel.className = "mol-modal-header-text";

    var closeBtn = document.createElement("button");
    closeBtn.className = "mol-modal-close";
    closeBtn.innerHTML = "&#x2715;";

    headerRow.appendChild(inchiLabel);
    headerRow.appendChild(closeBtn);

    var canvasWrap = document.createElement("div");
    canvasWrap.className = "mol-modal-body";

    box.appendChild(headerRow);
    box.appendChild(canvasWrap);
    backdrop.appendChild(box);
    document.body.appendChild(backdrop);

    closeBtn.addEventListener("click", function() { backdrop.style.display = "none"; });
    backdrop.addEventListener("click", function(ev) {
        if (ev.target === backdrop) backdrop.style.display = "none";
    });
    document.addEventListener("keydown", function(ev) {
        if (ev.key === "Escape" && backdrop.style.display !== "none") backdrop.style.display = "none";
    });

    modalBackdrop   = backdrop;
    modalInchiLabel = inchiLabel;
    modalCanvas     = canvasWrap;
    modalViewer     = $3Dmol.createViewer(canvasWrap, { backgroundColor: "white" });
}

function openModal(inchi) {
    buildModal();
    modalInchiLabel.textContent = inchi;
    modalBackdrop.style.display = "flex";

    var loadInto = function(sdf) {
        try { modalViewer.clear(); } catch(e) {}
        try { modalViewer.removeAllModels(); } catch(e) {}
        modalViewer.addModel(sdf, "sdf");
        modalViewer.setStyle({}, { stick: {}, sphere: { scale: 0.3 } });
        modalViewer.zoomTo();
        modalViewer.render();
        setTimeout(function() {
            try { modalViewer.resize(); modalViewer.render(); } catch(e) {}
        }, 80);
    };

    if (sdfCache[inchi]) { loadInto(sdfCache[inchi]); return; }
    fetchSDF(inchi).then(function(sdf) { if (sdf) loadInto(sdf); });
}

function fetchSDF(inchi) {
    if (!inchi) return Promise.resolve(null);
    if (sdfCache[inchi]) return Promise.resolve(sdfCache[inchi]);
    if (fetching[inchi]) return fetching[inchi];

    var p = fetch("http://127.0.0.1:5000/api/generate_3d", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inchi: inchi })
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        delete fetching[inchi];
        if (data.error) throw new Error(data.error);
        sdfCache[inchi] = data.sdf;
        return data.sdf;
    })
    .catch(function() { delete fetching[inchi]; return null; });

    fetching[inchi] = p;
    return p;
}