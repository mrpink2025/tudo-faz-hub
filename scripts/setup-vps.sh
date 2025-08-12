#!/usr/bin/env bash
# Script de configuração automática da VPS para servir app Vite (SPA) com Nginx
# Uso recomendado (via SSH):
#   curl -fsSL https://raw.githubusercontent.com/<seu-repo>/main/scripts/setup-vps.sh | bash
# Ou, após clonar o repo na VPS:
#   chmod +x scripts/setup-vps.sh && sudo scripts/setup-vps.sh
#
# Variáveis (podem ser passadas via ambiente):
#   DOMAIN=tudofaz.com
#   WWW_DOMAIN=www.tudofaz.com
#   EMAIL=admin@tudofaz.com
#   DEPLOY_PATH=/var/www/tudofaz
#   DEPLOY_USER=<usuario-ssh-para-deploy>   # opcional; se setado, será usado no chown
#
# Requisitos:
# - Ubuntu 20.04/22.04/24.04 LTS (Ubuntu 14/16 NÃO suportado)
# - DNS A/AAAA de tudofaz.com e www.tudofaz.com apontando para o IP desta VPS
# - Porta 80 e 443 liberadas no Security Group/Firewall da AWS

set -euo pipefail

# ============================
# Configurações
# ============================
DOMAIN="${DOMAIN:-tudofaz.com}"
WWW_DOMAIN="${WWW_DOMAIN:-www.${DOMAIN}}"
EMAIL="${EMAIL:-admin@${DOMAIN}}"
DEPLOY_PATH="${DEPLOY_PATH:-/var/www/tudofaz}"
DEPLOY_USER="${DEPLOY_USER:-}"
SITE_CONF="/etc/nginx/sites-available/${DOMAIN}"
SITE_LINK="/etc/nginx/sites-enabled/${DOMAIN}"

# Detecta necessidade de sudo
if [ "${EUID}" -ne 0 ]; then
  SUDO="sudo"
else
  SUDO=""
fi

# ============================
# Verificações de SO
# ============================
if command -v lsb_release >/dev/null 2>&1; then
  UBUNTU_VER="$(lsb_release -rs | cut -d'.' -f1)"
else
  UBUNTU_VER="20" # assume razoavelmente moderno se lsb_release não existir
fi
if [ "${UBUNTU_VER}" -lt 18 ]; then
  echo "[ERRO] Ubuntu ${UBUNTU_VER} detectado. Use Ubuntu 20.04/22.04/24.04 LTS."
  exit 1
fi

# ============================
# Atualização e pacotes
# ============================
$SUDO apt-get update -y
$SUDO apt-get install -y nginx rsync ufw curl ca-certificates certbot python3-certbot-nginx

# ============================
# Firewall (UFW)
# ============================
if command -v ufw >/dev/null 2>&1; then
  $SUDO ufw allow OpenSSH || true
  $SUDO ufw allow 'Nginx Full' || true
  yes | $SUDO ufw enable || true
fi

# ============================
# Diretório de deploy
# ============================
$SUDO mkdir -p "${DEPLOY_PATH}"
if [ -n "${DEPLOY_USER}" ]; then
  if id -u "${DEPLOY_USER}" >/dev/null 2>&1; then
    $SUDO chown -R "${DEPLOY_USER}:${DEPLOY_USER}" "${DEPLOY_PATH}"
  else
    echo "[AVISO] DEPLOY_USER='${DEPLOY_USER}' não existe. Mantendo permissões padrão."
  fi
else
  # Se não definido, usa dono atual (root) mas ajusta permissões adequadas de leitura pelo Nginx
  $SUDO chown -R root:root "${DEPLOY_PATH}"
fi

# Cria placeholder se vazio
if [ -z "$(ls -A "${DEPLOY_PATH}" 2>/dev/null || true)" ]; then
  cat <<'HTML' | $SUDO tee "${DEPLOY_PATH}/index.html" >/dev/null
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>tudofaz.com — Site em configuração</title>
    <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu;display:grid;place-items:center;min-height:100vh;margin:0;background:#0e0f14;color:#e6e7ea} .card{padding:2rem;border:1px solid #2a2d37;border-radius:12px;background:#141824;max-width:680px;text-align:center} .muted{opacity:.7;font-size:.95rem}</style>
  </head>
  <body>
    <div class="card">
      <h1>tudofaz.com</h1>
      <p>Configuração inicial concluída. O próximo deploy via GitHub Actions substituirá este placeholder.</p>
      <p class="muted">Pasta de deploy: ${DEPLOY_PATH}</p>
    </div>
  </body>
</html>
HTML
fi

# ============================
# Nginx - configuração (SPA)
# ============================
NGINX_CONF_CONTENT="server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} ${WWW_DOMAIN};

    root ${DEPLOY_PATH};
    index index.html;

    # Cache básico para assets estáticos
    location ~* \.(?:css|js|jpg|jpeg|gif|png|svg|ico|webp|woff2?)$ {
        expires 7d;
        access_log off;
        add_header Cache-Control \"public, max-age=604800, immutable\";
        try_files \$uri =404;
    }

    # SPA fallback
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Segurança básica
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy no-referrer-when-downgrade;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-XSS-Protection \"1; mode=block\";
}
"

echo "${NGINX_CONF_CONTENT}" | $SUDO tee "${SITE_CONF}" >/dev/null

# Habilita site e desabilita default
$SUDO ln -sf "${SITE_CONF}" "${SITE_LINK}"
if [ -f /etc/nginx/sites-enabled/default ]; then
  $SUDO rm -f /etc/nginx/sites-enabled/default
fi

# Testa e recarrega Nginx
$SUDO nginx -t
$SUDO systemctl enable nginx
$SUDO systemctl reload nginx || $SUDO systemctl restart nginx

# ============================
# Certbot (Let's Encrypt)
# ============================
if [ -d "/etc/letsencrypt/live/${DOMAIN}" ]; then
  echo "[INFO] Certificados já existem para ${DOMAIN}. Pulando emissão."
else
  echo "[INFO] Solicitando certificados para ${DOMAIN} e ${WWW_DOMAIN}..."
  if $SUDO certbot --nginx -d "${DOMAIN}" -d "${WWW_DOMAIN}" --non-interactive --agree-tos -m "${EMAIL}" --redirect; then
    echo "[OK] Certificados emitidos e redirecionamento HTTPS configurado."
  else
    echo "[AVISO] Não foi possível emitir certificados agora. Verifique se o DNS aponta para este servidor e tente novamente:"
    echo "       sudo certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN} --non-interactive --agree-tos -m ${EMAIL} --redirect"
  fi
fi

# ============================
# Output final
# ============================
cat <<EOF

[✔] Configuração concluída!

Resumo:
- Domínios: ${DOMAIN}, ${WWW_DOMAIN}
- Deploy path: ${DEPLOY_PATH}
- Nginx conf: ${SITE_CONF}
- Certbot email: ${EMAIL}

Para integrar com o GitHub Actions já existente, cadastre os seguintes secrets no repositório:
- SSH_PRIVATE_KEY  -> chave privada que acessa esta VPS (adicionar a pública em ~/.ssh/authorized_keys)
- VPS_HOST         -> IP público ou ${DOMAIN}
- VPS_USER         -> usuário SSH com permissão de escrita em ${DEPLOY_PATH}${DEPLOY_USER:+ (ex.: ${DEPLOY_USER})}
- VPS_PATH         -> ${DEPLOY_PATH}
- VPS_RELOAD_CMD   -> sudo systemctl reload nginx

Após isso, cada push na branch main irá construir e publicar o conteúdo de dist/ para ${DEPLOY_PATH} automaticamente.
EOF
