"""Protótipo demonstrativo de faturamento. A execução padrão não controla a tela.

Exemplos:
    python bot_faturamento.py --demo
    python bot_faturamento.py --excel arquivo.xlsx
    python bot_faturamento.py --excel arquivo.xlsx --executar
"""

import argparse
from pathlib import Path
import time
import unicodedata

from dados import Pedido, decimal_texto, ler_excel, pedido_demo


# Coordenadas aproximadas do protótipo V1, para janela maximizada em 1360x768.
# A presença destas coordenadas não confirma compatibilidade com outra instalação.
POS = {
    "numero": (160, 77), "cliente": (420, 125), "vendedor": (420, 149),
    "produto": (330, 196), "quantidade": (158, 221),
    "observacoes_tab": (350, 46), "transporte_tab": (535, 46),
    "placa": (716, 281), "observacoes": (365, 180),
}


def mostrar_resumo(pedido: Pedido) -> None:
    print("FATURAMENTO — RESUMO PARA CONFERÊNCIA")
    print(f"Pedido: {pedido.numero}")
    print(f"Cliente: {pedido.cliente}")
    print(f"Vendedor: {pedido.vendedor}")
    print(f"Produto: {pedido.produto} / código {pedido.codigo}")
    print(f"Sacos: {pedido.sacos} x {decimal_texto(pedido.kg_saco)} kg")
    print(f"Peso total: {decimal_texto(pedido.peso_total)} kg")
    print(f"Preço/kg: R$ {pedido.preco_kg:.2f}")
    print(f"Valor estimado: R$ {pedido.valor_total:.2f}")
    print(f"Placa: {pedido.placa}")
    print(f"Observações:\n{pedido.observacoes}")


def executar_tela(pedido: Pedido) -> None:
    try:
        import pyautogui
    except ImportError:
        raise RuntimeError("Instale pyautogui para a automação de tela.") from None

    pyautogui.FAILSAFE = True
    pyautogui.PAUSE = 0.35
    if tuple(pyautogui.size()) != (1360, 768):
        raise RuntimeError("Esta V1 exige resolução 1360x768 e revisão das coordenadas.")
    print("A etapa seguinte controla mouse e teclado em um ambiente de teste.")
    print("Revise POS e os dados. O bot não grava nem finaliza a venda.")
    if input("Digite PREENCHER para continuar: ").strip() != "PREENCHER":
        print("Preenchimento cancelado.")
        return

    def texto(valor: object) -> None:
        # PyAutoGUI.write trabalha com caracteres de teclado básicos.
        entrada = unicodedata.normalize("NFKD", str(valor)).encode("ascii", "ignore").decode()
        pyautogui.hotkey("ctrl", "a")
        pyautogui.write(entrada, interval=0.02)

    def campo(chave: str, valor: object, selecionavel: bool = False) -> None:
        pyautogui.click(*POS[chave])
        texto(valor)
        if selecionavel:
            pyautogui.press("up")
            pyautogui.press("enter")

    print("Coloque o aplicativo em foco. O preenchimento começa em 5 segundos.")
    time.sleep(5)
    pyautogui.press("f9")
    pyautogui.press("enter")
    campo("numero", pedido.numero)
    campo("cliente", pedido.cliente, selecionavel=True)
    campo("vendedor", pedido.vendedor, selecionavel=True)
    campo("produto", pedido.codigo)
    pyautogui.press("enter")
    campo("quantidade", f"{pedido.peso_total:.5f}")
    pyautogui.press("tab")
    texto(f"{pedido.preco_kg:.5f}")
    pyautogui.press("enter", presses=2, interval=0.35)
    pyautogui.click(*POS["transporte_tab"])
    campo("placa", pedido.placa)
    pyautogui.press("enter")
    pyautogui.click(*POS["observacoes_tab"])
    campo("observacoes", pedido.observacoes)
    print("Preenchimento encerrado. Confira o aplicativo antes de gravar manualmente.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    origem = parser.add_mutually_exclusive_group()
    origem.add_argument("--demo", action="store_true", help="Usar um pedido fictício; não controla a tela.")
    origem.add_argument("--excel", type=Path, help="Excel com uma aba Faturamentos.")
    parser.add_argument("--executar", action="store_true", help="Preencher a tela após confirmação explícita.")
    args = parser.parse_args()
    if args.executar and not args.excel:
        parser.error("--executar exige --excel; a demonstração não controla a tela.")
    try:
        pedido = ler_excel(args.excel) if args.excel else pedido_demo()
        mostrar_resumo(pedido)
        if args.executar:
            executar_tela(pedido)
        else:
            print("\nModo de demonstração: nenhum comando enviado ao aplicativo.")
        return 0
    except (ValueError, RuntimeError, OSError) as exc:
        print(f"Erro: {exc}")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
