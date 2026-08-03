// ============================================
// EDOCS-EXPORT.JS
// ============================================
// Gera o texto pronto para colar na tabela de apuração diária do
// documento de Frequência do e-docs (SEDU).
//
// Como funciona:
// 1. O botão chama o Apps Script (ação "dadosEdocs"), que já cruza a
//    planilha de Frequência (horários) com a de Acompanhamento
//    (observações), dia a dia, pro mês selecionado.
// 2. Monta um texto separado por TAB entre colunas e por ENTER entre
//    linhas — o mesmo formato que o Excel usa ao copiar uma faixa de
//    células. É esse formato que o e-docs aceita quando você seleciona a
//    primeira célula de horário da tabela e cola (Ctrl+V).
// 3. Copia esse texto pra área de transferência e mostra uma prévia em
//    modal, com instrução de onde clicar antes de colar no e-docs.

/**
 * Busca no Apps Script os dias do mês já cruzados (horários + observação).
 */
async function buscarDadosEdocsAPI(sheetIdFrequencia, sheetIdAcompanhamento, mes, ano) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }

        const params = new URLSearchParams({ action: 'dadosEdocs', mes: mes, ano: String(ano) });
        if (sheetIdFrequencia) params.set('sheetIdFrequencia', sheetIdFrequencia);
        if (sheetIdAcompanhamento) params.set('sheetIdAcompanhamento', sheetIdAcompanhamento);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        console.error('Erro em buscarDadosEdocsAPI:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Monta o texto TSV (separado por TAB) a partir dos dias retornados pela API.
 * @param {Array} dias
 * @param {boolean} incluirObservacao - se true, inclui a 5ª coluna (Observações)
 */
function montarTextoEdocs(dias, incluirObservacao) {
    return dias.map(function (d) {
        const colunas = [d.entradaManha || '', d.saidaManha || '', d.entradaTarde || '', d.saidaTarde || ''];
        if (incluirObservacao) colunas.push(d.observacao || '');
        return colunas.join('\t');
    }).join('\n');
}

/**
 * Monta uma tabela HTML de prévia, pra conferência visual antes de colar.
 */
function montarTabelaPreviaEdocs(dias, incluirObservacao) {
    const cabecalho = incluirObservacao
        ? '<tr><th>Dia</th><th>Ent. Manhã</th><th>Saí. Manhã</th><th>Ent. Tarde</th><th>Saí. Tarde</th><th>Observação</th></tr>'
        : '<tr><th>Dia</th><th>Ent. Manhã</th><th>Saí. Manhã</th><th>Ent. Tarde</th><th>Saí. Tarde</th></tr>';

    const linhas = dias.map(function (d) {
        const celulas = [d.dia, d.entradaManha || '--', d.saidaManha || '--', d.entradaTarde || '--', d.saidaTarde || '--'];
        if (incluirObservacao) celulas.push(d.observacao || '');
        return '<tr>' + celulas.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
    }).join('');

    return '<div class="edocs-preview-wrapper"><table class="edocs-preview-table">' + cabecalho + linhas + '</table></div>';
}

/**
 * Copia um texto pra área de transferência, com fallback pra navegadores
 * ou contextos (ex: http sem SSL) onde a Clipboard API não funciona.
 */
async function copiarTextoParaAreaDeTransferencia(texto) {
    try {
        await navigator.clipboard.writeText(texto);
        return true;
    } catch (e) {
        try {
            const textarea = document.createElement('textarea');
            textarea.value = texto;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.focus();
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            return true;
        } catch (e2) {
            return false;
        }
    }
}

// Guarda o último texto gerado (só horários, ou horários + observação —
// sem a coluna Dia, que existe apenas na tabela de prévia), pro botão
// "Copiar dados" do modal não precisar embutir o texto inteiro dentro de
// um atributo HTML.
let _edocsUltimoTexto = '';

async function _edocsCopiarDoModal() {
    const copiou = await copiarTextoParaAreaDeTransferencia(_edocsUltimoTexto);
    mostrarNotificacao(
        copiou ? 'Dados copiados! Cole no e-docs com Ctrl+V.' : 'Não foi possível copiar automaticamente — tente novamente.',
        copiou ? 'success' : 'error'
    );
}

/**
 * Ação principal do botão: busca os dados do mês selecionado, monta o
 * texto, copia e mostra a prévia.
 * @param {boolean} incluirObservacao
 */
async function copiarParaEdocs(incluirObservacao) {
    fecharMenuEdocs();

    const config = carregarConfiguracoes();
    if (!config.sheetIdFrequencia) {
        mostrarNotificacao('Planilha de Frequência não configurada.', 'error');
        return;
    }
    if (incluirObservacao && !config.sheetIdAcompanhamento) {
        mostrarNotificacao('Planilha de Acompanhamento não configurada.', 'error');
        return;
    }

    const mes = (typeof frequenciaState !== 'undefined' && frequenciaState.mesAtual)
        || (typeof acompanhamentoState !== 'undefined' && acompanhamentoState.mesAtual)
        || obterMesAtual();
    const ano = new Date().getFullYear();

    mostrarNotificacao('Buscando dados de ' + mes + '...', 'info', 2000);

    const resultado = await buscarDadosEdocsAPI(
        config.sheetIdFrequencia,
        incluirObservacao ? config.sheetIdAcompanhamento : null,
        mes,
        ano
    );

    if (!resultado.success) {
        mostrarNotificacao('Erro ao buscar dados: ' + (resultado.error || 'falha desconhecida'), 'error');
        return;
    }

    // Texto que vai pra área de transferência: só as colunas de horário
    // (+ observação, se pedido) — sem a coluna Dia, que aparece apenas na
    // tabela de prévia abaixo, como referência visual.
    const texto = montarTextoEdocs(resultado.dias, incluirObservacao);
    _edocsUltimoTexto = texto;

    const tabelaHtml = montarTabelaPreviaEdocs(resultado.dias, incluirObservacao);
    const instrucoes = '<p style="margin-bottom:12px;">Confira os dados abaixo, clique em <strong>Copiar dados</strong> e depois, no e-docs, clique na primeira célula de horário do dia 1 (coluna "Entrada" do 1º Expediente) e cole com Ctrl+V.</p>';

    mostrarModal(
        'Dados para colar no e-docs — ' + mes + '/' + ano,
        instrucoes + tabelaHtml,
        '<button type="button" class="btn-secondary" onclick="fecharModal()">Fechar</button>' +
        '<button type="button" class="btn-primary" onclick="_edocsCopiarDoModal()">Copiar dados</button>'
    );
}

function alternarMenuEdocs(event) {
    if (event) event.stopPropagation();
    const menu = document.getElementById('edocsMenu');
    if (!menu) return;
    menu.classList.toggle('hidden');
}

function fecharMenuEdocs() {
    const menu = document.getElementById('edocsMenu');
    if (menu) menu.classList.add('hidden');
}

document.addEventListener('click', function (event) {
    const wrapper = document.getElementById('edocsMenuWrapper');
    if (wrapper && !wrapper.contains(event.target)) {
        fecharMenuEdocs();
    }
});
