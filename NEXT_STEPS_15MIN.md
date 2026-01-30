# ⏱️ 15 Minutos para Completar 100%

**Atual:** 98% completo  
**Faltam:** 2 ações rápidas (15 minutos)

---

## ✅ Ação 1: Instalar vite-plugin-pwa (1 minuto)

```bash
npm install -D vite-plugin-pwa
```

**Por quê:**  
Service worker necessário para PWA funcionar (cache offline, instalação).

**Já configurado em:** `vite.config.ts` (linha 6-38)

---

## ✅ Ação 2: Gerar Ícones PWA (10 minutos)

### Opção A: Online (Recomendado)
1. Acessar: https://realfavicongenerator.net/
2. Upload de logo/ícone (PNG, 512x512+)
3. Baixar pacote ZIP
4. Extrair para `public/icons/`

### Opção B: CLI
```bash
npm install -g pwa-asset-generator
pwa-asset-generator logo.png public/icons --background "#3b82f6"
```

### Tamanhos necessários:
- 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 384x384, 512x512

**Já configurado em:** `public/manifest.json`

---

## ✅ Ação 3: Testar em Mobile (5 minutos)

```bash
# 1. Rodar dev
npm run dev

# 2. Encontrar IP local
ipconfig  # Windows
# ou
ifconfig  # Mac/Linux

# 3. Abrir no celular
http://192.168.x.x:8080

# 4. Login como aluno

# 5. Verificar:
# - Inputs não dão zoom ✅
# - Cards verticais ✅
# - Bottom nav fluido ✅
# - Chrome: Menu → "Adicionar à tela" ✅
```

---

## 🎯 Depois disso = 100% Completo!

```bash
# Push para produção
git push origin dev
```

---

## 📋 Checklist Visual

```
Soft Delete:
[x] Migration aplicada
[x] Hooks criados
[x] UI atualizada
[x] Documentado

Mobile Student P0:
[x] P0-4: Zoom bloqueado
[x] P0-3: PWA manifest
[x] P0-2: Acessibilidade
[x] P0-1: Cards mobile
[ ] Ícones PWA (15 min) ← FALTA
[ ] npm install vite-plugin-pwa (1 min) ← FALTA

Auditoria:
[x] 6 pilares auditados
[x] Plano de ação criado
[x] Quick wins documentados
```

---

**Status:** 98% → 100% em 15 minutos! ⏱️
