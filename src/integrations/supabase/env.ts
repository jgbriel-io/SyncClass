/**
 * Variáveis Supabase validadas em um único lugar.
 * No Vite, import.meta.env.* é substituído no momento do BUILD.
 * As variáveis precisam existir no ambiente do BUILD (ex.: Cloudflare Pages > Settings > Environment variables),
 * não só em runtime — senão o bundle fica com undefined e o Supabase lança "supabaseUrl is required".
 */
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (
  typeof url !== "string" ||
  !url.trim() ||
  typeof key !== "string" ||
  !key.trim()
) {
  const hint =
    typeof url === "undefined" && typeof key === "undefined"
      ? " Variáveis não definidas no ambiente de BUILD. No Cloudflare Pages: Settings > Environment variables > adicione VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY (Production e/ou Preview) e dispare um novo deploy (Build)."
      : " Verifique se VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY estão corretas e disponíveis no ambiente de BUILD.";
  throw new Error("Supabase não configurado." + hint);
}

export const SUPABASE_URL = url;
export const SUPABASE_ANON_KEY = key;
