/**
 * Lista de países mais comuns para seleção
 * Fonte: ISO 3166-1 alpha-2
 */

export interface Country {
  code: string;
  name: string;
  nameEn: string;
}

export const COMMON_COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", nameEn: "Brazil" },
  { code: "US", name: "Estados Unidos", nameEn: "United States" },
  { code: "GB", name: "Reino Unido", nameEn: "United Kingdom" },
  { code: "CA", name: "Canadá", nameEn: "Canada" },
  { code: "AU", name: "Austrália", nameEn: "Australia" },
  { code: "DE", name: "Alemanha", nameEn: "Germany" },
  { code: "FR", name: "França", nameEn: "France" },
  { code: "ES", name: "Espanha", nameEn: "Spain" },
  { code: "IT", name: "Itália", nameEn: "Italy" },
  { code: "PT", name: "Portugal", nameEn: "Portugal" },
  { code: "AR", name: "Argentina", nameEn: "Argentina" },
  { code: "CL", name: "Chile", nameEn: "Chile" },
  { code: "CO", name: "Colômbia", nameEn: "Colombia" },
  { code: "MX", name: "México", nameEn: "Mexico" },
  { code: "PE", name: "Peru", nameEn: "Peru" },
  { code: "UY", name: "Uruguai", nameEn: "Uruguay" },
  { code: "PY", name: "Paraguai", nameEn: "Paraguay" },
  { code: "BO", name: "Bolívia", nameEn: "Bolivia" },
  { code: "VE", name: "Venezuela", nameEn: "Venezuela" },
  { code: "JP", name: "Japão", nameEn: "Japan" },
  { code: "CN", name: "China", nameEn: "China" },
  { code: "KR", name: "Coreia do Sul", nameEn: "South Korea" },
  { code: "IN", name: "Índia", nameEn: "India" },
  { code: "ZA", name: "África do Sul", nameEn: "South Africa" },
  { code: "NZ", name: "Nova Zelândia", nameEn: "New Zealand" },
  { code: "IE", name: "Irlanda", nameEn: "Ireland" },
  { code: "CH", name: "Suíça", nameEn: "Switzerland" },
  { code: "AT", name: "Áustria", nameEn: "Austria" },
  { code: "BE", name: "Bélgica", nameEn: "Belgium" },
  { code: "NL", name: "Holanda", nameEn: "Netherlands" },
  { code: "SE", name: "Suécia", nameEn: "Sweden" },
  { code: "NO", name: "Noruega", nameEn: "Norway" },
  { code: "DK", name: "Dinamarca", nameEn: "Denmark" },
  { code: "FI", name: "Finlândia", nameEn: "Finland" },
  { code: "PL", name: "Polônia", nameEn: "Poland" },
  { code: "RU", name: "Rússia", nameEn: "Russia" },
  { code: "TR", name: "Turquia", nameEn: "Turkey" },
  { code: "EG", name: "Egito", nameEn: "Egypt" },
  { code: "IL", name: "Israel", nameEn: "Israel" },
  { code: "AE", name: "Emirados Árabes", nameEn: "United Arab Emirates" },
  { code: "SA", name: "Arábia Saudita", nameEn: "Saudi Arabia" },
  { code: "SG", name: "Singapura", nameEn: "Singapore" },
  { code: "TH", name: "Tailândia", nameEn: "Thailand" },
  { code: "VN", name: "Vietnã", nameEn: "Vietnam" },
  { code: "PH", name: "Filipinas", nameEn: "Philippines" },
  { code: "ID", name: "Indonésia", nameEn: "Indonesia" },
  { code: "MY", name: "Malásia", nameEn: "Malaysia" },
];

// Ordenar alfabeticamente por nome em português
COMMON_COUNTRIES.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
