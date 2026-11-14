# Site do MECT — decisões combinadas com o dono (2026-11-14)

## O que é
Site institucional do **MECT**, a empresa de software (MECT TECNOLOGIA LTDA, CNPJ 66.662.050/0001-42) que desenvolve o
QualiGuide e os demais sistemas. Não é site pessoal.

**Regra de texto:** "MECT" vem do nome do dono. Sempre "o MECT" (masculino) ou construção neutra. Nunca "a MECT"
(o mockup usa "a MECT": corrigido no site).

## Para quem e para quê
Visitante vem **conhecer a empresa, os serviços que ela presta e os produtos à venda** (palavras do dono: "Conhecer a
empresa serviços e produtos a venda"). Ação principal: falar com o MECT (WhatsApp / e-mail) ou ir ao site do produto.

## Referência de design
Mockup do dono: `_docs/mockup-home.png` (original "Landing Page MECT Tecnologia_ Soluções Digitais.png"; `_docs/` não é publicado).
Ordem da home: cabeçalho (Início, Serviços, Produtos, Sobre, Contato + "Fale com a gente") → hero → Nossos serviços →
Nossos produtos → Por que escolher o MECT → faixa de números → faixa "Sua próxima solução começa com uma conversa" →
rodapé. O mockup é referência de design, não de conteúdo.

## Conteúdo (fontes)
- Contato, cidade e horário: site antigo `GitHub/MECT-WEBSITE` (contato@mect.com.br, +55 62 99405-0744, Goiânia–GO,
  seg–sex 8h30–18h). Textos do site antigo podem ser usados como base factual (mesmo dono); a home ganha texto novo.
- Serviços: **Web design**, **Consultoria em TI** (do mockup) e **Desenvolvimento sob medida** (do site antigo).
- Produtos: **QualiGuide** → https://qualiguide.com.br ; **WatchDesk** (sem site próprio) → pedir demonstração.
- Faixa de números, confirmada pelo dono:
  - **10+ anos** de atuação em soluções para saúde (confirmado)
  - **600+ usuários** atendidos pelos sistemas (dado do dono, somando os usuários de IOG e IHG; não conferido por nós)
  - **2 produtos próprios** (QualiGuide e WatchDesk)
  - "50+ projetos entregues" do mockup **não é real**: removido.
- Clientes (IOG, IHG) **não são citados por nome** na home; seção "Clientes" só com autorização deles.

## Como é feito
- HTML/CSS/JS puros, uma página por enquanto (como o QualiGuide). Sem framework; sem build enquanto for só a home.
  Build mínimo (modelo do IOG) só quando houver várias páginas internas.
- Fonte Satoshi servida pelo próprio site (mesmos arquivos do QualiGuide), sem Google Fonts.
- Contato sem formulário que guarda dado (sem servidor, sem questão de LGPD): WhatsApp e e-mail.
- Hospedagem: **GitHub Pages** (projeto nosso, simples). Prévia primeiro; domínio (mect.app ou mect.com.br) decidido
  na hora de publicar. O e-mail Zoho do mect.com.br (MX/SPF/DKIM) **não pode ser mexido**. Hoje mect.app e mect.com.br
  redirecionam (301, regra na Cloudflare) para qualiguide.com.br.
- Push e DNS só com o aval do dono no chat.

## Abordagens consideradas
1. **HTML/CSS/JS puro, página única** — escolhida: abre em qualquer lugar, nada a manter, Lighthouse alto.
2. Build mínimo em Node com layout compartilhado (IOG) — fica para quando vierem páginas internas.
3. Framework (Next/Astro) — descartado: peso sem ganho para site institucional.

## Fica para depois
Ver `_docs/pendencias-conteudo.md`.
