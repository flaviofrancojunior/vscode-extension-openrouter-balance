/**
 * HTTP client for the OpenRouter API.
 *
 * Abstracts the balance (`GET /api/v1/credits`) and activity summary
 * (`POST /api/v1/analytics/query`) calls, both requiring a management key. The
 * key is never stored on disk in plain text; it is provided in memory by the
 * caller (from the VS Code SecretStorage).
 */

/** Aggregated activity summary for a period, equivalent to the /activity page. */
export interface ResumoAtividade {
  /** Total spent in USD in the period (OpenRouter credits). */
  gasto: number;
  /** Number of requests in the period. */
  requisicoes: number;
  /** Total token volume (prompt + completion) in the period. */
  tokens: number;
}

export class ErroOpenRouter extends Error {
  constructor(
    public readonly status: number,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = 'ErroOpenRouter';
  }
}

const URL_BASE = 'https://openrouter.ai/api/v1';
const DIAS_PADRAO = 30;

/**
 * Queries the account balance and returns the remaining value in USD
 * (`totalCredits - totalUsage`).
 *
 * @throws ErroOpenRouter on a non-successful response (401/402/403/429/5xx).
 */
export async function obterSaldo(
  chave: string,
  fetchImpl: typeof fetch = fetch,
): Promise<number> {
  const corpo = await requisitar<{
    data: { total_credits: number; total_usage: number };
  }>(`${URL_BASE}/credits`, 'GET', chave, fetchImpl);

  const saldo = corpo.data.total_credits - corpo.data.total_usage;
  return arredondar(saldo);
}

/**
 * Queries the aggregated activity summary (spend, requests, and tokens) for the
 * last {@link DIAS_PADRAO} days via the analytics endpoint. With no dimensions,
 * the response is a single row with the totals.
 *
 * @throws ErroOpenRouter on a non-successful response.
 */
export async function obterResumoAtividade(
  chave: string,
  fetchImpl: typeof fetch = fetch,
  agora: Date = new Date(),
): Promise<ResumoAtividade> {
  const fim = agora;
  const inicio = new Date(fim.getTime() - DIAS_PADRAO * 24 * 60 * 60 * 1000);

  const corpo = await requisitar<{
    data: {
      data: Array<{
        total_usage?: number | string;
        request_count?: number | string;
        tokens_total?: number | string;
      }>;
    };
  }>(
    `${URL_BASE}/analytics/query`,
    'POST',
    chave,
    fetchImpl,
    JSON.stringify({
      metrics: ['total_usage', 'request_count', 'tokens_total'],
      time_range: {
        start: inicio.toISOString().replace(/\.\d{3}Z$/, 'Z'),
        end: fim.toISOString().replace(/\.\d{3}Z$/, 'Z'),
      },
    }),
  );

  const linhas = corpo.data.data;
  if (!linhas || linhas.length === 0) {
    return { gasto: 0, requisicoes: 0, tokens: 0 };
  }

  const linha = linhas[0];
  return {
    gasto: arredondar(paraNumero(linha.total_usage)),
    requisicoes: Math.round(paraNumero(linha.request_count)),
    tokens: Math.round(paraNumero(linha.tokens_total)),
  };
}

async function requisitar<T>(
  url: string,
  metodo: 'GET' | 'POST',
  chave: string,
  fetchImpl: typeof fetch,
  corpo?: string,
): Promise<T> {
  const resposta = await fetchImpl(url, {
    method: metodo,
    headers: {
      Authorization: `Bearer ${chave}`,
      'Content-Type': 'application/json',
    },
    ...(corpo ? { body: corpo } : {}),
  });

  if (!resposta.ok) {
    throw new ErroOpenRouter(resposta.status, mensagemErro(resposta.status));
  }

  return (await resposta.json()) as T;
}

/** Converts a numeric value that the API may return as a number or string. */
function paraNumero(valor: number | string | undefined): number {
  if (valor === undefined || valor === null) {
    return 0;
  }
  const numero = typeof valor === 'string' ? Number(valor) : valor;
  return Number.isFinite(numero) ? numero : 0;
}

function mensagemErro(status: number): string {
  switch (status) {
    case 401:
      return 'Invalid or missing OpenRouter key.';
    case 402:
      return 'Insufficient balance on the OpenRouter account.';
    case 403:
      return 'Insufficient permissions: use a management key.';
    case 429:
      return 'Rate limit exceeded on OpenRouter.';
    default:
      return `OpenRouter API failure (HTTP ${status}).`;
  }
}

function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
