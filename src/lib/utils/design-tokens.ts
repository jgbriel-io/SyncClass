/**
 * Design Tokens - Sistema de Cores Semânticas
 * 
 * Este arquivo define os tokens de design para cores, seguindo o padrão shadcn/ui.
 * Use SEMPRE estes tokens ao invés de cores hardcoded do Tailwind.
 * 
 * ❌ NÃO USE: text-emerald-500, bg-blue-100, border-red-600
 * ✅ USE: text-success, bg-primary/10, border-destructive
 */

/**
 * Mapeamento de cores hardcoded → tokens semânticos
 * 
 * Este guia ajuda na migração de cores Tailwind para tokens shadcn/ui
 */
export const colorMigrationGuide = {
  // ===== VERDE / SUCCESS =====
  "text-emerald-500": "text-success",
  "text-emerald-600": "text-success",
  "text-emerald-700": "text-success",
  "text-emerald-800": "text-success",
  "text-green-500": "text-success",
  "text-green-600": "text-success",
  "text-green-700": "text-success",
  
  "bg-emerald-50": "bg-success/5",
  "bg-emerald-100": "bg-success/10",
  "bg-emerald-500": "bg-success",
  "bg-emerald-600": "bg-success",
  "bg-green-50": "bg-success/5",
  "bg-green-100": "bg-success/10",
  "bg-green-500": "bg-success",
  
  "border-emerald-500": "border-success",
  "border-emerald-600": "border-success",
  "border-green-500": "border-success",
  
  // ===== AMARELO / WARNING =====
  "text-yellow-500": "text-warning",
  "text-yellow-600": "text-warning",
  "text-yellow-700": "text-warning",
  "text-amber-500": "text-warning",
  "text-amber-600": "text-warning",
  
  "bg-yellow-50": "bg-warning/5",
  "bg-yellow-100": "bg-warning/10",
  "bg-yellow-500": "bg-warning",
  "bg-amber-50": "bg-warning/5",
  "bg-amber-100": "bg-warning/10",
  "bg-amber-500": "bg-warning",
  
  "border-yellow-500": "border-warning",
  "border-amber-500": "border-warning",
  
  // ===== VERMELHO / DESTRUCTIVE =====
  "text-red-500": "text-destructive",
  "text-red-600": "text-destructive",
  "text-red-700": "text-destructive",
  "text-red-800": "text-destructive",
  
  "bg-red-50": "bg-destructive/5",
  "bg-red-100": "bg-destructive/10",
  "bg-red-500": "bg-destructive",
  "bg-red-600": "bg-destructive",
  
  "border-red-500": "border-destructive",
  "border-red-600": "border-destructive",
  
  // ===== AZUL / PRIMARY =====
  "text-blue-500": "text-primary",
  "text-blue-600": "text-primary",
  "text-blue-700": "text-primary",
  
  "bg-blue-50": "bg-primary/5",
  "bg-blue-100": "bg-primary/10",
  "bg-blue-500": "bg-primary",
  "bg-blue-600": "bg-primary",
  
  "border-blue-500": "border-primary",
  "border-blue-600": "border-primary",
  
  // ===== ROXO / ACCENT =====
  "text-purple-500": "text-accent-foreground",
  "text-purple-600": "text-accent-foreground",
  
  "bg-purple-50": "bg-accent/10",
  "bg-purple-100": "bg-accent/20",
  "bg-purple-500": "bg-accent",
  "bg-violet-50": "bg-accent/10",
  "bg-violet-100": "bg-accent/20",
  
  // ===== CINZA / MUTED =====
  "text-gray-400": "text-muted-foreground",
  "text-gray-500": "text-muted-foreground",
  "text-gray-600": "text-muted-foreground",
  "text-slate-400": "text-muted-foreground",
  "text-slate-500": "text-muted-foreground",
  
  "bg-gray-50": "bg-muted/50",
  "bg-gray-100": "bg-muted",
  "bg-slate-50": "bg-muted/50",
  "bg-slate-100": "bg-muted",
  
  // ===== BACKGROUNDS =====
  "bg-white": "bg-background",
  "bg-zinc-50": "bg-background",
  
  // ===== BORDERS =====
  "border-gray-200": "border-border",
  "border-gray-300": "border-border",
  "border-slate-200": "border-border",
} as const;

/**
 * Tokens de design por categoria
 */
export const designTokens = {
  // ===== STATUS =====
  status: {
    success: {
      text: "text-success",
      bg: "bg-success",
      bgMuted: "bg-success/10",
      border: "border-success",
    },
    warning: {
      text: "text-warning",
      bg: "bg-warning",
      bgMuted: "bg-warning/10",
      border: "border-warning",
    },
    destructive: {
      text: "text-destructive",
      bg: "bg-destructive",
      bgMuted: "bg-destructive/10",
      border: "border-destructive",
    },
    info: {
      text: "text-primary",
      bg: "bg-primary",
      bgMuted: "bg-primary/10",
      border: "border-primary",
    },
  },
  
  // ===== SURFACES =====
  surface: {
    background: "bg-background",
    card: "bg-card",
    muted: "bg-muted",
    accent: "bg-accent",
  },
  
  // ===== TEXT =====
  text: {
    foreground: "text-foreground",
    muted: "text-muted-foreground",
    primary: "text-primary",
    cardForeground: "text-card-foreground",
    accentForeground: "text-accent-foreground",
  },
  
  // ===== BORDERS =====
  border: {
    default: "border-border",
    input: "border-input",
  },
} as const;

/**
 * Helper para criar classes de status
 * 
 * @example
 * // Ao invés de:
 * className="text-emerald-500 bg-emerald-100"
 * 
 * // Use:
 * className={statusClasses("success", "text", "bgMuted")}
 * // Retorna: "text-success bg-success/10"
 */
export function statusClasses(
  variant: "success" | "warning" | "destructive" | "info",
  ...types: ("text" | "bg" | "bgMuted" | "border")[]
): string {
  return types.map(type => designTokens.status[variant][type]).join(" ");
}

/**
 * Variantes de Badge (já implementadas no shadcn/ui)
 * Use estas ao invés de cores customizadas
 */
export const badgeVariants = {
  default: "default",        // Cinza neutro
  success: "success",        // Verde
  warning: "warning",        // Amarelo
  destructive: "destructive", // Vermelho
  outline: "outline",        // Borda apenas
} as const;

/**
 * Exemplo de uso correto:
 * 
 * ```typescript
 * // ❌ Errado
 * <Badge className="bg-emerald-100 text-emerald-800">Ativo</Badge>
 * 
 * // ✅ Correto
 * <Badge variant="success">Ativo</Badge>
 * 
 * // ❌ Errado
 * <div className="text-red-500 bg-red-50 border-red-200">Erro</div>
 * 
 * // ✅ Correto
 * <div className="text-destructive bg-destructive/10 border-destructive">Erro</div>
 * 
 * // ✅ Ou use o helper
 * <div className={statusClasses("destructive", "text", "bgMuted", "border")}>Erro</div>
 * ```
 */
