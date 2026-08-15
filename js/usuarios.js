// ============================================
// USUARIOS.JS
// ============================================
// Gerencia a seleção de usuário e a sincronização com a planilha central
// de Usuários (Nome | Link Frequência | Link Acompanhamento | Feriados).
//
// Estratégia: em vez de espalhar mudanças pelo app inteiro, isso funciona
// como uma "ponte" — ao escolher o nome, busca os dois IDs de planilha e
// os feriados na planilha central e grava tudo nos MESMOS lugares que o
// app já lia antes (localStorage, via salvarConfiguracoes/
// salvarFeriadosConfigurados). Assim o resto do sistema (Frequência,
// Acompanhamento, férias, e-docs) continua funcionando sem nenhuma
// alteração — só passa a ser alimentado pela planilha central, não mais
// digitado à mão.
//
// Feriados — só o admin cadastra, vale pra todo mundo: moram numa aba
// própria chamada "Feriados", na mesma planilha de Usuários (uma linha
// por feriado: Data | Descrição), não mais numa coluna por pessoa. A
// coluna "Feriados" de cada linha em Usuários continua existindo mas não
// é mais lida — pode ser limpa quando quiser. Toda leitura
// (obterFeriadosGlobaisAPI, chamada por selecionarUsuario e
// sincronizarUsuarioAtual) busca essa aba direto. Toda gravação
// (adicionar/remover) só é permitida pra quem é admin (usuarioEhAdmin_(),
// de configuracoes.js).

/**
 * Busca o cabeçalho (Nome, Nº Funcional, Horário de Trabalho, Carga
 * Horária/Dia) já preenchido numa aba de mês existente — pra
 * pré-carregar o card "Meus Dados" em Configurações.
 */
async function obterMeusDadosAPI(sheetIdFrequencia) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({ action: 'obterMeusDados', sheetIdFrequencia: sheetIdFrequencia || '' });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Grava o cabeçalho (Nome, Nº Funcional, Horário de Trabalho, Carga
 * Horária/Dia) em todas as abas de mês das duas planilhas do usuário
 * atual. GET de propósito — mexe em até 24 abas de uma vez, então a
 * confirmação real de sucesso importa mais aqui do que no resto do app.
 * @param {{nome: string, numeroFuncional: string, horarioTrabalho: string, cargaHorariaDia: string}} dados
 * @param {{sheetIdFrequencia: string, sheetIdAcompanhamento: string}} [sheetIds] - opcional; se
 *   não vier, usa carregarConfiguracoes() (o usuário atual).
 */
async function gravarMeusDadosAPI(dados, sheetIds) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }

        const ids = sheetIds || carregarConfiguracoes();
        if (!ids.sheetIdFrequencia) {
            return { success: false, error: 'Planilha de Frequência não configurada' };
        }

        const params = new URLSearchParams({
            action: 'gravarMeusDados',
            sheetIdFrequencia: ids.sheetIdFrequencia,
            nome: dados.nome || '',
            numeroFuncional: dados.numeroFuncional || '',
            horarioTrabalho: dados.horarioTrabalho || '',
            cargaHorariaDia: dados.cargaHorariaDia || ''
        });
        if (ids.sheetIdAcompanhamento) params.set('sheetIdAcompanhamento', ids.sheetIdAcompanhamento);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cadastra uma pessoa nova usando links de planilhas que ela já tinha.
 * GET (não POST) de propósito, igual as outras leituras — pra ter
 * confirmação de verdade do resultado.
 */
async function criarUsuarioAPI(nome, linkFrequencia, linkAcompanhamento, email) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'criarUsuario',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            linkFrequencia: linkFrequencia,
            linkAcompanhamento: linkAcompanhamento
        });
        if (email) params.set('email', email);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cadastra uma pessoa nova copiando os templates de Frequência e
 * Acompanhamento pra ela (uma cópia nova de cada). Se um e-mail for
 * informado, as cópias são compartilhadas com esse e-mail como editor.
 */
async function criarUsuarioComTemplatesAPI(nome, email) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'criarUsuarioComTemplates',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            templateIdFrequencia: CONFIG.TEMPLATE_IDS.FREQUENCIA,
            templateIdAcompanhamento: CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO
        });
        if (email) params.set('email', email);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * NOVO (virada de ano) — pede ao Apps Script pra criar as planilhas do
 * ano novo pra uma pessoa, migrar o saldo de horas de dezembro e
 * atualizar a planilha central de Usuários. GET de propósito (cria
 * arquivo no Drive — precisa de confirmação real de sucesso).
 */
async function virarAnoAPI(nome, anoNovo, email) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'virarAno',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            anoNovo: String(anoNovo),
            templateIdFrequencia: CONFIG.TEMPLATE_IDS.FREQUENCIA,
            templateIdAcompanhamento: CONFIG.TEMPLATE_IDS.ACOMPANHAMENTO
        });
        if (email) params.set('email', email);

        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * NOVO (virada de ano) — orquestra a virada pra UMA pessoa: chama
 * virarAnoAPI e, se a pessoa virada for a pessoa atualmente logada
 * neste aparelho, já atualiza o cache local (sheetId atual + mapa de
 * anteriores) pra refletir o ano novo na hora, sem precisar
 * resselecionar o usuário.
 *
 * @param {string} nome
 * @param {number} anoNovo
 * @param {string} [email] - opcional, pra compartilhar as planilhas novas
 */
async function iniciarNovoAno(nome, anoNovo, email) {
    const resultado = await virarAnoAPI(nome, anoNovo, email);
    if (!resultado.success) return resultado;

    if (obterUsuarioAtual() === nome) {
        salvarConfiguracoes({
            sheetIdFrequencia: resultado.sheetIdFrequencia,
            sheetIdAcompanhamento: resultado.sheetIdAcompanhamento
        });

        const mapaFreqAnteriores = obterSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES);
        const mapaAcompAnteriores = obterSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES);
        // O sheetId que estava "atual" até agora passa a ser o do ano anterior.
        const configAntiga = carregarConfiguracoes();
        if (resultado.anoAnterior) {
            if (configAntiga.sheetIdFrequencia) mapaFreqAnteriores[resultado.anoAnterior] = configAntiga.sheetIdFrequencia;
            if (configAntiga.sheetIdAcompanhamento) mapaAcompAnteriores[resultado.anoAnterior] = configAntiga.sheetIdAcompanhamento;
        }
        salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES, mapaFreqAnteriores);
        salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES, mapaAcompAnteriores);
    }

    return resultado;
}

/**
 * Nome do usuário atualmente selecionado neste aparelho/navegador (só o
 * nome fica salvo localmente — o resto vem da planilha central a cada
 * login).
 */
function obterUsuarioAtual() {
    try {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.USUARIO_NOME) || '';
    } catch (e) {
        return '';
    }
}

/**
 * Busca a lista de nomes cadastrados na planilha central de Usuários.
 */
async function listarUsuariosAPI() {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        if (!CONFIG.SHEET_ID_USUARIOS) {
            return { success: false, error: 'Planilha de Usuários não configurada' };
        }

        const params = new URLSearchParams({ action: 'listarUsuarios', sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Busca os IDs das duas planilhas e os feriados de uma pessoa, pelo nome
 * dela na planilha central de Usuários.
 */
async function obterUsuarioAPI(nome) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        if (!CONFIG.SHEET_ID_USUARIOS) {
            return { success: false, error: 'Planilha de Usuários não configurada' };
        }

        const params = new URLSearchParams({ action: 'obterUsuario', sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS, nome: nome });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Grava/atualiza o e-mail da pessoa atual na planilha central de
 * Usuários. GET de propósito — é usado pra recuperação de PIN, então
 * precisa de confirmação real de que salvou.
 */
async function definirEmailUsuarioAPI(email) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const nome = obterUsuarioAtual();
        if (!nome) return { success: false, error: 'Nenhum usuário selecionado' };

        const params = new URLSearchParams({
            action: 'definirEmailUsuario',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            email: email
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        const resultado = await resposta.json();
        if (resultado.success) {
            try { localStorage.setItem(CONFIG.STORAGE_KEYS.EMAIL_USUARIO, email || ''); } catch (e) {}
        }
        return resultado;
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cadastra um feriado na aba "Feriados" da planilha central — uma lista
 * só, vale pra todo mundo. Só quem é admin chega a chamar isso (o
 * formulário em Configurações só aparece pra admin), mas confere de novo
 * aqui como segunda trava. GET de propósito, igual as outras leituras —
 * diferente da versão anterior (POST em no-cors, sem confirmação real),
 * agora dá pra saber de verdade se salvou.
 */
async function adicionarFeriadoUsuarioAPI(dataISO, descricao) {
    if (typeof usuarioEhAdmin_ === 'function' && !usuarioEhAdmin_()) {
        return { success: false, error: 'Apenas o administrador pode cadastrar feriados' };
    }
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'adicionarFeriado',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            data: dataISO,
            descricao: descricao || 'Feriado'
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Remove um feriado (pela data) da aba "Feriados" da planilha central.
 * Mesma trava e mesmo motivo de ser GET de adicionarFeriadoUsuarioAPI.
 */
async function removerFeriadoUsuarioAPI(dataISO) {
    if (typeof usuarioEhAdmin_ === 'function' && !usuarioEhAdmin_()) {
        return { success: false, error: 'Apenas o administrador pode remover feriados' };
    }
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'removerFeriado',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            data: dataISO
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Busca a lista de feriados "oficial" — direto da aba "Feriados" da
 * planilha central (uma lista só, não mais por pessoa). É a fonte única
 * que selecionarUsuario e sincronizarUsuarioAtual usam. Leitura aberta,
 * sem checar admin — todo mundo VÊ a lista, só não pode editar.
 */
async function obterFeriadosGlobaisAPI() {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'listarFeriados',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Aplica os dados de uma pessoa (vindos da planilha central) nos mesmos
 * lugares locais que o resto do app já lê — sheetIdFrequencia/
 * sheetIdAcompanhamento via salvarConfiguracoes(), feriados via
 * salvarFeriadosConfigurados(). Depois disso, tudo no app funciona
 * exatamente como já funcionava.
 */
async function selecionarUsuario(nome) {
    const resultado = await obterUsuarioAPI(nome);
    if (!resultado.success) {
        return resultado;
    }

    localStorage.setItem(CONFIG.STORAGE_KEYS.USUARIO_NOME, nome);
    salvarConfiguracoes({
        sheetIdFrequencia: resultado.sheetIdFrequencia,
        sheetIdAcompanhamento: resultado.sheetIdAcompanhamento
    });

    // Feriados agora vêm sempre da aba "Feriados" (fonte única), não
    // mais da linha da pessoa que está entrando — ver obterFeriadosGlobaisAPI.
    const feriadosGlobais = await obterFeriadosGlobaisAPI();
    salvarFeriadosConfigurados(feriadosGlobais.success ? (feriadosGlobais.feriados || []) : (resultado.feriados || []));

    salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES, resultado.sheetIdsFrequenciaAnteriores || {});
    salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES, resultado.sheetIdsAcompanhamentoAnteriores || {});
    try { localStorage.setItem(CONFIG.STORAGE_KEYS.EMAIL_USUARIO, resultado.email || ''); } catch (e) {}

    return { success: true };
}

/**
 * Rebusca os dados do usuário JÁ selecionado na planilha central e
 * atualiza a cópia local — sem passar pela tela de seleção. É o que
 * resolve o caso de cadastrar um feriado num aparelho e não ver refletido
 * em outro: sem isso, cada aparelho só buscava a planilha central uma
 * vez, no login, e nunca mais.
 *
 * @param {boolean} silencioso - se true, não mostra notificação de
 *   sucesso (usado na sincronização automática ao abrir o app); se
 *   false, avisa o resultado (usado no botão manual "Sincronizar agora").
 */
async function sincronizarUsuarioAtual(silencioso) {
    const nome = obterUsuarioAtual();
    if (!nome) return { success: false, error: 'Nenhum usuário selecionado' };

    const resultado = await obterUsuarioAPI(nome);
    if (!resultado.success) {
        if (!silencioso && typeof mostrarNotificacao === 'function') {
            mostrarNotificacao('Não foi possível sincronizar: ' + (resultado.error || 'falha desconhecida'), 'error');
        }
        return resultado;
    }

    salvarConfiguracoes({
        sheetIdFrequencia: resultado.sheetIdFrequencia,
        sheetIdAcompanhamento: resultado.sheetIdAcompanhamento
    });

    // Feriados agora vêm sempre da aba "Feriados" (fonte única) — mesmo
    // comentário de selecionarUsuario, ver obterFeriadosGlobaisAPI.
    const feriadosGlobais = await obterFeriadosGlobaisAPI();
    salvarFeriadosConfigurados(feriadosGlobais.success ? (feriadosGlobais.feriados || []) : (resultado.feriados || []));

    salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_FREQUENCIA_ANTERIORES, resultado.sheetIdsFrequenciaAnteriores || {});
    salvarSheetIdsAnteriores(CONFIG.STORAGE_KEYS.SHEET_IDS_ACOMPANHAMENTO_ANTERIORES, resultado.sheetIdsAcompanhamentoAnteriores || {});
    try { localStorage.setItem(CONFIG.STORAGE_KEYS.EMAIL_USUARIO, resultado.email || ''); } catch (e) {}

    // Se a tela de Configurações estiver aberta, atualiza a lista de
    // feriados na hora, sem precisar trocar de aba.
    if (typeof renderizarListaFeriados === 'function') renderizarListaFeriados();
    if (typeof atualizarCalculoDiasUteis === 'function') atualizarCalculoDiasUteis();
    if (typeof preencherEmailNaTela === 'function') preencherEmailNaTela();

    if (!silencioso && typeof mostrarNotificacao === 'function') {
        mostrarNotificacao('Dados sincronizados com a planilha central', 'success', 2000);
    }

    return { success: true };
}

/**
 * Limpa o usuário selecionado (usado em "Trocar de usuário"), sem apagar
 * o resto — a tela de seleção volta a aparecer no próximo carregamento.
 */
function limparUsuarioSelecionado() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USUARIO_NOME);
    try { localStorage.removeItem(CONFIG.STORAGE_KEYS.EMAIL_USUARIO); } catch (e) {}
}

/**
 * Mostra a tela cheia de seleção de usuário (bloqueia o resto do app até
 * escolher). Usada tanto na primeira abertura quanto em "Trocar de
 * usuário".
 */
async function exibirSeletorUsuario() {
    const overlayExistente = document.getElementById('seletorUsuarioOverlay');
    if (overlayExistente) overlayExistente.remove();

    const overlay = document.createElement('div');
    overlay.id = 'seletorUsuarioOverlay';
    overlay.className = 'seletor-usuario-overlay';
    overlay.innerHTML = `
        <div class="seletor-usuario-card">
            <i class="fas fa-user-circle seletor-usuario-icone"></i>
            <h2>Quem é você?</h2>
            <p class="text-muted">Escolha seu nome pra carregar suas planilhas e feriados automaticamente.</p>
            <select id="seletorUsuarioSelect" class="form-control">
                <option value="">Carregando...</option>
            </select>
            <div id="seletorUsuarioErro" class="seletor-usuario-erro hidden"></div>
            <button id="seletorUsuarioBtn" class="btn btn-primary mt-3" disabled>
                <i class="fas fa-arrow-right"></i> Entrar
            </button>

            <button id="btnMostrarCadastro" class="seletor-usuario-link mt-3">
                Ainda não tenho cadastro
            </button>

            <div id="seletorUsuarioCadastro" class="seletor-usuario-cadastro hidden">
                <hr>
                <p class="text-muted mb-2">Seu nome:</p>
                <input type="text" id="cadastroNome" class="form-control" placeholder="Nome completo">

                <p class="text-muted mt-2 mb-2">Seu e-mail:</p>
                <input type="email" id="cadastroEmail" class="form-control" placeholder="Seu e-mail do Google">
                <small class="text-muted d-block mt-1">Usado pra te mandar um PIN temporário se você esquecer o seu PIN.</small>

                <div class="seletor-usuario-tabs mt-3">
                    <button type="button" class="seletor-usuario-tab active" data-modo="templates">Criar minhas planilhas</button>
                    <button type="button" class="seletor-usuario-tab" data-modo="links">Já tenho as planilhas</button>
                </div>

                <div id="cadastroModoTemplates">
                    <p class="text-muted mt-2 mb-2">
                        O app cria, pra você, uma cópia nova de cada planilha (Frequência e Acompanhamento) a partir do template. O e-mail acima também é usado pra compartilhar as cópias com você.
                    </p>
                </div>

                <div id="cadastroModoLinks" class="hidden">
                    <p class="text-muted mt-2 mb-2">Cole os links completos das suas planilhas:</p>
                    <input type="url" id="cadastroLinkFrequencia" class="form-control mb-2" placeholder="Link da planilha de Frequência">
                    <input type="url" id="cadastroLinkAcompanhamento" class="form-control" placeholder="Link da planilha de Acompanhamento">
                </div>

                <hr>
                <p class="text-muted mb-2">Pra já preencher o cabeçalho das suas planilhas:</p>
                <input type="text" id="cadastroNumeroFuncional" class="form-control mb-2" placeholder="Nº Funcional">
                <input type="text" id="cadastroHorarioTrabalho" class="form-control mb-2" placeholder="Horário de Trabalho (ex: 8h - 17h)">
                <select id="cadastroCargaHoraria" class="form-control">
                    <option value="">Carga Horária/Dia...</option>
                    <option value="8:00">8:00</option>
                    <option value="10:00">10:00</option>
                    <option value="7:00">7:00</option>
                    <option value="6:00">6:00</option>
                    <option value="5:00">5:00</option>
                    <option value="4:00">4:00</option>
                    <option value="8:48">8:48</option>
                </select>

                <div id="seletorUsuarioCadastroErro" class="seletor-usuario-erro hidden mt-2"></div>

                <button id="btnCadastrar" class="btn btn-primary mt-3">
                    <i class="fas fa-user-plus"></i> Cadastrar e entrar
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    const select = document.getElementById('seletorUsuarioSelect');
    const btnEntrar = document.getElementById('seletorUsuarioBtn');
    const divErro = document.getElementById('seletorUsuarioErro');

    const resultado = await listarUsuariosAPI();

    if (!resultado.success || !resultado.usuarios || resultado.usuarios.length === 0) {
        select.innerHTML = `<option value="">Nenhum usuário encontrado</option>`;
        select.disabled = true;
        divErro.textContent = resultado.error || 'Ainda não há ninguém cadastrado — use "Ainda não tenho cadastro" abaixo pra ser a primeira pessoa.';
        divErro.classList.remove('hidden');
    } else {
        select.innerHTML = `<option value="">Selecione...</option>` +
            resultado.usuarios.map(nome => `<option value="${nome}">${nome}</option>`).join('');

        select.addEventListener('change', () => {
            btnEntrar.disabled = !select.value;
            divErro.classList.add('hidden');
        });

        btnEntrar.addEventListener('click', async () => {
            if (!select.value) return;

            btnEntrar.disabled = true;
            btnEntrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';

            const resultadoSelecao = await selecionarUsuario(select.value);

            if (resultadoSelecao.success) {
                location.reload();
            } else {
                divErro.textContent = resultadoSelecao.error || 'Não foi possível carregar os dados desse usuário.';
                divErro.classList.remove('hidden');
                btnEntrar.disabled = false;
                btnEntrar.innerHTML = '<i class="fas fa-arrow-right"></i> Entrar';
            }
        });
    }

    // --- Seção de cadastro ---
    const btnMostrarCadastro = document.getElementById('btnMostrarCadastro');
    const painelCadastro = document.getElementById('seletorUsuarioCadastro');
    const tabs = overlay.querySelectorAll('.seletor-usuario-tab');
    const painelTemplates = document.getElementById('cadastroModoTemplates');
    const painelLinks = document.getElementById('cadastroModoLinks');
    const divErroCadastro = document.getElementById('seletorUsuarioCadastroErro');
    const btnCadastrar = document.getElementById('btnCadastrar');
    let modoCadastro = 'templates';

    btnMostrarCadastro.addEventListener('click', () => {
        painelCadastro.classList.toggle('hidden');
        btnMostrarCadastro.textContent = painelCadastro.classList.contains('hidden')
            ? 'Ainda não tenho cadastro'
            : 'Já tenho cadastro — voltar pra seleção';
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            modoCadastro = tab.dataset.modo;
            painelTemplates.classList.toggle('hidden', modoCadastro !== 'templates');
            painelLinks.classList.toggle('hidden', modoCadastro !== 'links');
            divErroCadastro.classList.add('hidden');
        });
    });

    btnCadastrar.addEventListener('click', async () => {
        const nome = document.getElementById('cadastroNome').value.trim();
        if (!nome) {
            divErroCadastro.textContent = 'Informe seu nome';
            divErroCadastro.classList.remove('hidden');
            return;
        }

        const email = document.getElementById('cadastroEmail').value.trim();

        btnCadastrar.disabled = true;
        divErroCadastro.classList.add('hidden');

        let resultadoCriacao;

        if (modoCadastro === 'templates') {
            btnCadastrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Criando suas planilhas...';
            resultadoCriacao = await criarUsuarioComTemplatesAPI(nome, email);
        } else {
            const linkFrequencia = document.getElementById('cadastroLinkFrequencia').value.trim();
            const linkAcompanhamento = document.getElementById('cadastroLinkAcompanhamento').value.trim();
            if (!linkFrequencia || !linkAcompanhamento) {
                divErroCadastro.textContent = 'Cole os dois links';
                divErroCadastro.classList.remove('hidden');
                btnCadastrar.disabled = false;
                return;
            }
            btnCadastrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cadastrando...';
            resultadoCriacao = await criarUsuarioAPI(nome, linkFrequencia, linkAcompanhamento, email);
        }

        if (!resultadoCriacao.success) {
            divErroCadastro.textContent = resultadoCriacao.error || 'Não foi possível cadastrar. Tente de novo.';
            divErroCadastro.classList.remove('hidden');
            btnCadastrar.disabled = false;
            btnCadastrar.innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar e entrar';
            return;
        }

        btnCadastrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Entrando...';
        const resultadoSelecao = await selecionarUsuario(nome);

        if (resultadoSelecao.success) {
            // Grava o cabeçalho (Nº Funcional, Horário, Carga Horária) nas
            // 12 abas — feito depois do login pra já ter os sheetIds
            // carregados. Se falhar, não impede a entrada: a pessoa pode
            // preencher depois em Configurações > Meus Dados.
            const numeroFuncional = document.getElementById('cadastroNumeroFuncional').value.trim();
            const horarioTrabalho = document.getElementById('cadastroHorarioTrabalho').value.trim();
            const cargaHorariaDia = document.getElementById('cadastroCargaHoraria').value;

            if (numeroFuncional || horarioTrabalho || cargaHorariaDia) {
                btnCadastrar.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preenchendo suas planilhas...';
                await gravarMeusDadosAPI({ nome, numeroFuncional, horarioTrabalho, cargaHorariaDia });
            }

            location.reload();
        } else {
            // O cadastro em si já deu certo (a linha existe na planilha);
            // isso aqui só falharia numa falha de rede pontual — vale
            // tentar de novo.
            divErroCadastro.textContent = 'Cadastro criado, mas não consegui carregar seus dados agora. Tente entrar de novo.';
            divErroCadastro.classList.remove('hidden');
            btnCadastrar.disabled = false;
            btnCadastrar.innerHTML = '<i class="fas fa-user-plus"></i> Cadastrar e entrar';
        }
    });
}

if (typeof window !== 'undefined') {
    window.obterUsuarioAtual = obterUsuarioAtual;
    window.obterMeusDadosAPI = obterMeusDadosAPI;
    window.gravarMeusDadosAPI = gravarMeusDadosAPI;
    window.listarUsuariosAPI = listarUsuariosAPI;
    window.obterUsuarioAPI = obterUsuarioAPI;
    window.criarUsuarioAPI = criarUsuarioAPI;
    window.criarUsuarioComTemplatesAPI = criarUsuarioComTemplatesAPI;
    window.adicionarFeriadoUsuarioAPI = adicionarFeriadoUsuarioAPI;
    window.removerFeriadoUsuarioAPI = removerFeriadoUsuarioAPI;
    window.obterFeriadosGlobaisAPI = obterFeriadosGlobaisAPI;
    window.definirEmailUsuarioAPI = definirEmailUsuarioAPI;
    window.selecionarUsuario = selecionarUsuario;
    window.sincronizarUsuarioAtual = sincronizarUsuarioAtual;
    window.limparUsuarioSelecionado = limparUsuarioSelecionado;
    window.exibirSeletorUsuario = exibirSeletorUsuario;
    window.virarAnoAPI = virarAnoAPI;
    window.iniciarNovoAno = iniciarNovoAno;
}
