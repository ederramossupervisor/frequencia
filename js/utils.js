// ============================================
// FUNÇÕES DE DATA/HORA NO FUSO DE BRASÍLIA
// ============================================

/**
 * Retorna a data atual no fuso de Brasília como string YYYY-MM-DD
 * Ideal para inputs type="date"
 */
function getDataAtualBrasiliaISO() {
  const data = new Date();
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(data);
  
  const ano = partes.find(p => p.type === 'year').value;
  const mes = partes.find(p => p.type === 'month').value;
  const dia = partes.find(p => p.type === 'day').value;
  return `${ano}-${mes}-${dia}`;
}

/**
 * Retorna a hora atual no fuso de Brasília como string HH:MM
 * Ideal para campos de hora (não usado diretamente, mas disponível)
 */
function getHoraAtualBrasilia() {
  const data = new Date();
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(data);
  
  const hora = partes.find(p => p.type === 'hour').value;
  const minuto = partes.find(p => p.type === 'minute').value;
  return `${hora}:${minuto}`;
}

/**
 * Obtém o mês atual (ex: "JANEIRO") no fuso de Brasília
 */
function obterMesAtual() {
  const data = new Date();
  const mesNumero = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    month: 'numeric'
  }).format(data); // retorna "1" a "12"
  const meses = CONFIG.MESES;
  return meses[parseInt(mesNumero) - 1];
}

/**
 * Obtém o dia atual (1-31) no fuso de Brasília
 */
function obterDiaAtual() {
  const data = new Date();
  const dia = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: 'numeric'
  }).format(data);
  return parseInt(dia);
}

// ============================================
// FUNÇÕES UTILITÁRIAS DO APLICATIVO
// ============================================

/**
 * Formata data no formato brasileiro (dd/mm/aaaa)
 * (mantida para compatibilidade, mas prefira as funções de fuso acima)
 */
function formatarData(data) {
    const d = new Date(data);
    const offset = d.getTimezoneOffset();
    d.setMinutes(d.getMinutes() + offset);
    
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0');
    const ano = d.getFullYear();
    
    return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora no formato 00:00
 */
function formatarHora(horaString) {
    if (!horaString) return '';
    
    const horaLimpa = horaString.replace(/[^\d:]/g, '');
    
    if (/^\d{1,2}:\d{2}$/.test(horaLimpa)) {
        const [horas, minutos] = horaLimpa.split(':');
        return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
    }
    
    if (/^\d{3,4}$/.test(horaLimpa)) {
        const hora = horaLimpa.padStart(4, '0');
        return `${hora.substring(0, 2)}:${hora.substring(2, 4)}`;
    }
    
    return '';
}

/**
 * Calcula horas trabalhadas
 */
function calcularHorasTrabalhadas(entrada, saida, almoco = "01:00") {
    if (!entrada || !saida) return "00:00";
    
    const [entHora, entMin] = entrada.split(':').map(Number);
    const [saiHora, saiMin] = saida.split(':').map(Number);
    const [almHora, almMin] = almoco.split(':').map(Number);
    
    let totalMinutos = (saiHora * 60 + saiMin) - (entHora * 60 + entMin);
    totalMinutos -= (almHora * 60 + almMin);
    
    if (totalMinutos < 0) totalMinutos = 0;
    
    const horas = Math.floor(totalMinutos / 60);
    const minutos = totalMinutos % 60;
    
    return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Extrai ID da planilha da URL do Google Sheets
 */
function extrairIdPlanilha(url) {
    if (!url) return '';
    
    const padroes = [
        /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
        /\/d\/([a-zA-Z0-9-_]+)\//,
        /id=([a-zA-Z0-9-_]+)/,
        /^([a-zA-Z0-9-_]+)$/
    ];
    
    for (const padrao of padroes) {
        const match = url.match(padrao);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    return url.trim();
}

/**
 * Valida se um ID parece ser um ID válido do Google Sheets
 */
function validarIdPlanilha(id) {
    return id && /^[a-zA-Z0-9-_]{44}$/.test(id);
}

/**
 * Mostra notificação na tela
 */
function mostrarNotificacao(mensagem, tipo = 'info', duracao = 5000) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    if (!notification || !notificationText) return;
    
    notification.classList.remove('success', 'error', 'warning');
    notification.classList.add(tipo);
    notificationText.textContent = mensagem;
    notification.classList.remove('hidden');
    
    if (duracao > 0) {
        setTimeout(() => {
            notification.classList.add('hidden');
        }, duracao);
    }
}

/**
 * Esconde notificação manualmente
 */
function esconderNotificacao() {
    const notification = document.getElementById('notification');
    if (notification) {
        notification.classList.add('hidden');
    }
}

/**
 * Mostra modal genérico
 */
function mostrarModal(titulo, corpoHtml, rodapeHtml = '') {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const modalFooter = document.getElementById('modalFooter');
    
    if (!modal || !modalTitle || !modalBody || !modalFooter) return;
    
    modalTitle.textContent = titulo;
    modalBody.innerHTML = corpoHtml;
    modalFooter.innerHTML = rodapeHtml;
    
    modal.classList.remove('hidden');
    
    return () => modal.classList.add('hidden');
}

/**
 * Fecha modal
 */
function fecharModal() {
    const modal = document.getElementById('modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// ============================================
// FUNÇÕES AUXILIARES DE BACKUP
// ============================================

function salvarBackupConfiguracoes(frequenciaId, acompanhamentoId) {
    try {
        if (frequenciaId) sessionStorage.setItem('backup_frequencia_id', frequenciaId);
        if (acompanhamentoId) sessionStorage.setItem('backup_acompanhamento_id', acompanhamentoId);
        
        if (frequenciaId) setCookie('app_frequencia_id', frequenciaId, 30);
        if (acompanhamentoId) setCookie('app_acompanhamento_id', acompanhamentoId, 30);
        
        const backupAuto = {
            sheetIdFrequencia: frequenciaId || '',
            sheetIdAcompanhamento: acompanhamentoId || '',
            timestamp: new Date().toISOString()
        };
        localStorage.setItem('app_config_backup', JSON.stringify(backupAuto));
        
        return true;
    } catch (error) {
        console.error('Erro ao fazer backup:', error);
        return false;
    }
}

function getCookie(nome) {
    try {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.startsWith(nome + '=')) {
                return cookie.substring(nome.length + 1);
            }
        }
        return null;
    } catch (error) {
        console.error('Erro ao ler cookie:', error);
        return null;
    }
}

function setCookie(nome, valor, diasParaExpirar) {
    try {
        const data = new Date();
        data.setTime(data.getTime() + (diasParaExpirar * 24 * 60 * 60 * 1000));
        const expira = "expires=" + data.toUTCString();
        document.cookie = nome + "=" + valor + ";" + expira + ";path=/;SameSite=Strict";
        return true;
    } catch (error) {
        console.error('Erro ao salvar cookie:', error);
        return false;
    }
}

function deleteCookie(nome) {
    try {
        document.cookie = nome + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        return true;
    } catch (error) {
        console.error('Erro ao deletar cookie:', error);
        return false;
    }
}

/**
 * Carrega configurações do localStorage e backups
 */
function carregarConfiguracoes() {
    try {
        let sheetIdFrequencia = localStorage.getItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID);
        let sheetIdAcompanhamento = localStorage.getItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID);
        
        if (sheetIdFrequencia || sheetIdAcompanhamento) {
            salvarBackupConfiguracoes(sheetIdFrequencia, sheetIdAcompanhamento);
        }
        
        if ((!sheetIdFrequencia || !sheetIdAcompanhamento)) {
            const backupFrequencia = sessionStorage.getItem('backup_frequencia_id');
            const backupAcompanhamento = sessionStorage.getItem('backup_acompanhamento_id');
            
            if (backupFrequencia) {
                sheetIdFrequencia = backupFrequencia;
                localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID, backupFrequencia);
            }
            if (backupAcompanhamento) {
                sheetIdAcompanhamento = backupAcompanhamento;
                localStorage.setItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID, backupAcompanhamento);
            }
        }
        
        if ((!sheetIdFrequencia || !sheetIdAcompanhamento)) {
            const cookieFrequencia = getCookie('app_frequencia_id');
            const cookieAcompanhamento = getCookie('app_acompanhamento_id');
            
            if (cookieFrequencia) {
                sheetIdFrequencia = cookieFrequencia;
                localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID, cookieFrequencia);
            }
            if (cookieAcompanhamento) {
                sheetIdAcompanhamento = cookieAcompanhamento;
                localStorage.setItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID, cookieAcompanhamento);
            }
            if (cookieFrequencia || cookieAcompanhamento) {
                salvarBackupConfiguracoes(cookieFrequencia, cookieAcompanhamento);
            }
        }
        
        if ((!sheetIdFrequencia || !sheetIdAcompanhamento)) {
            try {
                const backupAuto = JSON.parse(localStorage.getItem('app_config_backup') || '{}');
                if (backupAuto.sheetIdFrequencia) {
                    sheetIdFrequencia = backupAuto.sheetIdFrequencia;
                    localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID, backupAuto.sheetIdFrequencia);
                }
                if (backupAuto.sheetIdAcompanhamento) {
                    sheetIdAcompanhamento = backupAuto.sheetIdAcompanhamento;
                    localStorage.setItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID, backupAuto.sheetIdAcompanhamento);
                }
            } catch (e) {}
        }
        
        const config = {
            sheetIdFrequencia: sheetIdFrequencia || '',
            sheetIdAcompanhamento: sheetIdAcompanhamento || ''
        };
        
        return config;
    } catch (error) {
        console.error('Erro crítico ao carregar configurações:', error);
        return {
            sheetIdFrequencia: '',
            sheetIdAcompanhamento: ''
        };
    }
}

/**
 * Salva configurações no localStorage e backups
 */
function salvarConfiguracoes(config) {
    try {
        if (config.sheetIdFrequencia) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID, config.sheetIdFrequencia);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID);
        }
        
        if (config.sheetIdAcompanhamento) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID, config.sheetIdAcompanhamento);
        } else {
            localStorage.removeItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID);
        }
        
        salvarBackupConfiguracoes(config.sheetIdFrequencia || '', config.sheetIdAcompanhamento || '');
        
        // NOVO: envia também para o servidor (Apps Script), para não depender
        // só do navegador. Fire-and-forget, não bloqueia o salvamento local.
        if (typeof enviarConfigParaServidor === 'function') {
            enviarConfigParaServidor(config);
        }
        
        const timestamp = {
            ultimaAlteracao: new Date().toISOString(),
            usuario: 'app_user',
            versao: '1.0'
        };
        localStorage.setItem('app_config_timestamp', JSON.stringify(timestamp));
        
        try {
            window.dispatchEvent(new CustomEvent('configuracoesSalvas', { detail: { config } }));
        } catch (e) {}
        
        return true;
    } catch (error) {
        console.error('Erro ao salvar configurações:', error);
        try {
            document.cookie = `app_backup_emergencia=${JSON.stringify({
                sheetIdFrequencia: config.sheetIdFrequencia || '',
                sheetIdAcompanhamento: config.sheetIdAcompanhamento || '',
                erro: error.message,
                timestamp: new Date().toISOString()
            })};max-age=2592000;path=/`;
        } catch (backupError) {}
        return false;
    }
}

/**
 * Limpa configurações
 */
function limparConfiguracoes() {
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.USER_SETTINGS);
        localStorage.removeItem('app_config_backup');
        localStorage.removeItem('app_config_timestamp');
        
        sessionStorage.removeItem('backup_frequencia_id');
        sessionStorage.removeItem('backup_acompanhamento_id');
        
        deleteCookie('app_frequencia_id');
        deleteCookie('app_acompanhamento_id');
        deleteCookie('app_backup_emergencia');
        
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const chave = localStorage.key(i);
            if (chave.includes('frequencia') || chave.includes('acompanhamento') || 
                chave.includes('config') || chave.includes('backup') || chave.includes('sheet')) {
                localStorage.removeItem(chave);
            }
        }
        
        try {
            window.dispatchEvent(new CustomEvent('configuracoesLimpar', { detail: { timestamp: new Date().toISOString() } }));
        } catch (e) {}
        
        setTimeout(() => {
            if (typeof mostrarNotificacao === 'function') {
                mostrarNotificacao('Configurações removidas', 'success', 3000);
            }
        }, 500);
        
        return true;
    } catch (error) {
        console.error('Erro ao limpar configurações:', error);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID);
        localStorage.removeItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID);
        return false;
    }
}

/**
 * NOVO: Sincroniza as configurações com o servidor (Apps Script) na
 * inicialização do app. Se o servidor tiver um ID que falta localmente
 * (por exemplo, localStorage foi limpo), preenche localmente também.
 * Chamado uma vez, no início do initApp(), antes de carregar as abas.
 */
async function sincronizarConfiguracoesComServidor() {
    if (typeof carregarConfiguracoesServidor !== 'function') return;

    try {
        const remoto = await carregarConfiguracoesServidor();
        if (!remoto) return;

        const local = carregarConfiguracoes();

        const frequenciaFinal = local.sheetIdFrequencia || remoto.sheetIdFrequencia || '';
        const acompanhamentoFinal = local.sheetIdAcompanhamento || remoto.sheetIdAcompanhamento || '';

        const precisaAtualizarLocal =
            (!local.sheetIdFrequencia && remoto.sheetIdFrequencia) ||
            (!local.sheetIdAcompanhamento && remoto.sheetIdAcompanhamento);

        if (precisaAtualizarLocal) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.FREQUENCIA_SHEET_ID, frequenciaFinal);
            localStorage.setItem(CONFIG.STORAGE_KEYS.ACOMPANHAMENTO_SHEET_ID, acompanhamentoFinal);
            salvarBackupConfiguracoes(frequenciaFinal, acompanhamentoFinal);
            console.log('✅ Configurações restauradas a partir do servidor.');
        }
    } catch (error) {
        console.warn('Não foi possível sincronizar configurações com o servidor:', error);
    }
}

/**
 * NOVO: Adiciona um botão "Agora" ao lado de cada campo de horário
 * informado, preenchendo o horário atual com um toque (em vez de precisar
 * abrir o seletor de hora). Seguro para chamar de novo quando a interface
 * é remontada — não duplica o botão se ele já existir.
 */
function adicionarBotoesRegistrarAgora(idsCampos) {
    idsCampos.forEach(id => {
        const campo = document.getElementById(id);
        if (!campo || campo.dataset.botaoAgoraAdicionado) return;

        const botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-registrar-agora';
        botao.title = 'Preencher com o horário atual';
        botao.innerHTML = '<i class="fas fa-clock"></i> Agora';
        botao.addEventListener('click', () => {
            const agora = new Intl.DateTimeFormat('pt-BR', {
                timeZone: 'America/Sao_Paulo',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            }).format(new Date());

            // 1. Atualiza o campo original (que no mobile fica oculto)
            campo.value = agora;
            campo.dispatchEvent(new Event('change', { bubbles: true }));

            // 2. Atualiza o campo de texto mobile (visível), se existir
            const campoMobile = document.getElementById(id + 'Mobile');
            if (campoMobile) {
                campoMobile.value = agora;
                // Dispara o evento 'input' para forçar validação e sincronização
                campoMobile.dispatchEvent(new Event('input', { bubbles: true }));
            }
        });

        campo.insertAdjacentElement('afterend', botao);
        campo.dataset.botaoAgoraAdicionado = 'true';
    });
}
/**
 * Verifica configurações mínimas
 */
function verificarConfiguracoesMinimas() {
    const config = carregarConfiguracoes();
    return {
        frequenciaConfigurada: !!config.sheetIdFrequencia,
        acompanhamentoConfigurado: !!config.sheetIdAcompanhamento,
        todasConfiguradas: !!config.sheetIdFrequencia && !!config.sheetIdAcompanhamento
    };
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

function criarElemento(tag, atributos = {}, conteudo = '') {
    const elemento = document.createElement(tag);
    
    Object.keys(atributos).forEach(key => {
        if (key === 'className') {
            elemento.className = atributos[key];
        } else if (key === 'htmlFor') {
            elemento.htmlFor = atributos[key];
        } else {
            elemento.setAttribute(key, atributos[key]);
        }
    });
    
    if (typeof conteudo === 'string') {
        elemento.innerHTML = conteudo;
    } else if (conteudo instanceof Node) {
        elemento.appendChild(conteudo);
    } else if (Array.isArray(conteudo)) {
        conteudo.forEach(item => {
            if (item instanceof Node) {
                elemento.appendChild(item);
            } else {
                elemento.innerHTML += item;
            }
        });
    }
    
    return elemento;
}

function toggleElemento(elemento, desabilitar) {
    if (!elemento) return;
    
    if (desabilitar) {
        elemento.setAttribute('disabled', 'true');
        elemento.style.opacity = '0.6';
        elemento.style.cursor = 'not-allowed';
    } else {
        elemento.removeAttribute('disabled');
        elemento.style.opacity = '1';
        elemento.style.cursor = '';
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function formatarHorasAmigavel(horas) {
    if (!horas || horas === "00:00") return "0 horas";
    
    const [h, m] = horas.split(':').map(Number);
    
    if (h === 0) return `${m} minutos`;
    if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`;
    return `${h} hora${h > 1 ? 's' : ''} e ${m} minutos`;
}

// ============================================
// CAMPOS DE HORA SIMPLES (MOBILE)
// ============================================

/**
 * Extrai uma mensagem de erro legível de QUALQUER formato de erro que o
 * app possa receber: instância real de Error (.message), objeto de
 * rejeição do JSONP ({success:false, error:"..."}), string simples, ou
 * qualquer outra coisa. Antes, vários pontos do código assumiam que todo
 * erro tinha `.message` (só existe em instâncias de Error de verdade) e
 * mostravam "Erro: undefined" quando o erro era, na verdade, um objeto
 * comum rejeitado pelo enviarParaAppsScript.
 * Em último caso, devolve o JSON do objeto para nunca esconder a causa real.
 */
function extrairMensagemErro(erro) {
    try {
        if (!erro) return 'Erro desconhecido (nenhum detalhe retornado)';
        if (typeof erro === 'string') return erro;
        if (erro.message) return erro.message;
        if (erro.error) return erro.error;
        return 'Erro desconhecido — detalhe técnico: ' + JSON.stringify(erro);
    } catch (e) {
        return 'Erro desconhecido (não foi possível ler o detalhe)';
    }
}

if (typeof window !== 'undefined') {
    window.extrairMensagemErro = extrairMensagemErro;
}

function formatarHoraInput(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 4) valor = valor.substring(0, 4);
    if (valor.length >= 3) valor = valor.substring(0, 2) + ':' + valor.substring(2);
    input.value = valor;
    validarHoraSimples(input);
    sincronizarComTimeOriginal(input);
}

function validarHoraSimples(input) {
    const valor = input.value;
    if (!/^\d{2}:\d{2}$/.test(valor)) {
        input.style.borderColor = 'var(--cinza-claro)';
        return false;
    }
    const [horas, minutos] = valor.split(':').map(Number);
    if (horas < 0 || horas > 23 || minutos < 0 || minutos > 59) {
        input.style.borderColor = 'var(--erro)';
        return false;
    }
    input.style.borderColor = 'var(--verde-musgo)';
    return true;
}

function sincronizarComTimeOriginal(input) {
    const campoTimeId = input.id.replace('Mobile', '');
    const campoTime = document.getElementById(campoTimeId);
    if (campoTime && validarHoraSimples(input)) {
        campoTime.value = input.value;
    }
}

function inicializarCamposHora() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
                     window.innerWidth <= 768;
    if (!isMobile) return;
    
    document.querySelectorAll('input[type="time"]').forEach(campoTime => {
        if (campoTime.id && !document.getElementById(campoTime.id + 'Mobile')) {
            const campoTexto = document.createElement('input');
            campoTexto.type = 'text';
            campoTexto.className = 'form-control time-simple-input';
            campoTexto.id = campoTime.id + 'Mobile';
            campoTexto.placeholder = campoTime.value || '08:00';
            campoTexto.value = campoTime.value || '08:00';
            campoTexto.maxLength = 5;
            campoTexto.oninput = function() { formatarHoraInput(this); };
            
            campoTime.parentNode.insertBefore(campoTexto, campoTime);
            
            const ajuda = document.createElement('small');
            ajuda.className = 'time-help';
            ajuda.textContent = 'Digite HH:MM (ex: 08:30)';
            campoTime.parentNode.insertBefore(ajuda, campoTime.nextSibling);
            
            campoTime.style.display = 'none';
        }
    });
}

// ============================================
// CORREÇÃO IMEDIATA - CRIA CAMPOS DE HORA NO MOBILE (compatibilidade)
// ============================================

function criarCamposHoraMobile() {
    const isMobile = window.innerWidth <= 768;
    if (!isMobile) return;
    
    const camposFrequencia = ['entradaManha', 'saidaManha', 'entradaTarde', 'saidaTarde'];
    camposFrequencia.forEach(id => {
        const campoTime = document.getElementById(id);
        if (campoTime && !document.getElementById(id + 'Mobile')) {
            criarCampoTextoMobile(campoTime);
        }
    });
    
    const camposAcompanhamento = ['horaInicioJustificativa', 'horaFimJustificativa'];
    camposAcompanhamento.forEach(id => {
        const campoTime = document.getElementById(id);
        if (campoTime && !document.getElementById(id + 'Mobile')) {
            criarCampoTextoMobile(campoTime);
        }
    });
}

function criarCampoTextoMobile(campoTime) {
    const id = campoTime.id;
    const container = document.createElement('div');
    container.className = 'mobile-time-container';
    
    const campoTexto = document.createElement('input');
    campoTexto.type = 'text';
    campoTexto.className = 'form-control time-simple-input';
    campoTexto.id = id + 'Mobile';
    campoTexto.value = '';
    campoTexto.placeholder = 'HH:MM';
    campoTexto.maxLength = 5;
    
    campoTexto.addEventListener('input', function(e) {
        formatarHoraInputMobile(this);
    });
    
    campoTexto.addEventListener('blur', function() {
        validarHoraMobile(this);
    });
    
    const ajuda = document.createElement('small');
    ajuda.className = 'time-help';
    ajuda.textContent = 'Digite HH:MM (ex: 08:30)';
    ajuda.style.display = 'block';
    ajuda.style.marginTop = '5px';
    ajuda.style.color = '#666';
    
    container.appendChild(campoTexto);
    campoTime.parentNode.insertBefore(container, campoTime);
    campoTime.style.display = 'none';
}

function formatarHoraInputMobile(input) {
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 4) valor = valor.substring(0, 4);
    if (valor.length >= 3) valor = valor.substring(0, 2) + ':' + valor.substring(2);
    input.value = valor;
    
    const campoTimeId = input.id.replace('Mobile', '');
    const campoTime = document.getElementById(campoTimeId);
    if (campoTime && validarHoraMobile(input)) {
        campoTime.value = input.value;
        campoTime.dispatchEvent(new Event('change'));
    }
}

/**
 * Obtém o valor de um campo de hora, considerando o campo mobile (texto) se existir
 * @param {string} id - ID do campo original (ex: 'entradaManha')
 * @returns {string} - Valor do campo (ou string vazia)
 */
function obterValorCampoHora(id) {
    const campoOriginal = document.getElementById(id);
    const campoMobile = document.getElementById(id + 'Mobile');
    
    // Prioriza o campo mobile se existir e tiver valor
    if (campoMobile && campoMobile.value) {
        return campoMobile.value;
    }
    // Caso contrário, usa o original
    if (campoOriginal && campoOriginal.value) {
        return campoOriginal.value;
    }
    return '';
}

function validarHoraMobile(input) {
    const valor = input.value;
    const padrao = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    if (padrao.test(valor)) {
        input.style.borderColor = 'var(--verde-musgo)';
        return true;
    } else {
        input.style.borderColor = 'var(--erro)';
        return false;
    }
}

/**
 * Preenche um campo de hora (e seu campo espelho no mobile, se existir)
 * com a hora atual do dispositivo.
 * @param {string} id - ID do campo original (ex: 'entradaManha')
 */
function preencherHoraAtual(id) {
    const agora = new Date();
    const valor = String(agora.getHours()).padStart(2, '0') + ':' +
                  String(agora.getMinutes()).padStart(2, '0');

    const campo = document.getElementById(id);
    if (campo) {
        campo.value = valor;
        campo.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const campoMobile = document.getElementById(id + 'Mobile');
    if (campoMobile) {
        campoMobile.value = valor;
        campoMobile.style.borderColor = 'var(--verde-musgo)';
        campoMobile.dispatchEvent(new Event('input', { bubbles: true }));
    }

    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao(`Hora preenchida: ${valor}`, 'success', 1500);
    }
}

if (typeof window !== 'undefined') {
    window.preencherHoraAtual = preencherHoraAtual;
}

// ============================================
// FERIADOS PERSONALIZADOS E DIAS ÚTEIS
// ============================================
// Feriados são cadastrados manualmente em Configurações (sábados e
// domingos já são considerados automaticamente, sem precisar cadastrar).
// Usado tanto para calcular dias úteis de um mês quanto para saber quais
// dias pular ao aplicar um período de férias.

/**
 * Retorna a lista de feriados cadastrados: [{data: "YYYY-MM-DD", descricao}]
 */
function obterFeriadosConfigurados() {
    try {
        const bruto = localStorage.getItem(CONFIG.STORAGE_KEYS.FERIADOS);
        const lista = bruto ? JSON.parse(bruto) : [];
        return Array.isArray(lista) ? lista : [];
    } catch (e) {
        return [];
    }
}

/**
 * NOVO (virada de ano) — guarda localmente o mapa {ano: sheetId} das
 * planilhas de anos anteriores da pessoa selecionada (Frequência ou
 * Acompanhamento, conforme a chave passada). Usado pra decidir, ao
 * aplicar férias que cruzam dezembro/janeiro, em qual arquivo gravar
 * cada pedaço do período.
 */
function salvarSheetIdsAnteriores(chaveStorage, mapa) {
    try {
        localStorage.setItem(chaveStorage, JSON.stringify(mapa || {}));
        return true;
    } catch (e) {
        console.warn('Não foi possível salvar sheetIds anteriores:', e);
        return false;
    }
}

/**
 * NOVO (virada de ano) — lê o mapa {ano: sheetId} salvo localmente.
 */
function obterSheetIdsAnteriores(chaveStorage) {
    try {
        const bruto = localStorage.getItem(chaveStorage);
        const mapa = bruto ? JSON.parse(bruto) : {};
        return (mapa && typeof mapa === 'object') ? mapa : {};
    } catch (e) {
        return {};
    }
}

/**
 * Salva a lista completa de feriados cadastrados.
 */
function salvarFeriadosConfigurados(lista) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.FERIADOS, JSON.stringify(lista || []));
        return true;
    } catch (e) {
        console.warn('Não foi possível salvar feriados:', e);
        return false;
    }
}

/**
 * Formata ano/mês(0-11)/dia como "YYYY-MM-DD".
 */
function formatarDataISO(ano, mesIndex, dia) {
    return `${ano}-${String(mesIndex + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/**
 * Verifica se uma data é dia útil: não é sábado/domingo e não está na
 * lista de feriados cadastrados.
 */
function eDiaUtil(ano, mesIndex, dia, feriados) {
    const data = new Date(ano, mesIndex, dia);
    const diaSemana = data.getDay(); // 0 = domingo, 6 = sábado
    if (diaSemana === 0 || diaSemana === 6) return false;

    const dataISO = formatarDataISO(ano, mesIndex, dia);
    return !feriados.some(f => f.data === dataISO);
}

/**
 * Calcula quantos dias úteis um mês tem (sábados, domingos e feriados
 * cadastrados são descontados). mesIndex é 0-11 (0 = Janeiro).
 */
function calcularDiasUteisMes(ano, mesIndex, feriados) {
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate();
    let contador = 0;

    for (let dia = 1; dia <= diasNoMes; dia++) {
        if (eDiaUtil(ano, mesIndex, dia, feriados)) {
            contador++;
        }
    }

    return contador;
}

/**
 * A partir de uma data de início (dias corridos) e a quantidade de dias
 * de gozo, percorre o período e separa os dias em:
 *  - diasUteis: os que devem receber o código de férias (dia de semana,
 *    sem feriado cadastrado) — {month, day, data}
 *  - diasPulados: os que caíram em fim de semana ou feriado — mesma forma
 */
function calcularDiasFerias(dataInicioStr, diasGozo, feriados) {
    const [anoInicio, mesInicio, diaInicio] = dataInicioStr.split('-').map(Number);
    const dataBase = new Date(anoInicio, mesInicio - 1, diaInicio);

    const diasUteis = [];
    const diasPulados = [];

    for (let i = 0; i < diasGozo; i++) {
        const dataAtual = new Date(dataBase);
        dataAtual.setDate(dataBase.getDate() + i);

        const ano = dataAtual.getFullYear();
        const mesIndex = dataAtual.getMonth();
        const dia = dataAtual.getDate();
        const dataISO = formatarDataISO(ano, mesIndex, dia);
        const nomeMes = CONFIG.MESES[mesIndex];

        const item = { month: nomeMes, day: dia, data: dataISO };

        if (eDiaUtil(ano, mesIndex, dia, feriados)) {
            diasUteis.push(item);
        } else {
            diasPulados.push(item);
        }
    }

    return { diasUteis, diasPulados };
}

/**
 * Envia a quantidade de dias úteis calculada para o Apps Script gravar
 * na célula C9 da aba do mês correspondente. Fire-and-forget (mesma
 * limitação de no-cors do resto do app — não confirma o resultado real).
 */
async function atualizarDiasUteisNaPlanilha(sheetIdFrequencia, mes, diasUteis) {
    try {
        if (typeof enviarParaAppsScript === 'undefined') return;
        if (!sheetIdFrequencia || !mes || diasUteis === undefined) return;

        await enviarParaAppsScript({
            operation: 'atualizarDiasUteis',
            sheetIdFrequencia: sheetIdFrequencia,
            month: mes,
            diasUteis: diasUteis
        });
    } catch (e) {
        console.warn('Não foi possível atualizar dias úteis na planilha:', e);
    }
}

/**
 * Conta quantos dias úteis do mês ainda NÃO têm nenhum registro (nem
 * horário parcial, nem completo, nem justificativa) — ou seja, os dias
 * que a Previsão do Mês vai assumir como "vai trabalhar a jornada padrão
 * nele". mesIndex é 0-11. statusMes é o mapa {dia: 'completo'|'parcial'}
 * já sincronizado com a planilha (ver obterStatusMes/substituirStatusMes).
 */
function contarDiasUteisSemRegistro(ano, mesIndex, feriados, statusMes) {
    const diasNoMes = new Date(ano, mesIndex + 1, 0).getDate();
    let contador = 0;

    for (let dia = 1; dia <= diasNoMes; dia++) {
        if (eDiaUtil(ano, mesIndex, dia, feriados) && !statusMes[dia]) {
            contador++;
        }
    }

    return contador;
}

if (typeof window !== 'undefined') {
    window.obterFeriadosConfigurados = obterFeriadosConfigurados;
    window.salvarFeriadosConfigurados = salvarFeriadosConfigurados;
    window.formatarDataISO = formatarDataISO;
    window.eDiaUtil = eDiaUtil;
    window.salvarSheetIdsAnteriores = salvarSheetIdsAnteriores;
    window.obterSheetIdsAnteriores = obterSheetIdsAnteriores;
    window.calcularDiasUteisMes = calcularDiasUteisMes;
    window.contarDiasUteisSemRegistro = contarDiasUteisSemRegistro;
    window.calcularDiasFerias = calcularDiasFerias;
    window.atualizarDiasUteisNaPlanilha = atualizarDiasUteisNaPlanilha;
}

// ============================================
// STATUS DOS DIAS (indicador visual no seletor de dia)
// ============================================
// Guarda, por mês/ano, quais dias já têm registro (completo, parcial, ou
// justificado), para exibir um indicador no dropdown de dias. Funciona
// como cache local: é preenchido instantaneamente a partir do que foi
// salvo neste navegador e, em seguida, sincronizado com os dados reais
// da planilha via buscarStatusMesAPI (ver api.js e frequencia.js).

const PREFIXO_STATUS_DIA = 'frequencia_status_dias_';

function obterChaveStatusMes(mes) {
    const ano = new Date().getFullYear();
    return `${PREFIXO_STATUS_DIA}${ano}_${mes}`;
}

/**
 * Retorna o mapa {dia: 'completo'|'parcial'} salvo localmente para o mês.
 */
function obterStatusMes(mes) {
    try {
        const bruto = localStorage.getItem(obterChaveStatusMes(mes));
        return bruto ? JSON.parse(bruto) : {};
    } catch (e) {
        return {};
    }
}

/**
 * Calcula o status de um dia a partir dos 4 campos de horário.
 * @returns {'completo'|'parcial'|null} null significa "sem registro"
 */
function calcularStatusDia(dados) {
    const campos = [dados.entradaManha, dados.saidaManha, dados.entradaTarde, dados.saidaTarde];
    const preenchidos = campos.filter(v => !!v).length;
    if (preenchidos === 0) return null;
    if (preenchidos === 4) return 'completo';
    return 'parcial';
}

/**
 * Salva (ou remove) o status de um dia específico do mês.
 */
function salvarStatusDia(mes, dia, dados) {
    try {
        const status = calcularStatusDia(dados);
        const mapa = obterStatusMes(mes);

        if (status) {
            mapa[dia] = status;
        } else {
            delete mapa[dia];
        }

        localStorage.setItem(obterChaveStatusMes(mes), JSON.stringify(mapa));
    } catch (e) {
        console.warn('Não foi possível salvar o status do dia:', e);
    }
}

/**
 * Substitui todo o mapa de status de um mês (usado quando a planilha
 * responde com os dados reais, que têm prioridade sobre o cache local).
 */
function substituirStatusMes(mes, mapa) {
    try {
        localStorage.setItem(obterChaveStatusMes(mes), JSON.stringify(mapa || {}));
    } catch (e) {
        console.warn('Não foi possível salvar o status do mês:', e);
    }
}

if (typeof window !== 'undefined') {
    window.obterStatusMes = obterStatusMes;
    window.calcularStatusDia = calcularStatusDia;
    window.salvarStatusDia = salvarStatusDia;
    window.substituirStatusMes = substituirStatusMes;
}

// Inicializações automáticas
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(inicializarCamposHora, 100);
    setTimeout(criarCamposHoraMobile, 500);
    
    document.addEventListener('click', function(e) {
        if (e.target.closest('.tab-btn')) {
            setTimeout(criarCamposHoraMobile, 300);
        }
    });
});

window.addEventListener('resize', function() {
    setTimeout(criarCamposHoraMobile, 300);
});
