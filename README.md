# Lucas Padilha

[Abrir portfólio](https://lucazbombrim.github.io/)

**Programação, automação de processos e projetos web.**

Sou estudante de Inteligência Artificial e tenho experiência atual com vendas e faturamento de cargas no comércio de grãos e alimentação animal. Meus projetos partem de necessidades que encontro no trabalho, no atendimento e nos estudos.

Estou construindo minha base em **Python, Java, HTML e CSS**. Desenvolvo projetos com apoio de ferramentas de IA e busco uma oportunidade **100% remota** em desenvolvimento júnior, automação, suporte ou áreas comerciais com tecnologia.

## Projetos

| Projeto | Necessidade | Material neste repositório |
| --- | --- | --- |
| [Faturamento de cargas](projetos/faturamento/README.md) | Ler pedidos do Excel, calcular peso e auxiliar no preenchimento de um aplicativo | Código Python demonstrativo, testes e documentação |
| [Mapa de prospecção](projetos/prospeccao/README.md) | Organizar contatos e oportunidades comerciais do setor agropecuário | Demonstração web e estudo de caso |
| [Atlas](projetos/atlas/README.md) | Organizar conteúdos, prática e continuidade dos estudos | Demonstração web e estudo de caso |
| [Cardápio Lollo Cake](projetos/cardapio/README.md) | Facilitar a escolha dos produtos e a montagem do pedido pelo WhatsApp | Demonstração web e estudo de caso |
| [Site MinerMais](projetos/institucional/README.md) | Apresentar o negócio e organizar um catálogo de nutrição animal | Demonstração web e estudo de caso |

O [site do portfólio](https://lucazbombrim.github.io/) apresenta os cinco projetos e uma demonstração interativa de cálculo de cargas. As miniaturas são representações ilustrativas.

### Demonstrações web

- [Atlas — estudos](https://lucazbombrim.github.io/atlas/)
- [Mapa de prospecção — dados fictícios](https://lucazbombrim.github.io/prospeccao/)
- [Cardápio digital Lollo Cake](https://lucazbombrim.github.io/cardapio/)
- [MinerMais — site institucional](https://lucazbombrim.github.io/minermais/)

As demonstrações são versões educacionais para portfólio. Preservam o acesso dos projetos de origem e não divulgam a base de clientes. O cardápio demonstra o carrinho e a mensagem do pedido, sem enviar mensagens ou realizar vendas. As pastas `atlas/`, `prospeccao/`, `cardapio/` e `minermais/` contêm os arquivos estáticos das quatro demonstrações publicadas. Lollo Cake e MinerMais são publicados sem fotos ou anexos; usam ilustrações em SVG e CSS, mantendo as demonstrações de catálogo e carrinho.

## Conhecimentos

- **Python e Java:** fundamentos, em aprendizado.
- **HTML e CSS:** fundamentos, em aprendizado.
- **PyAutoGUI e openpyxl:** aplicação no protótipo de automação.
- **Word e Excel:** curso de 40 horas.
- **Vendas, atendimento e faturamento:** experiência profissional atual.
- **Inglês:** leitura intermediária e conversação em desenvolvimento.

## Formação

- Graduação em **Inteligência Artificial**, em andamento desde 2026; conclusão prevista em 2030.
- Auxiliar Administrativo — 100 horas.
- Microsoft Word e Excel — 40 horas.
- Tecnologia da Informação Básica — 7 horas.

## Explorar localmente

Abra `index.html` no navegador para ver o portfólio. Para usar também as demonstrações, sirva a raiz com `python -m http.server 8000` e abra `http://localhost:8000/`. O mapa usa a biblioteca D3 por CDN; não há dependências npm para instalar.

Para validar e preparar os arquivos do site com Node.js 20 ou superior:

```sh
npm run check
npm run build
```

Para experimentar o cálculo do protótipo Python, sem controlar a tela:

```sh
python projetos/faturamento/bot_faturamento.py --demo
python -m unittest discover -s projetos/faturamento -p 'test_*.py' -v
```

## Publicação

O GitHub Pages usa a raiz da branch `main`. O arquivo `.nojekyll` permite servir os arquivos estáticos diretamente. Veja [PUBLICACAO.md](PUBLICACAO.md).

Há também uma [apresentação para o perfil do GitHub](perfil/README.md), separada do site.

## Contato

[LinkedIn](https://www.linkedin.com/in/lucas-padilha-0a274a262/) · [lpadilha196@gmail.com](mailto:lpadilha196@gmail.com)
