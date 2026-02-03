# 📤 Guia: Como Subir o MoniMax no GitHub

Este guia irá ajudá-lo a publicar seu projeto MoniMax no GitHub passo a passo.

---

## ✅ Pré-requisitos

Antes de começar, você precisa:

1. **Git instalado** no seu computador
2. **Conta no GitHub** (gratuita)

---

## 📥 Passo 1: Instalar o Git

### Windows

1. Acesse: https://git-scm.com/download/win
2. Baixe o instalador
3. Execute o instalador (deixe as opções padrão)
4. Após a instalação, abra o **PowerShell** ou **Git Bash**
5. Verifique a instalação:
   ```bash
   git --version
   ```

---

## 🔧 Passo 2: Configurar o Git (Primeira Vez)

Abra o terminal e configure seu nome e email:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

> Use o mesmo email da sua conta do GitHub!

---

## 🌐 Passo 3: Criar Repositório no GitHub

1. Acesse: https://github.com
2. Faça login na sua conta
3. Clique no botão **"+"** no canto superior direito
4. Selecione **"New repository"**
5. Preencha:
   - **Repository name**: `monimax-sistema` (ou outro nome)
   - **Description**: "Sistema de Monitoramento e Segurança Eletrônica"
   - **Visibility**: Escolha **Private** (privado) ou **Public** (público)
   - ⚠️ **NÃO** marque "Add a README file" (já temos um)
   - ⚠️ **NÃO** adicione .gitignore (já temos um)
   - ⚠️ **NÃO** escolha licença (já temos uma)
6. Clique em **"Create repository"**

---

## 💻 Passo 4: Inicializar Git no Projeto

Abra o terminal na pasta do projeto:

```bash
cd "c:\Users\Usuário\Documents\Aplicação MoniMax\MoniMax sistema"
```

Inicialize o repositório Git:

```bash
git init
```

---

## 📋 Passo 5: Adicionar Arquivos ao Git

Adicione todos os arquivos ao Git:

```bash
git add .
```

> O `.gitignore` já está configurado para proteger seus arquivos sensíveis!

---

## 💾 Passo 6: Fazer o Primeiro Commit

Crie o primeiro commit:

```bash
git commit -m "🎉 Commit inicial: Sistema MoniMax completo"
```

---

## 🔗 Passo 7: Conectar ao GitHub

Conecte seu repositório local ao GitHub (substitua `SEU-USUARIO` pelo seu nome de usuário):

```bash
git remote add origin https://github.com/SEU-USUARIO/monimax-sistema.git
```

Exemplo:
```bash
git remote add origin https://github.com/joaosilva/monimax-sistema.git
```

---

## 🚀 Passo 8: Enviar para o GitHub

Renomeie a branch principal para `main`:

```bash
git branch -M main
```

Envie o código para o GitHub:

```bash
git push -u origin main
```

> Na primeira vez, o GitHub pode pedir suas credenciais. Use seu **Personal Access Token** em vez da senha.

---

## 🔑 Como Criar um Personal Access Token

Se o GitHub pedir autenticação:

1. Acesse: https://github.com/settings/tokens
2. Clique em **"Generate new token"** → **"Generate new token (classic)"**
3. Dê um nome: "MoniMax Deploy"
4. Marque o escopo: **repo** (acesso completo aos repositórios)
5. Clique em **"Generate token"**
6. **COPIE O TOKEN** (você não verá novamente!)
7. Use o token como senha quando o Git pedir

---

## ✅ Verificar se Funcionou

1. Acesse seu repositório no GitHub
2. Você deve ver todos os arquivos do projeto
3. O README.md será exibido automaticamente

---

## 🔄 Comandos Úteis para o Futuro

### Adicionar mudanças e enviar para o GitHub:

```bash
# 1. Ver o que mudou
git status

# 2. Adicionar arquivos modificados
git add .

# 3. Criar um commit
git commit -m "Descrição das mudanças"

# 4. Enviar para o GitHub
git push
```

### Baixar mudanças do GitHub:

```bash
git pull
```

### Ver histórico de commits:

```bash
git log --oneline
```

---

## ⚠️ IMPORTANTE: Segurança

### ✅ Arquivos Protegidos (NÃO vão para o GitHub):

- `.env.local` - Suas credenciais do Supabase e Gemini
- `node_modules/` - Dependências (muito grande)
- `dist/` - Build de produção

### ❌ NUNCA commite:

- Senhas
- Chaves de API
- Tokens de acesso
- Credenciais do banco de dados

> O `.gitignore` já está configurado para proteger esses arquivos!

---

## 🎨 Personalize seu Repositório

### Adicione um banner bonito:

1. Crie uma imagem de banner (1200x400px)
2. Faça upload no GitHub (Issues → New Issue → arraste a imagem)
3. Copie a URL gerada
4. Edite o README.md e substitua a URL do banner

### Adicione badges:

Edite o README.md e personalize os badges com suas informações.

---

## 🆘 Problemas Comuns

### "Git não é reconhecido como comando"
- Você precisa instalar o Git (Passo 1)
- Após instalar, reinicie o terminal

### "Permission denied"
- Você precisa criar um Personal Access Token (veja acima)
- Use o token como senha

### "Remote origin already exists"
- Execute: `git remote remove origin`
- Depois execute novamente o Passo 7

### "Failed to push some refs"
- Execute: `git pull origin main --allow-unrelated-histories`
- Depois: `git push -u origin main`

---

## 📚 Recursos Adicionais

- [Documentação do Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## 🎉 Pronto!

Seu projeto MoniMax agora está no GitHub! 🚀

Compartilhe o link com sua equipe ou adicione ao seu portfólio.

---

**Dúvidas?** Consulte a documentação ou abra uma issue no repositório.
