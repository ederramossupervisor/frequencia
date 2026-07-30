# 📋 INSTRUÇÕES DE CONFIGURAÇÃO - Controle de Frequência

## 🚀 VISÃO GERAL
Este aplicativo PWA permite gerenciar frequência e acompanhamento usando Google Sheets. 
Cada usuário usa suas PRÓPRIAS cópias das planilhas.

## 📁 ESTRUTURA DE ARQUIVOS
controle-frequencia/
├── index.html # Página principal
├── manifest.json # Configuração PWA
├── service-worker.js # Service Worker
├── css/
│ └── styles.css # Estilos principais
├── js/
│ ├── app.js # Lógica principal
│ ├── config.js # Configurações
│ ├── utils.js # Funções auxiliares
│ ├── api.js # Comunicação com Apps Script
│ ├── frequencia.js # Lógica da aba Frequência
│ ├── acompanhamento.js # Lógica da aba Acompanhamento
│ └── configuracoes.js # Lógica da aba Configurações
└── INSTRUCOES.md # Este arquivo

## 🔧 CONFIGURAÇÃO PASSO A PASSO

### 1. PREPARAR O APPS SCRIPT (VOCÊ - DESENVOLVEDOR)

#### 1.1 Criar o projeto no Google Apps Script:
1. Acesse [script.google.com](https://script.google.com)
2. Clique em "Novo projeto"
3. Apague o código padrão e cole o conteúdo do arquivo `SeuScriptUnico.js`
4. Clique em "Salvar" (Ctrl+S)
5. Dê um nome ao projeto, ex: "ControleFrequenciaAPI"

#### 1.2 Publicar como Web App:
1. No Apps Script, clique em "Publicar" > "Implantar como aplicativo web"
2. Configurações:
   - **Versão do projeto:** Novo
   - **Execute o aplicativo como:** Você (seu email)
   - **Quem tem acesso ao aplicativo:** Qualquer pessoa, mesmo anônimo
3. Clique em "Implantar"
4. Copie a URL gerada (ex: `https://script.google.com/macros/s/SEU-ID/exec`)
5. Esta URL é o SEU backend único para todos os usuários

#### 1.3 Atualizar o frontend com a URL:
1. Abra o arquivo `js/config.js`
2. Substitua a linha:
   ```javascript
   APP_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbwYOUR_SCRIPT_ID/exec",
   Pela SUA URL copiada no passo anterior
