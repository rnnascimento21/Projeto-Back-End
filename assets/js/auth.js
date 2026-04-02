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
    
    let nome = "";
    if (isCadastro) {
        nome = document.getElementById('name').value;
        if (!nome) return alert("Por favor, digite seu nome.");
    }

    // 🔥 ATUALIZADO: Usando o link do RENDER em vez de localhost
    const baseUrl = 'https://projeto-back-end-n8lm.onrender.com';
    const url = isCadastro ? `${baseUrl}/cadastro` : `${baseUrl}/login`;
    
    const corpoDados = isCadastro ? { nome, email, senha: password } : { email, senha: password };

    try {
        console.log(`Tentando enviar para: ${url}`); 
        
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
        alert("Erro ao conectar com o servidor na nuvem! Verifique se o Render está rodando.");
    }
});