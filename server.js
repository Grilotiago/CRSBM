const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'cbmcrs-lime-clay.sage.cloud.layerbase.dev',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'ZyzoZ5v7qnUVJ5hJ7qLK3k1q',
  database: process.env.DB_NAME || 'cbmcrs',
  port: process.env.DB_PORT || 15153,
  ssl: { rejectUnauthorized: false }
});

// 1. ROTA DE LISTAGEM / BUSCA (Soluciona o erro 404 ao abrir a busca)
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
    console.error('Erro ao consultar banco de dados:', err);
    res.status(500).json({ error: 'Erro interno ao realizar a consulta.' });
  }
});

// 2. ROTA DE CADASTRO (POST)
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

// 3. ROTA DE EDIÇÃO / ATUALIZAÇÃO (PUT)
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

    // Atualiza Candidato
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

    // Atualiza ou Insere TAF
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

// ROTA PARA O DASHBOARD DEMOGRÁFICO
app.get('/api/dashboard', async (req, res) => {
  try {
    // 1. Métricas Gerais (Total e Média de Idade)
    const [geral] = await pool.query(`
      SELECT 
        COUNT(*) AS totalInscritos,
        ROUND(AVG(TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE())), 1) AS mediaIdade
      FROM candidato
    `);

    // 2. Distribuição por Faixa Etária
    const [faixasEtarias] = await pool.query(`
      SELECT 
        CASE 
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) < 21 THEN '18 a 20'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 21 AND 25 THEN '21 a 25'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 26 AND 30 THEN '26 a 30'
          WHEN TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE()) BETWEEN 31 AND 35 THEN '31 a 35'
          ELSE '36+'
        END AS faixa,
        COUNT(*) AS total
      FROM candidato
      WHERE data_nascimento IS NOT NULL
      GROUP BY faixa
      ORDER BY FIELD(faixa, '18 a 20', '21 a 25', '26 a 30', '31 a 35', '36+')
    `);

    // 3. Distribuição por Estado (UF)
    const [estados] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(estado), ''), 'Não Informado') AS estado,
        COUNT(*) AS total,
        ROUND(AVG(TIMESTAMPDIFF(YEAR, data_nascimento, CURDATE())), 1) AS mediaIdade
      FROM candidato
      GROUP BY estado
      ORDER BY total DESC
    `);

    // 4. Distribuição por Sexo
    const [sexo] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(sexo), ''), 'Não Informado') AS sexo,
        COUNT(*) AS total
      FROM candidato
      GROUP BY sexo
      ORDER BY total DESC
    `);

    // 5. Declaração Étnico-Racial
    const [etnicoRacial] = await pool.query(`
      SELECT 
        COALESCE(NULLIF(TRIM(declaracao_etnico_racial), ''), 'Não Informado') AS raca,
        COUNT(*) AS total
      FROM candidato
      GROUP BY declaracao_etnico_racial
      ORDER BY total DESC
    `);

    res.json({
      resumo: geral[0],
      faixasEtarias,
      estados,
      sexo,
      etnicoRacial
    });
  } catch (err) {
    console.error('Erro ao consultar métricas do dashboard:', err);
    res.status(500).json({ error: 'Erro interno ao consultar dashboard.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
