/**
 * Design Tokens: Avatar Sizes
 *
 * Tamanhos padronizados para avatares circulares
 * Garante consistência visual em todo o projeto
 */

// ============================================================================
// AVATAR SIZES
// ============================================================================

/**
 * Tamanhos de avatar disponíveis
 *
 * Uso:
 * - SM: Avatares pequenos em listas compactas (32px)
 * - DEFAULT: Avatares em tabelas e cards (36px) - PADRÃO
 * - LG: Avatares em headers e perfis (40px)
 * - XL: Avatares em páginas de perfil (48px)
 */
export const AVATAR_SIZES = {
  SM: "h-8 w-8 text-xs", // 32px - Pequeno
  DEFAULT: "h-9 w-9 text-xs", // 36px - Padrão (usar em tabelas)
  LG: "h-10 w-10 text-sm", // 40px - Grande
  XL: "h-12 w-12 text-base", // 48px - Extra grande
} as const;

export type AvatarSize = keyof typeof AVATAR_SIZES;

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Retorna a classe de tamanho de avatar
 * @param size - Tamanho do avatar (SM, DEFAULT, LG, XL)
 */
export function avatarSize(size: AvatarSize = "DEFAULT"): string {
  return AVATAR_SIZES[size];
}

// ============================================================================
// VALORES EM PIXELS (Referência)
// ============================================================================

/**
 * Valores em pixels para referência
 * (Não usar diretamente, usar as constantes acima)
 */
export const AVATAR_SIZES_PX = {
  SM: 32, // h-8 w-8
  DEFAULT: 36, // h-9 w-9
  LG: 40, // h-10 w-10
  XL: 48, // h-12 w-12
} as const;

// ============================================================================
// EXEMPLOS DE USO
// ============================================================================

/**
 * Exemplo 1: Avatar em tabela
 *
 * import { avatarSize } from '@/lib/design-tokens/avatar-sizes';
 *
 * <div className={`rounded-full bg-accent flex items-center justify-center ${avatarSize('DEFAULT')}`}>
 *   <span className="font-medium text-accent-foreground">A</span>
 * </div>
 */

/**
 * Exemplo 2: Com componente AvatarCircle
 *
 * import { AvatarCircle } from '@/components/ui/avatar-circle';
 *
 * <AvatarCircle name="Ana Silva" size="DEFAULT" />
 */

// ============================================================================
// MIGRATION GUIDE
// ============================================================================

/**
 * Guia de migração do código antigo para os novos tokens:
 *
 * ANTES                                    DEPOIS
 * ---------------------------------------- ----------------------------------------
 * className="h-8 w-8"                      className={avatarSize('SM')}
 * className="h-9 w-9"                      className={avatarSize('DEFAULT')}
 * className="h-10 w-10"                    className={avatarSize('LG')}
 * className="h-12 w-12"                    className={avatarSize('XL')}
 *
 * // Padrão completo
 * <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center">
 *   <span className="text-xs font-medium">{name.charAt(0)}</span>
 * </div>
 *
 * // Novo padrão (usar componente)
 * <AvatarCircle name={name} size="LG" />
 */

// ============================================================================
// DESIGN PRINCIPLES
// ============================================================================

/**
 * Princípios de Tamanho de Avatar:
 *
 * 1. **Consistência**: Usar DEFAULT (36px) em todas as tabelas
 * 2. **Hierarquia**: SM < DEFAULT < LG < XL
 * 3. **Legibilidade**: Inicial sempre visível e legível
 * 4. **Proporção**: Tamanho de texto proporcional ao avatar
 * 5. **Componente**: Preferir AvatarCircle ao invés de código inline
 *
 * Quando usar cada tamanho:
 * - **SM (32px)**: Listas compactas, comentários, notificações
 * - **DEFAULT (36px)**: Tabelas, cards, listas padrão (MAIS COMUM)
 * - **LG (40px)**: Headers, sidebars, perfis em destaque
 * - **XL (48px)**: Páginas de perfil, modais de usuário
 */
