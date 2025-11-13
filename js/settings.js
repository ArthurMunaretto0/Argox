// settings.js — robusto (preenche com padrão se vazio)
document.addEventListener("DOMContentLoaded", () => {

  const $ = (s)=>document.querySelector(s);
  const store = {
    get(k, fb){
      try{
        const raw = localStorage.getItem(k);
        if(raw === null || raw === "" ) return fb;           // nada salvo ou string vazia
        const v = JSON.parse(raw);
        return (v && typeof v === "object") ? v : fb;        // só aceita objeto
      }catch{ return fb }
    },
    set(k, v){ localStorage.setItem(k, JSON.stringify(v)); }
  };

  function withDefaults(defaultMap, saved){
    // mescla: padrão -> salvo (salvo sobrescreve)
    return Object.assign({}, defaultMap || {}, saved || {});
  }

  function loadEditors(){
    const vend = withDefaults(window.DEFAULT_VENDEDORES, store.get("vend", {}));
    const objt = withDefaults(window.DEFAULT_OBJETOS,    store.get("obj",  {}));
    const mat  = withDefaults(window.DEFAULT_MATERIAIS,  store.get("mat",  {}));

    $("#mapVend").value = JSON.stringify(vend, null, 2);
    $("#mapObj").value  = JSON.stringify(objt, null, 2);
    $("#mapMat").value  = JSON.stringify(mat,  null, 2);
  }

  // 1) carrega com fallback p/ padrões
  loadEditors();

  // 2) Salvar
  $("#btnSalvar").addEventListener("click", ()=>{
    try{
      const nv = JSON.parse($("#mapVend").value || "{}");
      const no = JSON.parse($("#mapObj").value  || "{}");
      const nm = JSON.parse($("#mapMat").value  || "{}");
      store.set("vend", nv);
      store.set("obj",  no);
      store.set("mat",  nm);
      alert("Mapas salvos!");
    }catch(e){
      alert("Erro ao salvar: " + e.message);
    }
  });

  // 3) Restaurar padrão
  $("#btnRestaurar").addEventListener("click", ()=>{
    // limpa os salvos e recarrega apenas os padrões
    store.set("vend", {});
    store.set("obj",  {});
    store.set("mat",  {});
    loadEditors();
    alert("Restaurado para padrão.");
  });

});
