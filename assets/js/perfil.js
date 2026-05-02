document.addEventListener("DOMContentLoaded", () => {
  const currentName =
    localStorage.getItem("nomeUsuario") || localStorage.getItem("usuarioNome");
  const currentEmail =
    localStorage.getItem("emailUsuario") || localStorage.getItem("usuarioEmail");

  const welcome = document.getElementById("profile-welcome");
  const currentNameInput = document.getElementById("currentName");
  const currentEmailInput = document.getElementById("currentEmail");
  const nameForm = document.getElementById("name-form");
  const emailForm = document.getElementById("email-form");
  const passwordForm = document.getElementById("password-form");

  if (!currentName || !currentEmail) {
    if (welcome) {
      welcome.textContent =
        "Você precisa estar logado para editar seu perfil. Redirecionando para a página de login...";
    }
    setTimeout(() => {
      window.location.href = "entrar.html";
    }, 2000);
    return;
  }

  if (welcome) {
    welcome.textContent = `Olá, ${currentName}! Atualize seus dados abaixo.`;
  }

  if (currentNameInput) currentNameInput.value = currentName;
  if (currentEmailInput) currentEmailInput.value = currentEmail;

  const showMessage = (elementId, text, success = true) => {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.textContent = text;
    element.style.color = success ? "#8be28b" : "#ff6b6b";
  };

  nameForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newName = document.getElementById("newName").value.trim();
    if (!newName) {
      showMessage("name-message", "Digite um novo nome.", false);
      return;
    }

    try {
      const response = await fetch(
        "https://projeto-back-end-n8lm.onrender.com/alterar-nome",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: currentEmail, novoNome: newName }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("nomeUsuario", newName);
        localStorage.setItem("usuarioNome", newName);
        if (currentNameInput) currentNameInput.value = newName;
        if (welcome) welcome.textContent = `Olá, ${newName}! Atualize seus dados abaixo.`;
        showMessage("name-message", data.mensagem || "Nome atualizado com sucesso.");
      } else {
        showMessage("name-message", data.mensagem || "Erro ao atualizar nome.", false);
      }
    } catch (error) {
      console.error(error);
      showMessage("name-message", "Erro de conexão.", false);
    }
  });

  emailForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const newEmail = document.getElementById("newEmail").value.trim();
    const password = document.getElementById("emailPassword").value.trim();
    if (!newEmail || !password) {
      showMessage("email-message", "Preencha todos os campos.", false);
      return;
    }

    try {
      const response = await fetch(
        "https://projeto-back-end-n8lm.onrender.com/alterar-email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            senhaAtual: password,
            novoEmail: newEmail,
            nomeUsuario: currentName,
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem("emailUsuario", newEmail);
        localStorage.setItem("usuarioEmail", newEmail);
        if (currentEmailInput) currentEmailInput.value = newEmail;
        showMessage("email-message", data.mensagem || "E-mail atualizado com sucesso.");
      } else {
        showMessage("email-message", data.mensagem || "Erro ao atualizar e-mail.", false);
      }
    } catch (error) {
      console.error(error);
      showMessage("email-message", "Erro de conexão.", false);
    }
  });

  passwordForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const currentPassword = document.getElementById("currentPassword").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage("password-message", "Preencha todos os campos.", false);
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage("password-message", "As senhas não coincidem.", false);
      return;
    }

    try {
      const response = await fetch(
        "https://projeto-back-end-n8lm.onrender.com/alterar-senha",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: currentEmail,
            senhaAtual: currentPassword,
            novaSenha: newPassword,
          }),
        },
      );
      const data = await response.json();
      if (response.ok) {
        showMessage("password-message", data.mensagem || "Senha atualizada com sucesso.");
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
        document.getElementById("confirmPassword").value = "";
      } else {
        showMessage("password-message", data.mensagem || "Erro ao atualizar senha.", false);
      }
    } catch (error) {
      console.error(error);
      showMessage("password-message", "Erro de conexão.", false);
    }
  });
});
