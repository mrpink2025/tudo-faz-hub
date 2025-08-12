import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    document.title = "Política de Privacidade - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Política de Privacidade do tudofaz: dados coletados, finalidades, direitos e segurança.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  const updatedAt = "Atualizado em 12/08/2025";

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Política de Privacidade</h1>
        <p className="text-muted-foreground">{updatedAt}</p>
      </header>

      <article className="max-w-none space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Controlador</h2>
          <p>
            O controlador de dados é o tudofaz.com ("Controlador"). Contato do Encarregado (DPO):
            <a className="underline ml-1" href="mailto:dpo@tudofaz.com">dpo@tudofaz.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Dados Pessoais que Coletamos</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Dados de cadastro: e-mail, nome e credenciais.</li>
            <li>Dados de uso: páginas acessadas, interações e logs técnicos.</li>
            <li>Dados de dispositivo e navegador (ex.: endereço IP, identificadores).</li>
            <li>Cookies e tecnologias semelhantes para funcionalidade e análise.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Finalidades de Tratamento</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Autenticação de usuários e gestão de contas.</li>
            <li>Operação da Plataforma, prevenção a fraudes e segurança.</li>
            <li>Comunicações essenciais sobre conta e serviços.</li>
            <li>Melhoria de funcionalidades e experiência do usuário.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Bases Legais (LGPD)</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Execução de contrato e procedimentos preliminares (art. 7º, V).</li>
            <li>Consentimento, quando aplicável (art. 7º, I).</li>
            <li>Legítimo interesse (art. 7º, IX), com avaliação de impacto quando necessário.</li>
            <li>Cumprimento de obrigação legal ou regulatória (art. 7º, II).</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Compartilhamento de Dados</h2>
          <p>Podemos compartilhar dados com provedores essenciais para operar a Plataforma, por exemplo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Infraestrutura e banco de dados (ex.: Supabase).</li>
            <li>Processadores de pagamento (ex.: Stripe) para compras e créditos.</li>
            <li>Serviços de e-mail e suporte.</li>
            <li>Autoridades públicas, quando exigido por lei.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Transferências Internacionais</h2>
          <p>
            Alguns prestadores podem estar localizados fora do Brasil. Nesses casos, adotamos salvaguardas adequadas, como
            cláusulas contratuais padrão ou mecanismos equivalentes.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Retenção</h2>
          <p>
            Mantemos os dados apenas pelo tempo necessário para cumprir as finalidades informadas, observando prazos legais e
            regulatórios aplicáveis.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Cookies</h2>
          <p>
            Utilizamos cookies para autenticação, preferência de idioma e análises de uso. Você pode gerenciá-los no seu
            navegador, ciente de que certas funcionalidades podem ser afetadas.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Segurança</h2>
          <p>
            Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acessos não autorizados,
            perda, alteração ou destruição.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Direitos do Titular</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Acesso, correção, portabilidade e exclusão de dados, quando aplicável.</li>
            <li>Informações sobre compartilhamento e revogação do consentimento.</li>
            <li>Oposição a tratamentos baseados em legítimo interesse, quando couber.</li>
          </ul>
          <p>
            Para exercer seus direitos, entre em contato pelo e-mail
            <a className="underline ml-1" href="mailto:privacidade@tudofaz.com">privacidade@tudofaz.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Crianças e Adolescentes</h2>
          <p>
            A Plataforma não é destinada a menores de 18 anos. Não coletamos, de forma consciente, dados de crianças.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Alterações desta Política</h2>
          <p>
            Podemos atualizar esta Política periodicamente. A versão vigente estará sempre disponível em
            <a className="underline ml-1" href="/privacidade">/privacidade</a>.
          </p>
        </section>

        <section className="space-y-3">
          <p className="text-muted-foreground">
            Leia também nossos <a className="underline" href="/termos">Termos de Uso</a>.
          </p>
        </section>
      </article>
    </main>
  );
};

export default Privacy;
