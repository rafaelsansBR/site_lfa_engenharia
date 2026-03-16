document.addEventListener("DOMContentLoaded", () => {
    // 1. Inicialização Lucide
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Menu Mobile Manager
    const menu = {
        overlay: document.getElementById("mobile-menu-overlay"),
        trigger: document.getElementById("mobile-menu-trigger"),
        close: document.getElementById("mobile-menu-close"),
        links: document.querySelectorAll(".mobile-nav-link"),
        
        toggle(state) {
            this.overlay.classList.toggle("hidden", !state);
            this.overlay.classList.toggle("flex", state);
            document.body.style.overflow = state ? "hidden" : "";
        }
    };

    menu.trigger?.addEventListener("click", () => menu.toggle(true));
    menu.close?.addEventListener("click", () => menu.toggle(false));
    menu.links.forEach(link => link.addEventListener("click", () => menu.toggle(false)));

    // 3. Modal & Agendamento
    const modalManager = {
        el: document.getElementById("consultancy-modal"),
        step1: document.getElementById("modal-step-1"),
        step2: document.getElementById("modal-step-2"),
        
        open() {
            this.el.classList.add("active");
            this.step1.classList.remove("hidden");
            this.step2.classList.add("hidden");
        },
        close() {
            this.el.classList.remove("active");
        }
    };

    document.querySelectorAll('[data-section="contato"], #btn-contato-hero').forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            modalManager.open();
        });
    });

    // 4. Form Submission & Cal.com Integration
    const contactForm = document.getElementById("consultancy-form");
    if (contactForm) {
        contactForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(contactForm);
            
            // Envio Formspree
            fetch("https://formspree.io/f/xaqpydjo", {
                method: "POST",
                body: formData,
                headers: { 'Accept': 'application/json' }
            });

            // Transição UI
            modalManager.step1.classList.add("hidden");
            modalManager.step2.classList.remove("hidden");

            // Init Cal.com
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
            config: { layout: "month_view", theme: "dark" }
        });
    }

    // 5. Scroll Performance (Back to Top & Nav Active)
    const backToTop = document.getElementById("back-to-top");
    const sections = document.querySelectorAll("section");
    const sideLinks = document.querySelectorAll(".nav-link");

    window.addEventListener("scroll", () => {
        const scrollY = window.scrollY;
        
        // Back to top visible logic
        if (backToTop) {
            const isVisible = scrollY > 500;
            backToTop.classList.toggle("opacity-0", !isVisible);
            backToTop.classList.toggle("invisible", !isVisible);
            backToTop.style.transform = isVisible ? "translateY(0)" : "translateY(20px)";
        }

        // Scroll Spy
        sections.forEach(sec => {
            const offset = sec.offsetTop - 200;
            const height = sec.offsetHeight;
            const id = sec.getAttribute('id');

            if (scrollY >= offset && scrollY < offset + height) {
                sideLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
                });
            }
        });
    }, { passive: true });
});