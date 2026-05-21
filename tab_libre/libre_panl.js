(() => {
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
      this._data = Array.from({ length: 8 }, (_, i) => ({
        nom: `Indicateur ${i + 1}`,
        val: 0,
        obj: 100
      }));
      this._colorAbove = "#27AE60";
      this._colorBelow = "#C0392B";
    }

    onCustomWidgetAfterUpdate(changed) {
      for (let i = 1; i <= 8; i++) {
        if (`nom${i}` in changed) this._data[i-1].nom = changed[`nom${i}`];
        if (`val${i}` in changed) this._data[i-1].val = parseFloat(changed[`val${i}`]) || 0;
        if (`obj${i}` in changed) this._data[i-1].obj = parseFloat(changed[`obj${i}`]) || 100;
      }
      if ("colorAbove" in changed) this._colorAbove = changed["colorAbove"];
      if ("colorBelow" in changed) this._colorBelow = changed["colorBelow"];
      this._render();
    }

    _fmt(n) {
      if (n === null || n === undefined || isNaN(n)) return "—";
      return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
    }

    _rowHTML(item) {
      const color = item.val >= item.obj ? this._colorAbove : this._colorBelow;
      return `
        <div class="row">
          <span class="lbl" title="${item.nom}">${item.nom || "—"}</span>
          <span class="val" style="color:${color}">${this._fmt(item.val)}</span>
        </div>`;
    }

    _render() {
      this._root.getElementById("col1").innerHTML =
        this._data.slice(0, 4).map(d => this._rowHTML(d)).join("");
      this._root.getElementById("col2").innerHTML =
        this._data.slice(4, 8).map(d => this._rowHTML(d)).join("");
    }

    connectedCallback() { this._render(); }
  }

  customElements.define("libre-panel", LibrePanel);
})();
