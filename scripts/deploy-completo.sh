#!/bin/bash

# =============================================================================
# 🚀 TUDOFAZ HUB - DEPLOY COMPLETO DO ZERO
# =============================================================================
# Este script faz deploy completo baixando do git e configurando tudo
# =============================================================================

set -euo pipefail

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
REPO_URL="https://github.com/mrpink2025/tudo-faz-hub.git"
PROJECT_NAME="tudofaz-hub"
WORK_DIR="/opt/$PROJECT_NAME"
BUILDS_DIR="/opt/builds-finais"
DOMINIO="tudofaz.com"
ADMIN_EMAIL="admin@tudofaz.com"

echo -e "${BLUE}🚀 TUDOFAZ HUB - DEPLOY COMPLETO${NC}"
echo -e "${BLUE}================================${NC}"
echo -e "${YELLOW}⚠️  ATENÇÃO: Este script vai APAGAR TUDO e reconfigurar do zero!${NC}"
echo ""
read -p "Tem certeza que deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Operação cancelada."
    exit 1
fi

echo -e "\n${GREEN}🗑️  FASE 1: LIMPEZA COMPLETA${NC}"
echo -e "${GREEN}============================${NC}"
echo "🛑 Parando processos..."
pkill -f "vite" 2>/dev/null || true
pkill -f "gradle" 2>/dev/null || true
pkill -f "java" 2>/dev/null || true

echo "🗂️  Removendo diretórios antigos..."
rm -rf $WORK_DIR 2>/dev/null || true
rm -rf $BUILDS_DIR 2>/dev/null || true
rm -rf ~/.gradle 2>/dev/null || true
rm -rf ~/.android 2>/dev/null || true
rm -rf /var/www/* 2>/dev/null || true
rm -rf /etc/nginx/sites-enabled/* 2>/dev/null || true
rm -rf /opt/builds-* 2>/dev/null || true

echo "🛑 Parando serviços web..."
systemctl stop nginx 2>/dev/null || true
systemctl stop apache2 2>/dev/null || true

echo "🧹 Limpando cache..."
apt-get clean 2>/dev/null || true
npm cache clean --force 2>/dev/null || true

echo -e "✅ Limpeza concluída!\n"

echo -e "${GREEN}🔧 FASE 2: CONFIGURAÇÃO DO SISTEMA${NC}"
echo -e "${GREEN}=================================${NC}"
echo "📦 Atualizando sistema..."
apt-get update -y

echo "🛠️ Instalando dependências base..."
apt-get install -y \
    curl \
    wget \
    unzip \
    git \
    build-essential \
    software-properties-common \
    ca-certificates \
    gnupg \
    lsb-release

echo "📱 Instalando Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

echo "☕ Configurando Java 21..."
apt-get install -y openjdk-21-jdk
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
echo 'export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64' >> /etc/environment
echo 'export PATH=$JAVA_HOME/bin:$PATH' >> /etc/environment
update-alternatives --install /usr/bin/java java /usr/lib/jvm/java-21-openjdk-amd64/bin/java 1
update-alternatives --install /usr/bin/javac javac /usr/lib/jvm/java-21-openjdk-amd64/bin/javac 1

echo "🤖 Configurando Android SDK..."
ANDROID_HOME=/opt/android-sdk
export ANDROID_HOME
echo "export ANDROID_HOME=$ANDROID_HOME" >> /etc/environment
echo "export PATH=\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$PATH" >> /etc/environment

# Remover completamente qualquer instalação anterior do Android SDK
rm -rf $ANDROID_HOME 2>/dev/null || true

# Criar diretório limpo e baixar Android SDK
mkdir -p $ANDROID_HOME/cmdline-tools
cd $ANDROID_HOME/cmdline-tools
wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
unzip -q commandlinetools-linux-11076708_latest.zip
mv cmdline-tools latest
rm commandlinetools-linux-11076708_latest.zip

# Aceitar licenças automaticamente
export PATH=$ANDROID_HOME/cmdline-tools/latest/bin:$PATH
echo "🤖 Aceitando licenças Android automaticamente..."
printf 'y\ny\ny\ny\ny\ny\ny\ny\ny\ny\n' | sdkmanager --licenses --sdk_root=$ANDROID_HOME
sdkmanager --update --sdk_root=$ANDROID_HOME

# Instalar componentes Android
sdkmanager "platform-tools" "platforms;android-34" "platforms;android-35" "build-tools;34.0.0" "build-tools;35.0.0"

echo -e "✅ Sistema configurado!\n"

echo -e "${GREEN}📁 FASE 3: BAIXANDO PROJETO DO GIT${NC}"
echo -e "${GREEN}=================================${NC}"
cd /opt
echo "📥 Clonando repositório..."
git clone $REPO_URL $PROJECT_NAME
cd $WORK_DIR

echo -e "✅ Projeto baixado!\n"

echo -e "${GREEN}🌐 FASE 4: BUILD DA APLICAÇÃO WEB${NC}"
echo -e "${GREEN}=================================${NC}"
echo "📦 Instalando dependências npm..."
npm install

echo "🔨 Fazendo build da aplicação..."
npm run build

echo -e "✅ Build web concluído!\n"

echo -e "${GREEN}🌐 FASE 5: CONFIGURAÇÃO WEB SERVIDOR${NC}"
echo -e "${GREEN}====================================${NC}"
echo "🔧 Instalando e configurando Nginx..."
apt-get install -y nginx certbot python3-certbot-nginx

echo "📝 Configurando site Nginx..."
cat > /etc/nginx/sites-available/tudofaz-hub << 'EOF'
server {
    listen 80;
    server_name _;
    root /opt/tudofaz-hub/dist;
    index index.html;

    # Configurações para SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressão gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

echo "🔗 Ativando site Nginx..."
ln -sf /etc/nginx/sites-available/tudofaz-hub /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "🔄 Testando configuração Nginx..."
nginx -t

echo "🚀 Iniciando Nginx..."
systemctl enable nginx
systemctl restart nginx

echo "🔐 Configurando certificados SSL..."
echo "ℹ️  Para configurar SSL com domínio próprio, execute após o build:"
echo "   sudo certbot --nginx -d seudominio.com"
echo "   Isso configurará automaticamente HTTPS com certificado gratuito"

echo "🔒 Configurando firewall básico..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80
ufw allow 443
ufw --force enable

echo "🌐 Aplicação web disponível em:"
echo "   http://$(hostname -I | awk '{print $1}')"
echo "   http://localhost (se local)"

echo -e "✅ Servidor web configurado!\n"

echo -e "${GREEN}📱 FASE 6: CONFIGURAÇÃO CAPACITOR${NC}"
echo -e "${GREEN}=================================${NC}"
echo "⚙️ Instalando Capacitor e assets..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/assets

echo "🖼️ Preparando ícones para Android..."
mkdir -p resources
cp public/icon-1024.png resources/icon.png

echo "🔄 Sincronizando Capacitor..."
npx cap sync

echo "📱 Removendo plataforma Android existente..."
rm -rf android 2>/dev/null || true

echo "📱 Adicionando plataforma Android..."
npx cap add android

echo "🖼️ Gerando ícones Android automaticamente..."
npx @capacitor/assets generate --assetPath resources --android

echo "🔄 Sincronizando novamente após adicionar Android..."
npx cap sync

echo -e "✅ Capacitor configurado!\n"

echo -e "${GREEN}🤖 FASE 7: CONFIGURAÇÃO ANDROID${NC}"
echo -e "${GREEN}===============================${NC}"
echo "📁 Criando estrutura de diretórios..."
mkdir -p android/app/src/main/res/{drawable,drawable-hdpi,drawable-mdpi,drawable-xhdpi,drawable-xxhdpi,drawable-xxxhdpi}
mkdir -p android/app/src/main/res/values

echo "🖼️ Configurando ícones para Android..."

echo "📱 Copiando ícones do PWA se existirem..."
# Tentar copiar ícones do projeto para Android
if [ -f "public/icon-192.png" ]; then
    echo "✅ Encontrado icon-192.png, copiando para Android..."
    cp public/icon-192.png android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
fi

if [ -f "public/icon-512.png" ]; then
    echo "✅ Encontrado icon-512.png, copiando para Android..."
    cp public/icon-512.png android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
fi

if [ -f "public/icon-1024.png" ]; then
    echo "✅ Encontrado icon-1024.png, usando como base..."
    # Usar imagemagick para redimensionar se disponível
    if command -v convert &> /dev/null; then
        echo "🔄 Redimensionando ícones com ImageMagick..."
        convert public/icon-1024.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
        convert public/icon-1024.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
        convert public/icon-1024.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
        convert public/icon-1024.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
        convert public/icon-1024.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    else
        echo "⚠️ ImageMagick não encontrado, instalando..."
        apt-get install -y imagemagick
        convert public/icon-1024.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
        convert public/icon-1024.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
        convert public/icon-1024.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
        convert public/icon-1024.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
        convert public/icon-1024.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
    fi
fi

echo "🧹 Removendo ícones XML conflitantes..."
# Limpar completamente todos os ícones XML existentes que podem conflitar
rm -f android/app/src/main/res/drawable/ic_launcher*.xml 2>/dev/null || true

echo "📁 Criando estrutura de diretórios limpa..."
# Criar diretórios mipmap se não existirem
mkdir -p android/app/src/main/res/mipmap-{hdpi,mdpi,xhdpi,xxhdpi,xxxhdpi,anydpi-v26}
mkdir -p android/app/src/main/res/drawable

echo "🎨 Criando ícone vetorial robusto..."
# Criar ícone vetorial simples que sempre compila
cat > android/app/src/main/res/drawable/ic_launcher_foreground.xml << 'EOF'
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="108dp"
    android:height="108dp"
    android:viewportWidth="108"
    android:viewportHeight="108">
  <group android:scaleX="0.4"
      android:scaleY="0.4"
      android:translateX="32.4"
      android:translateY="32.4">
    <!-- Círculo de fundo -->
    <path android:fillColor="@color/colorAccent"
          android:pathData="M54,54m-30,0a30,30 0,1 1,60 0a30,30 0,1 1,-60 0"/>
    <!-- Ícone central - TudoFaz -->
    <path android:fillColor="#FFFFFF"
          android:pathData="M39,34h30v4h-30z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M48,39h12v30h-12z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M44,44h20v4h-20z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M44,54h20v4h-20z"/>
  </group>
</vector>
EOF

echo "🔧 Configurando ícone adaptativo para Android 8+..."
cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

cat > android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
EOF

echo "🎯 Criando ícones XML para Android antigo..."
cat > android/app/src/main/res/drawable/ic_launcher_legacy.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp"
    android:height="48dp"
    android:viewportWidth="48"
    android:viewportHeight="48">
    <!-- Background circle -->
    <path android:fillColor="@color/colorAccent"
          android:pathData="M24,24m-20,0a20,20 0,1 1,40 0a20,20 0,1 1,-40 0"/>
    <!-- TudoFaz icon -->
    <path android:fillColor="#FFFFFF"
          android:pathData="M14,12h20v2h-20z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M19,16h10v16h-10z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M16,20h16v2h-16z"/>
    <path android:fillColor="#FFFFFF"
          android:pathData="M16,26h16v2h-16z"/>
</vector>
EOF

echo "⚙️ Configurando strings.xml..."
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">TudoFaz Hub</string>
    <string name="title_activity_main">TudoFaz Hub</string>
    <string name="package_name">com.tudofaz.hub</string>
    <string name="custom_url_scheme">com.tudofaz.hub</string>
</resources>
EOF

echo "🎨 Configurando styles.xml..."
cat > android/app/src/main/res/values/styles.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>
    
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:windowBackground">@drawable/splash</item>
        <item name="android:statusBarColor">@color/colorPrimaryDark</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="AppTheme">
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
        <item name="android:windowFullscreen">false</item>
        <item name="android:windowContentOverlay">@null</item>
        <item name="android:statusBarColor">@color/colorPrimaryDark</item>
        <item name="android:windowLightStatusBar">false</item>
    </style>
</resources>
EOF

echo "🧹 Limpando recursos duplicados..."
# Remove arquivos que podem causar conflito de forma mais agressiva
rm -f android/app/src/main/res/drawable/splash.png 2>/dev/null || true
rm -f android/app/src/main/res/values/ic_launcher_background.xml 2>/dev/null || true
rm -f android/app/src/main/res/drawable-*/*.png 2>/dev/null || true
rm -f android/app/src/main/res/mipmap-*/ic_launcher.png 2>/dev/null || true

# Limpar qualquer arquivo de configuração que pode conflitar
find android/app/src/main/res -name "*.xml~" -delete 2>/dev/null || true
find android/app/src/main/res -name "*.png~" -delete 2>/dev/null || true

echo "🔧 Configurando AndroidManifest.xml com permissões necessárias..."
# Configurar AndroidManifest.xml completo com permissões
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Permissões necessárias para PWA e funcionalidades -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" 
                     android:maxSdkVersion="28" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    
    <!-- Push Notifications -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="com.google.android.c2dm.permission.RECEIVE" />
    
    <!-- PWA Features -->
    <uses-permission android:name="android.permission.INSTALL_SHORTCUT" />
    <uses-permission android:name="com.android.launcher.permission.INSTALL_SHORTCUT" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:label="@string/app_name"
        android:theme="@style/AppTheme.NoActionBarLaunch"
        android:usesCleartextTraffic="true"
        android:requestLegacyExternalStorage="true"
        android:hardwareAccelerated="true"
        tools:replace="android:allowBackup">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:screenOrientation="portrait"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode">

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- PWA Intent Filters -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" 
                      android:host="tudofaz.com" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="http" 
                      android:host="tudofaz.com" />
            </intent-filter>

            <!-- Custom URL Scheme -->
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="@string/custom_url_scheme" />
            </intent-filter>

        </activity>

        <!-- Provider para arquivos -->
        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

        <!-- Service para PWA -->
        <service
            android:name="com.getcapacitor.plugin.WebViewService"
            android:exported="false" />

        <!-- Firebase Messaging Service (se usar push notifications) -->
        <service
            android:name=".NotificationService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

    </application>

    <!-- Features necessárias -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />
    <uses-feature android:name="android.hardware.wifi" android:required="false" />

</manifest>
EOF

echo "📁 Criando arquivo de configuração file_paths.xml..."
mkdir -p android/app/src/main/res/xml
cat > android/app/src/main/res/xml/file_paths.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="files" path="." />
    <external-cache-path name="cache" path="." />
    <cache-path name="cache" path="." />
    <files-path name="files" path="." />
    <external-path name="external_files" path="." />
</paths>
EOF

echo "📄 Configurando network_security_config.xml para HTTPS..."
cat > android/app/src/main/res/xml/network_security_config.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">192.168.1.1</domain>
        <domain includeSubdomains="true">tudofaz.com</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system"/>
        </trust-anchors>
    </base-config>
</network-security-config>
EOF

echo "🌈 Configurando colors.xml com as cores do TudoFaz..."
cat > android/app/src/main/res/values/colors.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#1e40af</color>
    <color name="colorPrimaryDark">#1e3a8a</color>
    <color name="colorAccent">#3b82f6</color>
    <color name="ic_launcher_background">#1e40af</color>
    <color name="splash_background">#1e40af</color>
</resources>
EOF

echo "💫 Configurando splash.xml..."
cat > android/app/src/main/res/drawable/splash.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item android:drawable="@color/colorPrimary"/>
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher"/>
    </item>
</layer-list>
EOF

echo -e "✅ Android configurado!\n"

echo -e "${GREEN}🔧 FASE 8: CONFIGURAÇÃO GRADLE${NC}"
echo -e "${GREEN}==============================${NC}"
echo "📁 Criando estrutura do Gradle..."
mkdir -p android/gradle/wrapper

echo "⚙️ Configurando gradle-wrapper.properties..."
cat > android/gradle/wrapper/gradle-wrapper.properties << 'EOF'
distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\://services.gradle.org/distributions/gradle-8.11.1-bin.zip
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
EOF

echo "🔧 Atualizando build.gradle para Java 21..."
if [ -f "android/app/build.gradle" ]; then
    sed -i 's/compileSdk .*/compileSdk 35/' android/app/build.gradle
    sed -i 's/targetSdk .*/targetSdk 35/' android/app/build.gradle
    sed -i 's/sourceCompatibility .*/sourceCompatibility JavaVersion.VERSION_21/' android/app/build.gradle
    sed -i 's/targetCompatibility .*/targetCompatibility JavaVersion.VERSION_21/' android/app/build.gradle
    
    # Adicionar compatibilidade Java 21 se não existir
    grep -q "compileOptions" android/app/build.gradle || cat >> android/app/build.gradle << 'EOF'

android {
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}
EOF
fi

echo -e "✅ Gradle configurado!\n"

echo -e "${GREEN}📱 FASE 9: BUILD FINAL ANDROID${NC}"
echo -e "${GREEN}==============================${NC}"
echo "🔄 Sincronização final do Capacitor..."
npx cap sync android --inline

echo "🏗️ Fazendo build Android..."

# Garantir que os assets estão corretos
echo "📱 Verificando assets no Android..."
ls -la android/app/src/main/assets/public/ || echo "⚠️ Assets não encontrados, re-sincronizando..."
npx cap copy android

cd android

echo "🧹 Limpando build anterior..."
./gradlew clean

echo "📱 Construindo APK Debug..."
./gradlew assembleDebug

echo "📦 Construindo APK Release..."
./gradlew assembleRelease

echo "📦 Construindo AAB Release..."
./gradlew bundleRelease

cd ..

echo -e "✅ Build Android concluído!\n"

echo -e "${GREEN}📦 FASE 10: ORGANIZANDO BUILDS FINAIS${NC}"
echo -e "${GREEN}===================================${NC}"
echo "📁 Criando diretório de builds finais..."
mkdir -p $BUILDS_DIR

echo "📱 Copiando APK e AAB..."
find android/app/build/outputs -name "*.apk" -exec cp {} $BUILDS_DIR/ \;
find android/app/build/outputs -name "*.aab" -exec cp {} $BUILDS_DIR/ \;

echo "🌐 Copiando build web..."
cp -r dist $BUILDS_DIR/

echo "📄 Gerando documentação..."
cat > $BUILDS_DIR/README-COMPLETO.md << EOF
# 🚀 TudoFaz Hub - Build Completo

## 📱 Arquivos Gerados

### Android
- **APK Debug**: Para testes em desenvolvimento
- **APK Release**: Para distribuição direta
- **AAB Release**: Para publicação na Google Play Store

### Web
- **dist/**: Build da aplicação web pronta para deploy

## 🚀 Como Publicar

### Google Play Store
1. Faça upload do arquivo \`.aab\` no Google Play Console
2. Configure a listagem da loja
3. Defina preços e distribuição
4. Envie para revisão

### Distribuição Direta
- Use o arquivo \`.apk\` para distribuição direta
- Usuários precisam habilitar "Fontes desconhecidas"

### Deploy Web
- Faça upload da pasta \`dist/\` para seu servidor web
- Configure redirecionamentos para SPA se necessário

## 📋 Informações Técnicas

- **Data do Build**: $(date)
- **Node.js**: $(node --version)
- **npm**: $(npm --version)
- **Java**: $(java --version | head -n1)
- **Gradle**: Wrapper 8.11.1
- **Android SDK**: 34
- **Capacitor**: $(npx cap --version)

## 🔧 Próximos Passos

1. Teste os APKs em dispositivos reais
2. Configure certificados de produção se necessário
3. Configure CI/CD para automatizar builds futuros
4. Monitore crash reports e analytics

---
*Build gerado automaticamente pelo script deploy completo*
EOF

echo "📊 Gerando informações do build..."
cat > $BUILDS_DIR/BUILD-INFO.txt << EOF
TUDOFAZ HUB - INFORMAÇÕES DO BUILD
==================================

Data/Hora: $(date)
Servidor: $(hostname)
Usuário: $(whoami)

VERSÕES:
--------
Node.js: $(node --version)
npm: $(npm --version)
Java: $(java --version | head -n1)
Android SDK: 34
Capacitor: $(npx cap --version)

ARQUIVOS GERADOS:
-----------------
EOF

# Listar arquivos gerados com tamanhos
ls -lh $BUILDS_DIR/ >> $BUILDS_DIR/BUILD-INFO.txt

echo -e "✅ Builds organizados!\n"

echo -e "${GREEN}🌐 FASE 11: CONFIGURAÇÃO DOMÍNIO PERSONALIZADO${NC}"
echo -e "${GREEN}=============================================${NC}"
echo "🔧 Configurando domínio $DOMINIO..."

# Configurar Nginx para o domínio personalizado
cat > /etc/nginx/sites-available/$DOMINIO << EOF
server {
    listen 80;
    server_name $DOMINIO www.$DOMINIO;
    root /opt/tudofaz-hub/dist;
    index index.html;

    # Configurações para SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Compressão gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    # Cabeçalhos de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
EOF

echo "🔗 Ativando configuração do domínio..."
ln -sf /etc/nginx/sites-available/$DOMINIO /etc/nginx/sites-enabled/

echo "🔄 Testando configuração..."
nginx -t

echo "🚀 Recarregando Nginx..."
systemctl reload nginx

echo "🔐 Configurando SSL automático para o domínio..."
echo "ℹ️  Executando certbot para $DOMINIO..."

# Tentar configurar SSL automaticamente
certbot --nginx -d $DOMINIO -d www.$DOMINIO --non-interactive --agree-tos --email $ADMIN_EMAIL || echo "⚠️  SSL não configurado automaticamente - execute manualmente após apontar DNS"

echo ""
echo -e "${GREEN}📋 CONFIGURAÇÃO DE DNS NECESSÁRIA:${NC}"
echo -e "${YELLOW}===================================${NC}"
echo "Para completar a configuração, adicione estes registros DNS:"
echo ""
echo -e "${BLUE}Registro A para o domínio raiz:${NC}"
echo "  Tipo: A"
echo "  Nome: @"
echo "  Valor: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo -e "${BLUE}Registro A para www:${NC}"
echo "  Tipo: A"  
echo "  Nome: www"
echo "  Valor: $(curl -s ifconfig.me || hostname -I | awk '{print $1}')"
echo ""
echo -e "${BLUE}Ou se usar Lovable (recomendado):${NC}"
echo "  Tipo: A"
echo "  Nome: @ e www"
echo "  Valor: 185.158.133.1"
echo ""
echo -e "${GREEN}📝 INSTRUÇÕES PARA LOVABLE:${NC}"
echo "1. No projeto Lovable, vá em Settings → Domains"
echo "2. Clique 'Connect Domain'"
echo "3. Digite: $DOMINIO"
echo "4. Configure os registros DNS fornecidos pelo Lovable"
echo "5. Aguarde propagação (24-48h)"
echo ""
echo -e "${YELLOW}🌐 Após configurar DNS, o site estará disponível em:${NC}"
echo "   https://$DOMINIO"
echo "   https://www.$DOMINIO"

echo -e "✅ Configuração do domínio concluída!\n"

echo -e "${GREEN}🎉 DEPLOY COMPLETO FINALIZADO!${NC}"
echo -e "${GREEN}==============================${NC}"
echo ""
echo -e "${BLUE}📁 Arquivos finais em: ${YELLOW}$BUILDS_DIR${NC}"
echo ""
echo -e "${GREEN}📱 Arquivos Android:${NC}"
ls -la $BUILDS_DIR/*.apk $BUILDS_DIR/*.aab 2>/dev/null || echo "   Nenhum arquivo Android encontrado"
echo ""
echo -e "${GREEN}🌐 Build Web:${NC}"
echo "   $BUILDS_DIR/dist/"
echo ""
echo -e "${BLUE}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "   1. ${YELLOW}Teste os APKs em dispositivos${NC}"
echo -e "   2. ${YELLOW}Configure certificados de produção${NC}"
echo -e "   3. ${YELLOW}Publique na Google Play Store${NC}"
echo -e "   4. ${YELLOW}Deploy da aplicação web${NC}"
echo -e "   5. ${YELLOW}Configure DNS para $DOMINIO${NC}"
echo ""
echo -e "${GREEN}✅ TODAS AS FASES CONCLUÍDAS COM SUCESSO!${NC}"

# Exibir tamanhos dos arquivos
echo -e "\n${BLUE}📊 TAMANHOS DOS ARQUIVOS:${NC}"
du -h $BUILDS_DIR/* 2>/dev/null | head -10

echo -e "\n${GREEN}🚀 Deploy finalizado! Verifique os arquivos em $BUILDS_DIR${NC}"