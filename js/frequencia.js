// FREQUENCIA.JS - VERSÃO COMPLETA COM CAMPOS SIMPLES
let frequenciaState = {
    mesAtual: '',
    diaAtual: 1,
    diasDoMes: {}   // cache: {dia: {entradaManha, saidaManha, entradaTarde, saidaTarde, totalGeral, ...}} vindo da planilha
};

/**
 * Gera as <option> do seletor de dia, marcando com ✓ (verde) os dias já
 * registrados por completo e com • (laranja) os registrados parcialmente.
 * O status vem do armazenamento local (o app não lê dados de volta da
 * planilha), então reflete o que foi salvo neste navegador.
 */
function gerarOpcoesDias(mes, diaSelecionado) {
    const statusMes = (typeof obterStatusMes === 'function') ? obterStatusMes(mes) : {};

    return Array.from({length: 31}, (_, i) => i + 1)
        .map(dia => {
            const status = statusMes[dia];
            let marcador = '';
            let estilo = '';

            if (status === 'completo') {
                marcador = ' ✓';
                estilo = 'color:#4CAF50;';
            } else if (status === 'parcial') {
                marcador = ' •';
                estilo = 'color:#FF9800;';
            }

            const selecionado = dia === diaSelecionado ? 'selected' : '';
            return `<option value="${dia}" ${selecionado} style="${estilo}">${dia.toString().padStart(2, '0')}${marcador}</option>`;
        }).join('');
}

/**
 * Regenera as opções do seletor de dia (usado após trocar de mês ou salvar).
 */
function atualizarIndicadoresDias() {
    const selectDia = document.getElementById('selectDia');
    if (!selectDia) return;
    const diaSelecionado = parseInt(selectDia.value) || frequenciaState.diaAtual;
    selectDia.innerHTML = gerarOpcoesDias(frequenciaState.mesAtual, diaSelecionado);
}

if (typeof window !== 'undefined') {
    window.gerarOpcoesDias = gerarOpcoesDias;
    window.atualizarIndicadoresDias = atualizarIndicadoresDias;
}

/**
 * Preenche o card "Saldo do Mês" com os valores reais vindos da planilha
 * (linhas 55-63, já calculados pelas fórmulas de lá — o app só exibe).
 */
function exibirResumoMes(resumo) {
    const container = document.getElementById('saldoMesConteudo');
    if (!container || !resumo) return;

    container.innerHTML = `
        <div class="saldo-item">
            <span class="saldo-valor">${resumo.horasEfetivasTrabalhadas || '--'}</span>
            <span class="saldo-label">Trabalhadas</span>
        </div>
        <div class="saldo-item">
            <span class="saldo-valor">${resumo.horasJustificadas || '--'}</span>
            <span class="saldo-label">Justificadas</span>
        </div>
        <div class="saldo-item saldo-compensar">
            <span class="saldo-valor">${resumo.saldoAcumuladoCompensar || '--'}</span>
            <span class="saldo-label">A Compensar</span>
        </div>
        <div class="saldo-item saldo-repor">
            <span class="saldo-valor">${resumo.saldoAcumuladoRepor || '--'}</span>
            <span class="saldo-label">A Repor</span>
        </div>
    `;
}

/**
 * Volta o card "Saldo do Mês" para o estado de carregamento (usado ao
 * trocar de mês, antes da nova resposta da planilha chegar).
 */
function exibirCarregandoSaldoMes() {
    const container = document.getElementById('saldoMesConteudo');
    if (!container) return;
    container.innerHTML = `
        <small class="text-muted">
            <i class="fas fa-spinner fa-spin"></i>
            Buscando dados da planilha...
        </small>
    `;
}

/**
 * Mostra uma mensagem no lugar do saldo quando a busca falha.
 */
function exibirErroSaldoMes(mensagem) {
    const container = document.getElementById('saldoMesConteudo');
    if (!container) return;
    container.innerHTML = `
        <small class="text-muted">
            <i class="fas fa-exclamation-circle"></i>
            ${mensagem}
        </small>
    `;
}

if (typeof window !== 'undefined') {
    window.exibirResumoMes = exibirResumoMes;
    window.exibirCarregandoSaldoMes = exibirCarregandoSaldoMes;
    window.exibirErroSaldoMes = exibirErroSaldoMes;
}

/**
 * Verifica se os 4 campos de horário do dia estão vazios (usado para
 * decidir se é seguro carregar dados da planilha por cima automaticamente,
 * sem apagar algo que a pessoa já esteja digitando).
 */
function camposEstaoVazios() {
    return ['entradaManha', 'saidaManha', 'entradaTarde', 'saidaTarde'].every(id => {
        const el = document.getElementById(id);
        return !el || !el.value;
    });
}

/**
 * Preenche os campos de horário do dia selecionado com os dados reais da
 * planilha (se já tiverem sido buscados) e atualiza o "Resumo do Dia"
 * usando o Total Geral que a própria planilha já calcula — em vez de
 * recalcular aqui, evitando qualquer divergência com o que está lá.
 * Se o dia não tiver dados (ainda não preenchido), limpa os campos.
 */
function carregarDadosDoDia(dia) {
    const dadosDia = frequenciaState.diasDoMes[dia];

    const definirValor = (id, valor) => {
        const campo = document.getElementById(id);
        if (!campo) return;
        // A planilha às vezes exibe a hora sem zero à esquerda (ex: "8:16"
        // em vez de "08:16"), o que o <input type="time"> rejeita
        // silenciosamente. formatarHora() normaliza para "HH:MM".
        const valorNormalizado = (typeof formatarHora === 'function') ? (formatarHora(valor) || '') : (valor || '');
        campo.value = valorNormalizado;
        const campoMobile = document.getElementById(id + 'Mobile');
        if (campoMobile) campoMobile.value = valorNormalizado;
    };

    definirValor('entradaManha', dadosDia?.entradaManha);
    definirValor('saidaManha', dadosDia?.saidaManha);
    definirValor('entradaTarde', dadosDia?.entradaTarde);
    definirValor('saidaTarde', dadosDia?.saidaTarde);

    const horasTotalEl = document.getElementById('horasTotal');
    if (dadosDia && dadosDia.totalGeral) {
        // Usa o total já calculado pela planilha (fonte da verdade)
        if (horasTotalEl) horasTotalEl.textContent = dadosDia.totalGeral;
    } else {
        // Sem dado da planilha ainda (ou dia vazio) — calcula localmente
        calcularHoras();
    }
}

if (typeof window !== 'undefined') {
    window.carregarDadosDoDia = carregarDadosDoDia;
}

/**
 * Busca na planilha (via Apps Script) o status real dos dias do mês e
 * substitui o cache local, redesenhando o seletor de dia em seguida.
 * Também atualiza o card "Saldo do Mês" e, se os campos de horário
 * estiverem vazios, carrega os dados reais do dia selecionado.
 * Roda em segundo plano — não bloqueia o carregamento da aba.
 */
async function sincronizarStatusMesComPlanilha(mes) {
    try {
        const config = (typeof carregarConfiguracoes === 'function') ? carregarConfiguracoes() : null;
        if (!config || !config.sheetIdFrequencia) {
            exibirErroSaldoMes('Configure o ID da planilha em Configurações');
            return;
        }
        if (typeof buscarStatusMesAPI !== 'function') return;

        const resultado = await buscarStatusMesAPI(config.sheetIdFrequencia, mes);

        // Só aplica se o mês ainda for o selecionado (evita corrida ao trocar rápido de mês)
        if (resultado && resultado.success && mes === frequenciaState.mesAtual) {
            substituirStatusMes(mes, resultado.status || {});
            atualizarIndicadoresDias();
            exibirResumoMes(resultado.resumo);

            frequenciaState.diasDoMes = resultado.dias || {};
            if (camposEstaoVazios()) {
                carregarDadosDoDia(frequenciaState.diaAtual);
            }
        } else if (resultado && !resultado.success) {
            console.warn('Não foi possível sincronizar status com a planilha:', resultado.error);
            exibirErroSaldoMes('Não foi possível buscar os dados da planilha');
        }
    } catch (e) {
        console.warn('Erro ao sincronizar status com a planilha:', e);
        exibirErroSaldoMes('Não foi possível buscar os dados da planilha');
    }
}

if (typeof window !== 'undefined') {
    window.sincronizarStatusMesComPlanilha = sincronizarStatusMesComPlanilha;
}

function initFrequencia() {
    console.log('Inicializando aba Frequência...');
    document.querySelector('#frequencia .loading')?.remove();
    frequenciaState.mesAtual = obterMesAtual();
    frequenciaState.diaAtual = obterDiaAtual();
    
    carregarInterfaceFrequencia();
    configurarEventListenersFrequencia();
    sincronizarStatusMesComPlanilha(frequenciaState.mesAtual);
    
    console.log('Aba Frequência inicializada');
}

function carregarInterfaceFrequencia() {
    const container = document.getElementById('frequencia');
    
    if (!container) return;
    
    const config = verificarConfiguracoesMinimas();
    
    if (!config.frequenciaConfigurada) {
        container.innerHTML = mostrarMensagemConfiguracao();
        return;
    }
    
    // Data formatada no fuso de Brasília para exibição no cabeçalho
    const dataExibicao = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo'
    }).format(new Date());
    
    container.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-clock"></i>
                    Controle Diário de Frequência
                </h2>
                <span class="badge badge-info">${dataExibicao}</span>
            </div>
            <div class="card-body">
                <!-- Botão de destaque: preenche a hora atual no próximo -->
                <!-- horário pendente do dia e já salva, tudo em um clique -->
                <button type="button" class="btn btn-primary btn-block btn-bater-ponto" id="btnBaterPonto" onclick="baterPontoAgora()">
                    <i class="fas fa-fingerprint"></i>
                    Bati o Ponto
                </button>

                <!-- Seletor de Data -->
                <div class="form-group">
                    <label class="form-label">
                        <i class="fas fa-calendar-alt"></i>
                        Data do Registro
                    </label>
                    <div class="grid grid-2 gap-2">
                        <select class="form-control" id="selectMes">
                            ${CONFIG.MESES.map(mes => 
                                `<option value="${mes}" ${mes === frequenciaState.mesAtual ? 'selected' : ''}>
                                    ${mes}
                                </option>`
                            ).join('')}
                        </select>
                        <select class="form-control" id="selectDia">
                            ${gerarOpcoesDias(frequenciaState.mesAtual, frequenciaState.diaAtual)}
                        </select>
                    </div>
                    <small class="dias-legenda">
                        <span class="legenda-item"><span class="legenda-dot completo"></span> Completo</span>
                        <span class="legenda-item"><span class="legenda-dot parcial"></span> Parcial</span>
                    </small>
                </div>
                
                <!-- Horários do Dia - VERSÃO SIMPLES -->
                <div class="grid grid-2 gap-3">
                    <!-- Período da Manhã -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-sun"></i>
                                Período da Manhã
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <div class="form-label-row">
                                    <label class="form-label" for="entradaManha">
                                        <i class="fas fa-sign-in-alt"></i>
                                        Entrada
                                    </label>
                                    <button type="button" class="btn-agora" onclick="preencherHoraAtual('entradaManha')" title="Preencher com a hora atual">
                                        <i class="fas fa-clock"></i> Agora
                                    </button>
                                </div>
                                <input type="time" 
                                       class="form-control" 
                                       id="entradaManha">
                            </div>
                            <div class="form-group">
                                <div class="form-label-row">
                                    <label class="form-label" for="saidaManha">
                                        <i class="fas fa-sign-out-alt"></i>
                                        Saída para Almoço
                                    </label>
                                    <button type="button" class="btn-agora" onclick="preencherHoraAtual('saidaManha')" title="Preencher com a hora atual">
                                        <i class="fas fa-clock"></i> Agora
                                    </button>
                                </div>
                                <input type="time" 
                                       class="form-control" 
                                       id="saidaManha">
                            </div>
                        </div>
                    </div>
                    
                    <!-- Período da Tarde -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-moon"></i>
                                Período da Tarde
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="form-group">
                                <div class="form-label-row">
                                    <label class="form-label" for="entradaTarde">
                                        <i class="fas fa-sign-in-alt"></i>
                                        Retorno do Almoço
                                    </label>
                                    <button type="button" class="btn-agora" onclick="preencherHoraAtual('entradaTarde')" title="Preencher com a hora atual">
                                        <i class="fas fa-clock"></i> Agora
                                    </button>
                                </div>
                                <input type="time" 
                                       class="form-control" 
                                       id="entradaTarde">
                            </div>
                            <div class="form-group">
                                <div class="form-label-row">
                                    <label class="form-label" for="saidaTarde">
                                        <i class="fas fa-sign-out-alt"></i>
                                        Saída
                                    </label>
                                    <button type="button" class="btn-agora" onclick="preencherHoraAtual('saidaTarde')" title="Preencher com a hora atual">
                                        <i class="fas fa-clock"></i> Agora
                                    </button>
                                </div>
                                <input type="time" 
                                       class="form-control" 
                                       id="saidaTarde">
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Resumo do Dia - VERSÃO SIMPLIFICADA -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-clock"></i>
                            Resumo do Dia
                        </h3>
                    </div>
                    <div class="card-body">
                        <div class="horas-container text-center">
                            <!-- HORAS GARRAFAIS NO CENTRO -->
                            <div class="horas-garrafais" id="horasTotal">08:00</div>
                            
                            <!-- Legenda pequena -->
                            <div class="horas-legenda">
                                horas trabalhadas hoje
                            </div>
                        </div>
                        
                        <!-- Informação adicional (opcional) -->
                        <div class="horas-info mt-3">
                            <small class="text-muted">
                                <i class="fas fa-info-circle"></i>
                                Horário de almoço já considerado entre os períodos
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- Saldo do Mês (dados reais da planilha) -->
                <div class="card mt-3">
                    <div class="card-header">
                        <h3 class="card-title">
                            <i class="fas fa-balance-scale"></i>
                            Saldo do Mês
                        </h3>
                    </div>
                    <div class="card-body">
                        <div id="saldoMesConteudo" class="saldo-mes-grid">
                            <small class="text-muted">
                                <i class="fas fa-spinner fa-spin"></i>
                                Buscando dados da planilha...
                            </small>
                        </div>
                    </div>
                </div>
                
                <!-- Botões PRINCIPAIS -->
                <div class="grid grid-2 gap-2 mt-4">
                    <button class="btn btn-secondary" id="btnLimpar">
                        <i class="fas fa-eraser"></i>
                        Limpar
                    </button>
                    <button class="btn btn-primary" id="btnSalvarFrequencia">
                        <i class="fas fa-save"></i>
                        Salvar Frequência
                    </button>
                </div>
                
                <!-- Botão para ABRIR PLANILHA -->
                <div class="mt-3">
                    <button class="btn btn-outline-success btn-block" id="btnAbrirPlanilhaFrequencia">
                        <i class="fas fa-external-link-alt"></i>
                        Abrir Minha Planilha de Frequência
                    </button>
                    <small class="text-muted d-block mt-1 text-center">
                        Abre sua planilha no Google Sheets para verificar os dados
                    </small>
                </div>
                
                <!-- Link para Justificativas -->
                <div class="alert alert-info mt-3">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Precisa justificar horários?</strong>
                        <p>Use a aba <strong>Acompanhamento</strong> para registrar justificativas, códigos e observações.</p>
                        <button class="btn btn-sm btn-outline-info mt-2" onclick="window.mudarParaAba ? mudarParaAba('acompanhamento') : console.log('Função não disponível')">
                            <i class="fas fa-external-link-alt"></i>
                            Ir para Acompanhamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    calcularHoras();
}

function configurarEventListenersFrequencia() {
    // Seletores de data
    const selectMes = document.getElementById('selectMes');
    const selectDia = document.getElementById('selectDia');
    
    if (selectMes) {
        selectMes.addEventListener('change', (e) => {
            frequenciaState.mesAtual = e.target.value;
            atualizarIndicadoresDias();
            exibirCarregandoSaldoMes();
            sincronizarStatusMesComPlanilha(frequenciaState.mesAtual);
        });
    }
    
    if (selectDia) {
        selectDia.addEventListener('change', (e) => {
            frequenciaState.diaAtual = parseInt(e.target.value);
            carregarDadosDoDia(frequenciaState.diaAtual);
        });
    }
    
    // Campos de hora
    const camposHora = ['entradaManha', 'saidaManha', 'entradaTarde', 'saidaTarde'];
    camposHora.forEach(id => {
        const campo = document.getElementById(id);
        if (campo) {
            campo.addEventListener('change', calcularHoras);
            
            // Adiciona também para os campos mobile (se existirem)
            const campoMobile = document.getElementById(id + 'Mobile');
            if (campoMobile) {
                campoMobile.addEventListener('input', function() {
                    // Sincroniza com campo original
                    campo.value = this.value;
                    calcularHoras();
                });
            }
        }
    });
    
    // Botões principais
    const btnLimpar = document.getElementById('btnLimpar');
    const btnSalvar = document.getElementById('btnSalvarFrequencia');
    
    if (btnLimpar) {
        btnLimpar.addEventListener('click', limparFrequencia);
    }
    
    if (btnSalvar) {
        btnSalvar.addEventListener('click', salvarFrequencia);
    }
    
    // Botão para abrir planilha de frequência
    const btnAbrirPlanilhaFrequencia = document.getElementById('btnAbrirPlanilhaFrequencia');
    if (btnAbrirPlanilhaFrequencia) {
        btnAbrirPlanilhaFrequencia.addEventListener('click', () => {
            const config = carregarConfiguracoes();
            
            if (!config.sheetIdFrequencia) {
                mostrarNotificacao('Configure o ID da planilha de frequência primeiro', 'error');
                mudarParaAba('configuracoes');
                return;
            }
            
            const url = `https://docs.google.com/spreadsheets/d/${config.sheetIdFrequencia}/edit`;
            console.log('Abrindo planilha de frequência:', url);
            
            window.open(url, '_blank');
            
            mostrarNotificacao('Abrindo sua planilha de frequência...', 'info', 3000);
        });
    }
}

function calcularHoras() {
    const entradaManha = document.getElementById('entradaManha')?.value;
    const saidaManha = document.getElementById('saidaManha')?.value;
    const entradaTarde = document.getElementById('entradaTarde')?.value;
    const saidaTarde = document.getElementById('saidaTarde')?.value;
    
    let horasManha = "00:00";
    let horasTarde = "00:00";
    let horasTotal = "00:00";
    
    // Calcula horas da manhã
    if (entradaManha && saidaManha) {
        horasManha = calcularHorasTrabalhadas(entradaManha, saidaManha, "00:00");
    }
    
    // Calcula horas da tarde
    if (entradaTarde && saidaTarde) {
        horasTarde = calcularHorasTrabalhadas(entradaTarde, saidaTarde, "00:00");
    }
    
    // Soma as horas (SEM DESCONTAR ALMOÇO)
    if (horasManha !== "00:00" || horasTarde !== "00:00") {
        const [h1, m1] = horasManha.split(':').map(Number);
        const [h2, m2] = horasTarde.split(':').map(Number);
        
        // Soma SIMPLES das horas da manhã + tarde
        let totalMinutos = (h1 * 60 + m1) + (h2 * 60 + m2);
        
        if (totalMinutos < 0) totalMinutos = 0;
        
        const horas = Math.floor(totalMinutos / 60);
        const minutos = totalMinutos % 60;
        horasTotal = `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    }
    
    // Atualiza display - APENAS HORAS TOTAIS EM DESTAQUE
    const horasTotalEl = document.getElementById('horasTotal');
    
    if (horasTotalEl) {
        horasTotalEl.textContent = horasTotal;
        
        // Adiciona animação de pulso quando as horas mudam
        horasTotalEl.classList.add('pulse');
        
        // Remove a classe de animação após terminar
        setTimeout(() => {
            horasTotalEl.classList.remove('pulse');
        }, 600); // Tempo da animação (600ms = 0.6 segundos)
    }
}

function limparFrequencia() {
    if (confirm('Limpar todos os horários?')) {
        const campos = ['entradaManha', 'saidaManha', 'entradaTarde', 'saidaTarde'];
        campos.forEach(id => {
            const campo = document.getElementById(id);
            if (campo) campo.value = '';
            
            // Limpa também os campos mobile (se existirem)
            const campoMobile = document.getElementById(id + 'Mobile');
            if (campoMobile) campoMobile.value = '';
        });
        calcularHoras();
    }
}

/**
 * Botão de destaque "Bati o Ponto": preenche o PRÓXIMO horário pendente do
 * dia de HOJE (entradaManha -> saidaManha -> entradaTarde -> saidaTarde,
 * nessa ordem) com a hora atual e já salva em seguida — um único toque em
 * vez de "Agora" + "Salvar".
 *
 * Sempre aponta pro dia de hoje, mesmo que a pessoa esteja com outro dia
 * selecionado na tela no momento (evita registrar o ponto no dia errado).
 */
async function baterPontoAgora() {
    const diaHoje = obterDiaAtual();
    const mesHoje = obterMesAtual();

    if (frequenciaState.mesAtual !== mesHoje) {
        mostrarNotificacao('Vá para o mês atual para bater o ponto de hoje.', 'error', 4000);
        return;
    }

    const selectDia = document.getElementById('selectDia');
    if (selectDia && parseInt(selectDia.value, 10) !== diaHoje) {
        selectDia.value = diaHoje;
        frequenciaState.diaAtual = diaHoje;
        carregarDadosDoDia(diaHoje);
    }

    const camposEmOrdem = ['entradaManha', 'saidaManha', 'entradaTarde', 'saidaTarde'];
    const proximoCampo = camposEmOrdem.find(id => !obterValorCampoHora(id));

    if (!proximoCampo) {
        mostrarNotificacao('Os 4 horários de hoje já estão preenchidos.', 'info', 3000);
        return;
    }

    preencherHoraAtual(proximoCampo);
    await salvarFrequencia();
}

if (typeof window !== 'undefined') {
    window.baterPontoAgora = baterPontoAgora;
}

async function salvarFrequencia() {
    try {
        console.log('🔄 Iniciando salvamento de frequência...');
        
        const mes = document.getElementById('selectMes')?.value;
        const dia = document.getElementById('selectDia')?.value;
        
        console.log('📅 Mês/Dia selecionados:', mes, dia);
        
        if (!mes || !dia) {
            throw new Error('Selecione mês e dia');
        }
        
        const dados = {
            mes: mes,
            dia: parseInt(dia),
            entradaManha: document.getElementById('entradaManha')?.value || '',
            saidaManha: document.getElementById('saidaManha')?.value || '',
            entradaTarde: document.getElementById('entradaTarde')?.value || '',
            saidaTarde: document.getElementById('saidaTarde')?.value || ''
        };
        
        console.log('📝 Dados coletados:', dados);
        
        // Valida se tem algum horário
        const temHorarios = dados.entradaManha || dados.saidaManha || dados.entradaTarde || dados.saidaTarde;
        if (!temHorarios) {
            throw new Error('Preencha pelo menos um horário');
        }
        
        // Marca o dia no seletor (✓ completo / • parcial) como palpite
        // instantâneo, só pra não deixar a tela "parada" — alguns segundos
        // depois do envio, sincronizamos com os dados reais da planilha.
        if (typeof salvarStatusDia === 'function') {
            salvarStatusDia(mes, parseInt(dia), dados);
            atualizarIndicadoresDias();
        }
        
        // Carrega configurações
        const config = carregarConfiguracoes();
        
        if (!config.sheetIdFrequencia) {
            throw new Error('ID da planilha não configurado');
        }
        
        const dadosEnvio = {
            operation: 'saveFrequencia',
            sheetIdFrequencia: config.sheetIdFrequencia,
            month: mes,
            day: parseInt(dia),
            timestamp: new Date().toISOString()
        };
        
        // Adiciona somente os campos que têm valor
        if (dados.entradaManha) dadosEnvio.entradaManha = formatarHora(dados.entradaManha);
        if (dados.saidaManha) dadosEnvio.saidaManha = formatarHora(dados.saidaManha);
        if (dados.entradaTarde) dadosEnvio.entradaTarde = formatarHora(dados.entradaTarde);
        if (dados.saidaTarde) dadosEnvio.saidaTarde = formatarHora(dados.saidaTarde);
        
        console.log('📤 Dados para envio:', dadosEnvio);
        
        const btn = document.getElementById('btnSalvarFrequencia');
        const textoOriginal = btn?.innerHTML;
        
        console.log('⏳ Desabilitando botão...');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Salvando...';
            btn.disabled = true;
        }
        
        console.log('📤 Enviando para Apps Script...');
        const resultado = await enviarParaAppsScript(dadosEnvio);
        
        console.log('📥 Resultado:', resultado);
        
        if (btn) {
            btn.innerHTML = textoOriginal;
            btn.disabled = false;
        }
        
        if (resultado && resultado.success) {
            console.log('✅ Sucesso! Mostrando notificação...');
            mostrarNotificacao('Frequência salva com sucesso!', 'success');
            // Confirma o indicador com os dados reais da planilha (dá um
            // tempinho pro Apps Script terminar de gravar antes de reler).
            setTimeout(() => sincronizarStatusMesComPlanilha(mes), 2500);
        } else {
            const erroMsg = resultado?.error || 'Erro desconhecido';
            console.log('❌ Erro da API:', erroMsg);
            mostrarNotificacao(`Erro: ${erroMsg}`, 'error');
        }
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Erro ao salvar frequência:', error);
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
        
        // Reabilita botão em caso de erro
        const btn = document.getElementById('btnSalvarFrequencia');
        if (btn) {
            btn.innerHTML = '<i class="fas fa-save"></i> Salvar Frequência';
            btn.disabled = false;
        }
        
        return { success: false, error: error.message };
    }
}

function mostrarMensagemConfiguracao() {
    return `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">Configuração Necessária</h2>
            </div>
            <div class="card-body">
                <div class="alert warning">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Para usar a aba de Frequência, configure o ID da sua planilha.</p>
                </div>
                <button class="btn btn-primary btn-block mt-3" onclick="window.mudarParaAba ? mudarParaAba('configuracoes') : console.log('Função não disponível')">
                    <i class="fas fa-cog"></i>
                    Ir para Configurações
                </button>
            </div>
        </div>
    `;
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.initFrequencia = initFrequencia;
}
