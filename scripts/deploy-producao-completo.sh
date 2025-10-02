#!/bin/bash

################################################################################
# TudoFaz Hub - Script Completo de Deploy e Build Assinado para Produção
# 
# Este script faz:
# - Configuração completa do servidor (Nginx, SSL, etc)
# - Setup do ambiente Android (SDK, Java, etc)
# - Geração ou configuração de Keystore
# - Build de APK/AAB assinados para Play Store
# - Organização de todos os arquivos gerados
#
# Uso: sudo ./scripts/deploy-producao-completo.sh
################################################################################

set -euo pipefail

################################################################################
# CORES PARA OUTPUT
################################################################################
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

################################################################################
# FUNÇÕES DE LOG
################################################################################
print_header() {
    echo -e "\n${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${CYAN}  $1${NC}"
    echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════${NC}\n"
}

print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

################################################################################
# FASE 1: VERIFICAÇÃO INICIAL E COLETA DE INFORMAÇÕES
################################################################################
print_header "FASE 1: VERIFICAÇÃO INICIAL"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then 
    print_error "Este script precisa ser executado como root (sudo)"
    exit 1
fi

print_success "Executando como root"

# Variáveis principais
REPO_URL="https://github.com/mrpink2025/tudo-faz-hub.git"
PROJECT_DIR="/opt/tudofaz-hub"
BUILDS_DIR="/opt/builds-producao-final"
BACKUP_DIR="/root/keystore-backup"
WEB_DIR="/var/www/tudofaz"

# Coleta de informações
print_header "COLETA DE INFORMAÇÕES"

read -p "Deseja fazer limpeza completa (apagar tudo e começar do zero)? [s/N]: " DO_CLEANUP
DO_CLEANUP=${DO_CLEANUP:-n}

read -p "Deseja configurar domínio e web server? [s/N]: " SETUP_WEB
SETUP_WEB=${SETUP_WEB:-n}

if [[ "$SETUP_WEB" =~ ^[Ss]$ ]]; then
    read -p "Digite o domínio (ex: tudofaz.com): " DOMAIN
    read -p "Digite o email para SSL: " SSL_EMAIL
fi

print_header "CONFIGURAÇÃO DO KEYSTORE"
echo "Você já possui um keystore ou deseja criar um novo?"
echo "1) Criar novo keystore"
echo "2) Usar keystore existente"
read -p "Escolha (1/2): " KEYSTORE_OPTION

if [ "$KEYSTORE_OPTION" == "1" ]; then
    print_step "Configurando novo keystore..."
    
    KEYSTORE_FILE="$PROJECT_DIR/android/app/keystore.jks"
    read -p "Nome/Alias da chave (ex: tudofaz-key): " KEY_ALIAS
    KEY_ALIAS=${KEY_ALIAS:-tudofaz-key}
    
    read -sp "Senha do keystore (mínimo 6 caracteres): " KEYSTORE_PASSWORD
    echo
    read -sp "Confirme a senha do keystore: " KEYSTORE_PASSWORD_CONFIRM
    echo
    
    if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
        print_error "Senhas não conferem!"
        exit 1
    fi
    
    read -sp "Senha da chave (pode ser igual à do keystore): " KEY_PASSWORD
    echo
    
    read -p "Seu nome completo: " CERT_NAME
    read -p "Unidade organizacional (ex: TI): " CERT_OU
    CERT_OU=${CERT_OU:-Development}
    read -p "Nome da organização (ex: TudoFaz): " CERT_ORG
    CERT_ORG=${CERT_ORG:-TudoFaz}
    read -p "Cidade: " CERT_CITY
    read -p "Estado (sigla, ex: SP): " CERT_STATE
    read -p "País (código, ex: BR): " CERT_COUNTRY
    CERT_COUNTRY=${CERT_COUNTRY:-BR}
    
    CREATE_NEW_KEYSTORE=true
    
elif [ "$KEYSTORE_OPTION" == "2" ]; then
    print_step "Configurando keystore existente..."
    
    read -p "Caminho completo do keystore existente: " EXISTING_KEYSTORE
    
    if [ ! -f "$EXISTING_KEYSTORE" ]; then
        print_error "Keystore não encontrado em: $EXISTING_KEYSTORE"
        exit 1
    fi
    
    read -p "Alias da chave: " KEY_ALIAS
    read -sp "Senha do keystore: " KEYSTORE_PASSWORD
    echo
    read -sp "Senha da chave: " KEY_PASSWORD
    echo
    
    KEYSTORE_FILE="$PROJECT_DIR/android/app/keystore.jks"
    CREATE_NEW_KEYSTORE=false
else
    print_error "Opção inválida!"
    exit 1
fi

################################################################################
# FASE 2: LIMPEZA COMPLETA (SE SOLICITADO)
################################################################################
if [[ "$DO_CLEANUP" =~ ^[Ss]$ ]]; then
    print_header "FASE 2: LIMPEZA COMPLETA"
    
    print_warning "ATENÇÃO: Isso irá apagar TODOS os dados anteriores!"
    read -p "Tem certeza? Digite 'SIM' para confirmar: " CONFIRM
    
    if [ "$CONFIRM" != "SIM" ]; then
        print_error "Limpeza cancelada"
        exit 1
    fi
    
    print_step "Parando processos..."
    pkill -f "node" || true
    pkill -f "nginx" || true
    
    print_step "Removendo diretórios..."
    rm -rf "$PROJECT_DIR" || true
    rm -rf "$BUILDS_DIR" || true
    rm -rf "$WEB_DIR" || true
    rm -rf ~/Android || true
    
    print_success "Limpeza completa realizada"
else
    print_warning "Pulando limpeza - arquivos existentes serão preservados quando possível"
fi

################################################################################
# FASE 3: CONFIGURAÇÃO DO SISTEMA
################################################################################
print_header "FASE 3: CONFIGURAÇÃO DO SISTEMA"

print_step "Atualizando sistema..."
apt-get update -qq

print_step "Instalando dependências base..."
apt-get install -y -qq curl wget git build-essential unzip imagemagick > /dev/null

print_step "Instalando Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null
    apt-get install -y -qq nodejs > /dev/null
fi
print_success "Node.js $(node -v) instalado"

print_step "Instalando Java 21..."
if ! command -v java &> /dev/null; then
    apt-get install -y -qq openjdk-21-jdk > /dev/null
fi

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export PATH=$PATH:$JAVA_HOME/bin
echo "export JAVA_HOME=$JAVA_HOME" >> /etc/environment
echo "export PATH=\$PATH:\$JAVA_HOME/bin" >> /etc/environment

print_success "Java $(java -version 2>&1 | head -n 1) instalado"

print_step "Configurando Android SDK..."
ANDROID_HOME="$HOME/Android/Sdk"
mkdir -p "$ANDROID_HOME"

if [ ! -f "$ANDROID_HOME/cmdline-tools/latest/bin/sdkmanager" ]; then
    print_step "Baixando Android SDK Command Line Tools..."
    cd /tmp
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip
    unzip -q commandlinetools-linux-11076708_latest.zip
    mkdir -p "$ANDROID_HOME/cmdline-tools/latest"
    mv cmdline-tools/* "$ANDROID_HOME/cmdline-tools/latest/" 2>/dev/null || true
    rm -rf cmdline-tools commandlinetools-linux-11076708_latest.zip
fi

export ANDROID_HOME
export ANDROID_SDK_ROOT=$ANDROID_HOME
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$ANDROID_HOME/build-tools/35.0.0

echo "export ANDROID_HOME=$ANDROID_HOME" >> /etc/environment
echo "export ANDROID_SDK_ROOT=$ANDROID_HOME" >> /etc/environment
echo "export PATH=\$PATH:\$ANDROID_HOME/cmdline-tools/latest/bin:\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/build-tools/35.0.0" >> /etc/environment

print_step "Instalando componentes Android SDK..."
yes | sdkmanager --licenses > /dev/null 2>&1 || true
sdkmanager --install "platform-tools" "platforms;android-35" "build-tools;35.0.0" > /dev/null 2>&1

print_success "Android SDK configurado"

################################################################################
# FASE 4: PREPARAÇÃO DO PROJETO
################################################################################
print_header "FASE 4: PREPARAÇÃO DO PROJETO"

if [ ! -d "$PROJECT_DIR" ]; then
    print_step "Clonando repositório..."
    git clone "$REPO_URL" "$PROJECT_DIR"
else
    print_step "Atualizando repositório..."
    cd "$PROJECT_DIR"
    git pull
fi

cd "$PROJECT_DIR"

print_step "Instalando dependências npm..."
npm install --silent

print_step "Fazendo build da aplicação web..."
npm run build

print_success "Build web concluído"

################################################################################
# FASE 5: CONFIGURAÇÃO WEB (SE SOLICITADO)
################################################################################
if [[ "$SETUP_WEB" =~ ^[Ss]$ ]]; then
    print_header "FASE 5: CONFIGURAÇÃO WEB"
    
    print_step "Instalando Nginx e Certbot..."
    apt-get install -y -qq nginx certbot python3-certbot-nginx ufw > /dev/null
    
    print_step "Configurando firewall..."
    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    print_step "Criando diretório web..."
    mkdir -p "$WEB_DIR"
    cp -r dist/* "$WEB_DIR/"
    
    print_step "Configurando Nginx..."
    cat > /etc/nginx/sites-available/tudofaz << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    root $WEB_DIR;
    index index.html;
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
EOF
    
    ln -sf /etc/nginx/sites-available/tudofaz /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    nginx -t
    systemctl restart nginx
    
    print_step "Configurando SSL com Certbot..."
    certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos -m "$SSL_EMAIL" || print_warning "Falha ao configurar SSL (configure DNS primeiro)"
    
    print_success "Configuração web concluída"
fi

################################################################################
# FASE 6: PREPARAÇÃO ANDROID
################################################################################
print_header "FASE 6: PREPARAÇÃO ANDROID"

cd "$PROJECT_DIR"

print_step "Instalando Capacitor..."
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/app @capacitor/haptics @capacitor/keyboard @capacitor/status-bar @capacitor/splash-screen @capacitor/push-notifications @capacitor/assets --silent

print_step "Removendo plataforma Android anterior (se existir)..."
if [ -d "android" ]; then
  rm -rf android/
  print_success "Plataforma Android anterior removida"
fi

print_step "Adicionando plataforma Android limpa..."
npx cap add android
if [ ! -d "android/app/src/main" ]; then
  print_error "Falha ao criar estrutura Android"
  exit 1
fi

print_step "Criando diretórios necessários..."
mkdir -p android/app/src/main/res/values/
mkdir -p android/app/src/main/res/drawable/
mkdir -p android/app/src/main/res/mipmap-hdpi/
mkdir -p android/app/src/main/res/mipmap-mdpi/
mkdir -p android/app/src/main/res/mipmap-xhdpi/
mkdir -p android/app/src/main/res/mipmap-xxhdpi/
mkdir -p android/app/src/main/res/mipmap-xxxhdpi/
mkdir -p android/app/src/main/res/xml/
print_success "Diretórios criados"

print_step "Criando strings.xml..."
cat > android/app/src/main/res/values/strings.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">TudoFaz Hub</string>
    <string name="title_activity_main">TudoFaz Hub</string>
    <string name="package_name">com.tudofaz.hub</string>
    <string name="custom_url_scheme">tudofaz</string>
</resources>
EOF

if [ -f "android/app/src/main/res/values/strings.xml" ]; then
  print_success "strings.xml criado"
else
  print_error "Falha ao criar strings.xml"
  exit 1
fi

print_step "Criando file_paths.xml para FileProvider..."
cat > android/app/src/main/res/xml/file_paths.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<paths xmlns:android="http://schemas.android.com/apk/res/android">
    <external-files-path name="files" path="." />
    <external-path name="external_files" path="." />
</paths>
EOF

print_step "Configurando AndroidManifest.xml..."
cat > android/app/src/main/AndroidManifest.xml << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- Permissões -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- Features opcionais -->
    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.location.gps" android:required="false" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:label="@string/app_name"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:exported="true"
            android:fitsSystemWindows="true"
            android:windowSoftInputMode="adjustResize">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="tudofaz" />
                <data android:scheme="https" android:host="tudofaz.com" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths" />
        </provider>

    </application>

</manifest>
EOF

if [ -f "android/app/src/main/AndroidManifest.xml" ]; then
  print_success "AndroidManifest.xml criado"
else
  print_error "Falha ao criar AndroidManifest.xml"
  exit 1
fi

print_step "Configurando ícone do PWA..."
# Verificar se existe ícone PWA no manifest
PWA_ICON=$(grep -o '"src": "[^"]*icon[^"]*"' public/manifest.json | head -1 | cut -d'"' -f4 || echo "")

if [ -n "$PWA_ICON" ]; then
  # Remove leading slash if present
  PWA_ICON_CLEAN="${PWA_ICON#/}"
  
  if [ -f "public/$PWA_ICON_CLEAN" ]; then
    print_step "Usando ícone do PWA: $PWA_ICON_CLEAN"
    
    # Só copiar se for um arquivo diferente
    if [ "public/$PWA_ICON_CLEAN" != "public/icon-1024.png" ]; then
      cp "public/$PWA_ICON_CLEAN" public/icon-1024.png
      print_success "Ícone do PWA configurado como ícone principal"
    else
      print_success "Ícone do PWA já está configurado corretamente"
    fi
  fi
elif [ ! -f "public/icon-1024.png" ]; then
  print_warning "Nenhum ícone encontrado - usando ícone padrão"
fi

print_step "Gerando ícones otimizados para Android..."
if [ -f "public/icon-1024.png" ]; then
  # Instalar imagemagick se não estiver instalado
  if ! command -v convert &> /dev/null; then
    print_step "Instalando ImageMagick..."
    apt-get install -y imagemagick > /dev/null 2>&1
  fi
  
  # Gerar ícones para cada densidade
  print_step "Criando ícones em múltiplas densidades..."
  
  # mdpi (48x48)
  convert public/icon-1024.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher.png
  convert public/icon-1024.png -resize 48x48 android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png
  
  # hdpi (72x72)
  convert public/icon-1024.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher.png
  convert public/icon-1024.png -resize 72x72 android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png
  
  # xhdpi (96x96)
  convert public/icon-1024.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher.png
  convert public/icon-1024.png -resize 96x96 android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png
  
  # xxhdpi (144x144)
  convert public/icon-1024.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png
  convert public/icon-1024.png -resize 144x144 android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png
  
  # xxxhdpi (192x192)
  convert public/icon-1024.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png
  convert public/icon-1024.png -resize 192x192 android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png
  
  print_success "Ícones gerados para todas as densidades (mdpi, hdpi, xhdpi, xxhdpi, xxxhdpi)"
else
  print_warning "Ícone original não encontrado em public/icon-1024.png"
fi

print_step "Sincronizando Capacitor..."
npx cap sync android

print_step "Gerando ícones otimizados (opcional)..."
npx @capacitor/assets generate --android 2>/dev/null || print_warning "Geração automática de ícones falhou (não crítico)"

print_success "Configuração Android concluída"

################################################################################
# FASE 7: GERAÇÃO/CONFIGURAÇÃO DO KEYSTORE
################################################################################
print_header "FASE 7: CONFIGURAÇÃO DO KEYSTORE"

mkdir -p "$(dirname "$KEYSTORE_FILE")"

if [ "$CREATE_NEW_KEYSTORE" = true ]; then
    print_step "Gerando novo keystore..."
    
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$KEY_ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$KEYSTORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=$CERT_NAME, OU=$CERT_OU, O=$CERT_ORG, L=$CERT_CITY, ST=$CERT_STATE, C=$CERT_COUNTRY"
    
    print_success "Keystore criado com sucesso!"
    
    # Fazer backup
    mkdir -p "$BACKUP_DIR"
    cp "$KEYSTORE_FILE" "$BACKUP_DIR/keystore.jks.backup.$(date +%Y%m%d_%H%M%S)"
    
    print_warning "═══════════════════════════════════════════════════════════"
    print_warning "  IMPORTANTE: BACKUP DO KEYSTORE"
    print_warning "═══════════════════════════════════════════════════════════"
    print_warning "Seu keystore foi salvo em:"
    print_warning "  $KEYSTORE_FILE"
    print_warning ""
    print_warning "Backup criado em:"
    print_warning "  $BACKUP_DIR"
    print_warning ""
    print_warning "GUARDE ESTAS INFORMAÇÕES COM SEGURANÇA:"
    print_warning "  Alias: $KEY_ALIAS"
    print_warning "  Senha do Keystore: [CONFIDENCIAL]"
    print_warning "  Senha da Chave: [CONFIDENCIAL]"
    print_warning ""
    print_warning "Se você perder este keystore, NÃO PODERÁ atualizar"
    print_warning "seu app na Play Store!"
    print_warning "═══════════════════════════════════════════════════════════"
    
else
    print_step "Copiando keystore existente..."
    cp "$EXISTING_KEYSTORE" "$KEYSTORE_FILE"
    
    # Fazer backup
    mkdir -p "$BACKUP_DIR"
    cp "$KEYSTORE_FILE" "$BACKUP_DIR/keystore.jks.backup.$(date +%Y%m%d_%H%M%S)"
    
    print_success "Keystore configurado"
fi

# Criar arquivo keystore.properties
cat > "$PROJECT_DIR/android/keystore.properties" << EOF
storePassword=$KEYSTORE_PASSWORD
keyPassword=$KEY_PASSWORD
keyAlias=$KEY_ALIAS
storeFile=keystore.jks
EOF

chmod 600 "$PROJECT_DIR/android/keystore.properties"

print_success "Arquivo keystore.properties criado"

################################################################################
# FASE 8: CONFIGURAÇÃO DO GRADLE PARA ASSINATURA
################################################################################
print_header "FASE 8: CONFIGURAÇÃO DO GRADLE"

print_step "Configurando build.gradle para assinatura..."

cat > "$PROJECT_DIR/android/app/build.gradle" << 'GRADLE_EOF'
apply plugin: 'com.android.application'

// Carregar propriedades do keystore
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    namespace "com.tudofaz.hub"
    compileSdkVersion 35
    
    defaultConfig {
        applicationId "com.tudofaz.hub"
        minSdkVersion 24
        targetSdkVersion 35
        versionCode 2
        versionName "1.0.1"
        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }
    
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }
    
    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            
            if (keystorePropertiesFile.exists()) {
                signingConfig signingConfigs.release
            }
        }
    }
    
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_21
        targetCompatibility JavaVersion.VERSION_21
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation fileTree(dir: 'libs', include: ['*.jar'])
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.core:core-splashscreen:1.2.0-alpha02'
    implementation project(':capacitor-android')
    testImplementation 'junit:junit:4.13.2'
    androidTestImplementation 'androidx.test.ext:junit:1.2.1'
    androidTestImplementation 'androidx.test.espresso:espresso-core:3.6.1'
}

apply from: 'capacitor.build.gradle'

try {
    def servicesJSON = file('google-services.json')
    if (servicesJSON.text) {
        apply plugin: 'com.google.gms.google-services'
    }
} catch(Exception e) {
    logger.info("google-services.json not found, google-services plugin not applied. Push Notifications won't work")
}
GRADLE_EOF

print_success "Gradle configurado para assinatura"

################################################################################
# FASE 9: BUILD ANDROID ASSINADO
################################################################################
print_header "FASE 9: BUILD ANDROID ASSINADO"

cd "$PROJECT_DIR/android"

print_step "Limpando builds anteriores..."
./gradlew clean > /dev/null 2>&1

print_step "Fazendo build do APK assinado (Release)..."
./gradlew assembleRelease

print_step "Fazendo build do AAB assinado (Release - Play Store)..."
./gradlew bundleRelease

print_success "Builds assinados concluídos!"

################################################################################
# FASE 10: ORGANIZAÇÃO FINAL
################################################################################
print_header "FASE 10: ORGANIZAÇÃO DOS ARQUIVOS"

mkdir -p "$BUILDS_DIR"

print_step "Copiando arquivos gerados..."

# APK
if [ -f "$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk" ]; then
    cp "$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk" "$BUILDS_DIR/"
    print_success "APK copiado"
else
    print_error "APK não encontrado!"
fi

# AAB
if [ -f "$PROJECT_DIR/android/app/build/outputs/bundle/release/app-release.aab" ]; then
    cp "$PROJECT_DIR/android/app/build/outputs/bundle/release/app-release.aab" "$BUILDS_DIR/"
    print_success "AAB copiado (pronto para Play Store)"
else
    print_error "AAB não encontrado!"
fi

# Build Web
cp -r "$PROJECT_DIR/dist" "$BUILDS_DIR/" 2>/dev/null || true

# Gerar checksums
cd "$BUILDS_DIR"
print_step "Gerando checksums..."
sha256sum *.apk *.aab 2>/dev/null > checksums.txt || true

# Gerar BUILD-INFO.txt
cat > "$BUILDS_DIR/BUILD-INFO.txt" << EOF
═══════════════════════════════════════════════════════════
  TudoFaz Hub - Informações do Build de Produção
═══════════════════════════════════════════════════════════

Data do Build: $(date '+%d/%m/%Y %H:%M:%S')

VERSÕES:
--------
Node.js: $(node -v)
Java: $(java -version 2>&1 | head -n 1)
Android SDK: 35

ARQUIVOS GERADOS:
-----------------
✓ app-release.apk  - APK assinado para distribuição direta
✓ app-release.aab  - AAB assinado para Google Play Store (USAR ESTE!)
✓ dist/            - Build da aplicação web

KEYSTORE:
---------
Alias: $KEY_ALIAS
Tipo: JKS
Validade: 10000 dias
Localização: $KEYSTORE_FILE
Backup: $BACKUP_DIR

CHECKSUMS SHA-256:
------------------
$(cat checksums.txt 2>/dev/null || echo "Checksums não disponíveis")

PRÓXIMOS PASSOS - PUBLICAÇÃO NA PLAY STORE:
--------------------------------------------
1. Acesse: https://play.google.com/console
2. Faça login com sua conta Google Developer
3. Crie um novo app (se ainda não criou)
4. Vá em "Versões" > "Produção"
5. Clique em "Criar nova versão"
6. Faça upload do arquivo: app-release.aab
7. Preencha as informações necessárias:
   - Título do app
   - Descrição curta
   - Descrição completa
   - Capturas de tela
   - Ícone
   - Gráfico de recursos
8. Configure classificação de conteúdo
9. Configure preços e distribuição
10. Envie para análise!

SEGURANÇA:
----------
⚠ NUNCA compartilhe seu keystore ou senhas
⚠ Faça backup do keystore em local seguro
⚠ Se perder o keystore, não poderá atualizar o app!

Backup do keystore disponível em:
$BACKUP_DIR

═══════════════════════════════════════════════════════════
EOF

# Gerar README-PUBLICACAO.md
cat > "$BUILDS_DIR/README-PUBLICACAO.md" << 'EOF'
# 🚀 Guia de Publicação na Google Play Store

## 📋 Pré-requisitos

- [ ] Conta Google Developer ($25 taxa única)
- [ ] Arquivo AAB assinado (app-release.aab)
- [ ] Ícone do app (512x512px)
- [ ] Gráfico de recursos (1024x500px)
- [ ] Capturas de tela (mínimo 2)
- [ ] Descrição do app
- [ ] Política de privacidade (URL)

## 🎯 Passo a Passo

### 1. Criar Conta Developer
1. Acesse: https://play.google.com/console
2. Pague a taxa de $25 (uma vez)
3. Complete seu perfil

### 2. Criar Novo App
1. No console, clique em "Criar app"
2. Preencha:
   - Nome do app: **TudoFaz Hub**
   - Idioma padrão: **Português (Brasil)**
   - App/Jogo: **App**
   - Gratuito/Pago: **Gratuito**

### 3. Configurar Ficha da Loja
1. Vá em "Ficha da loja" > "Detalhes do app"
2. Preencha:
   - **Título**: TudoFaz Hub (máx 50 caracteres)
   - **Descrição curta**: Marketplace local para compra e venda (máx 80 caracteres)
   - **Descrição completa**: Descrição detalhada (máx 4000 caracteres)

### 4. Upload de Recursos Gráficos
1. **Ícone** (512x512px, PNG, 32-bit)
2. **Gráfico de recursos** (1024x500px)
3. **Capturas de tela** (mínimo 2):
   - Telefone: 320-3840px de largura
   - Tablet 7": 320-3840px (opcional)
   - Tablet 10": 320-3840px (opcional)

### 5. Classificação de Conteúdo
1. Preencha o questionário
2. Selecione categoria apropriada
3. Aguarde classificação automática

### 6. Preços e Distribuição
1. Selecione países de distribuição
2. Configure como gratuito
3. Marque conformidade com políticas

### 7. Upload do AAB
1. Vá em "Versões" > "Produção"
2. Clique em "Criar nova versão"
3. Faça upload de: **app-release.aab**
4. Preencha notas da versão
5. Revise e publique

### 8. Enviar para Análise
1. Revise todas as seções
2. Clique em "Enviar para análise"
3. Aguarde aprovação (1-7 dias)

## ⚠️ Avisos Importantes

### Keystore
- **NUNCA perca seu keystore!**
- Se perder, não poderá atualizar o app
- Faça backup em 3 lugares diferentes
- Guarde as senhas em local seguro

### Atualizações Futuras
Para atualizar o app:
1. Incremente `versionCode` e `versionName` no build.gradle
2. Execute novamente o script de build
3. Faça upload do novo AAB na Play Console

### Políticas da Play Store
- ✅ Política de privacidade obrigatória
- ✅ App deve ter funcionalidade clara
- ✅ Sem conteúdo enganoso
- ✅ Seguir diretrizes de design Material

## 🔧 Troubleshooting

### "Upload failed: Version code already exists"
- Incremente o `versionCode` no `build.gradle`

### "App not signed"
- Verifique se o keystore foi configurado corretamente
- Execute novamente o script de build

### "Invalid AAB format"
- Certifique-se de fazer upload do AAB, não do APK
- Use o arquivo `app-release.aab`

## 📞 Suporte

- Documentação oficial: https://developer.android.com/distribute
- Políticas da Play Store: https://play.google.com/about/developer-content-policy/
- Suporte Google: https://support.google.com/googleplay/android-developer

## 🎉 Depois da Publicação

Após aprovação:
- Monitore reviews e avaliações
- Responda feedback dos usuários
- Planeje atualizações regulares
- Acompanhe estatísticas no console

---

**Boa sorte com sua publicação! 🚀**
EOF

print_success "Documentação de publicação criada"

################################################################################
# FASE 11: RELATÓRIO FINAL
################################################################################
print_header "RELATÓRIO FINAL"

echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}║  ✓ Deploy e Build de Produção Concluído com Sucesso!     ║${NC}"
echo -e "${GREEN}║                                                            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${BOLD}📁 LOCALIZAÇÃO DOS ARQUIVOS:${NC}"
echo -e "   Todos os arquivos estão em: ${CYAN}$BUILDS_DIR${NC}"
echo -e ""
echo -e "   ${GREEN}✓${NC} app-release.apk  - APK assinado"
echo -e "   ${GREEN}✓${NC} app-release.aab  - AAB para Play Store ${BOLD}(USE ESTE!)${NC}"
echo -e "   ${GREEN}✓${NC} dist/            - Build web"
echo -e "   ${GREEN}✓${NC} BUILD-INFO.txt   - Informações detalhadas"
echo -e "   ${GREEN}✓${NC} README-PUBLICACAO.md - Guia de publicação"

echo -e "\n${BOLD}🔐 KEYSTORE:${NC}"
echo -e "   Localização: ${CYAN}$KEYSTORE_FILE${NC}"
echo -e "   Backup: ${CYAN}$BACKUP_DIR${NC}"
echo -e "   Alias: ${CYAN}$KEY_ALIAS${NC}"
echo -e ""
echo -e "   ${YELLOW}⚠ IMPORTANTE: Faça backup do keystore em local seguro!${NC}"

if [[ "$SETUP_WEB" =~ ^[Ss]$ ]]; then
    echo -e "\n${BOLD}🌐 APLICAÇÃO WEB:${NC}"
    echo -e "   URL: ${CYAN}https://$DOMAIN${NC}"
    echo -e "   Diretório: ${CYAN}$WEB_DIR${NC}"
fi

echo -e "\n${BOLD}📱 TAMANHOS DOS ARQUIVOS:${NC}"
if [ -f "$BUILDS_DIR/app-release.apk" ]; then
    APK_SIZE=$(du -h "$BUILDS_DIR/app-release.apk" | cut -f1)
    echo -e "   APK: ${CYAN}$APK_SIZE${NC}"
fi
if [ -f "$BUILDS_DIR/app-release.aab" ]; then
    AAB_SIZE=$(du -h "$BUILDS_DIR/app-release.aab" | cut -f1)
    echo -e "   AAB: ${CYAN}$AAB_SIZE${NC}"
fi

echo -e "\n${BOLD}📋 PRÓXIMOS PASSOS:${NC}"
echo -e "   ${BLUE}1.${NC} Acesse: ${CYAN}https://play.google.com/console${NC}"
echo -e "   ${BLUE}2.${NC} Faça upload de: ${CYAN}$BUILDS_DIR/app-release.aab${NC}"
echo -e "   ${BLUE}3.${NC} Leia o guia completo: ${CYAN}$BUILDS_DIR/README-PUBLICACAO.md${NC}"
echo -e "   ${BLUE}4.${NC} Confira detalhes do build: ${CYAN}$BUILDS_DIR/BUILD-INFO.txt${NC}"

echo -e "\n${BOLD}🔑 LEMBRE-SE:${NC}"
echo -e "   ${RED}⚠${NC} NUNCA perca ou compartilhe seu keystore"
echo -e "   ${RED}⚠${NC} Faça backup das senhas do keystore"
echo -e "   ${RED}⚠${NC} Se perder o keystore, não poderá atualizar o app!"

echo -e "\n${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Build concluído em: $(date '+%d/%m/%Y %H:%M:%S')${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}\n"

print_success "Script concluído com sucesso!"
