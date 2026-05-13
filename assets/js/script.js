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
        const resposta = await fetch(`${API_URL}/projetos/busca?q=${encodeURIComponent(texto)}`);
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
    const loginBtn = document.querySelector(".login-button a");
    const navList = document.querySelector(".nav-list ul");

    if (usuarioNome && loginBtn) {
        loginBtn.textContent = "Sair";
        loginBtn.onclick = () => { localStorage.clear(); location.href = "index.html"; };

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

document.addEventListener('DOMContentLoaded', configurarMenuUsuario);

// 4. Newsletter
async function cadastrarNewsletter(event) {
    event.preventDefault();
    const emailInput = document.getElementById("newsletter-email");
    const message = document.getElementById("newsletter-message");
    if (!emailInput) return;

    try {
        const resposta = await fetch(`${API_URL}/newsletter`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailInput.value }),
        });

        if (resposta.ok) {
            message.textContent = "Inscrito com sucesso!";
            message.style.color = "green";
            emailInput.value = "";
        } else {
            const erroDados = await resposta.json();
            message.textContent = erroDados.mensagem || "Erro ao cadastrar.";
            message.style.color = "red";
        }
    } catch (e) {
        message.textContent = "Erro ao cadastrar.";
        message.style.color = "red";
    }
}

// Inicializar tudo ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    configurarMenuUsuario(); // Chama a função que verifica o Master
    carregarProjetos();      // Carrega os projetos do banco

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