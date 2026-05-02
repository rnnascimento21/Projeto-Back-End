// 1. Função para o Menu Mobile (SEM ALTERAÇÕES)
function menuShow() {
  const menuMobile = document.querySelector(".mobile-menu");
  const icon = document.querySelector(".icon");

  if (!menuMobile) return;

  if (menuMobile.classList.contains("open")) {
    menuMobile.classList.remove("open");
    if (icon) icon.src = "assets/img/icons8-cardápio-48.png";
  } else {
    menuMobile.classList.add("open");
    if (icon) icon.src = "assets/img/icons8-excluir-50.png";
  }
}

// 2. Função para carregar projetos do backend (ALTERADO O LINK)
async function carregarProjetos() {
  const container = document.getElementById("container-projetos");
  if (!container) return;

  try {
    // LINK CORRIGIDO: Apontando para a rota /projetos do Render
    const resposta = await fetch(
      "https://projeto-back-end-n8lm.onrender.com/projetos",
    );
    const projetos = await resposta.json();

    container.innerHTML = "";

    if (!Array.isArray(projetos) || projetos.length === 0) {
      container.innerHTML = "<p>Nenhum projeto cadastrado no momento.</p>";
      return;
    }

    projetos.forEach((projeto) => {
      container.innerHTML += `
                <div class="portfolio-item">
                  <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}" onerror="this.src='assets/img/sustentaTHUMB.png'">
                  <h3>${projeto.titulo}</h3>
                  <p>${projeto.descricao}</p>
                </div>
            `;
    });
  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    container.innerHTML = "<p>Erro ao conectar com o servidor.</p>";
  }
}

// 2.1 Função para buscar projetos no backend (ALTERADO O LINK)
async function buscarProjetos(termo) {
  const container = document.getElementById("container-projetos");
  if (!container) return;

  const termoLimpo = termo.trim();

  if (!termoLimpo) {
    await carregarProjetos();
    return;
  }

  try {
    // LINK CORRIGIDO: Adicionado /projetos/busca?q= antes do termo
    const resposta = await fetch(
      `https://projeto-back-end-n8lm.onrender.com/projetos/busca?q=${encodeURIComponent(termoLimpo)}`,
    );
    const projetos = await resposta.json();

    container.innerHTML = "";

    if (!Array.isArray(projetos) || projetos.length === 0) {
      container.innerHTML = "<p>Nenhum projeto encontrado para esta busca.</p>";
      return;
    }

    projetos.forEach((projeto) => {
      container.innerHTML += `
        <div class="portfolio-item">
          <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}" onerror="this.src='assets/img/sustentaTHUMB.png'">
          <h3>${projeto.titulo}</h3>
          <p>${projeto.descricao}</p>
        </div>
      `;
    });
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro);
    container.innerHTML = "<p>Erro ao realizar a busca.</p>";
  }
}

// 3. Função para cadastrar newsletter e enviar e-mail (ALTERADO O LINK)
async function cadastrarNewsletter(event) {
  event.preventDefault();

  const inputEmail = document.getElementById("newsletter-email");
  const message = document.getElementById("newsletter-message");

  if (!inputEmail || !message) return;

  const email = inputEmail.value.trim();

  if (!email) {
    message.textContent = "Digite um e-mail válido.";
    message.style.color = "#ff6b6b";
    return;
  }

  try {
    // LINK CORRIGIDO: Adicionado /newsletter no final
    const resposta = await fetch(
      "https://projeto-back-end-n8lm.onrender.com/newsletter",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      },
    );

    const dados = await resposta.json();

    if (!resposta.ok) {
      message.textContent =
        dados.mensagem || "Não foi possível cadastrar seu e-mail.";
      message.style.color = "#ff6b6b";
      return;
    }

    message.textContent = "Cadastro realizado! Verifique sua caixa de entrada.";
    message.style.color = "#8be28b";
    inputEmail.value = "";
  } catch (erro) {
    console.error("Erro ao cadastrar newsletter:", erro);
    message.textContent = "Erro de conexão. Tente novamente em instantes.";
    message.style.color = "#ff6b6b";
  }
}

async function enviarNewsletterEmMassa(event) {
  event.preventDefault();

  const subjectInput = document.getElementById("newsletter-subject");
  const bodyInput = document.getElementById("newsletter-body");
  const keyInput = document.getElementById("newsletter-key");
  const message = document.getElementById("newsletter-send-message");

  if (!subjectInput || !bodyInput || !keyInput || !message) return;

  const subject = subjectInput.value.trim();
  const html = bodyInput.value.trim();
  const key = keyInput.value.trim();

  if (!subject || !html || !key) {
    message.textContent = "Preencha todos os campos para enviar a newsletter.";
    message.style.color = "#ff6b6b";
    return;
  }

  try {
    const resposta = await fetch(
      "https://projeto-back-end-n8lm.onrender.com/newsletter/send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, html, key }),
      },
    );

    const dados = await resposta.json();

    if (resposta.ok) {
      message.textContent = dados.mensagem || "Newsletter enviada com sucesso.";
      message.style.color = "#8be28b";
      subjectInput.value = "";
      bodyInput.value = "";
      keyInput.value = "";
    } else {
      message.textContent = dados.mensagem || "Erro ao enviar newsletter.";
      message.style.color = "#ff6b6b";
    }
  } catch (erro) {
    console.error("Erro ao enviar newsletter em massa:", erro);
    message.textContent = "Erro de conexão. Tente novamente.";
    message.style.color = "#ff6b6b";
  }
}

// 4. Inicialização das funcionalidades (SEM ALTERAÇÕES)
function inicializarPagina() {
  carregarProjetos();

  const inputBusca = document.getElementById("searchInput");
  if (inputBusca) {
    inputBusca.addEventListener("input", (event) => {
      buscarProjetos(event.target.value);
    });
  }

  const newsletterForm = document.getElementById("newsletter-form");
  if (newsletterForm) {
    newsletterForm.addEventListener("submit", cadastrarNewsletter);
  }

  const newsletterSendForm = document.getElementById("newsletter-send-form");
  if (newsletterSendForm) {
    newsletterSendForm.addEventListener("submit", enviarNewsletterEmMassa);
  }
}

document.addEventListener("DOMContentLoaded", inicializarPagina);

// 5. Configurar Botão de Autenticação (SEM ALTERAÇÕES)
function configurarBotaoAutenticacao() {
  // Lógica de painel de usuário movida para assets/js/user-panel.js
  // Mantida apenas por compatibilidade.
}
