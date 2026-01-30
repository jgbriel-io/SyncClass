# 📱 Instruções: Gerar Ícones PWA

**Nota:** Os ícones PWA precisam ser gerados manualmente. Siga este guia.

---

## 🎯 Opção 1: Gerar Online (Recomendado)

### 1. Acessar gerador de ícones
**URL:** https://realfavicongenerator.net/

### 2. Upload do logo
- Fazer upload de um logo/ícone de alta qualidade (PNG, 512x512px ou maior)
- Idealmente, usar um ícone quadrado com fundo transparente ou colorido

### 3. Configurar opções
- **iOS:** Selecionar "Picture/Background" e escolher cores do tema
- **Android:** Selecionar "Asset type: Picture"
- **Windows:** Configurar tile colors
- **Favicon:** Gerar favicon.ico

### 4. Gerar e baixar
- Clicar em "Generate your Favicons and HTML code"
- Baixar o pacote ZIP
- Extrair os arquivos para `public/icons/`

---

## 🎯 Opção 2: Gerar Localmente (CLI)

### 1. Instalar ferramenta
```bash
npm install -g pwa-asset-generator
```

### 2. Gerar ícones
```bash
# A partir de um logo fonte (logo.png)
pwa-asset-generator logo.png public/icons --background "#3b82f6" --padding "10%"
```

### 3. Tamanhos gerados automaticamente
- 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512

---

## 🎯 Opção 3: Manual (Photoshop/Figma)

### Tamanhos necessários:

| Tamanho | Uso |
|---------|-----|
| 72x72 | Android small |
| 96x96 | Android medium |
| 128x128 | Android large |
| 144x144 | Android extra large |
| 152x152 | iOS |
| 192x192 | Android baseline |
| 384x384 | Android high-res |
| 512x512 | Splash screen / High-res |

### Nomear arquivos:
```
public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png
├── icon-192x192.png
├── icon-384x384.png
└── icon-512x512.png
```

---

## ✅ Checklist

Após gerar os ícones:

- [ ] Criar pasta `public/icons/`
- [ ] Adicionar todos os 8 tamanhos de ícones
- [ ] Verificar que `manifest.json` aponta para eles
- [ ] Testar "Adicionar à tela inicial" no mobile
- [ ] Verificar ícone aparece corretamente
- [ ] Testar splash screen ao abrir app

---

## 🧪 Testar PWA

### Chrome DevTools
1. Abrir DevTools (F12)
2. Ir em "Application" tab
3. Seção "Manifest" — verificar ícones
4. Seção "Service Workers" — verificar registro
5. Clicar em "Lighthouse" — rodar audit PWA

### Mobile Real
1. Abrir no navegador mobile (Chrome/Safari)
2. Menu → "Adicionar à tela inicial" / "Add to Home Screen"
3. Verificar ícone personalizado aparece
4. Abrir app da tela inicial
5. Verificar experiência standalone (sem barra do navegador)

---

## 📋 Especificações Técnicas

### Formato
- **Tipo:** PNG com transparência ou fundo sólido
- **Cor de fundo:** `#3b82f6` (azul primário)
- **Padding:** 10-15% recomendado para evitar corte

### Purpose
- **any:** Ícone padrão
- **maskable:** Suporta máscaras adaptativas do Android

### Dicas
- Usar design simples e reconhecível
- Evitar textos pequenos (ilegíveis em 72x72)
- Testar em fundo claro e escuro
- Manter identidade visual consistente

---

**Status:** ⏳ Aguardando geração de ícones  
**Próximo passo:** Gerar ícones e copiar para `public/icons/`
