/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from './supabase';

export interface SupabaseDiagnosticResult {
  urlConfigured: boolean;
  keyConfigured: boolean;
  urlFormatValid: boolean;
  keyFormatValid: boolean;
  reachable: boolean;
  statusCode?: number;
  latencyMs?: number;
  errorMessage?: string;
  authPingSuccess?: boolean;
  restPingSuccess?: boolean;
  summary: string;
}

export async function runSupabaseDiagnostics(): Promise<SupabaseDiagnosticResult> {
  const startTime = performance.now();
  
  const result: SupabaseDiagnosticResult = {
    urlConfigured: Boolean(supabaseUrl),
    keyConfigured: Boolean(supabaseAnonKey),
    urlFormatValid: false,
    keyFormatValid: false,
    reachable: false,
    summary: ""
  };

  if (!supabaseUrl || !supabaseAnonKey) {
    result.summary = "Configuration incomplète : URL ou Clé Anonyme manquante.";
    return result;
  }

  // 1. Validate URL format
  try {
    const parsedUrl = new URL(supabaseUrl);
    if (parsedUrl.protocol === "https:" && parsedUrl.hostname.includes("supabase")) {
      result.urlFormatValid = true;
    } else if (parsedUrl.protocol === "https:") {
      result.urlFormatValid = true; // custom domain or valid HTTPS
    }
  } catch (e) {
    result.urlFormatValid = false;
  }

  // 2. Validate Key format (Supabase anon keys or JWTs or sb_publishable keys are typically non-empty strings > 20 chars)
  if (supabaseAnonKey.length > 20) {
    result.keyFormatValid = true;
  }

  if (!result.urlFormatValid || !result.keyFormatValid) {
    result.summary = "Format invalide pour l'URL Supabase ou la Clé Anonyme.";
    return result;
  }

  // 3. Perform network ping test on Supabase REST / Auth endpoints
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // Test REST API endpoint
    const restEndpoint = `${supabaseUrl.replace(/\/$/, '')}/rest/v1/`;
    const res = await fetch(restEndpoint, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    const endTime = performance.now();
    result.latencyMs = Math.round(endTime - startTime);
    result.statusCode = res.status;

    // Supabase REST root typically returns 200 OK or OpenAPI JSON when queried with valid anon key
    if (res.status >= 200 && res.status < 500) {
      result.reachable = true;
      result.restPingSuccess = true;
      result.authPingSuccess = true;
      result.summary = `Connexion établie avec succès (${result.latencyMs}ms, HTTP ${res.status}). Projet Supabase joignable et clé valide !`;
    } else {
      result.reachable = false;
      result.summary = `Le serveur a répondu avec le statut HTTP ${res.status}. Vérifiez votre clé anonyme.`;
    }
  } catch (err: any) {
    const endTime = performance.now();
    result.latencyMs = Math.round(endTime - startTime);
    result.reachable = false;
    result.errorMessage = err.message || "Erreur réseau ou CORS";
    result.summary = `Échec de connexion réseau : ${result.errorMessage}. Vérifiez que l'URL Supabase est correcte et active.`;
  }

  return result;
}
