const stylingTmpl = document.createElement("template");
stylingTmpl.innerHTML = `
  <style>
    :host { display: block; padding: 12px; font-family: sans-serif; font-size: 13px; }
    .section { margin-bottom: 14px; }
    .section-title { font-weight: 600; color: #333; margin-bottom: 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; gap: 8px; }
    label { color: #555; font-size: 12px; flex: 1; }
    input[type=text], input[type=number], select { width: 100px; padding: 3px 6px; border: 1px solid #ccc; border-radius: 4px; font-size: 12px; box-sizing: border-box; }
    input[type=color] { width: 40px; height: 26px; padding: 1px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; }
    input[type=checkbox] { cursor: pointer; }
  </style>
  <div>
    <div class="section">
      <div class="section-title">Seuils & Alertes</div>
      <div class="row">
        <label>Couleur Succès (>= 100%)\u00a0:</label>
        <input type="color" id="colorAbove">
      </div>
      <div class="row">
        <label>% Déclenchement Alerte\u00a0:</label>
        <input type="number" id="warningPct" min="0" max="100">
      </div>
      <div class="row">
        <label>Couleur Alerte\u00a0:</label>
        <input type="color" id="colorWarning">
      </div>
      <div class="row">
        <label>Couleur Échec\u00a0:</label>
        <input type="color" id="colorBelow">
      </div>
    </div>

    <div class="section">
      <div class="section-title">Affichage des Add-ons</div>
      <div class="row">
        <label>Afficher l'objectif</label>
        <input type="checkbox" id="showObjective">
      </div>
      <div class="row">
        <label>Afficher la variance</label>
        <input type="checkbox" id="showVariance">
      </div>
      <div class="row">
        <label>Mode de la variance\u00a0:</label>
        <select id="varianceMode">
          <option value="diff">Absolu (+/-)</option>
          <option value="pct">Pourcentage (%)</option>
        </select>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Conteneur & Marges</div>
      <div class="row">
        <label>Couleur de Fond\u00a0:</label>
        <input type="color" id="bgColor">
      </div>
      <div class="row">
        <label>Couleur Bordure\u00a0:</label>
        <input type="color" id="borderColor">
      </div>
      <div class="row">
        <label>Arrondi des angles (px)\u00a0:</label>
        <input type="number" id="borderRadius" min="0" max="40">
      </div>
      <div class="row">
        <label>Épaisseur Contour (px)\u00a0:</label>
        <input type="number" id="borderWidth" min="0" max="10">
      </div>
      <div class="row">
        <label>Marge Interne (px)\u00a0:</label>
        <input type="number" id="padding" min="0" max="50">
      </div>
    </div>

    <div class="section">
      <div class="section-title">Typographie & Polices</div>
      <div class="row">
        <label>Taille Valeur (px)\u00a0:</label>
        <input type="number" id="valueFontSize" min="10" max="72">
      </div>
      <div class="row">
        <label>Taille Libellé (px)\u00a0:</label>
        <input type="number" id="labelFontSize" min="8" max="24">
      </div>
      <div class="row">
        <label>Couleur Libellé\u00a0:</label>
        <input type="color" id="labelColor">
      </div>
      <div class="row">
        <label>Taille Objectif (px)\u00a0:</label>
        <input type="number" id="objFontSize" min="8" max="24">
      </div>
      <div class="row">
        <label>Couleur Objectif\u00a0:</label>
        <input type="color" id="objColor">
      </div>
    </div>
  </div>
`;

class KPICardStyling extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(stylingTmpl.content.cloneNode(true));

    this._root.querySelectorAll("input, select").forEach(el => {
      el.addEventListener("change", (e) => this._onChange(e.target));
    });
  }

  onCustomWidgetBeforeUpdate(changedProperties) {
    if (!changedProperties) return;
    for (const prop in changedProperties) {
      if (this._root.getElementById(prop)) {
        if (this._root.getElementById(prop).type === "checkbox") {
          this._root.getElementById(prop).checked = !!changedProperties[prop];
        } else {
          this._root.getElementById(prop).value = changedProperties[prop];
        }
      }
    }
  }

  _onChange(target) {
    const id = target.id;
    let val;

    if (target.type === "checkbox") {
      val = target.checked;
    } else if (target.type === "number") {
      val = parseFloat(target.value) || 0;
    } else {
      val = target.value;
    }

    this.dispatchEvent(new CustomEvent("propertiesChanged", {
      detail: { properties: { [id]: val } }
    }));
  }
}

customElements.define("kpi-card-styling", KPICardStyling);
