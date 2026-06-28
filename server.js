const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, "agendamento.html"));
});

let agendamentos = [];

app.post("/api/agendar", function (req, res) {
  let dados = req.body;
  dados.id = Date.now();
  agendamentos.push(dados);
  console.log("Novo agendamento:", dados);
  res.json({ sucesso: true, agendamento: dados });
});

app.get("/api/agendamentos", function (req, res) {
  res.json(agendamentos);
});

app.patch("/api/agendamentos/:id", function (req, res) {
  let id = parseInt(req.params.id);
  let novoStatus = req.body.status;
  let ag = agendamentos.find(function (a) {
    return a.id === id;
  });
  if (!ag) {
    return res.json({ sucesso: false, mensagem: "Não encontrado" });
  }
  ag.status = novoStatus;
  console.log("Status atualizado:", ag.nome, "->", novoStatus);
  res.json({ sucesso: true, agendamento: ag });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, function () {
  console.log("Servidor rodando na porta " + PORT);
});
