#!/usr/bin/env bash
# Bootstrap completo de VPS para hospedar app Vite/React estático
# - Instala Node.js 20, Nginx, UFW, Certbot
# - Clona/atualiza o repositório, builda e publica (rsync) para o Nginx
# - Configura HTTPS (Let's Encrypt) e cache básico
#
# Uso (como root ou com sudo):
#   sudo bash -c "DOMAIN=tudofaz.com EMAIL=admin@tudofaz.com CLEAN_FIRST=true ./scripts/bootstrap-and-deploy.sh"
# Variáveis aceitas (com defaults):
#   DOMAIN=tudofaz.com
#   WWW_DOMAIN=www.tudofaz.com
#   EMAIL=admin@tudofaz.com
#   REPO_URL=https://github.com/mrpink2025/tudo-faz-hub.git
#   BRANCH=main
#   APP_DIR=/opt/tudofaz-app
#   DEPLOY_PATH=/var/www/tudofaz
#   CLEAN_FIRST=true   # Se true, remove configs/diretórios/certificados anteriores antes de configurar
#
# Requisitos:
# - Ubuntu 20.04/22.04/24.04 LTS (testado no 24.04)
# - DNS A de tudofaz.com e www.tudofaz.com apontando para este servidor
# - Portas 80/443 liberadas

set -euo pipefail

# ============================
# Configs
# ============================
DOMAIN="${DOMAIN:-tudofaz.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.${DOMAIN}}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
REPO_URL="${REPO_URL:-https://github.com/mrpink2025/tudo-faz-hub.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/tudofaz-app}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/tudofaz}"
SITE_CONF="/etc/nginx/sites-available/${DOMAIN}"
SITE_LINK="/etc/nginx/sites-enabled/${DOMAIN}"
CLEAN_FIRST="${CLEAN_FIRST:-true}"

is_true() { case "${1:-}" in [Tt][Rr][Uu][Ee]|1|[Yy][Ee][Ss]) return 0;; *) return 1;; esac; }

if [ "${EUID}" -ne 0 ]; then
  echo "[ERRO] Execute como root (sudo)."; exit 1
fi

# ============================
# Verificação de versão do Ubuntu
# ============================
if command -v lsb_release >/dev/null 2>&1; then
  UBUNTU_VER_MAJOR="$(lsb_release -rs | cut -d'.' -f1)"
else
  UBUNTU_VER_MAJOR="20"
fi
if [ "${UBUNTU_VER_MAJOR}" -lt 18 ]; then
  echo "[ERRO] Ubuntu muito antigo. Use 20.04/22.04/24.04 LTS."; exit 1
fi

# ============================
# Limpeza prévia (CLEAN_FIRST)
# ============================
if is_true "${CLEAN_FIRST}"; then
  echo "[INFO] Limpando configuração anterior para ${DOMAIN}..."
  systemctl stop nginx || true
  rm -f "${SITE_LINK}" "${SITE_CONF}" || true
  rm -rf "${DEPLOY_PATH}" || true
  rm -rf "${APP_DIR}" || true
  # Remover certificados existentes (não falha se não houver)
  certbot delete --cert-name "${DOMAIN}" -n || true
  rm -rf "/etc/letsencrypt/live/${DOMAIN}" \
         "/etc/letsencrypt/archive/${DOMAIN}" \
         "/etc/letsencrypt/renewal/${DOMAIN}.conf" || true
fi

# ============================
# Pacotes base + Node 20
# ============================
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates gnupg curl git rsync nginx ufw certbot python3-certbot-nginx

if ! command -v node >/dev/null 2>&1 || ! node -v | grep -qE "v1[89]|v20|v21|v22"; then
  echo "[INFO] Instalando Node.js 20 (NodeSource)"
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

# ============================
# Firewall (UFW)
# ============================
if command -v ufw >/dev/null 2>&1; then
  ufw allow OpenSSH || true
  ufw allow 'Nginx Full' || true
  yes | ufw enable || true
fi

# ============================
# Nginx (config SPA com cache)
# ============================
mkdir -p "${DEPLOY_PATH}"

cat >"${SITE_CONF}" <<'NGINX'
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    root ${DEPLOY_PATH};
    index index.html;

    # Compressão
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss application/xhtml+xml image/svg+xml;
    gzip_min_length 1024;

    # Cache para assets
    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff2?)$ {
        expires 7d;
        access_log off;
        add_header Cache-Control "public, max-age=604800, immutable";
        try_files $uri =404;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Headers básicos de segurança
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection "1; mode=block";
}
NGINX

ln -sf "${SITE_CONF}" "${SITE_LINK}"
[ -f /etc/nginx/sites-enabled/default ] && rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl reload nginx || systemctl restart nginx

# ============================
# Clonar/atualizar repositório e build
# ============================
if [ ! -d "${APP_DIR}" ]; then
  echo "[INFO] Clonando repo em ${APP_DIR}"
  git clone --branch "${BRANCH}" "${REPO_URL}" "${APP_DIR}"
else
  echo "[INFO] Atualizando repo em ${APP_DIR}"
  git -C "${APP_DIR}" fetch --all --prune
  git -C "${APP_DIR}" checkout "${BRANCH}"
  git -C "${APP_DIR}" pull --ff-only
fi

# Build
cd "${APP_DIR}"
if [ -f package-lock.json ]; then
  npm ci
else
  npm install
fi
npm run build

# Publicar (rsync dist -> DEPLOY_PATH)
rsync -avz --delete "${APP_DIR}/dist/" "${DEPLOY_PATH}/"

# Ajustar permissões (www-data lê tudo)
chown -R root:root "${DEPLOY_PATH}"
find "${DEPLOY_PATH}" -type d -exec chmod 755 {} \;
find "${DEPLOY_PATH}" -type f -exec chmod 644 {} \;

# Reload Nginx
nginx -t && systemctl reload nginx || systemctl restart nginx

# ============================
# Certificado SSL (Let's Encrypt)
# ============================
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "[INFO] Certificados já existem para ${DOMAIN}."
else
  echo "[INFO] Emitindo certificados para ${DOMAIN} e ${WWW_DOMAIN}"
  if certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
    echo "[OK] SSL configurado e redirecionamento HTTPS ativo."
  else
    echo "[AVISO] Falha ao emitir certificados agora. Verifique DNS e tente novamente:"
    echo "        certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect"
  fi
fi

cat <<EOF

[✔] Bootstrap concluído!

- Domínios: ${DOMAIN}, ${WWW_DOMAIN}
- Repo: ${REPO_URL} (branch: ${BRANCH})
- App dir: ${APP_DIR}
- Deploy path: ${DEPLOY_PATH}
- Nginx conf: ${SITE_CONF}
- HTTPS: configurado (se DNS ok)

Próximos passos (opcional):
- Automatizar deploy contínuo via GitHub Actions (já há workflow no repo atual). Cadastre no GitHub:
  SSH_PRIVATE_KEY, VPS_HOST, VPS_USER, VPS_PATH, VPS_RELOAD_CMD="sudo systemctl reload nginx"
EOF
