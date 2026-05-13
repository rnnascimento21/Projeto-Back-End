require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const path = require("path");

const app = express();

// --- CONFIGURAÇÃO DO BANCO ---
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 14505,
  ssl: { rejectUnauthorized: false },
});

// --- CONFIGURAÇÃO DO CORS (O SEGREDO PARA O GITHUB PAGES) ---
app.use(cors({
  origin: [
    "https://rnnascimento21.github.io", // Seu site oficial
    "http://localhost:3000",           // Testes locais no node
    "http://127.0.0.1:5500"            // Extensão Live Server do VS Code
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

db.connect((err) => {
  if (err) return console.error("❌ ERRO MYSQL:", err.message);
  console.log(`✅ Conectado ao banco Aiven!`);
});

// --- ROTA DE PROJETOS ---
app.get("/projetos", (req, res) => {
  db.query("SELECT * FROM projetos", (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro ao buscar projetos." });
    res.json(results);
  });
});

app.get("/projetos/busca", (req, res) => {
  const termo = req.query.q;
  const sql = "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?";
  db.query(sql, [`%${termo}%`, `%${termo}%`], (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro na busca." });
    res.json(results);
  });
});

// --- 1. ROTA DE CADASTRO ---
app.post("/cadastro", (req, res) => {
  const { nome, email, senha, segunda_senha } = req.body;
  if (!nome || !email || !senha || !segunda_senha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }

  db.query("SELECT id FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro no servidor." });
    if (results.length > 0) return res.status(409).json({ mensagem: "E-mail já cadastrado." });

    try {
      const senhaCriptografada = await bcrypt.hash(senha, 10);
      const segundaSenhaCriptografada = await bcrypt.hash(segunda_senha, 10);

      const sql = "INSERT INTO usuarios (nome, email, senha, perfil, segunda_senha) VALUES (?, ?, ?, 'Comum', ?)";
      db.query(sql, [nome, email, senhaCriptografada, segundaSenhaCriptografada], (err) => {
        if (err) return res.status(500).json({ mensagem: "Erro ao salvar no banco." });
        res.json({ mensagem: "Cadastro realizado com sucesso!" });
      });
    } catch (erro) {
      res.status(500).json({ mensagem: "Erro interno ao processar senha." });
    }
  });
});

// --- 2. ROTA DE LOGIN (PASSO 1) ---
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro no banco." });
    if (results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });

    const usuario = results[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha);
    if (!senhaOk) return res.status(401).json({ mensagem: "Senha incorreta." });

    res.json({ mensagem: "Insira sua Palavra-Passe.", needsVerification: true });
  });
});

// --- 3. VERIFICAÇÃO DA PALAVRA-PASSE (PASSO 2) ---
app.post("/verificar-login", async (req, res) => {
  const { email, codigo } = req.body;
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Erro na verificação." });

    const usuario = results[0];
    try {
      const passwordOk = await bcrypt.compare(codigo, usuario.segunda_senha);
      if (!passwordOk) return res.status(400).json({ mensagem: "Palavra-Passe incorreta." });

      res.json({
        usuario: usuario.nome,
        perfil: usuario.perfil,
        mensagem: "Sucesso!"
      });
    } catch (e) {
      res.status(500).json({ mensagem: "Erro ao validar código." });
    }
  });
});

app.get("/logs-auditoria", (req, res) => {
  db.query("SELECT nome, email, perfil, criado_em FROM usuarios ORDER BY criado_em DESC", (err, results) => {
    if (err) return res.status(500).json({ mensagem: "Erro nos logs." });
    res.json(results);
  });
});

// --- ROTAS DE ARQUIVOS ---
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "entrar.html")));
app.get("/:page", (req, res, next) => {
  const page = req.params.page;
  if (page.endsWith(".html")) res.sendFile(path.join(__dirname, page));
  else next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));