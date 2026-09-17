const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: 'https://crsbm.onrender.com',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

// Servir arquivos estáticos (permite abrir /dashboard.html no próprio domínio)
app.use(express.static(__dirname));

// Conexão com o banco MariaDB
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'cbmcrs-lime-clay.sage.cloud.layerbase.dev',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ZyzoZ5v7qnUVJ5hJ7qLK3k1q',
  database: process.env.DB_NAME || 'cbmcrs',
  port: process.env.DB_PORT || 15153,
  ssl: { rejectUnauthorized: false }
});

// ==========================================
// ROTAS DA TABELA: `candidatos` (TAF)
// ==========================================

app.get('/api/candidatos', async (req, res) => {
  try {
    const { termo } = req.query;
    let sql = `
      SELECT 
        c.id, 
        c.codigo_candidato AS idCandidato, 
        c.nome_completo AS nomeCompleto, 
        c.cpf, 
        DATE_FORMAT(c.data_nascimento, '%Y-%m-%d') AS dataNascimento,
        c.telefone, 
        c.email, 
        c.cep, 
        c.logradouro AS endereco, 
        c.numero, 
        c.complemento,
        c.bairro, 
        c.cidade, 
        c.estado,
        t.corrida_tempo AS corridaTempo, 
        t.corrida_situacao AS corridaSituacao,
        t.barra_qtd AS barraQtd, 
        t.barra_situacao AS barraSituacao,
        t.corda_resultado AS cordaResultado, 
        t.corda_situacao AS cordaSituacao,
        t.trave_resultado AS traveResultado, 
        t.trave_situacao AS traveSituacao
      FROM candidatos c
      LEFT JOIN taf_resultados t ON c.id = t.candidato_id
    `;

    const params = [];
    if (termo) {
      sql += ` WHERE c.codigo_candidato LIKE ? OR c.nome_completo LIKE ? OR c.cpf LIKE ?`;
      const t = `%${termo.trim()}%`;
      params.push(t, t, t);
    }
    sql += ` ORDER BY c.id DESC`;

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    console.error('Erro ao consultar candidatos:', err);
    res.status(500).json({ error: 'Erro interno ao consultar candidatos.', detail: err.message });
  }
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

app.put('/api/candidatos/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const {
      idCandidato, nomeCompleto, cpf, dataNascimento, telefone, email,
      cep, endereco, numero, complemento, bairro, cidade, estado,
      corridaTempo, corridaSituacao, barraQtd, barraSituacao,
      cordaResultado, cordaSituacao, traveResultado, traveSituacao
    } = req.body;

    const sqlCandidato = `
      UPDATE candidatos 
      SET codigo_candidato = ?, nome_completo = ?, cpf = ?, data_nascimento = ?, 
          telefone = ?, email = ?, cep = ?, logradouro = ?, numero = ?, 
          complemento = ?, bairro = ?, cidade = ?, estado = ?
      WHERE id = ? OR codigo_candidato = ?
    `;
    await connection.execute(sqlCandidato, [
      idCandidato, nomeCompleto, cpf, dataNascimento, telefone, email,
      cep, endereco, numero, complemento || null, bairro, cidade, estado,
      id, id
    ]);

    const sqlTaf = `
      INSERT INTO taf_resultados 
      (candidato_id, corrida_tempo, corrida_situacao, barra_qtd, barra_situacao, corda_resultado, corda_situacao, trave_resultado, trave_situacao)
      VALUES ((SELECT id FROM candidatos WHERE id = ? OR codigo_candidato = ? LIMIT 1), ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        corrida_tempo = VALUES(corrida_tempo),
        corrida_situacao = VALUES(corrida_situacao),
        barra_qtd = VALUES(barra_qtd),
        barra_situacao = VALUES(barra_situacao),
        corda_resultado = VALUES(corda_resultado),
        corda_situacao = VALUES(corda_situacao),
        trave_resultado = VALUES(trave_resultado),
        trave_situacao = VALUES(trave_situacao)
    `;
    await connection.execute(sqlTaf, [
      id, id,
      corridaTempo || null, corridaSituacao || null,
      barraQtd || null, barraSituacao || null,
      cordaResultado || null, cordaSituacao || null,
      traveResultado || null, traveSituacao || null
    ]);

    await connection.commit();
    res.json({ message: 'Dados do candidato e TAF atualizados com sucesso!' });
  } catch (err) {
    await connection.rollback();
    console.error('Erro ao atualizar registro:', err);
    res.status(500).json({ error: 'Erro ao atualizar dados no banco.', detail: err.message });
  } finally {
    connection.release();
  }
});

// ==========================================
// ROTA DO DASHBOARD: Tabela `candidato`
// ==========================================

app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. Total e Média de Idade
    const [resumoRows] = await pool.query(`
      SELECT 
        COUNT(*) AS totalInscritos,
        COALESCE(ROUND(AVG(TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE())), 1), 0) AS mediaIdade
      FROM candidato
    `);

    // 2. Faixas Etárias
    const [faixasRows] = await pool.query(`
      SELECT 
        faixa, COUNT(*) AS total
      FROM (
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) < 21 THEN '18 a 20'
            WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 21 AND 25 THEN '21 a 25'
            WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 26 AND 30 THEN '26 a 30'
            WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 31 AND 35 THEN '31 a 35'
            ELSE '36+'
          END AS faixa
        FROM candidato
        WHERE data_nascimento IS NOT NULL
      ) t
      GROUP BY faixa
      ORDER BY FIELD(faixa, '18 a 20', '21 a 25', '26 a 30', '31 a 35', '36+')
    `);

    // 3. Estados
    const [estadosRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(estado), ''), 'N/I') AS estado,
        COUNT(*) AS total,
        COALESCE(ROUND(AVG(TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE())), 1), 0) AS mediaIdade
      FROM candidato
      GROUP BY estado
      ORDER BY total DESC
    `);

    // 4. Sexo
    const [sexoRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(sexo), ''), 'N/I') AS sexo,
        COUNT(*) AS total
      FROM candidato
      GROUP BY sexo
      ORDER BY total DESC
    `);

    // 5. Étnico-Racial
    const [etnicoRows] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(declaracao_etnico_racial), ''), 'N/I') AS raca,
        COUNT(*) AS total
      FROM candidato
      GROUP BY declaracao_etnico_racial
      ORDER BY total DESC
    `);

    res.json({
      resumo: resumoRows[0] || { totalInscritos: 0, mediaIdade: 0 },
      faixasEtarias: faixasRows,
      estados: estadosRows,
      sexo: sexoRows,
      etnicoRacial: etnicoRows
    });
  } catch (err) {
    console.error('ERRO DETALHADO na rota /api/dashboard:', err);
    res.status(500).json({ error: 'Erro ao consultar dashboard', detail: err.message });
  }
});

// Inicialização com binding explícito para nuvem (Render)
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
