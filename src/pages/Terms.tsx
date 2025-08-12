import { useEffect } from "react";

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
        <h1 className="font-display text-3xl">Termos de Uso</h1>
        <p className="text-muted-foreground">{updatedAt}</p>
      </header>

      <article className="max-w-none space-y-8">
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">1. Aceitação dos Termos</h2>
          <p>
            Ao acessar ou utilizar o tudofaz.com ("Plataforma"), você concorda com estes Termos de Uso e com a
            nossa <a className="underline" href="/privacidade">Política de Privacidade</a>. Caso não concorde, não utilize a Plataforma.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">2. Elegibilidade e Conta</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Você declara ter 18 anos ou ser legalmente emancipado.</li>
            <li>Você é responsável por manter a confidencialidade das credenciais de acesso.</li>
            <li>As informações fornecidas devem ser verdadeiras, completas e atualizadas.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">3. Uso da Plataforma</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Utilize a Plataforma de forma ética, respeitando a legislação vigente.</li>
            <li>É vedado burlar mecanismos de segurança, realizar engenharia reversa ou interferir no funcionamento.</li>
            <li>Não utilize a Plataforma para fins ilegais, enganosos ou abusivos.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">4. Anúncios e Conteúdo do Usuário</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Você é o único responsável pelo conteúdo dos seus anúncios e mensagens.</li>
            <li>O conteúdo deve ser lícito, verdadeiro e respeitar direitos de terceiros (incluindo propriedade intelectual).</li>
            <li>Imagens e descrições devem refletir com precisão o produto ou serviço oferecido.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">5. Itens e Serviços Proibidos</h2>
          <p>É proibida a publicação de conteúdos que incluam, por exemplo:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Produtos ilícitos, falsificados, armas, drogas ou materiais perigosos.</li>
            <li>Serviços que violem leis, regulamentos ou direitos de terceiros.</li>
            <li>Conteúdo discriminatório, difamatório, obsceno ou que incite violência.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">6. Pagamentos, Créditos e Taxas</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Pagamentos e créditos na Plataforma podem ser processados por terceiros, como a Stripe.</li>
            <li>O tudofaz.com atua como intermediário de divulgação; transações e acordos são de responsabilidade dos usuários.</li>
            <li>Eventuais taxas e encargos serão comunicados previamente.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">7. Moderação, Suspensão e Remoção</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>Podemos moderar, suspender ou remover contas e conteúdos que violem estes Termos ou a lei.</li>
            <li>Denúncias podem ser analisadas e resultar em medidas proporcionais ao caso.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">8. Propriedade Intelectual</h2>
          <p>
            A marca tudofaz.com, logotipos, layout e software são protegidos por direitos de propriedade intelectual. Você não
            está autorizado a utilizá-los sem permissão expressa.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">9. Limitação de Responsabilidade</h2>
          <p>
            A Plataforma é fornecida "no estado em que se encontra". Na medida permitida em lei, não nos responsabilizamos por
            danos indiretos, lucros cessantes ou perdas decorrentes de uso indevido da Plataforma ou de negócios entre usuários.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">10. Privacidade e Proteção de Dados</h2>
          <p>
            O tratamento de dados pessoais é regido pela nossa <a className="underline" href="/privacidade">Política de Privacidade</a>.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">11. Rescisão</h2>
          <p>
            Você pode encerrar sua conta a qualquer momento. Podemos encerrar ou suspender o acesso em caso de violação destes
            Termos, mediante aviso quando cabível.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">12. Lei Aplicável e Foro</h2>
          <p>
            Estes Termos são regidos pelas leis brasileiras. Fica eleito o foro da Comarca de São Paulo/SP para dirimir
            quaisquer controvérsias, com renúncia a outro, por mais privilegiado que seja.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold">13. Contato</h2>
          <p>
            Dúvidas ou solicitações: <a className="underline" href="mailto:suporte@tudofaz.com">suporte@tudofaz.com</a>.
          </p>
        </section>
      </article>
    </main>
  );
};

export default Terms;
