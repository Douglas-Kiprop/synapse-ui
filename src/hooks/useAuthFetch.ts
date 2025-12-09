import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";

type Base = "spoonCore" | "synapse" | "monitoring";

function resolveBase(base: Base) {
    const spoonCore = import.meta.env.VITE_BACKEND_URL;
    const synapse = import.meta.env.VITE_SYNAPSE_API_URL;
    const monitoring = import.meta.env.VITE_MONITORING_API_URL;
    switch (base) {
        case "spoonCore":
            return spoonCore;
        case "synapse":
            return synapse;
        case "monitoring":
            return monitoring;
        default:
            throw new Error(`Unknown base: ${base}`);
    }
}

export function useAuthFetch() {
    const { authenticated, getAccessToken } = usePrivy();
    const sessionTokenRef = useRef<string | null>(null);
    const lastPrivyTokenRef = useRef<string | null>(null);

    useEffect(() => {
        if (!authenticated) {
            sessionTokenRef.current = null;
            lastPrivyTokenRef.current = null;
        }
    }, [authenticated]);

    const ensureSessionToken = async (baseUrl: string): Promise<string | null> => {
        if (!authenticated) return null;
        const privyToken = await getAccessToken();
        if (!privyToken) return null;

        if (sessionTokenRef.current && lastPrivyTokenRef.current === privyToken) {
            return sessionTokenRef.current;
        }

        const verifyUrl = `${baseUrl.replace(/\/$/, "")}/auth/verify`;
        const resp = await fetch(verifyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: privyToken }),
        });
        if (!resp.ok) throw new Error(`Auth verify failed: ${resp.status}`);

        const data = await resp.json();
        const sessionToken = data?.session_token as string | undefined;
        if (!sessionToken) throw new Error("No session_token returned from auth/verify");

        sessionTokenRef.current = sessionToken;
        lastPrivyTokenRef.current = privyToken;
        return sessionToken;
    };

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

        const headers: Record<string, string> = {
            ...(init?.headers as Record<string, string>),
        };
        if (init?.body && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        if (options?.base === "synapse") {
            const baseUrl = resolveBase("synapse");
            const sessionToken = await ensureSessionToken(baseUrl);
            if (sessionToken) headers["Authorization"] = `Bearer ${sessionToken}`;
        } else if (options?.base === "monitoring") {
            const monitoringApiKey = import.meta.env.VITE_MONITORING_API_KEY;
            if (monitoringApiKey) headers["X-Monitoring-Key"] = monitoringApiKey;
        } else {
            const privyToken = authenticated ? await getAccessToken() : undefined;
            if (privyToken) headers["Authorization"] = `Bearer ${privyToken}`;
        }

        const credentials = init?.credentials ?? "same-origin";
        return fetch(url, { ...init, headers, credentials });
    };

    return { fetchWithAuth };
}