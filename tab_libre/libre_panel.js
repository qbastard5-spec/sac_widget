const tmpl = document.createElement("template");
tmpl.innerHTML = `
  <style>
    :host {
      display: block;
      width: 100%;
      height: 100%;
      font-family: sans-serif;
      box-sizing: border-box;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      height: 100%;
    }
    .col {
      display: flex;
      flex-direction: column;
    }
    .col:first-child {
      border-right: 1px solid #2a2a3a;
    }
    .row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 7px 10px;
      border-bottom: 1px solid #1e1e2e;
      flex: 1;
      gap: 6px;
    }
    .row:last-child { border-bottom: none; }
    .lbl {
      font-size: 0.75em;
      color: #8899aa;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .val {
      font-size: 0.9em;
      font-weight: 600;
      text-align: right;
      white-space: nowrap;
    }
  </style>
  <div class="grid">
    <div class="col" id="col1"></div>
    <div class="col" id="col2"></div>
  </div>
`;

class LibrePanel extends HTMLElement {
  constructor() {
    super();
    this._root = this.attachShadow({ mode: "open" });
    this._root.appendChild(tmpl.content.cloneNode(true));
    
    this._props = {
      colorAbove: "#27AE60",
      colorBelow: "#C0392B"
    };
    
    for (let i = 1; i <= 8; i++) {
      this._props[`nom${i}`] = `Indicateur ${i}`;
      this._props[`val${i}`] = 0;
      this._props[`obj${i}`] = 100;
    }
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

  _rowHTML(index) {
    const nom = this._props[`nom${index}`] || "—";
    const val = parseFloat(this._props[`val${index}`]) || 0;
    const obj = parseFloat(this._props[`obj${index}`]) || 100;
    const color = val >= obj ? this._props.colorAbove : this._props.colorBelow;
    
    return `
      <div class="row">
        <span class="lbl" title="${nom}">${nom}</span>
        <span class="val" style="color:${color}">${this._fmt(val)}</span>
      </div>`;
  }

  _render() {
    const col1 = this._root.getElementById("col1");
    const col2 = this._root.getElementById("col2");
    
    if (col1 && col2) {
      let htmlCol1 = "";
      let htmlCol2 = "";
      for (let i = 1; i <= 4; i++) htmlCol1 += this._rowHTML(i);
      for (let i = 5; i <= 8; i++) htmlCol2 += this._rowHTML(i);
      col1.innerHTML = htmlCol1;
      col2.innerHTML = htmlCol2;
    }
  }

  connectedCallback() { 
    this._render(); 
  }
}

// Liaison des propriétés demandées par SAC
const propertiesToBind = ["colorAbove", "colorBelow"];
for (let i = 1; i <= 8; i++) {
  propertiesToBind.push(`nom${i}`, `val${i}`, `obj${i}`);
}

propertiesToBind.forEach(prop => {
  Object.defineProperty(LibrePanel.prototype, prop, {
    get: function() { return this._props[prop]; },
    set: function(value) { 
      this._props[prop] = value; 
      this._render();
    },
    enumerable: true,
    configurable: true
  });
});

// Enregistrement global du composant
customElements.define("libre-panel", LibrePanel);

// Astuce pour SAC : On expose aussi la classe sur la fenêtre globale
window.LibrePanel = LibrePanel;
