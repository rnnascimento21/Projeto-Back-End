const CFG_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
  ? "http://localhost:3000"
  : "https://projeto-back-end-n8lm.onrender.com";

const userEmail = localStorage.getItem("usuarioEmail");
if (!userEmail) window.location.href = "entrar.html";

// --- Troca de abas ---
document.querySelectorAll(".config-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".config-tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".config-section").forEach(s => s.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// --- Toggle visibilidade ---
document.querySelectorAll(".toggle-vis").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (!input) return;
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    btn.textContent = hidden ? "🙈" : "👁";
  });
});

// --- Limpar campo ---
document.querySelectorAll(".clear-field").forEach(btn => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    if (input) { input.value = ""; input.focus(); }
  });
});

// --- Validação de senha ---
const RULES = {
  upper:   { re: /[A-Z]/,        text: "Possuir letra maiúscula" },
  lower:   { re: /[a-z]/,        text: "Possuir letra minúscula" },
  min:     { fn: v => v.length >= 8,  text: "Possuir no mínimo 8 caracteres" },
  max:     { fn: v => v.length <= 32, text: "Possuir no máximo 32 caracteres" },
  num:     { re: /[0-9]/,        text: "Possuir pelo menos um número" },
  special: { re: /[@$!.*&+\-]/,  text: "Possuir um caractere especial (Ex: @ $ ! . * & + -)" },
};

function checkRules(value) {
  Object.entries(RULES).forEach(([key, rule]) => {
    const ok = rule.re ? rule.re.test(value) : rule.fn(value);
    document.getElementById(`rule-${key}`).textContent = (ok ? "✅" : "❌") + " " + rule.text;
  });
}

function isPasswordValid(value) {
  return Object.values(RULES).every(r => r.re ? r.re.test(value) : r.fn(value));
}

document.getElementById("novaSenha").addEventListener("input", e => checkRules(e.target.value));
checkRules("");

// --- Mensagem de feedback ---
function showMsg(id, text, ok) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = ok ? "#1e8449" : "#d32f2f";
}

// --- Trocar Senha ---
document.getElementById("form-senha").addEventListener("submit", async e => {
  e.preventDefault();
  const senhaAtual = document.getElementById("senhaAtual").value;
  const novaSenha  = document.getElementById("novaSenha").value;
  const confirmar  = document.getElementById("confirmarSenha").value;

  if (!isPasswordValid(novaSenha))
    return showMsg("msg-senha", "A nova senha não atende aos requisitos.", false);
  if (novaSenha !== confirmar)
    return showMsg("msg-senha", "As senhas não coincidem.", false);

  try {
    const res  = await fetch(`${CFG_URL}/alterar-senha`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, senhaAtual, novaSenha }),
    });
    const data = await res.json();
    showMsg("msg-senha", data.mensagem, res.ok);
    if (res.ok) { e.target.reset(); checkRules(""); }
  } catch {
    showMsg("msg-senha", "Erro ao conectar com o servidor.", false);
  }
});

// --- Alterar Nome ---
document.getElementById("form-nome").addEventListener("submit", async e => {
  e.preventDefault();
  const novoNome = document.getElementById("novoNome").value.trim();
  const senha    = document.getElementById("senhaNome").value;

  if (!novoNome) return showMsg("msg-nome", "Informe o novo nome.", false);
  if (!senha)    return showMsg("msg-nome", "Informe sua senha.", false);

  try {
    const res  = await fetch(`${CFG_URL}/alterar-nome`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userEmail, senha, novoNome }),
    });
    const data = await res.json();
    showMsg("msg-nome", data.mensagem, res.ok);
    if (res.ok) {
      localStorage.setItem("usuarioNome", novoNome);
      e.target.reset();
    }
  } catch {
    showMsg("msg-nome", "Erro ao conectar com o servidor.", false);
  }
});
