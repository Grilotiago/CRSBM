const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
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
2. dashboard.html (Definitivo)
HTML


<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dashboard Demográfico - Candidatos</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --primary: #3b82f6;
      --secondary: #10b981;
      --accent: #f59e0b;
      --purple: #8b5cf6;
      --border: #334155;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      padding: 24px;
    }

    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .badge {
      font-size: 0.85rem;
      padding: 6px 14px;
      border-radius: 999px;
      background: #1e293b;
      border: 1px solid var(--border);
      color: var(--secondary);
    }

    .btn-refresh {
      background: var(--primary);
      color: #fff;
      border: none;
      padding: 7px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      transition: opacity 0.2s;
    }
    .btn-refresh:hover { opacity: 0.9; }

    .kpis {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      padding: 18px 20px;
      border-radius: 12px;
    }

    .kpi-card .label { font-size: 0.85rem; color: var(--text-muted); }
    .kpi-card .val { font-size: 1.8rem; font-weight: 700; margin-top: 6px; color: var(--primary); }

    .grid-charts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }

    .card-chart {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
    }

    .card-chart h3 {
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--text-muted);
      margin-bottom: 16px;
    }

    .chart-container {
      position: relative;
      height: 280px;
      width: 100%;
    }

    .table-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 20px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.9rem;
      text-align: left;
    }

    th, td {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
    }

    th { color: var(--text-muted); font-weight: 600; }
  </style>
</head>
<body>

  <header>
    <div>
      <h1 style="font-size: 1.6rem; font-weight: 700;">Dashboard de Inscritos</h1>
      <p style="color: var(--text-muted); font-size: 0.9rem;">Visão demográfica conectada ao Render (<code>crsbm</code>)</p>
    </div>
    <div class="header-actions">
      <button class="btn-refresh" onclick="carregarDashboard()">↻ Atualizar</button>
      <div id="status-conn" class="badge">Conectando...</div>
    </div>
  </header>

  <!-- Métricas Rápidas -->
  <section class="kpis">
    <div class="kpi-card">
      <div class="label">Total de Inscritos</div>
      <div class="val" id="kpi-total">0</div>
    </div>
    <div class="kpi-card">
      <div class="label">Média de Idade</div>
      <div class="val" id="kpi-idade">0 anos</div>
    </div>
    <div class="kpi-card">
      <div class="label">Estados Representados</div>
      <div class="val" id="kpi-estados">0</div>
    </div>
    <div class="kpi-card">
      <div class="label">Maioria Étnico-Racial</div>
      <div class="val" id="kpi-top-raca" style="font-size: 1.3rem; margin-top: 10px;">-</div>
    </div>
  </section>

  <!-- Gráficos -->
  <section class="grid-charts">
    <div class="card-chart">
      <h3>Distribuição por Sexo</h3>
      <div class="chart-container">
        <canvas id="chartSexo"></canvas>
      </div>
    </div>

    <div class="card-chart">
      <h3>Faixa Etária (Idade)</h3>
      <div class="chart-container">
        <canvas id="chartIdade"></canvas>
      </div>
    </div>

    <div class="card-chart">
      <h3>Declaração Étnico-Racial</h3>
      <div class="chart-container">
        <canvas id="chartEtnico"></canvas>
      </div>
    </div>

    <div class="card-chart">
      <h3>Inscritos por Estado (UF)</h3>
      <div class="chart-container">
        <canvas id="chartEstados"></canvas>
      </div>
    </div>
  </section>

  <!-- Tabela Detalhada por Estado -->
  <section class="table-card">
    <h3 style="font-size: 0.95rem; text-transform: uppercase; color: var(--text-muted); margin-bottom: 12px;">
      Detalhamento Geográfico e Médias de Idade
    </h3>
    <table>
      <thead>
        <tr>
          <th>Estado (UF)</th>
          <th>Total de Candidatos</th>
          <th>Participação (%)</th>
          <th>Média de Idade</th>
        </tr>
      </thead>
      <tbody id="tabela-estados">
        <tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Aguardando dados...</td></tr>
      </tbody>
    </table>
  </section>

  <script>
    // URL apontando para o Render crsbm
    const API_URL = (window.location.hostname.includes('onrender.com'))
      ? '/api/dashboard'
      : 'https://crsbm.onrender.com/api/dashboard';

    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, sans-serif';

    let chartInstances = {};

    async function carregarDashboard() {
      const status = document.getElementById('status-conn');
      status.textContent = '● Consultando API...';
      status.style.color = '#f59e0b';

      try {
        const res = await fetch(`${API_URL}?_t=${Date.now()}`);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        const data = await res.json();

        status.textContent = '● Online (Render crsbm)';
        status.style.color = '#10b981';

        atualizarKPIs(data);
        renderizarGraficos(data);
        renderizarTabela(data);
      } catch (err) {
        console.error('Falha de conexão com a API:', err);
        status.textContent = '● Servidor inicializando (aguarde 30s)...';
        status.style.color = '#ef4444';
      }
    }

    function atualizarKPIs(data) {
      document.getElementById('kpi-total').textContent = data.resumo?.totalInscritos ?? 0;
      document.getElementById('kpi-idade').textContent = (data.resumo?.mediaIdade ?? 0) + ' anos';
      document.getElementById('kpi-estados').textContent = data.estados?.length ?? 0;
      
      const topRaca = (data.etnicoRacial && data.etnicoRacial.length > 0) ? data.etnicoRacial[0] : null;
      document.getElementById('kpi-top-raca').textContent = topRaca ? `${topRaca.raca} (${topRaca.total})` : '-';
    }

    function criarOuAtualizarChart(id, config) {
      if (chartInstances[id]) {
        chartInstances[id].destroy();
      }
      const canvas = document.getElementById(id);
      if (canvas) {
        chartInstances[id] = new Chart(canvas, config);
      }
    }

    function renderizarGraficos(data) {
      // 1. Sexo
      criarOuAtualizarChart('chartSexo', {
        type: 'doughnut',
        data: {
          labels: (data.sexo || []).map(s => s.sexo),
          datasets: [{
            data: (data.sexo || []).map(s => s.total),
            backgroundColor: ['#3b82f6', '#ec4899', '#94a3b8', '#10b981'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });

      // 2. Faixa Etária
      criarOuAtualizarChart('chartIdade', {
        type: 'bar',
        data: {
          labels: (data.faixasEtarias || []).map(f => f.faixa),
          datasets: [{
            label: 'Inscritos',
            data: (data.faixasEtarias || []).map(f => f.total),
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: '#334155' } },
            x: { grid: { display: false } }
          }
        }
      });

      // 3. Étnico-Racial
      criarOuAtualizarChart('chartEtnico', {
        type: 'doughnut',
        data: {
          labels: (data.etnicoRacial || []).map(r => r.raca),
          datasets: [{
            data: (data.etnicoRacial || []).map(r => r.total),
            backgroundColor: ['#f59e0b', '#8b5cf6', '#06b6d4', '#64748b'],
            borderWidth: 0
          }]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });

      // 4. Estados
      criarOuAtualizarChart('chartEstados', {
        type: 'bar',
        data: {
          labels: (data.estados || []).map(e => e.estado),
          datasets: [{
            label: 'Total por UF',
            data: (data.estados || []).map(e => e.total),
            backgroundColor: '#3b82f6',
            borderRadius: 4
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, grid: { color: '#334155' } },
            y: { grid: { display: false } }
          }
        }
      });
    }

    function renderizarTabela(data) {
      const tbody = document.getElementById('tabela-estados');
      tbody.innerHTML = '';
      const totalGeral = data.resumo?.totalInscritos || 1;

      if (!data.estados || data.estados.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color: var(--text-muted);">Nenhum candidato encontrado.</td></tr>';
        return;
      }

      data.estados.forEach(item => {
        const perc = ((item.total / totalGeral) * 100).toFixed(1);
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 600; color: #f8fafc;">${item.estado}</td>
          <td>${item.total}</td>
          <td>${perc}%</td>
          <td>${item.mediaIdade ? item.mediaIdade + ' anos' : 'N/I'}</td>
        `;
        tbody.appendChild(tr);
      });
    }

    window.onload = () => {
      carregarDashboard();
      // Atualização periódica automática a cada 15 segundos
      setInterval(carregarDashboard, 15000);
    };
  </script>
</body>
</html>
