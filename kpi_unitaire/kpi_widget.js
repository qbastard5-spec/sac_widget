(function () {
  if (customElements.get('kpi-card')) return;

  const tmpl = document.createElement("template");
  tmpl.innerHTML = `
    <style>
      :host { display: block; width: 100%; height: 100%; box-sizing: border-box; }
      .card {
        width: 100%; height: 100%; box-sizing: border-box;
        display: flex; flex-direction: column; justify-content: center;
        font-family: sans-serif; overflow: hidden;
      }
      .label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 4px; }
      .value-row { display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; }
      .value { font-weight: 700; line-height: 1; }
      .objective { line-height: 1; }
      .variance { font-size: 0.8em; margin-top: 4px; display: flex; align-items: center; gap: 3px; }
    </style>
    <div class=\"card\" id=\"card\">\n      <div class=\"label\" id=\"label\">KPI</div>
      <div class=\"value-row\">\n        <span class=\"value\" id=\"value\">—</span>
        <span class=\"objective\" id=\"objective\">Obj : —</span>
      </div>
      <div class=\"variance\" id=\"variance\"></div>
    </div>
  `;

  class KPICard extends HTMLElement {
    constructor() {
      super();
      this._root = this.attachShadow({ mode: "open" });
      this._root.appendChild(tmpl.content.cloneNode(true));
      this._props = {};
      this._val = null;
      this._obj = null;
    }

    onCustomWidgetBeforeUpdate(changedProperties) {
      if (!changedProperties) return;
      for (const prop in changedProperties) {
        this._props[prop] = changedProperties[prop];
      }
    }

    onCustomWidgetAfterUpdate(changedProperties) {
      this._render();
    }

    set myData(data) {
      if (data && data.state === "success" && data.metadata && data.metadata.feeds && data.metadata.feeds.myData) {
        const feeds = data.metadata.feeds.myData;
        const mainStructureMemberFeed = feeds.mainStructureMember || feeds.value || feeds.MeasureFeed;
        
        let valIndex = -1;
        let objIndex = -1;
        let labelIndex = -1;

        if (mainStructureMemberFeed && Array.isArray(mainStructureMemberFeed.values)) {
          valIndex = mainStructureMemberFeed.values.indexOf("value");
          objIndex = mainStructureMemberFeed.values.indexOf("objective");
        }

        const dimensionFeed = feeds.dimension || feeds.label || feeds.DimensionFeed;
        if (dimensionFeed && Array.isArray(dimensionFeed.values) && dimensionFeed.values.length > 0) {
          labelIndex = 0;
        }

        if (data.data && data.data.length > 0) {
          const row = data.data[0];
          
          if (valIndex !== -1 && row[mainStructureMemberFeed.id]) {
            this._val = parseFloat(row[mainStructureMemberFeed.id].values[valIndex]) || 0;
          } else if (row[feeds.value?.id]) {
            this._val = parseFloat(row[feeds.value.id].rawValue) || 0;
          }

          if (objIndex !== -1 && row[mainStructureMemberFeed.id]) {
            this._obj = parseFloat(row[mainStructureMemberFeed.id].values[objIndex]) || 0;
          } else if (row[feeds.objective?.id]) {
            this._obj = parseFloat(row[feeds.objective.id].rawValue) || 0;
          }

          if (labelIndex !== -1 && dimensionFeed && row[dimensionFeed.id]) {
            const lblEl = this._root.getElementById("label");
            if (lblEl) lblEl.textContent = row[dimensionFeed.id].label || row[dimensionFeed.id].id;
          }
        }
      }
      this._render();
    }

    _fmt(num) {
      if (num === null || undefined === num) return "—";
      return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    }

    _render() {
      const p = this._props;
      const cardEl = this._root.getElementById("card");
      if (!cardEl) return;

      cardEl.style.backgroundColor = p.bgColor || "#222840";
      cardEl.style.borderColor = p.borderColor || "#2a2a3a";
      cardEl.style.borderStyle = p.borderWidth ? "solid" : "none";
      cardEl.style.borderWidth = (p.borderWidth || 0) + "px";
      cardEl.style.borderRadius = (p.borderRadius || 0) + "px";
      cardEl.style.padding = (p.padding || 0) + "px";

      const lblEl = this._root.getElementById("label");
      if (lblEl) {
        lblEl.style.fontSize = (p.labelFontSize || 12) + "px";
        lblEl.style.color = p.labelColor || "#8899aa";
        if (p.labelText && (!lblEl.textContent || lblEl.textContent === "KPI")) {
          lblEl.textContent = p.labelText;
        }
      }

      let color = p.colorAbove || "#27ae60";
      if (this._val !== null && this._obj !== null && this._obj !== 0) {
        const pct = (this._val / this._obj) * 100;
        if (pct < (p.warningPct || 80)) { color = p.colorBelow || "#c0392b"; }
        else if (pct < 100) { color = p.colorWarning || "#e67e22"; }
      }

      const valEl = this._root.getElementById("value");
      if (valEl) {
        valEl.textContent = this._fmt(this._val);
        valEl.style.fontSize = (p.valueFontSize || 28) + "px";
        valEl.style.color = color;
      }

      const objEl = this._root.getElementById("objective");
      if (objEl && p.showObjective && this._obj !== null) {
        objEl.style.display = "";
        objEl.textContent = "Obj : " + this._fmt(this._obj);
        objEl.style.fontSize = (p.objFontSize || 11) + "px";
        objEl.style.color = p.objColor || "#8899aa";
      } else if (objEl) { objEl.style.display = "none"; }

      const varEl = this._root.getElementById("variance");
      if (varEl && p.showVariance && this._val !== null && this._obj !== null) {
        varEl.style.display = "";
        const diff = this._val - this._obj;
        let varTxt;
        if (p.varianceMode === "pct" && this._obj !== 0) {
          varTxt = (diff >= 0 ? "+" : "") + ((diff / this._obj) * 100).toFixed(1) + "%";
        } else {
          varTxt = (diff >= 0 ? "+" : "") + this._fmt(diff);
        }
        varEl.textContent = (diff >= 0 ? "▲" : "▼") + " " + varTxt + " vs objectif";
        varEl.style.color = color;
      } else if (varEl) { varEl.style.display = "none"; }
    }

    connectedCallback() { this._render(); }
  }

  ["labelText","colorAbove","colorWarning","colorBelow","warningPct",
   "showObjective","showVariance","varianceMode","bgColor","borderColor",
   "borderRadius","borderWidth","padding","valueFontSize","labelFontSize",
   "objFontSize","labelColor","objColor"].forEach(function(prop) {
    Object.defineProperty(KPICard.prototype, prop, {
      get: function() { return this._props[prop]; },
      set: function(val) { this._props[prop] = val; this._render(); }
    });
  });

  customElements.define("kpi-card", KPICard);
})(); // <-- Ajout de la fermeture de l'IIFE ici
