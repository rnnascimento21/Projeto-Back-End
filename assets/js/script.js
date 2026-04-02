// 1. Função para o Menu Mobile
function menuShow(){
    let menuMobile = document.querySelector('.mobile-menu');
    let icon = document.querySelector('.icon');
    
    if(menuMobile.classList.contains('open')){
        menuMobile.classList.remove('open');
        if(icon) icon.src = "assets/img/icons8-cardápio-48.png";
    } else {
        menuMobile.classList.add('open');
        if(icon) icon.src = "assets/img/icons8-excluir-50.png";
    }       
}

// 2. Função para Carregar Projetos do Backend (RENDER)
async function carregarProjetos() {
    const container = document.getElementById('container-projetos');
    if (!container) return;

    try {
        // LINK ATUALIZADO PARA O RENDER
        const resposta = await fetch('https://projeto-back-end-n8lm.onrender.com/projetos');
        const projetos = await resposta.json();

        container.innerHTML = ""; 

        if (projetos.length === 0) {
            container.innerHTML = "<p>Nenhum projeto cadastrado no momento.</p>";
            return;
        }

        projetos.forEach(projeto => {
            // Usando a classe 'portfolio-item' que você já tem no CSS
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
        container.innerHTML = "<p>Erro ao conectar com o servidor na nuvem.</p>";
    }
}

// 3. Inicia a carga assim que o site abrir
document.addEventListener('DOMContentLoaded', carregarProjetos);// 1. Função para o Menu Mobile
function menuShow(){
    let menuMobile = document.querySelector('.mobile-menu');
    let icon = document.querySelector('.icon');
    
    if(menuMobile.classList.contains('open')){
        menuMobile.classList.remove('open');
        if(icon) icon.src = "assets/img/icons8-cardápio-48.png";
    } else {
        menuMobile.classList.add('open');
        if(icon) icon.src = "assets/img/icons8-excluir-50.png";
    }       
}

// 2. Função para Carregar Projetos do Backend (RENDER)
async function carregarProjetos() {
    const container = document.getElementById('container-projetos');
    if (!container) return;

    try {
        // LINK ATUALIZADO PARA O RENDER
        const resposta = await fetch('https://projeto-back-end-n8lm.onrender.com/projetos');
        const projetos = await resposta.json();

        container.innerHTML = ""; 

        if (projetos.length === 0) {
            container.innerHTML = "<p>Nenhum projeto cadastrado no momento.</p>";
            return;
        }

        projetos.forEach(projeto => {
            // Usando a classe 'portfolio-item' que você já tem no CSS
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
        container.innerHTML = "<p>Erro ao conectar com o servidor na nuvem.</p>";
    }
}

// 3. Inicia a carga assim que o site abrir
document.addEventListener('DOMContentLoaded', carregarProjetos);