import { useEffect } from "react";
import { TranslatedText } from "@/components/ui/translated-text";
import { ChunkedTranslatedText } from "@/components/ui/chunked-translated-text";

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
        <h1 className="font-display text-3xl">
          <TranslatedText text="Política de Privacidade" domain="legal" />
        </h1>
        <p className="text-muted-foreground">
          <TranslatedText text={updatedAt} domain="legal" />
        </p>
      </header>

      <article className="max-w-none space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="1. Controlador" domain="legal" />
          </h2>
          <p>
            <ChunkedTranslatedText text="O controlador de dados é o tudofaz.com ('Controlador'). Contato do Encarregado (DPO):" domain="legal" as="span" />
            <a className="underline ml-1" href="mailto:dpo@tudofaz.com">dpo@tudofaz.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="2. Dados Pessoais que Coletamos" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Dados de cadastro: e-mail, nome e credenciais." domain="legal" /></li>
            <li><TranslatedText text="Dados de uso: páginas acessadas, interações e logs técnicos." domain="legal" /></li>
            <li><TranslatedText text="Dados de dispositivo e navegador (ex.: endereço IP, identificadores)." domain="legal" /></li>
            <li><TranslatedText text="Cookies e tecnologias semelhantes para funcionalidade e análise." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="3. Finalidades de Tratamento" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Autenticação de usuários e gestão de contas." domain="legal" /></li>
            <li><TranslatedText text="Operação da Plataforma, prevenção a fraudes e segurança." domain="legal" /></li>
            <li><TranslatedText text="Comunicações essenciais sobre conta e serviços." domain="legal" /></li>
            <li><TranslatedText text="Melhoria de funcionalidades e experiência do usuário." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="4. Bases Legais (LGPD)" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Execução de contrato e procedimentos preliminares (art. 7º, V)." domain="legal" /></li>
            <li><TranslatedText text="Consentimento, quando aplicável (art. 7º, I)." domain="legal" /></li>
            <li><TranslatedText text="Legítimo interesse (art. 7º, IX), com avaliação de impacto quando necessário." domain="legal" /></li>
            <li><TranslatedText text="Cumprimento de obrigação legal ou regulatória (art. 7º, II)." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="5. Compartilhamento de Dados" domain="legal" />
          </h2>
          <p>
            <ChunkedTranslatedText text="Podemos compartilhar dados com provedores essenciais para operar a Plataforma, por exemplo:" domain="legal" as="span" />
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Infraestrutura e banco de dados (ex.: Supabase)." domain="legal" /></li>
            <li><TranslatedText text="Processadores de pagamento (ex.: Stripe) para compras e créditos." domain="legal" /></li>
            <li><TranslatedText text="Serviços de e-mail e suporte." domain="legal" /></li>
            <li><TranslatedText text="Autoridades públicas, quando exigido por lei." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="6. Transferências Internacionais" domain="legal" />
          </h2>
          <p>
            <ChunkedTranslatedText text="Alguns prestadores podem estar localizados fora do Brasil. Nesses casos, adotamos salvaguardas adequadas, como cláusulas contratuais padrão ou mecanismos equivalentes." domain="legal" as="span" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="7. Retenção" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Mantemos os dados apenas pelo tempo necessário para cumprir as finalidades informadas, observando prazos legais e regulatórios aplicáveis." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="8. Cookies" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Utilizamos cookies para autenticação, preferência de idioma e análises de uso. Você pode gerenciá-los no seu navegador, ciente de que certas funcionalidades podem ser afetadas." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="9. Segurança" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Adotamos medidas técnicas e organizacionais razoáveis para proteger os dados contra acessos não autorizados, perda, alteração ou destruição." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="10. Direitos do Titular" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Acesso, correção, portabilidade e exclusão de dados, quando aplicável." domain="legal" /></li>
            <li><TranslatedText text="Informações sobre compartilhamento e revogação do consentimento." domain="legal" /></li>
            <li><TranslatedText text="Oposição a tratamentos baseados em legítimo interesse, quando couber." domain="legal" /></li>
          </ul>
          <p>
            <TranslatedText text="Para exercer seus direitos, entre em contato pelo e-mail" domain="legal" />
            <a className="underline ml-1" href="mailto:privacidade@tudofaz.com">privacidade@tudofaz.com</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="11. Crianças e Adolescentes" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="A Plataforma não é destinada a menores de 18 anos. Não coletamos, de forma consciente, dados de crianças." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="12. Alterações desta Política" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Podemos atualizar esta Política periodicamente. A versão vigente estará sempre disponível em" domain="legal" />
            <a className="underline ml-1" href="/privacidade">/privacidade</a>.
          </p>
        </section>

        <section className="space-y-3">
          <p className="text-muted-foreground">
            <TranslatedText text="Leia também nossos" domain="legal" /> <a className="underline" href="/termos"><TranslatedText text="Termos de Uso" domain="legal" /></a>.
          </p>
        </section>
      </article>
    </main>
  );
};

export default Privacy;
