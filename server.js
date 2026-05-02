require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors"); // Importado apenas uma vez
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const path = require("path");

const app = express();

// --- CONFIGURAÇÃO DO CORS (LIBERA O GITHUB PAGES) ---
app.use(cors());

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const smtpPort = Number(process.env.MAIL_PORT || 587);
const useCustomSmtp = Boolean(process.env.MAIL_HOST);

const emailTransporter = nodemailer.createTransport(
  useCustomSmtp
    ? {
        host: process.env.MAIL_HOST,
        port: smtpPort,
        secure: process.env.MAIL_SECURE === "true" || smtpPort === 465,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {
        service: "gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      },
);

// CONFIGURAÇÃO DO BANCO (AIVEN)
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 14505,
  ssl: {
    rejectUnauthorized: false,
  },
});

// TENTATIVA DE CONEXÃO
db.connect((err) => {
  if (err) {
    console.error("❌ ERRO CRÍTICO NO MYSQL:", err.message);
    return;
  }
  console.log(`✅ Conectado ao banco ${process.env.DB_NAME} no Aiven!`);
  inicializarBanco();
});

function inicializarBanco() {
  const sqlUsuarios = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      nome VARCHAR(120) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      senha VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const sqlProjetos = `
    CREATE TABLE IF NOT EXISTS projetos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      titulo VARCHAR(160) NOT NULL,
      descricao TEXT NOT NULL,
      imagem_url VARCHAR(255) DEFAULT NULL,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const sqlNewsletter = `
    CREATE TABLE IF NOT EXISTS newsletter (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(190) NOT NULL UNIQUE,
      criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  db.query(sqlUsuarios, (err) => {
    if (err) {
      console.error("❌ Erro ao garantir tabela usuarios:", err.message);
      return;
    }
    db.query(sqlProjetos, (errProjetos) => {
      if (errProjetos) {
        console.error(
          "❌ Erro ao garantir tabela projetos:",
          errProjetos.message,
        );
        return;
      }
      db.query(sqlNewsletter, (errNewsletter) => {
        if (errNewsletter) {
          console.error(
            "❌ Erro ao garantir tabela newsletter:",
            errNewsletter.message,
          );
          return;
        }
        console.log("✅ Tabelas essenciais verificadas com sucesso.");
      });
    });
  });
}

// 2. ROTA DE CADASTRO
app.post("/cadastro", async (req, res) => {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: "Preencha nome, e-mail e senha." });
  }
  try {
    const saltRounds = 10;
    const senhaCriptografada = await bcrypt.hash(senha, saltRounds);
    const sql = "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)";
    db.query(sql, [nome, email, senhaCriptografada], (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return res
            .status(409)
            .json({ mensagem: "Este e-mail já está cadastrado." });
        }
        return res.status(500).json({ mensagem: "Erro ao cadastrar usuário." });
      }
      res.status(201).json({ mensagem: "Usuário cadastrado com sucesso!" });
    });
  } catch (erro) {
    res.status(500).json({ mensagem: "Erro ao processar o cadastro." });
  }
});

// 3. ROTA DE LOGIN
app.post("/login", (req, res) => {
  const { email, senha } = req.body;
  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], async (err, results) => {
    if (err || results.length === 0) {
      return res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
    const usuario = results[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (senhaCorreta) {
      res.json({ mensagem: "Login autorizado!", usuario: usuario.nome });
    } else {
      res.status(401).json({ mensagem: "E-mail ou senha incorretos!" });
    }
  });
});

// ROTA DE PROJETOS
app.get("/projetos", (req, res) => {
  const termoBusca = (req.query.q || "").trim();
  const sql = termoBusca
    ? "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?"
    : "SELECT * FROM projetos";
  const params = termoBusca ? [`%${termoBusca}%`, `%${termoBusca}%`] : [];

  db.query(sql, params, (err, results) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA DE BUSCA (Alias)
app.get("/projetos/busca", (req, res) => {
  const termoBusca = (req.query.q || "").trim();
  const sql = "SELECT * FROM projetos WHERE titulo LIKE ? OR descricao LIKE ?";
  db.query(sql, [`%${termoBusca}%`, `%${termoBusca}%`], (err, results) => {
    if (err)
      return res.status(500).json({ mensagem: "Erro ao buscar projetos" });
    res.json(results);
  });
});

// ROTA PARA ALTERAR SENHA
app.post("/alterar-senha", async (req, res) => {
  const { email, senhaAtual, novaSenha } = req.body;

  if (!email || !senhaAtual || !novaSenha) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }

  if (novaSenha.length < 6) {
    return res
      .status(400)
      .json({ mensagem: "A nova senha deve ter pelo menos 6 caracteres." });
  }

  try {
    // Verificar se o usuário existe e a senha atual está correta
    const sql = "SELECT * FROM usuarios WHERE email = ?";
    db.query(sql, [email], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ mensagem: "Usuário não encontrado." });
      }

      const usuario = results[0];
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

      if (!senhaCorreta) {
        return res.status(401).json({ mensagem: "Senha atual incorreta." });
      }

      // Criptografar nova senha
      const saltRounds = 10;
      const novaSenhaCriptografada = await bcrypt.hash(novaSenha, saltRounds);

      // Atualizar senha no banco
      const updateSql = "UPDATE usuarios SET senha = ? WHERE email = ?";
      db.query(
        updateSql,
        [novaSenhaCriptografada, email],
        (updateErr, updateResult) => {
          if (updateErr) {
            return res
              .status(500)
              .json({ mensagem: "Erro ao atualizar senha." });
          }
          res.json({ mensagem: "Senha alterada com sucesso!" });
        },
      );
    });
  } catch (error) {
    res.status(500).json({ mensagem: "Erro ao processar alteração de senha." });
  }
});

// ROTA PARA ALTERAR EMAIL
app.post("/alterar-email", async (req, res) => {
  const { senhaAtual, novoEmail, nomeUsuario } = req.body;

  if (!senhaAtual || !novoEmail || !nomeUsuario) {
    return res.status(400).json({ mensagem: "Preencha todos os campos." });
  }

  if (!/^\S+@\S+\.\S+$/.test(novoEmail)) {
    return res.status(400).json({ mensagem: "E-mail inválido." });
  }

  try {
    // Verificar se o usuário existe e a senha está correta
    const sql = "SELECT * FROM usuarios WHERE nome = ?";
    db.query(sql, [nomeUsuario], async (err, results) => {
      if (err || results.length === 0) {
        return res.status(401).json({ mensagem: "Usuário não encontrado." });
      }

      const usuario = results[0];
      const senhaCorreta = await bcrypt.compare(senhaAtual, usuario.senha);

      if (!senhaCorreta) {
        return res.status(401).json({ mensagem: "Senha atual incorreta." });
      }

      // Verificar se o novo email já está em uso
      const checkEmailSql =
        "SELECT * FROM usuarios WHERE email = ? AND nome != ?";
      db.query(
        checkEmailSql,
        [novoEmail, nomeUsuario],
        (checkErr, checkResults) => {
          if (checkErr) {
            return res
              .status(500)
              .json({ mensagem: "Erro ao verificar e-mail." });
          }

          if (checkResults.length > 0) {
            return res
              .status(409)
              .json({ mensagem: "Este e-mail já está em uso." });
          }

          // Atualizar email no banco
          const updateSql = "UPDATE usuarios SET email = ? WHERE nome = ?";
          db.query(
            updateSql,
            [novoEmail, nomeUsuario],
            (updateErr, updateResult) => {
              if (updateErr) {
                return res
                  .status(500)
                  .json({ mensagem: "Erro ao atualizar e-mail." });
              }
              res.json({ mensagem: "E-mail alterado com sucesso!" });
            },
          );
        },
      );
    });
  } catch (error) {
    res
      .status(500)
      .json({ mensagem: "Erro ao processar alteração de e-mail." });
  }
});

app.post("/alterar-nome", async (req, res) => {
  const { email, novoNome } = req.body;

  if (!email || !novoNome) {
    return res.status(400).json({ mensagem: "Preencha e-mail e novo nome." });
  }

  const sql = "SELECT * FROM usuarios WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ mensagem: "Usuário não encontrado." });
    }

    const updateSql = "UPDATE usuarios SET nome = ? WHERE email = ?";
    db.query(updateSql, [novoNome, email], (updateErr) => {
      if (updateErr) {
        return res.status(500).json({ mensagem: "Erro ao atualizar nome." });
      }
      res.json({ mensagem: "Nome alterado com sucesso!" });
    });
  });
});

// ROTA DE NEWSLETTER
app.post("/newsletter", async (req, res) => {
  const { email } = req.body;
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ mensagem: "E-mail inválido." });
  }

  const insertSql = "INSERT INTO newsletter (email) VALUES (?)";
  db.query(insertSql, [email], async (err) => {
    if (err) {
      if (err.code !== "ER_DUP_ENTRY") {
        return res
          .status(500)
          .json({ mensagem: "Erro ao cadastrar newsletter." });
      }
    }

    try {
      await emailTransporter.sendMail({
        from:
          process.env.MAIL_FROM || `"SustentaTech" <${process.env.MAIL_USER}>`,
        to: email,
        subject: "Bem-vindo(a) à newsletter da SustentaTech!",
        html: `
          <h2>Cadastro confirmado ✅</h2>
          <p>Olá! Seu e-mail foi cadastrado na newsletter da SustentaTech.</p>
          <p>Você receberá novidades sobre projetos, dicas e ações sustentáveis.</p>
        `,
      });
      return res.json({ mensagem: "E-mail enviado com sucesso!" });
    } catch (error) {
      return res.status(500).json({ mensagem: "Erro ao enviar e-mail." });
    }
  });
});

app.post("/newsletter/send", async (req, res) => {
  const { subject, html, key } = req.body;
  const newsletterKey = process.env.NEWSLETTER_KEY;

  if (!newsletterKey || key !== newsletterKey) {
    return res.status(401).json({ mensagem: "Chave de newsletter inválida." });
  }

  if (!subject || !html) {
    return res
      .status(400)
      .json({ mensagem: "Assunto e conteúdo são obrigatórios." });
  }

  const selectSql = "SELECT email FROM newsletter";
  db.query(selectSql, async (err, results) => {
    if (err) {
      return res.status(500).json({ mensagem: "Erro ao buscar assinantes." });
    }

    const emails = results.map((row) => row.email);
    if (emails.length === 0) {
      return res.status(200).json({ mensagem: "Nenhum assinante encontrado." });
    }

    try {
      for (const email of emails) {
        await emailTransporter.sendMail({
          from:
            process.env.MAIL_FROM ||
            `"SustentaTech" <${process.env.MAIL_USER}>`,
          to: email,
          subject,
          html,
        });
      }
      return res.json({
        mensagem: "Newsletter enviada para todos os assinantes.",
        total: emails.length,
      });
    } catch (error) {
      console.error("Erro ao enviar newsletter:", error);
      return res.status(500).json({ mensagem: "Erro ao enviar newsletter." });
    }
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
