# 📱 TudoFaz Hub - Instruções de Build Mobile

## Pré-requisitos

### Para Android:
- **Android Studio** instalado
- **Java JDK 17** ou superior
- **Android SDK** configurado (API Level 33+)
- **Gradle** configurado

### Para iOS:
- **Mac** com macOS
- **Xcode 14+** instalado
- **iOS SDK 16+** 
- **Apple Developer Account** (para publicação)

## 🚀 Passos para Build

### 1. Preparar o projeto
```bash
# Clone o projeto do GitHub
git clone [seu-repositorio]
cd tudofaz-hub

# Instalar dependências
npm install

# Build do projeto web
npm run build
```

### 2. Sincronizar com Capacitor
```bash
# Sincronizar projeto
npx cap sync

# Adicionar plataformas (se necessário)
npx cap add android
npx cap add ios
```

### 3. Build Android

```bash
# Abrir no Android Studio
npx cap open android

# Ou build via linha de comando
npx cap run android --prod

# Para gerar APK de produção:
# No Android Studio: Build > Generate Signed Bundle/APK
# Escolha: Android App Bundle (AAB) para Play Store
```

### 4. Build iOS

```bash
# Abrir no Xcode
npx cap open ios

# Ou build via linha de comando
npx cap run ios --prod

# Para gerar IPA de produção:
# No Xcode: Product > Archive
# Depois: Window > Organizer > Distribute App
```

## 📦 Configurações de Produção

### Android (Play Store)
1. **Keystore**: Crie um keystore para assinar o APK
2. **App Bundle**: Use AAB ao invés de APK
3. **Permissões**: Verifique se todas as permissões estão justificadas
4. **Target API**: Android 13 (API 33) ou superior

### iOS (App Store)
1. **Provisioning Profile**: Configure perfil de distribuição
2. **Certificados**: Certificado de distribuição da Apple
3. **App Store Connect**: Configure app no portal
4. **TestFlight**: Use para testes antes da publicação

## ⚙️ Configurações Importantes

### Configuração do Capacitor
- **App ID**: `com.tudofaz.hub`
- **App Name**: `TudoFaz Hub`
- **Version**: `1.0.0`

### Recursos Nativos Incluídos
- ✅ Push Notifications
- ✅ Status Bar customizada
- ✅ Splash Screen
- ✅ Keyboard handling
- ✅ Haptic feedback
- ✅ App state management
- ✅ Camera access
- ✅ Location services
- ✅ File storage

## 🔧 Troubleshooting

### Problemas Comuns Android:
```bash
# Limpar cache
npx cap sync android --force

# Rebuild
cd android && ./gradlew clean && cd ..
npx cap run android
```

### Problemas Comuns iOS:
```bash
# Limpar derivedData
rm -rf ~/Library/Developer/Xcode/DerivedData

# Re-sync
npx cap sync ios
```

## 📋 Lista de Verificação Pré-Publicação

### Android Play Store:
- [ ] App Bundle (AAB) gerado e assinado
- [ ] Todas as permissões documentadas
- [ ] Screenshots em diferentes resoluções
- [ ] Ícone da app em alta resolução
- [ ] Política de privacidade
- [ ] Termos de uso
- [ ] Classificação de conteúdo

### iOS App Store:
- [ ] IPA gerado via Xcode
- [ ] App Store Connect configurado
- [ ] Screenshots para todos os dispositivos
- [ ] Ícone em todas as resoluções necessárias
- [ ] Política de privacidade
- [ ] Termos de uso
- [ ] TestFlight testado

## 🎯 Otimizações de Performance

1. **Lazy Loading**: Componentes carregados sob demanda
2. **Image Optimization**: Imagens otimizadas para mobile
3. **Bundle Splitting**: Código dividido por rotas
4. **Caching**: Service Worker para cache inteligente
5. **Network Optimization**: Requests otimizados

## 🔐 Segurança

- ✅ HTTPS obrigatório
- ✅ Sanitização de inputs
- ✅ Headers de segurança
- ✅ Rate limiting
- ✅ Validação de dados
- ✅ Autenticação JWT

## 📞 Suporte

Em caso de problemas, verifique:
1. Logs do dispositivo
2. Logs do Capacitor
3. Versões das dependências
4. Configuração de certificados

---

**Versão:** 1.0.0  
**Última atualização:** Janeiro 2025