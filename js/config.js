// CONFIGURAÇÕES DO APLICATIVO
// IMPORTANTE: Você precisa atualizar estas configurações

const CONFIG = {
    // URL do SEU Apps Script (você vai colocar aqui depois de publicar)
    APP_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyIrY21QVYbtSYqEFw_OZHoD5poKjMAjEMCEb1UsPKNOzXc_ps1Bv2A3X8aC60jNueUww/exec",
    
    // IDs das suas planilhas templates (para os botões "Abrir Template")
    TEMPLATE_IDS: {
        FREQUENCIA: "1ZySSwFVpWmYBfumdndJvIQMswqOzhYI2FyNs2uSIZiA",
        ACOMPANHAMENTO: "1tYecexGyRKpAMYQJwkSwPVVvZY0NbATp8vJbn1X_Xsw"
    },

    // Planilha central de usuários — colunas: Nome | Link Frequência |
    // Link Acompanhamento | Feriados. É de onde o app busca, pelo nome
    // escolhido na tela inicial, os IDs das duas planilhas da pessoa e os
    // feriados cadastrados por ela (substitui o que antes ficava só no
    // localStorage do navegador).
    SHEET_ID_USUARIOS: "1lO6qdy3VJeb3MEfYiso26BjNKFNQu7UBqw3On3a1f9E",
    
    // Lista de meses para os dropdowns
    MESES: [
        "JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO",
        "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"
    ],
    
    // Códigos de justificativa (dropdown)
    CODIGOS_JUSTIFICATIVA: [
        { codigo: "10", descricao: "Reposição de Hora" },
        { codigo: "20", descricao: "Serviço Externo" },
        { codigo: "30", descricao: "Saída de Emergência para assuntos pessoais" },
        { codigo: "40", descricao: "Viagem a Serviço" },
        { codigo: "50", descricao: "Treinamento" },
        { codigo: "APJ", descricao: "Participação em Júri" },
        { codigo: "60", descricao: "Compensação" },
        { codigo: "70", descricao: "Atestado/Licença" },
        { codigo: "80", descricao: "Abonos" },
        { codigo: "FR", descricao: "Férias" },
        { codigo: "RC", descricao: "Recesso ou Ponto Facultativo" },
        { codigo: "SOL", descricao: "Serviços Obrigatórios por Lei" }
    ],
    
    // Configurações de armazenamento local
    STORAGE_KEYS: {
        FREQUENCIA_SHEET_ID: "frequencia_sheet_id",
        ACOMPANHAMENTO_SHEET_ID: "acompanhamento_sheet_id",
        USER_SETTINGS: "user_settings",
        FERIADOS: "feriados_personalizados",
        USUARIO_NOME: "usuario_nome_selecionado",
        // NOVO — virada de ano: mapas {ano: sheetId} de planilhas de anos
        // anteriores da pessoa selecionada, cacheados localmente pra uso
        // ao aplicar férias que cruzam dezembro/janeiro.
        SHEET_IDS_FREQUENCIA_ANTERIORES: "sheet_ids_frequencia_anteriores",
        SHEET_IDS_ACOMPANHAMENTO_ANTERIORES: "sheet_ids_acompanhamento_anteriores",
        // NOVO — PIN: marca que ESTE aparelho já confirmou o PIN da
        // pessoa selecionada (ver js/pin.js). Enquanto essa flag existir,
        // o app entra direto sem pedir o PIN de novo. É apagada junto com
        // USUARIO_NOME em "Trocar de usuário".
        DISPOSITIVO_PIN_OK: "dispositivo_pin_verificado",
        // NOVO — e-mail da pessoa selecionada, cacheado localmente só pra
        // pré-preencher o campo em Configurações (o valor "de verdade"
        // sempre vem da planilha central de Usuários).
        EMAIL_USUARIO: "email_usuario_selecionado"
    },

    // Ano corrente do app — usado como "ano de partida" pra saber se um
    // período de férias cruza a virada e pra sugerir o próximo ano no
    // botão "Iniciar novo ano". Atualize aqui em dezembro/janeiro.
    ANO_ATUAL: 2026,

    // NOVO — o card "Novo Ano" (botão de virar o ano) só aparece pra
    // todo mundo a partir dessa data. Antes disso, só quem estiver em
    // ADMIN_NOMES continua vendo (pra poder testar a qualquer momento).
    // Formato "aaaa-mm-dd". Atualize junto com ANO_ATUAL a cada virada.
    DATA_LIBERACAO_VIRADA: "2027-01-01",

    // Nomes (exatamente como aparecem na coluna "Nome" da planilha de
    // Usuários, sem diferenciar maiúsculas/minúsculas) que sempre veem o
    // card "Novo Ano", mesmo antes da DATA_LIBERACAO_VIRADA.
    ADMIN_NOMES: ["Eder"],
    
    // Configurações do app
    APP_SETTINGS: {
        AUTO_SAVE: true,
        NOTIFICATIONS: true,
        THEME: "light"
    },

    // Jornada diária padrão (em horas) — usada APENAS como fallback pra
    // Previsão de Horas do Mês, caso a planilha não retorne a "Carga
    // Horária/Dia" (célula H9 de cada aba de mês). O valor real de cada
    // pessoa vem da própria planilha, não daqui.
    HORAS_JORNADA_PADRAO: 8
};

// Exportar configuração para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
