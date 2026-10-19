"""Verifica cálculos e rejeição de entradas que gerariam pedidos incorretos."""

from decimal import Decimal
import unittest

from dados import Pedido, mensagem_pagamento, pedido_demo


class TestPedido(unittest.TestCase):
    def linha(self, **alteracoes):
        valores = {
            "Pedido": "DEMO", "Cliente": "Cliente Exemplo", "Vendedor": "Exemplo",
            "Codigo": "001", "Sacos": 10, "Kg_Saco": 25, "Preco_Kg": "1,30",
            "Placa": "ABC1D23", "Pagamento": "PIX",
        }
        return dict(valores, **alteracoes)

    def test_pedido_dez_sacos_de_vinte_cinco_kg(self):
        pedido = pedido_demo()
        self.assertEqual(pedido.peso_total, Decimal("250"))
        self.assertEqual(pedido.valor_total, Decimal("325.00"))
        self.assertIn("10 SACOS DE MILHO DE 25 KG", pedido.observacoes)

    def test_fracoes_de_kg_e_arredondamento_monetario(self):
        pedido = Pedido.de_linha(self.linha(Sacos=3, Kg_Saco="0,125", Preco_Kg="1,32"))
        self.assertEqual(pedido.peso_total, Decimal("0.375"))
        self.assertEqual(pedido.valor_total, Decimal("0.50"))

    def test_recusa_quantidade_fracionaria_negativa_ou_nao_finita(self):
        for valor in ["1.5", -2, 0, "NaN", "Infinity", "texto"]:
            with self.subTest(valor=valor), self.assertRaises(ValueError):
                Pedido.de_linha(self.linha(Sacos=valor))

    def test_recusa_preco_peso_ou_campo_obrigatorio_invalido(self):
        for alteracao in [{"Kg_Saco": -1}, {"Preco_Kg": 0}, {"Cliente": " "}, {"Pedido": None}]:
            with self.subTest(alteracao=alteracao), self.assertRaises(ValueError):
                Pedido.de_linha(self.linha(**alteracao))

    def test_nao_adivinha_forma_de_pagamento(self):
        with self.assertRaises(ValueError):
            Pedido.de_linha(self.linha(Pagamento="BOLETO"))
        self.assertIn("CHEQUE", mensagem_pagamento(" cheque "))
        self.assertNotIn("CHAVE", pedido_demo().observacoes)


if __name__ == "__main__":
    unittest.main()
