import { usePrivy } from "@privy-io/react-auth";

type Base = "spoonCore" | "synapse";

function resolveBase(base: Base) {
  const spoonCore = import.meta.env.VITE_BACKEND_URL;       // e.g. http://127.0.0.1:8765/chat/
  const synapse = import.meta.env.VITE_SYNAPSE_API_URL;     // e.g. http://localhost:8000
  return base === "spoonCore" ? spoonCore : synapse;
}

export function useAuthFetch() {
  const { authenticated, getAccessToken } = usePrivy();

  const fetchWithAuth = async (
    input: string | URL,
    init?: RequestInit,
    options?: { base?: Base; path?: string }
  ) => {
    let url: string;

    if (options?.base) {
      const baseUrl = resolveBase(options.base);
      if (!baseUrl) throw new Error(`Base URL not configured for '${options.base}'`);
      url = options.path
        ? `${baseUrl.replace(/\/$/, "")}/${options.path.replace(/^\//, "")}`
        : baseUrl;
    } else {
      url = typeof input === "string" ? input : input.toString();
    }

    const token = authenticated ? await getAccessToken() : undefined;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    return fetch(url, { ...init, headers });
  };

  return { fetchWithAuth };
}