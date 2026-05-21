const stylingTmpl = document.createElement("template");
stylingTmpl.innerHTML = `
  <style>
    :host { display: block; padding: 14px; font-family: sans-serif; font-size: 13px; color: #333; }
    .section { margin-bottom: 16px; }
    .section-title { font-weight: 600; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 10px; }
    .row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; gap: 10px; }
    label { font-size: 12px; color: #555; flex: 1; }
    input[type=text], input[type=number], select { width: 90px; padding: 4px; border: 1px solid #ccc; border-radius: 4px; }
    input[type=color] { width: 40px; height: 24px; border: 1px solid #ccc; border-radius: 4px; cursor: pointer; padding: 0; }
  </style>
  
  <div class="section">
    <div class="section-title">Seuils & Addons (Add-on)</div>
    <div class="row">
      <label>Couleur Succès (>= 100%)</label>
      <input type="color" id="colorAbove">
    </div>
    <div class="row">
      <label>% Déclenchement Alerte</label>
      <input type="number" id="warningPct" min="0" max="100">
    </div>
    <div class="row">
      <label>Couleur Alerte</label>
      <input type="color" id="colorWarning">
    </div>
    <div class="row">
      <label>Couleur Échec</label>
      <input type="color" id="colorBelow">
    </div>
    <div class="row">
      <label>Afficher la variance</label>
      <select id="showVariance">
        <option value="true">Oui</option>
        <option value="false">Non</option>
      </select>
    </div>
    <div class="row">
      <label>Mode de variance</label>
      <select id="varianceMode">
        <option value="diff">Absolu (+/-)</option>
        <option value="pct">Pourcentage (%)</option>
      </select>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Conteneur (Marge, Contour, Fond)</div>
    <div class="row">
      <label>Couleur de Fond</label>
      <input type="color" id="bgColor">
    </div>
    <div class="row">
      <label>Couleur Bordure</label>
      <input type="color" id="borderColor">
    </div>
    <div class="row">
      <label>Épaisseur Contour (px)</label>
      <input type="number" id="borderWidth" min="0" max="10">
    </div>
    <div class="row">
      <label>Arrondi des angles (px)</label>
      <input type="number" id="borderRadius" min="0" max="30">
    </div>
    <div class="row">
      <label>Marge Interne / Padding (px)</label>
      <input type="number" id="padding" min="0" max="40">
    </div>
  </div>
`;

class KPICardStyling extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(stylingTmpl.content.cloneNode(true));
    
    // Écoute les changements utilisateur sur les inputs pour les renvoyer à SAC
    this._root.querySelectorAll("input, select").forEach(input => {
      input.addEventListener("change", (e) => this._updateProperty(e.target));
    });
  }

  // Reçoit les valeurs depuis SAC pour mettre à jour graphiquement les inputs du panneau
  set colorAbove(v) { this._root.getElementById("colorAbove").value = v; }
  set colorWarning(v) { this._root.getElementById("colorWarning").value = v; }
  set colorBelow(v) { this._root.getElementById("colorBelow").value = v; }
  set warningPct(v) { this._root.getElementById("warningPct").value = v; }
  set bgColor(v) { this._root.getElementById("bgColor").value = v; }
  set borderColor(v) { this._root.getElementById("borderColor").value = v; }
  set borderWidth(v) { this._root.getElementById("borderWidth").value = v; }
  set borderRadius(v) { this._root.getElementById("borderRadius").value = v; }
  set padding(v) { this._root.getElementById("padding").value = v; }
  set showVariance(v) { this._root.getElementById("showVariance").value = String(v); }
  set varianceMode(v) { this._root.getElementById("varianceMode").value = v; }

  _updateProperty(target) {
    const id = target.id;
    let value = target.value;
    
    if (target.type === "number") value = parseFloat(value) || 0;
    if (value === "true") value = true;
    if (value === "false") value = false;

    // Déclenche l'événement officiel SAP Analytics Cloud pour enregistrer la modification
    this.dispatchEvent(new CustomEvent("propertiesChanged", {
      detail: { properties: { [id]: value } }
    }));
  }
}

customElements.define("kpi-card-styling", KPICardStyling);
