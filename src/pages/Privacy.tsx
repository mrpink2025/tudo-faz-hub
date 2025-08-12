import { useEffect } from "react";

const Privacy = () => {
  useEffect(() => {
    document.title = "Política de Privacidade - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Entenda como o tudofaz coleta, usa e protege seus dados pessoais.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Política de Privacidade</h1>
        <p className="text-muted-foreground">Como coletamos, utilizamos e protegemos seus dados no tudofaz.com.</p>
      </header>

      <article className="prose prose-sm sm:prose base max-w-none">
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Coleta de dados</h2>
          <p>Coletamos dados fornecidos por você (ex.: e-mail, nome) e dados de uso para melhorar a experiência na plataforma.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Uso de dados</h2>
          <p>Utilizamos seus dados para autenticação, comunicação, prevenção a fraudes e melhoria dos serviços.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Compartilhamento</h2>
          <p>Podemos compartilhar dados com provedores de serviço essenciais (por exemplo, meios de pagamento) sempre com base legal aplicável.</p>
        </section>
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Seus direitos</h2>
          <p>Você pode solicitar acesso, correção ou exclusão dos seus dados. Entre em contato pelo canal de suporte disponível na plataforma.</p>
        </section>
        <section className="mb-6">
          <p className="text-muted-foreground">Leia também nossos <a className="underline" href="/termos">Termos de Uso</a>.</p>
        </section>
      </article>
    </main>
  );
};

export default Privacy;
