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
      transition: all 0.2s ease;
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
    .objective { line-height: 1; font-weight: normal; opacity: 0.8; }
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
      <span class="objective" id="objective">Obj: 0</span>
    </div>
    <div class="variance" id="variance"></div>
  </div>
`;

class KPICard extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(tmpl.content.cloneNode(true));

    // Variables de données internes (issues du binding SAC)
    this._val = null;
    this._obj = null;
    this._dimLabel = null;

    // Propriétés de style par défaut
    this._props = {
      labelText: "Indicateur",
      colorAbove: "#27AE60",
      colorWarning: "#E67E22",
      colorBelow: "#C0392B",
      warningPct: 90,
      showObjective: true,
      showVariance: true,
      varianceMode: "diff",
      bgColor: "#222840",
      borderColor: "#2a2a3a",
      borderWidth: 1,
      borderRadius: 8,
      padding: 12,
      valueFontSize: 28,
      labelFontSize: 12,
      objFontSize: 11,
      labelColor: "#8899aa",
      objColor: "#667788"
    };
  }

  // Intercepte les données injectées par le modèle SAC
  set myData(dataBinding) {
    if (!dataBinding || dataBinding.state === "loading") return;
    
    if (dataBinding.data && dataBinding.data.length > 0) {
      const row = dataBinding.data[0];
      
      // Extraction des mesures et dimensions selon les métadonnées
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
    
    // Application des styles dynamiques demandés (Marge interne, bordures, fond)
    card.style.backgroundColor = p.bgColor;
    card.style.borderColor = p.borderColor;
    card.style.borderWidth = `${p.borderWidth}px`;
    card.style.borderStyle = p.borderWidth > 0 ? "solid" : "none";
    card.style.borderRadius = `${p.borderRadius}px`;
    card.style.padding = `${p.padding}px`;

    // Gestion du Titre/Libellé
    const lblEl = this._root.getElementById("label");
    lblEl.textContent = this._dimLabel || p.labelText;
    lblEl.style.fontSize = `${p.labelFontSize}px`;
    lblEl.style.color = p.labelColor;

    // Calcul du seuil de couleur (Threshold)
    let color = p.colorAbove;
    if (this._val !== null && this._obj !== null && this._obj !== 0) {
      const pct = (this._val / this._obj) * 100;
      if (pct >= 100) {
        color = p.colorAbove;
      } else if (pct >= p.warningPct) {
        color = p.colorWarning;
      } else {
        color = p.colorBelow;
      }
    }

    // Valeur principale
    const valEl = this._root.getElementById("value");
    valEl.textContent = this._fmt(this._val);
    valEl.style.fontSize = `${p.valueFontSize}px`;
    valEl.style.color = color;

    // Objectif (Affiché en plus petit à côté ou dessous)
    const objEl = this._root.getElementById("objective");
    if (p.showObjective && this._obj !== null) {
      objEl.style.display = "inline";
      objEl.textContent = `Obj: ${this._fmt(this._obj)}`;
      objEl.style.fontSize = `${p.objFontSize}px`;
      objEl.style.color = p.objColor;
    } else {
      objEl.style.display = "none";
    }

    // Ajout de l'addon de variance (Écart absolu ou pourcentage)
    const varEl = this._root.getElementById("variance");
    if (p.showVariance && this._val !== null && this._obj !== null) {
      varEl.style.display = "flex";
      const diff = this._val - this._obj;
      let txt = "";
      
      if (p.varianceMode === "pct" && this._obj !== 0) {
        const pctVal = (diff / this._obj) * 100;
        txt = `${diff >= 0 ? "+" : ""}${pctVal.toFixed(1)}%`;
      } else {
        txt = `${diff >= 0 ? "+" : ""}${this._fmt(diff)}`;
      }
      
      const arrow = diff >= 0 ? "▲" : "▼";
      varEl.textContent = `${arrow} ${txt} vs objectif`;
      varEl.style.color = color;
    } else {
      varEl.style.display = "none";
    }
  }

  connectedCallback() {
    this._render();
  }
}

// Liaison dynamique des Getters / Setters requis par SAC pour le design
const properties = [
  "labelText", "colorAbove", "colorWarning", "colorBelow", "warningPct",
  "showObjective", "showVariance", "varianceMode", "bgColor", "borderColor",
  "borderWidth", "borderRadius", "padding", "valueFontSize", "labelFontSize",
  "objFontSize", "labelColor", "objColor"
];

properties.forEach(prop => {
  Object.defineProperty(KPICard.prototype, prop, {
    get: function() { return this._props[prop]; },
    set: function(val) { this._props[prop] = val; this._render(); },
    enumerable: true,
    configurable: true
  });
});

customElements.define("kpi-card", KPICard);
window.KPICard = KPICard;
