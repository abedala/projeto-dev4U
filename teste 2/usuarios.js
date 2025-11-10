(function () {
  // ===== Helpers / Estado =====
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => r.querySelectorAll(s);
  const uid = () => Math.random().toString(36).slice(2);

  // Tabelas/inputs do HTML existente
  const modalUsuario       = $("#modalUsuario");
  const formUsuario        = $("#formUsuario");
  const abrirUsuarioBtn    = $("#btnAbrirNovoUsuario");
  const fecharUsuarioModal = $("#fecharUsuarioModal");
  const salvarUsuarioBtn   = $("#salvarUsuarioBtn");
  const buscaUsuariosInp   = $("#buscaUsuarios");
  const tabelaUsuariosBody = $("#tabelaUsuarios tbody");

  // Estado global compatível com core.js (mas garante fallback)
  window.usuarios = Array.isArray(window.usuarios) ? window.usuarios : [];
  window.livros   = Array.isArray(window.livros)   ? window.livros   : [];
  window.emprestimos = Array.isArray(window.emprestimos) ? window.emprestimos : [];

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

  // ===== Injeção do campo de senha no modal (sem alterar teu HTML) =====
  function ensureSenhaField() {
    // se já existir, não cria de novo
    if ($("#usuarioSenha")) return;

    const grid = $("#modalUsuario .grid");
    if (!grid) return;

    // criamos <label> com input password + botão "olho" padrão
    const label = document.createElement("label");
    label.innerHTML = `
      Senha
      <div style="position:relative; display:flex; align-items:center;">
        <input id="usuarioSenha" type="password" required
               placeholder="Defina uma senha"
               title="Defina a senha do usuário" style="padding-right:42px;">
        <button type="button" id="toggleSenhaCriacao"
          aria-label="Mostrar/ocultar senha"
          title="Mostrar/ocultar senha"
          style="position:absolute; right:8px; background:transparent; border:0; cursor:pointer; padding:6px;">
          <!-- ícone 'olho' simples em SVG (padrão) -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
               xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Z" stroke="currentColor" stroke-width="1.6"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </button>
      </div>
    `;
    grid.appendChild(label);

    // comportamento do botão olho
    const inputSenha = $("#usuarioSenha");
    const toggleBtn  = $("#toggleSenhaCriacao");
    toggleBtn.addEventListener("click", () => {
      const isPass = inputSenha.type === "password";
      inputSenha.type = isPass ? "text" : "password";
    });
  }

  // ===== Ações do Modal =====
  abrirUsuarioBtn?.addEventListener("click", () => {
    $("#usuarioModalTitulo").textContent = "Novo Usuário";
    formUsuario?.reset();
    ensureSenhaField();
    openDialog(modalUsuario);
  });

  fecharUsuarioModal?.addEventListener("click", (e) => {
    e.preventDefault();
    closeDialog(modalUsuario);
  });

  salvarUsuarioBtn?.addEventListener("click", async (e) => {
    e.preventDefault();

    // Garante que o campo de senha exista (caso usuário tenha aberto de outra forma)
    ensureSenhaField();

    const nome      = $("#usuarioNome")?.value.trim();
    const matricula = $("#usuarioMatricula")?.value.trim();
    const tipo      = $("#usuarioTipo")?.value;
    const telefone  = $("#usuarioTelefone")?.value.trim();
    const email     = $("#usuarioEmail")?.value.trim();
    const senha     = $("#usuarioSenha")?.value || ""; // novo
    const fotoDataUrl = await fileToDataUrl($("#usuarioFoto")?.files?.[0]);

    // validações já existentes
    if (!/^\d{5}$/.test(matricula || "")) {
      alert("A matrícula deve conter exatamente 5 dígitos numéricos.");
      return;
    }
    if (!/^\d{11}$/.test(telefone || "")) {
      alert("O telefone deve conter exatamente 11 dígitos numéricos (ex: 11987654321).");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || "")) {
      alert("Por favor, digite um e-mail válido.");
      return;
    }
    if (!nome) {
      alert("Por favor, preencha o nome.");
      return;
    }
    if (!senha) {
      alert("Por favor, defina uma senha para o usuário.");
      return;
    }

    // cria usuário com senha
    window.usuarios.push({
      id: uid(),
      nome, matricula, tipo, telefone, email,
      fotoDataUrl,
      senha // <— guardado junto ao objeto
    });

    closeDialog(modalUsuario);
    renderUsuarios(buscaUsuariosInp?.value || "");
    // atualiza contadores se existir (aba Resumo)
    const count = $("#usuariosCount");
    if (count) count.textContent = String(window.usuarios.length);
  });

  // ===== Renderização da Tabela =====
  function renderUsuarios(filter = "") {
    if (!tabelaUsuariosBody) return;
    tabelaUsuariosBody.innerHTML = "";

    window.usuarios
      .filter(u => (u.nome + (u.email||"") + (u.telefone||"")).toLowerCase().includes(filter.toLowerCase()))
      .forEach(u => {
        const tr = document.createElement("tr");

        // célula de senha: mascarada + botão olho com mesmo ícone do campo de criação
        const senhaMask = "•".repeat(Math.max(8, (u.senha || "").length || 8));
        tr.innerHTML = `
          <td><img class="thumb" src="${u.fotoDataUrl || ""}" alt=""></td>
          <td>${u.nome}</td>
          <td>${u.matricula || "-"}</td>
          <td>${u.tipo}</td>
          <td>${u.telefone || "-"}</td>
          <td>${u.email || "-"}</td>
          <td>
            <div class="actions">
              <button class="icon-btn" title="Excluir" data-del-u="${u.id}">🗑️</button>
            </div>
          </td>
        `;

        // Inserimos a coluna de senha antes da coluna de ações (mantendo teu head fixo)
        const senhaTd = document.createElement("td");
        senhaTd.style.whiteSpace = "nowrap";
        senhaTd.innerHTML = `
          <span class="user-pass" data-visible="false" data-uid="${u.id}" data-plain="${u.senha || ""}">${senhaMask}</span>
          <button class="icon-btn toggle-pass" data-uid="${u.id}" aria-label="Mostrar/ocultar senha" title="Mostrar/ocultar senha" style="margin-left:6px">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M12 5C7 5 2.73 8.11 1 12c1.73 3.89 6 7 11 7s9.27-3.11 11-7c-1.73-3.89-6-7-11-7Z" stroke="currentColor" stroke-width="1.6"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.6"/>
            </svg>
          </button>
        `;
        // tabela: Foto, Nome, Matrícula, Tipo, Telefone, Email, Ações
        // a senha não estava no head; então colocamos antes do último TD (Ações)
        const acoesTd = tr.lastElementChild; // td de ações
        tr.insertBefore(senhaTd, acoesTd);

        tabelaUsuariosBody.appendChild(tr);
      });

    // Eventos: excluir
    tabelaUsuariosBody.querySelectorAll("[data-del-u]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del-u");
        if (confirm("Excluir este usuário?")) {
          window.usuarios = window.usuarios.filter(x => x.id !== id);
          renderUsuarios($("#buscaUsuarios")?.value || "");
          const count = $("#usuariosCount");
          if (count) count.textContent = String(window.usuarios.length);
        }
      });
    });

    // Eventos: toggle senha (somente a senha, não altera visibilidade de outros dados)
    tabelaUsuariosBody.querySelectorAll(".toggle-pass").forEach(btn => {
      btn.addEventListener("click", () => {
        const uid = btn.getAttribute("data-uid");
        const span = tabelaUsuariosBody.querySelector(`.user-pass[data-uid="${uid}"]`);
        if (!span) return;
        const visible = span.getAttribute("data-visible") === "true";
        if (visible) {
          // mascara novamente
          const plain = span.getAttribute("data-plain") || "";
          span.textContent = "•".repeat(Math.max(8, plain.length || 8));
          span.setAttribute("data-visible", "false");
        } else {
          // mostra texto plano
          span.textContent = span.getAttribute("data-plain") || "";
          span.setAttribute("data-visible", "true");
        }
      });
    });
  }

  // Busca dinâmica
  buscaUsuariosInp?.addEventListener("input", e => renderUsuarios(e.target.value || ""));

  // Inicializa
  renderUsuarios();
})();
