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
        USER_SETTINGS: "user_settings"
    },
    
    // Configurações do app
    APP_SETTINGS: {
        AUTO_SAVE: true,
        NOTIFICATIONS: true,
        THEME: "light"
    }
};

// Exportar configuração para uso em outros arquivos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
