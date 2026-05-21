const tmpl = document.createElement("template");
tmpl.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
    }
    .card {
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      font-family: sans-serif;
      overflow: hidden;
    }
    .label {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 4px;
    }
    .value-row {
      display: flex;
      align-items: baseline;
      gap: 8px;
      flex-wrap: wrap;
    }
    .value { font-weight: 700; line-height: 1; }
    .objective { line-height: 1; }
    .variance {
      font-size: 0.8em;
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 3px;
    }
  </style>
  <div class="card" id="card">
    <div class="label" id="label">KPI</div>
    <div class="value-row">
      <span class="value" id="value">0</span>
      <span class="objective" id="objective">Obj : 0</span>
    </div>
    <div class="variance" id="variance"></div>
  </div>
`;

class KPICard extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(tmpl.content.cloneNode(true));

    this._val = null;
    this._obj = null;
    this._dimLabel = null;

    this._props = {
      labelText: "KPI",
      colorAbove: "#27ae60",
      colorWarning: "#e67e22",
      colorBelow: "#c0392b",
      warningPct: 80,
      showObjective: true,
      showVariance: true,
      varianceMode: "diff",
      bgColor: "#222840",
      borderColor: "#2a2a3a",
      borderRadius: 8,
      borderWidth: 1,
      padding: 10,
      valueFontSize: 28,
      labelFontSize: 12,
      objFontSize: 11,
      labelColor: "#8899aa",
      objColor: "#667788"
    };
  }

  set myData(dataBinding) {
    if (!dataBinding || dataBinding.state === "loading") return;
    if (dataBinding.data && dataBinding.data.length > 0) {
      const row = dataBinding.data[0];
      
      // Extraction adaptative selon la structure des métadonnées du feed
      if (row.value) this._val = row.value.raw;
      if (row.objective) this._obj = row.objective.raw;
      if (row.label) this._dimLabel = row.label.label;
    }
    this._render();
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    if (!changedProperties) return;
    for (const prop in changedProperties) {
      this._props[prop] = changedProperties[prop];
    }
    this._render();
  }

  _fmt(n) {
    if (n === null || n === undefined || isNaN(n)) return "—";
    return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
  }

  _render() {
    const p = this._props;
    const card = this._root.getElementById("card");

    // Rendu global des styles du conteneur (Bordures, Marges, Fond)
    card.style.backgroundColor = p.bgColor;
    card.style.borderColor = p.borderColor;
    card.style.borderWidth = `${p.borderWidth}px`;
    card.style.borderStyle = p.borderWidth > 0 ? "solid" : "none";
    card.style.borderRadius = `${p.borderRadius}px`;
    card.style.padding = `${p.padding}px`;

    // Titre/Libellé
    const lblEl = this._root.getElementById("label");
    lblEl.textContent = this._dimLabel || p.labelText;
    lblEl.style.fontSize = `${p.labelFontSize}px`;
    lblEl.style.color = p.labelColor;

    // Logique d'évaluation des seuils dynamiques
    let color = p.colorAbove;
    const currentVal = this._val !== null ? this._val : 105; // Valeurs d'affichage par défaut si aucun binding
    const currentObj = this._obj !== null ? this._obj : 100;

    if (currentObj !== 0) {
      const pct = (currentVal / currentObj) * 100;
      if (pct >= 100) {
        color = p.colorAbove;
      } else if (pct >= p.warningPct) {
        color = p.colorWarning;
      } else {
        color = p.colorBelow;
      }
    }

    // Affichage de la Valeur
    const valEl = this._root.getElementById("value");
    valEl.textContent = this._fmt(this._val !== null ? this._val : 0);
    valEl.style.fontSize = `${p.valueFontSize}px`;
    valEl.style.color = color;

    // Affichage de l'Objectif sous forme discrète
    const objEl = this._root.getElementById("objective");
    if (p.showObjective && (this._obj !== null || this._val === null)) {
      objEl.style.display = "";
      objEl.textContent = `Obj : ${this._fmt(currentObj)}`;
      objEl.style.fontSize = `${p.objFontSize}px`;
      objEl.style.color = p.objColor;
    } else {
      objEl.style.display = "none";
    }

    // Affichage de l'Addon de Variance (Écart ou %)
    const varEl = this._root.getElementById("variance");
    if (p.showVariance && (this._val !== null && this._obj !== null)) {
      varEl.style.display = "";
      const diff = this._val - this._obj;
      let varTxt = "";

      if (p.varianceMode === "pct" && this._obj !== 0) {
        const pctVal = (diff / this._obj) * 100;
        varTxt = `${diff >= 0 ? "+" : ""}${pctVal.toFixed(1)}%`;
      } else {
        varTxt = `${diff >= 0 ? "+" : ""}${this._fmt(diff)}`;
      }

      const arrow = diff >= 0 ? "▲" : "▼";
      varEl.textContent = `${arrow} ${varTxt} vs objectif`;
      varEl.style.color = color;
    } else {
      varEl.style.display = "none";
    }
  }

  connectedCallback() {
    this._render();
  }
}

// Génération automatique des accesseurs de propriétés requis par l'infrastructure de SAC
const propertiesList = [
  "labelText", "colorAbove", "colorWarning", "colorBelow", "warningPct",
  "showObjective", "showVariance", "varianceMode", "bgColor", "borderColor",
  "borderRadius", "borderWidth", "padding", "valueFontSize", "labelFontSize",
  "objFontSize", "labelColor", "objColor"
];

propertiesList.forEach(prop => {
  Object.defineProperty(KPICard.prototype, prop, {
    get: function() { return this._props[prop]; },
    set: function(val) { this._props[prop] = val; this._render(); },
    enumerable: true,
    configurable: true
  });
});

customElements.define("kpi-card", KPICard);
window.KPICard = KPICard;
