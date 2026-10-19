# Faturamento de cargas

**Tipo:** protótipo de automação · **Tecnologias:** Python, openpyxl e PyAutoGUI.

## Contexto

O projeto nasceu da experiência de Lucas Padilha com vendas e faturamento de cargas. Na rotina, é necessário informar pedido, cliente, vendedor, produto, peso, preço, placa e observações de pagamento.

A proposta é ler os dados de uma planilha e auxiliar no preenchimento, mantendo a conferência com a pessoa responsável.

## Fluxo do protótipo

1. Ler a primeira linha da aba `Faturamentos` de um Excel.
2. Verificar os campos obrigatórios.
3. Calcular peso total e valor estimado.
4. Preparar observações sobre sacos, produto e pagamento.
5. Mediante execução explícita, preencher o aplicativo pela interface gráfica.
6. Parar para conferência, sem gravar ou finalizar a venda.

Exemplo fictício: **10 sacos × 25 kg = 250 kg**. Com preço de R$ 1,30/kg, o valor calculado é **R$ 325,00**.

## Versão deste repositório

O código é uma adaptação demonstrativa do protótipo V1. O cálculo foi separado da interação com a tela para permitir validação sem aplicativo instalado. Não contém chave PIX, cadastro de cliente ou dados de pagamento reais.

```sh
# Demonstração com dados fictícios; não controla mouse nem teclado.
python projetos/faturamento/bot_faturamento.py --demo

# Testes das regras de entrada, cálculo e observações.
python -m unittest discover -s projetos/faturamento -p 'test_*.py' -v
```

### Leitura de Excel

Instale `openpyxl` e use um arquivo de teste:

```sh
python -m pip install openpyxl
python projetos/faturamento/bot_faturamento.py --excel caminho/arquivo.xlsx
```

A aba `Faturamentos` deve conter estes cabeçalhos:

| Pedido | Cliente | Vendedor | Codigo | Produto | Sacos | Kg_Saco | Preco_Kg | Placa | Pagamento |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEMO-001 | Cliente Exemplo | Vendedor Exemplo | 001 | MILHO | 10 | 25 | 1,30 | ABC1D23 | PIX |

`Produto` é opcional; os demais campos são obrigatórios. Pagamentos aceitos: `PIX`, `CHEQUE` ou `DINHEIRO`. Sem `--executar`, o programa apenas calcula e imprime o resumo.

### Preenchimento de tela

```sh
python -m pip install openpyxl pyautogui
python projetos/faturamento/bot_faturamento.py --excel caminho/arquivo.xlsx --executar
```

Essa opção é destinada a um **ambiente de teste** com o aplicativo de destino. Exige confirmação digitada, janela maximizada e resolução de 1360 × 768. As coordenadas são herdadas da V1 e precisam ser revistas antes de qualquer uso real. Mover o mouse para o canto superior esquerdo interrompe o PyAutoGUI.

Não foi feita validação de preenchimento em uma instalação real do aplicativo durante a preparação deste portfólio. Os testes automatizados verificam as regras de dados; não validam as posições na tela. O protótipo não substitui o sistema de faturamento.

## Aprendizado

Decomposição de uma rotina em etapas, tratamento de dados de planilha, validação de entradas, cálculos com `Decimal` e separação entre regra de negócio e automação de interface.
