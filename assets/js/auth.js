const authForm = document.getElementById("auth-form");
const nameField = document.getElementById("name-field");
const codeField = document.getElementById("code-field");
const submitBtn = document.getElementById("submit-btn");
const toggleBtn = document.getElementById("toggle-btn");

// --- CONFIGURAÇÃO DA API (IGUAL AO SCRIPT.JS) ---
// Se estiver testando no PC, use http://localhost:3000
// Se for subir para o GitHub, use a URL do Render
const API_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
    ? "http://localhost:3000" 
    : "https://projeto-back-end-n8lm.onrender.com";

console.log("Conectando em:", API_URL); // Isso vai aparecer no F12 para você saber se está certo
let currentEmail = "";

// Funções de interface
function showCodeField() {
    if (codeField) {
        codeField.style.display = "block";
        codeField.classList.remove("hidden");
    }
}

function hideCodeField() {
    if (codeField) {
        codeField.style.display = "none";
        codeField.classList.add("hidden");
    }
}

// Alternar entre Login e Cadastro
if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
        const isLogin = submitBtn.innerText === "Entrar";
        submitBtn.innerText = isLogin ? "Cadastrar" : "Entrar";
        toggleBtn.innerText = isLogin ? "Fazer Login" : "Cadastre-se";
        
        if (isLogin) nameField.classList.remove("hidden");
        else nameField.classList.add("hidden");
        
        hideCodeField();
    });
}

// Evento de envio do formulário
if (authForm) {
    authForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const isCadastro = !nameField.classList.contains("hidden");
        const codigo = document.getElementById("code") ? document.getElementById("code").value.trim() : "";

        // CASO 1: Verificação da Palavra-Passe (FASE 2 DO LOGIN)
        if (codeField && !codeField.classList.contains("hidden")) {
            try {
                // ADICIONADO API_URL ABAIXO
                const resposta = await fetch(`${API_URL}/verificar-login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: currentEmail || email, codigo }),
                });
                const dados = await resposta.json();
                
                if (resposta.ok) {
                    localStorage.setItem("usuarioNome", dados.usuario);
                    localStorage.setItem("perfil", dados.perfil); 
                    window.location.href = "index.html";
                } else {
                    alert(dados.mensagem);
                }
            } catch (erro) {
                alert("Erro na verificação.");
            }
            return;
        }

        // CASO 2: Cadastro
        if (isCadastro) {
            const nome = document.getElementById("name").value;
            const segunda_senha = prompt("CRIE UMA PALAVRA-PASSE (Segurança 2FA):");
            if (!segunda_senha) return alert("Defina uma palavra-passe!");

            try {
                // ADICIONADO API_URL ABAIXO
                const resposta = await fetch(`${API_URL}/cadastro`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ nome, email, senha: password, segunda_senha }),
                });
                const dados = await resposta.json();
                if (resposta.ok) {
                    alert("Cadastrado! Faça login.");
                    location.reload();
                } else {
                    alert(dados.mensagem);
                }
            } catch (erro) {
                alert("Erro ao cadastrar.");
            }
        }
        // CASO 3: Login Inicial (FASE 1)
        else {
            try {
                // ADICIONADO API_URL ABAIXO
                const resposta = await fetch(`${API_URL}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, senha: password }),
                });
                const dados = await resposta.json();

                if (resposta.ok) {
                    if (dados.redirect) {
                        localStorage.setItem("usuarioNome", dados.usuario);
                        localStorage.setItem("perfil", dados.perfil);
                        window.location.href = "index.html";
                    } else if (dados.needsVerification) {
                        currentEmail = email;
                        showCodeField();
                        alert(dados.mensagem);
                    }
                } else {
                    alert(dados.mensagem);
                }
            } catch (erro) {
                alert("Erro ao conectar com o servidor.");
            }
        }
    });
}