#!/bin/bash

# 📱 TudoFaz Hub - Script de Build Mobile
# Este script automatiza o processo de build para Android e iOS

set -e

echo "🚀 Iniciando build do TudoFaz Hub Mobile..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para prints coloridos
print_step() {
    echo -e "${BLUE}📱 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar se está no diretório correto
if [ ! -f "package.json" ]; then
    print_error "Este script deve ser executado na raiz do projeto!"
    exit 1
fi

# Verificar dependências
print_step "Verificando dependências..."

if ! command -v npm &> /dev/null; then
    print_error "npm não encontrado. Instale o Node.js"
    exit 1
fi

if ! command -v npx &> /dev/null; then
    print_error "npx não encontrado. Atualize o Node.js"
    exit 1
fi

print_success "Dependências verificadas"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    print_step "Instalando dependências..."
    npm install
    print_success "Dependências instaladas"
fi

# Build do projeto web
print_step "Fazendo build do projeto web..."
npm run build
print_success "Build web concluído"

# Sincronizar com Capacitor
print_step "Sincronizando com Capacitor..."
npx cap sync
print_success "Sincronização concluída"

# Verificar se plataformas existem
if [ ! -d "android" ]; then
    print_step "Adicionando plataforma Android..."
    npx cap add android
    print_success "Android adicionado"
fi

if [ ! -d "ios" ]; then
    print_step "Adicionando plataforma iOS..."
    npx cap add ios
    print_success "iOS adicionado"
fi

# Menu de opções
echo ""
echo "🎯 Escolha uma opção:"
echo "1) Build Android (APK)"
echo "2) Build iOS (Xcode)"
echo "3) Executar Android em emulador"
echo "4) Executar iOS em simulador"
echo "5) Abrir Android Studio"
echo "6) Abrir Xcode"
echo "0) Sair"

read -p "Digite sua escolha (0-6): " choice

case $choice in
    1)
        print_step "Iniciando build Android..."
        npx cap run android --prod
        print_success "Build Android concluído"
        ;;
    2)
        print_step "Abrindo projeto iOS no Xcode..."
        npx cap open ios
        print_warning "Continue o build no Xcode (Product > Archive)"
        ;;
    3)
        print_step "Executando Android em emulador..."
        npx cap run android
        ;;
    4)
        print_step "Executando iOS em simulador..."
        npx cap run ios
        ;;
    5)
        print_step "Abrindo Android Studio..."
        npx cap open android
        ;;
    6)
        print_step "Abrindo Xcode..."
        npx cap open ios
        ;;
    0)
        print_success "Saindo..."
        exit 0
        ;;
    *)
        print_error "Opção inválida!"
        exit 1
        ;;
esac

echo ""
print_success "Processo concluído!"
echo ""
echo "📋 Próximos passos para publicação:"
echo "   Android: Gere um App Bundle (AAB) assinado"
echo "   iOS: Archive no Xcode e envie para App Store Connect"
echo ""
echo "📖 Leia o arquivo MOBILE_BUILD_INSTRUCTIONS.md para detalhes"