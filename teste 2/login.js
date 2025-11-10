document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const key = document.getElementById("accessKey").value.trim();

  const adminKey = "biblioteca123";
  const limitadoKey = "livros123";

  if (key === adminKey) {
    localStorage.setItem("acessoBiblioteca", "admin");
    window.location.href = "resumo.html";
  }
  else if (key === limitadoKey) {
    localStorage.setItem("acessoBiblioteca", "limitado");
    window.location.href = "resumo.html";
  }
  else {
    document.getElementById("message").textContent = "Chave incorreta.";
  }
});
