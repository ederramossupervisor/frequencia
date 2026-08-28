// ACOMPANHAMENTO.JS - VERSÃO COMPLETA COM CAMPOS SIMPLES
let acompanhamentoState = {
    mesAtual: '',
    dataJustificativa: getDataAtualBrasiliaISO(), // Formato ISO "aaaa-mm-dd" no fuso de Brasília
    rascunhoEmEdicaoId: null // id da "saída rápida" (localStorage) sendo finalizada no formulário, se houver
};

function initAcompanhamento() {
    console.log('Inicializando aba Acompanhamento...');
    document.querySelector('#acompanhamento .loading')?.remove();
    acompanhamentoState.mesAtual = obterMesAtual();
    
    carregarInterfaceAcompanhamento();
    configurarEventListenersAcompanhamento();
    atualizarEstatisticas();
    
    console.log('Aba Acompanhamento inicializada');
}

function carregarInterfaceAcompanhamento() {
    const container = document.getElementById('acompanhamento');
    
    if (!container) return;
    
    const config = verificarConfiguracoesMinimas();
    
    if (!config.todasConfiguradas) {
        container.innerHTML = mostrarMensagemConfiguracaoAcompanhamento();
        return;
    }
    
    container.innerHTML = `
        <!-- Saída Rápida: registra só a hora agora, finaliza depois -->
        <div class="card mb-3">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-door-open"></i>
                    Saída Rápida
                </h2>
                <span class="badge badge-info">Registrar agora, finalizar depois</span>
            </div>
            <div class="card-body" id="rascunhosJustificativaContainer">
                ${renderRascunhosJustificativaHTML()}
            </div>
        </div>

        <div class="grid grid-2">
            <!-- Formulário de Justificativa -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-file-alt"></i>
                        Nova Justificativa
                    </h2>
                    <span class="badge badge-info">Justificar horários</span>
                </div>
                <div class="card-body">
                    <!-- Data da Justificativa -->
                    <div class="form-group">
                        <label class="form-label" for="dataJustificativa">
                            <i class="fas fa-calendar-day"></i>
                            Data da Justificativa
                        </label>
                        <input 
                            type="date" 
                            class="form-control" 
                            id="dataJustificativa"
                            value="${getDataAtualBrasiliaISO()}"
                        >
                        <small class="form-text">Data em que ocorreu a justificativa</small>
                    </div>
                    
                    <!-- Mês de Referência -->
                    <div class="form-group">
                        <label class="form-label" for="selectMesJustificativa">
                            <i class="fas fa-calendar-alt"></i>
                            Mês da Planilha
                        </label>
                        <select class="form-control" id="selectMesJustificativa">
                            ${CONFIG.MESES.map(mes => 
                                `<option value="${mes}" ${mes === acompanhamentoState.mesAtual ? 'selected' : ''}>
                                    ${mes}
                                </option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Mês correspondente na planilha</small>
                    </div>
                    
                    <!-- Código da Justificativa -->
                    <div class="form-group">
                        <label class="form-label" for="codigoJustificativa">
                            <i class="fas fa-code"></i>
                            Código da Justificativa
                        </label>
                        <select class="form-control" id="codigoJustificativa" required>
                            <option value="">Selecione um código...</option>
                            ${CONFIG.CODIGOS_JUSTIFICATIVA.map(item => 
                                `<option value="${item.codigo}" data-desc="${item.descricao}">
                                    ${item.codigo} - ${item.descricao}
                                </option>`
                            ).join('')}
                        </select>
                        <small class="form-text">Código que será salvo na coluna I</small>
                        <div id="codigoHelp" class="text-danger" style="display: none; font-size: 0.9rem; margin-top: 5px;">
                            ⚠️ Por favor, selecione um código
                        </div>
                    </div>
                    
                    <!-- Horários da Justificativa - VERSÃO SIMPLES -->
                    <div class="grid grid-2 gap-3">
                        <div class="form-group">
                            <div class="form-label-row">
                                <label class="form-label" for="horaInicioJustificativa">
                                    <i class="fas fa-play-circle"></i>
                                    Hora Início
                                </label>
                                <button type="button" class="btn-agora" onclick="preencherHoraAtual('horaInicioJustificativa')" title="Preencher com a hora atual">
                                    <i class="fas fa-clock"></i> Agora
                                </button>
                            </div>
                            <input type="time" 
                                   class="form-control" 
                                   id="horaInicioJustificativa"
                                   value="08:00">
                            <!-- Campo texto será criado AUTOMATICAMENTE pelo JavaScript -->
                        </div>
                        
                        <div class="form-group">
                            <div class="form-label-row">
                                <label class="form-label" for="horaFimJustificativa">
                                    <i class="fas fa-stop-circle"></i>
                                    Hora Fim
                                </label>
                                <button type="button" class="btn-agora" onclick="preencherHoraAtual('horaFimJustificativa')" title="Preencher com a hora atual">
                                    <i class="fas fa-clock"></i> Agora
                                </button>
                            </div>
                            <input type="time" 
                                   class="form-control" 
                                   id="horaFimJustificativa"
                                   value="17:00">
                            <!-- Campo texto será criado AUTOMATICAMENTE pelo JavaScript -->
                        </div>
                    </div>
                    
                    <!-- Horário de Almoço -->
                    <div class="form-group">
                        <div class="form-check">
                            <input 
                                class="form-check-input" 
                                type="checkbox" 
                                id="fezAlmoco"
                                checked
                            >
                            <label class="form-check-label" for="fezAlmoco">
                                <i class="fas fa-utensils"></i>
                                Descontar horário de almoço
                            </label>
                        </div>
                        <div class="form-group mt-2" id="duracaoAlmocoWrapper">
                            <label class="form-label" for="duracaoAlmoco" style="font-size:0.8rem;">
                                Duração do almoço
                            </label>
                            <input type="time" 
                                   class="form-control" 
                                   id="duracaoAlmoco" 
                                   value="01:00"
                                   style="max-width:140px;">
                        </div>
                        <small class="text-muted">
                            Ajuste o tempo caso o almoço não tenha sido de 1 hora
                        </small>
                    </div>
                    
                    <!-- Cálculo Automático -->
                    <div class="card mt-3">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-calculator"></i>
                                Cálculo de Horas
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="grid grid-3 text-center">
                                <div>
                                    <div class="stat-number" id="horasBrutas">09:00</div>
                                    <small class="text-muted">Horas totais</small>
                                </div>
                                <div>
                                    <div class="stat-number" id="descontoAlmoco">01:00</div>
                                    <small class="text-muted">Almoço</small>
                                </div>
                                <div>
                                    <div class="stat-number" id="horasLiquidas">08:00</div>
                                    <small class="text-muted">Horas líquidas</small>
                                </div>
                            </div>
                            <small class="text-muted d-block mt-2 text-center" id="textoCalculo">
                                Das 08:00 às 17:00 = 9 horas - 1 hora almoço = 8 horas
                            </small>
                        </div>
                    </div>
                    
                    <!-- Campo de Observação (OBRIGATÓRIO) -->
                    <div class="form-group mt-3">
                        <label class="form-label" for="observacaoJustificativa">
                            <i class="fas fa-edit"></i>
                            Observação <span style="color: red;">*</span>
                        </label>
                        <textarea 
                            class="form-control" 
                            id="observacaoJustificativa"
                            rows="3"
                            placeholder="Digite a observação (obrigatório)..."
                            maxlength="200"
                            required
                            oninput="validarObservacao()"
                        ></textarea>
                        <small class="form-text text-danger" id="obsError" style="display: none;">
                            <i class="fas fa-exclamation-circle"></i> Este campo é obrigatório
                        </small>
                        <small class="form-text">
                            Esta observação será salva na planilha de acompanhamento
                        </small>
                    </div>
                    
                    <!-- Botões PRINCIPAIS -->
                    <div class="grid grid-2 gap-2 mt-4">
                        <button class="btn btn-secondary" id="btnLimparJustificativa">
                            <i class="fas fa-eraser"></i>
                            Limpar
                        </button>
                        <button class="btn btn-primary" id="btnSalvarJustificativa">
                            <i class="fas fa-save"></i>
                            Salvar Justificativa
                        </button>
                    </div>
                    
                    <!-- Botão para ABRIR PLANILHA -->
                    <div class="mt-3">
                        <button class="btn btn-outline-success btn-block" id="btnAbrirPlanilhaAcompanhamento">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir Minha Planilha de Acompanhamento
                        </button>
                        <small class="text-muted d-block mt-1 text-center">
                            Abre sua planilha no Google Sheets para verificar os dados
                        </small>
                    </div>
                    
                    <!-- Botão de Teste Temporário -->
                    <div class="mt-3">
                        <button class="btn btn-warning btn-sm" id="btnTesteJustificativa">
                            <i class="fas fa-vial"></i>
                            Testar Seleção de Código
                        </button>
                    </div>
                    
                    <!-- Informações -->
                    <div class="alert alert-info mt-3">
                        <i class="fas fa-info-circle"></i>
                        <div>
                            <strong>Onde os dados serão salvos:</strong>
                            <ul class="mb-0 mt-1">
                                <li><strong>Coluna I</strong> da planilha de Frequência: Código da justificativa</li>
                                <li><strong>Coluna J</strong> da planilha de Frequência: Horas líquidas calculadas</li>
                                <li><strong>Planilha de Acompanhamento</strong>: Detalhes completos da justificativa</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Painel de Informações -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-info-circle"></i>
                        Informações sobre Justificativas
                    </h2>
                </div>
                <div class="card-body">
                    <!-- Lista de Códigos -->
                    <div class="mb-4">
                        <h3 class="card-title">
                            <i class="fas fa-list"></i>
                            Códigos de Justificativa
                        </h3>
                        <div class="table-responsive">
                            <table class="table table-sm">
                                <thead>
                                    <tr>
                                        <th>Código</th>
                                        <th>Descrição</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${CONFIG.CODIGOS_JUSTIFICATIVA.map(item => `
                                        <tr>
                                            <td><strong>${item.codigo}</strong></td>
                                            <td>${item.descricao}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    <!-- Exemplos de Uso -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-lightbulb"></i>
                                Exemplos Práticos
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>Exemplo 1:</strong>
                                <p class="mb-1">Viagem a serviço das 08:00 às 18:00 com almoço</p>
                                <small class="text-muted">Código: 40 | Horas: 9 (10h - 1h almoço)</small>
                            </div>
                            <div class="mb-2">
                                <strong>Exemplo 2:</strong>
                                <p class="mb-1">Treinamento das 09:00 às 12:00 (sem almoço)</p>
                                <small class="text-muted">Código: 50 | Horas: 3</small>
                            </div>
                            <div>
                                <strong>Exemplo 3:</strong>
                                <p class="mb-1">Atestado médico período integral</p>
                                <small class="text-muted">Código: 70 | Horas: 8 (considera almoço)</small>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Estatísticas -->
                    <div class="card mt-3">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-chart-bar"></i>
                                Resumo do Mês
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="text-center">
                                <div class="display-4 text-success" id="totalJustificativasMes">--</div>
                                <small class="text-muted">Justificativas este mês</small>
                            </div>
                            <div class="mt-2" id="listaJustificativasMes"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Registrar Período de Férias -->
        <div class="card mt-4">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-umbrella-beach"></i>
                    Registrar Período de Férias
                </h2>
                <span class="badge badge-info">Código FR</span>
            </div>
            <div class="card-body">
                <small class="text-muted d-block mb-3">
                    Informe a data de início e a quantidade de dias corridos de gozo.
                    O sistema calcula o período e marca o código de férias (FR) apenas
                    nos dias úteis reais — sábados, domingos e os feriados cadastrados
                    em Configurações são pulados automaticamente, já que a planilha só
                    desconta horas dos dias úteis.
                </small>
                
                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label" for="feriasDataInicio">
                            <i class="fas fa-calendar-day"></i>
                            Data de Início
                        </label>
                        <input type="date" class="form-control" id="feriasDataInicio" value="${getDataAtualBrasiliaISO()}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="feriasDiasGozo">
                            <i class="fas fa-calendar-week"></i>
                            Dias de Gozo (corridos)
                        </label>
                        <input type="number" class="form-control" id="feriasDiasGozo" value="30" min="1" max="90">
                    </div>
                </div>
                
                <button class="btn btn-secondary" id="btnCalcularFerias">
                    <i class="fas fa-calculator"></i>
                    Calcular Período
                </button>
                
                <div id="feriasPreview" class="mt-3"></div>
            </div>
        </div>

        <!-- Observação Livre — anotar algo no Acompanhamento sem
             estar preso a um código nem a um horário. Serve, por
             exemplo, pra justificar um erro no preenchimento da
             planilha física. -->
        <div class="card mt-4">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-sticky-note"></i>
                    Observação Livre
                </h2>
                <span class="badge badge-warning">Sem código nem horário</span>
            </div>
            <div class="card-body">
                <small class="text-muted d-block mb-3">
                    Use para registrar algo na aba de Acompanhamento que não é uma
                    justificativa de horas — por exemplo, explicar um erro no
                    preenchimento da planilha física.
                </small>

                <div class="grid grid-2 gap-3">
                    <div class="form-group">
                        <label class="form-label" for="dataObservacaoLivre">
                            <i class="fas fa-calendar-day"></i>
                            Data
                        </label>
                        <input type="date" class="form-control" id="dataObservacaoLivre" value="${getDataAtualBrasiliaISO()}">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="selectMesObservacaoLivre">
                            <i class="fas fa-calendar-alt"></i>
                            Mês da Planilha
                        </label>
                        <select class="form-control" id="selectMesObservacaoLivre">
                            ${CONFIG.MESES.map(mes =>
                                `<option value="${mes}" ${mes === acompanhamentoState.mesAtual ? 'selected' : ''}>
                                    ${mes}
                                </option>`
                            ).join('')}
                        </select>
                    </div>
                </div>

                <div class="form-group mt-2">
                    <label class="form-label" for="textoObservacaoLivre">
                        <i class="fas fa-edit"></i>
                        Observação <span style="color: red;">*</span>
                    </label>
                    <textarea class="form-control" id="textoObservacaoLivre" rows="3"
                              placeholder="Digite a observação..." maxlength="300"></textarea>
                </div>

                <button class="btn btn-primary btn-block mt-3" id="btnSalvarObservacaoLivre">
                    <i class="fas fa-save"></i>
                    Salvar Observação
                </button>
            </div>
        </div>
    `;
    
    calcularHorasJustificativa();
}

function configurarEventListenersAcompanhamento() {
    // Registrar Férias
    const btnCalcularFerias = document.getElementById('btnCalcularFerias');
    if (btnCalcularFerias) {
        btnCalcularFerias.addEventListener('click', calcularEExibirPreviewFerias);
    }

    // Observação Livre
    document.getElementById('btnSalvarObservacaoLivre')?.addEventListener('click', salvarObservacaoLivreHandler);
    
    // Data e mês
    document.getElementById('dataJustificativa')?.addEventListener('change', (e) => {
        acompanhamentoState.dataJustificativa = e.target.value;
    });
    
    // Mês selecionado no formulário de justificativa: também é o mês
    // usado pelo card "Resumo do Mês", então atualiza os dois juntos.
    document.getElementById('selectMesJustificativa')?.addEventListener('change', (e) => {
        acompanhamentoState.mesAtual = e.target.value;
        atualizarEstatisticas();
    });
    
    // Horários
    ['horaInicioJustificativa', 'horaFimJustificativa'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', calcularHorasJustificativa);
        }
    });
    
    // Checkbox almoço
    const fezAlmocoCheckbox = document.getElementById('fezAlmoco');
    if (fezAlmocoCheckbox) {
        fezAlmocoCheckbox.addEventListener('change', () => {
            atualizarEstadoDuracaoAlmoco();
            calcularHorasJustificativa();
        });
    }
    
    // Duração do almoço (editável, não fixa em 1h)
    const duracaoAlmocoInput = document.getElementById('duracaoAlmoco');
    if (duracaoAlmocoInput) {
        duracaoAlmocoInput.addEventListener('change', calcularHorasJustificativa);
    }
    
    atualizarEstadoDuracaoAlmoco();
    
    // Validação do código em tempo real + preenchimento automático de horas
    // pra códigos que sempre correspondem ao dia inteiro (ver calcularHorasJustificativa)
    const codigoSelect = document.getElementById('codigoJustificativa');
    if (codigoSelect) {
        codigoSelect.addEventListener('change', (e) => {
            const helpText = document.getElementById('codigoHelp');
            if (helpText) {
                if (!e.target.value) {
                    helpText.style.display = 'block';
                } else {
                    helpText.style.display = 'none';
                }
            }
            console.log('Código selecionado:', e.target.value);
            calcularHorasJustificativa();
        });
    }
    
    // Botões principais
    const btnLimpar = document.getElementById('btnLimparJustificativa');
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparJustificativa);
    }
    
    const btnSalvar = document.getElementById('btnSalvarJustificativa');
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarJustificativa);
    }
    
    // Botão para abrir planilha de acompanhamento
    const btnAbrirPlanilhaAcompanhamento = document.getElementById('btnAbrirPlanilhaAcompanhamento');
    if (btnAbrirPlanilhaAcompanhamento) {
        btnAbrirPlanilhaAcompanhamento.addEventListener('click', () => {
            const config = carregarConfiguracoes();
            
            if (!config.sheetIdAcompanhamento) {
                mostrarNotificacao('Configure o ID da planilha de acompanhamento primeiro', 'error');
                mudarParaAba('configuracoes');
                return;
            }
            
            const url = `https://docs.google.com/spreadsheets/d/${config.sheetIdAcompanhamento}/edit`;
            console.log('Abrindo planilha de acompanhamento:', url);
            
            window.open(url, '_blank');
            
            mostrarNotificacao('Abrindo sua planilha de acompanhamento...', 'info', 3000);
        });
    }
    
    // Botão de teste
    const btnTeste = document.getElementById('btnTesteJustificativa');
    if (btnTeste) {
        btnTeste.addEventListener('click', () => {
            const codigoSelect = document.getElementById('codigoJustificativa');
            console.log('🔍 Teste - Elemento select:', codigoSelect);
            console.log('🔍 Teste - Valor selecionado:', codigoSelect?.value);
            console.log('🔍 Teste - Opções:', codigoSelect?.options);
            
            // Tenta selecionar um código automaticamente
            if (codigoSelect && codigoSelect.options.length > 1) {
                codigoSelect.value = codigoSelect.options[1].value;
                console.log('✅ Código selecionado automaticamente:', codigoSelect.value);
            }
        });
    }
}

// Códigos que sempre correspondem ao dia inteiro (8h), independente do
// horário de início/fim — férias, atestado, licença, abono, júri etc.
const CODIGOS_DIA_INTEIRO_8H = ['FR', 'RC', 'SOL', '70', '80', 'APJ'];

function calcularHorasJustificativa() {
    const codigo = document.getElementById('codigoJustificativa')?.value || '';
    const ehDiaInteiro = CODIGOS_DIA_INTEIRO_8H.includes(codigo);

    // Desabilita os campos de horário/almoço quando o código já define 8h
    // fixas — eles ficam sem efeito nesse caso, então deixamos isso claro.
    ['horaInicioJustificativa', 'horaFimJustificativa', 'fezAlmoco', 'duracaoAlmoco'].forEach(id => {
        const campo = document.getElementById(id);
        if (campo) campo.disabled = ehDiaInteiro;
    });

    if (ehDiaInteiro) {
        const horasBrutasEl = document.getElementById('horasBrutas');
        const descontoAlmocoEl = document.getElementById('descontoAlmoco');
        const horasLiquidasEl = document.getElementById('horasLiquidas');
        const textoCalculoEl = document.getElementById('textoCalculo');

        if (horasBrutasEl) horasBrutasEl.textContent = '08:00';
        if (descontoAlmocoEl) descontoAlmocoEl.textContent = '00:00';
        if (horasLiquidasEl) horasLiquidasEl.textContent = '08:00';
        if (textoCalculoEl) textoCalculoEl.textContent = `Código ${codigo} corresponde ao dia inteiro: 08:00 preenchidas automaticamente.`;
        return;
    }

    const horaInicio = document.getElementById('horaInicioJustificativa')?.value;
    const horaFim = document.getElementById('horaFimJustificativa')?.value;
    const fezAlmoco = document.getElementById('fezAlmoco')?.checked;
    const duracaoAlmocoValor = document.getElementById('duracaoAlmoco')?.value || '01:00';
    
    let horasBrutas = "00:00";
    let descontoAlmoco = "00:00";
    let horasLiquidas = "00:00";
    let textoCalculo = "Preencha horário início e fim";
    
    if (horaInicio && horaFim) {
        // Calcula horas brutas
        horasBrutas = calcularHorasTrabalhadas(horaInicio, horaFim, "00:00");
        
        // Calcula desconto de almoço (duração informada pelo usuário, não fixa em 1h)
        if (fezAlmoco) {
            const [horas, minutos] = horasBrutas.split(':').map(Number);
            const totalMinutos = horas * 60 + minutos;
            
            const [horasAlmoco, minutosAlmoco] = duracaoAlmocoValor.split(':').map(Number);
            const minutosAlmocoTotal = (horasAlmoco * 60) + minutosAlmoco;
            
            if (minutosAlmocoTotal > 0 && totalMinutos > minutosAlmocoTotal) {
                descontoAlmoco = duracaoAlmocoValor;
                
                // Calcula horas líquidas
                const minutosLiquidos = totalMinutos - minutosAlmocoTotal;
                const horasLiq = Math.floor(minutosLiquidos / 60);
                const minutosLiq = minutosLiquidos % 60;
                horasLiquidas = `${String(horasLiq).padStart(2, '0')}:${String(minutosLiq).padStart(2, '0')}`;
                
                textoCalculo = `Das ${horaInicio} às ${horaFim} = ${horasBrutas} - ${descontoAlmoco} almoço = ${horasLiquidas}`;
            } else if (minutosAlmocoTotal > 0) {
                descontoAlmoco = "00:00";
                horasLiquidas = horasBrutas;
                textoCalculo = `Das ${horaInicio} às ${horaFim} = ${horasBrutas} (sem desconto - período menor que o almoço informado)`;
            } else {
                descontoAlmoco = "00:00";
                horasLiquidas = horasBrutas;
                textoCalculo = `Das ${horaInicio} às ${horaFim} = ${horasBrutas} (informe a duração do almoço)`;
            }
        } else {
            descontoAlmoco = "00:00";
            horasLiquidas = horasBrutas;
            textoCalculo = `Das ${horaInicio} às ${horaFim} = ${horasBrutas} (sem horário de almoço)`;
        }
    }
    
    // Atualiza display
    const horasBrutasEl = document.getElementById('horasBrutas');
    const descontoAlmocoEl = document.getElementById('descontoAlmoco');
    const horasLiquidasEl = document.getElementById('horasLiquidas');
    const textoCalculoEl = document.getElementById('textoCalculo');
    
    if (horasBrutasEl) horasBrutasEl.textContent = horasBrutas;
    if (descontoAlmocoEl) descontoAlmocoEl.textContent = descontoAlmoco;
    if (horasLiquidasEl) horasLiquidasEl.textContent = horasLiquidas;
    if (textoCalculoEl) textoCalculoEl.textContent = textoCalculo;
}

/**
 * Habilita/desabilita visualmente o campo de duração do almoço
 * conforme o checkbox "Descontar horário de almoço".
 */
function atualizarEstadoDuracaoAlmoco() {
    const fezAlmoco = document.getElementById('fezAlmoco')?.checked;
    const wrapper = document.getElementById('duracaoAlmocoWrapper');
    const campo = document.getElementById('duracaoAlmoco');
    
    if (campo) campo.disabled = !fezAlmoco;
    if (wrapper) wrapper.style.opacity = fezAlmoco ? '1' : '0.5';
}

// ============================================
// OBSERVAÇÃO LIVRE — anota algo na aba de Acompanhamento sem exigir
// código nem horário (ex: justificar um erro no preenchimento da
// planilha física). Usa a função salvarObservacao() de js/api.js.
// ============================================
async function salvarObservacaoLivreHandler() {
    const dataInput = document.getElementById('dataObservacaoLivre');
    const mesSelect = document.getElementById('selectMesObservacaoLivre');
    const textoTextarea = document.getElementById('textoObservacaoLivre');

    const texto = textoTextarea?.value.trim() || '';

    if (!texto) {
        mostrarNotificacao('Digite o texto da observação', 'error');
        textoTextarea?.focus();
        return;
    }
    if (!dataInput?.value) {
        mostrarNotificacao('Informe a data da observação', 'error');
        return;
    }
    if (!mesSelect?.value) {
        mostrarNotificacao('Selecione o mês', 'error');
        return;
    }

    const btn = document.getElementById('btnSalvarObservacaoLivre');
    const htmlOriginalBtn = btn?.innerHTML;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
        btn.disabled = true;
    }

    let resultado;
    try {
        resultado = await salvarObservacao({
            mes: mesSelect.value,
            data: dataInput.value,
            texto: texto
        });
    } finally {
        if (btn) {
            btn.innerHTML = htmlOriginalBtn;
            btn.disabled = false;
        }
    }

    if (resultado && resultado.success) {
        textoTextarea.value = '';
        dataInput.value = getDataAtualBrasiliaISO();
    }
}

function limparJustificativa() {
    if (confirm('Limpar formulário de justificativa?')) {
        const codigoSelect = document.getElementById('codigoJustificativa');
        const horaInicio = document.getElementById('horaInicioJustificativa');
        const horaFim = document.getElementById('horaFimJustificativa');
        const horaInicioMobile = document.getElementById('horaInicioJustificativaMobile');
        const horaFimMobile = document.getElementById('horaFimJustificativaMobile');
        const fezAlmoco = document.getElementById('fezAlmoco');
        const duracaoAlmoco = document.getElementById('duracaoAlmoco');
        const observacao = document.getElementById('observacaoJustificativa');
        
        if (codigoSelect) codigoSelect.value = '';
        if (horaInicio) horaInicio.value = '08:00';
        if (horaFim) horaFim.value = '17:00';
        if (horaInicioMobile) horaInicioMobile.value = '08:00';
        if (horaFimMobile) horaFimMobile.value = '17:00';
        if (fezAlmoco) fezAlmoco.checked = true;
        if (duracaoAlmoco) duracaoAlmoco.value = '01:00';
        if (observacao) observacao.value = '';
        
        atualizarEstadoDuracaoAlmoco();
        calcularHorasJustificativa();

        // Limpar o formulário não apaga a saída em aberto no localStorage —
        // só desvincula o formulário dela, caso estivesse em edição.
        acompanhamentoState.rascunhoEmEdicaoId = null;
    }
}

// ============================================
// VALIDAÇÃO DO CAMPO OBSERVAÇÃO
// ============================================

function validarObservacao() {
    const campo = document.getElementById('observacaoJustificativa');
    const erro = document.getElementById('obsError');
    
    if (!campo || !erro) return;
    
    // Remove espaços em branco
    const valor = campo.value.trim();
    
    if (valor === '') {
        campo.style.borderColor = 'var(--erro)';
        erro.style.display = 'block';
        return false;
    } else {
        campo.style.borderColor = '';
        erro.style.display = 'none';
        return true;
    }
}

// Validação em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const campoObs = document.getElementById('observacaoJustificativa');
    if (campoObs) {
        campoObs.addEventListener('blur', validarObservacao);
        campoObs.addEventListener('input', validarObservacao);
    }
});

// ============================================
// SAÍDA RÁPIDA — registra a hora de início na hora (ex: ao sair pra uma
// viagem/serviço externo), sem precisar já saber código, hora de fim ou
// observação. Fica guardada no aparelho (localStorage) até a pessoa
// voltar e tocar em "Finalizar", que preenche o formulário de
// justificativa já com a hora capturada. Nada é enviado à planilha
// nesse momento — só quando a justificativa é de fato salva.
// ============================================

const CHAVE_RASCUNHOS_JUSTIFICATIVA = 'frequencia_rascunhos_justificativa';

function obterRascunhosJustificativa() {
    try {
        const bruto = localStorage.getItem(CHAVE_RASCUNHOS_JUSTIFICATIVA);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (error) {
        console.error('Erro ao ler saídas em aberto:', error);
        return [];
    }
}

function salvarRascunhosJustificativa(lista) {
    try {
        localStorage.setItem(CHAVE_RASCUNHOS_JUSTIFICATIVA, JSON.stringify(lista));
    } catch (error) {
        console.error('Erro ao salvar saídas em aberto:', error);
    }
}

function registrarSaidaAgora() {
    const rascunhos = obterRascunhosJustificativa();
    const novoRascunho = {
        id: Date.now().toString(36),
        data: getDataAtualBrasiliaISO(),
        mes: obterMesAtual(),
        horaInicio: getHoraAtualBrasilia()
    };
    rascunhos.push(novoRascunho);
    salvarRascunhosJustificativa(rascunhos);
    atualizarRascunhosJustificativaUI();
    mostrarNotificacao(`Saída registrada às ${novoRascunho.horaInicio}. Toque em "Finalizar" quando voltar.`, 'success');
}

function descartarRascunhoJustificativa(id) {
    if (!confirm('Descartar este registro de saída? Essa ação não pode ser desfeita.')) return;

    const rascunhos = obterRascunhosJustificativa().filter(r => r.id !== id);
    salvarRascunhosJustificativa(rascunhos);

    if (acompanhamentoState.rascunhoEmEdicaoId === id) {
        acompanhamentoState.rascunhoEmEdicaoId = null;
    }

    atualizarRascunhosJustificativaUI();
}

function retomarRascunhoJustificativa(id) {
    const rascunho = obterRascunhosJustificativa().find(r => r.id === id);
    if (!rascunho) return;

    acompanhamentoState.rascunhoEmEdicaoId = id;
    acompanhamentoState.dataJustificativa = rascunho.data;
    acompanhamentoState.mesAtual = rascunho.mes;

    const dataInput = document.getElementById('dataJustificativa');
    const mesSelect = document.getElementById('selectMesJustificativa');
    const horaInicioInput = document.getElementById('horaInicioJustificativa');
    const horaFimInput = document.getElementById('horaFimJustificativa');
    const codigoSelect = document.getElementById('codigoJustificativa');

    if (dataInput) dataInput.value = rascunho.data;
    if (mesSelect) mesSelect.value = rascunho.mes;
    if (horaInicioInput) horaInicioInput.value = rascunho.horaInicio;
    // A hora de fim é preenchida com a hora ATUAL (momento em que você está
    // finalizando/voltando) — sem isso, o campo ficava com o valor padrão
    // do formulário (17:00) até você tocar em "Agora" manualmente.
    if (horaFimInput) horaFimInput.value = getHoraAtualBrasilia();

    calcularHorasJustificativa();

    codigoSelect?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    codigoSelect?.focus();

    mostrarNotificacao('Hora de saída preenchida. Agora escolha o código, a hora de fim e a observação.', 'info');
}

function renderRascunhosJustificativaHTML() {
    const rascunhos = obterRascunhosJustificativa();

    const listaHtml = rascunhos.map(r => `
        <div class="alert alert-info d-flex justify-content-between align-items-center mb-2">
            <div>
                <i class="fas fa-door-open"></i>
                Saída às <strong>${r.horaInicio}</strong> em ${formatarData(r.data)} (${r.mes}) — ainda não finalizada
            </div>
            <div class="d-flex gap-2">
                <button class="btn btn-sm btn-primary" onclick="retomarRascunhoJustificativa('${r.id}')">
                    <i class="fas fa-check"></i> Finalizar
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="descartarRascunhoJustificativa('${r.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');

    return `
        ${listaHtml}
        <button class="btn btn-outline-primary btn-block" id="btnRegistrarSaidaAgora" onclick="registrarSaidaAgora()">
            <i class="fas fa-door-open"></i>
            Registrar Saída Agora (só a hora de início)
        </button>
        <small class="text-muted d-block mt-1 text-center">
            Use ao sair (viagem, serviço externo etc). Fica salvo neste aparelho até você tocar em "Finalizar" e
            completar código, hora de fim e observação — só aí é enviado para a planilha.
        </small>
    `;
}

function atualizarRascunhosJustificativaUI() {
    const container = document.getElementById('rascunhosJustificativaContainer');
    if (container) container.innerHTML = renderRascunhosJustificativaHTML();
}

async function salvarJustificativa() {
    try {
        console.log('🔄 Iniciando salvamento de justificativa...');
        
        // Coleta dados COM CHECKS
        const dataJustificativaInput = document.getElementById('dataJustificativa');
        const mesSelect = document.getElementById('selectMesJustificativa');
        const codigoSelect = document.getElementById('codigoJustificativa');
        const horaInicioInput = document.getElementById('horaInicioJustificativa');
        const horaFimInput = document.getElementById('horaFimJustificativa');
        const fezAlmocoCheckbox = document.getElementById('fezAlmoco');
        const observacaoTextarea = document.getElementById('observacaoJustificativa');
        
        console.log('🔍 Elementos encontrados:', {
            dataJustificativa: !!dataJustificativaInput,
            mesSelect: !!mesSelect,
            codigoSelect: !!codigoSelect,
            horaInicio: !!horaInicioInput,
            horaFim: !!horaFimInput,
            fezAlmoco: !!fezAlmocoCheckbox,
            observacao: !!observacaoTextarea
        });
        
        // Validações
        if (!dataJustificativaInput?.value) {
            throw new Error('Informe a data da justificativa');
        }
        
        if (!mesSelect?.value) {
            throw new Error('Selecione o mês');
        }
        
        // VALIDAÇÃO DA OBSERVAÇÃO (NOVO)
        if (!observacaoTextarea?.value || observacaoTextarea.value.trim() === '') {
            // Mostra erro visual
            validarObservacao();
            // Foca no campo
            observacaoTextarea.focus();
            throw new Error('O campo Observação é obrigatório');
        }
        
        // VERIFICAÇÃO ESPECÍFICA DO CÓDIGO
        if (!codigoSelect?.value || codigoSelect.value === '') {
            console.log('❌ Código selecionado:', codigoSelect?.value);
            throw new Error('Selecione um código de justificativa');
        }
        
        if (!horaInicioInput?.value || !horaFimInput?.value) {
            throw new Error('Informe horário início e fim');
        }
        
        // CORREÇÃO CRÍTICA: Extrai dia corretamente da data
        const dataInput = dataJustificativaInput.value; // Formato: YYYY-MM-DD
        console.log('📅 Data input (YYYY-MM-DD):', dataInput);
        
        // Divide a string "YYYY-MM-DD"
        const partes = dataInput.split('-');
        
        if (partes.length !== 3) {
            throw new Error('Formato de data inválido. Use DD/MM/AAAA');
        }
        
        const ano = parseInt(partes[0]);
        const mesNumero = parseInt(partes[1]); // 1-12
        const dia = parseInt(partes[2]); // 1-31
        
        console.log('📅 Partes extraídas:', { ano, mesNumero, dia });
        
        // Valida o dia
        if (dia < 1 || dia > 31) {
            throw new Error('Dia inválido. Deve ser entre 1 e 31');
        }
        
        // Verifica se o mês selecionado corresponde ao mês da data
        const mesesNumeros = {
            'JANEIRO': 1, 'FEVEREIRO': 2, 'MARÇO': 3, 'ABRIL': 4,
            'MAIO': 5, 'JUNHO': 6, 'JULHO': 7, 'AGOSTO': 8,
            'SETEMBRO': 9, 'OUTUBRO': 10, 'NOVEMBRO': 11, 'DEZEMBRO': 12
        };
        
        const mesSelecionado = mesSelect.value;
        const mesNumeroSelecionado = mesesNumeros[mesSelecionado];
        
        console.log('📅 Comparação mês:', {
            mesSelecionado,
            mesNumeroSelecionado,
            mesNumeroData: mesNumero
        });
        
        // Aviso se meses não coincidem (mas não impede o salvamento)
        if (mesNumeroSelecionado !== mesNumero) {
            console.warn('⚠️ Atenção: O mês da data não corresponde ao mês selecionado');
            if (!confirm(`Atenção: A data é ${dia}/${mesNumero}/${ano} mas você selecionou o mês ${mesSelecionado}. Deseja continuar?`)) {
                return { success: false, message: 'Operação cancelada pelo usuário' };
            }
        }
        
        // Calcula horas líquidas
        calcularHorasJustificativa();
        const horasLiquidas = document.getElementById('horasLiquidas')?.textContent || "00:00";
        
        // Prepara dados para envio
        const dados = {
            tipo: 'justificativa',
            data: dataInput, // Envia como YYYY-MM-DD
            dataJustificativa: dataInput, // Campo adicional para o Apps Script
            mes: mesSelecionado,
            dia: dia, // Envia o dia como número (1-31)
            codigo: codigoSelect.value,
            horaInicio: horaInicioInput.value,
            horaFim: horaFimInput.value,
            fezAlmoco: fezAlmocoCheckbox?.checked || false,
            horasLiquidas: horasLiquidas,
            observacao: observacaoTextarea?.value || ''
        };
        
        console.log('📦 Dados preparados para envio:', dados);
        
        // Desabilita botão durante envio
        const btn = document.getElementById('btnSalvarJustificativa');
        const textoOriginal = btn?.innerHTML;
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;
        }
        
        // Envia para API
        console.log('📤 Enviando para API...');
        const resultado = await salvarJustificativaAPI(dados);
        
        console.log('📥 Resultado da API:', resultado);
        
        // Reabilita botão
        if (btn) {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
        
        if (resultado && resultado.success) {
            console.log('✅ Sucesso! Mostrando notificação...');
            mostrarNotificacao('Justificativa salva com sucesso!', 'success');

            // Se essa justificativa veio de uma "Saída Rápida" (Finalizar),
            // remove o rascunho do localStorage agora que já foi enviado.
            if (acompanhamentoState.rascunhoEmEdicaoId) {
                const rascunhosRestantes = obterRascunhosJustificativa()
                    .filter(r => r.id !== acompanhamentoState.rascunhoEmEdicaoId);
                salvarRascunhosJustificativa(rascunhosRestantes);
                acompanhamentoState.rascunhoEmEdicaoId = null;
                atualizarRascunhosJustificativaUI();
            }

            limparJustificativa();
            atualizarEstatisticas();
        } else {
            const erroMsg = resultado?.error || resultado?.message || 'Erro desconhecido';
            console.log('❌ Erro da API:', erroMsg);
            mostrarNotificacao(`Erro: ${erroMsg}`, 'error');
        }
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao salvar justificativa:', error);
        
        // Reabilita botão em caso de erro
        const btn = document.getElementById('btnSalvarJustificativa');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-save"></i> Salvar Justificativa';
            btn.disabled = false;
        }
        
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
        return { 
            success: false, 
            error: error.message,
            message: error.message 
        };
    }
}

// ============================================
// REGISTRAR FÉRIAS
// ============================================

/**
 * Lê data de início e dias de gozo, calcula quais dias recebem o código
 * FR (dias úteis reais) e quais são pulados (fim de semana/feriado), e
 * mostra o resultado antes de aplicar de fato na planilha.
 */
function calcularEExibirPreviewFerias() {
    const dataInicio = document.getElementById('feriasDataInicio')?.value;
    const diasGozo = parseInt(document.getElementById('feriasDiasGozo')?.value);
    
    if (!dataInicio) {
        mostrarNotificacao('Informe a data de início das férias', 'error');
        return;
    }
    if (!diasGozo || diasGozo < 1) {
        mostrarNotificacao('Informe a quantidade de dias de gozo', 'error');
        return;
    }
    
    const feriados = obterFeriadosConfigurados();
    const { diasUteis, diasPulados } = calcularDiasFerias(dataInicio, diasGozo, feriados);
    
    exibirPreviewFerias(dataInicio, diasGozo, diasUteis, diasPulados);
}

function exibirPreviewFerias(dataInicio, diasGozo, diasUteis, diasPulados) {
    const container = document.getElementById('feriasPreview');
    if (!container) return;
    
    const [anoI, mesI, diaI] = dataInicio.split('-');
    // IMPORTANTE: new Date("YYYY-MM-DD") interpreta a string como UTC meia-noite.
    // Em fusos negativos (como o do Brasil), isso "puxa" a data um dia pra trás
    // ao ler de volta com getDate()/getMonth() (que são hora local) — foi o que
    // causou o período aparecer terminando um dia antes do correto. Construindo
    // com (ano, mês, dia) numéricos, o Date já nasce em horário local e não sofre
    // esse deslocamento — mesmo padrão que calcularDiasFerias() já usa.
    const dataFim = new Date(Number(anoI), Number(mesI) - 1, Number(diaI));
    dataFim.setDate(dataFim.getDate() + diasGozo - 1);
    const dataFimFormatada = `${String(dataFim.getDate()).padStart(2, '0')}/${String(dataFim.getMonth() + 1).padStart(2, '0')}/${dataFim.getFullYear()}`;
    const dataFimISO = `${dataFim.getFullYear()}-${String(dataFim.getMonth() + 1).padStart(2, '0')}-${String(dataFim.getDate()).padStart(2, '0')}`;
    
    if (diasUteis.length === 0) {
        container.innerHTML = `
            <div class="ferias-resumo">
                <p><strong>Período:</strong> ${diaI}/${mesI}/${anoI} a ${dataFimFormatada} (${diasGozo} dias corridos)</p>
                <small class="text-muted">Nenhum dia útil nesse período — nada a aplicar (caiu todo em fim de semana/feriado, o que é bem improvável, confira as datas).</small>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="ferias-resumo">
            <p><strong>Período:</strong> ${diaI}/${mesI}/${anoI} a ${dataFimFormatada} (${diasGozo} dias corridos)</p>
            <p><strong>${diasUteis.length} dia(s) útil(eis)</strong> vão receber o código FR:</p>
            <div class="ferias-lista">
                ${diasUteis.map(d => `<span class="ferias-chip">${d.data.split('-').reverse().join('/')}</span>`).join('')}
            </div>
            ${diasPulados.length > 0 ? `
                <p class="mt-2 mb-1"><small class="text-muted">${diasPulados.length} dia(s) pulado(s) (fim de semana ou feriado):</small></p>
                <div class="ferias-lista">
                    ${diasPulados.map(d => `<span class="ferias-chip pulado">${d.data.split('-').reverse().join('/')}</span>`).join('')}
                </div>
            ` : ''}
            <button class="btn btn-primary mt-3" id="btnAplicarFerias">
                <i class="fas fa-check"></i>
                Aplicar ${diasUteis.length} dia(s) de férias na planilha
            </button>
        </div>
    `;
    
    document.getElementById('btnAplicarFerias')?.addEventListener('click', () => {
        aplicarFeriasCalculadas(diasUteis, dataInicio, dataFimISO);
    });
}

/**
 * NOVO (virada de ano) — monta o mapa {ano: sheetId} das planilhas de
 * Frequência conhecidas localmente: a atual (config.sheetIdFrequencia,
 * no ano "corrente" deduzido a partir do que já foi arquivado) + as
 * anteriores (arquivadas a cada virada de ano). O ano corrente é
 * deduzido como "o ano seguinte ao mais recente já arquivado" — assim
 * fica certo automaticamente depois de cada virarAno, sem depender de
 * editar CONFIG.ANO_ATUAL toda hora.
 */
function obterAnoSheetAtual_(chaveAnteriores) {
    const anteriores = obterSheetIdsAnteriores(chaveAnteriores);
    const anos = Object.keys(anteriores).map(Number).filter(n => !isNaN(n));
    return anos.length ? Math.max(...anos) + 1 : CONFIG.ANO_ATUAL;
}

function obterMapaSheetIdsFrequenciaPorAno_() {
    const config = carregarConfiguracoes();
    const mapa = Object.assign({}, obterSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES));
    if (config.sheetIdFrequencia) mapa[obterAnoSheetAtual_(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES)] = config.sheetIdFrequencia;
    return mapa;
}

function obterMapaSheetIdsAcompanhamentoPorAno_() {
    const config = carregarConfiguracoes();
    const mapa = Object.assign({}, obterSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES));
    if (config.sheetIdAcompanhamento) mapa[obterAnoSheetAtual_(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES)] = config.sheetIdAcompanhamento;
    return mapa;
}

/**
 * Envia os dias calculados para o Apps Script, que grava o código FR em
 * cada dia, e também registra "dataInicio a dataFim - Férias" na(s) aba(s)
 * de Acompanhamento tocada(s) pelo período.
 *
 * ATUALIZADO p/ VIRADA DE ANO: se o período cruzar dezembro/janeiro, os
 * dias são separados por ano e enviados em "blocos" — cada um pra sua
 * planilha de Frequência do ano certo — e o mapa de planilhas de
 * Acompanhamento por ano vai junto, pra observação do período ser gravada
 * nos dois anos. Como o envio ao Apps Script é "no-cors" (não dá pra
 * confirmar de volta se deu certo), a checagem de "os anos envolvidos têm
 * planilha?" é feita AQUI, antes de enviar — se faltar a planilha de
 * algum ano, a pessoa é avisada pra "Iniciar novo ano" primeiro, em vez
 * de mandar um período pela metade sem perceber.
 */
async function aplicarFeriasCalculadas(diasUteis, dataInicio, dataFimISO) {
    const config = carregarConfiguracoes();
    if (!config.sheetIdFrequencia) {
        mostrarNotificacao('Configure o ID da planilha de frequência primeiro', 'error');
        return;
    }

    const anoInicio = parseInt(dataInicio.split('-')[0], 10);
    const anoFim = parseInt(dataFimISO.split('-')[0], 10);
    const cruzaAno = anoFim !== anoInicio;

    const mapaFrequencia = obterMapaSheetIdsFrequenciaPorAno_();
    const mapaAcompanhamento = obterMapaSheetIdsAcompanhamentoPorAno_();

    if (cruzaAno) {
        const anosFaltando = [];
        for (let ano = anoInicio; ano <= anoFim; ano++) {
            if (!mapaFrequencia[ano] || !mapaAcompanhamento[ano]) anosFaltando.push(ano);
        }
        if (anosFaltando.length) {
            mostrarNotificacao(
                `Esse período cruza o ano ${anosFaltando.join('/')}, mas você ainda não iniciou ` +
                `${anosFaltando.length > 1 ? 'esses anos' : 'esse ano'} (Configurações > Novo Ano). ` +
                `Inicie ${anosFaltando.length > 1 ? 'os anos' : 'o ano'} primeiro e aplique as férias de novo.`,
                'error', 9000
            );
            return;
        }
    }

    const btn = document.getElementById('btnAplicarFerias');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Aplicando...';
    }

    // Agrupa os dias úteis por ano e monta um bloco por ano tocado.
    const diasPorAno = {};
    diasUteis.forEach(d => {
        const ano = parseInt(d.data.split('-')[0], 10);
        if (!diasPorAno[ano]) diasPorAno[ano] = [];
        diasPorAno[ano].push({ month: d.month, day: d.day });
    });

    const blocos = Object.keys(diasPorAno).map(ano => ({
        sheetIdFrequencia: mapaFrequencia[ano],
        dias: diasPorAno[ano]
    })).filter(b => b.sheetIdFrequencia);

    const resultado = await aplicarFeriasAPI({
        blocos: blocos,
        codigo: 'FR',
        sheetIdsAcompanhamentoPorAno: mapaAcompanhamento,
        dataInicioFerias: dataInicio,
        dataFimFerias: dataFimISO,
        textoObservacao: 'Férias'
    });
    
    if (resultado && resultado.success) {
        mostrarNotificacao(`Férias aplicadas em ${diasUteis.length} dia(s) úteis!`, 'success');
        
        const previewContainer = document.getElementById('feriasPreview');
        if (previewContainer) previewContainer.innerHTML = '';
        
        // Atualiza os indicadores da aba Frequência (se o mês afetado estiver aberto lá)
        if (typeof sincronizarStatusMesComPlanilha === 'function' && typeof frequenciaState !== 'undefined') {
            setTimeout(() => sincronizarStatusMesComPlanilha(frequenciaState.mesAtual), 2500);
        }
    } else {
        mostrarNotificacao(`Erro ao aplicar férias: ${resultado?.error || 'erro desconhecido'}`, 'error');
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-redo"></i> Tentar novamente';
        }
    }
}

/**
 * Envia o lote de dias de férias para o Apps Script (operação aplicarFerias).
 */
async function aplicarFeriasAPI(dados) {
    try {
        if (typeof enviarParaAppsScript === 'undefined') {
            throw new Error('Função de envio não disponível');
        }
        
        const dadosEnvio = {
            operation: 'aplicarFerias',
            codigo: dados.codigo
        };

        // Formato novo (virada de ano): blocos por ano. Formato antigo
        // (compatibilidade): sheetIdFrequencia + dias direto.
        if (dados.blocos) {
            dadosEnvio.blocos = dados.blocos;
        } else {
            dadosEnvio.sheetIdFrequencia = dados.sheetIdFrequencia;
            dadosEnvio.dias = dados.dias;
        }

        if (dados.sheetIdsAcompanhamentoPorAno) dadosEnvio.sheetIdsAcompanhamentoPorAno = dados.sheetIdsAcompanhamentoPorAno;
        else if (dados.sheetIdAcompanhamento) dadosEnvio.sheetIdAcompanhamento = dados.sheetIdAcompanhamento;
        if (dados.dataInicioFerias) dadosEnvio.dataInicioFerias = dados.dataInicioFerias;
        if (dados.dataFimFerias) dadosEnvio.dataFimFerias = dados.dataFimFerias;
        if (dados.textoObservacao) dadosEnvio.textoObservacao = dados.textoObservacao;
        
        return await enviarParaAppsScript(dadosEnvio);
        
    } catch (error) {
        console.error('❌ Erro ao aplicar férias:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function salvarJustificativaAPI(dados) {
    try {
        console.log('📤 Iniciando envio de justificativa para API...');
        console.log('📦 Dados recebidos:', dados);
        
        // Carrega configurações do usuário
        const config = carregarConfiguracoes();
        console.log('⚙️ Configurações carregadas:', config);
        
        if (!config.sheetIdFrequencia || !config.sheetIdAcompanhamento) {
            throw new Error('Configure ambas as planilhas');
        }
        
        // Verifica se a função enviarParaAppsScript está disponível
        if (typeof enviarParaAppsScript === 'undefined') {
            console.error('❌ FUNÇÃO CRÍTICA NÃO DISPONÍVEL: enviarParaAppsScript');
            throw new Error('Função de envio não disponível');
        }
        
        console.log('✅ Função enviarParaAppsScript disponível');
        
        // Prepara dados para envio - usando saveJustificativaCompleta
        const dadosEnvio = {
            operation: 'saveJustificativaCompleta',
            sheetIdFrequencia: config.sheetIdFrequencia,
            sheetIdAcompanhamento: config.sheetIdAcompanhamento,
            month: dados.mes.toUpperCase(),
            day: dados.dia,
            dataJustificativa: dados.data,
            codigo: dados.codigo,
            horaInicio: formatarHora(dados.horaInicio) || '08:00',
            horaFim: formatarHora(dados.horaFim) || '17:00',
            fezAlmoco: dados.fezAlmoco || false,
            horasLiquidas: dados.horasLiquidas || '08:00',
            observacao: dados.observacao || '',
            timestamp: new Date().toISOString()
        };
        
        console.log('📤 Dados para envio:', dadosEnvio);
        
        // Envia para o Apps Script
        const resultado = await enviarParaAppsScript(dadosEnvio);
        
        console.log('📥 Resultado do envio:', resultado);
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao salvar justificativa:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

async function atualizarEstatisticas() {
    const elemento = document.getElementById('totalJustificativasMes');
    const listaElemento = document.getElementById('listaJustificativasMes');
    if (!elemento) return; // Card não está na tela (ex: config incompleta)
    
    const config = carregarConfiguracoes();
    const mes = acompanhamentoState.mesAtual || obterMesAtual();
    
    if (!config.sheetIdAcompanhamento || typeof buscarStatusAcompanhamentoAPI !== 'function') {
        elemento.textContent = '--';
        if (listaElemento) listaElemento.innerHTML = '';
        return;
    }
    
    elemento.textContent = '...';
    if (listaElemento) listaElemento.innerHTML = '';
    
    const resultado = await buscarStatusAcompanhamentoAPI(config.sheetIdAcompanhamento, mes);
    
    if (!resultado || !resultado.success) {
        elemento.textContent = '--';
        console.warn('Não foi possível carregar o resumo do mês:', resultado?.error);
        return;
    }
    
    elemento.textContent = String(resultado.totalJustificativas);
    
    if (listaElemento) {
        listaElemento.innerHTML = '';
        const justificativas = resultado.justificativas || [];
        
        justificativas.forEach(j => {
            const linha = document.createElement('div');
            linha.className = 'small text-muted border-bottom py-1';
            // textContent (não innerHTML) porque código/data/observação vêm
            // da planilha do usuário - evita qualquer risco de HTML injetado.
            linha.textContent = `${j.codigo} - ${j.data} - ${j.observacao}`;
            listaElemento.appendChild(linha);
        });
    }
}

function mostrarMensagemConfiguracaoAcompanhamento() {
    return `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Configuração Necessária</h2>
            </div>
            <div class="card-body">
                <div class="alert warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Para usar a aba de Acompanhamento, configure ambas as planilhas.</p>
                </div>
                <button class="btn btn-primary btn-block mt-3" onclick="window.mudarParaAba ? mudarParaAba('configuracoes') : console.log('Função não disponível')">
                    <i class="fas fa-cog"></i>
                    Ir para Configurações
                </button>
            </div>
        </div>
    `;
}

// Exportar funções
if (typeof window !== 'undefined') {
    window.initAcompanhamento = initAcompanhamento;
}
