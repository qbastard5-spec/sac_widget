(() => {
  const tmpl = document.createElement("template");
  tmpl.innerHTML = `
    <style>
      :host {
        display: block;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        cursor: pointer;
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
      .arrow { font-size: 0.9em; }
    </style>
    <div class="card" id="card">
      <div class="label"  id="label">KPI</div>
      <div class="value-row">
        <span class="value"     id="value">—</span>
        <span class="objective" id="objective"></span>
      </div>
      <div class="variance" id="variance"></div>
    </div>
  `;

  class KpiCard extends HTMLElement {
    constructor() {
      super();
      this._root = this.attachShadow({ mode: "open" });
      this._root.appendChild(tmpl.content.cloneNode(true));

      this._val = null;
      this._obj = null;
      this._lbl = null;
      this._binding = null;
      this._props = {};

      this._root.getElementById("card").addEventListener("click", () => {
        this.dispatchEvent(new Event("onClick"));
      });
    }

    onCustomWidgetBeforeUpdate(changed) {
      this._props = Object.assign({}, this._props, changed);
    }

    onCustomWidgetAfterUpdate(changed) {
      if ("dataBindings" in changed) {
        this._binding = changed.dataBindings["myData"];
      }

      // Stocker les props
      var p = this._props;
      if ("value_manual"    in changed) this._val = changed.value_manual;
      if ("objective_manual" in changed) this._obj = changed.objective_manual;
      if ("labelText"       in changed) this._lbl = changed.labelText;

      this._readBinding();
      this._applyStyle();
      this._render();
    }

    _readBinding() {
      if (!this._binding) return;
      try {
        var rs = this._binding.getResultSet();
        if (!rs || rs.length === 0) return;

        var row = rs[0];
        var vFeed = this._binding.getFeed("value");
        var oFeed = this._binding.getFeed("objective");
        var lFeed = this._binding.getFeed("label");

        if (vFeed && vFeed[0]) this._val = parseFloat(row[vFeed[0].id]) || null;
        if (oFeed && oFeed[0]) this._obj = parseFloat(row[oFeed[0].id]) || null;
        if (lFeed && lFeed[0]) this._lbl = row[lFeed[0].id] || null;

        console.log("[KPI] val=" + this._val + " obj=" + this._obj + " lbl=" + this._lbl);
      } catch(e) {
        console.log("[KPI] Erreur binding:", e.message);
      }
    }

    _applyStyle() {
      var p = this._props;
      var card = this._root.getElementById("card");

      var bg     = p.bgColor      ? "#" + p.bgColor      : "#222840";
      var border = p.borderColor  ? "#" + p.borderColor  : "#2a2a3a";
      var radius = (p.borderRadius !== undefined ? p.borderRadius : 8) + "px";
      var bw     = (p.borderWidth  !== undefined ? p.borderWidth  : 1) + "px";
      var pad    = (p.padding       !== undefined ? p.padding      : 10) + "px";

      card.style.background    = bg;
      card.style.border        = bw + " solid " + border;
      card.style.borderRadius  = radius;
      card.style.padding       = pad;

      // Label
      var lbl = this._root.getElementById("label");
      lbl.style.fontSize = (p.labelFontSize || 12) + "px";
      lbl.style.color    = p.labelColor ? "#" + p.labelColor : "#8899aa";
    }

    _fmt(n) {
      if (n === null || n === undefined || isNaN(n)) return "—";
      return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
    }

    _getColor() {
      var p = this._props;
      if (this._val === null || this._obj === null) {
        return "#" + (p.colorAbove || "27AE60");
      }

      var pct = (this._val / this._obj) * 100;
      var warn = p.warningPct !== undefined ? p.warningPct : 80;

      if (this._val >= this._obj) {
        return "#" + (p.colorAbove || "27AE60");
      } else if (pct >= warn) {
        return "#" + (p.colorWarning || "E67E22");
      } else {
        return "#" + (p.colorBelow || "C0392B");
      }
    }

    _render() {
      var p = this._props;
      var color = this._getColor();

      // Label
      var lbl = this._root.getElementById("label");
      lbl.textContent = this._lbl || p.labelText || "KPI";

      // Valeur
      var valEl = this._root.getElementById("value");
      valEl.textContent = this._fmt(this._val);
      valEl.style.fontSize = (p.valueFontSize || 28) + "px";
      valEl.style.color    = color;

      // Objectif
      var objEl = this._root.getElementById("objective");
      var showObj = p.showObjective !== false;
      objEl.style.display = showObj && this._obj !== null ? "" : "none";
      objEl.textContent = "Obj : " + this._fmt(this._obj);
      objEl.style.fontSize = (p.objFontSize || 11) + "px";
      objEl.style.color    = "#" + (p.objColor || "667788");

      // Variance
      var varEl = this._root.getElementById("variance");
      var showVar = p.showVariance !== false;

      if (showVar && this._val !== null && this._obj !== null) {
        var mode = p.varianceMode || "diff";
        var diff = this._val - this._obj;
        var varTxt, arrow;

        if (mode === "pct") {
          var pctVal = ((diff / this._obj) * 100);
          varTxt = (diff >= 0 ? "+" : "") + parseFloat(pctVal.toFixed(1)) + "%";
        } else {
          varTxt = (diff >= 0 ? "+" : "") + this._fmt(diff);
        }

        arrow = diff >= 0 ? "▲" : "▼";
        varEl.style.color   = color;
        varEl.style.display = "";
        varEl.innerHTML = '<span class="arrow">' + arrow + '</span>' + varTxt;
      } else {
        varEl.style.display = "none";
      }
    }

    connectedCallback() {
      this._applyStyle();
      this._render();
    }
  }

  customElements.define("kpi-card", KpiCard);
})();
