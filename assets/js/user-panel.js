// Painel de Usuário
document.addEventListener("DOMContentLoaded", function () {
  const userPanel = document.getElementById("userPanel");
  if (!userPanel) return;

  const userButton = document.getElementById("userButton");
  const userDropdown = document.getElementById("userDropdown");
  const userName = document.getElementById("userName");
  const loginButton = document.querySelector(".login-button");
  const logoutBtn = document.getElementById("logoutBtn");
  const changePasswordBtn = document.getElementById("changePasswordBtn");
  const changeEmailBtn = document.getElementById("changeEmailBtn");

  // Verificar se usuário está logado
  const usuarioLogado =
    localStorage.getItem("nomeUsuario") || localStorage.getItem("usuarioNome");

  if (usuarioLogado) {
    if (loginButton) loginButton.style.display = "none";
    userPanel.style.display = "block";
    if (userName) userName.textContent = usuarioLogado;

    // Toggle dropdown do usuário
    if (userButton && userDropdown) {
      userButton.addEventListener("click", function (e) {
        e.preventDefault();
        userDropdown.classList.toggle("show");
      });
    }

    // Fechar dropdown ao clicar fora
    document.addEventListener("click", function (e) {
      if (userPanel && userDropdown && !userPanel.contains(e.target)) {
        userDropdown.classList.remove("show");
      }
    });

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", function (e) {
        e.preventDefault();
        localStorage.removeItem("nomeUsuario");
        localStorage.removeItem("usuarioNome");
        localStorage.removeItem("emailUsuario");
        localStorage.removeItem("usuarioEmail");
        location.href = "index.html";
      });
    }

    // Alterar Senha
    if (changePasswordBtn) {
      changePasswordBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (userDropdown) userDropdown.classList.remove("show");
        mostrarModalAlterarSenha();
      });
    }

    // Alterar E-mail
    if (changeEmailBtn) {
      changeEmailBtn.addEventListener("click", function (e) {
        e.preventDefault();
        if (userDropdown) userDropdown.classList.remove("show");
        mostrarModalAlterarEmail();
      });
    }
  } else {
    if (loginButton) loginButton.style.display = "block";
    userPanel.style.display = "none";
  }
});

// Função para mostrar modal de alterar senha
function mostrarModalAlterarSenha() {
  // Criar modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Alterar Senha</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="changePasswordForm">
          <div class="form-group">
            <label for="currentPassword">Senha Atual</label>
            <input type="password" id="currentPassword" required placeholder="Digite sua senha atual">
          </div>
          <div class="form-group">
            <label for="newPassword">Nova Senha</label>
            <input type="password" id="newPassword" required placeholder="Digite sua nova senha">
          </div>
          <div class="form-group">
            <label for="confirmPassword">Confirmar Nova Senha</label>
            <input type="password" id="confirmPassword" required placeholder="Confirme sua nova senha">
          </div>
          <button type="submit" class="btn-primary">Alterar Senha</button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Funcionalidades do modal
  const closeBtn = modal.querySelector(".modal-close");
  const form = modal.querySelector("#changePasswordForm");

  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById("currentPassword").value;
    const newPassword = document.getElementById("newPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;

    if (newPassword !== confirmPassword) {
      alert("As senhas não coincidem!");
      return;
    }

    if (newPassword.length < 6) {
      alert("A nova senha deve ter pelo menos 6 caracteres!");
      return;
    }

    try {
      const response = await fetch(
        "https://projeto-back-end-n8lm.onrender.com/alterar-senha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email:
              localStorage.getItem("emailUsuario") ||
              localStorage.getItem("usuarioEmail") ||
              "",
            senhaAtual: currentPassword,
            novaSenha: newPassword,
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("Senha alterada com sucesso!");
        document.body.removeChild(modal);
      } else {
        alert(data.mensagem || "Erro ao alterar senha");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar com o servidor");
    }
  });
}

// Função para mostrar modal de alterar email
function mostrarModalAlterarEmail() {
  // Criar modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-header">
        <h3>Alterar E-mail</h3>
        <button class="modal-close">&times;</button>
      </div>
      <div class="modal-body">
        <form id="changeEmailForm">
          <div class="form-group">
            <label for="currentEmailPassword">Senha Atual</label>
            <input type="password" id="currentEmailPassword" required placeholder="Digite sua senha atual">
          </div>
          <div class="form-group">
            <label for="newEmail">Novo E-mail</label>
            <input type="email" id="newEmail" required placeholder="Digite seu novo e-mail">
          </div>
          <div class="form-group">
            <label for="confirmNewEmail">Confirmar Novo E-mail</label>
            <input type="email" id="confirmNewEmail" required placeholder="Confirme seu novo e-mail">
          </div>
          <button type="submit" class="btn-primary">Alterar E-mail</button>
        </form>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Funcionalidades do modal
  const closeBtn = modal.querySelector(".modal-close");
  const form = modal.querySelector("#changeEmailForm");

  closeBtn.addEventListener("click", () => {
    document.body.removeChild(modal);
  });

  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById(
      "currentEmailPassword",
    ).value;
    const newEmail = document.getElementById("newEmail").value;
    const confirmNewEmail = document.getElementById("confirmNewEmail").value;

    if (newEmail !== confirmNewEmail) {
      alert("Os e-mails não coincidem!");
      return;
    }

    try {
      const response = await fetch(
        "https://projeto-back-end-n8lm.onrender.com/alterar-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senhaAtual: currentPassword,
            novoEmail: newEmail,
            nomeUsuario:
              localStorage.getItem("nomeUsuario") ||
              localStorage.getItem("usuarioNome"),
          }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        alert("E-mail alterado com sucesso!");
        localStorage.setItem("emailUsuario", newEmail);
        localStorage.setItem("usuarioEmail", newEmail);
        document.body.removeChild(modal);
      } else {
        alert(data.mensagem || "Erro ao alterar e-mail");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert("Erro ao conectar com o servidor");
    }
  });
}
