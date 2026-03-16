document.addEventListener("DOMContentLoaded", () => {
    // 1. INICIALIZAÇÃO DE ÍCONES (LUCIDE)
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 2. GERENCIADOR DO MENU MOBILE OVERLAY
    const menu = {
        overlay: document.getElementById("mobile-menu-overlay"),
        trigger: document.getElementById("mobile-menu-trigger"),
        close: document.getElementById("mobile-menu-close"),
        links: document.querySelectorAll(".mobile-nav-link"),
        toggle(state) {
            if (!this.overlay) return;
            this.overlay.classList.toggle("hidden", !state);
            this.overlay.classList.toggle("flex", state);
            document.body.style.overflow = state ? "hidden" : "";
        }
    };

    menu.trigger?.addEventListener("click", () => menu.toggle(true));
    menu.close?.addEventListener("click", () => menu.toggle(false));
    menu.links.forEach(link => link.addEventListener("click", () => menu.toggle(false)));

    // 3. GERENCIADOR DO MODAL E ETAPAS
    const modalManager = {
        el: document.getElementById("consultancy-modal"),
        step1: document.getElementById("modal-step-1"),
        step2: document.getElementById("modal-step-2"),
        open() {
            if (!this.el) return;
            this.el.classList.add("active");
            this.step1.classList.remove("hidden");
            this.step2.classList.add("hidden");
            document.body.style.overflow = "hidden";
        },
        close() {
            this.el.classList.remove("active");
            document.body.style.overflow = "";
        }
    };

    // Gatilhos de abertura (Desktop e Mobile)
    document.querySelectorAll('[data-section="contato"], #btn-contato-hero, #btn-contato-sidebar').forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            modalManager.open();
        });
    });

    // Gatilho de fechamento
    document.getElementById("close-modal")?.addEventListener("click", () => modalManager.close());

    // 4. LÓGICA DO FORMULÁRIO E INTEGRAÇÃO CAL.COM
    const contactForm = document.getElementById("consultancy-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            
            // Envio para Formspree em segundo plano
            try {
                fetch("https://formspree.io/f/xaqpydjo", {
                    method: "POST",
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });
            } catch (err) { console.error("Erro Formspree:", err); }

            // Transição visual de etapas
            modalManager.step1.classList.add("hidden");
            modalManager.step2.classList.remove("hidden");

            // Inicializa o Calendário apenas agora (Economiza performance/JS não usado)
            initCalCom();
        });
    }

    function initCalCom() {
        if (!window.Cal) {
            (function (C, A, L) {
                let p = function (a, ar) { a.q.push(ar); };
                let d = C.document; C.Cal = C.Cal || function () {
                    let cal = C.Cal; let ar = arguments;
                    if (!cal.loaded) {
                        cal.ns = {}; cal.q = cal.q || [];
                        d.head.appendChild(d.createElement("script")).src = A;
                        cal.loaded = true;
                    }
                    if (ar[0] === L) {
                        const api = function () { p(api, arguments); };
                        const namespace = ar[1]; api.q = api.q || [];
                        if (typeof namespace === "string") {
                            cal.ns[namespace] = cal.ns[namespace] || api;
                            p(cal.ns[namespace], ar); p(cal, ["initNamespace", namespace]);
                        } else p(cal, ar); return;
                    } p(cal, ar);
                };
            })(window, "https://app.cal.com/embed/embed.js", "init");
        }
        
        Cal("init", "consultoria", { origin: "https://app.cal.com" });
        Cal("inline", {
            elementOrSelector: "#my-cal-inline-consultoria-tecnica-especializada",
            calLink: "lfa-engenharia",
            config: { 
                layout: "month_view", 
                theme: "dark",
                cssVarsPerTheme: { dark: { "cal-brand": "#E1B14F" } }
            }
        });
    }

    // 5. PERFORMANCE DE SCROLL (BACK TO TOP & SCROLL SPY)
    const backToTop = document.getElementById("back-to-top");
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        const y = window.scrollY;
        
        // Botão Voltar ao Topo
        if (backToTop) {
            const isVisible = y > 500;
            backToTop.classList.toggle("invisible", !isVisible);
            backToTop.classList.toggle("opacity-0", !isVisible);
            backToTop.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";
        }

        // Scroll Spy (Marca link ativo no menu)
        sections.forEach(sec => {
            const top = sec.offsetTop - 150;
            const bottom = top + sec.offsetHeight;
            if (y >= top && y < bottom) {
                navLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${sec.id}`);
                });
            }
        });
    }, { passive: true });
});