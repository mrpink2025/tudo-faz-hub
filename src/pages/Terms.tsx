import { useEffect } from "react";
import { TranslatedText } from "@/components/ui/translated-text";

const Terms = () => {
  useEffect(() => {
    document.title = "Termos de Uso - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Termos de Uso completos do tudofaz: regras, responsabilidades e condições.");
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
          <TranslatedText text="Termos de Uso" domain="legal" />
        </h1>
        <p className="text-muted-foreground">
          <TranslatedText text={updatedAt} domain="legal" />
        </p>
      </header>

      <article className="max-w-none space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="1. Aceitação dos Termos" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Ao acessar ou utilizar o tudofaz.com (&quot;Plataforma&quot;), você concorda com estes Termos de Uso e com a nossa" domain="legal" />
            {" "}
            <a className="underline" href="/privacidade">
              <TranslatedText text="Política de Privacidade" domain="legal" />
            </a>
            . <TranslatedText text="Caso não concorde, não utilize a Plataforma." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="2. Elegibilidade e Conta" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Você declara ter 18 anos ou ser legalmente emancipado." domain="legal" /></li>
            <li><TranslatedText text="Você é responsável por manter a confidencialidade das credenciais de acesso." domain="legal" /></li>
            <li><TranslatedText text="As informações fornecidas devem ser verdadeiras, completas e atualizadas." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="3. Uso da Plataforma" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Utilize a Plataforma de forma ética, respeitando a legislação vigente." domain="legal" /></li>
            <li><TranslatedText text="É vedado burlar mecanismos de segurança, realizar engenharia reversa ou interferir no funcionamento." domain="legal" /></li>
            <li><TranslatedText text="Não utilize a Plataforma para fins ilegais, enganosos ou abusivos." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="4. Anúncios e Conteúdo do Usuário" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Você é o único responsável pelo conteúdo dos seus anúncios e mensagens." domain="legal" /></li>
            <li><TranslatedText text="O conteúdo deve ser lícito, verdadeiro e respeitar direitos de terceiros (incluindo propriedade intelectual)." domain="legal" /></li>
            <li><TranslatedText text="Imagens e descrições devem refletir com precisão o produto ou serviço oferecido." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="5. Itens e Serviços Proibidos" domain="legal" />
          </h2>
          <p><TranslatedText text="É proibida a publicação de conteúdos que incluam, por exemplo:" domain="legal" /></p>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Produtos ilícitos, falsificados, armas, drogas ou materiais perigosos." domain="legal" /></li>
            <li><TranslatedText text="Serviços que violem leis, regulamentos ou direitos de terceiros." domain="legal" /></li>
            <li><TranslatedText text="Conteúdo discriminatório, difamatório, obsceno ou que incite violência." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="6. Pagamentos, Créditos e Taxas" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Pagamentos e créditos na Plataforma podem ser processados por terceiros, como a Stripe." domain="legal" /></li>
            <li><TranslatedText text="O tudofaz.com atua como intermediário de divulgação; transações e acordos são de responsabilidade dos usuários." domain="legal" /></li>
            <li><TranslatedText text="Eventuais taxas e encargos serão comunicados previamente." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="7. Moderação, Suspensão e Remoção" domain="legal" />
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            <li><TranslatedText text="Podemos moderar, suspender ou remover contas e conteúdos que violem estes Termos ou a lei." domain="legal" /></li>
            <li><TranslatedText text="Denúncias podem ser analisadas e resultar em medidas proporcionais ao caso." domain="legal" /></li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="8. Propriedade Intelectual" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="A marca tudofaz.com, logotipos, layout e software são protegidos por direitos de propriedade intelectual. Você não está autorizado a utilizá-los sem permissão expressa." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="9. Limitação de Responsabilidade" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="A Plataforma é fornecida &quot;no estado em que se encontra&quot;. Na medida permitida em lei, não nos responsabilizamos por danos indiretos, lucros cessantes ou perdas decorrentes de uso indevido da Plataforma ou de negócios entre usuários." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="10. Privacidade e Proteção de Dados" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="O tratamento de dados pessoais é regido pela nossa" domain="legal" />
            {" "}
            <a className="underline" href="/privacidade">
              <TranslatedText text="Política de Privacidade" domain="legal" />
            </a>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="11. Rescisão" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Você pode encerrar sua conta a qualquer momento. Podemos encerrar ou suspender o acesso em caso de violação destes Termos, mediante aviso quando cabível." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="12. Lei Aplicável e Foro" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de São Paulo/SP para dirimir quaisquer controvérsias, com renúncia a outro, por mais privilegiado que seja." domain="legal" />
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">
            <TranslatedText text="13. Contato" domain="legal" />
          </h2>
          <p>
            <TranslatedText text="Dúvidas ou solicitações:" domain="legal" />
            {" "}
            <a className="underline" href="mailto:suporte@tudofaz.com">suporte@tudofaz.com</a>
            .
          </p>
        </section>
      </article>
    </main>
  );
};

export default Terms;
