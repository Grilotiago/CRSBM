const express = require('express');
const mysql = require('mysql2/promise'); // Utilizando promise para transações async/await
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'cbmcrs-lime-clay.sage.cloud.layerbase.dev',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ZyzoZ5v7qnUVJ5hJ7qLK3k1q',
  database: process.env.DB_NAME || 'cbmcrs',
  port: process.env.DB_PORT || 15153,
  ssl: { rejectUnauthorized: false }
});

app.post('/api/candidatos', async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      idCandidato, nomeCompleto, cpf, dataNascimento, telefone, email,
      cep, endereco, numero, complemento, bairro, cidade, estado,
      corridaTempo, corridaSituacao, barraQtd, barraSituacao,
      cordaResultado, cordaSituacao, traveResultado, traveSituacao
    } = req.body;

    // 1. Insere o Candidato
    const sqlCandidato = `
      INSERT INTO candidatos 
      (codigo_candidato, nome_completo, cpf, data_nascimento, telefone, email, cep, logradouro, numero, complemento, bairro, cidade, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const [resCandidato] = await connection.execute(sqlCandidato, [
      idCandidato, nomeCompleto, cpf, dataNascimento, telefone, email,
      cep, endereco, numero, complemento || null, bairro, cidade, estado
    ]);

    const candidatoId = resCandidato.insertId;

    // 2. Insere os dados do TAF vinculado ao candidato
    const sqlTaf = `
      INSERT INTO taf_resultados
      (candidato_id, corrida_tempo, corrida_situacao, barra_qtd, barra_situacao, corda_resultado, corda_situacao, trave_resultado, trave_situacao)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await connection.execute(sqlTaf, [
      candidatoId,
      corridaTempo || null, corridaSituacao || null,
      barraQtd || null, barraSituacao || null,
      cordaResultado || null, cordaSituacao || null,
      traveResultado || null, traveSituacao || null
    ]);

    await connection.commit();
    res.status(201).json({ message: 'Candidato e TAF cadastrados com sucesso!' });

  } catch (err) {
    await connection.rollback();
    console.error('Erro ao salvar no banco:', err);
    res.status(500).json({ error: 'Erro ao salvar os dados no MariaDB.', detail: err.message });
  } finally {
    connection.release();
  }
});

// Rota para consultar candidatos por ID, Nome ou CPF
app.get('/api/candidatos/buscar', async (req, res) => {
  const { termo } = req.query;

  if (!termo) {
    return res.status(400).json({ error: 'Informe um termo para busca (ID, Nome ou CPF).' });
  }

  try {
    // Busca combinando candidatos com seus resultados do TAF
    const sql = `
      SELECT 
        c.id, c.codigo_candidato, c.nome_completo, c.cpf, c.data_nascimento,
        c.telefone, c.email, c.cep, c.logradouro, c.numero, c.complemento,
        c.bairro, c.cidade, c.estado, c.criado_em,
        t.corrida_tempo, t.corrida_situacao,
        t.barra_qtd, t.barra_situacao,
        t.corda_resultado, t.corda_situacao,
        t.trave_resultado, t.trave_situacao
      FROM candidatos c
      LEFT JOIN taf_resultados t ON c.id = t.candidato_id
      WHERE c.codigo_candidato LIKE ? 
         OR c.nome_completo LIKE ? 
         OR c.cpf LIKE ?
      ORDER BY c.id DESC
    `;

    const termoBusca = `%${termo.trim()}%`;
    const [rows] = await pool.query(sql, [termoBusca, termoBusca, termoBusca]);

    res.json(rows);
  } catch (err) {
    console.error('Erro ao consultar banco de dados:', err);
    res.status(500).json({ error: 'Erro interno ao realizar a consulta.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
