/* "Baixar PDF" — gera o arquivo direto (sem diálogo de impressão), com:
   · NOME DE ARQUIVO garantido  → doc.save('Proposta P-XXXX - Cliente.pdf')
   · LINKS CLICÁVEIS            → anotações sobre e-mail / site / telefone
   · APARÊNCIA 100% FIEL        → cada folha .doc-page é rasterizada (a mesma
                                  que você vê na prévia) e colada em A4.

   Por que rasterizado? É a única forma de garantir, em qualquer navegador,
   que o arquivo saia idêntico à prévia (ícones, logo, espaçamentos, cores e
   quebras de página) E com o nome certo. Os links continuam clicáveis porque
   desenhamos anotações de link (vetoriais) por cima das áreas do e-mail/site.
   (Trade-off: o texto vira imagem, não selecionável — em troca, fidelidade
   total + links + nome corretos.) */
(function () {
  function settle() {
    return new Promise((res) => {
      let done = false;
      const finish = () => { if (done) return; done = true; res(); };
      const raf = () => requestAnimationFrame(() => requestAnimationFrame(finish));
      // garante que a Outfit (inline data-URI) esteja realmente carregada nos
      // pesos usados ANTES de rasterizar — senão o html2canvas captura uma
      // fonte de fallback (métricas diferentes) e o texto sai descentralizado.
      const fonts = (document.fonts && document.fonts.load) ? Promise.all([
        document.fonts.load('400 14px Outfit'), document.fonts.load('500 14px Outfit'),
        document.fonts.load('600 12px Outfit'), document.fonts.load('700 24px Outfit'),
        document.fonts.load('800 28px Outfit'),
      ]).then(() => document.fonts.ready) : Promise.resolve();
      fonts.then(raf, raf);
      setTimeout(finish, 2500);
    });
  }

  // NOTA: a função liftTextForRaster foi REMOVIDA.
  // Ela tentava corrigir um deslocamento cosmético de ~6px na baseline do
  // html2canvas envolvendo cada nó de texto num <span> posicionado. Porém,
  // qualquer manipulação do DOM no clone dispara bugs graves do html2canvas:
  //   - Colapso de espaços entre palavras ("Lucas Feitosa" → "LucasFeitosa")
  //   - Corte de textos multi-linha (introdução cortada)
  //   - Expansão de colunas em tabelas/flex (layout quebrado)
  //   - Desalinhamento de ícones SVG em relação ao texto
  // A solução definitiva é NÃO manipular o DOM do clone. O PDF agora
  // renderiza exatamente igual à tela — fiel pixel a pixel.

  async function downloadProposalPdf(p, opts) {
    opts = opts || {};
    const h2c = window.html2canvas;
    const jsPDF = window.jspdf && window.jspdf.jsPDF;
    const pages = Array.from(document.querySelectorAll('.doc-page'));
    if (!h2c || !jsPDF || !pages.length) { window.print(); return; }

    if (window.lucide && window.lucide.createIcons) { try { window.lucide.createIcons(); } catch (e) {} }
    await settle();

    // neutraliza a escala de tela p/ capturar cada folha em tamanho natural
    const sizer = document.querySelector('.doc-sizer');
    const wrap = document.querySelector('.doc-pages');
    const saved = [];
    const stash = (el, props) => { if (!el) return; const s = {}; props.forEach((k) => { s[k] = el.style[k]; }); saved.push([el, s]); };
    stash(sizer, ['width', 'height']);
    stash(wrap, ['transform']);
    if (sizer) { sizer.style.width = 'auto'; sizer.style.height = 'auto'; }
    if (wrap) { wrap.style.transform = 'none'; }
    const pageStash = pages.map((el) => ({ el, br: el.style.borderRadius, bs: el.style.boxShadow, bd: el.style.border }));
    pages.forEach((el) => { el.style.borderRadius = '0'; el.style.boxShadow = 'none'; el.style.border = 'none'; });
    await settle();

    const doc = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
    const PW = doc.internal.pageSize.getWidth();
    const PH = doc.internal.pageSize.getHeight();

    try {
      for (let i = 0; i < pages.length; i++) {
        const el = pages[i];
        const pw = el.offsetWidth, ph = el.offsetHeight;
        const sx = PW / pw, sy = PH / ph;           // px → pt por eixo
        const canvas = await h2c(el, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false, width: pw, height: ph, windowWidth: pw, windowHeight: ph });
        if (i > 0) doc.addPage();
        doc.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PW, PH, undefined, 'FAST');

        // anotações de link clicáveis sobre cada <a href> da folha
        const base = el.getBoundingClientRect();
        el.querySelectorAll('a[href]').forEach((a) => {
          const url = a.getAttribute('href'); if (!url) return;
          const r = a.getBoundingClientRect();
          const x = (r.left - base.left) * sx, y = (r.top - base.top) * sy;
          const w = r.width * sx, h = r.height * sy;
          if (w > 0 && h > 0) doc.link(x, y, w, h, { url });
        });
      }
    } finally {
      pageStash.forEach((s) => { s.el.style.borderRadius = s.br; s.el.style.boxShadow = s.bs; s.el.style.border = s.bd; });
      saved.forEach(([el, s]) => { Object.keys(s).forEach((k) => { el.style[k] = s[k]; }); });
    }

    // nome do arquivo garantido (cliente + código base sem sufixo de revisão)
    const safe = ((p && p.cliente) || 'Proposta')
      .replace(/[—–]/g, '-').replace(/[^\w\sÀ-ÿ-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60) || 'Proposta';
    const baseCode = p && p.id ? window.formatProposalCode(p.id).base : '';
    doc.save('Proposta ' + baseCode + ' - ' + safe + '.pdf');
    return Promise.resolve();
  }

  window.downloadProposalPdf = downloadProposalPdf;
})();
