function menuShow(){
    let menuMobile = document.querySelector('.mobile-menu');
    if(menuMobile.classList.contains('open')){
        menuMobile.classList.remove('open');
        document.querySelector('.icon').src = "assets/img/icons8-cardápio-48.png";
    } else {
        menuMobile.classList.add('open');
        document.querySelector('.icon').src = "assets/img/icons8-excluir-50.png";
    }       
}
async function carregarDadosDoBanco() {
    try {
        const resposta = await fetch('http://localhost:3000/projetos');
        const projetos = await resposta.json();
        
        console.log("Projetos vindos do MySQL:", projetos);
        
        // Aqui você pode usar um projetos.forEach() para criar seus cards
        // Exemplo: alert("Projeto do banco: " + projetos[0].titulo);
        
    } catch (erro) {
        console.error("Erro ao conectar com o servidor Node:", erro);
    }
}

carregarDadosDoBanco();
async function carregarDadosDoBanco() {
    try {
        const resposta = await fetch('http://localhost:3000/projetos');
        const projetos = await resposta.json();
        
        const container = document.getElementById('container-projetos');
        
        if (container) {
            container.innerHTML = ""; // Limpa o container

            projetos.forEach(projeto => {
                const card = `
                    <div class="projeto-card">
                        <img src="assets/img/${projeto.imagem_url}" alt="${projeto.titulo}" style="width:100%">
                        <h3>${projeto.titulo}</h3>
                        <p>${projeto.descricao}</p>
                    </div>
                `;
                container.innerHTML += card;
            });
        }
    } catch (erro) {
        console.error("Erro ao carregar projetos:", erro);
    }
}

// Chama a função assim que a página carregar
window.onload = carregarDadosDoBanco;
async function carregarProjetos() {
    const container = document.getElementById('container-projetos');
    
    if (!container) return;

    try {
        const resposta = await fetch('http://localhost:3000/projetos');
        const projetos = await resposta.json();

        container.innerHTML = ""; 

        if (projetos.length === 0) {
            container.innerHTML = "<p>Nenhum projeto cadastrado no momento.</p>";
            return;
        }

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

document.addEventListener('DOMContentLoaded', carregarProjetos);