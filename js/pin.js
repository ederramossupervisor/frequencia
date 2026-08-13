// ============================================
// PIN.JS
// ============================================
// PIN numérico de 4 dígitos por usuário, guardado (com hash) na planilha
// central de Usuários. Confirmado uma vez por aparelho: depois disso o
// aparelho fica "confiável" (flag no localStorage) e o app entra direto,
// sem pedir o PIN de novo — até a pessoa trocar de usuário ou limpar os
// dados do navegador.
//
// Como se encaixa no fluxo existente (usuarios.js):
// - app.js/initApp() já mostra o seletor de usuário quando não há nome
//   salvo. Este arquivo entra DEPOIS disso: quando já existe um nome
//   salvo mas o aparelho ainda não confirmou o PIN dessa pessoa.
// - Ao entrar pela primeira vez (seletor ou cadastro), selecionarUsuario()
//   já dá location.reload() — o gate de PIN do app.js cuida do resto
//   nessa recarga, sem precisar mexer em usuarios.js.

/**
 * Este aparelho já confirmou o PIN da pessoa atualmente selecionada?
 */
function dispositivoPinConfirmado() {
    try {
        return localStorage.getItem(CONFIG.STORAGE_KEYS.DISPOSITIVO_PIN_OK) === 'true';
    } catch (e) {
        return false;
    }
}

function marcarDispositivoPinConfirmado() {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.DISPOSITIVO_PIN_OK, 'true');
    } catch (e) {}
}

function limparDispositivoPinConfirmado() {
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEYS.DISPOSITIVO_PIN_OK);
    } catch (e) {}
}

/**
 * Confere o PIN informado com o da pessoa. GET de propósito (como
 * obterUsuarioAPI) — a resposta certo/errado precisa ser de verdade.
 */
async function verificarPinAPI(nome, pin) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'verificarPin',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            pin: pin
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Cadastra ou troca o PIN da pessoa. GET de propósito, pelo mesmo motivo.
 */
async function definirPinAPI(nome, pin) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'definirPin',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome,
            pin: pin
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * NOVO — "Esqueci meu PIN": apaga o PIN cadastrado de alguém (ação de
 * administrador, usada em Configurações). Depois disso, o próximo acesso
 * dessa pessoa — em qualquer aparelho — cai no modo "criar" PIN de novo.
 * Não requer senha de admin no servidor (mesmo modelo de confiança do
 * resto do sistema); o botão só aparece no app pra quem está em
 * CONFIG.ADMIN_NOMES.
 */
async function resetarPinAPI(nome) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'resetarPin',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * NOVO — "Esqueci meu PIN" self-service: pede ao servidor pra gerar um
 * PIN temporário (válido por tempo limitado) e mandar por e-mail pra
 * pessoa, usando o e-mail cadastrado dela na planilha central. Se ela não
 * tiver e-mail cadastrado, o servidor devolve erro — nesse caso a única
 * saída é pedir pra um administrador resetar (ver resetarPinAPI acima).
 */
async function solicitarPinTemporarioAPI(nome) {
    try {
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            return { success: false, error: 'URL do Apps Script não configurada' };
        }
        const params = new URLSearchParams({
            action: 'solicitarPinTemporario',
            sheetIdUsuarios: CONFIG.SHEET_ID_USUARIOS,
            nome: nome
        });
        const resposta = await fetch(`${CONFIG.APP_SCRIPT_URL}?${params.toString()}`, { method: 'GET' });
        if (!resposta.ok) throw new Error(`Resposta HTTP ${resposta.status}`);
        return await resposta.json();
    } catch (error) {
        return { success: false, error: error.message };
    }
}

/**
 * Mostra a tela cheia de PIN — modo 'criar' (pede o PIN duas vezes, pra
 * confirmar) ou 'verificar' (pede uma vez só). Resolve sempre (nunca
 * rejeita) com { sucesso, cancelado?, trocandoUsuario? }, pra quem chamou
 * saber exatamente o que aconteceu:
 *
 * - { sucesso: true } — PIN criado/confirmado, aparelho marcado confiável.
 * - { sucesso: false, cancelado: true } — só acontece com permitirCancelar.
 * - { sucesso: false, trocandoUsuario: true } — pessoa clicou em "Não é
 *   você?"; o seletor de usuário já assumiu a tela (quem chamou NÃO deve
 *   continuar a inicialização normal nesse caso).
 *
 * @param {Object} opcoes
 * @param {string} opcoes.nome
 * @param {'criar'|'verificar'} opcoes.modo
 * @param {boolean} [opcoes.permitirTrocarUsuario=false] - mostra "Não é você?"
 * @param {boolean} [opcoes.permitirCancelar=false] - mostra "Cancelar" (usado em Configurações)
 * @returns {Promise<{sucesso: boolean, cancelado?: boolean, trocandoUsuario?: boolean}>}
 */
function exibirTelaPin(opcoes) {
    return new Promise((resolve) => {
        const nome = opcoes.nome;
        const criando = opcoes.modo === 'criar';
        const permitirTrocarUsuario = !!opcoes.permitirTrocarUsuario;
        const permitirCancelar = !!opcoes.permitirCancelar;

        const overlayExistente = document.getElementById('pinOverlay');
        if (overlayExistente) overlayExistente.remove();

        const overlay = document.createElement('div');
        overlay.id = 'pinOverlay';
        overlay.className = 'seletor-usuario-overlay';
        overlay.innerHTML = `
            <div class="seletor-usuario-card">
                <i class="fas fa-lock seletor-usuario-icone"></i>
                <h2>${criando ? 'Crie seu PIN' : 'Digite seu PIN'}</h2>
                <p class="text-muted">${criando
                    ? `Escolha 4 números pra proteger o acesso de <strong>${nome}</strong> nesse aparelho.`
                    : `Confirme o PIN de <strong>${nome}</strong> pra entrar.`}</p>

                <div class="pin-input-row" id="pinLinha1">
                    ${[0, 1, 2, 3].map(i => `<input type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" class="pin-input-digit" data-linha="1" data-indice="${i}" aria-label="Dígito ${i + 1} do PIN">`).join('')}
                </div>

                ${criando ? `
                <p class="text-muted pin-confirmar-label">Confirme o PIN</p>
                <div class="pin-input-row" id="pinLinha2">
                    ${[0, 1, 2, 3].map(i => `<input type="tel" inputmode="numeric" pattern="[0-9]*" maxlength="1" autocomplete="off" class="pin-input-digit" data-linha="2" data-indice="${i}" aria-label="Dígito ${i + 1} da confirmação do PIN">`).join('')}
                </div>` : ''}

                <div id="pinErro" class="seletor-usuario-erro hidden"></div>
                <p id="pinEsqueciMsg" class="text-muted pin-esqueci-msg hidden"></p>

                ${!criando ? `<button id="pinEsqueci" class="seletor-usuario-link mt-3">Esqueci meu PIN</button>` : ''}
                ${permitirTrocarUsuario ? `<button id="pinTrocarUsuario" class="seletor-usuario-link mt-3">Não é você? Trocar de usuário</button>` : ''}
                ${permitirCancelar ? `<button id="pinCancelar" class="seletor-usuario-link mt-3">Cancelar</button>` : ''}
            </div>
        `;
        document.body.appendChild(overlay);

        const divErro = document.getElementById('pinErro');
        const linha1 = Array.from(overlay.querySelectorAll('[data-linha="1"]'));
        const linha2 = criando ? Array.from(overlay.querySelectorAll('[data-linha="2"]')) : [];
        let enviando = false;

        const lerPin = (inputs) => inputs.map(i => i.value).join('');

        const limparELevarFoco = (inputs) => {
            inputs.forEach(i => (i.value = ''));
            inputs[0].focus();
        };

        const mostrarErro = (mensagem) => {
            divErro.textContent = mensagem;
            divErro.classList.remove('hidden');
        };

        function configurarAutoAvanco(inputs, aoCompletar) {
            inputs.forEach((input, indice) => {
                input.addEventListener('input', () => {
                    input.value = input.value.replace(/[^0-9]/g, '').slice(-1);
                    if (input.value && indice < inputs.length - 1) {
                        inputs[indice + 1].focus();
                    }
                    if (inputs.every(i => i.value)) aoCompletar();
                });
                input.addEventListener('keydown', (evento) => {
                    if (evento.key === 'Backspace' && !input.value && indice > 0) {
                        inputs[indice - 1].focus();
                    }
                });
            });
        }

        async function tentarEnviar() {
            if (enviando) return;
            divErro.classList.add('hidden');

            if (criando) {
                const pin1 = lerPin(linha1);
                if (pin1.length < 4) return;
                const pin2 = lerPin(linha2);
                if (pin2.length < 4) { linha2[0].focus(); return; }

                if (pin1 !== pin2) {
                    mostrarErro('Os PINs não são iguais. Tente de novo.');
                    limparELevarFoco(linha1);
                    limparELevarFoco(linha2);
                    linha1[0].focus();
                    return;
                }

                enviando = true;
                const resultado = await definirPinAPI(nome, pin1);
                enviando = false;

                if (!resultado.success) {
                    mostrarErro(resultado.error || 'Não foi possível salvar o PIN. Tente de novo.');
                    limparELevarFoco(linha1);
                    limparELevarFoco(linha2);
                    linha1[0].focus();
                    return;
                }

                marcarDispositivoPinConfirmado();
                overlay.remove();
                resolve({ sucesso: true });

            } else {
                const pin = lerPin(linha1);
                if (pin.length < 4) return;

                enviando = true;
                const resultado = await verificarPinAPI(nome, pin);
                enviando = false;

                if (!resultado.success) {
                    mostrarErro(resultado.error || 'PIN incorreto');
                    limparELevarFoco(linha1);
                    return;
                }

                // PIN temporário (recebido por e-mail): confirma o
                // acesso, mas não marca o aparelho como confiável ainda —
                // em vez disso, encadeia direto pra tela de "criar PIN",
                // forçando a pessoa a cadastrar um PIN definitivo antes
                // de entrar de verdade.
                if (resultado.temporario) {
                    overlay.remove();
                    const resultadoCriar = await exibirTelaPin({ nome: nome, modo: 'criar', permitirTrocarUsuario: permitirTrocarUsuario });
                    resolve(resultadoCriar);
                    return;
                }

                marcarDispositivoPinConfirmado();
                overlay.remove();
                resolve({ sucesso: true });
            }
        }

        configurarAutoAvanco(linha1, tentarEnviar);
        if (criando) configurarAutoAvanco(linha2, tentarEnviar);

        setTimeout(() => linha1[0].focus(), 100);

        document.getElementById('pinTrocarUsuario')?.addEventListener('click', () => {
            if (typeof limparUsuarioSelecionado === 'function') limparUsuarioSelecionado();
            limparDispositivoPinConfirmado();
            overlay.remove();
            if (typeof exibirSeletorUsuario === 'function') exibirSeletorUsuario();
            resolve({ sucesso: false, trocandoUsuario: true });
        });

        document.getElementById('pinEsqueci')?.addEventListener('click', async (evento) => {
            const msg = document.getElementById('pinEsqueciMsg');
            const btn = evento.currentTarget;
            if (!msg) return;

            const admins = (CONFIG.ADMIN_NOMES || []).join(', ');

            btn.disabled = true;
            const textoOriginal = btn.textContent;
            btn.textContent = 'Enviando...';
            msg.classList.add('hidden');

            const resultado = typeof solicitarPinTemporarioAPI === 'function'
                ? await solicitarPinTemporarioAPI(nome)
                : { success: false, error: 'Função não disponível' };

            btn.disabled = false;
            btn.textContent = textoOriginal;

            if (resultado.success) {
                msg.textContent = 'Mandamos um PIN temporário pro seu e-mail cadastrado (confira também o spam). Digite ele acima — o app vai pedir pra você criar um PIN novo em seguida.';
            } else {
                msg.textContent = admins
                    ? `${resultado.error || 'Não foi possível enviar um PIN temporário.'} Peça pra ${admins} resetar seu PIN em Configurações → Administração de PINs.`
                    : (resultado.error || 'Não foi possível enviar um PIN temporário. Peça pra um administrador resetar seu PIN em Configurações → Administração de PINs.');
            }
            msg.classList.remove('hidden');
        });

        document.getElementById('pinCancelar')?.addEventListener('click', () => {
            overlay.remove();
            resolve({ sucesso: false, cancelado: true });
        });
    });
}

/**
 * Chamado pelo app.js quando já existe um usuário selecionado, mas este
 * aparelho ainda não confirmou o PIN dele. Descobre se a pessoa já tem
 * PIN cadastrado (pra saber se pede "criar" ou "verificar") e só deixa o
 * resto do app carregar depois de confirmado — ou manda pro seletor, se
 * não der pra confirmar quem é (ex: sem internet no primeiro acesso).
 */
async function iniciarChecagemPin(nome) {
    const dadosUsuario = await obterUsuarioAPI(nome);

    if (!dadosUsuario.success) {
        if (typeof exibirSeletorUsuario === 'function') exibirSeletorUsuario();
        return;
    }

    const modo = dadosUsuario.temPin ? 'verificar' : 'criar';
    const resultadoPin = await exibirTelaPin({ nome: nome, modo: modo, permitirTrocarUsuario: true });

    if (resultadoPin.trocandoUsuario) return; // o seletor já assumiu a tela

    if (typeof continuarInicializacaoApp === 'function') continuarInicializacaoApp();
}

if (typeof window !== 'undefined') {
    window.dispositivoPinConfirmado = dispositivoPinConfirmado;
    window.marcarDispositivoPinConfirmado = marcarDispositivoPinConfirmado;
    window.limparDispositivoPinConfirmado = limparDispositivoPinConfirmado;
    window.verificarPinAPI = verificarPinAPI;
    window.definirPinAPI = definirPinAPI;
    window.resetarPinAPI = resetarPinAPI;
    window.solicitarPinTemporarioAPI = solicitarPinTemporarioAPI;
    window.exibirTelaPin = exibirTelaPin;
    window.iniciarChecagemPin = iniciarChecagemPin;
}
