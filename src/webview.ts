import * as vscode from 'vscode';

import { formatarSaldo } from './format';
import { MENSAGENS } from './i18n';
import { ResumoAtividade } from './openRouterApi';

/**
 * Builds the activity panel HTML, with a nonce-based Content-Security-Policy and
 * no unsanitized dynamic content. Displays the spend, requests, tokens, and
 * balance cards, equivalent to the /activity page.
 */
export function montarHtmlAtividade(
  resumo: ResumoAtividade,
  saldo: number,
  nonce: string,
): string {
  const tokens = formatarNumero(resumo.tokens);
  const requisicoes = formatarNumero(resumo.requisicoes);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${MENSAGENS.atividadeTitulo}</title>
  <style nonce="${nonce}">
    body { font-family: var(--vscode-font-family); padding: 16px; color: var(--vscode-foreground); }
    h1 { font-size: 15px; font-weight: 600; margin: 0 0 4px; }
    .subtitulo { font-size: 12px; color: var(--vscode-descriptionForeground); margin: 0 0 16px; }
    .cartoes { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .cartao { border: 1px solid var(--vscode-panel-border); border-radius: 6px; padding: 12px; }
    .cartao.destaque { grid-column: 1 / -1; background: var(--vscode-editorWidget-background, transparent); }
    .rotulo { font-size: 11px; color: var(--vscode-descriptionForeground); text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px; }
    .valor { font-size: 18px; font-weight: 600; margin: 0; }
    .valor.gasto { color: var(--vscode-errorForeground); }
    .valor.saldo { color: var(--vscode-charts-green, var(--vscode-foreground)); }
  </style>
</head>
<body>
  <h1>${MENSAGENS.atividadeTitulo}</h1>
  <p class="subtitulo">${MENSAGENS.atividadeSubtitulo}</p>
  <div class="cartoes">
    <div class="cartao destaque">
      <p class="rotulo">${MENSAGENS.atividadeSaldo}</p>
      <p class="valor saldo">${formatarSaldo(saldo)}</p>
    </div>
    <div class="cartao">
      <p class="rotulo">${MENSAGENS.atividadeGasto}</p>
      <p class="valor gasto">${formatarSaldo(resumo.gasto)}</p>
    </div>
    <div class="cartao">
      <p class="rotulo">${MENSAGENS.atividadeRequisicoes}</p>
      <p class="valor">${requisicoes}</p>
    </div>
    <div class="cartao">
      <p class="rotulo">${MENSAGENS.atividadeTokens}</p>
      <p class="valor">${tokens}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Builds the error-state panel HTML.
 */
export function montarHtmlErro(mensagem: string, nonce: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}';">
  <title>${MENSAGENS.atividadeTitulo}</title>
  <style nonce="${nonce}">
    body { font-family: var(--vscode-font-family); padding: 12px 16px; color: var(--vscode-errorForeground); }
    p { font-size: 12px; }
  </style>
</head>
<body>
  <p>${MENSAGENS.atividadeErro(escapeHtml(mensagem))}</p>
</body>
</html>`;
}

/**
 * Creates the activity panel and renders its content.
 */
export function mostrarAtividade(
  contexto: vscode.ExtensionContext,
  resumo: ResumoAtividade,
  saldo: number,
): void {
  const painel = vscode.window.createWebviewPanel(
    'openrouterAtividade',
    MENSAGENS.atividadeTitulo,
    vscode.ViewColumn.One,
    {
      enableScripts: false,
      localResourceRoots: [],
    },
  );

  const nonce = gerarNonce();
  painel.webview.html = montarHtmlAtividade(resumo, saldo, nonce);

  void contexto;
}

/** Formats an integer (requests/tokens) with a thousands separator. */
function formatarNumero(valor: number): string {
  return valor.toLocaleString('en-US');
}

function escapeHtml(texto: string): string {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function gerarNonce(): string {
  const bytes = new Uint8Array(16);
  const cryptoGlobal = (globalThis as { crypto?: { getRandomValues(arr: Uint8Array): void } })
    .crypto;
  if (cryptoGlobal && typeof cryptoGlobal.getRandomValues === 'function') {
    cryptoGlobal.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
