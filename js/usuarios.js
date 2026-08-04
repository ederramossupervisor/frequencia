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
 * Grava um feriado na planilha central (linha da pessoa atual). Mesma
 * limitação de "no-cors" do resto do app — não confirma de verdade se
 * salvou, então quem chama também atualiza a lista local otimisticamente.
 */
async function adicionarFeriadoUsuarioAPI(dataISO, descricao) {
    const nome = obterUsuarioAtual();
    if (!nome) return { success: false, error: 'Nenhum usuário selecionado' };

    return enviarParaAppsScript({
        operation: 'adicionarFeriadoUsuario',
        sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
        nome: nome,
        data: dataISO,
        descricao: descricao
    });
}

/**
 * Remove um feriado (pela data) da planilha central (linha da pessoa atual).
 */
async function removerFeriadoUsuarioAPI(dataISO) {
    const nome = obterUsuarioAtual();
    if (!nome) return { success: false, error: 'Nenhum usuário selecionado' };

    return enviarParaAppsScript({
        operation: 'removerFeriadoUsuario',
        sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
        nome: nome,
        data: dataISO
    });
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
    salvarFeriadosConfigurados(resultado.feriados || []);

    return { success: true };
}

/**
 * Limpa o usuário selecionado (usado em "Trocar de usuário"), sem apagar
 * o resto — a tela de seleção volta a aparecer no próximo carregamento.
 */
function limparUsuarioSelecionado() {
    localStorage.removeItem(CONFIG.STORAGE_KEYS.USUARIO_NOME);
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
        </div>
    `;
    document.body.appendChild(overlay);

    const select = document.getElementById('seletorUsuarioSelect');
    const btnEntrar = document.getElementById('seletorUsuarioBtn');
    const divErro = document.getElementById('seletorUsuarioErro');

    const resultado = await listarUsuariosAPI();

    if (!resultado.success || !resultado.usuarios || resultado.usuarios.length === 0) {
        select.innerHTML = `<option value="">Nenhum usuário encontrado</option>`;
        divErro.textContent = resultado.error || 'A planilha de Usuários está vazia — cadastre uma linha com seu nome e os links das suas planilhas.';
        divErro.classList.remove('hidden');
        return;
    }

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

if (typeof window !== 'undefined') {
    window.obterUsuarioAtual = obterUsuarioAtual;
    window.listarUsuariosAPI = listarUsuariosAPI;
    window.obterUsuarioAPI = obterUsuarioAPI;
    window.adicionarFeriadoUsuarioAPI = adicionarFeriadoUsuarioAPI;
    window.removerFeriadoUsuarioAPI = removerFeriadoUsuarioAPI;
    window.selecionarUsuario = selecionarUsuario;
    window.limparUsuarioSelecionado = limparUsuarioSelecionado;
    window.exibirSeletorUsuario = exibirSeletorUsuario;
}
