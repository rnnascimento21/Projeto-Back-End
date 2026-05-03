const authForm = document.getElementById("auth-form");
const nameField = document.getElementById("name-field");
const submitBtn = document.getElementById("submit-btn");
const toggleBtn = document.getElementById("toggle-btn");
<<<<<<< HEAD
=======
const codigoField = document.getElementById("codigo-field");
const codigoInput = document.getElementById("codigo");
>>>>>>> origin/daniel-ajustes

configurarBotaoAutenticacao();

// 1. Alternar entre Login e Cadastro
toggleBtn.addEventListener("click", () => {
  const isLogin = submitBtn.innerText === "Entrar";
  submitBtn.innerText = isLogin ? "Cadastrar" : "Entrar";
  toggleBtn.innerText = isLogin ? "Fazer Login" : "Cadastre-se";

  if (isLogin) {
    nameField.classList.remove("hidden");
  } else {
    nameField.classList.add("hidden");
  }
});

function configurarBotaoAutenticacao() {
  const loginLink = document.querySelector(".login-button a");
  if (!loginLink) return;

  const usuarioLogado = localStorage.getItem("usuarioNome");

  if (usuarioLogado) {
    loginLink.textContent = "Deslogar";
    loginLink.setAttribute("href", "#");

    loginLink.addEventListener("click", (event) => {
      event.preventDefault();
      localStorage.removeItem("usuarioNome");
      loginLink.textContent = "Entrar";
      loginLink.setAttribute("href", "entrar.html");
      window.location.reload();
    });
  } else {
    loginLink.textContent = "Entrar";
    loginLink.setAttribute("href", "entrar.html");
  }
}

// 2. Enviar dados
authForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  const isCadastro = !nameField.classList.contains("hidden");

  let nome = "";
  if (isCadastro) {
    nome = document.getElementById("name").value;
    if (!nome) return alert("Por favor, digite seu nome.");
  }

<<<<<<< HEAD
  // --- ALTERAÇÃO AQUI: Link completo do Render para funcionar no GitHub Pages ---
  const baseUrl = "https://projeto-back-end-n8lm.onrender.com";
  const url = isCadastro ? `${baseUrl}/cadastro` : `${baseUrl}/login`;
  // -----------------------------------------------------------------------------

  const corpoDados = isCadastro
    ? { nome, email, senha: password }
    : { email, senha: password };

  try {
    console.log(`Tentando enviar para: ${url}`);

=======
  const baseUrl = "http://localhost:3000";

  let url;
  if (isCadastro && codigoField.classList.contains("hidden")) {
    url = `${baseUrl}/cadastro`;
  } else if (isCadastro && !codigoField.classList.contains("hidden")) {
    url = `${baseUrl}/verificar-cadastro`;
  } else {
    url = `${baseUrl}/login`;
  }

  let corpoDados;
  if (isCadastro && codigoField.classList.contains("hidden")) {
    corpoDados = { nome, email, senha: password };
  } else if (isCadastro && !codigoField.classList.contains("hidden")) {
    corpoDados = { email, codigo: codigoInput.value };
  } else {
    corpoDados = { email, senha: password };
  }

  try {
>>>>>>> origin/daniel-ajustes
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpoDados),
    });

    const dados = await resposta.json();

    if (resposta.ok) {
<<<<<<< HEAD
      alert(
        isCadastro ? "Cadastrado com sucesso!" : "Bem-vindo, " + dados.usuario,
      );
      if (!isCadastro) {
        localStorage.setItem("usuarioNome", dados.usuario);
        window.location.href = "index.html";
      } else {
        toggleBtn.click(); // Volta para tela de login após cadastrar
      }
    } else {
      alert(dados.mensagem || "Nao foi possivel concluir a operacao.");
    }
=======

      if (isCadastro && dados.precisaVerificar) {
        alert("Código enviado para o seu e-mail!");

        codigoField.classList.remove("hidden");
        submitBtn.innerText = "Verificar Código";
        return;
      }

      if (!isCadastro) {
        localStorage.setItem("usuarioNome", dados.usuario);
        window.location.href = "index.html";
        return;
      }

      alert("Cadastro concluído com sucesso!");
      toggleBtn.click();
      return;
    }

    alert(dados.mensagem || "Erro na operação");

>>>>>>> origin/daniel-ajustes
  } catch (erro) {
    console.error("Erro na requisição:", erro);
    alert("Erro ao conectar com o servidor.");
  }
<<<<<<< HEAD
});
=======
});
>>>>>>> origin/daniel-ajustes
