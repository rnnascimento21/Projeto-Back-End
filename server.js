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

app.use(cors({
  origin: function (origin, callback) {
    // Permite requisições sem origin (como mobile ou ferramentas de teste) 
    // ou requisições vindas do seu GitHub e Localhost
    const allowed = [
      "https://rnnascimento21.github.io",
      "http://localhost:3000",
      "http://127.0.0.1:5500"
    ];
    if (!origin || allowed.some(domain => origin.startsWith(domain))) {
      callback(null, true);
    } else {
      callback(new Error("Bloqueado pelo CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
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
        email: usuario.email,
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

// --- ALTERAR NOME ---
app.put("/alterar-nome", (req, res) => {
  const { email, senha, novoNome } = req.body;
  if (!email || !senha || !novoNome) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senha, results[0].senha);
    if (!ok) return res.status(401).json({ mensagem: "Senha incorreta." });
    db.query("UPDATE usuarios SET nome = ? WHERE email = ?", [novoNome, email], (err2) => {
      if (err2) return res.status(500).json({ mensagem: "Erro ao atualizar." });
      res.json({ mensagem: "Nome atualizado com sucesso!" });
    });
  });
});

// --- ALTERAR EMAIL ---
app.put("/alterar-email", (req, res) => {
  const { email, senha, novoEmail } = req.body;
  if (!email || !senha || !novoEmail) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senha, results[0].senha);
    if (!ok) return res.status(401).json({ mensagem: "Senha incorreta." });
    db.query("SELECT id FROM usuarios WHERE email = ?", [novoEmail], (err2, exists) => {
      if (err2) return res.status(500).json({ mensagem: "Erro no servidor." });
      if (exists.length > 0) return res.status(409).json({ mensagem: "E-mail já em uso." });
      db.query("UPDATE usuarios SET email = ? WHERE email = ?", [novoEmail, email], (err3) => {
        if (err3) return res.status(500).json({ mensagem: "Erro ao atualizar." });
        res.json({ mensagem: "E-mail atualizado com sucesso!" });
      });
    });
  });
});

// --- ALTERAR SENHA ---
app.put("/alterar-senha", (req, res) => {
  const { email, senhaAtual, novaSenha } = req.body;
  if (!email || !senhaAtual || !novaSenha) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senhaAtual, results[0].senha);
    if (!ok) return res.status(401).json({ mensagem: "Senha atual incorreta." });
    try {
      const hash = await bcrypt.hash(novaSenha, 10);
      db.query("UPDATE usuarios SET senha = ? WHERE email = ?", [hash, email], (err2) => {
        if (err2) return res.status(500).json({ mensagem: "Erro ao atualizar." });
        res.json({ mensagem: "Senha atualizada com sucesso!" });
      });
    } catch { res.status(500).json({ mensagem: "Erro interno." }); }
  });
});

// --- ALTERAR 2FA ---
app.put("/alterar-2fa", (req, res) => {
  const { email, senhaAtual, novaPalavraPass } = req.body;
  if (!email || !senhaAtual || !novaPalavraPass) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senhaAtual, results[0].segunda_senha);
    if (!ok) return res.status(401).json({ mensagem: "Palavra-passe atual incorreta." });
    try {
      const hash = await bcrypt.hash(novaPalavraPass, 10);
      db.query("UPDATE usuarios SET segunda_senha = ? WHERE email = ?", [hash, email], (err2) => {
        if (err2) return res.status(500).json({ mensagem: "Erro ao atualizar." });
        res.json({ mensagem: "Palavra-passe atualizada com sucesso!" });
      });
    } catch { res.status(500).json({ mensagem: "Erro interno." }); }
  });
});

// --- ADICIONAR PROJETO ---
app.post("/projetos", (req, res) => {
  const { email, senha, titulo, descricao, imagem_url } = req.body;
  if (!email || !senha || !titulo || !descricao) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senha, results[0].senha);
    if (!ok) return res.status(401).json({ mensagem: "Senha incorreta." });
    if (results[0].perfil !== "Master") return res.status(403).json({ mensagem: "Acesso negado." });
    db.query(
      "INSERT INTO projetos (titulo, descricao, imagem_url) VALUES (?, ?, ?)",
      [titulo, descricao, imagem_url || "sustentaTHUMB.png"],
      (err2, result) => {
        if (err2) return res.status(500).json({ mensagem: "Erro ao adicionar projeto." });
        res.json({ mensagem: "Projeto adicionado com sucesso!", id: result.insertId });
      }
    );
  });
});

// --- DELETAR PROJETO ---
app.delete("/projetos/:id", (req, res) => {
  const { email, senha } = req.body;
  const { id } = req.params;
  if (!email || !senha) return res.status(400).json({ mensagem: "Dados incompletos." });
  db.query("SELECT * FROM usuarios WHERE email = ?", [email], async (err, results) => {
    if (err || results.length === 0) return res.status(401).json({ mensagem: "Usuário não encontrado." });
    const ok = await bcrypt.compare(senha, results[0].senha);
    if (!ok) return res.status(401).json({ mensagem: "Senha incorreta." });
    if (results[0].perfil !== "Master") return res.status(403).json({ mensagem: "Acesso negado." });
    db.query("DELETE FROM projetos WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).json({ mensagem: "Erro ao deletar." });
      res.json({ mensagem: "Projeto removido com sucesso!" });
    });
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