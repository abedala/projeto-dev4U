document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const key = document.getElementById("accessKey").value.trim();

  if (key === "biblioteca123") {
    window.location.href = "dashboard.html";
  } else {
    document.getElementById("message").textContent = "Chave incorreta.";
  }
});
