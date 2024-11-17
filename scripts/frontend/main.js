// Seleção dos elementos do DOM
const form = document.getElementById('formularioproduto');
const productContainer = document.getElementById('estoque');
const inputNome = document.getElementById('nome');
const inputPreco = document.getElementById('preco');
const inputImagem = document.getElementById('imagem');

// Função para exibir notificações
function exibirNotificacao(mensagem, tipo = 'sucesso') {
    const notificacaoExistente = document.querySelector('.notificacao');
    if (notificacaoExistente) notificacaoExistente.remove();

    const notificacao = document.createElement('div');
    notificacao.classList.add('notificacao', tipo);
    notificacao.textContent = mensagem;
    document.body.appendChild(notificacao);

    setTimeout(() => {
        notificacao.classList.add('fade-out');
        setTimeout(() => notificacao.remove(), 500);
    }, 5000);
}

// Função para exibir mensagem de carregamento
function exibirCarregando(mensagem, container) {
    container.innerHTML = `<h3 class="principal_meusprodutos_estoque_carregamento">${mensagem}</h3>`;
}

// Evento de envio do formulário
form.addEventListener('submit', async function (event) {
    event.preventDefault();

    // Verifica se os campos nome, preço e imagem estão preenchidos
    const nomeVazio = !inputNome.value.trim();
    const precoVazio = !inputPreco.value.trim();
    const imagemVazia = !inputImagem.files.length;

    if (nomeVazio && precoVazio && imagemVazia) {
        exibirNotificacao('Erro: Todos os campos estão vazios. Por favor, preencha-os antes de enviar.', 'erro');
        return;
    }

    let erroEncontrado = false;

    if (nomeVazio) {
        exibirNotificacao('Erro: Por favor, insira o nome do produto.', 'erro');
        erroEncontrado = true;
    }

    if (precoVazio) {
        exibirNotificacao('Erro: Por favor, insira o preço do produto.', 'erro');
        erroEncontrado = true;
    }

    if (imagemVazia) {
        exibirNotificacao('Erro: Por favor, faça o upload de uma imagem.', 'erro');
        erroEncontrado = true;
    }

    if (erroEncontrado) {
        return;
    }

    // Criação dos dados do formulário para envio assíncrono
    const formData = new FormData(form);

    const botao = form.querySelector('button[type="submit"]');
    botao.disabled = true;
    botao.textContent = 'Adicionando...';

    try {
        // Enviando os dados para o backend de forma assíncrona
        const response = await fetch('/api/produtos', {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            exibirNotificacao(result.message || 'Produto adicionado com sucesso!', 'sucesso');
            form.reset();
            await carregarProdutos();
        } else {
            const result = await response.json();
            exibirNotificacao(result.error || 'Erro ao adicionar produto.', 'erro');
        }
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        exibirNotificacao('Erro ao cadastrar produto', 'erro');
    } finally {
        botao.disabled = false;
        botao.textContent = 'Adicionar Produto';
    }
});

// Exibe uma notificação quando uma imagem é adicionada
inputImagem.addEventListener('change', function () {
    if (inputImagem.files.length > 0) {
        exibirNotificacao('Imagem selecionada com sucesso!', 'sucesso');
    }
});

// Função para carregar e exibir produtos
async function carregarProdutos() {
    exibirCarregando('Carregando produtos...', productContainer);

    try {
        const response = await fetch('/api/produtos');
        if (!response.ok) throw new Error('Erro ao carregar produtos');
        const produtos = await response.json();

        productContainer.innerHTML = '';

        if (produtos.length === 0) {
            productContainer.innerHTML = `
                <div class="principal_meusprodutos_estoque_vazio">
                    <img class="principal_meusprodutos_estoque_vazio_imagem" src="./assets/images/estoque.png" alt="Estoque">
                    <h3 class="principal_meusprodutos_estoque_vazio_titulo">O estoque está vazio.</h3>
                </div>
            `;
        } else {
            produtos.forEach(produto => {
                const card = criarCardProduto(produto);
                if (card) productContainer.appendChild(card);
            });

            // Adicionar eventos para exclusão
            document.querySelectorAll('#excluir').forEach(button => {
                button.addEventListener('click', async (e) => {
                    const productId = e.target.getAttribute('data-id');
                    await excluirProduto(productId);
                });
            });
        }
    } catch (error) {
        exibirNotificacao('Erro ao carregar produtos', 'erro');
        console.error(error);
    }
}

// Função para criar um cartão de produto
function criarCardProduto(produto) {
    if (!produto || !produto.imagem || !produto.nome || produto.preco == null) {
        console.error('Produto inválido:', produto);
        return null;
    }

    const card = document.createElement('section');
    card.className = 'principal_meusprodutos_estoque_produtos';

    card.innerHTML = `
        <img class="principal_meusprodutos_estoque_produtos_imagem" src="${produto.imagem}" alt="${produto.nome}" />
        <div class="principal_meusprodutos_estoque_produtos_informacao">
            <h2 class="principal_meusprodutos_estoque_produtos_informacao_nome">${produto.nome}</h2>
            <p class="principal_meusprodutos_estoque_produtos_informacao_preco">R$ ${parseFloat(produto.preco).toFixed(2)}</p>
            <button class="principal_meusprodutos_estoque_produtos_informacao_excluir" title="Excluir Produto" id="excluir" data-id="${produto.id}"></button>
        </div>
    `;
    return card;
}

// Função para excluir um produto
async function excluirProduto(id) {
    try {
        const response = await fetch(`/api/produtos/${id}`, { method: 'DELETE' });
        const result = await response.json();

        if (response.ok) {
            exibirNotificacao(result.message, 'sucesso');
            await carregarProdutos();
        } else {
            exibirNotificacao(result.error, 'erro');
        }
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        exibirNotificacao('Erro ao excluir produto', 'erro');
    }
}

// Função para formatar o valor do preço
function formatarValor() {
    let valor = parseFloat(inputPreco.value);
    if (valor > 1000.00) {
        inputPreco.value = '1000.00';
    } else if (valor < 0.01 && inputPreco.value !== '') {
        inputPreco.value = '0.01';
    } else if (!isNaN(valor)) {
        inputPreco.value = valor.toFixed(2);
    }
}

// Eventos para formatação do input de preço
inputPreco.setAttribute('step', '0.01');
inputPreco.setAttribute('min', '0.01');
inputPreco.setAttribute('max', '1000.00');
inputPreco.addEventListener('blur', formatarValor);
inputPreco.addEventListener('change', formatarValor);
inputPreco.addEventListener('keydown', (e) => {
    if (!/[0-9]/.test(e.key) && e.key !== '.' && e.key !== 'Backspace' && e.key !== 'Delete' &&
        e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
        e.preventDefault();
    }
});

// Carregar produtos ao inicializar a página
carregarProdutos();
