// ======== Funções utilitárias ========
const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);
const uid = () => Math.random().toString(36).slice(2);

// ======== Navegação entre abas e logout ========
const sections = $$("main section");
const menuItems = $$(".sidebar li");

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    if (item.id === "logout") {
      window.location.href = "index.html";
      return;
    }
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    sections.forEach(sec => sec.classList.remove("active-section"));
    document.getElementById(item.dataset.section).classList.add("active-section");
  });
});

// ======== Estruturas de dados em memória ========
let livros = [];     // {id,titulo,autor,genero,ano,capaDataUrl,status}
let usuarios = [];   // {id,nome,matricula,tipo,telefone,email,fotoDataUrl}
let emprestimos = []; // {id,livroId,livro,usuarioId,usuario,dataEmprestimo,dataDevolucao,devolvido}

// ======== Atualiza dashboard ========
function atualizarDashboard() {
  $("#livrosCount").textContent = livros.length;
  $("#usuariosCount").textContent = usuarios.length;

  // conta apenas empréstimos que ainda estão ativos (não devolvidos)
  const emprestimosAtivos = emprestimos.filter(e => !e.devolvido).length;
  $("#emprestimosCount").textContent = emprestimosAtivos;
}


// ======== Converter imagem para base64 ========
function fileToDataUrl(file) {
  return new Promise(resolve => {
    if (!file) return resolve("");
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.readAsDataURL(file);
  });
}

// ============================================================
// ========== GERENCIAR LIVROS (ATUALIZADO) ==================
// ============================================================
const modalLivro   = $("#modalLivro");
const formLivro    = $("#formLivro");
const abrirLivroBt = $("#btnAbrirNovoLivro");
const salvarLivroBt= $("#salvarLivroBtn");
const cancelarLivro= $("#cancelarLivro");

// fallback de modais para browsers sem <dialog>
function openDialog(el){ if(el?.showModal) el.showModal(); else el.setAttribute("open","open"); }
function closeDialog(el){ if(el?.close) el.close(); else el.removeAttribute("open"); }

abrirLivroBt?.addEventListener("click", () => {
  $("#livroModalTitulo").textContent = "Novo Livro";
  formLivro.reset();
  openDialog(modalLivro);
});

cancelarLivro?.addEventListener("click", () => closeDialog(modalLivro));

// salvar livro (status automático)
salvarLivroBt?.addEventListener("click", async e => {
  e.preventDefault();
  const titulo  = $("#livroTitulo").value.trim();
  const autor   = $("#livroAutor").value.trim();
  const genero  = $("#livroGenero").value.trim();
  const ano     = $("#livroAno").value;
  const file    = $("#livroCapa").files[0];

  if (!titulo || !autor) return;

  const capaDataUrl = await fileToDataUrl(file);

  livros.push({
    id: uid(),
    titulo, autor, genero, ano,
    status: "Disponível",
    capaDataUrl
  });

  closeDialog(modalLivro);
  renderLivros();
  atualizarDashboard();
  

});

// renderizar tabela de livros
function renderLivros(filter = "") {
  const tbody = $("#tabelaLivros tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  livros
    .filter(l => (l.titulo + l.autor + l.genero).toLowerCase().includes(filter.toLowerCase()))
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
        </td>`;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del");
      if (confirm("Excluir este livro?")) {
        livros = livros.filter(x => x.id !== id);
        renderLivros($("#buscaLivros").value);
        atualizarDashboard();
        

      }
    });
  });
}

$("#buscaLivros")?.addEventListener("input", e => renderLivros(e.target.value));

// ============================================================
// ========== GERENCIAR USUÁRIOS ==============================
// ============================================================
const modalUsuario = $("#modalUsuario");
const formUsuario  = $("#formUsuario");
const cancelarUsuario = $("#fecharUsuarioModal");

// abrir modal
$("#btnAbrirNovoUsuario").addEventListener("click", () => {
  $("#usuarioModalTitulo").textContent = "Novo Usuário";
  formUsuario.reset();
  openDialog(modalUsuario);
});

// cancelar — fecha sempre, independente de validação
cancelarUsuario?.addEventListener("click", (e) => {
  e.preventDefault();
  if (modalUsuario?.close) modalUsuario.close();
  else modalUsuario?.removeAttribute("open");
});


$("#salvarUsuarioBtn")?.addEventListener("click", async e => {
  e.preventDefault();

  const nome = $("#usuarioNome").value.trim();
  const matricula = $("#usuarioMatricula").value.trim();
  const tipo = $("#usuarioTipo").value;
  const telefone = $("#usuarioTelefone").value.trim();
  const email = $("#usuarioEmail").value.trim();
  const fotoDataUrl = await fileToDataUrl($("#usuarioFoto").files[0]);

  // validações adicionais
  if (!/^\d{5}$/.test(matricula)) {
    alert("A matrícula deve conter exatamente 5 dígitos numéricos.");
    return;
  }

  if (!/^\d{11}$/.test(telefone)) {
    alert("O telefone deve conter exatamente 11 dígitos numéricos (ex: 11987654321).");
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert("Por favor, digite um e-mail válido.");
    return;
  }

  if (!nome) {
    alert("Por favor, preencha o nome.");
    return;
  }

  usuarios.push({ id: uid(), nome, matricula, tipo, telefone, email, fotoDataUrl });
  closeDialog(modalUsuario);
  renderUsuarios();
  atualizarDashboard();
  

});

function renderUsuarios(filter = "") {
  const tbody = $("#tabelaUsuarios tbody");
  tbody.innerHTML = "";
  usuarios
    .filter(u => (u.nome + u.email + u.telefone).toLowerCase().includes(filter.toLowerCase()))
    .forEach(u => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><img class="thumb" src="${u.fotoDataUrl || ""}" alt=""></td>
        <td>${u.nome}</td>
        <td>${u.matricula || "-"}</td>
        <td>${u.tipo}</td>
        <td>${u.telefone || "-"}</td>
        <td>${u.email || "-"}</td>
        <td><div class="actions"><button class="icon-btn" data-del-u="${u.id}">🗑️</button></div></td>`;
      tbody.appendChild(tr);
    });

  tbody.querySelectorAll("[data-del-u]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del-u");
      if (confirm("Excluir este usuário?")) {
        usuarios = usuarios.filter(x => x.id !== id);
        renderUsuarios($("#buscaUsuarios").value);
        atualizarDashboard();
       

      }
    });
  });
}
$("#buscaUsuarios")?.addEventListener("input", e => renderUsuarios(e.target.value));

// ============================================================
// ========== EMPRÉSTIMOS E DEVOLUÇÕES (INTELIGENTE) ==========
// ============================================================
const modalEmprestimo = $("#modalEmprestimo");
const formEmprestimo = $("#formEmprestimo");
let editandoEmprestimoId = null;

// abrir modal
$("#btnAbrirEmprestimo").addEventListener("click", () => {
  editandoEmprestimoId = null;
  formEmprestimo.reset();
  preencherSelectsEmprestimo();
  openDialog(modalEmprestimo);
});
$("#cancelarEmprestimo")?.addEventListener("click", () => closeDialog(modalEmprestimo));

function preencherSelectsEmprestimo() {
  const livroSelect = $("#emprestimoLivro");
  const usuarioSelect = $("#emprestimoUsuario");

  livroSelect.innerHTML = livros.length
    ? livros.filter(l => l.status !== "Emprestado")
        .map(l => `<option value="${l.id}">${l.titulo}</option>`).join("")
    : '<option disabled>Nenhum livro disponível</option>';

  usuarioSelect.innerHTML = usuarios.length
    ? usuarios.map(u => `<option value="${u.id}">${u.nome}</option>`).join("")
    : '<option disabled>Nenhum usuário cadastrado</option>';
}

// salvar empréstimo
$("#salvarEmprestimoBtn").addEventListener("click", (e) => {
  e.preventDefault();
  const livroId = $("#emprestimoLivro").value;
  const usuarioId = $("#emprestimoUsuario").value;
  const dataEmprestimo = $("#dataEmprestimo").value;
  const dataDevolucao = $("#dataDevolucao").value;

  if (!livroId || !usuarioId || !dataEmprestimo || !dataDevolucao) return;

  const livro = livros.find(l => l.id === livroId);
  const usuario = usuarios.find(u => u.id === usuarioId);
  if (!livro || !usuario) return;

  livro.status = "Emprestado";
  const novo = {
    id: uid(),
    livroId, usuarioId,
    livro: livro.titulo,
    usuario: usuario.nome,
    dataEmprestimo,
    dataDevolucao,
    devolvido: false
  };
  emprestimos.push(novo);
  closeDialog(modalEmprestimo);
  renderEmprestimos();
  renderLivros();
  atualizarDashboard();
  
});

function renderEmprestimos(filter = "") {
  const tbody = $("#tabelaEmprestimos tbody");
  tbody.innerHTML = "";

  emprestimos
    .filter(e => (e.livro + e.usuario).toLowerCase().includes(filter.toLowerCase()))
    .forEach(e => {
      const tr = document.createElement("tr");

      const hoje = new Date();
      const prazo = new Date(e.dataDevolucao);
      const expirado = hoje > prazo && !e.devolvido;

      // conteúdo da célula de devolução: data SEMPRE + indicador ao lado
      let indicador = "";
      if (e.devolvido) {
        indicador = '<span class="badge ok">📗 Livro devolvido</span>';
      } else if (expirado) {
        indicador = `<button class="btn-expirado" data-expirado="${e.id}">⚠️ Prazo de devolução expirado</button>`;
      } // se ainda no prazo e não devolvido, sem indicador extra

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
            <button class="icon-btn" data-del-emp="${e.id}" title="Excluir">🗑️</button>
          </div>
        </td>
      `;
      tbody.appendChild(tr);
    });

  // Excluir empréstimo
  tbody.querySelectorAll("[data-del-emp]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-del-emp");
      if (confirm("Excluir este empréstimo?")) {
        const emp = emprestimos.find(x => x.id === id);
        if (emp) {
          const l = livros.find(l => l.id === emp.livroId);
          if (l) l.status = "Disponível";
        }
        emprestimos = emprestimos.filter(x => x.id !== id);
        renderEmprestimos($("#buscaEmprestimos").value);
        renderLivros();
        atualizarDashboard();
        
      }
    });
  });

  // Devolver agora (antes do prazo)
  tbody.querySelectorAll("[data-devolver]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-devolver");
      marcarLivroComoDevolvido(id);
    });
  });

  // Prazo expirado → pergunta / reagenda ou marca como devolvido
  tbody.querySelectorAll("[data-expirado]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-expirado");
      const emp = emprestimos.find(x => x.id === id);
      if (!emp) return;

      const foiDevolvido = confirm("O livro foi devolvido?");
      if (foiDevolvido) {
        marcarLivroComoDevolvido(id); // vira '📗 Livro devolvido'
      } else {
        const nova = prompt("Informe a nova data de devolução (aaaa-mm-dd):", emp.dataDevolucao);
        if (nova) {
          emp.dataDevolucao = nova;
          alert(`Entre em contato com ${emp.usuario} para combinar a nova devolução.`);
          renderEmprestimos($("#buscaEmprestimos").value);
        }
      }
    });
  });

  $("#emprestimosCount").textContent = emprestimos.length;
}


// marcar como devolvido
function marcarLivroComoDevolvido(id){
  const e=emprestimos.find(x=>x.id===id);
  if(!e) return;
  e.devolvido=true;
  const l=livros.find(l=>l.id===e.livroId);
  if(l) l.status="Disponível";
  renderEmprestimos();
  renderLivros();
  atualizarDashboard();
  

}

$("#buscaEmprestimos")?.addEventListener("input", e => renderEmprestimos(e.target.value));

// ============================================================
// ========== Inicialização ===================================
// ============================================================
renderLivros();
renderUsuarios();
renderEmprestimos();
atualizarDashboard();


// =================== CARDS CLICÁVEIS NO resumo ===================
const cardLivros = $("#cardLivros");
const cardUsuarios = $("#cardUsuarios");
const cardEmprestimos = $("#cardEmprestimos");
const areaDetalhes = $("#areaDetalhes");

// alterna o conteúdo abaixo dos cards
function mostrarTabela(tipo) {
  areaDetalhes.innerHTML = ""; // limpa antes
  let html = "";

  if (tipo === "livros") {
    html = `
      <h3>📚 Livros Cadastrados</h3>
      <table class="data-table">
        <thead>
          <tr><th>Título</th><th>Autor</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${
            livros.length
              ? livros.map(l => `
                  <tr>
                    <td>${l.titulo}</td>
                    <td>${l.autor}</td>
                    <td>${l.status}</td>
                  </tr>`).join("")
              : "<tr><td colspan='3'>Nenhum livro cadastrado</td></tr>"
          }
        </tbody>
      </table>
    `;
  }

  if (tipo === "usuarios") {
    html = `
      <h3>👤 Usuários Cadastrados</h3>
      <table class="data-table">
        <thead>
          <tr><th>Nome</th><th>Email</th><th>Telefone</th></tr>
        </thead>
        <tbody>
          ${
            usuarios.length
              ? usuarios.map(u => `
                  <tr>
                    <td>${u.nome}</td>
                    <td>${u.email || "-"}</td>
                    <td>${u.telefone || "-"}</td>
                  </tr>`).join("")
              : "<tr><td colspan='3'>Nenhum usuário cadastrado</td></tr>"
          }
        </tbody>
      </table>
    `;
  }

  if (tipo === "emprestimos") {
    const ativos = emprestimos.filter(e => !e.devolvido);
    html = `
      <h3>📘 Empréstimos Ativos</h3>
      <table class="data-table">
        <thead>
          <tr><th>Livro</th><th>Usuário</th><th>Data de Devolução</th></tr>
        </thead>
        <tbody>
          ${
            ativos.length
              ? ativos.map(e => `
                  <tr>
                    <td>${e.livro}</td>
                    <td>${e.usuario}</td>
                    <td>${e.dataDevolucao}</td>
                  </tr>`).join("")
              : "<tr><td colspan='3'>Nenhum empréstimo ativo</td></tr>"
          }
        </tbody>
      </table>
    `;
  }

  // insere no painel
  areaDetalhes.innerHTML = html;
}

// eventos de clique
cardLivros?.addEventListener("click", () => mostrarTabela("livros"));
cardUsuarios?.addEventListener("click", () => mostrarTabela("usuarios"));
cardEmprestimos?.addEventListener("click", () => mostrarTabela("emprestimos"));


function atualizarRelatorios() {
  atualizarEmprestimosMes();
}

// ===== Emprestimos do mês =====
function atualizarEmprestimosMes() {
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const lista = (window.emprestimos || []).filter(e => {
    const data = parseDate(e.dataEmprestimo);
    return data && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });

  document.querySelector("#emprestimosMesCount").textContent = lista.length;

  const corpo = document.querySelector("#tabelaEmprestimosMes");
  corpo.innerHTML =
    lista.length
      ? lista.map(e => {
          const usuario = window.usuarios.find(u => u.nome === e.usuario);
          const livro = window.livros.find(l => l.titulo === e.livro);

          const foto = usuario?.fotoDataUrl
            ? `<img src="${usuario.fotoDataUrl}" class="foto-usuario" alt="foto do usuário">`
            : "👤";

          const capa = livro?.capaDataUrl
            ? `<img src="${livro.capaDataUrl}" class="capa-livro" alt="capa do livro">`
            : "📕";

          return `
            <tr>
              <td>
                <div class="usuario-info">
                  ${foto}
                  <div>
                    <strong>${usuario?.nome || e.usuario}</strong><br>
                    <small>${usuario?.matricula || "-"}</small>
                  </div>
                </div>
              </td>
              <td>${usuario?.matricula || "-"}</td>
              <td>
                <div class="livro-info">
                  ${capa}
                  <span>${livro?.titulo || e.livro}</span>
                </div>
              </td>
              <td>${e.dataEmprestimo}</td>
              <td>${e.dataDevolucao}</td>
            </tr>`;
        }).join("")
      : `<tr><td colspan="5">Nenhum empréstimo neste mês</td></tr>`;
}

// ===== Parser de datas =====
function parseDate(str) {
  if (!str) return null;
  const m = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return new Date(m[3], m[2] - 1, m[1]);
  return new Date(str);
}

// ===== Mostrar / ocultar tabela =====
document.querySelector("#btnEmprestimosMes").addEventListener("click", () => {
  const tabela = document.querySelector("#tabelaEmprestimosContainer");
  tabela.classList.toggle("tabela-visivel");
  tabela.classList.toggle("tabela-oculta");

  // Atualiza apenas quando abrir
  if (tabela.classList.contains("tabela-visivel")) {
    atualizarEmprestimosMes();
  }
});

