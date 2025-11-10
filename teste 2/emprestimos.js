// ======================== Empréstimos e Devoluções ========================
// Requisitos atendidos:
// - Buscar por usuários/livros digitando no modal (inputs injetados por JS)
// - Confirmar empréstimo com senha do USUÁRIO escolhido (alerta se incorreta)
// - "Desfazer" devolução caso marcada por engano

(function () {
  // ---------- Acesso seguro aos arrays globais ----------
  const livros = window.livros || (window.livros = []);
  const usuarios = window.usuarios || (window.usuarios = []);
  const emprestimos = window.emprestimos || (window.emprestimos = []);

  // ---------- Helpers DOM ----------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);

  // Helpers de dialog (compatibilidade ampla)
  function openDialog(el) {
    if (el?.showModal) el.showModal();
    else el?.setAttribute("open", "open");
  }
  function closeDialog(el) {
    if (el?.close) el.close();
    else el?.removeAttribute("open");
  }

  // ---------- Elementos da aba ----------
  const modalEmprestimo = $("#modalEmprestimo");
  const formEmprestimo = $("#formEmprestimo");
  const btnAbrirEmprestimo = $("#btnAbrirEmprestimo");
  const btnCancelarEmprestimo = $("#cancelarEmprestimo");
  const salvarEmprestimoBtn = $("#salvarEmprestimoBtn");

  const selectLivro = $("#emprestimoLivro");
  const selectUsuario = $("#emprestimoUsuario");

  const buscaEmprestimos = $("#buscaEmprestimos");
  const tabelaEmprestimos = $("#tabelaEmprestimos tbody");

  // ---------- Estado interno para filtros dos selects ----------
  let cacheLivrosDisponiveis = []; // {id,titulo}
  let cacheUsuarios = [];          // {id,nome}
  let inputFiltroLivro = null;     // <input> injetado
  let inputFiltroUsuario = null;   // <input> injetado

  // ---------- Injeção de inputs de filtro acima dos selects ----------
  function ensureFilterInputs() {
    if (!selectLivro || !selectUsuario) return;

    // LIVRO
    if (!inputFiltroLivro) {
      inputFiltroLivro = document.createElement("input");
      inputFiltroLivro.type = "search";
      inputFiltroLivro.placeholder = "Digite para buscar livro...";
      inputFiltroLivro.className = "input"; // usa seu estilo base
      selectLivro.parentElement.insertBefore(inputFiltroLivro, selectLivro);

      inputFiltroLivro.addEventListener("input", () => {
        popularSelectLivro(inputFiltroLivro.value.trim());
      });
    }

    // USUÁRIO
    if (!inputFiltroUsuario) {
      inputFiltroUsuario = document.createElement("input");
      inputFiltroUsuario.type = "search";
      inputFiltroUsuario.placeholder = "Digite para buscar usuário...";
      inputFiltroUsuario.className = "input";
      selectUsuario.parentElement.insertBefore(inputFiltroUsuario, selectUsuario);

      inputFiltroUsuario.addEventListener("input", () => {
        popularSelectUsuario(inputFiltroUsuario.value.trim());
      });
    }
  }

  // ---------- Popular e filtrar selects ----------
  function buildCaches() {
    cacheLivrosDisponiveis = livros
      .filter(l => l.status !== "Emprestado")
      .map(l => ({ id: l.id, titulo: l.titulo || "" }));

    cacheUsuarios = usuarios.map(u => ({ id: u.id, nome: u.nome || "" }));
  }

  function popularSelectLivro(filtro = "") {
    if (!selectLivro) return;
    const f = filtro.toLowerCase();
    const list = cacheLivrosDisponiveis.filter(l =>
      (l.titulo).toLowerCase().includes(f)
    );

    selectLivro.innerHTML = list.length
      ? list.map(l => `<option value="${l.id}">${l.titulo}</option>`).join("")
      : `<option disabled>Nenhum livro disponível</option>`;
  }

  function popularSelectUsuario(filtro = "") {
    if (!selectUsuario) return;
    const f = filtro.toLowerCase();
    const list = cacheUsuarios.filter(u =>
      (u.nome).toLowerCase().includes(f)
    );

    selectUsuario.innerHTML = list.length
      ? list.map(u => `<option value="${u.id}">${u.nome}</option>`).join("")
      : `<option disabled>Nenhum usuário cadastrado</option>`;
  }

  function preencherSelectsEmprestimo() {
    buildCaches();
    popularSelectLivro(inputFiltroLivro?.value?.trim() || "");
    popularSelectUsuario(inputFiltroUsuario?.value?.trim() || "");
  }

  // ---------- Abrir/fechar modal ----------
  btnAbrirEmprestimo?.addEventListener("click", () => {
    ensureFilterInputs();
    // limpa filtros a cada abertura (opcional)
    if (inputFiltroLivro) inputFiltroLivro.value = "";
    if (inputFiltroUsuario) inputFiltroUsuario.value = "";

    preencherSelectsEmprestimo();
    // datas padrão (hoje e +7 dias) — opcional
    const hoje = new Date();
    const plus7 = new Date();
    plus7.setDate(hoje.getDate() + 7);
    $("#dataEmprestimo").value = hoje.toISOString().slice(0, 10);
    $("#dataDevolucao").value = plus7.toISOString().slice(0, 10);

    openDialog(modalEmprestimo);
  });

  btnCancelarEmprestimo?.addEventListener("click", () => closeDialog(modalEmprestimo));

  // ---------- Salvar empréstimo (com senha do USUÁRIO escolhido) ----------
  salvarEmprestimoBtn?.addEventListener("click", (e) => {
    e.preventDefault();

    const livroId = selectLivro?.value;
    const usuarioId = selectUsuario?.value;
    const dataEmprestimo = $("#dataEmprestimo")?.value;
    const dataDevolucao = $("#dataDevolucao")?.value;

    if (!livroId || !usuarioId || !dataEmprestimo || !dataDevolucao) return;

    const livro = livros.find(l => l.id === livroId);
    const usuario = usuarios.find(u => u.id === usuarioId);
    if (!livro || !usuario) return;

    // Solicita senha do usuário
    const senhaInformada = prompt(`Digite a senha de ${usuario.nome} para confirmar o empréstimo:`);
    if (senhaInformada == null) return; // cancelou

    // Considera que o campo salvo em usuários é "senha"
    if ((usuario.senha || "") !== senhaInformada) {
      alert("Senha incorreta.");
      return;
    }

    // prossegue com o empréstimo
    livro.status = "Emprestado";

    emprestimos.push({
      id: uid(),
      livroId,
      usuarioId,
      livro: livro.titulo,
      usuario: usuario.nome,
      dataEmprestimo,
      dataDevolucao,
      devolvido: false
    });

    closeDialog(modalEmprestimo);
    renderEmprestimos($("#buscaEmprestimos")?.value || "");
    // Atualiza listas de livros (fora desta aba, mas se existir função global, chame)
    if (typeof window.renderLivros === "function") window.renderLivros($("#buscaLivros")?.value || "");
    if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();
  });

  // ---------- Renderização da tabela de empréstimos ----------
  function renderEmprestimos(filter = "") {
    if (!tabelaEmprestimos) return;
    const f = (filter || "").toLowerCase();
    tabelaEmprestimos.innerHTML = "";

    emprestimos
      .filter(e => (e.livro + e.usuario).toLowerCase().includes(f))
      .forEach(e => {
        const tr = document.createElement("tr");

        const hoje = new Date();
        const prazo = new Date(e.dataDevolucao);
        const expirado = hoje > prazo && !e.devolvido;

        let indicador = "";
        if (e.devolvido) {
          indicador = '<span class="badge ok">📗 Livro devolvido</span>';
        } else if (expirado) {
          indicador = `<button class="btn-expirado" data-expirado="${e.id}">⚠️ Prazo de devolução expirado</button>`;
        }

        tr.innerHTML = `
          <td>${e.livro}</td>
          <td>${e.usuario}</td>
          <td>${e.dataEmprestimo}</td>
          <td>
            <div class="devolucao-wrap">
              <span class="devolucao-data">${e.dataDevolucao}</span>
              ${indicador}
            </div>
          </td>
          <td>
            <div class="actions">
              ${!e.devolvido ? `<button class="icon-btn" data-devolver="${e.id}" title="Devolver agora">📘</button>` : ""}
              ${e.devolvido ? `<button class="icon-btn" data-desfazer="${e.id}" title="Desfazer devolução">↩️</button>` : ""}
              <button class="icon-btn" data-del-emp="${e.id}" title="Excluir">🗑️</button>
            </div>
          </td>
        `;

        tabelaEmprestimos.appendChild(tr);
      });

    // Exclusão
    tabelaEmprestimos.querySelectorAll("[data-del-emp]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-emp");
        if (confirm("Excluir este empréstimo?")) {
          const emp = emprestimos.find(x => x.id === id);
          if (emp) {
            const l = livros.find(l => l.id === emp.livroId);
            if (l) l.status = "Disponível";
          }
          const ix = emprestimos.findIndex(x => x.id === id);
          if (ix >= 0) emprestimos.splice(ix, 1);

          renderEmprestimos($("#buscaEmprestimos")?.value || "");
          if (typeof window.renderLivros === "function") window.renderLivros($("#buscaLivros")?.value || "");
          if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();
        }
      });
    });

    // Devolver agora
    tabelaEmprestimos.querySelectorAll("[data-devolver]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-devolver");
        marcarComoDevolvido(id);
      });
    });

    // Desfazer devolução
    tabelaEmprestimos.querySelectorAll("[data-desfazer]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-desfazer");
        desfazerDevolucao(id);
      });
    });

    // Prazo expirado
    tabelaEmprestimos.querySelectorAll("[data-expirado]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-expirado");
        const emp = emprestimos.find(x => x.id === id);
        if (!emp) return;

        const foiDevolvido = confirm("O livro foi devolvido?");
        if (foiDevolvido) {
          marcarComoDevolvido(id);
        } else {
          const nova = prompt("Informe a nova data de devolução (aaaa-mm-dd):", emp.dataDevolucao);
          if (nova) {
            emp.dataDevolucao = nova;
            alert(`Entre em contato com ${emp.usuario} para combinar a nova devolução.`);
            renderEmprestimos($("#buscaEmprestimos")?.value || "");
          }
        }
      });
    });

    // contador (se existir no seu Resumo)
    const elCount = $("#emprestimosCount");
    if (elCount) {
      const ativos = emprestimos.filter(e => !e.devolvido).length;
      elCount.textContent = ativos;
    }
  }

  function marcarComoDevolvido(id) {
    const e = emprestimos.find(x => x.id === id);
    if (!e) return;

    e.devolvido = true;
    const l = livros.find(l => l.id === e.livroId);
    if (l) l.status = "Disponível";

    renderEmprestimos($("#buscaEmprestimos")?.value || "");
    if (typeof window.renderLivros === "function") window.renderLivros($("#buscaLivros")?.value || "");
    if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();
  }

  function desfazerDevolucao(id) {
    const e = emprestimos.find(x => x.id === id);
    if (!e) return;

    e.devolvido = false;
    const l = livros.find(l => l.id === e.livroId);
    if (l) l.status = "Emprestado";

    renderEmprestimos($("#buscaEmprestimos")?.value || "");
    if (typeof window.renderLivros === "function") window.renderLivros($("#buscaLivros")?.value || "");
    if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();
  }

  // ---------- Busca da lista de empréstimos ----------
  buscaEmprestimos?.addEventListener("input", (e) => {
    renderEmprestimos(e.target.value);
  });

  // ---------- UID simples (compatível com seu padrão) ----------
  function uid() {
    return Math.random().toString(36).slice(2);
  }

  // ---------- Inicialização ----------
  renderEmprestimos($("#buscaEmprestimos")?.value || "");

  // Exponho se você quiser chamar de outras abas
  window.renderEmprestimos = renderEmprestimos;
})();
