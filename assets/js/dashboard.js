const DASH_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://projeto-back-end-n8lm.onrender.com";

const dashEmail  = localStorage.getItem("usuarioEmail");
const dashPerfil = localStorage.getItem("perfil");

if (!dashEmail) window.location.href = "entrar.html";

function getSenha() {
  return document.getElementById("senhaDash").value;
}

function dashMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#4ade80" : "#f87171";
}

async function carregarProjetosDash() {
  const lista = document.getElementById("lista-projetos");
  try {
    const res      = await fetch(`${DASH_URL}/projetos`);
    const projetos = await res.json();

    if (!Array.isArray(projetos) || projetos.length === 0) {
      lista.innerHTML = `<p style="color:#6b7280;">Nenhum projeto cadastrado ainda.</p>`;
      return;
    }

    lista.innerHTML = projetos.map(p => `
      <div class="dash-project-card">
        <div class="dash-project-info">
          <h4>${p.titulo}</h4>
          <p>${p.descricao}</p>
        </div>
        ${dashPerfil === "Master" ? `<button class="dash-delete-btn" onclick="deletarProjeto(${p.id})">🗑️ Remover</button>` : ""}
      </div>
    `).join("");
  } catch {
    lista.innerHTML = `<p style="color:#f87171;">Erro ao carregar projetos.</p>`;
  }
}

async function deletarProjeto(id) {
  const senha = getSenha();
  if (!senha) return alert("Digite sua senha na área acima antes de remover.");

  if (!confirm("Deseja remover este projeto?")) return;

  const res  = await fetch(`${DASH_URL}/projetos/${id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: dashEmail, senha }),
  });
  const data = await res.json();
  dashMsg("msg-lista", data.mensagem, res.ok);
  if (res.ok) carregarProjetosDash();
}

document.addEventListener("DOMContentLoaded", () => {
  // Mostra área de gerenciamento apenas para Master
  if (dashPerfil === "Master") {
    const masterArea = document.getElementById("master-only");
    if (masterArea) masterArea.style.display = "block";
  }

  carregarProjetosDash();

  const formAdd = document.getElementById("form-add-projeto");
  if (formAdd) {
    formAdd.addEventListener("submit", async e => {
      e.preventDefault();
      const senha      = getSenha();
      const titulo     = document.getElementById("proj-titulo").value.trim();
      const descricao  = document.getElementById("proj-descricao").value.trim();
      const imagem_url = document.getElementById("proj-imagem").value.trim() || "sustentaTHUMB.png";

      if (!senha) return dashMsg("msg-add", "Digite sua senha na área acima.", false);

      const res  = await fetch(`${DASH_URL}/projetos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: dashEmail, senha, titulo, descricao, imagem_url }),
      });
      const data = await res.json();
      dashMsg("msg-add", data.mensagem, res.ok);
      if (res.ok) { formAdd.reset(); carregarProjetosDash(); }
    });
  }
});
