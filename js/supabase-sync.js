// SINCRONIZAÇÃO DIRETA COM O SUPABASE
// Substitui, só para estas 3 operações (frequência, justificativa,
// observação), o caminho antigo via Apps Script. Tudo o mais no app
// continua chamando o Apps Script como sempre — a planilha em si
// continua sendo atualizada, só que agora via webhook
// (Supabase -> Apps Script), não mais direto pelo app.

async function chamarSupabase_(tabela, corpo, { onConflict } = {}) {
    let url = `${CONFIG.SUPABASE_URL}/rest/v1/${tabela}`;
    if (onConflict) url += `?on_conflict=${onConflict}`;

    const resposta = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: CONFIG.SUPABASE_ANON_KEY,
            Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
            Prefer: onConflict ? 'resolution=merge-duplicates,return=minimal' : 'return=minimal'
        },
        body: JSON.stringify(corpo)
    });

    if (!resposta.ok) {
        const texto = await resposta.text().catch(() => '');
        throw new Error(`Supabase ${resposta.status}: ${texto}`);
    }

    return true;
}

/**
 * Busca no Supabase o id (uuid) do usuário a partir do nome. Chamada
 * uma vez ao selecionar a pessoa (ver alteração em usuarios.js) e
 * cacheada em CONFIG.STORAGE_KEYS.USUARIO_ID_SUPABASE.
 */
async function resolverUsuarioIdSupabase(nome) {
    try {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/usuarios?nome=eq.${encodeURIComponent(nome)}&select=id`;
        const resposta = await fetch(url, {
            headers: {
                apikey: CONFIG.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        });
        if (!resposta.ok) return null;
        const linhas = await resposta.json();
        return linhas.length ? linhas[0].id : null;
    } catch (error) {
        console.warn('Não foi possível resolver o usuário no Supabase:', error.message);
        return null;
    }
}

function obterUsuarioIdSupabaseAtual() {
    return localStorage.getItem(CONFIG.STORAGE_KEYS.USUARIO_ID_SUPABASE) || '';
}

// Converte "HH:MM" (o que o resto do app já usa) para "HH:MM:00",
// formato que a coluna "time" do Postgres espera.
function horaParaSupabase_(horaHHMM) {
    if (!horaHHMM) return null;
    return horaHHMM.length === 5 ? `${horaHHMM}:00` : horaHHMM;
}

/**
 * Substitui salvarFrequenciaAPI: grava direto no Supabase em vez de
 * chamar o Apps Script. A planilha é atualizada pelo webhook.
 */
async function salvarFrequenciaSupabase(dados) {
    try {
        if (!dados.mes || !dados.dia) {
            throw new Error('Mês e dia são obrigatórios');
        }

        const usuarioId = obterUsuarioIdSupabaseAtual();
        if (!usuarioId) {
            throw new Error('Usuário não vinculado ao Supabase — selecione a pessoa de novo');
        }

        const indiceMes = CONFIG.MESES.indexOf(dados.mes);
        const dataISO = `${CONFIG.ANO_ATUAL}-${String(indiceMes + 1).padStart(2, '0')}-${String(dados.dia).padStart(2, '0')}`;

        const corpo = { usuario_id: usuarioId, data: dataISO };
        if (dados.entradaManha) corpo.entrada_manha = horaParaSupabase_(formatarHora(dados.entradaManha));
        if (dados.saidaManha) corpo.saida_manha = horaParaSupabase_(formatarHora(dados.saidaManha));
        if (dados.entradaTarde) corpo.entrada_tarde = horaParaSupabase_(formatarHora(dados.entradaTarde));
        if (dados.saidaTarde) corpo.saida_tarde = horaParaSupabase_(formatarHora(dados.saidaTarde));

        await chamarSupabase_('registros_frequencia', corpo, { onConflict: 'usuario_id,data' });

        salvarBackupLocal('frequencia', corpo);
        mostrarNotificacao(`✅ Frequência do dia ${dados.dia} salva com sucesso!`, 'success');

        return { success: true };

    } catch (error) {
        console.error('Erro ao salvar frequência no Supabase:', error);
        mostrarNotificacao(`❌ Erro ao salvar frequência: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Substitui salvarJustificativaAPI.
 */
async function salvarJustificativaSupabase(dados) {
    try {
        if (!dados.codigo || !dados.data) {
            throw new Error('Código e data são obrigatórios');
        }

        const usuarioId = obterUsuarioIdSupabaseAtual();
        if (!usuarioId) {
            throw new Error('Usuário não vinculado ao Supabase — selecione a pessoa de novo');
        }

        const corpo = {
            usuario_id: usuarioId,
            codigo: dados.codigo,
            data_inicio: dados.data,
            data_fim: dados.data,
            hora_inicio: horaParaSupabase_(formatarHora(dados.horaInicio) || '08:00'),
            hora_fim: horaParaSupabase_(formatarHora(dados.horaFim) || '17:00'),
            horas_liquidas: dados.horasLiquidas || '08:00',
            observacao: dados.observacao || null
        };

        await chamarSupabase_('justificativas', corpo);

        salvarBackupLocal('justificativa', corpo);
        mostrarNotificacao(`✅ Justificativa ${dados.codigo} salva com sucesso!`, 'success');

        return { success: true };

    } catch (error) {
        console.error('Erro ao salvar justificativa no Supabase:', error);
        mostrarNotificacao(`❌ Erro ao salvar justificativa: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

/**
 * Substitui salvarObservacao — vira uma linha em "justificativas" SEM
 * código. O Apps Script (receberWebhookJustificativa_) reconhece isso
 * e trata como observação solta, não como justificativa formal.
 */
async function salvarObservacaoSupabase(dados) {
    try {
        if (!dados.texto) {
            throw new Error('Texto é obrigatório');
        }

        const usuarioId = obterUsuarioIdSupabaseAtual();
        if (!usuarioId) {
            throw new Error('Usuário não vinculado ao Supabase — selecione a pessoa de novo');
        }

        const dataEscolhida = dados.data || new Date().toISOString().slice(0, 10);

        const corpo = {
            usuario_id: usuarioId,
            codigo: null,
            data_inicio: dataEscolhida,
            data_fim: dataEscolhida,
            observacao: dados.texto
        };

        await chamarSupabase_('justificativas', corpo);

        salvarBackupLocal('observacao', corpo);
        mostrarNotificacao('✅ Observação salva com sucesso!', 'success');

        return { success: true };

    } catch (error) {
        console.error('Erro ao salvar observação no Supabase:', error);
        mostrarNotificacao(`❌ Erro ao salvar observação: ${error.message}`, 'error');
        return { success: false, error: error.message };
    }
}

if (typeof window !== 'undefined') {
    window.resolverUsuarioIdSupabase = resolverUsuarioIdSupabase;
    window.obterUsuarioIdSupabaseAtual = obterUsuarioIdSupabaseAtual;
    window.salvarFrequenciaSupabase = salvarFrequenciaSupabase;
    window.salvarJustificativaSupabase = salvarJustificativaSupabase;
    window.salvarObservacaoSupabase = salvarObservacaoSupabase;
}
