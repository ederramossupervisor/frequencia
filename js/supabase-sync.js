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

// Converte "HH:MM" (duração, ex: "08:00" ou "01:30") para número decimal
// de horas (ex: 8 ou 1.5) — formato que a coluna "horas_liquidas"
// (numeric) do Postgres espera. Sem isso, mandar a string "08:00" pra
// essa coluna dá erro 22P02 (invalid input syntax for type numeric).
function horasParaDecimal_(horaHHMM) {
    if (!horaHHMM) return null;
    const partes = String(horaHHMM).split(':');
    if (partes.length !== 2) return null;
    const horas = parseInt(partes[0], 10);
    const minutos = parseInt(partes[1], 10);
    if (isNaN(horas) || isNaN(minutos)) return null;
    return Math.round((horas + minutos / 60) * 100) / 100;
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

        const corpo = {
            usuario_id: usuarioId,
            data: dataISO,
            // Sempre manda os quatro, com null pra vazio — se só omitíssemos
            // os vazios, apagar um horário no formulário e salvar não
            // limparia o valor antigo no Supabase (nem na planilha).
            entrada_manha: horaParaSupabase_(formatarHora(dados.entradaManha)) || null,
            saida_manha: horaParaSupabase_(formatarHora(dados.saidaManha)) || null,
            entrada_tarde: horaParaSupabase_(formatarHora(dados.entradaTarde)) || null,
            saida_tarde: horaParaSupabase_(formatarHora(dados.saidaTarde)) || null
        };

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
            horas_liquidas: horasParaDecimal_(dados.horasLiquidas) ?? 8,
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

/**
 * Apaga o registro de frequência do dia — remove também da planilha,
 * via o mesmo webhook que grava (agora também escuta o evento DELETE).
 */
async function excluirFrequenciaSupabase(dados) {
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

        const url = `${CONFIG.SUPABASE_URL}/rest/v1/registros_frequencia?usuario_id=eq.${usuarioId}&data=eq.${dataISO}`;
        const resposta = await fetch(url, {
            method: 'DELETE',
            headers: {
                apikey: CONFIG.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                Prefer: 'return=minimal'
            }
        });

        if (!resposta.ok) {
            const texto = await resposta.text().catch(() => '');
            throw new Error(`Supabase ${resposta.status}: ${texto}`);
        }

        return { success: true };

    } catch (error) {
        console.error('Erro ao excluir frequência no Supabase:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lista as justificativas do usuário atual num mês (ano corrente),
 * pra pessoa escolher qual excluir. Cada uma vem com o id (uuid) que
 * excluirJustificativaSupabase espera.
 */
async function listarJustificativasSupabase(mes) {
    try {
        const usuarioId = obterUsuarioIdSupabaseAtual();
        if (!usuarioId) {
            return { success: false, error: 'Usuário não vinculado ao Supabase', justificativas: [] };
        }

        const indiceMes = CONFIG.MESES.indexOf(mes);
        const ano = CONFIG.ANO_ATUAL;
        const inicioMes = `${ano}-${String(indiceMes + 1).padStart(2, '0')}-01`;
        const ultimoDia = new Date(ano, indiceMes + 1, 0).getDate();
        const fimMes = `${ano}-${String(indiceMes + 1).padStart(2, '0')}-${String(ultimoDia).padStart(2, '0')}`;

        const url = `${CONFIG.SUPABASE_URL}/rest/v1/justificativas?usuario_id=eq.${usuarioId}` +
            `&data_inicio=gte.${inicioMes}&data_inicio=lte.${fimMes}&order=data_inicio.asc`;

        const resposta = await fetch(url, {
            headers: {
                apikey: CONFIG.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`
            }
        });

        if (!resposta.ok) throw new Error(`Supabase ${resposta.status}`);

        const linhas = await resposta.json();
        return { success: true, justificativas: linhas };

    } catch (error) {
        console.error('Erro ao listar justificativas no Supabase:', error);
        return { success: false, error: error.message, justificativas: [] };
    }
}

/**
 * Apaga uma justificativa pelo id. O webhook (evento DELETE) cuida de
 * limpar código/horas na Frequência e remover a linha de detalhes e a
 * observação correspondentes na planilha de Acompanhamento, sem
 * deixar buraco.
 */
async function excluirJustificativaSupabase(id) {
    try {
        const url = `${CONFIG.SUPABASE_URL}/rest/v1/justificativas?id=eq.${id}`;
        const resposta = await fetch(url, {
            method: 'DELETE',
            headers: {
                apikey: CONFIG.SUPABASE_ANON_KEY,
                Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
                Prefer: 'return=minimal'
            }
        });

        if (!resposta.ok) {
            const texto = await resposta.text().catch(() => '');
            throw new Error(`Supabase ${resposta.status}: ${texto}`);
        }

        return { success: true };

    } catch (error) {
        console.error('Erro ao excluir justificativa no Supabase:', error);
        return { success: false, error: error.message };
    }
}

if (typeof window !== 'undefined') {
    window.resolverUsuarioIdSupabase = resolverUsuarioIdSupabase;
    window.obterUsuarioIdSupabaseAtual = obterUsuarioIdSupabaseAtual;
    window.salvarFrequenciaSupabase = salvarFrequenciaSupabase;
    window.salvarJustificativaSupabase = salvarJustificativaSupabase;
    window.salvarObservacaoSupabase = salvarObservacaoSupabase;
    window.excluirFrequenciaSupabase = excluirFrequenciaSupabase;
    window.listarJustificativasSupabase = listarJustificativasSupabase;
    window.excluirJustificativaSupabase = excluirJustificativaSupabase;
}
