# 🚀 Guia Rápido: Testar WebRTC GRÁTIS

Este guia mostra como testar o go2rtc **100% gratuito** no seu computador.

---

## 🎯 Opção 1: Teste Rápido com Docker (5 minutos)

### **Pré-requisitos:**
- Docker Desktop instalado
- Navegador moderno (Chrome, Edge, Firefox)

### **Passo a Passo:**

#### **1. Instalar Docker Desktop**
- Windows/Mac: https://www.docker.com/products/docker-desktop/
- Instale e inicie o Docker

#### **2. Executar go2rtc**

Abra o PowerShell na pasta do projeto e execute:

```powershell
docker run -d --name go2rtc -p 1984:1984 -p 8554:8554 -p 8555:8555/tcp -p 8555:8555/udp -v ${PWD}/go2rtc.yaml:/config/go2rtc.yaml alexxit/go2rtc
```

#### **3. Acessar a Interface**

Abra no navegador: **http://localhost:1984**

#### **4. Testar Câmeras de Demonstração**

Na interface do go2rtc:
1. Clique em **"demo_pattern"** ou **"demo_video"**
2. Clique em **"WebRTC"**
3. Veja o vídeo ao vivo!

#### **5. Parar o Servidor**

```powershell
docker stop go2rtc
docker rm go2rtc
```

---

## 🏠 Opção 2: Ambiente Completo com Docker Compose

### **Executar:**

```powershell
# Iniciar todos os serviços
docker-compose -f docker-compose-webrtc.yml up -d

# Ver logs
docker-compose -f docker-compose-webrtc.yml logs -f

# Parar tudo
docker-compose -f docker-compose-webrtc.yml down
```

### **Acessar:**
- Interface go2rtc: http://localhost:1984
- Nginx (se configurado): http://localhost:8080

---

## 📹 Adicionar Suas Câmeras

Edite o arquivo `go2rtc.yaml` e adicione suas câmeras:

```yaml
streams:
  minha_camera:
    - rtsp://admin:senha@192.168.1.50:554/stream1
```

Depois reinicie:
```powershell
docker restart go2rtc
```

---

## ☁️ Opção 3: Oracle Cloud (Gratuito para Sempre)

### **Vantagens:**
✅ Gratuito permanentemente
✅ Servidor na nuvem (acesso de qualquer lugar)
✅ 2 VMs grátis
✅ 10TB banda/mês

### **Passo a Passo:**

#### **1. Criar Conta**
- Acesse: https://www.oracle.com/cloud/free/
- Cadastre-se (pede cartão mas não cobra)

#### **2. Criar VM**
1. Vá em **Compute** → **Instances** → **Create Instance**
2. Escolha:
   - **Image**: Ubuntu 22.04
   - **Shape**: VM.Standard.E2.1.Micro (Always Free)
3. Baixe a chave SSH
4. Clique em **Create**

#### **3. Conectar via SSH**

```bash
ssh -i sua-chave.key ubuntu@IP-DA-VM
```

#### **4. Instalar Docker**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER
```

#### **5. Executar go2rtc**

```bash
# Criar arquivo de configuração
nano go2rtc.yaml
# Cole a configuração e salve (Ctrl+X, Y, Enter)

# Executar go2rtc
docker run -d --name go2rtc \
  -p 1984:1984 \
  -p 8554:8554 \
  -p 8555:8555/tcp \
  -p 8555:8555/udp \
  -v $(pwd)/go2rtc.yaml:/config/go2rtc.yaml \
  --restart unless-stopped \
  alexxit/go2rtc
```

#### **6. Configurar Firewall**

No painel da Oracle Cloud:
1. Vá em **Networking** → **Virtual Cloud Networks**
2. Clique na VCN da sua VM
3. **Security Lists** → **Default Security List**
4. **Add Ingress Rules**:
   - Port 1984 (HTTP)
   - Port 8555 (WebRTC)

No servidor:
```bash
sudo ufw allow 1984
sudo ufw allow 8555
```

#### **7. Acessar**

Abra no navegador: **http://IP-DA-VM:1984**

---

## 🎥 Câmeras de Teste Públicas

Use estas URLs para testar sem ter câmeras:

```yaml
streams:
  # Padrão colorido
  test1:
    - rtsp://rtsp.stream/pattern
  
  # Vídeo Big Buck Bunny
  test2:
    - rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4
  
  # Câmera pública (pode estar offline)
  test3:
    - rtsp://170.93.143.139:1935/rtplive/0b01b57900060075004d823633235daa
```

---

## 💡 Dicas

### **Performance Local:**
- ✅ Seu PC pode rodar 5-10 câmeras facilmente
- ✅ Use apenas para testes e desenvolvimento
- ✅ Para produção, use servidor na nuvem

### **Economia:**
- 💰 Oracle Cloud = **GRÁTIS PARA SEMPRE**
- 💰 Local = **GRÁTIS** (usa seu PC)
- 💰 Google Cloud = **$300 de crédito** (90 dias)

### **Próximos Passos:**
1. Teste localmente primeiro
2. Se gostar, migre para Oracle Cloud (grátis)
3. Quando escalar, considere VPS pago

---

## 🆘 Problemas Comuns

### **Docker não inicia:**
- Certifique-se que o Docker Desktop está rodando
- Reinicie o computador

### **Porta 1984 já em uso:**
- Mude para outra porta: `-p 8080:1984`
- Acesse: http://localhost:8080

### **Câmera não conecta:**
- Verifique IP, usuário e senha
- Teste a URL RTSP no VLC primeiro
- Veja os logs: `docker logs go2rtc`

---

## 📚 Recursos

- **Documentação go2rtc**: https://github.com/AlexxIT/go2rtc
- **Oracle Cloud Free**: https://www.oracle.com/cloud/free/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/

---

## ✅ Resumo

| Opção | Custo | Tempo Setup | Capacidade |
|-------|-------|-------------|------------|
| **Local (Docker)** | R$ 0 | 5 min | 5-10 câmeras |
| **Oracle Cloud** | R$ 0 | 30 min | 10-20 câmeras |
| **Google Cloud** | R$ 0* | 20 min | 50+ câmeras |

*Usa créditos gratuitos de $300

---

**Comece testando localmente hoje mesmo! 🚀**
