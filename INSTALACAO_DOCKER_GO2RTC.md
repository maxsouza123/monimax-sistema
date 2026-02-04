# 🐳 Instalação e Configuração do Docker + go2rtc

## 📥 Passo 1: Instalar Docker Desktop

### **1.1 Download**

1. Acesse: **https://www.docker.com/products/docker-desktop/**
2. Clique em **"Download for Windows"**
3. Aguarde o download (cerca de 500 MB)

### **1.2 Instalação**

1. Execute o instalador **Docker Desktop Installer.exe**
2. Marque a opção: **"Use WSL 2 instead of Hyper-V"** (recomendado)
3. Clique em **"Ok"**
4. Aguarde a instalação (5-10 minutos)
5. Clique em **"Close and restart"**

### **1.3 Configuração Inicial**

Após reiniciar:
1. O Docker Desktop abrirá automaticamente
2. Aceite os termos de serviço
3. Pode pular o tutorial (Skip)
4. Aguarde o Docker iniciar (ícone na bandeja do sistema ficará verde)

### **1.4 Verificar Instalação**

Abra o PowerShell e execute:
```powershell
docker --version
```

Deve aparecer algo como: `Docker version 24.0.x`

---

## 🚀 Passo 2: Executar go2rtc

### **2.1 Navegar até a Pasta do Projeto**

Abra o PowerShell e execute:
```powershell
cd "c:\Users\Usuário\Documents\Aplicação MoniMax\MoniMax sistema"
```

### **2.2 Baixar e Executar go2rtc**

Execute este comando:
```powershell
docker run -d `
  --name go2rtc `
  -p 1984:1984 `
  -p 8554:8554 `
  -p 8555:8555/tcp `
  -p 8555:8555/udp `
  -v ${PWD}/go2rtc.yaml:/config/go2rtc.yaml `
  --restart unless-stopped `
  alexxit/go2rtc
```

**O que esse comando faz:**
- `-d` = Roda em segundo plano
- `--name go2rtc` = Dá o nome "go2rtc" ao container
- `-p 1984:1984` = Expõe a porta 1984 (interface web)
- `-p 8555:8555` = Expõe a porta 8555 (WebRTC)
- `-v ${PWD}/go2rtc.yaml` = Usa o arquivo de configuração que criamos
- `--restart unless-stopped` = Reinicia automaticamente se cair

### **2.3 Verificar se Está Rodando**

```powershell
docker ps
```

Deve aparecer o container `go2rtc` com status `Up`

### **2.4 Ver Logs (Opcional)**

```powershell
docker logs go2rtc
```

---

## 🌐 Passo 3: Acessar a Interface Web

1. Abra seu navegador (Chrome, Edge ou Firefox)
2. Acesse: **http://localhost:1984**
3. Você verá a interface do go2rtc!

---

## 🎥 Passo 4: Testar Câmeras de Demonstração

Na interface do go2rtc:

1. No menu lateral, você verá as câmeras disponíveis:
   - **demo_pattern** - Padrão colorido de teste
   - **demo_video** - Vídeo Big Buck Bunny

2. Clique em uma câmera (ex: **demo_pattern**)

3. Você verá várias opções de stream:
   - **WebRTC** ⭐ (recomendado - baixa latência)
   - **MSE** (alternativa)
   - **MP4**
   - **JPEG**

4. Clique em **"WebRTC"**

5. **Veja o vídeo ao vivo!** 🎉

---

## 📹 Passo 5: Adicionar Suas Câmeras (Opcional)

### **5.1 Editar Configuração**

Abra o arquivo `go2rtc.yaml` no VS Code ou Notepad

### **5.2 Adicionar Sua Câmera**

Adicione no final do arquivo:

```yaml
  # Sua câmera
  minha_camera:
    - rtsp://admin:senha@192.168.1.50:554/stream1
```

**Substitua:**
- `admin` = usuário da câmera
- `senha` = senha da câmera
- `192.168.1.50` = IP da câmera
- `/stream1` = caminho do stream (varia por fabricante)

### **5.3 Exemplos por Fabricante**

**Intelbras:**
```yaml
  camera_intelbras:
    - rtsp://admin:senha@192.168.1.50:554/cam/realmonitor?channel=1&subtype=0
```

**Hikvision:**
```yaml
  camera_hikvision:
    - rtsp://admin:senha@192.168.1.51:554/Streaming/Channels/101
```

**Dahua:**
```yaml
  camera_dahua:
    - rtsp://admin:senha@192.168.1.52:554/cam/realmonitor?channel=1&subtype=0
```

### **5.4 Reiniciar go2rtc**

```powershell
docker restart go2rtc
```

### **5.5 Testar**

Acesse novamente: **http://localhost:1984**

Sua câmera aparecerá na lista!

---

## 🛠️ Comandos Úteis

### **Ver Containers Rodando**
```powershell
docker ps
```

### **Ver Todos os Containers**
```powershell
docker ps -a
```

### **Ver Logs**
```powershell
docker logs go2rtc
docker logs -f go2rtc  # Acompanhar em tempo real
```

### **Parar go2rtc**
```powershell
docker stop go2rtc
```

### **Iniciar go2rtc**
```powershell
docker start go2rtc
```

### **Reiniciar go2rtc**
```powershell
docker restart go2rtc
```

### **Remover go2rtc**
```powershell
docker stop go2rtc
docker rm go2rtc
```

### **Executar Novamente**
```powershell
docker run -d --name go2rtc -p 1984:1984 -p 8554:8554 -p 8555:8555/tcp -p 8555:8555/udp -v ${PWD}/go2rtc.yaml:/config/go2rtc.yaml --restart unless-stopped alexxit/go2rtc
```

---

## 🆘 Problemas Comuns

### **"Docker não é reconhecido"**
- Docker não está instalado ou não foi adicionado ao PATH
- Solução: Reinicie o computador após instalar o Docker

### **"Port 1984 is already allocated"**
- Outra aplicação está usando a porta 1984
- Solução: Mude a porta: `-p 8080:1984` e acesse `http://localhost:8080`

### **"Cannot connect to the Docker daemon"**
- Docker Desktop não está rodando
- Solução: Abra o Docker Desktop e aguarde iniciar

### **Câmera não aparece**
- Verifique o arquivo `go2rtc.yaml`
- Teste a URL RTSP no VLC Media Player primeiro
- Veja os logs: `docker logs go2rtc`

### **Vídeo não carrega**
- Tente outro navegador (Chrome funciona melhor)
- Verifique se a porta 8555 não está bloqueada pelo firewall
- Tente usar MSE em vez de WebRTC

---

## 🎯 Próximos Passos

Depois de testar localmente:

1. ✅ Integrar com o MoniMax (criar componente React)
2. ✅ Adicionar suas câmeras reais
3. ✅ Testar performance com múltiplas câmeras
4. ✅ Considerar migrar para Oracle Cloud (grátis)

---

## 📚 Recursos

- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **go2rtc GitHub**: https://github.com/AlexxIT/go2rtc
- **Documentação go2rtc**: https://github.com/AlexxIT/go2rtc/wiki

---

## ✅ Checklist

- [ ] Docker Desktop instalado
- [ ] Docker rodando (ícone verde na bandeja)
- [ ] go2rtc executado com sucesso
- [ ] Interface acessível em http://localhost:1984
- [ ] Câmera de demonstração funcionando
- [ ] (Opcional) Câmera real adicionada

---

**Boa sorte! Se tiver dúvidas, me chame! 🚀**
