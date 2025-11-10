// ===================== RESUMO =====================
let resumoViewAtual = null; // controla o "toggle" de abrir/fechar área

const cardLivros      = $("#cardLivros");
const cardUsuarios    = $("#cardUsuarios");
const cardEmprestimos = $("#cardEmprestimos");
const areaDetalhes    = $("#areaDetalhes");

function tabelaLivrosHTML(){
  return `
    <h3>📚 Livros Cadastrados</h3>
    <table class="data-table">
      <thead><tr><th>Título</th><th>Autor</th><th>Status</th></tr></thead>
      <tbody>
        ${
          window.livros.length
            ? window.livros.map(l => `
                <tr>
                  <td>${l.titulo}</td>
                  <td>${l.autor}</td>
                  <td>${l.status}</td>
                </tr>`).join("")
            : "<tr><td colspan='3'>Nenhum livro cadastrado</td></tr>"
        }
      </tbody>
    </table>`;
}

function tabelaUsuariosHTML(){
  return `
    <h3>👤 Usuários Cadastrados</h3>
    <table class="data-table">
      <thead><tr><th>Nome</th><th>Email</th><th>Telefone</th></tr></thead>
      <tbody>
        ${
          window.usuarios.length
            ? window.usuarios.map(u => `
                <tr>
                  <td>${u.nome}</td>
                  <td>${u.email || "-"}</td>
                  <td>${u.telefone || "-"}</td>
                </tr>`).join("")
            : "<tr><td colspan='3'>Nenhum usuário cadastrado</td></tr>"
        }
      </tbody>
    </table>`;
}

function tabelaEmprestimosHTML(){
  const ativos = window.emprestimos.filter(e => !e.devolvido);
  return `
    <h3>📘 Empréstimos Ativos</h3>
    <table class="data-table">
      <thead><tr><th>Livro</th><th>Usuário</th><th>Data de Devolução</th></tr></thead>
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
    </table>`;
}

// Toggle da área de detalhes do resumo
function mostrarTabelaResumo(tipo){
  if (resumoViewAtual === tipo) {
    // clica de novo no mesmo card -> fechar
    areaDetalhes.innerHTML = "";
    resumoViewAtual = null;
    return;
  }

  let html = "";
  if (tipo === "livros")      html = tabelaLivrosHTML();
  if (tipo === "usuarios")    html = tabelaUsuariosHTML();
  if (tipo === "emprestimos") html = tabelaEmprestimosHTML();

  areaDetalhes.innerHTML = html;
  resumoViewAtual = tipo;
}

// Eventos dos cards
cardLivros?.addEventListener("click",      () => mostrarTabelaResumo("livros"));
cardUsuarios?.addEventListener("click",    () => mostrarTabelaResumo("usuarios"));
cardEmprestimos?.addEventListener("click", () => mostrarTabelaResumo("emprestimos"));

// ===== Relatórios (mantidos aqui para quando quiser reexibir) =====
function atualizarEmprestimosMes(){
  const hoje = new Date();
  const mesAtual = hoje.getMonth();
  const anoAtual = hoje.getFullYear();

  const lista = (window.emprestimos || []).filter(e => {
    const data = window.parseDate(e.dataEmprestimo);
    return data && data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
  });

  const elCount = document.querySelector("#emprestimosMesCount");
  if (elCount) elCount.textContent = lista.length;

  const corpo = document.querySelector("#tabelaEmprestimosMes");
  if (!corpo) return;

  corpo.innerHTML =
    lista.length
      ? lista.map(e => {
          const usuario = window.usuarios.find(u => u.nome === e.usuario);
          const livro   = window.livros.find(l => l.titulo === e.livro);

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

// Botão (se existir) para abrir/fechar uma tabela de relatório
document.querySelector("#btnEmprestimosMes")?.addEventListener("click", () => {
  const tabela = document.querySelector("#tabelaEmprestimosContainer");
  if (!tabela) return;
  tabela.classList.toggle("tabela-visivel");
  tabela.classList.toggle("tabela-oculta");
  if (tabela.classList.contains("tabela-visivel")) atualizarEmprestimosMes();
});

// ===== Inicialização geral =====
document.addEventListener("DOMContentLoaded", () => {
  // render básico inicial
  if (typeof renderLivros === "function") renderLivros();
  if (typeof renderUsuarios === "function") renderUsuarios();
  if (typeof renderEmprestimos === "function") renderEmprestimos();
  if (typeof window.atualizarDashboard === "function") window.atualizarDashboard();
});
