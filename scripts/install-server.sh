#!/usr/bin/env bash
# TudoFaz Hub - install-server.sh
# Script de instalação automática para servidores Ubuntu/Debian
# 
# Uso:
#   sudo bash install-server.sh --domain seu-dominio.com --email admin@seu-dominio.com
# 
# Opções:
#   --domain <DOMINIO>           (opcional; se informado, configura Nginx + HTTPS)
#   --email  <EMAIL_ADMIN>       (opcional; usado pelo certbot)
#   --repo   <URL_GIT>           (opcional; default do projeto oficial)
#   --root   </caminho/app>      (opcional; raiz de publicação; default /var/www/tudofaz)
#   --no-ssl                     (opcional; pula emissão do HTTPS)
#   --branch <NOME_DA_BRANCH>    (opcional; default: main)
#   --user   <USUARIO>           (opcional; usuário do sistema; default: www-data)
#
# Este script instala e configura o TudoFaz Hub automaticamente,
# incluindo Node.js, Nginx, SSL e todas as dependências necessárias.

set -euo pipefail

# ===== Configurações Padrão =====
DOMINIO=""
ADMIN_EMAIL=""
REPO_DEFAULT="https://github.com/mrpink2025/tudo-faz-hub.git"
REPO_URL="$REPO_DEFAULT"
APP_ROOT="/var/www/tudofaz"
WEB_ROOT="$APP_ROOT/current"
BUILD_TMP="/tmp/tudofaz_build"
BRANCH="main"
ENABLE_SSL=true
SYSTEM_USER="www-data"

# ===== Cores para Output =====
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# ===== Funções de Log =====
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# ===== Parse Argumentos =====
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMINIO="${2:-}"; shift 2;;
    --email) ADMIN_EMAIL="${2:-}"; shift 2;;
    --repo) REPO_URL="${2:-}"; shift 2;;
    --root) APP_ROOT="${2:-}"; WEB_ROOT="$APP_ROOT/current"; shift 2;;
    --no-ssl) ENABLE_SSL=false; shift 1;;
    --branch) BRANCH="${2:-}"; shift 2;;
    --user) SYSTEM_USER="${2:-}"; shift 2;;
    --help|-h) 
      echo "TudoFaz Hub - Script de Instalação"
      echo "Uso: sudo bash install-server.sh [opções]"
      echo ""
      echo "Opções:"
      echo "  --domain <dominio>    Domínio para configurar (ex: tudofaz.com)"
      echo "  --email <email>       Email para certificados SSL"
      echo "  --repo <url>          URL do repositório Git"
      echo "  --root <caminho>      Diretório de instalação"
      echo "  --no-ssl              Desabilitar SSL/HTTPS"
      echo "  --branch <branch>     Branch do Git a usar"
      echo "  --user <usuario>      Usuário do sistema"
      echo "  --help, -h            Mostrar esta ajuda"
      exit 0;;
    *) 
      log_error "Argumento desconhecido: $1"
      echo "Use --help para ver as opções disponíveis."
      exit 1;;
  esac
done

# ===== Banner de Início =====
echo ""
echo "==============================================="
log_header "TudoFaz Hub - Instalação Automática"
echo "==============================================="
log_info "Repositório: $REPO_URL (branch: $BRANCH)"
log_info "Diretório:   $APP_ROOT"
log_info "Web Root:    $WEB_ROOT"
if [[ -n "$DOMINIO" ]]; then
  log_info "Domínio:     $DOMINIO"
  log_info "SSL:         $([[ "$ENABLE_SSL" == true ]] && echo 'ativado' || echo 'desativado')"
  [[ -n "$ADMIN_EMAIL" ]] || log_warning "Email não informado para SSL"
else
  log_info "Domínio:     (não configurado - apenas IP)"
fi
echo "==============================================="
echo ""

# ===== Verificações Iniciais =====
log_header "Verificando Sistema"

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
   log_error "Este script deve ser executado como root (use sudo)"
   exit 1
fi

# Verificar se é Ubuntu/Debian
if ! command -v apt-get &> /dev/null; then
    log_error "Sistema não suportado. Este script é para Ubuntu/Debian."
    exit 1
fi

log_success "Sistema verificado"

# ===== Instalação de Dependências =====
log_header "Instalando Dependências do Sistema"

log_info "Atualizando repositórios..."
apt update && apt upgrade -y

log_info "Instalando pacotes essenciais..."
apt install -y git curl jq ca-certificates software-properties-common unzip

# ===== Node.js 20 =====
log_header "Configurando Node.js"

if ! command -v node >/dev/null 2>&1; then
  log_info "Instalando Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt install -y nodejs
  log_success "Node.js instalado: $(node -v)"
else
  log_success "Node.js já instalado: $(node -v)"
fi

# Verificar versão mínima
NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [[ "$NODE_VERSION" -lt 18 ]]; then
    log_error "Node.js versão 18+ necessário. Atual: $(node -v)"
    exit 1
fi

# ===== Nginx e SSL (se domínio informado) =====
if [[ -n "$DOMINIO" ]]; then
  log_header "Configurando Nginx e SSL"
  
  log_info "Instalando Nginx, Certbot e UFW..."
  apt install -y nginx certbot python3-certbot-nginx ufw
  
  log_info "Configurando firewall..."
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
  ufw --force enable || true
  
  log_success "Nginx e dependências instalados"
fi

# ===== Preparar Diretórios =====
log_header "Preparando Estrutura de Diretórios"

log_info "Criando diretórios do projeto..."
mkdir -p "$WEB_ROOT"
mkdir -p "$APP_ROOT/logs"
mkdir -p "$APP_ROOT/backups"

# Criar usuário se não existir
if ! id "$SYSTEM_USER" &>/dev/null; then
    log_info "Criando usuário $SYSTEM_USER..."
    useradd -r -s /bin/false "$SYSTEM_USER"
fi

chown -R "$SYSTEM_USER":"$SYSTEM_USER" "$APP_ROOT"
log_success "Diretórios preparados"

# ===== Baixar e Preparar Código =====
log_header "Baixando TudoFaz Hub"

log_info "Removendo build temporário anterior..."
rm -rf "$BUILD_TMP"

log_info "Clonando repositório..."
git clone --branch "$BRANCH" --depth 1 "$REPO_URL" "$BUILD_TMP"
cd "$BUILD_TMP"

log_success "Código baixado com sucesso"

# ===== Preparar Dependências =====
log_header "Configurando Dependências"

log_info "Limpando locks de package managers..."
rm -f package-lock.json bun.lockb pnpm-lock.yaml yarn.lock || true

# Verificar se package.json existe
if [[ ! -f "package.json" ]]; then
    log_error "package.json não encontrado no repositório"
    exit 1
fi

log_info "Instalando dependências do projeto..."
npm install --legacy-peer-deps --production=false

log_success "Dependências instaladas"

# ===== Build do Projeto =====
log_header "Compilando TudoFaz Hub"

log_info "Executando build de produção..."
npm run build

# Verificar se build foi criado
if [[ -d "dist" ]]; then
    BUILD_DIR="dist"
elif [[ -d "build" ]]; then
    BUILD_DIR="build"
else
    log_error "Diretório de build não encontrado (dist/ ou build/)"
    exit 1
fi

log_success "Build compilado em $BUILD_DIR/"

# ===== Backup e Deploy =====
log_header "Fazendo Deploy da Aplicação"

# Backup da versão anterior
if [[ -d "$WEB_ROOT" ]] && [[ "$(ls -A $WEB_ROOT)" ]]; then
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    log_info "Fazendo backup da versão anterior..."
    cp -r "$WEB_ROOT" "$APP_ROOT/backups/$BACKUP_NAME"
    log_success "Backup salvo em: $APP_ROOT/backups/$BACKUP_NAME"
fi

log_info "Publicando nova versão..."
rm -rf "$WEB_ROOT"/*
cp -r "$BUILD_DIR"/* "$WEB_ROOT"/

# Configurar permissões
chown -R "$SYSTEM_USER":"$SYSTEM_USER" "$APP_ROOT"
find "$APP_ROOT" -type d -exec chmod 755 {} \;
find "$APP_ROOT" -type f -exec chmod 644 {} \;

log_success "Deploy concluído"

# ===== Configuração do Nginx =====
if [[ -n "$DOMINIO" ]]; then
  log_header "Configurando Servidor Web"
  
  NGINX_CONF="/etc/nginx/sites-available/$DOMINIO"
  
  log_info "Criando configuração do Nginx..."
  cat > "$NGINX_CONF" <<EOF
# TudoFaz Hub - Configuração Nginx
server {
    listen 80;
    server_name $DOMINIO www.$DOMINIO;

    root $WEB_ROOT;
    index index.html;

    # Configuração de MIME types
    include /etc/nginx/mime.types;
    types { 
        text/javascript js mjs; 
        text/css css; 
        application/wasm wasm; 
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Logs
    access_log $APP_ROOT/logs/access.log;
    error_log $APP_ROOT/logs/error.log;

    # Arquivos estáticos com cache otimizado
    location ~* \.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$ {
        try_files \$uri =404;
        expires 1y;
        add_header Cache-Control "public, immutable";
        add_header Vary "Accept-Encoding";
        
        # Compressão
        gzip on;
        gzip_vary on;
        gzip_types text/css application/javascript image/svg+xml;
    }

    # API e arquivos dinâmicos
    location /api/ {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # PWA e Service Worker
    location ~* \.(webmanifest|sw\.js)$ {
        try_files \$uri =404;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # SPA fallback para React Router
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Headers para HTML
        location ~* \.html$ {
            expires -1;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }
    }

    # Let's Encrypt
    location ^~ /.well-known/acme-challenge/ {
        allow all;
        default_type "text/plain";
    }

    # Bloquear arquivos sensíveis
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(log|sql|conf)$ {
        deny all;
    }
}
EOF

  # Ativar site
  ln -sf "$NGINX_CONF" "/etc/nginx/sites-enabled/$DOMINIO"
  
  # Remover site padrão se existir
  if [[ -f "/etc/nginx/sites-enabled/default" ]]; then
      rm -f "/etc/nginx/sites-enabled/default"
  fi
  
  # Testar configuração
  log_info "Testando configuração do Nginx..."
  if nginx -t; then
      systemctl restart nginx
      systemctl enable nginx
      log_success "Nginx configurado e rodando"
  else
      log_error "Erro na configuração do Nginx"
      exit 1
  fi
fi

# ===== Configuração SSL =====
if [[ -n "$DOMINIO" ]] && [[ "$ENABLE_SSL" == true ]]; then
  log_header "Configurando Certificado SSL"
  
  log_info "Obtendo certificado Let's Encrypt..."
  
  if [[ -n "$ADMIN_EMAIL" ]]; then
    certbot --nginx --redirect \
      -d "$DOMINIO" -d "www.$DOMINIO" \
      -m "$ADMIN_EMAIL" \
      --agree-tos \
      --non-interactive || log_warning "Erro ao obter SSL - verifique DNS"
  else
    certbot --nginx --redirect \
      -d "$DOMINIO" -d "www.$DOMINIO" \
      --register-unsafely-without-email \
      --agree-tos \
      --non-interactive || log_warning "Erro ao obter SSL - verifique DNS"
  fi
  
  # Ativar renovação automática
  systemctl enable certbot.timer
  systemctl start certbot.timer
  
  log_success "SSL configurado com renovação automática"
fi

# ===== Limpeza =====
log_header "Finalizando Instalação"

log_info "Limpando arquivos temporários..."
rm -rf "$BUILD_TMP"

# ===== Testes Finais =====
log_header "Executando Testes"

if [[ -n "$DOMINIO" ]]; then
  log_info "Testando conectividade HTTP..."
  if curl -sSf "http://$DOMINIO" > /dev/null; then
      log_success "HTTP: ✅ $DOMINIO"
  else
      log_warning "HTTP: ⚠️ $DOMINIO (pode estar redirecionando para HTTPS)"
  fi
  
  if [[ "$ENABLE_SSL" == true ]]; then
      log_info "Testando conectividade HTTPS..."
      if curl -sSf "https://$DOMINIO" > /dev/null; then
          log_success "HTTPS: ✅ $DOMINIO"
      else
          log_warning "HTTPS: ⚠️ $DOMINIO (certificado pode estar sendo emitido)"
      fi
  fi
else
  log_info "Testando servidor local..."
  if curl -sSf "http://localhost" > /dev/null; then
      log_success "Servidor local: ✅"
  else
      log_warning "Servidor local: ⚠️ (verificar configuração)"
  fi
fi

# ===== Relatório Final =====
echo ""
echo "=================================================="
log_header "🎉 TudoFaz Hub Instalado com Sucesso!"
echo "=================================================="
echo ""
log_success "📁 Arquivos publicados em: $WEB_ROOT"
log_success "📋 Logs disponíveis em: $APP_ROOT/logs/"
log_success "💾 Backups salvos em: $APP_ROOT/backups/"

if [[ -n "$DOMINIO" ]]; then
    log_success "🌐 Site disponível em: http://$DOMINIO"
    [[ "$ENABLE_SSL" == true ]] && log_success "🔒 HTTPS disponível em: https://$DOMINIO"
fi

echo ""
echo "📚 Comandos úteis:"
echo "  • Reiniciar Nginx: sudo systemctl restart nginx"
echo "  • Ver logs Nginx: sudo tail -f $APP_ROOT/logs/access.log"
echo "  • Testar SSL: sudo certbot certificates"
echo "  • Renovar SSL: sudo certbot renew --dry-run"
echo ""
echo "📖 Para atualizar o TudoFaz Hub, execute este script novamente."
echo "=================================================="

log_success "Instalação concluída! 🚀"