// 1. Menu Mobile
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

// Remova o window.location.origin e deixe apenas o link do Render
const API_URL = "https://projeto-back-end-n8lm.onrender.com";
// 2. Carregar Projetos
async function carregarProjetos() {
  const container = document.getElementById("container-projetos");
  if (!container) return;

  try {
    const resposta = await fetch(`${API_URL}/projetos`);
    const projetos = await resposta.json();
    container.innerHTML = "";

    if (projetos.length === 0) {
      container.innerHTML = "<p>Nenhum projeto encontrado.</p>";
      return;
    }

    projetos.forEach((projeto) => {
      container.innerHTML += `
                <div class="portfolio-item">
                  <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}" onerror="this.src='assets/img/sustentaTHUMB.png'">
                  <h3>${projeto.titulo}</h3>
                  <p>${projeto.descricao}</p>
                </div>`;
    });
  } catch (erro) {
    console.error("Erro ao carregar projetos:", erro);
    container.innerHTML = "<p>Erro ao carregar projetos.</p>";
  }
}

// 3. Buscar projetos por termo
async function buscarProjetos(termo) {
  const container = document.getElementById("container-projetos");
  if (!container) return;

  const texto = termo.trim();
  if (!texto) {
    return carregarProjetos();
  }

  try {
    const resposta = await fetch(
      `${API_URL}/projetos/busca?q=${encodeURIComponent(texto)}`,
    );
    const projetos = await resposta.json();
    container.innerHTML = "";

    if (!Array.isArray(projetos) || projetos.length === 0) {
      container.innerHTML = "<p>Nenhum projeto encontrado.</p>";
      return;
    }

    projetos.forEach((projeto) => {
      container.innerHTML += `
                <div class="portfolio-item">
                  <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}" onerror="this.src='assets/img/sustentaTHUMB.png'">
                  <h3>${projeto.titulo}</h3>
                  <p>${projeto.descricao}</p>
                </div>`;
    });
  } catch (erro) {
    console.error("Erro ao buscar projetos:", erro);
    container.innerHTML = "<p>Erro ao buscar projetos.</p>";
  }
}

// 4. Lógica do Menu de Usuário e Auditoria (UNIFICADA)
function configurarMenuUsuario() {
  const usuarioNome = localStorage.getItem("usuarioNome");
  const perfil = localStorage.getItem("perfil");
  const loginBtn = document.querySelector(".login-button");
  const navList = document.querySelector(".nav-list ul");

  if (usuarioNome && loginBtn) {
    const dashLink = perfil === "Master"
      ? `<a href="dashboard.html" class="dropdown-item"> ➕ Adicionar Projeto</a>`
      : "";
    const initial = usuarioNome.charAt(0).toUpperCase();
    loginBtn.innerHTML = `<button class="user-profile-btn" id="userProfileBtn"><span class="user-avatar">${initial}</span>${usuarioNome}</button><div class="user-dropdown" id="userDropdown" style="display:none;">${dashLink}<a href="configuracoes.html" class="dropdown-item">⚙️ Configurações</a><a href="#" class="dropdown-item logout" onclick="logout(event)">🚪 Sair</a></div>`;
    const profileBtn = document.getElementById("userProfileBtn");
    if (profileBtn) {
      profileBtn.addEventListener("click", toggleUserMenu);
    }

    // Verifica se é Master (case-sensitive)
    if (perfil === "Master" && navList) {
      if (!document.getElementById("link-auditoria")) {
        const li = document.createElement("li");
        li.id = "link-auditoria";
        li.innerHTML = `<a href="auditoria.html" class="nav-link" style="color: #ffc107; font-weight: bold;">Auditoria</a>`;
        navList.appendChild(li);
      }
    }
  }
}

function toggleUserMenu() {
  const menu = document.getElementById("userDropdown");
  const btn  = document.getElementById("userProfileBtn");
  if (menu) {
    const opening = menu.style.display === "none";
    menu.style.display = opening ? "block" : "none";
    if (btn) btn.classList.toggle("open", opening);
  }
}

document.addEventListener("click", (e) => {
  const menu = document.getElementById("userDropdown");
  const btn  = document.getElementById("userProfileBtn");
  if (menu && menu.style.display === "block" && btn && !btn.contains(e.target) && !menu.contains(e.target)) {
    menu.style.display = "none";
    btn.classList.remove("open");
  }
});

function logout(e) {
  e.preventDefault();
  localStorage.clear();
  location.href = "index.html";
}

// 4. Newsletter — redireciona para cadastro com email pré-preenchido
function cadastrarNewsletter(event) {
  event.preventDefault();
  const emailInput = document.getElementById("newsletter-email");
  if (!emailInput || !emailInput.value) return;
  const email = encodeURIComponent(emailInput.value.trim());
  window.location.href = `entrar.html?email=${email}&modo=cadastro`;
}

// Inicializar tudo ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
  configurarMenuUsuario(); // Chama a função que verifica o Master
  carregarProjetos(); // Carrega os projetos do banco

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      buscarProjetos(event.target.value);
    });
  }

  const newsForm = document.getElementById("newsletter-form");
  if (newsForm) {
    newsForm.addEventListener("submit", cadastrarNewsletter);
  }
});
