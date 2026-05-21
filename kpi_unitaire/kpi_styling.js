(() => {
  const tmpl = document.createElement("template");
  tmpl.innerHTML = `
    <style>
      :host { display:block; padding:12px; font-family:sans-serif; font-size:13px; }
      .section { margin-bottom:14px; }
      .section-title { font-weight:600; color:#333; margin-bottom:8px;
                       border-bottom:1px solid #ddd; padding-bottom:4px; }
      .row { display:flex; align-items:center; justify-content:space-between;
             margin-bottom:6px; gap:8px; }
      label { color:#555; font-size:12px; flex:1; }
      input[type=text], input[type=number], select {
        width:100px; padding:3px 6px; border:1px solid #ccc;
        border-radius:4px; font-size:12px; }
      input[type=color] { width:40px; height:26px; padding:1px;
                          border:1px solid #ccc; border-radius:4px; cursor:pointer; }
      input[type=checkbox] { cursor:pointer; }
    </style>
    <div>

      <div class="section">
        <div class="section-title">Couleurs</div>
        <div class="row">
          <label>Au-dessus objectif</label>
          <input type="color" id="colorAbove" value="#27AE60">
        </div>
        <div class="row">
          <label>Avertissement (%)</label>
          <input type="number" id="warningPct" value="80" min="0" max="100">
        </div>
        <div class="row">
          <label>Couleur avertissement</label>
          <input type="color" id="colorWarning" value="#E67E22">
        </div>
        <div class="row">
          <label>En dessous objectif</label>
          <input type="color" id="colorBelow" value="#C0392B">
        </div>
      </div>

      <div class="section">
        <div class="section-title">Affichage</div>
        <div class="row">
          <label>Afficher l'objectif</label>
          <input type="checkbox" id="showObjective" checked>
        </div>
        <div class="row">
          <label>Afficher la variance</label>
          <input type="checkbox" id="showVariance" checked>
        </div>
        <div class="row">
          <label>Mode variance</label>
          <select id="varianceMode">
            <option value="diff">Différence</option>
            <option value="pct">Pourcentage</option>
          </select>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Typographie</div>
        <div class="row">
          <label>Taille valeur (px)</label>
          <input type="number" id="valueFontSize" value="28" min="10" max="80">
        </div>
        <div class="row">
          <label>Taille label (px)</label>
          <input type="number" id="labelFontSize" value="12" min="8" max="30">
        </div>
        <div class="row">
          <label>Taille objectif (px)</label>
          <input type="number" id="objFontSize" value="11" min="8" max="24">
        </div>
        <div class="row">
          <label>Couleur label</label>
          <input type="color" id="labelColor" value="#8899aa">
        </div>
        <div class="row">
          <label>Couleur objectif</label>
          <input type="color" id="objColor" value="#667788">
        </div>
      </div>

      <div class="section">
        <div class="section-title">Bordure et fond</div>
        <div class="row">
          <label>Couleur fond</label>
          <input type="color" id="bgColor" value="#222840">
        </div>
        <div class="row">
          <label>Couleur bordure</label>
          <input type="color" id="borderColor" value="#2a2a3a">
        </div>
        <div class="row">
          <label>Épaisseur bordure (px)</label>
          <input type="number" id="borderWidth" value="1" min="0" max="10">
        </div>
        <div class="row">
          <label>Rayon bordure (px)</label>
          <input type="number" id="borderRadius" value="8" min="0" max="30">
        </div>
        <div class="row">
          <label>Padding (px)</label>
          <input type="number" id="padding" value="10" min="0" max="30">
        </div>
      </div>

    </div>
  `;

  class KpiCardStyling extends HTMLElement {
    constructor() {
      super();
      this._root = this.attachShadow({ mode: "open" });
      this._root.appendChild(tmpl.content.cloneNode(true));
      this._setupListeners();
    }

    _setupListeners() {
      var ids = ["colorAbove","colorWarning","colorBelow","bgColor",
                 "borderColor","labelColor","objColor"];
      var self = this;

      // Color inputs
      ids.forEach(function(id) {
        self._root.getElementById(id).addEventListener("change", function() {
          var obj = {};
          obj[id] = this.value.replace("#","");
          self._dispatch(obj);
        });
      });

      // Number inputs
      ["warningPct","valueFontSize","labelFontSize","objFontSize",
       "borderWidth","borderRadius","padding"].forEach(function(id) {
        self._root.getElementById(id).addEventListener("change", function() {
          var obj = {};
          obj[id] = parseFloat(this.value);
          self._dispatch(obj);
        });
      });

      // Checkboxes
      ["showObjective","showVariance"].forEach(function(id) {
        self._root.getElementById(id).addEventListener("change", function() {
          var obj = {};
          obj[id] = this.checked;
          self._dispatch(obj);
        });
      });

      // Select
      this._root.getElementById("varianceMode").addEventListener("change", function() {
        self._dispatch({ varianceMode: this.value });
      });
    }

    _dispatch(props) {
      this.dispatchEvent(new CustomEvent("propertiesChanged", {
        detail: { properties: props }
      }));
    }

    // Setters appelés par SAC pour synchroniser les valeurs
    set colorAbove(v)    { this._set("colorAbove",    "#" + v); }
    set colorWarning(v)  { this._set("colorWarning",  "#" + v); }
    set colorBelow(v)    { this._set("colorBelow",    "#" + v); }
    set bgColor(v)       { this._set("bgColor",       "#" + v); }
    set borderColor(v)   { this._set("borderColor",   "#" + v); }
    set labelColor(v)    { this._set("labelColor",    "#" + v); }
    set objColor(v)      { this._set("objColor",      "#" + v); }
    set warningPct(v)    { this._setN("warningPct",    v); }
    set valueFontSize(v) { this._setN("valueFontSize", v); }
    set labelFontSize(v) { this._setN("labelFontSize", v); }
    set objFontSize(v)   { this._setN("objFontSize",   v); }
    set borderWidth(v)   { this._setN("borderWidth",   v); }
    set borderRadius(v)  { this._setN("borderRadius",  v); }
    set padding(v)       { this._setN("padding",       v); }
    set showObjective(v) { var el = this._root.getElementById("showObjective"); if(el) el.checked = v; }
    set showVariance(v)  { var el = this._root.getElementById("showVariance");  if(el) el.checked = v; }
    set varianceMode(v)  { var el = this._root.getElementById("varianceMode");  if(el) el.value = v; }

    _set(id, val) {
      var el = this._root.getElementById(id);
      if (el) el.value = val;
    }
    _setN(id, val) {
      var el = this._root.getElementById(id);
      if (el) el.value = val;
    }
  }

  customElements.define("kpi-card-styling", KpiCardStyling);
})();
