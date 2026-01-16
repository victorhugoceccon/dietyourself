# 🔐 Instalar Certbot no CentOS/RHEL

## 🔍 Verificar Sistema

```bash
# Verificar versão do sistema
cat /etc/os-release

# Verificar qual gerenciador de pacotes está disponível
which yum
which dnf
```

## 📦 Instalar Certbot (CentOS/RHEL)

### **Opção 1: Usando yum (CentOS 7)**

```bash
# Instalar EPEL repository (necessário para Certbot)
sudo yum install epel-release -y

# Instalar Certbot e plugin do Nginx
sudo yum install certbot python3-certbot-nginx -y
```

### **Opção 2: Usando dnf (CentOS 8+/RHEL 8+)**

```bash
# Instalar Certbot e plugin do Nginx
sudo dnf install certbot python3-certbot-nginx -y
```

### **Opção 3: Usando snap (Alternativa)**

Se `yum` ou `dnf` não tiverem o pacote:

```bash
# Instalar snapd
sudo yum install snapd -y
# OU
sudo dnf install snapd -y

# Habilitar snapd
sudo systemctl enable --now snapd.socket
sudo ln -s /var/lib/snapd/snap /snap

# Instalar Certbot via snap
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot

# Instalar plugin do Nginx (se necessário)
sudo snap set certbot trust-plugin-with-root=on
sudo snap install certbot-dns-cloudflare
```

## ✅ Verificar Instalação

```bash
# Verificar se Certbot foi instalado
certbot --version

# Verificar se plugin do Nginx está disponível
certbot plugins
```

## 🚀 Usar Certbot

Depois de instalar, use normalmente:

```bash
# Obter certificado SSL
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```

## 🐛 Se Der Erro

### Erro: "No module named 'certbot'"

```bash
# Instalar via pip3
sudo yum install python3-pip -y
# OU
sudo dnf install python3-pip -y

# Instalar Certbot via pip
sudo pip3 install certbot certbot-nginx
```

### Erro: "certbot-nginx not found"

Use o Certbot standalone (sem plugin do Nginx):

```bash
# Obter certificado em modo standalone
sudo certbot certonly --standalone -d identikdigital.com.br -d www.identikdigital.com.br

# Depois configurar manualmente o Nginx (já temos a configuração pronta)
```

## 📝 Comandos Rápidos

```bash
# 1. Verificar sistema
cat /etc/os-release

# 2. Instalar (escolha uma opção acima)

# 3. Verificar instalação
certbot --version

# 4. Obter certificado
sudo certbot --nginx -d identikdigital.com.br -d www.identikdigital.com.br
```
