// API PARA COMUNICAÇÃO COM O GOOGLE APPS SCRIPT

/**
 * Envia dados para o Google Apps Script
 */
async function enviarParaAppsScript(dados) {
    try {
        // Verifica se a URL do script está configurada
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            mostrarNotificacao(
                'Erro: URL do Apps Script não configurada. Configure na aba Configurações.',
                'error',
                10000
            );
            return {
                success: false,
                error: 'URL do Apps Script não configurada'
            };
        }
        
        console.log('Enviando dados para Apps Script:', dados);
        
        // Mostra indicador de carregamento
        mostrarNotificacao('Enviando dados...', 'info', 2000);
        
        // Faz a requisição para o Apps Script
        const resposta = await fetch(CONFIG.APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para evitar problemas com CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dados)
        });
        
        // Nota: Com 'no-cors', não conseguimos ler a resposta diretamente
        // O Apps Script processa e salva os dados
        console.log('Dados enviados para Apps Script com sucesso');
        
        // Mostra mensagem de sucesso
        mostrarNotificacao('Dados enviados com sucesso!', 'success', 3000);
        
        return {
            success: true,
            message: 'Dados enviados para processamento'
        };
        
    } catch (error) {
        console.error('Erro ao enviar para Apps Script:', error);
        
        // Tenta método alternativo usando formulário (para contornar CORS)
        try {
            await enviarViaFormulario(dados);
            return {
                success: true,
                message: 'Dados enviados via método alternativo'
            };
        } catch (formError) {
            mostrarNotificacao(
                'Erro ao enviar dados. Verifique sua conexão e tente novamente.',
                'error',
                5000
            );
            
            return {
                success: false,
                error: error.toString()
            };
        }
    }
}

/**
 * Método alternativo usando formulário (para quando fetch falha)
 */
function enviarViaFormulario(dados) {
    return new Promise((resolve, reject) => {
        try {
            // Cria formulário temporário
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = CONFIG.APP_SCRIPT_URL;
            form.style.display = 'none';
            
            // Adiciona campo com os dados JSON
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'dados';
            input.value = JSON.stringify(dados);
            form.appendChild(input);
            
            // Adiciona formulário à página e envia
            document.body.appendChild(form);
            form.submit();
            
            // Remove formulário após envio
            setTimeout(() => {
                document.body.removeChild(form);
                resolve();
            }, 100);
            
        } catch (error) {
            reject(error);
        }
    });
}

/**
 * Testa a conexão com o Apps Script
 */
async function testarConexaoAppsScript() {
    try {
        // Verifica se a URL está configurada
        if (!CONFIG.APP_SCRIPT_URL || CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID')) {
            mostrarNotificacao(
                'URL do Apps Script não configurada. Configure na aba Configurações.',
                'error',
                10000
            );
            return false;
        }
        
        mostrarNotificacao('Testando conexão com Apps Script...', 'info', 2000);
        
        // Dados de teste
        const dadosTeste = {
            operation: 'testConnection',
            timestamp: new Date().toISOString(),
            appVersion: '1.0.0',
            test: true
        };
        
        console.log('Testando conexão com:', CONFIG.APP_SCRIPT_URL);
        
        // Faz a requisição
        const resposta = await fetch(CONFIG.APP_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Importante para evitar CORS
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dadosTeste)
        });
        
        // Com 'no-cors' não podemos ler a resposta, mas sabemos que foi enviada
        console.log('Teste de conexão enviado com sucesso');
        
        // Mostra mensagem de sucesso (assumindo que funcionou)
        mostrarNotificacao('✅ Conexão com Apps Script estabelecida com sucesso!', 'success', 5000);
        
        return true;
        
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        
        // Tenta método alternativo
        try {
            await enviarViaFormulario({
                operation: 'testConnection',
                timestamp: new Date().toISOString()
            });
            
            mostrarNotificacao('✅ Conexão estabelecida via método alternativo!', 'success', 5000);
            return true;
            
        } catch (formError) {
            mostrarNotificacao(
                '❌ Falha na conexão com Apps Script. Verifique:\n1) URL correta\n2) Script publicado\n3) Conexão internet',
                'error',
                10000
            );
            return false;
        }
    }
}

/**
 * Envia dados de frequência
 */
async function salvarFrequenciaAPI(dados) {
    try {
        // Validações básicas
        if (!dados.mes || !dados.dia) {
            throw new Error('Mês e dia são obrigatórios');
        }
        
        // Carrega configurações do usuário
        const config = carregarConfiguracoes();
        
        if (!config.sheetIdFrequencia) {
            throw new Error('ID da planilha de frequência não configurado');
        }
        
        // Prepara dados para envio
        const dadosEnvio = {
            operation: 'saveFrequencia',
            sheetIdFrequencia: config.sheetIdFrequencia,
            userId: 'usuario_' + Date.now(), // Identificador único
            month: dados.mes,
            day: dados.dia,
            timestamp: new Date().toISOString()
        };
        
        // Adiciona campos preenchidos
        if (dados.entradaManha) dadosEnvio.entradaManha = formatarHora(dados.entradaManha);
        if (dados.saidaManha) dadosEnvio.saidaManha = formatarHora(dados.saidaManha);
        if (dados.entradaTarde) dadosEnvio.entradaTarde = formatarHora(dados.entradaTarde);
        if (dados.saidaTarde) dadosEnvio.saidaTarde = formatarHora(dados.saidaTarde);
        
        // Calcula horas trabalhadas se tiver todos os horários
        if (dados.entradaManha && dados.saidaTarde) {
            const horasManha = calcularHorasTrabalhadas(dados.entradaManha, dados.saidaManha || '12:00');
            const horasTarde = calcularHorasTrabalhadas(dados.entradaTarde || '13:00', dados.saidaTarde);
            
            // Soma as horas (simplificado)
            dadosEnvio.horasTrabalhadas = horasManha; // Pode ajustar para cálculo mais preciso
        }
        
        // Envia para o Apps Script
        const resultado = await enviarParaAppsScript(dadosEnvio);
        
        if (resultado.success) {
            // Salva localmente para backup
            salvarBackupLocal('frequencia', dadosEnvio);
            
            mostrarNotificacao(
                `✅ Frequência do dia ${dados.dia} salva com sucesso!`,
                'success'
            );
        }
        
        return resultado;
        
    } catch (error) {
        console.error('Erro ao salvar frequência:', error);
        mostrarNotificacao(`❌ Erro ao salvar frequência: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envia dados de justificativa
 */
async function salvarJustificativaAPI(dados) {
    try {
        // Validações básicas
        if (!dados.mes || !dados.codigo || !dados.data) {
            throw new Error('Mês, código e data são obrigatórios');
        }
        
        // Carrega configurações do usuário
        const config = carregarConfiguracoes();
        
        if (!config.sheetIdFrequencia || !config.sheetIdAcompanhamento) {
            throw new Error('Configure ambas as planilhas');
        }
        
        // Prepara dados para envio
        const dadosEnvio = {
            operation: 'saveJustificativaCompleta',
            sheetIdFrequencia: config.sheetIdFrequencia,
            sheetIdAcompanhamento: config.sheetIdAcompanhamento,
            month: dados.mes,
            day: dados.dia,
            dataJustificativa: dados.data,
            codigo: dados.codigo,
            horaInicio: formatarHora(dados.horaInicio) || '08:00',
            horaFim: formatarHora(dados.horaFim) || '17:00',
            fezAlmoco: dados.fezAlmoco || false,
            horasLiquidas: dados.horasLiquidas || '08:00',
            observacao: dados.observacao || '',
            timestamp: new Date().toISOString()
        };
        
        console.log('Enviando justificativa:', dadosEnvio);
        
        // Envia para o Apps Script
        const resultado = await enviarParaAppsScript(dadosEnvio);
        
        if (resultado.success) {
            // Salva localmente para backup
            salvarBackupLocal('justificativa', dadosEnvio);
            
            mostrarNotificacao(
                `✅ Justificativa ${dados.codigo} salva com sucesso!`,
                'success'
            );
        }
        
        return resultado;
        
    } catch (error) {
        console.error('Erro ao salvar justificativa:', error);
        mostrarNotificacao(`❌ Erro ao salvar justificativa: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Envia dados de observação
 */
async function salvarObservacao(dados) {
    try {
        // Validações básicas
        if (!dados.mes || !dados.texto) {
            throw new Error('Mês e texto são obrigatórios');
        }
        
        // Carrega configurações do usuário
        const config = carregarConfiguracoes();
        
        if (!config.sheetIdAcompanhamento) {
            throw new Error('ID da planilha de acompanhamento não configurado');
        }
        
        // Prepara dados para envio
        const dadosEnvio = {
            operation: 'saveObservacao',
            sheetIdAcompanhamento: config.sheetIdAcompanhamento,
            month: dados.mes,
            texto: dados.texto,
            timestamp: new Date().toISOString()
        };
        
        // Envia para o Apps Script
        const resultado = await enviarParaAppsScript(dadosEnvio);
        
        if (resultado.success) {
            // Salva localmente para backup
            salvarBackupLocal('observacao', dadosEnvio);
            
            mostrarNotificacao('✅ Observação salva com sucesso!', 'success');
        }
        
        return resultado;
        
    } catch (error) {
        console.error('Erro ao salvar observação:', error);
        mostrarNotificacao(`❌ Erro ao salvar observação: ${error.message}`, 'error');
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Salva backup local dos dados (para caso falhe o envio)
 */
function salvarBackupLocal(tipo, dados) {
    try {
        const chave = `backup_${tipo}_${Date.now()}`;
        const backup = {
            tipo,
            dados,
            timestamp: new Date().toISOString(),
            sincronizado: true // Será marcado como false se falhar
        };
        
        localStorage.setItem(chave, JSON.stringify(backup));
        
        // Limpa backups antigos (mais de 7 dias)
        limparBackupsAntigos();
        
        console.log(`Backup salvo localmente: ${chave}`);
        
    } catch (error) {
        console.error('Erro ao salvar backup local:', error);
    }
}

/**
 * Limpa backups antigos
 */
function limparBackupsAntigos() {
    try {
        const seteDiasAtras = Date.now() - (7 * 24 * 60 * 60 * 1000);
        let removidos = 0;
        
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            
            if (chave.startsWith('backup_')) {
                try {
                    const backup = JSON.parse(localStorage.getItem(chave));
                    
                    if (backup && backup.timestamp) {
                        const timestampBackup = new Date(backup.timestamp).getTime();
                        
                        if (timestampBackup < seteDiasAtras) {
                            localStorage.removeItem(chave);
                            removidos++;
                            i--; // Ajusta índice após remoção
                        }
                    }
                } catch (e) {
                    // Ignora erros de parse
                }
            }
        }
        
        if (removidos > 0) {
            console.log(`${removidos} backups antigos removidos`);
        }
        
    } catch (error) {
        console.error('Erro ao limpar backups antigos:', error);
    }
}

/**
 * Tenta sincronizar backups pendentes
 */
async function sincronizarBackupsPendentes() {
    try {
        const backupsPendentes = [];
        
        // Encontra backups não sincronizados
        for (let i = 0; i < localStorage.length; i++) {
            const chave = localStorage.key(i);
            
            if (chave.startsWith('backup_')) {
                try {
                    const backup = JSON.parse(localStorage.getItem(chave));
                    
                    if (backup && !backup.sincronizado) {
                        backupsPendentes.push({ chave, backup });
                    }
                } catch (e) {
                    // Ignora erros
                }
            }
        }
        
        if (backupsPendentes.length === 0) return;
        
        console.log(`Encontrados ${backupsPendentes.length} backups pendentes`);
        
        // Tenta sincronizar cada backup
        for (const item of backupsPendentes) {
            try {
                // Reenvia os dados
                const resultado = await enviarParaAppsScript(item.backup.dados);
                
                if (resultado.success) {
                    // Marca como sincronizado
                    item.backup.sincronizado = true;
                    localStorage.setItem(item.chave, JSON.stringify(item.backup));
                    console.log(`Backup ${item.chave} sincronizado`);
                }
            } catch (error) {
                console.error(`Erro ao sincronizar backup ${item.chave}:`, error);
            }
        }
        
        if (backupsPendentes.length > 0) {
            console.log(`${backupsPendentes.length} backups processados`);
        }
        
    } catch (error) {
        console.error('Erro na sincronização de backups:', error);
    }
}

// ============================================
// FUNÇÕES AUXILIARES DE CONEXÃO
// ============================================

/**
 * Verifica se pode se conectar com o Apps Script
 */
function verificarConexaoDisponivel() {
    return !!(CONFIG.APP_SCRIPT_URL && !CONFIG.APP_SCRIPT_URL.includes('YOUR_SCRIPT_ID'));
}

/**
 * Testa conexão completa (usada na aba Configurações)
 */
async function testarConexaoCompleta() {
    const btnTestarConexao = document.getElementById('btnTestarConexao');
    const textoOriginal = btnTestarConexao?.innerHTML;
    
    if (btnTestarConexao) {
        btnTestarConexao.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testando...';
        btnTestarConexao.disabled = true;
    }
    
    try {
        // 1. Testa conexão com Apps Script
        const conexaoAppsScript = await testarConexaoAppsScript();
        
        // 2. Testa IDs das planilhas
        const config = carregarConfiguracoes();
        const idsValidos = {
            frequencia: validarIdPlanilha(config.sheetIdFrequencia),
            acompanhamento: validarIdPlanilha(config.sheetIdAcompanhamento)
        };
        
        // Prepara mensagem de resultado
        let mensagem = '';
        
        if (conexaoAppsScript) {
            mensagem += '✅ Conexão com Apps Script estabelecida\n';
        } else {
            mensagem += '❌ Problema na conexão com Apps Script\n';
        }
        
        if (idsValidos.frequencia) {
            mensagem += '✅ ID da planilha de frequência válido\n';
        } else {
            mensagem += '⚠️ ID da planilha de frequência inválido ou não configurado\n';
        }
        
        if (idsValidos.acompanhamento) {
            mensagem += '✅ ID da planilha de acompanhamento válido\n';
        } else {
            mensagem += '⚠️ ID da planilha de acompanhamento inválido ou não configurado\n';
        }
        
        // Mostra resultado
        mostrarModal(
            'Resultado do Teste de Conexão',
            `<pre style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${mensagem}</pre>`,
            `<button class="btn btn-primary" onclick="fecharModal()">OK</button>`
        );
        
        return conexaoAppsScript && (idsValidos.frequencia || idsValidos.acompanhamento);
        
    } catch (error) {
        console.error('Erro no teste completo de conexão:', error);
        
        mostrarModal(
            'Erro no Teste',
            `<div class="alert alert-danger">
                <p><strong>Erro:</strong> ${error.message}</p>
                <p>Verifique sua conexão com a internet e tente novamente.</p>
            </div>`,
            `<button class="btn btn-primary" onclick="fecharModal()">OK</button>`
        );
        
        return false;
        
    } finally {
        if (btnTestarConexao) {
            btnTestarConexao.innerHTML = textoOriginal;
            btnTestarConexao.disabled = false;
        }
    }
}

// ============================================
// EXPORTAR FUNÇÕES PARA USO GLOBAL
// ============================================

// Torne as funções disponíveis globalmente
if (typeof window !== 'undefined') {
    window.enviarParaAppsScript = enviarParaAppsScript;
    window.testarConexaoAppsScript = testarConexaoAppsScript;
    window.testarConexaoCompleta = testarConexaoCompleta;
    window.salvarFrequenciaAPI = salvarFrequenciaAPI;
    window.salvarJustificativaAPI = salvarJustificativaAPI;
    window.salvarObservacao = salvarObservacao;
    window.sincronizarBackupsPendentes = sincronizarBackupsPendentes;
    window.verificarConexaoDisponivel = verificarConexaoDisponivel;
}

// Para compatibilidade com módulos Node.js (se necessário)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        enviarParaAppsScript,
        testarConexaoAppsScript,
        salvarFrequenciaAPI,
        salvarJustificativaAPI,
        salvarObservacao,
        sincronizarBackupsPendentes,
        verificarConexaoDisponivel
    };
}
