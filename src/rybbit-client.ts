/**
 * Thin typed wrapper around the Rybbit Stats API.
 *
 * Docs: https://rybbit.com/docs/api/getting-started
 *
 * Auth: Bearer token (API key), generated in Rybbit dashboard under
 * Settings -> Account -> API Keys. Self-hosted instances have no rate limits;
 * cloud (app.rybbit.io) is rate-limited per the user's plan.
 */

export interface RybbitConfig {
  /** Base URL of the Rybbit instance, e.g. https://app.rybbit.io or your self-hosted URL. No trailing slash. */
  baseUrl: string;
  /** Rybbit API key, used as a Bearer token. */
  apiKey: string;
}

export class RybbitApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, body: unknown) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? String((body as { error: unknown }).error)
        : `Rybbit API request failed with status ${status}`;
    super(message);
    this.name = "RybbitApiError";
    this.status = status;
    this.body = body;
  }
}

/** Common time-range parameters shared by nearly every analytics endpoint. */
export interface TimeParams {
  [key: string]: unknown;
  start_date?: string;
  end_date?: string;
  time_zone?: string;
  start_datetime?: string;
  end_datetime?: string;
  past_minutes_start?: number;
  past_minutes_end?: number;
}

export interface FilterObject {
  parameter: string;
  type:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "regex"
    | "not_regex"
    | "greater_than"
    | "less_than";
  value: Array<string | number>;
}

function buildQuery(params: Record<string, unknown>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    if (key === "filters") {
      const filters = value as FilterObject[];
      if (filters.length > 0) {
        search.set("filters", JSON.stringify(filters));
      }
      continue;
    }
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export class RybbitClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: RybbitConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
  }

  public async request<T>(
    path: string,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      query?: Record<string, unknown>;
      body?: unknown;
    } = {}
  ): Promise<T> {
    const { method = "GET", query, body } = options;
    const url = `${this.baseUrl}${path}${query ? buildQuery(query) : ""}`;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
    };
    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let parsed: unknown = undefined;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }

    if (!res.ok) {
      throw new RybbitApiError(res.status, parsed);
    }
    return parsed as T;
  }

  // ---- Organizations ----

  listOrganizations() {
    return this.request<unknown[]>("/api/organizations");
  }

  // ---- Sites ----

  getSite(siteId: string | number) {
    return this.request<unknown>(`/api/sites/${siteId}`);
  }

  // ---- Overview ----

  getOverview(siteId: string | number, params: TimeParams & { filters?: FilterObject[] }) {
    return this.request<unknown>(`/api/sites/${siteId}/overview`, { query: params });
  }

  getOverviewBucketed(
    siteId: string | number,
    params: TimeParams & {
      bucket: "minute" | "five_minutes" | "hour" | "day" | "week" | "month";
      filters?: FilterObject[];
    }
  ) {
    return this.request<unknown>(`/api/sites/${siteId}/overview-bucketed`, { query: params });
  }

  getMetric(
    siteId: string | number,
    params: TimeParams & {
      parameter: string;
      limit?: number;
      page?: number;
      filters?: FilterObject[];
    }
  ) {
    return this.request<unknown>(`/api/sites/${siteId}/metric`, { query: params });
  }

  getLiveUserCount(siteId: string | number, minutes?: number) {
    return this.request<{ count: number }>(`/api/sites/${siteId}/live-user-count`, {
      query: { minutes },
    });
  }

  // ---- Sessions ----

  listSessions(
    siteId: string | number,
    params: TimeParams & {
      page?: number;
      limit?: number;
      user_id?: string;
      identified_only?: string;
      filters?: FilterObject[];
    }
  ) {
    return this.request<unknown>(`/api/sites/${siteId}/sessions`, { query: params });
  }

  getSession(
    siteId: string | number,
    sessionId: string,
    params: { limit?: number; offset?: number; minutes?: number } = {}
  ) {
    return this.request<unknown>(`/api/sites/${siteId}/sessions/${sessionId}`, {
      query: params,
    });
  }

  getSessionLocations(siteId: string | number, params: TimeParams & { filters?: FilterObject[] }) {
    return this.request<unknown>(`/api/sites/${siteId}/session-locations`, { query: params });
  }
}
