const crypto = require("crypto");
const express = require("express");
const path = require("path");

const app = express();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "BARBERFX";
const adminTokens = new Set();

let agendamentos = [];
let profissionais = carregarProfissionaisIniciais();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "agendamento.html"));
});

function carregarProfissionaisIniciais() {
  try {
    if (process.env.PROFISSIONALS_JSON) {
      return JSON.parse(process.env.PROFISSIONALS_JSON);
    }
  } catch (erro) {
    console.error("PROFISSIONALS_JSON invalido:", erro.message);
  }

  return [
    { id: "gil", nome: "Gil", fotoUrl: "" },
    { id: "thiago", nome: "Thiago", fotoUrl: "" },
    { id: "ton", nome: "Ton", fotoUrl: "" },
  ];
}

function exigirAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "");

  if (!adminTokens.has(token)) {
    return res.status(401).json({ sucesso: false, mensagem: "Nao autorizado" });
  }

  next();
}

app.post("/api/admin/login", function (req, res) {
  if (req.body.senha !== ADMIN_PASSWORD) {
    return res.status(401).json({ sucesso: false, mensagem: "Senha incorreta" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  adminTokens.add(token);
  res.json({ sucesso: true, token });
});

app.post("/api/admin/logout", exigirAdmin, function (req, res) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  adminTokens.delete(token);
  res.json({ sucesso: true });
});

app.get("/api/profissionais", function (req, res) {
  res.json(profissionais);
});

app.put("/api/profissionais", exigirAdmin, function (req, res) {
  const lista = Array.isArray(req.body.profissionais) ? req.body.profissionais : [];

  profissionais = lista
    .map(function (profissional, index) {
      return {
        id: profissional.id || String(Date.now()) + "-" + index,
        nome: String(profissional.nome || "").trim(),
        fotoUrl: String(profissional.fotoUrl || "").trim(),
      };
    })
    .filter(function (profissional) {
      return profissional.nome.length > 0;
    });

  res.json({ sucesso: true, profissionais });
});

app.post("/api/agendar", function (req, res) {
  const dados = req.body;
  dados.id = Date.now();
  dados.status = "pendente";
  agendamentos.push(dados);
  res.json({ sucesso: true, agendamento: dados });
});

app.get("/api/agendamentos", exigirAdmin, function (req, res) {
  res.json(agendamentos);
});

app.patch("/api/agendamentos/:id", exigirAdmin, function (req, res) {
  const id = Number(req.params.id);
  const novoStatus = req.body.status;

  if (!["pendente", "confirmado", "cancelado"].includes(novoStatus)) {
    return res.status(400).json({ sucesso: false, mensagem: "Status invalido" });
  }

  const ag = agendamentos.find(function (item) {
    return item.id === id;
  });

  if (!ag) {
    return res.status(404).json({ sucesso: false, mensagem: "Nao encontrado" });
  }

  ag.status = novoStatus;
  res.json({ sucesso: true, agendamento: ag });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Servidor rodando na porta " + PORT);
});
