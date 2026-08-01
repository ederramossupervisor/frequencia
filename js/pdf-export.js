// PDF-EXPORT.JS - Impressão das abas de Frequência e Acompanhamento em PDF
//
// Como funciona:
// 1. O botão discreto chama imprimirMesPDF().
// 2. Buscamos no Apps Script o "gid" (id interno) da aba do mês atual em
//    cada planilha (a mesma aba tem gid diferente em cada arquivo).
// 3. Montamos a URL de exportação nativa do Google Sheets
//    (docs.google.com/.../export?format=pdf&gid=...) e abrimos numa nova
//    aba — o próprio Google gera o PDF usando a sessão logada do usuário,
//    sem precisar processar nada no nosso servidor.
//
// Requer que o Apps Script tenha a ação "obterGidsPdf" no doGet
// (ver instruções enviadas junto com este arquivo).

/**
 * Busca no Apps Script os gids (ids internos das abas) do mês informado,
 * em cada uma das planilhas.
 */
async function buscarGidsPdfAPI(sheetIdFrequencia, sheetIdAcompanhamento, mes) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        if (!mes) {
            return { success: false, error: 'Mês não informado' };
        }

        const params = new URLSearchParams({ action: 'obterGidsPdf', mes: mes });
        if (sheetIdFrequencia) params.set('sheetIdFrequencia', sheetIdFrequencia);
        if (sheetIdAcompanhamento) params.set('sheetIdAcompanhamento', sheetIdAcompanhamento);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });

        if (!resposta.ok) {
            throw new Error(`Resposta HTTP ${resposta.status}`);
        }

        return await resposta.json();

    } catch (error) {
        console.warn('Não foi possível buscar os gids para impressão:', error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Monta a URL de exportação em PDF do Google Sheets para uma aba específica.
 *
 * @param {string} sheetId
 * @param {number|string} gid
 * @param {boolean} caberNaPagina - Se true, ajusta LARGURA e ALTURA (fitw +
 *   fith) para a aba inteira caber numa única página A4, encolhendo o
 *   conteúdo se precisar. Se false, ajusta só a largura (comportamento
 *   antigo) — o conteúdo pode continuar em várias páginas na vertical.
 */
function montarUrlExportarPdf(sheetId, gid, caberNaPagina) {
    const params = new URLSearchParams({
        format: 'pdf',
        gid: String(gid),
        size: 'A4',
        portrait: 'true',
        fitw: 'true',
        top_margin: '0.4',
        bottom_margin: '0.4',
        left_margin: '0.3',
        right_margin: '0.3',
        sheetnames: 'false',
        printtitle: 'false',
        pagenumbers: 'false',
        gridlines: 'true',
        fzr: 'false'
    });
    if (caberNaPagina) {
        params.set('fith', 'true');
    }
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?${params.toString()}`;
}

/**
 * Ação principal do botão discreto: abre em PDF a aba do mês atual, tanto
 * na planilha de Frequência quanto na de Acompanhamento (as que estiverem
 * configuradas).
 *
 * Importante: as duas janelas são abertas de forma SÍNCRONA (em branco),
 * antes do fetch assíncrono, e só depois recebem a URL final. Isso evita
 * que o navegador bloqueie como pop-up — se abríssemos a janela só depois
 * do "await", muitos navegadores (principalmente no celular) tratam isso
 * como abertura não solicitada pelo usuário e bloqueiam.
 */
async function imprimirMesPDF() {
    const config = carregarConfiguracoes();

    if (!config.sheetIdFrequencia && !config.sheetIdAcompanhamento) {
        mostrarNotificacao('Configure suas planilhas antes de imprimir.', 'error');
        return;
    }

    const mes = (typeof frequenciaState !== 'undefined' && frequenciaState.mesAtual)
        || (typeof acompanhamentoState !== 'undefined' && acompanhamentoState.mesAtual)
        || obterMesAtual();

    const btn = document.getElementById('btnImprimirPdf');
    const iconeOriginal = btn ? btn.innerHTML : null;
    if (btn) {
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        btn.disabled = true;
    }

    // Abre as janelas já, em branco, para não serem bloqueadas como pop-up.
    const janelaFrequencia = config.sheetIdFrequencia ? window.open('', '_blank') : null;
    const janelaAcompanhamento = config.sheetIdAcompanhamento ? window.open('', '_blank') : null;

    try {
        const resultado = await buscarGidsPdfAPI(config.sheetIdFrequencia, config.sheetIdAcompanhamento, mes);

        if (!resultado.success) {
            janelaFrequencia?.close();
            janelaAcompanhamento?.close();
            mostrarNotificacao(`Erro ao preparar PDF: ${resultado.error || 'aba do mês não encontrada'}`, 'error');
            return;
        }

        let algumaAbriu = false;

        if (janelaFrequencia) {
            if (resultado.gidFrequencia !== undefined) {
                janelaFrequencia.location.href = montarUrlExportarPdf(config.sheetIdFrequencia, resultado.gidFrequencia, false);
                algumaAbriu = true;
            } else {
                janelaFrequencia.close();
            }
        }

        if (janelaAcompanhamento) {
            if (resultado.gidAcompanhamento !== undefined) {
                // true = ajusta largura E altura, pra aba inteira caber numa única página A4
                janelaAcompanhamento.location.href = montarUrlExportarPdf(config.sheetIdAcompanhamento, resultado.gidAcompanhamento, true);
                algumaAbriu = true;
            } else {
                janelaAcompanhamento.close();
            }
        }

        if (algumaAbriu) {
            mostrarNotificacao(`Gerando PDF de ${mes}...`, 'success', 3000);
        } else {
            mostrarNotificacao('Nenhuma planilha configurada para impressão.', 'error');
        }

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        janelaFrequencia?.close();
        janelaAcompanhamento?.close();
        mostrarNotificacao('Erro ao gerar PDF. Tente novamente.', 'error');

    } finally {
        if (btn) {
            btn.innerHTML = iconeOriginal;
            btn.disabled = false;
        }
    }
}

if (typeof window !== 'undefined') {
    window.buscarGidsPdfAPI = buscarGidsPdfAPI;
    window.montarUrlExportarPdf = montarUrlExportarPdf;
    window.imprimirMesPDF = imprimirMesPDF;
}
