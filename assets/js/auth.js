const authForm = document.getElementById("auth-form");
const nameField = document.getElementById("name-field");
const submitBtn = document.getElementById("submit-btn");
const toggleBtn = document.getElementById("toggle-btn");
const codigoField = document.getElementById("codigo-field");
const codigoInput = document.getElementById("codigo");

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
    const resposta = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpoDados),
    });

    const dados = await resposta.json();

    if (resposta.ok) {

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

  } catch (erro) {
    console.error("Erro na requisição:", erro);
    alert("Erro ao conectar com o servidor.");
  }
});
