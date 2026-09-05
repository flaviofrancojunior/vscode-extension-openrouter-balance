/**
 * Interface messages (English).
 *
 * Exposes a static dictionary of UI strings. The interface is English-only.
 */

export interface Mensagens {
  saldoTooltip: string;
  semChaveTooltip: string;
  erroTooltip: (mensagem: string) => string;
  definirChavePrompt: string;
  definirChavePlaceholder: string;
  definirChaveErroVazio: string;
  definirChaveOk: string;
  limparChaveOk: string;
  atividadeTitulo: string;
  atividadeSubtitulo: string;
  atividadeGasto: string;
  atividadeRequisicoes: string;
  atividadeTokens: string;
  atividadeSaldo: string;
  atividadeErro: (mensagem: string) => string;
}

export const MENSAGENS: Mensagens = {
  saldoTooltip: 'OpenRouter balance (click to view activity)',
  semChaveTooltip: 'Set your OpenRouter management key (click to configure)',
  erroTooltip: (m) => `Failed to fetch: ${m}`,
  definirChavePrompt:
    'Paste your OpenRouter management key (https://openrouter.ai/settings/management-keys)',
  definirChavePlaceholder: 'sk-or-v1-...',
  definirChaveErroVazio: 'Key cannot be empty.',
  definirChaveOk: 'OpenRouter key saved securely.',
  limparChaveOk: 'OpenRouter key removed.',
  atividadeTitulo: 'Activity',
  atividadeSubtitulo: 'Last 30 days',
  atividadeGasto: 'Total spend',
  atividadeRequisicoes: 'Requests',
  atividadeTokens: 'Token volume',
  atividadeSaldo: 'Available balance',
  atividadeErro: (m) => `Could not load activity: ${m}`,
};
