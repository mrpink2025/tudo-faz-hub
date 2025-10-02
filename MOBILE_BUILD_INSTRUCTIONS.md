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

## 🔐 IMPORTANTE: Assinatura de Apps

### Para Publicação na Play Store
Apps Android precisam ser **assinados digitalmente** para serem aceitos na Google Play Store. Existem duas formas de fazer isso:

#### Opção 1: Script Automático Completo (RECOMENDADO) ⭐
Use o script completo que configura tudo de uma vez:

```bash
# Este script faz TUDO:
# - Configuração do servidor
# - Setup Android
# - Geração/configuração do keystore
# - Build assinado (APK + AAB)
sudo ./scripts/deploy-producao-completo.sh
```

O script irá:
1. Guiar você na criação ou configuração do keystore
2. Fazer backup automático do keystore
3. Gerar APK e AAB assinados prontos para Play Store
4. Organizar todos os arquivos em `/opt/builds-producao-final/`
5. Criar documentação completa de publicação

#### Opção 2: Processo Manual
Se preferir fazer manualmente, siga os passos abaixo.

---

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

---

## 🔑 Geração e Configuração do Keystore (Processo Manual)

### O que é um Keystore?
Um keystore é um arquivo que contém a chave digital usada para assinar seu app. É como uma assinatura digital única do seu app.

### ⚠️ AVISOS CRÍTICOS DE SEGURANÇA

1. **NUNCA perca seu keystore!**
   - Se perder, não poderá publicar atualizações do app
   - Terá que criar um novo app do zero na Play Store
   
2. **Faça backup do keystore em múltiplos locais:**
   - Disco externo
   - Cloud storage privado (criptografado)
   - Gerenciador de senhas
   
3. **NUNCA commite o keystore no Git:**
   - Adicione ao .gitignore
   - Mantenha privado
   
4. **Guarde as senhas com segurança:**
   - Use um gerenciador de senhas
   - Anote em local físico seguro

### Passo 1: Gerar o Keystore

```bash
# Criar diretório para o keystore
mkdir -p android/app

# Gerar novo keystore
keytool -genkey -v \
  -keystore android/app/keystore.jks \
  -alias tudofaz-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass SUA_SENHA_KEYSTORE \
  -keypass SUA_SENHA_CHAVE \
  -dname "CN=Seu Nome, OU=Development, O=TudoFaz, L=Sua Cidade, ST=Seu Estado, C=BR"
```

**Informações que você precisará fornecer:**
- **Store Password**: Senha do keystore (mínimo 6 caracteres)
- **Key Password**: Senha da chave (pode ser igual à do keystore)
- **CN** (Common Name): Seu nome completo
- **OU** (Organizational Unit): Departamento (ex: Development)
- **O** (Organization): Nome da empresa (ex: TudoFaz)
- **L** (Locality): Cidade
- **ST** (State): Estado
- **C** (Country): País (código de 2 letras, ex: BR)

### Passo 2: Criar arquivo keystore.properties

```bash
# Criar arquivo com credenciais (NÃO COMMITAR!)
cat > android/keystore.properties << EOF
storePassword=SUA_SENHA_DO_KEYSTORE
keyPassword=SUA_SENHA_DA_CHAVE
keyAlias=tudofaz-key
storeFile=keystore.jks
EOF

# Proteger o arquivo
chmod 600 android/keystore.properties
```

### Passo 3: Atualizar .gitignore

Certifique-se de que estes arquivos NUNCA sejam commitados:

```bash
echo "android/app/keystore.jks" >> .gitignore
echo "android/keystore.properties" >> .gitignore
```

### Passo 4: Configurar build.gradle

O arquivo `android/app/build.gradle` já está configurado para usar o keystore automaticamente se o arquivo `keystore.properties` existir.

### Passo 5: Build Assinado

```bash
# Build APK assinado
cd android
./gradlew assembleRelease

# Build AAB assinado (para Play Store)
./gradlew bundleRelease
```

Os arquivos gerados estarão em:
- APK: `android/app/build/outputs/apk/release/app-release.apk`
- AAB: `android/app/build/outputs/bundle/release/app-release.aab`

---

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

### Antes de Publicar - Segurança do Keystore:
- [ ] Keystore criado e testado
- [ ] Backup do keystore feito em 3 locais diferentes
- [ ] Senhas anotadas em local seguro
- [ ] keystore.jks adicionado ao .gitignore
- [ ] keystore.properties adicionado ao .gitignore
- [ ] Build assinado testado localmente
- [ ] Informações do keystore documentadas:
  - Alias da chave
  - Datas de criação
  - Localização dos backups

### Android Play Store:
- [ ] App Bundle (AAB) gerado e **ASSINADO** ✅
- [ ] APK gerado e **ASSINADO** (opcional)
- [ ] Keystore backup em local seguro ⚠️ CRÍTICO
- [ ] Todas as permissões documentadas
- [ ] Screenshots em diferentes resoluções:
  - Telefone: 320-3840px (mínimo 2)
  - Tablet 7": 1024x600px (opcional)
  - Tablet 10": 2048x1536px (opcional)
- [ ] Ícone da app 512x512px (PNG, 32-bit)
- [ ] Gráfico de recursos 1024x500px
- [ ] Política de privacidade (URL pública)
- [ ] Termos de uso
- [ ] Classificação de conteúdo preenchida
- [ ] Conta Google Developer ativa ($25 taxa única)
- [ ] Descrição curta (máx 80 caracteres)
- [ ] Descrição completa (máx 4000 caracteres)

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

## 🚀 Publicação na Google Play Store

### Passo a Passo Completo:

1. **Criar Conta Google Developer**
   - Acesse: https://play.google.com/console
   - Pague taxa única de $25
   - Complete seu perfil de desenvolvedor

2. **Criar Novo App**
   - No console, clique em "Criar app"
   - Nome: TudoFaz Hub
   - Idioma: Português (Brasil)
   - Tipo: App (não jogo)
   - Gratuito/Pago: Gratuito

3. **Configurar Ficha da Loja**
   - **Título**: TudoFaz Hub
   - **Descrição curta**: Marketplace local para compra e venda
   - **Descrição completa**: [Escrever descrição detalhada]
   - **Ícone**: 512x512px PNG
   - **Gráfico de recursos**: 1024x500px
   - **Screenshots**: Mínimo 2 capturas

4. **Upload do AAB Assinado**
   - Ir para "Versões" > "Produção"
   - Clicar em "Criar nova versão"
   - Fazer upload do `app-release.aab`
   - Preencher notas da versão
   - Revisar e enviar

5. **Configurações Finais**
   - Classificação de conteúdo
   - Preços e distribuição (selecionar países)
   - Política de privacidade (URL obrigatória)
   - Aceitar termos e políticas

6. **Enviar para Análise**
   - Revisar todas as informações
   - Clicar em "Enviar para análise"
   - Aguardar aprovação (1-7 dias geralmente)

### Atualizações Futuras:

Para publicar uma atualização:

1. Incrementar versão no `android/app/build.gradle`:
```gradle
versionCode 2  // Era 1, agora 2
versionName "1.0.1"  // Era 1.0.0, agora 1.0.1
```

2. Fazer novo build assinado:
```bash
sudo ./scripts/deploy-producao-completo.sh
```

3. Fazer upload do novo AAB no Play Console
4. Preencher notas da versão
5. Enviar para análise

---

## 📞 Suporte

### Em caso de problemas com assinatura:
- Verificar se keystore.properties existe
- Validar credenciais do keystore
- Conferir se build.gradle está configurado corretamente
- Verificar logs do Gradle para erros específicos

### Em caso de problemas gerais:
1. Logs do dispositivo
2. Logs do Capacitor
3. Versões das dependências
4. Configuração de certificados

### Links Úteis:
- **Documentação Android**: https://developer.android.com/studio/publish/app-signing
- **Play Console**: https://play.google.com/console
- **Políticas Play Store**: https://play.google.com/about/developer-content-policy/
- **Capacitor Docs**: https://capacitorjs.com/docs/android

---

## ⚠️ Troubleshooting Comum

### "App not signed"
- Certifique-se de que o keystore foi configurado
- Verifique se keystore.properties está no lugar correto
- Execute o script completo novamente

### "Version code already exists"
- Incremente o versionCode no build.gradle
- Cada upload precisa de um versionCode maior que o anterior

### "Invalid AAB format"
- Use o AAB, não o APK
- Certifique-se de que o arquivo está assinado
- Verifique se o build foi concluído sem erros

### "Keystore password incorrect"
- Verifique as senhas no keystore.properties
- As senhas são case-sensitive
- Não deve ter espaços antes/depois das senhas

---

**Versão:** 2.0.0  
**Última atualização:** Janeiro 2025  
**Inclui:** Instruções completas de assinatura e publicação