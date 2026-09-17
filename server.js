<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Consulta de Candidatos e TAF - CBMPR CRS</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #0f172a;
      --primary-light: #1e293b;
      --accent: #0284c7;
      --accent-hover: #0369a1;
      --bg: #f8fafc;
      --surface: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --text-muted: #94a3b8;
      --border: #e2e8f0;
      
      --success-bg: #ecfdf5;
      --success-text: #065f46;
      --success-border: #a7f3d0;
      
      --danger-bg: #fef2f2;
      --danger-text: #991b1b;
      --danger-border: #fecaca;

      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 14px;
      --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.07);
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      background-color: var(--bg);
      color: var(--text-primary);
      padding: 2.5rem 1rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }

    .main-wrapper {
      width: 100%;
      max-width: 980px;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .header-panel {
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
      color: #ffffff;
      padding: 1.75rem 2rem;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 4px solid var(--accent);
      gap: 1rem;
    }

    .header-content h1 {
      font-size: 1.4rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      display: flex;
      align-items: center;
      gap: 0.6rem;
    }

    .header-content p {
      margin-top: 0.3rem;
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex-shrink: 0;
    }

    .btn-voltar {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.9rem;
      background: rgba(255, 255, 255, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: var(--radius-sm);
      color: #ffffff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }

    .btn-voltar:hover {
      background: rgba(255, 255, 255, 0.22);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateX(-2px);
    }

    .badge-institucional {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      padding: 0.45rem 0.8rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #cbd5e1;
    }

    .filter-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      padding: 1.5rem 1.75rem;
      box-shadow: var(--shadow-sm);
      border: 1px solid var(--border);
    }

    .form-grid {
      display: grid;
      grid-template-columns: 2fr 1.2fr 1fr;
      gap: 1.25rem;
      align-items: end;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .form-group label {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-wrapper svg {
      position: absolute;
      left: 0.85rem;
      width: 1.1rem;
      height: 1.1rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .input-wrapper input,
    .form-group select {
      width: 100%;
      height: 44px;
      padding: 0 0.85rem;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.925rem;
      color: var(--text-primary);
      background-color: #ffffff;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input-wrapper input {
      padding-left: 2.5rem;
    }

    .input-wrapper input:focus,
    .form-group select:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15);
    }

    .actions-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      height: 44px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0 1.25rem;
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      cursor: pointer;
      border: none;
      transition: background-color 0.2s;
      white-space: nowrap;
    }

    .btn-primary {
      background-color: var(--accent);
      color: #ffffff;
      flex: 1;
    }

    .btn-primary:hover {
      background-color: var(--accent-hover);
    }

    .btn-secondary {
      background-color: #f1f5f9;
      color: var(--text-secondary);
      border: 1px solid var(--border);
    }

    .btn-secondary:hover {
      background-color: #e2e8f0;
      color: var(--text-primary);
    }

    .results-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.85rem;
      color: var(--text-secondary);
      padding: 0 0.25rem;
    }

    .candidatos-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .candidato-card {
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-sm);
      overflow: hidden;
    }

    .card-header {
      padding: 1.1rem 1.5rem;
      background: #fafafa;
      border-bottom: 1px solid var(--border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .candidato-identificacao h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .candidato-codigo {
      display: inline-block;
      margin-top: 0.2rem;
      font-size: 0.78rem;
      font-family: monospace;
      background: #e2e8f0;
      color: var(--text-secondary);
      padding: 0.15rem 0.45rem;
      border-radius: 4px;
    }

    .card-body {
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .info-section-title {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted);
      margin-bottom: 0.65rem;
    }

    .dados-pessoais-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 0.75rem 1.25rem;
    }

    .dado-item {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .dado-item span.rotulo {
      font-size: 0.75rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 500;
    }

    .dado-item span.valor {
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .taf-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.85rem;
    }

    .taf-card-item {
      background: #f8fafc;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .taf-prova {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .taf-detalhe {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .taf-marca {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.55rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.02em;
    }

    .badge-apto {
      background-color: var(--success-bg);
      color: var(--success-text);
      border: 1px solid var(--success-border);
    }

    .badge-inapto {
      background-color: var(--danger-bg);
      color: var(--danger-text);
      border: 1px solid var(--danger-border);
    }

    .badge-nd {
      background-color: #f1f5f9;
      color: #64748b;
      border: 1px solid #cbd5e1;
    }

    .state-box {
      text-align: center;
      padding: 3rem 1.5rem;
      background: var(--surface);
      border-radius: var(--radius-lg);
      border: 1.5px dashed var(--border);
      color: var(--text-secondary);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .state-box svg {
      width: 36px;
      height: 36px;
      color: var(--text-muted);
    }

    .spinner {
      width: 30px;
      height: 30px;
      border: 3px solid rgba(2, 132, 199, 0.2);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .form-grid {
        grid-template-columns: 1fr;
      }
      .header-panel {
        flex-direction: column;
        align-items: stretch;
        gap: 1.25rem;
      }
      .header-actions {
        justify-content: space-between;
      }
      .actions-group {
        width: 100%;
      }
    }
  </style>
</head>
<body>

  <div class="main-wrapper">
    <header class="header-panel">
      <div class="header-content">
        <h1>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          Consulta de Candidatos & TAF
        </h1>
        <p>Centro de Recrutamento e Seleção — CBMPR</p>
      </div>

      <div class="header-actions">
        <button type="button" class="btn-voltar" onclick="voltarTelaAnterior()" title="Voltar para a tela anterior">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Voltar
        </button>
        <span class="badge-institucional">Acesso Oficial</span>
      </div>
    </header>

    <section class="filter-card">
      <form id="formBusca">
        <div class="form-grid">
          <div class="form-group">
            <label for="termoBusca">Identificação</label>
            <div class="input-wrapper">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input type="text" id="termoBusca" placeholder="Código ID, Nome ou CPF..." required autocomplete="off">
            </div>
          </div>

          <div class="form-group">
            <label for="filtroSituacao">Refinamento TAF</label>
            <select id="filtroSituacao">
              <option value="todos">Todos os Status</option>
              <option value="apto">Apenas Apto Geral</option>
              <option value="inapto">Apenas Inapto Geral</option>
            </select>
          </div>

          <div class="form-group">
            <label>&nbsp;</label>
            <div class="actions-group">
              <button type="submit" class="btn btn-primary">Buscar</button>
              <button type="button" id="btnLimpar" class="btn btn-secondary" title="Limpar formulário">Limpar</button>
            </div>
          </div>
        </div>
      </form>
    </section>

    <div class="results-meta" id="resultsMeta" style="display: none;">
      <span id="contadorResultados">0 registro(s)</span>
      <span>Base Oficial CBMPR</span>
    </div>

    <main class="candidatos-list" id="resultados">
      <div class="state-box">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <p>Informe o Código ID, Nome ou CPF e clique em <strong>Buscar</strong>.</p>
      </div>
    </main>
  </div>

  <script>
    function voltarTelaAnterior() {
      if (document.referrer && document.referrer !== window.location.href) {
        window.history.back();
      } else if (window.history.length > 1) {
        window.history.back();
      } else {
        // Se a página foi aberta diretamente em nova guia ou popup
        window.close();
      }
    }

    const formBusca = document.getElementById('formBusca');
    const inputTermo = document.getElementById('termoBusca');
    const filtroSituacao = document.getElementById('filtroSituacao');
    const btnLimpar = document.getElementById('btnLimpar');
    const resultadosDiv = document.getElementById('resultados');
    const resultsMeta = document.getElementById('resultsMeta');
    const contadorResultados = document.getElementById('contadorResultados');

    const API_URL = 'https://cbm-palz.onrender.com/api/candidatos';
    let candidatosEmCache = [];

    formBusca.addEventListener('submit', async (e) => {
      e.preventDefault();
      const termo = inputTermo.value.trim();

      if (!termo) return;

      resultsMeta.style.display = 'none';
      resultadosDiv.innerHTML = `
        <div class="state-box">
          <div class="spinner"></div>
          <p>Consultando base de dados...</p>
        </div>
      `;

      try {
        const response = await fetch(`${API_URL}?termo=${encodeURIComponent(termo)}`);
        
        if (!response.ok) {
          const erroTexto = await response.text();
          throw new Error(`Servidor respondeu com código ${response.status}: ${erroTexto}`);
        }

        const data = await response.json();
        candidatosEmCache = Array.isArray(data) ? data : (data.candidatos || data.dados || []);
        aplicarFiltrosERenderizar();

      } catch (error) {
        console.error('Falha na consulta:', error);
        resultadosDiv.innerHTML = `
          <div class="state-box" style="border-color: var(--danger-border); color: var(--danger-text);">
            <p><strong>Erro ao carregar dados:</strong></p>
            <p style="font-size: 0.85rem; max-width: 500px;">${error.message}</p>
          </div>
        `;
      }
    });

    filtroSituacao.addEventListener('change', () => {
      if (candidatosEmCache.length > 0) {
        aplicarFiltrosERenderizar();
      }
    });

    btnLimpar.addEventListener('click', () => {
      inputTermo.value = '';
      filtroSituacao.value = 'todos';
      candidatosEmCache = [];
      resultsMeta.style.display = 'none';
      resultadosDiv.innerHTML = `
        <div class="state-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>Informe o Código ID, Nome ou CPF e clique em <strong>Buscar</strong>.</p>
        </div>
      `;
      inputTermo.focus();
    });

    function aplicarFiltrosERenderizar() {
      const situacao = filtroSituacao.value;
      let filtrados = [...candidatosEmCache];

      if (situacao !== 'todos') {
        filtrados = filtrados.filter(c => {
          const provas = [
            c.corridaSituacao || c.corrida_situacao,
            c.barraSituacao || c.barra_situacao,
            c.cordaSituacao || c.corda_situacao,
            c.traveSituacao || c.trave_situacao
          ];
          const temInapto = provas.some(s => s && s.toLowerCase() === 'inapto');
          if (situacao === 'inapto') return temInapto;
          if (situacao === 'apto') return !temInapto && provas.every(s => s && s.toLowerCase() === 'apto');
          return true;
        });
      }

      resultsMeta.style.display = 'flex';
      contadorResultados.innerText = `${filtrados.length} candidato(s) encontrado(s)`;

      if (filtrados.length === 0) {
        resultadosDiv.innerHTML = `
          <div class="state-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <p>Nenhum registro encontrado para os critérios selecionados.</p>
          </div>
        `;
        return;
      }

      renderCards(filtrados);
    }

    function renderCards(candidatos) {
      resultadosDiv.innerHTML = candidatos.map(c => {
        const corridaSit = c.corridaSituacao || c.corrida_situacao;
        const barraSit = c.barraSituacao || c.barra_situacao;
        const cordaSit = c.cordaSituacao || c.corda_situacao;
        const traveSit = c.traveSituacao || c.trave_situacao;

        const provas = [corridaSit, barraSit, cordaSit, traveSit];
        const statusGeral = provas.some(s => s && s.toLowerCase() === 'inapto') 
          ? '<span class="badge badge-inapto">Inapto no TAF</span>' 
          : (provas.every(s => s && s.toLowerCase() === 'apto') ? '<span class="badge badge-apto">Apto Geral</span>' : '<span class="badge badge-nd">Em Avaliação</span>');

        return `
          <article class="candidato-card">
            <header class="card-header">
              <div class="candidato-identificacao">
                <h3>${c.nomeCompleto || c.nome_completo || 'Sem Nome'}</h3>
                <span class="candidato-codigo">${c.idCandidato || c.codigo_candidato || 'NÃO INFORMADO'}</span>
              </div>
              <div>${statusGeral}</div>
            </header>

            <div class="card-body">
              <div>
                <div class="info-section-title">Dados Cadastrais</div>
                <div class="dados-pessoais-grid">
                  <div class="dado-item">
                    <span class="rotulo">CPF</span>
                    <span class="valor">${c.cpf || '—'}</span>
                  </div>
                  <div class="dado-item">
                    <span class="rotulo">E-mail</span>
                    <span class="valor">${c.email || '—'}</span>
                  </div>
                  <div class="dado-item">
                    <span class="rotulo">Telefone</span>
                    <span class="valor">${c.telefone || '—'}</span>
                  </div>
                  <div class="dado-item">
                    <span class="rotulo">Localidade</span>
                    <span class="valor">${c.cidade || '—'} / ${c.estado || '—'}</span>
                  </div>
                </div>
              </div>

              <div>
                <div class="info-section-title">Resultados TAF</div>
                <div class="taf-grid">
                  <div class="taf-card-item">
                    <span class="taf-prova">Corrida 2.400m</span>
                    <div class="taf-detalhe">
                      <span class="taf-marca">${c.corridaTempo || c.corrida_tempo || '—'}</span>
                      ${getBadge(corridaSit)}
                    </div>
                  </div>

                  <div class="taf-card-item">
                    <span class="taf-prova">Barra Fixa</span>
                    <div class="taf-detalhe">
                      <span class="taf-marca">${(c.barraQtd !== undefined && c.barraQtd !== null) ? c.barraQtd + ' reps' : (c.barra_qtd ? c.barra_qtd + ' reps' : '—')}</span>
                      ${getBadge(barraSit)}
                    </div>
                  </div>

                  <div class="taf-card-item">
                    <span class="taf-prova">Subida na Corda</span>
                    <div class="taf-detalhe">
                      <span class="taf-marca">${c.cordaResultado || c.corda_resultado || '—'}</span>
                      ${getBadge(cordaSit)}
                    </div>
                  </div>

                  <div class="taf-card-item">
                    <span class="taf-prova">Trave Suspensa</span>
                    <div class="taf-detalhe">
                      <span class="taf-marca">${c.traveResultado || c.trave_resultado || '—'}</span>
                      ${getBadge(traveSit)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </article>
        `;
      }).join('');
    }

    function getBadge(situacao) {
      if (!situacao) return '<span class="badge badge-nd">N/D</span>';
      const s = situacao.toLowerCase();
      if (s === 'apto') return '<span class="badge badge-apto">Apto</span>';
      if (s === 'inapto') return '<span class="badge badge-inapto">Inapto</span>';
      return `<span class="badge badge-nd">${situacao}</span>`;
    }
  </script>
</body>
</html>
