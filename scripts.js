document.addEventListener("DOMContentLoaded", () => {
    // 1. Ícones Lucide (Carregamento Inteligente)
    const loadIcons = () => {
        if (typeof lucide !== 'undefined') lucide.createIcons();
        else setTimeout(loadIcons, 100);
    };
    loadIcons();

    // 2. Menu Mobile Overlay (Auto-close e Lock Scroll)
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
    menu.links.forEach(l => l.addEventListener("click", () => menu.toggle(false)));

    // 3. Scroll Spy (Navegação Ativa) & Back to Top
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section");
    const topBtn = document.getElementById("back-to-top");

    const handleScroll = () => {
        const y = window.scrollY;
        
        // Botão Topo
        if (topBtn) {
            if (y > 500) {
                topBtn.classList.remove("invisible", "opacity-0");
                topBtn.style.transform = "translateY(0)";
            } else {
                topBtn.classList.add("invisible", "opacity-0");
                topBtn.style.transform = "translateY(20px)";
            }
        }

        // Active Link Spy
        sections.forEach(sec => {
            const top = sec.offsetTop - 150;
            const bottom = top + sec.offsetHeight;
            if (y >= top && y < bottom) {
                navLinks.forEach(link => {
                    link.classList.toggle("active", link.getAttribute("href") === `#${sec.id}`);
                });
            }
        });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // 4. Modal Manager (Apenas carrega o Cal.com quando necessário)
    const openModal = () => {
        const modal = document.getElementById("consultancy-modal");
        if (modal) modal.classList.add("active");
        // Se houver necessidade de injetar o Cal.com aqui, a lógica anterior pode ser mantida
    };

    document.querySelectorAll('[data-section="contato"], #btn-contato-hero').forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            openModal();
        });
    });
});