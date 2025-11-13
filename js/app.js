// ==============================
// app.js — versão ajustada (barras mais grossas e código mais compacto)
// ==============================

// Helpers
const $ = (s)=>document.querySelector(s);
function two(n){ return String(n).padStart(2, "0"); }
const store = {
  get(k, fb){ try{ return JSON.parse(localStorage.getItem(k)) ?? fb }catch{ return fb } },
  set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
};

// Maps + persistência (vindos do maps.js)
let vend = Object.assign({}, DEFAULT_VENDEDORES, store.get("vend", {}));
let objt = Object.assign({}, DEFAULT_OBJETOS,   store.get("obj",  {}));
let mat  = Object.assign({}, DEFAULT_MATERIAIS, store.get("mat",  {}));

// Preenche selects
function fillSelect(id, map){
  const el = $(id);
  el.innerHTML = Object.entries(map)
    .sort((a,b)=>Number(a[0]) - Number(b[0]))
    .map(([k,v]) => `<option value="${two(k)}">${two(k)} — ${v}</option>`)
    .join("");
}
fillSelect("#obj",  objt);
fillSelect("#mat",  Object.fromEntries(Object.entries(mat).map(([k,v])=>[two(k), v])));
fillSelect("#vend", vend);
$("#ano").value = new Date().getFullYear().toString().slice(-2);

// ------------------------------
// Regras do código
// ------------------------------
function custoTo5(c){
  const v = Math.round(Number(c || 0) * 10); // 1 casa decimal, sem ponto
  return String(v).padStart(5, "0");
}
function montarCodigo({oo, mm, vv, aa, custo}){
  return `${oo}${vv}${mm}${aa}${custoTo5(custo)}`; // OO VV MM AA CCCCC
}
function parseCodigo(code){
  const s = (code || "").trim();
  if(!/^\d{13}$/.test(s)) throw new Error("Código inválido (esperado 13 dígitos).");
  const OO = s.slice(0,2), VV = s.slice(2,4), MM = s.slice(4,6), AA = s.slice(6,8), C5 = s.slice(8,13);
  return {
    oo: OO, mm: MM, vv: VV, aa: AA,
    custo: (Number(C5)/10).toFixed(1),
    obj:  objt[Number(OO)] || "Desconhecido",
    mat:  mat[Number(MM)]  || "Desconhecido",
    vend: vend[Number(VV)] || "Desconhecido",
    ano: `20${AA}`
  };
}

// ------------------------------
// PRESETS de tamanho da etiqueta
// AGORA: barras MAIS GROSSAS (narrowDiv menor) e código MAIS CURTO (barWidthPct menor)
// ------------------------------
const PRESETS = {
  "30x15": {
    barArea: "65%",   // área vertical das barras
    quietPct: 12,     // borda em branco nas laterais
    narrowDiv: 350,   // base p/ cálculo (ok)
    barWidthPct: 85,  // ocupa boa parte da etiqueta
    num: 7.8,
    val: 8.2,
    scaleY: 2.8,      // altura boa, não exagerada
    minNarrow: 2.0    // barras mínimas de 2 px
  },
  "58x30": {
    barArea: "75%",
    quietPct: 8,
    narrowDiv: 200,
    barWidthPct: 80,
    num: 9.0,
    val: 9.6,
    minNarrow: 2.0
  },
  "40x30": {
    barArea: "75%",
    quietPct: 8,
    narrowDiv: 190,
    barWidthPct: 80,
    num: 8.6,
    val: 9.2,
    minNarrow: 2.0
  }
};


let CURRENT = PRESETS["30x15"]; // default

// ------------------------------
// applySize
// seta --w / --h e também --bar-area com base no preset
// ------------------------------
function applySize(sel){
  const [w,h] = sel.split("x");
  document.documentElement.style.setProperty("--w", w + "mm");
  document.documentElement.style.setProperty("--h", h + "mm");
  document.documentElement.dataset.size = sel;

  CURRENT = PRESETS[sel] || PRESETS["30x15"];
  document.documentElement.style.setProperty("--bar-area", CURRENT.barArea);
}

// ------------------------------
// drawFittedBarcode
// - controla ALTURA (barHeight)
// - controla LARGURA via barWidthPct (wrapper .bar-wrap)
// ------------------------------
// ------------------------------
// drawFittedBarcode
// - altura automática confortável
// - largura controlada por barWidthPct
// - espessura fixa da barra via narrowPx
// ------------------------------
// ------------------------------
// drawFittedBarcode
// alto + separado
// ------------------------------
// ------------------------------
// drawFittedBarcode
// mantém o espaçamento ORIGINAL e só aumenta a ALTURA
// ------------------------------
function drawFittedBarcode(container, code){
  const W = container.clientWidth  || 200; // px
  const H = container.clientHeight || 30;  // px (faixa reservada pro código)

  // altura base das barras (como no começo, sem exagero)
  const barHeight = Math.max(18, Math.round(H * 0.9));

  // margem lateral (quiet zone) em px
  const quiet = Math.max(4, Math.round(W * (CURRENT.quietPct / 100)));

  // largura básica da barra fina (interno ao SVG) — MESMO cálculo de antes
  const narrow = Math.max(1.0, W / CURRENT.narrowDiv);

  // gera SVG do Code39
  const svgHtml = Code39.draw(code, narrow, barHeight, quiet);

  // wrapper que controla a largura em % da etiqueta
  const wrap = document.createElement("div");
  wrap.className = "bar-wrap";
  wrap.style.width  = (CURRENT.barWidthPct || 100) + "%";
  wrap.style.height = "100%";
  wrap.innerHTML = svgHtml;

  // AQUI: estica o SVG pra cima sem mexer na largura/espacamento
  const svg = wrap.querySelector("svg.bar") || wrap.querySelector("svg");
  if (svg) {
    const sY = CURRENT.scaleY || 1;
    svg.style.transformOrigin = "50% 50%";
    svg.style.transform = `scaleY(${sY})`;
  }

  container.innerHTML = "";
  container.appendChild(wrap);
}




// refazer todos (caso mude tamanho da tela antes de imprimir)
function refitAll(){
  document.querySelectorAll(".label.only-bar .lab-body").forEach(body=>{
    const code = body.parentElement
      .querySelector(".lab-num")
      ?.textContent
      ?.replace("#","");
    if(code) drawFittedBarcode(body, code);
  });
}
window.addEventListener("resize", refitAll);

// ------------------------------
// Etiqueta: barras + número + valor
// ------------------------------
function makeLabel(code, valorTexto=""){
  const el  = document.createElement("div");
  el.className = "label only-bar";
  el.style.breakInside = "avoid";

  const body = document.createElement("div");
  body.className = "lab-body";

  const num  = document.createElement("div");
  num.className  = "lab-num";
  num.textContent = `#${code}`;

  const val = document.createElement("div");
  val.className = "lab-val";
  val.textContent = valorTexto; // ex.: "R$ 125,0" (ou "")

  el.appendChild(body);
  el.appendChild(num);
  el.appendChild(val);

  drawFittedBarcode(body, code);

  return el;
}

// ------------------------------
// Geração
// ------------------------------
const preview   = $("#preview");
const printArea = $("#printArea");

function gerar(){
  const size = $("#size").value || "30x15";
  applySize(size);

  const data = {
    oo: $("#obj").value,
    mm: $("#mat").value,
    vv: $("#vend").value,
    aa: two(Number($("#ano").value || 0)),
    custo: $("#custo").value || 0
  };

  const code = montarCodigo(data);
  $("#codigo").textContent = code;

  const leg = parseCodigo(code);
  $("#legenda").innerHTML =
    `→ <b>${leg.obj}</b> • <b>${leg.mat}</b> • <b>${leg.vend}</b> • Ano <b>${leg.ano}</b> • Custo <b>R$ ${leg.custo}</b>`;

  // valor a mostrar na etiqueta (mostra só se > 0)
  const valorTexto = Number(data.custo || 0) > 0
    ? `R$ ${Number(data.custo).toFixed(1)}`
    : "";

  // Prévia (1 etiqueta)
  preview.innerHTML = "";
  preview.appendChild(makeLabel(code, valorTexto));

  // Área de impressão (qtd)
  printArea.innerHTML = "";
  const qtd = Math.max(1, Number($("#qtd").value || 1));
  for(let i=0;i<qtd;i++) printArea.appendChild(makeLabel(code, valorTexto));
}
$("#btnGerar").addEventListener("click", gerar);

// ------------------------------
// Impressão – via <iframe> oculto (tamanho exato)
// ------------------------------
// ------------------------------
// Impressão – via <iframe> oculto (tamanho exato)
// ------------------------------
function printLabelIframe(size){
  const [w,h] = size.split("x");
  const p = PRESETS[size] || PRESETS["30x15"];

  // HTML das etiquetas e quantidade gerada
  const etiquetasHTML = printArea.innerHTML;
  const qtdEtiquetas  = printArea.children.length || 0;

  // Se só tiver 1 etiqueta, não forçar quebra de página
  const pageBreakRule = qtdEtiquetas > 1
    ? "page-break-after: always;"
    : "page-break-after: auto;";

  const htmlDoc = `<!doctype html><html><head><meta charset="utf-8">
  <title>Etiqueta ${w}x${h}</title>
  <style>
    @page { size: ${w}mm ${h}mm; margin: 0; }
    html, body {
      width:${w}mm;
      height:${h}mm;
      margin:0;
      padding:0;
    }
    body * { box-sizing:border-box; }
    .label {
      width:${w}mm;
      height:${h}mm;
      margin:0;
      padding:0;
      border:0;
      ${pageBreakRule}
      display:flex;
      flex-direction:column;
      justify-content:space-between;
    }
    /* Garante que a última NÃO gere página extra */
    .label:last-child {
      page-break-after: avoid !important;
    }
    .lab-body {
      display:flex;
      align-items:center;
      justify-content:center;
      width:100%;
      height:${p.barArea};
    }
    .bar-wrap {
      display:block;
      height:100%;
      margin:0 auto;
    }
    .lab-num  {
      font:${p.num}px/1 sans-serif;
      text-align:center;
      letter-spacing:1px;
    }
    .lab-val  {
      font:${p.val}px/1.1 sans-serif;
      text-align:center;
      font-weight:600;
      margin-top:1px;
    }
    svg.bar{
      width:100%;
      height:100%;
      shape-rendering: crispEdges;
      image-rendering: pixelated;
    }
  </style></head><body>${etiquetasHTML}</body></html>`;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  iframe.onload = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      setTimeout(()=> iframe.remove(), 400);
    }
  };
  iframe.srcdoc = htmlDoc;
}



// Listener de imprimir
$("#btnImprimir").addEventListener("click", ()=>{
  if (!$("#codigo").textContent.trim()) gerar(); // garante etiqueta pronta

  // garante que todas as barras estão renderizadas
  document.querySelectorAll(".label.only-bar .lab-body").forEach(body=>{
    const code = body.parentElement
      .querySelector(".lab-num")
      ?.textContent
      ?.replace("#","");
    if(code) drawFittedBarcode(body, code);
  });

  const size = $("#size").value || "30x15";
  printLabelIframe(size);
});

// ------------------------------
// Decodificador (scanner)
// ------------------------------
$("#scan").addEventListener("input", ()=>{
  const v = $("#scan").value.trim();
  if(v.length < 13) return;
  try{
    const d = parseCodigo(v);
    $("#decSaida").innerHTML =
     `<div class="success">Código reconhecido!</div>
      <div><b>Tipo:</b> ${d.obj} (OO=${d.oo})</div>
      <div><b>Material:</b> ${d.mat} (MM=${d.mm})</div>
      <div><b>Vendedor:</b> ${d.vend} (VV=${d.vv})</div>
      <div><b>Ano:</b> ${d.ano} (AA=${d.aa})</div>
      <div><b>Custo:</b> R$ ${d.custo}</div>`;
  }catch(e){
    $("#decSaida").innerHTML = `<div class="warn">${e.message}</div>`;
  }
});
