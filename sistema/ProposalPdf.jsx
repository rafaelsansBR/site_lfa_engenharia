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

  // CORREÇÃO DE RASTER: o html2canvas desenha a baseline do texto mais baixa
  // que o navegador, por um valor PROPORCIONAL ao tamanho da fonte
  // (≈0,46 × font-size, medido empiricamente — não é constante). Como afeta
  // TODO texto, só notamos onde o texto encosta num gráfico (número no círculo,
  // "Investimento Total" no box, ícone × título). A correção envolve cada FOLHA
  // de texto num <span> inline e o levanta por 0,48 × font-size — SOMENTE no
  // clone capturado, sem mexer no DOM em tela. Gráficos (círculos, boxes,
  // bordas, ícones SVG) não se movem, então tudo volta a alinhar com <0,5px.
  const RASTER_LIFT_K = 0.48;
  function liftTextForRaster(clonedDoc) {
    try {
      const win = clonedDoc.defaultView || window;
      const scope = clonedDoc.querySelector('.doc-sizer') || clonedDoc.body;
      if (!scope) return;
      // Percorre TODO NÓ DE TEXTO (não elementos) e envolve cada um num <span>
      // inline elevado por 0,48 × font-size do pai. Operar em nós de texto (e
      // não em elementos-folha) é essencial: assim um texto solto que convive
      // com um elemento irmão (conteúdo misto, ex.: "Nº " + <span>id</span>)
      // também é elevado — senão metade subiria e metade não (desalinhamento).
      const walker = clonedDoc.createTreeWalker(scope, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      let n;
      while ((n = walker.nextNode())) { if (n.nodeValue && /\S/.test(n.nodeValue)) nodes.push(n); }
      nodes.forEach((tn) => {
        const parent = tn.parentNode;
        // FIX: O html2canvas possui bugs graves de renderização de texto:
        // 1. Colapsa espaços entre palavras se o texto estiver dentro de span inline
        //    com transform/position (ex: "Lucas Feitosa" vira "LucasFeitosa").
        // 2. Corta o texto que quebra em múltiplas linhas se estiver ajustado.
        // SOLUÇÃO COMBINADA:
        // - Para textos curtos/médios (<= 60 chars) que cabem em uma linha:
        //   Substituímos os espaços por NBSP (\u00A0) para evitar o colapso,
        //   e usamos inline-block + transform para corrigir o alinhamento.
        // - Para textos LONGOS (> 60 chars), como descrições e parágrafos:
        //   nós IGNORAMOS a correção. Eles renderizam ~6px mais baixos, mas
        //   garantimos que a quebra de linha natural não seja cortada.
        if (tn.nodeValue.trim().length > 60) return;

        tn.nodeValue = tn.nodeValue.replace(/ /g, '\u00A0');

        const fs = parseFloat(win.getComputedStyle(parent).fontSize) || 14;
        const span = clonedDoc.createElement('span');
        span.style.display = 'inline-block';
        span.style.transform = `translateY(-${RASTER_LIFT_K * fs}px)`;
        parent.replaceChild(span, tn);
        span.appendChild(tn);
      });
    } catch (e) {}
  }

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
        const canvas = await h2c(el, { scale: 3, backgroundColor: '#ffffff', useCORS: true, logging: false, width: pw, height: ph, windowWidth: pw, windowHeight: ph, onclone: liftTextForRaster });
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
