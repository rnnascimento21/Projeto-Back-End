document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('container-projetos');

    try {
        const resposta = await fetch('http://localhost:3000/projetos');
        const projetos = await resposta.json();

        if (projetos.length === 0) {
            container.innerHTML = "<p>Nenhum projeto encontrado.</p>";
            return;
        }

        container.innerHTML = ""; // Limpa o que tiver lá

        projetos.forEach(proj => {
            container.innerHTML += `
                <div class="card">
                    <img src="assets/img/${proj.imagem_url}" alt="${proj.titulo}">
                    <h3>${proj.titulo}</h3>
                    <p>${proj.descricao}</p>
                </div>
            `;
        });
    } catch (erro) {
        console.error("Erro ao carregar:", erro);
        container.innerHTML = "<p>Erro ao conectar com o servidor.</p>";
    }
});