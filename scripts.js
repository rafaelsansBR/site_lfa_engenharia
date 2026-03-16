document.addEventListener("DOMContentLoaded", () => {
    // 1. Iniciar Ícones
    if (typeof lucide !== 'undefined') lucide.createIcons();

    // 2. Navegação Mobile Overlay
    const menu = {
        overlay: document.getElementById("mobile-menu-overlay"),
        trigger: document.getElementById("mobile-menu-trigger"),
        close: document.getElementById("mobile-menu-close"),
        links: document.querySelectorAll(".mobile-nav-link"),
        toggle(s) {
            this.overlay.style.display = s ? "flex" : "none";
            document.body.style.overflow = s ? "hidden" : "";
        }
    };
    menu.trigger?.addEventListener("click", () => menu.toggle(true));
    menu.close?.addEventListener("click", () => menu.toggle(false));
    menu.links.forEach(l => l.addEventListener("click", () => menu.toggle(false)));

    // 3. Modal de Consultoria
    const modal = {
        el: document.getElementById("consultancy-modal"),
        steps: [document.getElementById("modal-step-1"), document.getElementById("modal-step-2")],
        open() { this.el.classList.add("active"); this.steps[0].classList.remove("hidden"); },
        close() { this.el.classList.remove("active"); }
    };
    document.querySelectorAll('[data-section="contato"], #btn-contato-hero').forEach(b => b.addEventListener("click", () => modal.open()));
    document.getElementById("close-modal")?.addEventListener("click", () => modal.close());

    // 4. Scroll Spy & Back to Top
    const navLinks = document.querySelectorAll(".nav-link");
    const sections = document.querySelectorAll("section");
    const topBtn = document.getElementById("back-to-top");

    window.addEventListener("scroll", () => {
        const y = window.scrollY;
        if(topBtn) topBtn.style.opacity = y > 500 ? "1" : "0";

        sections.forEach(s => {
            const top = s.offsetTop - 150;
            if (y >= top && y < top + s.offsetHeight) {
                navLinks.forEach(l => {
                    l.classList.toggle("active", l.getAttribute("href") === `#${s.id}`);
                });
            }
        });
    }, { passive: true });
});