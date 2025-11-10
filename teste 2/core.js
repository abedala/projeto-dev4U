// ============================================================
// CORE.JS — Navegação + Permissões de Acesso
// ============================================================
// ==== Globais e helpers visíveis em todas as abas ====
window.$   = (sel) => document.querySelector(sel);
window.$$  = (sel) => document.querySelectorAll(sel);
window.uid = () => Math.random().toString(36).slice(2);

// Estados compartilhados
window.livros      = window.livros      || [];
window.usuarios    = window.usuarios    || [];
window.emprestimos = window.emprestimos || [];

const $  = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// Todas as sections e itens do menu
const sections = $$("main section");
const menuItems = $$(".sidebar li");

// Recupera o tipo de acesso salvo no login
const tipoAcesso = localStorage.getItem("acessoBiblioteca");

// ============================================================
// 1) PERMISSÕES DE ACESSO
// ============================================================
// Se for limitado, esconder abas proibidas
if (tipoAcesso === "limitado") {

  // Oculta no menu
  document.querySelector('li[data-section="usuarios"]').style.display = "none";
  document.querySelector('li[data-section="emprestimos"]').style.display = "none";

  // Oculta conteúdo
  const usuariosSection = document.querySelector("#usuarios");
  const emprestimosSection = document.querySelector("#emprestimos");

  if (usuariosSection) usuariosSection.style.display = "none";
  if (emprestimosSection) emprestimosSection.style.display = "none";
}

// ============================================================
// 2) NAVEGAÇÃO ENTRE AS ABAS
// ============================================================

menuItems.forEach(item => {
  item.addEventListener("click", () => {
    
    // Logout
    if (item.id === "logout") {
      localStorage.removeItem("acessoBiblioteca");
      window.location.href = "index.html";
      return;
    }

    // Usuário com acesso limitado NÃO consegue abrir
    if (tipoAcesso === "limitado") {
      if (
        item.dataset.section === "usuarios" ||
        item.dataset.section === "emprestimos"
      ) {
        return; // Bloqueia completamente
      }
    }

    // Alterna abas normalmente
    menuItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");

    sections.forEach(sec => sec.classList.remove("active-section"));

    const alvo = document.getElementById(item.dataset.section);
    if (alvo) alvo.classList.add("active-section");
  });
});

// ============================================================
// 3) FECHAR ABAS DA ÁREA DE RESUMO AO CLICAR DE NOVO
// (recurso pedido para o resumo.js)
// ============================================================

window.toggleAreaDetalhes = function () {
  const area = $("#areaDetalhes");

  if (!area) return;

  if (area.classList.contains("ativo")) {
    area.innerHTML = "";
    area.classList.remove("ativo");
  } else {
    area.classList.add("ativo");
  }
};

// ============================================================
// 4) INICIALIZAÇÃO PADRÃO
// ============================================================

// Força o resumo a ser exibido ao entrar (segurança extra)
if (tipoAcesso === "limitado") {
  // Marca menu
  document.querySelector('li[data-section="resumo"]').classList.add("active");

  // Esconde tudo e só mostra resumo
  sections.forEach(sec => sec.classList.remove("active-section"));
  document.querySelector("#resumo").classList.add("active-section");
} else {
  // Acesso pleno segue normal
  if ($("#resumo")) $("#resumo").classList.add("active-section");
}
