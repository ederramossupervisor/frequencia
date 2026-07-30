// LÓGICA DA ABA CONFIGURAÇÕES

/**
 * Inicializa a aba de configurações
 */
function initConfiguracoes() {
    console.log('Inicializando aba Configurações...');
    document.querySelector('#configuracoes .loading')?.remove();
    
    // Carrega interface
    carregarInterfaceConfiguracoes();
    
    // Carrega configurações salvas
    carregarConfiguracoesSalvas();
    
    // Configura event listeners
    configurarEventListenersConfiguracoes();
    
    console.log('Aba Configurações inicializada');
}

/**
 * Carrega a interface da aba configurações
 */
function carregarInterfaceConfiguracoes() {
    const container = document.getElementById('configuracoes');
    
    if (!container) {
        console.error('Container da aba configurações não encontrado');
        return;
    }
    
    container.innerHTML = `
        <div class="grid grid-2">
            <!-- Configurações das Planilhas -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-table"></i>
                        Configuração das Planilhas
                    </h2>
                    <span class="badge badge-info" id="statusConfig">
                        Não configurado
                    </span>
                </div>
                <div class="card-body">
                    <!-- Aviso de Compartilhamento -->
                    <div class="alert alert-warning mb-4">
                        <i class="fas fa-exclamation-triangle"></i>
                        <div>
                            <strong>Importante:</strong>
                            <p>Para que o aplicativo funcione, suas planilhas devem estar compartilhadas como:</p>
                            <p><strong>"Qualquer pessoa com o link pode EDITAR"</strong></p>
                            <p>Clique nos botões abaixo para abrir os templates e fazer suas cópias.</p>
                        </div>
                    </div>
                    
                    <!-- Botões para Abrir Templates -->
                    <div class="grid grid-2 gap-2 mb-4">
                        <button class="btn btn-primary" id="btnAbrirTemplateFrequencia">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir Template Frequência
                        </button>
                        <button class="btn btn-primary" id="btnAbrirTemplateAcompanhamento">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir Template Acompanhamento
                        </button>
                    </div>
                    
                    <!-- Instruções -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-graduation-cap"></i>
                                Passo a Passo
                            </h3>
                        </div>
                        <div class="card-body">
                            <ol class="list-instructions">
                                <li>Clique em "Abrir Template" acima</li>
                                <li>No Google Sheets, clique em <strong>"Arquivo" → "Fazer uma cópia"</strong></li>
                                <li>Na cópia, clique em <strong>"Compartilhar" → "Alterar para qualquer pessoa com o link pode EDITAR"</strong></li>
                                <li>Copie o ID da planilha (da URL) e cole abaixo</li>
                                <li>Repita para a outra planilha</li>
                                <li>Clique em <strong>"Salvar Configurações"</strong></li>
                            </ol>
                        </div>
                    </div>
                    
                    <!-- Campos para IDs das Planilhas -->
                    <div class="form-group">
                        <label class="form-label" for="idPlanilhaFrequencia">
                            <i class="fas fa-clock"></i>
                            ID da Planilha de Frequência
                        </label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="idPlanilhaFrequencia"
                            placeholder="Cole o ID ou link da sua planilha de frequência"
                        >
                        <small class="form-text">
                            ID ou URL: <span id="infoIdFrequencia" class="text-muted">Não configurado</span>
                        </small>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label" for="idPlanilhaAcompanhamento">
                            <i class="fas fa-clipboard-list"></i>
                            ID da Planilha de Acompanhamento
                        </label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="idPlanilhaAcompanhamento"
                            placeholder="Cole o ID ou link da sua planilha de acompanhamento"
                        >
                        <small class="form-text">
                            ID ou URL: <span id="infoIdAcompanhamento" class="text-muted">Não configurado</span>
                        </small>
                    </div>
                    
                    <!-- Configuração do Apps Script -->
                    <div class="form-group">
                        <label class="form-label" for="urlAppsScript">
                            <i class="fas fa-code"></i>
                            URL do Apps Script
                        </label>
                        <input 
                            type="text" 
                            class="form-control" 
                            id="urlAppsScript"
                            value="${CONFIG.APP_SCRIPT_URL}"
                            readonly
                            style="background-color: var(--branco-gelo);"
                        >
                        <small class="form-text">
                            Esta é a URL do script principal. Não altere a menos que saiba o que está fazendo.
                        </small>
                    </div>
                    
                    <!-- Botões de Ação -->
                    <div class="grid grid-3 gap-2 mt-4">
                        <button class="btn btn-secondary" id="btnTestarConexao">
                            <i class="fas fa-wifi"></i>
                            Testar Conexão
                        </button>
                        <button class="btn btn-success" id="btnSalvarConfiguracoes">
                            <i class="fas fa-save"></i>
                            Salvar Configurações
                        </button>
                        <button class="btn btn-danger" id="btnLimparConfiguracoes">
                            <i class="fas fa-trash"></i>
                            Limpar Tudo
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Informações e Ajuda -->
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <i class="fas fa-info-circle"></i>
                        Informações do Aplicativo
                    </h2>
                    <button class="btn btn-sm btn-secondary" id="btnCopiarInfo">
                        <i class="fas fa-copy"></i>
                        Copiar Info
                    </button>
                </div>
                <div class="card-body">
                    <!-- Status do App -->
                    <div class="mb-4">
                        <h3 class="card-title">
                            <i class="fas fa-heartbeat"></i>
                            Status do Sistema
                        </h3>
                        <div class="grid grid-2 gap-2 mt-2">
                            <div class="status-item" id="statusPWA">
                                <i class="fas fa-mobile-alt"></i>
                                <span>PWA</span>
                                <span class="status-badge" id="badgePWA">Checking...</span>
                            </div>
                            <div class="status-item" id="statusStorage">
                                <i class="fas fa-database"></i>
                                <span>Armazenamento</span>
                                <span class="status-badge" id="badgeStorage">Checking...</span>
                            </div>
                            <div class="status-item" id="statusScript">
                                <i class="fas fa-code"></i>
                                <span>Apps Script</span>
                                <span class="status-badge" id="badgeScript">Checking...</span>
                            </div>
                            <div class="status-item" id="statusConexao">
                                <i class="fas fa-cloud"></i>
                                <span>Conexão</span>
                                <span class="status-badge" id="badgeConexao">Checking...</span>
                            </div>
                        </div>
                    </div>
                    // Botões para abrir SUAS planilhas configuradas
                    <div class="grid grid-2 gap-2 mt-3">
                        <button class="btn btn-outline-primary" id="btnAbrirMinhaFrequencia">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir MINHA Planilha Frequência
                        </button>
                        <button class="btn btn-outline-primary" id="btnAbrirMinhaAcompanhamento">
                            <i class="fas fa-external-link-alt"></i>
                            Abrir MINHA Planilha Acompanhamento
                        </button>
                    </div>
                    <!-- Como obter o ID da Planilha -->
                    <div class="card mb-4">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-question-circle"></i>
                                Onde encontrar o ID da Planilha?
                            </h3>
                        </div>
                        <div class="card-body">
                            <p>O ID da planilha está na URL do Google Sheets:</p>
                            <div class="alert alert-secondary">
                                <code>https://docs.google.com/spreadsheets/d/<strong>SEU_ID_AQUI</strong>/edit#gid=0</code>
                            </div>
                            <p>Copie apenas a parte destacada (44 caracteres).</p>
                            <button class="btn btn-sm btn-outline-secondary" id="btnMostrarExemplo">
                                <i class="fas fa-eye"></i>
                                Ver Exemplo Visual
                            </button>
                        </div>
                    </div>
                    
                    <!-- Links Úteis -->
                    <div class="mb-4">
                        <h3 class="card-title">
                            <i class="fas fa-link"></i>
                            Links Úteis
                        </h3>
                        <div class="grid grid-2 gap-2 mt-2">
                            <a href="${CONFIG.TEMPLATE_IDS.FREQUENCIA ? `https://docs.google.com/spreadsheets/d/${CONFIG.TEMPLATE_IDS.FREQUENCIA}/edit` : '#'}" 
                               class="btn btn-outline-primary" target="_blank" ${!CONFIG.TEMPLATE_IDS.FREQUENCIA ? 'disabled' : ''}>
                                <i class="fas fa-external-link-alt"></i>
                                Template Frequência
                            </a>
                            <a href="${CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO ? `https://docs.google.com/spreadsheets/d/${CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO}/edit` : '#'}" 
                               class="btn btn-outline-primary" target="_blank" ${!CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO ? 'disabled' : ''}>
                                <i class="fas fa-external-link-alt"></i>
                                Template Acompanhamento
                            </a>
                        </div>
                    </div>
                    
                    <!-- Informações Técnicas -->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">
                                <i class="fas fa-cogs"></i>
                                Informações Técnicas
                            </h3>
                        </div>
                        <div class="card-body">
                            <div class="info-tecnica">
                                <div class="info-item">
                                    <span>Versão do App:</span>
                                    <span id="versaoApp">1.0.0</span>
                                </div>
                                <div class="info-item">
                                    <span>Última Atualização:</span>
                                    <span id="dataAtualizacao">${formatarData(new Date())}</span>
                                </div>
                                <div class="info-item">
                                    <span>Backups Locais:</span>
                                    <span id="contadorBackups">0</span>
                                </div>
                                <div class="info-item">
                                    <span>Espaço Usado:</span>
                                    <span id="espacoUsado">Calculando...</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Botão de Suporte -->
                    <button class="btn btn-outline-info btn-block mt-4" id="btnSuporte">
                        <i class="fas fa-life-ring"></i>
                        Precisa de Ajuda?
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Seção de Backup -->
        <div class="card mt-3">
            <div class="card-header">
                <h2 class="card-title">
                    <i class="fas fa-shield-alt"></i>
                    Backup e Restauração
                </h2>
            </div>
            <div class="card-body">
                <div class="grid grid-3 gap-2">
                    <button class="btn btn-outline-primary" id="btnExportarBackup">
                        <i class="fas fa-download"></i>
                        Exportar Backup
                    </button>
                    <button class="btn btn-outline-secondary" id="btnImportarBackup">
                        <i class="fas fa-upload"></i>
                        Importar Backup
                    </button>
                    <button class="btn btn-outline-danger" id="btnLimparBackups">
                        <i class="fas fa-broom"></i>
                        Limpar Backups Antigos
                    </button>
                </div>
                <small class="text-muted mt-2 d-block">
                    Os backups são salvos automaticamente no seu navegador. Recomendamos exportar periodicamente.
                </small>
            </div>
        </div>
    `;
    
    // Adiciona estilos específicos
    adicionarEstilosConfiguracoes();
    
    // Verifica status do sistema
    verificarStatusSistema();
}

/**
 * Adiciona estilos CSS específicos para a aba configurações
 */
function adicionarEstilosConfiguracoes() {
    const style = document.createElement('style');
    style.textContent = `
        .list-instructions {
            padding-left: 1.5rem;
            margin-bottom: 0;
        }
        .list-instructions li {
            margin-bottom: 0.5rem;
        }
        .status-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem;
            background: var(--branco-gelo);
            border-radius: 8px;
        }
        .status-item i {
            color: var(--verde-musgo);
        }
        .status-badge {
            margin-left: auto;
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .status-badge.success {
            background: rgba(76, 175, 80, 0.1);
            color: var(--sucesso);
        }
        .status-badge.warning {
            background: rgba(255, 152, 0, 0.1);
            color: var(--alerta);
        }
        .status-badge.error {
            background: rgba(244, 67, 54, 0.1);
            color: var(--erro);
        }
        .info-tecnica {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .info-item {
            display: flex;
            justify-content: space-between;
            padding: 0.25rem 0;
            border-bottom: 1px solid var(--cinza-claro);
        }
        .info-item:last-child {
            border-bottom: none;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Configura os event listeners da aba configurações
 */
function configurarEventListenersConfiguracoes() {
    // Botões para abrir templates
    const btnAbrirTemplateFrequencia = document.getElementById('btnAbrirTemplateFrequencia');
    if (btnAbrirTemplateFrequencia) {
        btnAbrirTemplateFrequencia.addEventListener('click', () => {
            if (CONFIG.TEMPLATE_IDS.FREQUENCIA) {
                window.open(
                    `https://docs.google.com/spreadsheets/d/${CONFIG.TEMPLATE_IDS.FREQUENCIA}/copy`,
                    '_blank'
                );
                mostrarNotificacao('Abra o template e faça uma cópia para seu Drive', 'info', 5000);
            } else {
                mostrarNotificacao('ID do template de frequência não configurado', 'error');
            }
        });
    }
    
    const btnAbrirTemplateAcompanhamento = document.getElementById('btnAbrirTemplateAcompanhamento');
    if (btnAbrirTemplateAcompanhamento) {
        btnAbrirTemplateAcompanhamento.addEventListener('click', () => {
            if (CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO) {
                window.open(
                    `https://docs.google.com/spreadsheets/d/${CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO}/copy`,
                    '_blank'
                );
                mostrarNotificacao('Abra o template e faça uma cópia para seu Drive', 'info', 5000);
            } else {
                mostrarNotificacao('ID do template de acompanhamento não configurado', 'error');
            }
        });
    }
    
    // Botão testar conexão
    const btnTestarConexao = document.getElementById('btnTestarConexao');
    if (btnTestarConexao) {
        btnTestarConexao.addEventListener('click', testarConexaoCompleta);
    }
    
    // Botão salvar configurações
    const btnSalvarConfiguracoes = document.getElementById('btnSalvarConfiguracoes');
    if (btnSalvarConfiguracoes) {
        btnSalvarConfiguracoes.addEventListener('click', salvarConfiguracoesAtuais);
    }
    
    // Botão limpar configurações
    const btnLimparConfiguracoes = document.getElementById('btnLimparConfiguracoes');
    if (btnLimparConfiguracoes) {
        btnLimparConfiguracoes.addEventListener('click', limparConfiguracoesAtuais);
    }
    
    // Botão copiar informações
    const btnCopiarInfo = document.getElementById('btnCopiarInfo');
    if (btnCopiarInfo) {
        btnCopiarInfo.addEventListener('click', copiarInformacoesSistema);
    }
    
    // Botão mostrar exemplo visual
    const btnMostrarExemplo = document.getElementById('btnMostrarExemplo');
    if (btnMostrarExemplo) {
        btnMostrarExemplo.addEventListener('click', mostrarExemploVisualId);
    }
    
    // Botão suporte
    const btnSuporte = document.getElementById('btnSuporte');
    if (btnSuporte) {
        btnSuporte.addEventListener('click', mostrarModalSuporte);
    }
    
    // Botões de backup
    const btnExportarBackup = document.getElementById('btnExportarBackup');
    if (btnExportarBackup) {
        btnExportarBackup.addEventListener('click', exportarBackupCompleto);
    }
    
    const btnImportarBackup = document.getElementById('btnImportarBackup');
    if (btnImportarBackup) {
        btnImportarBackup.addEventListener('click', importarBackup);
    }
    
    const btnLimparBackups = document.getElementById('btnLimparBackups');
    if (btnLimparBackups) {
        btnLimparBackups.addEventListener('click', limparBackupsAntigos);
    }
    // Botões para abrir planilhas configuradas
const btnAbrirMinhaFrequencia = document.getElementById('btnAbrirMinhaFrequencia');
if (btnAbrirMinhaFrequencia) {
    btnAbrirMinhaFrequencia.addEventListener('click', () => {
        const config = carregarConfiguracoes();
        if (config.sheetIdFrequencia) {
            window.open(`https://docs.google.com/spreadsheets/d/${config.sheetIdFrequencia}/edit`, '_blank');
            mostrarNotificacao('Abrindo sua planilha de frequência...', 'info', 3000);
        } else {
            mostrarNotificacao('Configure o ID da planilha de frequência primeiro', 'error');
        }
    });
}

const btnAbrirMinhaAcompanhamento = document.getElementById('btnAbrirMinhaAcompanhamento');
if (btnAbrirMinhaAcompanhamento) {
    btnAbrirMinhaAcompanhamento.addEventListener('click', () => {
        const config = carregarConfiguracoes();
        if (config.sheetIdAcompanhamento) {
            window.open(`https://docs.google.com/spreadsheets/d/${config.sheetIdAcompanhamento}/edit`, '_blank');
            mostrarNotificacao('Abrindo sua planilha de acompanhamento...', 'info', 3000);
        } else {
            mostrarNotificacao('Configure o ID da planilha de acompanhamento primeiro', 'error');
        }
    });
}
    // Campos de ID - processamento automático
    const idPlanilhaFrequencia = document.getElementById('idPlanilhaFrequencia');
    if (idPlanilhaFrequencia) {
        idPlanilhaFrequencia.addEventListener('change', () => {
            const id = extrairIdPlanilha(idPlanilhaFrequencia.value);
            const infoIdFrequencia = document.getElementById('infoIdFrequencia');
            
            if (infoIdFrequencia) {
                if (validarIdPlanilha(id)) {
                    infoIdFrequencia.textContent = '✓ ID válido';
                    infoIdFrequencia.style.color = 'var(--sucesso)';
                } else {
                    infoIdFrequencia.textContent = '⚠ ID pode estar incorreto';
                    infoIdFrequencia.style.color = 'var(--alerta)';
                }
            }
        });
    }
    
    const idPlanilhaAcompanhamento = document.getElementById('idPlanilhaAcompanhamento');
    if (idPlanilhaAcompanhamento) {
        idPlanilhaAcompanhamento.addEventListener('change', () => {
            const id = extrairIdPlanilha(idPlanilhaAcompanhamento.value);
            const infoIdAcompanhamento = document.getElementById('infoIdAcompanhamento');
            
            if (infoIdAcompanhamento) {
                if (validarIdPlanilha(id)) {
                    infoIdAcompanhamento.textContent = '✓ ID válido';
                    infoIdAcompanhamento.style.color = 'var(--sucesso)';
                } else {
                    infoIdAcompanhamento.textContent = '⚠ ID pode estar incorreto';
                    infoIdAcompanhamento.style.color = 'var(--alerta)';
                }
            }
        });
    }
}

/**
 * Carrega configurações salvas
 */
function carregarConfiguracoesSalvas() {
    try {
        const config = carregarConfiguracoes();
        
        // Preenche campos
        const idPlanilhaFrequencia = document.getElementById('idPlanilhaFrequencia');
        const idPlanilhaAcompanhamento = document.getElementById('idPlanilhaAcompanhamento');
        
        if (idPlanilhaFrequencia && config.sheetIdFrequencia) {
            idPlanilhaFrequencia.value = config.sheetIdFrequencia;
            
            // Dispara evento para validar
            const event = new Event('change');
            idPlanilhaFrequencia.dispatchEvent(event);
        }
        
        if (idPlanilhaAcompanhamento && config.sheetIdAcompanhamento) {
            idPlanilhaAcompanhamento.value = config.sheetIdAcompanhamento;
            
            // Dispara evento para validar
            const event = new Event('change');
            idPlanilhaAcompanhamento.dispatchEvent(event);
        }
        
        // Atualiza status
        atualizarStatusConfiguracoes();
        
    } catch (error) {
        console.error('Erro ao carregar configurações:', error);
    }
}

/**
 * Atualiza status das configurações
 */
function atualizarStatusConfiguracoes() {
    const config = verificarConfiguracoesMinimas();
    const statusConfig = document.getElementById('statusConfig');
    
    if (!statusConfig) return;
    
    if (config.todasConfiguradas) {
        statusConfig.textContent = '✓ Configurado';
        statusConfig.className = 'badge badge-success';
    } else if (config.frequenciaConfigurada || config.acompanhamentoConfigurado) {
        statusConfig.textContent = '⚠ Parcial';
        statusConfig.className = 'badge badge-warning';
    } else {
        statusConfig.textContent = 'Não configurado';
        statusConfig.className = 'badge badge-error';
    }
}

/**
 * Verifica status do sistema
 */
async function verificarStatusSistema() {
    // Status PWA
    const badgePWA = document.getElementById('badgePWA');
    if (badgePWA) {
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            badgePWA.textContent = '✓ Disponível';
            badgePWA.className = 'status-badge success';
        } else {
            badgePWA.textContent = '⚠ Limitado';
            badgePWA.className = 'status-badge warning';
        }
    }
    
    // Status Storage
    const badgeStorage = document.getElementById('badgeStorage');
    if (badgeStorage) {
        try {
            // Testa localStorage
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            badgeStorage.textContent = '✓ OK';
            badgeStorage.className = 'status-badge success';
        } catch (error) {
            badgeStorage.textContent = '✗ Erro';
            badgeStorage.className = 'status-badge error';
        }
    }
    
    // Status Apps Script
    const badgeScript = document.getElementById('badgeScript');
    if (badgeScript) {
        if (CONFIG.APP_SCRIPT_URL && !CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            badgeScript.textContent = '✓ Configurado';
            badgeScript.className = 'status-badge success';
        } else {
            badgeScript.textContent = '⚠ Não configurado';
            badgeScript.className = 'status-badge warning';
        }
    }
    
    // Status Conexão
    const badgeConexao = document.getElementById('badgeConexao');
    if (badgeConexao) {
        if (navigator.onLine) {
            badgeConexao.textContent = '✓ Online';
            badgeConexao.className = 'status-badge success';
        } else {
            badgeConexao.textContent = '✗ Offline';
            badgeConexao.className = 'status-badge error';
        }
    }
    
    // Atualiza contador de backups
    atualizarContadorBackups();
    
    // Atualiza espaço usado
    calcularEspacoUsado();
}

/**
 * Atualiza contador de backups
 */
function atualizarContadorBackups() {
    const contadorBackups = document.getElementById('contadorBackups');
    if (!contadorBackups) return;
    
    let contador = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
        const chave = localStorage.key(i);
        if (chave.startsWith('backup_')) {
            contador++;
        }
    }
    
    contadorBackups.textContent = contador;
}

/**
 * Calcula espaço usado no localStorage
 */
function calcularEspacoUsado() {
    const espacoUsado = document.getElementById('espacoUsado');
    if (!espacoUsado) return;
    
    try {
        let total = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            const valor = localStorage.getItem(chave);
            total += (chave.length + valor.length) * 2; // Cada caractere = 2 bytes
        }
        
        const mb = total / (1024 * 1024);
        espacoUsado.textContent = `${mb.toFixed(2)} MB`;
        
    } catch (error) {
        espacoUsado.textContent = 'Erro ao calcular';
    }
}

/**
 * Testa conexão completa
 */
async function testarConexaoCompleta() {
    const btnTestarConexao = document.getElementById('btnTestarConexao');
    const textoOriginal = btnTestarConexao?.innerHTML;
    
    if (btnTestarConexao) {
        btnTestarConexao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';
        btnTestarConexao.disabled = true;
    }
    
    try {
        // Testa conexão com Apps Script
        const resultado = await testarConexaoAppsScript();
        
        // Testa IDs das planilhas
        const config = carregarConfiguracoes();
        const idsValidos = {
            frequencia: validarIdPlanilha(config.sheetIdFrequencia),
            acompanhamento: validarIdPlanilha(config.sheetIdAcompanhamento)
        };
        
        // Mostra resultado
        let mensagem = '';
        
        if (resultado) {
            mensagem += '✓ Conexão com Apps Script estabelecida\n';
        } else {
            mensagem += '⚠ Problema na conexão com Apps Script\n';
        }
        
        if (idsValidos.frequencia) {
            mensagem += '✓ ID da planilha de frequência válido\n';
        } else {
            mensagem += '⚠ ID da planilha de frequência inválido ou não configurado\n';
        }
        
        if (idsValidos.acompanhamento) {
            mensagem += '✓ ID da planilha de acompanhamento válido\n';
        } else {
            mensagem += '⚠ ID da planilha de acompanhamento inválido ou não configurado\n';
        }
        
        mostrarModal(
            'Resultado do Teste de Conexão',
            `<pre style="white-space: pre-wrap;">${mensagem}</pre>`,
            `<button class="btn btn-primary" onclick="fecharModal()">OK</button>`
        );
        
    } catch (error) {
        mostrarNotificacao('Erro ao testar conexão: ' + error.message, 'error');
    } finally {
        if (btnTestarConexao) {
            btnTestarConexao.innerHTML = textoOriginal;
            btnTestarConexao.disabled = false;
        }
    }
}

/**
 * Salva configurações atuais
 */
function salvarConfiguracoesAtuais() {
    try {
        const idFrequencia = document.getElementById('idPlanilhaFrequencia')?.value;
        const idAcompanhamento = document.getElementById('idPlanilhaAcompanhamento')?.value;
        
        // Extrai IDs das URLs
        const idFrequenciaLimpo = extrairIdPlanilha(idFrequencia);
        const idAcompanhamentoLimpo = extrairIdPlanilha(idAcompanhamento);
        
        // Valida IDs
        if (idFrequenciaLimpo && !validarIdPlanilha(idFrequenciaLimpo)) {
            throw new Error('ID da planilha de frequência parece inválido');
        }
        
        if (idAcompanhamentoLimpo && !validarIdPlanilha(idAcompanhamentoLimpo)) {
            throw new Error('ID da planilha de acompanhamento parece inválido');
        }
        
        // Salva configurações
        const resultado = salvarConfiguracoes({
            sheetIdFrequencia: idFrequenciaLimpo,
            sheetIdAcompanhamento: idAcompanhamentoLimpo
        });
        
        if (resultado) {
            mostrarNotificacao('Configurações salvas com sucesso!', 'success');
            atualizarStatusConfiguracoes();
            
            // Recarrega as outras abas se necessário
            setTimeout(() => {
                if (typeof initFrequencia === 'function') initFrequencia();
                if (typeof initAcompanhamento === 'function') initAcompanhamento();
            }, 500);
        } else {
            throw new Error('Erro ao salvar configurações');
        }
        
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        mostrarNotificacao(`Erro: ${error.message}`, 'error');
    }
}

/**
 * Limpa configurações atuais
 */
function limparConfiguracoesAtuais() {
    if (!confirm('Tem certeza que deseja limpar todas as configurações? Isso não apagará suas planilhas, apenas as referências no aplicativo.')) {
        return;
    }
    
    try {
        const resultado = limparConfiguracoes();
        
        if (resultado) {
            // Limpa campos
            const idPlanilhaFrequencia = document.getElementById('idPlanilhaFrequencia');
            const idPlanilhaAcompanhamento = document.getElementById('idPlanilhaAcompanhamento');
            
            if (idPlanilhaFrequencia) idPlanilhaFrequencia.value = '';
            if (idPlanilhaAcompanhamento) idPlanilhaAcompanhamento.value = '';
            
            // Atualiza status
            atualizarStatusConfiguracoes();
            
            // Atualiza informações
            const infoIdFrequencia = document.getElementById('infoIdFrequencia');
            const infoIdAcompanhamento = document.getElementById('infoIdAcompanhamento');
            
            if (infoIdFrequencia) {
                infoIdFrequencia.textContent = 'Não configurado';
                infoIdFrequencia.style.color = '';
            }
            
            if (infoIdAcompanhamento) {
                infoIdAcompanhamento.textContent = 'Não configurado';
                infoIdAcompanhamento.style.color = '';
            }
            
            mostrarNotificacao('Configurações limpas com sucesso!', 'success');
        }
        
    } catch (error) {
        console.error('Erro ao limpar configurações:', error);
        mostrarNotificacao('Erro ao limpar configurações', 'error');
    }
}

/**
 * Copia informações do sistema
 */
function copiarInformacoesSistema() {
    try {
        const config = carregarConfiguracoes();
        
        const info = `
=== INFORMAÇÕES DO SISTEMA ===
Data: ${new Date().toLocaleString('pt-BR')}
App: Controle de Frequência v1.0.0

=== CONFIGURAÇÕES ===
Planilha Frequência: ${config.sheetIdFrequencia || 'Não configurado'}
Planilha Acompanhamento: ${config.sheetIdAcompanhamento || 'Não configurado'}
Apps Script URL: ${CONFIG.APP_SCRIPT_URL}

=== STATUS ===
Online: ${navigator.onLine ? 'Sim' : 'Não'}
PWA: ${'serviceWorker' in navigator ? 'Suportado' : 'Não suportado'}
LocalStorage: ${testarLocalStorage() ? 'OK' : 'Erro'}

=== DADOS LOCAIS ===
Backups: ${document.getElementById('contadorBackups')?.textContent || '0'}
Espaço usado: ${document.getElementById('espacoUsado')?.textContent || 'Desconhecido'}
        `.trim();
        
        navigator.clipboard.writeText(info)
            .then(() => {
                mostrarNotificacao('Informações copiadas para a área de transferência!', 'success');
            })
            .catch(() => {
                // Fallback para navegadores mais antigos
                const textarea = document.createElement('textarea');
                textarea.value = info;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                mostrarNotificacao('Informações copiadas!', 'success');
            });
        
    } catch (error) {
        console.error('Erro ao copiar informações:', error);
        mostrarNotificacao('Erro ao copiar informações', 'error');
    }
}

/**
 * Testa localStorage
 */
function testarLocalStorage() {
    try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Mostra exemplo visual de onde encontrar o ID
 */
function mostrarExemploVisualId() {
    const conteudo = `
        <div class="text-center">
            <p class="mb-3">Na URL do Google Sheets, o ID está nesta parte:</p>
            <div class="alert alert-secondary text-left">
                <code style="font-size: 0.9rem;">
                    https://docs.google.com/spreadsheets/d/<br>
                    <strong style="color: var(--verde-musgo); background: yellow; padding: 2px;">1ZySSwFVpWmYBfumdndJvIQMswqOzhYI2FyNs2uSIZiA</strong><br>
                    /edit#gid=0
                </code>
            </div>
            <p class="mt-3">Copie apenas a parte destacada em amarelo (44 caracteres).</p>
            <img src="https://via.placeholder.com/600x200/556B2F/FFFFFF?text=Exemplo+Visual+do+ID+da+Planilha" 
                 alt="Exemplo visual" 
                 class="img-fluid mt-2 rounded"
                 style="border: 2px solid var(--cinza-claro);">
        </div>
    `;
    
    mostrarModal('Onde encontrar o ID da Planilha', conteudo);
}

/**
 * Mostra modal de suporte
 */
function mostrarModalSuporte() {
    const conteudo = `
        <div>
            <h4 class="mb-3">Precisa de Ajuda?</h4>
            
            <div class="alert alert-info">
                <i class="fas fa-info-circle"></i>
                <p>Se você está tendo problemas com o aplicativo, siga estes passos:</p>
            </div>
            
            <ol class="mb-3">
                <li><strong>Verifique as configurações</strong> - Certifique-se de que os IDs das planilhas estão corretos</li>
                <li><strong>Teste a conexão</strong> - Use o botão "Testar Conexão" na aba Configurações</li>
                <li><strong>Verifique o compartilhamento</strong> - Suas planilhas devem estar como "Qualquer pessoa pode EDITAR"</li>
                <li><strong>Limpe o cache</strong> - Tente limpar os dados do navegador se persistirem problemas</li>
            </ol>
            
            <div class="alert alert-warning">
                <i class="fas fa-exclamation-triangle"></i>
                <p><strong>Importante:</strong> Este aplicativo não coleta seus dados. Tudo é salvo diretamente nas SUAS planilhas do Google.</p>
            </div>
            
            <p>Se os problemas persistirem, entre em contato com o suporte.</p>
        </div>
    `;
    
    mostrarModal(
        'Suporte e Ajuda',
        conteudo,
        `
            <button class="btn btn-secondary" onclick="fecharModal()">Fechar</button>
            <button class="btn btn-primary" onclick="testarConexaoCompleta(); fecharModal();">
                <i class="fas fa-wifi"></i>
                Testar Conexão Agora
            </button>
        `
    );
}

/**
 * Exporta backup completo
 */
function exportarBackupCompleto() {
    try {
        const backup = {
            versao: '1.0',
            data: new Date().toISOString(),
            config: carregarConfiguracoes(),
            observacoes: {},
            backups: []
        };
        
        // Coleta todas as observações
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            
            if (chave.startsWith('observacoes_')) {
                try {
                    backup.observacoes[chave] = JSON.parse(localStorage.getItem(chave));
                } catch (e) {
                    // Ignora erros
                }
            } else if (chave.startsWith('backup_')) {
                try {
                    backup.backups.push({
                        chave: chave,
                        dados: JSON.parse(localStorage.getItem(chave))
                    });
                } catch (e) {
                    // Ignora erros
                }
            }
        }
        
        // Cria blob para download
        const json = JSON.stringify(backup, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        
        link.href = url;
        link.setAttribute('download', `backup_frequencia_${formatarData(new Date()).replace(/\//g, '-')}.json`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        mostrarNotificacao('Backup exportado com sucesso!', 'success');
        
    } catch (error) {
        console.error('Erro ao exportar backup:', error);
        mostrarNotificacao('Erro ao exportar backup', 'error');
    }
}

/**
 * Importa backup
 */
function importarBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        try {
            const file = e.target.files[0];
            if (!file) return;
            
            const texto = await file.text();
            const backup = JSON.parse(texto);
            
            // Valida backup
            if (!backup.versao || !backup.data) {
                throw new Error('Arquivo de backup inválido');
            }
            
            if (!confirm(`Deseja importar backup de ${formatarData(new Date(backup.data))}?`)) {
                return;
            }
            
            // Importa configurações
            if (backup.config) {
                salvarConfiguracoes(backup.config);
                carregarConfiguracoesSalvas();
            }
            
            // Importa observações
            if (backup.observacoes) {
                Object.entries(backup.observacoes).forEach(([chave, dados]) => {
                    localStorage.setItem(chave, JSON.stringify(dados));
                });
            }
            
            // Importa backups
            if (backup.backups) {
                backup.backups.forEach(item => {
                    localStorage.setItem(item.chave, JSON.stringify(item.dados));
                });
            }
            
            mostrarNotificacao('Backup importado com sucesso! Recarregando...', 'success');
            
            // Recarrega a página após 2 segundos
            setTimeout(() => {
                location.reload();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            mostrarNotificacao(`Erro ao importar backup: ${error.message}`, 'error');
        }
    };
    
    input.click();
}

/**
 * Limpa backups antigos
 */
function limparBackupsAntigos() {
    try {
        const seteDiasAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
        let removidos = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            
            if (chave.startsWith('backup_')) {
                try {
                    const backup = JSON.parse(localStorage.getItem(chave));
                    
                    if (backup && backup.timestamp) {
                        const timestampBackup = new Date(backup.timestamp).getTime();
                        
                        if (timestampBackup < seteDiasAtras) {
                            localStorage.removeItem(chave);
                            removidos++;
                            i--; // Ajusta índice após remoção
                        }
                    }
                } catch (e) {
                    // Ignora erros
                }
            }
        }
        
        mostrarNotificacao(`${removidos} backups antigos removidos`, 'success');
        atualizarContadorBackups();
        calcularEspacoUsado();
        
    } catch (error) {
        console.error('Erro ao limpar backups:', error);
        mostrarNotificacao('Erro ao limpar backups', 'error');
    }
}
