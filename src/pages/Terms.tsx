import { useEffect } from "react";

const Terms = () => {
  useEffect(() => {
    document.title = "Termos de Uso - tudofaz";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", "Leia os Termos de Uso do tudofaz e entenda as regras de utilização da plataforma.");
    const link = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    link.setAttribute('rel', 'canonical');
    link.setAttribute('href', window.location.href);
    if (!link.parentNode) document.head.appendChild(link);
  }, []);

  return (
    <main className="container py-10">
      <header className="mb-6">
        <h1 className="font-display text-3xl">Termos de Uso</h1>
        <p className="text-muted-foreground">Regras de utilização da plataforma tudofaz.com.</p>
      </header>

      <article className="prose prose-sm sm:prose base max-w-none">
        <section className="mb-6">
          <h2 className="text-xl font-semibold">Concordância ao criar conta</h2>
          <p>Ao criar uma conta no tudofaz.com, você declara que:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Tem mais de 18 anos ou é legalmente emancipado.</li>
            <li>Forneceu informações verdadeiras no cadastro.</li>
            <li>Concorda em utilizar a plataforma de forma ética e dentro da lei.</li>
            <li>Não publicará anúncios de produtos ou serviços proibidos pela legislação vigente.</li>
            <li>Autoriza o tratamento dos seus dados conforme nossa Política de Privacidade.</li>
            <li>Reconhece que anúncios e transações são de responsabilidade dos usuários; o tudofaz.com apenas intermedia a divulgação.</li>
          </ul>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold">Responsabilidades do usuário</h2>
          <p>O usuário é responsável pelo conteúdo dos anúncios publicados, pela veracidade das informações e pelo cumprimento das leis aplicáveis.</p>
        </section>

        <section className="mb-6">
          <h2 className="text-xl font-semibold">Conteúdos proibidos</h2>
          <p>É proibida a publicação de conteúdos que violem leis, direitos de terceiros, ou nossa política interna de moderação.</p>
        </section>

        <section className="mb-6">
          <p className="text-muted-foreground">Para saber como tratamos seus dados, consulte nossa <a className="underline" href="/privacidade">Política de Privacidade</a>.</p>
        </section>
      </article>
    </main>
  );
};

export default Terms;
