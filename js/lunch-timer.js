// LUNCH-TIMER.JS - Aviso de fim do horário de almoço (1h)
//
// Funciona assim:
// 1. Quando o campo "Saída para Almoço" é preenchido (e "Retorno do Almoço"
//    ainda está vazio), o app guarda esse horário e passa a monitorar.
// 2. Aos 55 minutos, mostra um aviso "faltam 5 minutos".
// 3. Aos 60 minutos, mostra um aviso "o horário de almoço terminou".
// 4. Se "Retorno do Almoço" for preenchido, o controle é cancelado.
//
// Limitação importante: isso só funciona enquanto o app estiver aberto
// (em segundo plano ou minimizado tudo bem, mas não com o app fechado).
// Não há como agendar notificações com o navegador/PWA totalmente fechado
// sem um servidor de push — por isso o app pede para deixá-lo aberto/
// minimizado durante o intervalo.

const ALMOCO_STORAGE_KEY = 'controle_almoco_v1';
const ALMOCO_DURACAO_MIN = 60;      // duração do intervalo de almoço
const ALMOCO_AVISO_ANTES_MIN = 5;   // avisar faltando 5 minutos
const ALMOCO_CHECK_INTERVAL_MS = 20 * 1000; // checa a cada 20s

let almocoIntervalId = null;

/**
 * Lê o estado salvo do controle de almoço (se houver, e se for de hoje).
 */
function lerEstadoAlmoco() {
    try {
        const bruto = localStorage.getItem(ALMOCO_STORAGE_KEY);
        if (!bruto) return null;

        const estado = JSON.parse(bruto);
        const hojeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());

        if (estado.data !== hojeStr) {
            // Estado de outro dia, descarta
            localStorage.removeItem(ALMOCO_STORAGE_KEY);
            return null;
        }
        return estado;
    } catch (e) {
        return null;
    }
}

function salvarEstadoAlmoco(estado) {
    try {
        localStorage.setItem(ALMOCO_STORAGE_KEY, JSON.stringify(estado));
    } catch (e) {
        console.warn('Não foi possível salvar o estado do controle de almoço:', e);
    }
}

function limparEstadoAlmoco() {
    localStorage.removeItem(ALMOCO_STORAGE_KEY);
    if (almocoIntervalId) {
        clearInterval(almocoIntervalId);
        almocoIntervalId = null;
    }
}

/**
 * Pede permissão de notificações do navegador (opcional — o app funciona
 * mesmo sem, mostrando só o aviso interno no topo da tela).
 */
function solicitarPermissaoNotificacao() {
    try {
        if (typeof Notification === 'undefined') return;
        if (Notification.permission === 'default') {
            Notification.requestPermission().catch(() => {});
        }
    } catch (e) {
        // Ignora — nem todo navegador/contexto suporta
    }
}

function dispararAviso(mensagem, tipo) {
    // Aviso dentro do app
    if (typeof mostrarNotificacao === 'function') {
        mostrarNotificacao(mensagem, tipo, 15000);
    }

    // Notificação do sistema (funciona com o app minimizado/em outra aba)
    try {
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('Controle de Frequência', {
                body: mensagem,
                icon: 'icons/icon-192x192.png',
                tag: 'almoco-timer'
            });
        }
    } catch (e) {
        // Ignora se o navegador bloquear
    }
}

/**
 * Converte "HH:MM" de hoje (fuso de Brasília) em timestamp (ms).
 */
function horaDeHojeParaTimestamp(horaStr) {
    const agora = new Date();
    const partesData = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(agora); // "YYYY-MM-DD"

    const [h, m] = horaStr.split(':').map(Number);
    // Aproximação simples: usa horário local do dispositivo. Como o app já
    // é pensado para uso no fuso de Brasília, isso é suficiente na prática.
    const [ano, mes, dia] = partesData.split('-').map(Number);
    return new Date(ano, mes - 1, dia, h, m, 0).getTime();
}

/**
 * Chamado sempre que o campo "Saída para Almoço" muda.
 * Inicia (ou reinicia) o monitoramento do intervalo de almoço.
 */
function iniciarControleAlmoco(horaSaidaManha) {
    if (!horaSaidaManha) return;

    solicitarPermissaoNotificacao();

    const estadoAtual = lerEstadoAlmoco();
    // Evita resetar os avisos já dados se o horário não mudou
    if (estadoAtual && estadoAtual.horaSaida === horaSaidaManha) {
        garantirIntervaloRodando();
        return;
    }

    const hojeStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    salvarEstadoAlmoco({
        data: hojeStr,
        horaSaida: horaSaidaManha,
        avisado55: false,
        avisado60: false
    });

    garantirIntervaloRodando();
}

/**
 * Chamado quando "Retorno do Almoço" é preenchido — cancela os avisos.
 */
function cancelarControleAlmoco() {
    limparEstadoAlmoco();
}

function garantirIntervaloRodando() {
    if (almocoIntervalId) return;
    almocoIntervalId = setInterval(verificarAlmoco, ALMOCO_CHECK_INTERVAL_MS);
    verificarAlmoco(); // checagem imediata também
}

function verificarAlmoco() {
    const estado = lerEstadoAlmoco();
    if (!estado) {
        limparEstadoAlmoco();
        return;
    }

    const inicioMs = horaDeHojeParaTimestamp(estado.horaSaida);
    const minutosDecorridos = (Date.now() - inicioMs) / 60000;

    if (minutosDecorridos < 0) return; // horário no futuro, nada a fazer ainda

    const minutosParaAvisoAntecipado = ALMOCO_DURACAO_MIN - ALMOCO_AVISO_ANTES_MIN;

    if (!estado.avisado55 && minutosDecorridos >= minutosParaAvisoAntecipado) {
        dispararAviso(
            `⏰ Faltam ${ALMOCO_AVISO_ANTES_MIN} minutos para o fim do seu horário de almoço.`,
            'warning'
        );
        estado.avisado55 = true;
        salvarEstadoAlmoco(estado);
    }

    if (!estado.avisado60 && minutosDecorridos >= ALMOCO_DURACAO_MIN) {
        dispararAviso(
            '🍽️ O seu horário de almoço (1h) terminou. Hora de voltar!',
            'error'
        );
        estado.avisado60 = true;
        salvarEstadoAlmoco(estado);
    }

    // Depois dos dois avisos, não há mais nada a checar hoje para este registro
    if (estado.avisado55 && estado.avisado60) {
        clearInterval(almocoIntervalId);
        almocoIntervalId = null;
    }
}

/**
 * Liga os listeners nos campos de horário da aba Frequência.
 * Deve ser chamada sempre que a interface da aba Frequência é (re)montada.
 */
function configurarControleAlmoco() {
    const campoSaidaManha = document.getElementById('saidaManha');
    const campoEntradaTarde = document.getElementById('entradaTarde');

    if (campoSaidaManha) {
        campoSaidaManha.addEventListener('change', (e) => {
            const valor = e.target.value;
            if (valor) {
                iniciarControleAlmoco(valor);
            } else {
                cancelarControleAlmoco();
            }
        });

        // Se o campo já vier preenchido (ex.: usuário voltou para a aba) e
        // ainda não retornou do almoço, retoma o controle.
        if (campoSaidaManha.value && !(campoEntradaTarde && campoEntradaTarde.value)) {
            iniciarControleAlmoco(campoSaidaManha.value);
        }
    }

    if (campoEntradaTarde) {
        campoEntradaTarde.addEventListener('change', (e) => {
            if (e.target.value) {
                cancelarControleAlmoco();
            }
        });
    }
}

// Ao carregar o app, se já existir um controle de almoço em andamento
// (ex.: o usuário atualizou a página), retoma o monitoramento.
document.addEventListener('DOMContentLoaded', () => {
    const estado = lerEstadoAlmoco();
    if (estado && !(estado.avisado55 && estado.avisado60)) {
        garantirIntervaloRodando();
    }
});

// Disponibiliza globalmente para outras partes do app (ex.: frequencia.js)
if (typeof window !== 'undefined') {
    window.configurarControleAlmoco = configurarControleAlmoco;
    window.iniciarControleAlmoco = iniciarControleAlmoco;
    window.cancelarControleAlmoco = cancelarControleAlmoco;
}
