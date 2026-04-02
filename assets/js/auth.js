const authForm = document.getElementById('auth-form');
const nameField = document.getElementById('name-field');
const submitBtn = document.getElementById('submit-btn');
const toggleBtn = document.getElementById('toggle-btn');

// 1. Alternar entre Login e Cadastro
toggleBtn.addEventListener('click', () => {
    const isLogin = submitBtn.innerText === 'Entrar';
    submitBtn.innerText = isLogin ? 'Cadastrar' : 'Entrar';
    toggleBtn.innerText = isLogin ? 'Fazer Login' : 'Cadastre-se';
    
    if (isLogin) {
        nameField.classList.remove('hidden');
    } else {
        nameField.classList.add('hidden');
    }
});

// 2. Enviar dados
authForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const isCadastro = !nameField.classList.contains('hidden');
    
    // Só pega o nome se for cadastro
    let nome = "";
    if (isCadastro) {
        nome = document.getElementById('name').value;
        if (!nome) return alert("Por favor, digite seu nome.");
    }

    const url = isCadastro ? 'http://localhost:3000/cadastro' : 'http://localhost:3000/login';
    const corpoDados = isCadastro ? { nome, email, senha: password } : { email, senha: password };

    try {
        console.log(`Tentando enviar para: ${url}`); // Para você ver no F12
        
        const resposta = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(corpoDados)
        });

        const dados = await resposta.json();

        if (resposta.ok) {
            alert(isCadastro ? "Cadastrado com sucesso!" : "Bem-vindo, " + dados.usuario);
            if (!isCadastro) {
                localStorage.setItem('usuarioNome', dados.usuario);
                window.location.href = "index.html";
            } else {
                toggleBtn.click(); // Volta para tela de login após cadastrar
            }
        } else {
            alert(dados.mensagem);
        }
    } catch (erro) {
        console.error("Erro na requisição:", erro);
        alert("Servidor desligado ou erro de rede. Verifique o terminal!");
    }
});
async function carregarProjetos() {
    const container = document.getElementById('container-projetos');
    
    // Verifica se o container existe na página atual
    if (!container) return;

    try {
        // Faz a chamada para a rota que você criou no server.js
        const resposta = await fetch('http://localhost:3000/projetos');
        const projetos = await resposta.json();

        // Limpa a mensagem "Carregando..."
        container.innerHTML = "";

        if (projetos.length === 0) {
            container.innerHTML = "<p>Nenhum projeto cadastrado no momento.</p>";
            return;
        }

        // Monta os cards usando os dados do seu MySQL (titulo, descricao, imagem_url)
        projetos.forEach(projeto => {
            container.innerHTML += `
                <div class="portfolio-item">
                    <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}">
                    <h3>${projeto.titulo}</h3>
                    <p>${projeto.descricao}</p>
                </div>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
        container.innerHTML = "<p>Erro ao conectar com o servidor. O Node está rodando?</p>";
    }
}

