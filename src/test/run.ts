import { readdirSync, statSync } from 'node:fs';
import * as path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Mocha = require('mocha');

function coletarTestes(dir: string, arquivos: string[]): void {
  for (const entrada of readdirSync(dir)) {
    const caminho = path.join(dir, entrada);
    if (statSync(caminho).isDirectory()) {
      coletarTestes(caminho, arquivos);
    } else if (entrada.endsWith('.test.js')) {
      arquivos.push(caminho);
    }
  }
}

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 10000,
  });

  const raizTestes = path.resolve(__dirname, 'suite');
  const arquivos: string[] = [];
  coletarTestes(raizTestes, arquivos);

  for (const arquivo of arquivos) {
    mocha.addFile(arquivo);
  }

  await new Promise<void>((resolver, rejeitar) => {
    try {
      mocha.run((falhas: number) => {
        if (falhas > 0) {
          rejeitar(new Error(`${falhas} teste(s) falharam.`));
        } else {
          resolver();
        }
      });
    } catch (erro) {
      rejeitar(erro);
    }
  });
}
