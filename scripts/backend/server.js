import express from 'express'; // Framework para criar o servidor HTTP
import multer from 'multer'; // Middleware para upload de arquivos
import fs from 'fs'; // Módulo nativo para manipulação de arquivos
import path from 'path'; // Módulo nativo para manipulação de caminhos
import cors from 'cors'; // Middleware para habilitar CORS
import { fileURLToPath } from 'url'; // Função para manipulação de URLs no contexto de módulos ES

// Configuração para obter o caminho absoluto do diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../'); // Obtém o caminho da pasta raiz do projeto

const app = express();
const PORT = 3000; // Define a porta que o servidor será executado

// Middleware para servir arquivos estáticos e habilitar JSON e CORS
app.use(express.static(rootDir));
app.use(express.json());
app.use(cors());

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Define o diretório onde as imagens serão salvas
    const uploadDir = path.join(rootDir, 'assets', 'images_uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true }); // Cria o diretório se não existir
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Gera um nome de arquivo único usando timestamp e número aleatório
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname)); // Adiciona a extensão original
  }
});
const upload = multer({ storage }); // Inicializa o multer com a configuração de armazenamento

// Caminho do arquivo JSON que armazena os produtos
const jsonDir = path.join(rootDir, 'json');
const filePath = path.join(jsonDir, 'produtos.json');

// Função para carregar os produtos do arquivo JSON
function carregarProdutos() {
  if (fs.existsSync(filePath)) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
  return [];
}

// Função para salvar os produtos no arquivo JSON
function salvarProdutos(produtos) {
  fs.writeFileSync(filePath, JSON.stringify(produtos, null, 2));
}

// Rota para servir a página inicial
app.get('/', (req, res) => {
  const indexPath = path.join(rootDir, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).send('Arquivo index.html não encontrado!');
  }
});

// Rota para adicionar um novo produto (com upload de imagem)
app.post('/api/produtos', upload.single('imagem'), (req, res) => {
  let { nome, preco } = req.body;
  const { file } = req;

  // Validação do campo 'nome'
  if (!nome || nome.trim() === '') {
    return res.status(400).json({ error: 'Nome é obrigatório!' });
  }

  // Conversão e validação do preço
  preco = parseFloat(preco.replace('R$', '').replace(',', '.').trim());
  if (isNaN(preco) || preco <= 0) {
    return res.status(400).json({ error: 'Preço deve ser um número válido!' });
  }

  // Verifica se o upload da imagem foi realizado
  if (!file) {
    return res.status(400).json({ error: 'Imagem é obrigatória!' });
  }

  // Cria o objeto do produto com nome, preço e caminho da imagem
  const imagePath = `./assets/images_uploads/${file.filename}`;
  const productData = {
    id: Date.now(),
    nome,
    preco,
    imagem: imagePath,
  };

  // Carrega os produtos existentes, adiciona o novo e salva no arquivo JSON
  const existingData = carregarProdutos();
  existingData.push(productData);
  salvarProdutos(existingData);

  res.status(200).json({ message: 'Produto adicionado com sucesso!' });
});

// Rota para listar todos os produtos
app.get('/api/produtos', (req, res) => {
  const produtos = carregarProdutos();
  res.json(produtos);
});

// Rota para deletar um produto pelo ID
app.delete('/api/produtos/:id', (req, res) => {
  const { id } = req.params;
  let produtos = carregarProdutos();

  // Filtra os produtos removendo o que tem o ID fornecido
  const updatedProdutos = produtos.filter(produto => produto.id !== parseInt(id));

  // Verifica se o produto foi encontrado
  if (produtos.length === updatedProdutos.length) {
    return res.status(404).json({ error: 'Produto não encontrado!' });
  }

  salvarProdutos(updatedProdutos);
  res.status(200).json({ message: 'Produto excluído com sucesso!' });
});

// Inicia o servidor na porta especificada
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
