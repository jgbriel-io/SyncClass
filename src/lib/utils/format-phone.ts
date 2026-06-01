import {
  parsePhoneNumber,
  isValidPhoneNumber,
  CountryCode,
} from "libphonenumber-js";
import { COMMON_COUNTRIES } from "@/lib/countries";

/**
 * Mapa de nomes de países (PT/EN) para códigos ISO (usado pela libphonenumber-js)
 */
const COUNTRY_NAME_TO_CODE: Record<string, CountryCode> = {};
COMMON_COUNTRIES.forEach((country) => {
  COUNTRY_NAME_TO_CODE[country.name.toLowerCase()] =
    country.code as CountryCode;
  COUNTRY_NAME_TO_CODE[country.nameEn.toLowerCase()] =
    country.code as CountryCode;
});

/**
 * Lista de UFs brasileiras
 */
const BRAZILIAN_STATES = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

/**
 * Remove o DDI (código do país) de um número de telefone, deixando apenas o número local.
 * Útil para normalizar números antes de salvar no banco.
 *
 * @param phone - Número de telefone (pode conter DDI)
 * @param countryOrState - Código do país ou estado
 * @returns Número sem o DDI (apenas número local)
 *
 * @example
 * removeCountryCode("+12133734253", "US") // "2133734253"
 * removeCountryCode("5535999999999", "BR") // "35999999999"
 * removeCountryCode("35999999999", "MG") // "35999999999" (já está sem DDI)
 */
export function removeCountryCode(
  phone: string | null | undefined,
  countryOrState?: string | null
): string {
  if (!phone || phone.trim() === "") {
    return "";
  }

  try {
    // Remove tudo exceto dígitos
    const cleanPhone = phone.replace(/\D/g, "");

    if (!cleanPhone) return "";

    // Detecta o país
    let countryCode: CountryCode = "BR";

    if (countryOrState) {
      const normalized = countryOrState.trim();

      if (normalized.length === 2) {
        const upper = normalized.toUpperCase();
        countryCode = BRAZILIAN_STATES.includes(upper)
          ? "BR"
          : (upper as CountryCode);
      } else {
        const lowerName = normalized.toLowerCase();
        countryCode = COUNTRY_NAME_TO_CODE[lowerName] || "BR";
      }
    }

    // Para Brasil: se tem 10 ou 11 dígitos, já está no formato nacional (DDD + número)
    if (
      countryCode === "BR" &&
      (cleanPhone.length === 10 || cleanPhone.length === 11)
    ) {
      return cleanPhone;
    }

    // Para outros países ou números com DDI: tenta parsear e remover o DDI
    // Se tem mais de 11 dígitos, provavelmente tem DDI
    if (cleanPhone.length > 11) {
      const phoneWithPlus = `+${cleanPhone}`;
      if (isValidPhoneNumber(phoneWithPlus)) {
        const parsed = parsePhoneNumber(phoneWithPlus);
        return parsed.nationalNumber;
      }
    }

    // Tenta parsear com o código do país para remover DDI
    const phoneWithCountry = parsePhoneNumber(cleanPhone, countryCode);
    if (phoneWithCountry && phoneWithCountry.isValid()) {
      return phoneWithCountry.nationalNumber;
    }

    // Fallback: retorna apenas os dígitos
    return cleanPhone;
  } catch (error) {
    // Fallback: retorna apenas os dígitos
    return phone.replace(/\D/g, "");
  }
}

/**
 * Formata um número de telefone para exibição no formato internacional.
 * Usa libphonenumber-js para formatação robusta de números de qualquer país.
 *
 * @param phone - Número de telefone como string (ex: "35999999999" ou "2133734253" ou "5535999999999")
 * @param countryOrState - Código do país (ISO) ou nome do país/estado (ex: "BR", "Brasil", "SP", "Estados Unidos")
 * @returns Número formatado (ex: "+55 35 99999-9999") ou string original como fallback
 *
 * @example
 * formatPhoneDisplay("35999999999", "BR") // "+55 35 99999-9999"
 * formatPhoneDisplay("5535999999999", "BR") // "+55 35 99999-9999" (detecta DDI)
 * formatPhoneDisplay("35999999999", "MG") // "+55 35 99999-9999" (detecta que é UF brasileira)
 * formatPhoneDisplay("2133734253", "Estados Unidos") // "+1 213 373 4253"
 * formatPhoneDisplay("12133734253", "Estados Unidos") // "+1 213 373 4253" (detecta DDI)
 */
export function formatPhoneDisplay(
  phone: string | null | undefined,
  countryOrState?: string | null
): string {
  if (!phone || phone.trim() === "") {
    return "";
  }

  try {
    // Remove espaços e caracteres especiais, mantém apenas números e +
    const cleanPhone = phone.replace(/[^\d+]/g, "");

    if (!cleanPhone) {
      return phone;
    }

    // Se já tem +, tenta formatar diretamente
    if (cleanPhone.startsWith("+")) {
      if (isValidPhoneNumber(cleanPhone)) {
        const phoneNumber = parsePhoneNumber(cleanPhone);

        // Para Brasil, garantir formato com hífen
        if (phoneNumber.country === "BR") {
          const national = phoneNumber.nationalNumber;
          if (national.length === 11) {
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 7)}-${national.slice(7)}`;
          } else if (national.length === 10) {
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 6)}-${national.slice(6)}`;
          }
        }

        return phoneNumber.formatInternational();
      }
      return phone;
    }

    // Detecta o país baseado no countryOrState
    let countryCode: CountryCode = "BR"; // Default: Brasil

    if (countryOrState) {
      const normalized = countryOrState.trim();

      // Se tem 2 caracteres, pode ser código ISO ou UF brasileira
      if (normalized.length === 2) {
        const upper = normalized.toUpperCase();

        if (BRAZILIAN_STATES.includes(upper)) {
          countryCode = "BR";
        } else {
          // Assume que é código ISO de país
          countryCode = upper as CountryCode;
        }
      } else {
        // Busca pelo nome do país (case-insensitive)
        const lowerName = normalized.toLowerCase();
        const mappedCode = COUNTRY_NAME_TO_CODE[lowerName];

        if (mappedCode) {
          countryCode = mappedCode;
        } else {
          // Fallback: se não encontrou, mantém BR
          countryCode = "BR";
        }
      }
    }

    // DETECÇÃO INTELIGENTE: Verifica se o número já contém DDI
    // Tenta parsear como número internacional primeiro (com DDI)
    const phoneWithPlus = `+${cleanPhone}`;
    if (isValidPhoneNumber(phoneWithPlus)) {
      const parsed = parsePhoneNumber(phoneWithPlus);

      // Se o país detectado bate com o esperado, usa esse parse
      if (parsed.country === countryCode) {
        // Para Brasil, garantir formato com hífen
        if (countryCode === "BR") {
          const national = parsed.nationalNumber;
          if (national.length === 11) {
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 7)}-${national.slice(7)}`;
          } else if (national.length === 10) {
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 6)}-${national.slice(6)}`;
          }
        }

        return parsed.formatInternational();
      }
    }

    // Se não detectou DDI, tenta parsear como número local
    try {
      const phoneWithCountry = parsePhoneNumber(cleanPhone, countryCode);

      if (phoneWithCountry) {
        // Para Brasil, garantir formato correto: +55 DD 9XXXX-XXXX ou +55 DD XXXX-XXXX
        if (countryCode === "BR") {
          const national = phoneWithCountry.nationalNumber;
          if (national.length === 11) {
            // Celular: +55 DD 9XXXX-XXXX
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 7)}-${national.slice(7)}`;
          } else if (national.length === 10) {
            // Fixo: +55 DD XXXX-XXXX
            return `+55 ${national.slice(0, 2)} ${national.slice(2, 6)}-${national.slice(6)}`;
          }
        }

        // Para outros países, usa formatação internacional mesmo se não for válido
        return phoneWithCountry.formatInternational();
      }
    } catch (parseError) {
      // Ignora erro e continua para fallback
    }

    // Fallback: retorna original
    return phone;
  } catch (error) {
    // Fallback: retorna original em caso de erro
    return phone;
  }
}
