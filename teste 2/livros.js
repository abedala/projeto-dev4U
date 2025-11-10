(function () {
  // ===== Helpers / Estado =====
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);
  const uid = () => Math.random().toString(36).slice(2);

  const modalLivro    = $("#modalLivro");
  const formLivro     = $("#formLivro");
  const abrirLivroBtn = $("#btnAbrirNovoLivro");
  const cancelarLivro = $("#cancelarLivro");
  const salvarLivroBt = $("#salvarLivroBtn");
  const buscaLivros   = $("#buscaLivros");
  const tabelaLivrosBody = $("#tabelaLivros tbody");

  // Estado global compatível (com fallback)
  window.livros = Array.isArray(window.livros) ? window.livros : [];

  // fileToDataUrl fallback
  const fileToDataUrl = window.fileToDataUrl || (file =>
    new Promise(resolve => {
      if (!file) return resolve("");
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.readAsDataURL(file);
    })
  );

  // ===== Modal helpers (dialog fallback) =====
  function openDialog(el){ if (el?.showModal) el.showModal(); else el?.setAttribute("open","open"); }
  function closeDialog(el){ if (el?.close) el.close(); else el?.removeAttribute("open"); }

  // ===== Ações do Modal =====
  abrirLivroBtn?.addEventListener("click", () => {
    $("#livroModalTitulo").textContent = "Novo Livro";
    formLivro?.reset();
    openDialog(modalLivro);
  });

  cancelarLivro?.addEventListener("click", (e) => {
    e.preventDefault();
    closeDialog(modalLivro);
  });

  salvarLivroBt?.addEventListener("click", async (e) => {
    e.preventDefault();

    const titulo  = $("#livroTitulo")?.value.trim();
    const autor   = $("#livroAutor")?.value.trim();
    const genero  = $("#livroGenero")?.value.trim();
    const ano     = $("#livroAno")?.value;
    const file    = $("#livroCapa")?.files?.[0];

    if (!titulo || !autor) {
      alert("Preencha pelo menos Título e Autor.");
      return;
    }

    const capaDataUrl = await fileToDataUrl(file);
    window.livros.push({
      id: uid(),
      titulo, autor, genero, ano,
      status: "Disponível",
      capaDataUrl
    });

    closeDialog(modalLivro);
    renderLivros(buscaLivros?.value || "");

    const count = $("#livrosCount");
    if (count) count.textContent = String(window.livros.length);
  });

  // ===== Renderização =====
  function renderLivros(filter = "") {
    if (!tabelaLivrosBody) return;
    tabelaLivrosBody.innerHTML = "";

    window.livros
      .filter(l => (l.titulo + l.autor + (l.genero||"")).toLowerCase().includes(filter.toLowerCase()))
      .forEach(l => {
        const tr = document.createElement("tr");
        const cor = l.status === "Disponível" ? "ok" : "warn";
        tr.innerHTML = `
          <td><img class="thumb" src="${l.capaDataUrl || ""}" alt=""></td>
          <td>${l.titulo}</td>
          <td>${l.autor}</td>
          <td>${l.genero || "-"}</td>
          <td>${l.ano || "-"}</td>
          <td><span class="badge ${cor}">${l.status}</span></td>
          <td>
            <div class="actions">
              <button class="icon-btn" data-del="${l.id}" title="Excluir">🗑️</button>
            </div>
          </td>
        `;
        tabelaLivrosBody.appendChild(tr);
      });

    // excluir
    tabelaLivrosBody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        if (confirm("Excluir este livro?")) {
          window.livros = window.livros.filter(x => x.id !== id);
          renderLivros($("#buscaLivros")?.value || "");
          const count = $("#livrosCount");
          if (count) count.textContent = String(window.livros.length);
        }
      });
    });
  }

  // Busca dinâmica
  buscaLivros?.addEventListener("input", e => renderLivros(e.target.value || ""));

  // Inicializa
  renderLivros();
})();
