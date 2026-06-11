document.addEventListener('DOMContentLoaded', async () => {

    const container = document.getElementById('container-projetos');

    const resposta = await fetch('http://localhost:3000/projetos');
    const projetos = await resposta.json();

    container.innerHTML = "";
    // ← LINHA 9 REMOVIDA (document.body.innerHTML apagava tudo!)

    projetos.forEach((proj, index) => {

        let pagina = "#";

        if (index === 0) pagina = "energia-solar.html";
        if (index === 1) pagina = "reciclagem.html";
        if (index === 2) pagina = "reflorestamento.html";

        container.innerHTML += `
            <div class="card">
                <img src="assets/img/${proj.imagem_url}" alt="${proj.titulo}">
                <h3>${proj.titulo}</h3>
                <p>${proj.descricao}</p>
                <a href="${pagina}" class="btn-ver-mais">Ver mais →</a>
            </div>
        `;
    });

});