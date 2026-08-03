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
 * Usado como fallback em texto puro (text/plain) e como referência.
 * @param {Array} dias
 * @param {boolean} incluirObservacao - se true, inclui a 5ª coluna (Observações)
 */
function montarTextoEdocs(dias, incluirObservacao) {
    return dias.map(function (d) {
        const colunas = [d.entradaManha || '', d.saidaManha || '', d.entradaTarde || '', d.saidaTarde || ''];
        if (incluirObservacao) colunas.push(d.observacao || '');
        return colunas.join('\t');
    }).join('\r\n');
}

/**
 * Monta uma tabela HTML "crua" (sem estilo, sem cabeçalho — só as linhas de
 * dados), no mesmo formato que o Excel coloca na área de transferência ao
 * copiar uma faixa de células. É essa versão HTML que faz o e-docs
 * distribuir os valores célula por célula ao colar — colar só texto puro
 * (TSV) faz ele jogar tudo bruto numa célula só, porque o campo do e-docs
 * é uma tabela editável que só sabe "encaixar" quando recebe outra tabela
 * HTML como origem.
 * @param {Array} dias
 * @param {boolean} incluirObservacao
 */
function montarHtmlTabelaEdocs(dias, incluirObservacao) {
    function escapar(texto) {
        return String(texto || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    const linhas = dias.map(function (d) {
        const celulas = [d.entradaManha, d.saidaManha, d.entradaTarde, d.saidaTarde];
        if (incluirObservacao) celulas.push(d.observacao);
        return '<tr>' + celulas.map(function (c) { return '<td>' + escapar(c) + '</td>'; }).join('') + '</tr>';
    }).join('');

    return '<table><tbody>' + linhas + '</tbody></table>';
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
 * Copia pra área de transferência tanto o texto puro (text/plain) quanto
 * uma tabela HTML equivalente (text/html) — igual ao que o Excel faz ao
 * copiar células. Isso é o que permite colar espalhando célula por célula
 * em campos que só reconhecem tabela HTML de origem (como o e-docs).
 * Cai pra texto puro se o navegador não suportar múltiplos formatos.
 */
async function copiarTabelaParaAreaDeTransferencia(textoPlano, htmlTabela) {
    // Caminho principal: Clipboard API com os dois formatos (text/plain + text/html)
    try {
        if (navigator.clipboard && window.ClipboardItem) {
            const item = new ClipboardItem({
                'text/plain': new Blob([textoPlano], { type: 'text/plain' }),
                'text/html': new Blob([htmlTabela], { type: 'text/html' })
            });
            await navigator.clipboard.write([item]);
            return true;
        }
    } catch (e) {
        console.warn('Falha ao copiar com ClipboardItem, tentando fallback:', e);
    }

    // Fallback 1: seleciona um <div> contenteditable com a mesma tabela e
    // usa execCommand('copy') — isso também carrega a versão HTML da
    // seleção, ao contrário de copiar de um <textarea> (que só leva texto).
    try {
        const div = document.createElement('div');
        div.contentEditable = 'true';
        div.style.position = 'fixed';
        div.style.opacity = '0';
        div.style.top = '0';
        div.style.left = '0';
        div.innerHTML = htmlTabela;
        document.body.appendChild(div);

        const range = document.createRange();
        range.selectNodeContents(div);
        const selecao = window.getSelection();
        selecao.removeAllRanges();
        selecao.addRange(range);

        const copiou = document.execCommand('copy');

        selecao.removeAllRanges();
        document.body.removeChild(div);

        if (copiou) return true;
    } catch (e2) {
        console.warn('Falha no fallback de contenteditable:', e2);
    }

    // Fallback 2: só texto puro (último recurso)
    try {
        await navigator.clipboard.writeText(textoPlano);
        return true;
    } catch (e3) {
        return false;
    }
}

// Guarda o último texto/HTML gerados (só horários, ou horários +
// observação — sem a coluna Dia, que existe apenas na tabela de prévia),
// pro botão "Copiar dados" do modal não precisar embutir tudo dentro de
// um atributo HTML.
let _edocsUltimoTexto = '';
let _edocsUltimoHtml = '';

async function _edocsCopiarDoModal() {
    const copiou = await copiarTabelaParaAreaDeTransferencia(_edocsUltimoTexto, _edocsUltimoHtml);
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

    // Texto/HTML que vão pra área de transferência: só as colunas de
    // horário (+ observação, se pedido) — sem a coluna Dia, que aparece
    // apenas na tabela de prévia abaixo, como referência visual.
    _edocsUltimoTexto = montarTextoEdocs(resultado.dias, incluirObservacao);
    _edocsUltimoHtml = montarHtmlTabelaEdocs(resultado.dias, incluirObservacao);

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
