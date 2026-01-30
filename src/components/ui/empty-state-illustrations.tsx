/**
 * Ilustrações SVG minimalistas para Empty States
 * 
 * Estilo: Line art simples, monocromático
 * Cores: Usando tokens de design (text-muted-foreground)
 */

export function EmptyStudentsIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      {/* Cadeira/Mesa de estudante */}
      <rect x="30" y="70" width="60" height="4" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="35" y="74" width="8" height="26" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <rect x="77" y="74" width="8" height="26" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Livro */}
      <rect x="45" y="55" width="30" height="20" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="60" y1="55" x2="60" y2="75" stroke="currentColor" strokeWidth="2" />
      
      {/* Pessoa simples */}
      <circle cx="60" cy="30" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 52 45 Q 60 38 68 45" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Plus icon (adicionar) */}
      <circle cx="90" cy="35" r="12" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="2 2" />
      <line x1="90" y1="29" x2="90" y2="41" stroke="currentColor" strokeWidth="2" />
      <line x1="84" y1="35" x2="96" y2="35" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export function EmptyClassesIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      {/* Calendário */}
      <rect x="25" y="30" width="70" height="60" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <line x1="25" y1="45" x2="95" y2="45" stroke="currentColor" strokeWidth="2" />
      
      {/* Argolas do calendário */}
      <line x1="40" y1="30" x2="40" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="60" y1="30" x2="60" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="80" y1="30" x2="80" y2="25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      
      {/* Grid de dias (vazio) */}
      <circle cx="40" cy="60" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="55" cy="60" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="70" cy="60" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="85" cy="60" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      
      <circle cx="40" cy="75" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="55" cy="75" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
      <circle cx="70" cy="75" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.3" />
    </svg>
  );
}

export function EmptyFinancialIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      {/* Carteira/Wallet */}
      <rect x="30" y="45" width="60" height="40" rx="4" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M 30 55 L 90 55" stroke="currentColor" strokeWidth="2" />
      
      {/* Pocket/Bolso */}
      <rect x="70" y="60" width="12" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Moeda com símbolo R$ */}
      <circle cx="55" cy="70" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <text x="51" y="74" fontSize="10" fill="currentColor" fontWeight="bold">R$</text>
      
      {/* Linhas de movimento (vazio) */}
      <line x1="35" y1="35" x2="50" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" strokeDasharray="2 2" />
      <line x1="70" y1="35" x2="85" y2="35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" strokeDasharray="2 2" />
    </svg>
  );
}

export function EmptyHistoryIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      {/* Relógio */}
      <circle cx="60" cy="60" r="30" stroke="currentColor" strokeWidth="2" fill="none" />
      
      {/* Ponteiros */}
      <line x1="60" y1="60" x2="60" y2="40" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="60" y1="60" x2="75" y2="60" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* Marcadores de hora */}
      <circle cx="60" cy="35" r="2" fill="currentColor" />
      <circle cx="85" cy="60" r="2" fill="currentColor" />
      <circle cx="60" cy="85" r="2" fill="currentColor" />
      <circle cx="35" cy="60" r="2" fill="currentColor" />
      
      {/* Seta circular (histórico) */}
      <path 
        d="M 45 25 Q 30 30 25 45" 
        stroke="currentColor" 
        strokeWidth="2" 
        fill="none" 
        strokeLinecap="round"
        opacity="0.5"
      />
      <path d="M 25 45 L 22 38 L 30 40 Z" fill="currentColor" opacity="0.5" />
    </svg>
  );
}

export function EmptySearchIllustration() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-muted-foreground/30"
    >
      {/* Lupa */}
      <circle cx="55" cy="55" r="25" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <line x1="73" y1="73" x2="90" y2="90" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      
      {/* X dentro (não encontrado) */}
      <line x1="47" y1="47" x2="63" y2="63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="63" y1="47" x2="47" y2="63" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
}
