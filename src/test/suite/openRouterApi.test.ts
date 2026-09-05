import * as assert from 'assert';

import {
  ErroOpenRouter,
  obterResumoAtividade,
  obterSaldo,
} from '../../openRouterApi';

function mockFetch(corpo: unknown, status = 200): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => corpo,
    }) as Response) as unknown as typeof fetch;
}

suite('openRouterApi', () => {
  test('retorna o saldo (totalCredits - totalUsage)', async () => {
    const fetchImpl = mockFetch({
      data: { total_credits: 100.5, total_usage: 25.75 },
    });

    const saldo = await obterSaldo('sk-test', fetchImpl);
    assert.strictEqual(saldo, 74.75);
  });

  test('arredonda o saldo para duas casas decimais', async () => {
    const fetchImpl = mockFetch({
      data: { total_credits: 10.005, total_usage: 0 },
    });

    const saldo = await obterSaldo('sk-test', fetchImpl);
    assert.strictEqual(saldo, 10.01);
  });

  test('lança ErroOpenRouter em resposta 401', async () => {
    const fetchImpl = mockFetch({}, 401);

    await assert.rejects(
      () => obterSaldo('sk-test', fetchImpl),
      (erro: ErroOpenRouter) =>
        erro instanceof ErroOpenRouter &&
        erro.status === 401 &&
        /invalid/i.test(erro.message),
    );
  });

  test('lança ErroOpenRouter em resposta 403 com mensagem de management key', async () => {
    const fetchImpl = mockFetch({}, 403);

    await assert.rejects(
      () => obterSaldo('sk-test', fetchImpl),
      (erro: ErroOpenRouter) =>
        erro instanceof ErroOpenRouter && /management key/i.test(erro.message),
    );
  });

  test('lança ErroOpenRouter em resposta 429', async () => {
    const fetchImpl = mockFetch({}, 429);

    await assert.rejects(
      () => obterSaldo('sk-test', fetchImpl),
      (erro: ErroOpenRouter) =>
        erro instanceof ErroOpenRouter && erro.status === 429,
    );
  });

  suite('obterResumoAtividade', () => {
    test('mapeia os totais de gasto, requisições e tokens', async () => {
      const fetchImpl = mockFetch({
        data: {
          data: [
            {
              total_usage: 0.015,
              request_count: '5',
              tokens_total: '6331',
            },
          ],
        },
      });

      const resumo = await obterResumoAtividade(
        'sk-test',
        fetchImpl,
        new Date('2026-09-05T18:00:00Z'),
      );

      assert.strictEqual(resumo.gasto, 0.02);
      assert.strictEqual(resumo.requisicoes, 5);
      assert.strictEqual(resumo.tokens, 6331);
    });

    test('trata valores numéricos como number ou string', async () => {
      const fetchImpl = mockFetch({
        data: {
          data: [
            {
              total_usage: 12.345,
              request_count: 42,
              tokens_total: '1000000',
            },
          ],
        },
      });

      const resumo = await obterResumoAtividade(
        'sk-test',
        fetchImpl,
        new Date('2026-09-05T18:00:00Z'),
      );

      assert.strictEqual(resumo.gasto, 12.35);
      assert.strictEqual(resumo.requisicoes, 42);
      assert.strictEqual(resumo.tokens, 1000000);
    });

    test('retorna zeros quando não há linhas', async () => {
      const fetchImpl = mockFetch({ data: { data: [] } });

      const resumo = await obterResumoAtividade(
        'sk-test',
        fetchImpl,
        new Date('2026-09-05T18:00:00Z'),
      );

      assert.deepStrictEqual(resumo, { gasto: 0, requisicoes: 0, tokens: 0 });
    });

    test('trata campos ausentes como zero', async () => {
      const fetchImpl = mockFetch({ data: { data: [{}] } });

      const resumo = await obterResumoAtividade(
        'sk-test',
        fetchImpl,
        new Date('2026-09-05T18:00:00Z'),
      );

      assert.deepStrictEqual(resumo, { gasto: 0, requisicoes: 0, tokens: 0 });
    });

    test('lança ErroOpenRouter em resposta 403', async () => {
      const fetchImpl = mockFetch({}, 403);

      await assert.rejects(
        () =>
          obterResumoAtividade(
            'sk-test',
            fetchImpl,
            new Date('2026-09-05T18:00:00Z'),
          ),
        (erro: ErroOpenRouter) =>
          erro instanceof ErroOpenRouter && erro.status === 403,
      );
    });
  });
});
