import * as vscode from 'vscode';

import { formatarSaldo } from './format';
import { MENSAGENS } from './i18n';
import { obterResumoAtividade, obterSaldo } from './openRouterApi';
import { montarHtmlErro, mostrarAtividade } from './webview';

const CHAVE_SECRET = 'openrouter.managementKey';

let itemBarra: vscode.StatusBarItem;
let timer: NodeJS.Timeout | undefined;

export function activate(contexto: vscode.ExtensionContext): void {
  itemBarra = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100,
  );

  itemBarra.command = 'openrouter.showExtrato';
  itemBarra.text = '$(openrouter-logo) ' + formatarSaldo(0);
  itemBarra.tooltip = MENSAGENS.saldoTooltip;
  itemBarra.show();
  contexto.subscriptions.push(itemBarra);

  contexto.subscriptions.push(
    vscode.commands.registerCommand('openrouter.setKey', () =>
      definirChave(contexto),
    ),
  );
  contexto.subscriptions.push(
    vscode.commands.registerCommand('openrouter.clearKey', () =>
      limparChave(contexto),
    ),
  );
  contexto.subscriptions.push(
    vscode.commands.registerCommand('openrouter.showExtrato', () =>
      void abrirExtrato(contexto),
    ),
  );
  contexto.subscriptions.push(
    vscode.commands.registerCommand('openrouter.refresh', () =>
      void atualizarSaldo(contexto),
    ),
  );

  void atualizarSaldo(contexto);
  agendarAtualizacao(contexto);
}

export function deactivate(): void {
  if (timer) {
    clearInterval(timer);
    timer = undefined;
  }
}

async function definirChave(contexto: vscode.ExtensionContext): Promise<void> {
  const chave = await vscode.window.showInputBox({
    prompt: MENSAGENS.definirChavePrompt,
    password: true,
    ignoreFocusOut: true,
    placeHolder: MENSAGENS.definirChavePlaceholder,
    validateInput: (valor) =>
      valor.trim() ? undefined : MENSAGENS.definirChaveErroVazio,
  });

  if (!chave) {
    return;
  }

  await contexto.secrets.store(CHAVE_SECRET, chave.trim());
  vscode.window.showInformationMessage(MENSAGENS.definirChaveOk);
  await atualizarSaldo(contexto);
}

async function limparChave(contexto: vscode.ExtensionContext): Promise<void> {
  await contexto.secrets.delete(CHAVE_SECRET);
  atualizarBarraSemChave();
  vscode.window.showInformationMessage(MENSAGENS.limparChaveOk);
}

function agendarAtualizacao(contexto: vscode.ExtensionContext): void {
  const minutos = vscode.workspace
    .getConfiguration('openrouter')
    .get<number>('refreshIntervalMinutes', 15);
  timer = setInterval(() => void atualizarSaldo(contexto), minutos * 60 * 1000);
}

async function atualizarSaldo(contexto: vscode.ExtensionContext): Promise<void> {
  const chave = await contexto.secrets.get(CHAVE_SECRET);

  if (!chave) {
    atualizarBarraSemChave();
    return;
  }

  try {
    const saldo = await obterSaldo(chave);
    itemBarra.text = '$(openrouter-logo) ' + formatarSaldo(saldo);
    itemBarra.command = 'openrouter.showExtrato';
    itemBarra.tooltip = MENSAGENS.saldoTooltip;
    itemBarra.color = corDoSaldo(saldo);
  } catch (erro) {
    itemBarra.text = '$(openrouter-logo) ' + formatarSaldo(0);
    itemBarra.tooltip = MENSAGENS.erroTooltip(
      erro instanceof Error ? erro.message : 'unknown error',
    );
    itemBarra.command = 'openrouter.setKey';
  }
}

function atualizarBarraSemChave(): void {
  itemBarra.text = '$(openrouter-logo) ' + formatarSaldo(0);
  itemBarra.tooltip = MENSAGENS.semChaveTooltip;
  itemBarra.command = 'openrouter.setKey';
}

function corDoSaldo(saldo: number): vscode.ThemeColor | undefined {
  const config = vscode.workspace.getConfiguration('openrouter');
  const critico = config.get<number>('criticalBalanceThreshold', 1);
  const baixo = config.get<number>('lowBalanceThreshold', 5);

  if (saldo <= critico) {
    return new vscode.ThemeColor('statusBarItem.errorForeground');
  }
  if (saldo <= baixo) {
    return new vscode.ThemeColor('statusBarItem.warningForeground');
  }
  return undefined;
}

async function abrirExtrato(contexto: vscode.ExtensionContext): Promise<void> {
  const chave = await contexto.secrets.get(CHAVE_SECRET);

  if (!chave) {
    criarPainelErro(MENSAGENS.semChaveTooltip);
    return;
  }

  try {
    const [resumo, saldo] = await Promise.all([
      obterResumoAtividade(chave),
      obterSaldo(chave),
    ]);
    mostrarAtividade(contexto, resumo, saldo);
  } catch (erro) {
    criarPainelErro(erro instanceof Error ? erro.message : 'unknown error');
  }
}

function criarPainelErro(mensagem: string): vscode.WebviewPanel {
  const painel = vscode.window.createWebviewPanel(
    'openrouterAtividade',
    MENSAGENS.atividadeTitulo,
    vscode.ViewColumn.One,
    { enableScripts: false, localResourceRoots: [] },
  );
  painel.webview.html = montarHtmlErro(mensagem, gerarNonce());
  return painel;
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
