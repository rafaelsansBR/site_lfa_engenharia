document.addEventListener("DOMContentLoaded", () => {
  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href").substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Scroll Spy
  const sections = document.querySelectorAll("section");
  const navLinks = document.querySelectorAll(
    "aside nav a, #mobile-menu-overlay nav a",
  );

  function onScroll() {
    const scrollPosition = window.scrollY + window.innerHeight / 3;
    let currentSectionId = "hero";

    for (let i = sections.length - 1; i >= 0; i--) {
      const section = sections[i];
      if (section.offsetTop <= scrollPosition) {
        currentSectionId = section.getAttribute("id");
        break;
      }
    }

    navLinks.forEach((link) => {
      const hrefAttr = link.getAttribute("href");
      const section =
        link.getAttribute("data-section") ||
        (hrefAttr && hrefAttr.startsWith("#") ? hrefAttr.substring(1) : "");
      if (section === currentSectionId) {
        link.classList.add("bg-[#E1B14F]", "text-black");
        link.classList.remove(
          "text-gray-400",
          "hover:bg-[#E1B14F]",
          "hover:text-black",
        );
      } else {
        link.classList.remove("bg-[#E1B14F]", "text-black");
        link.classList.add(
          "text-gray-400",
          "hover:bg-[#E1B14F]",
          "hover:text-black",
        );
      }
    });
  }

  window.addEventListener("scroll", onScroll);
  onScroll(); // Initial check

  // Modal logic
  const modal = document.getElementById("consultancy-modal");
  const btnHero = document.getElementById("btn-contato-hero");
  const btnSidebar = document.getElementById("btn-contato-sidebar");
  const btnMobile = document.getElementById("btn-contato-mobile");
  const closeBtn = document.getElementById("close-modal");
  const form = document.getElementById("consultancy-form");
  const step1 = document.getElementById("modal-step-1");
  const step2 = document.getElementById("modal-step-2");

  const openModal = (e) => {
    if (e) e.preventDefault();
    modal.classList.add("active");
    step1.classList.remove("hidden");
    step2.classList.add("hidden");
  };

  const closeModal = () => {
    modal.classList.remove("active");
  };

  if (btnHero) btnHero.addEventListener("click", openModal);
  if (btnSidebar) btnSidebar.addEventListener("click", openModal);
  if (btnMobile) btnMobile.addEventListener("click", openModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Send form data to Formspree
      const formData = new FormData(form);
      try {
        await fetch("https://formspree.io/f/xaqpydjo", {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });
      } catch (error) {
        console.error("Error submitting form:", error);
      }

      // 1. Mostra a etapa e limpa o container para garantir
      document.getElementById("modal-step-1").style.display = "none";
      const container = document.getElementById("modal-step-2");
      container.style.display = "block";

      // 2. Injeta o motor do Cal.com e inicializa TUDO de uma vez
      (function (C, A, L) {
        let p = function (a, ar) {
          a.q.push(ar);
        };
        let d = C.document;
        C.Cal =
          C.Cal ||
          function () {
            let cal = C.Cal;
            let ar = arguments;
            if (!cal.loaded) {
              cal.ns = {};
              cal.q = cal.q || [];
              d.head.appendChild(d.createElement("script")).src = A;
              cal.loaded = true;
            }
            if (ar[0] === L) {
              const api = function () {
                p(api, arguments);
              };
              const namespace = ar[1];
              api.q = api.q || [];
              if (typeof namespace === "string") {
                cal.ns[namespace] = cal.ns[namespace] || api;
                p(cal.ns[namespace], ar);
                p(cal, ["initNamespace", namespace]);
              } else p(cal, ar);
              return;
            }
            p(cal, ar);
          };
      })(window, "https://app.cal.com/embed/embed.js", "init");

      Cal("init", "consultoria", { origin: "https://app.cal.com" });
      Cal("inline", {
        elementOrSelector: "#my-cal-inline-consultoria-tecnica-especializada",
        calLink: "lfa-engenharia",
        config: {
          layout: "month_view",
          theme: "dark",
          cssVarsPerTheme: {
            dark: { "cal-brand": "#E1B14F" },
          },
        },
      });
    });
  }

  // Checklist form logic
  const checklistForm = document.getElementById("form-checklist");
  if (checklistForm) {
    checklistForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(checklistForm);
      try {
        const response = await fetch(checklistForm.action, {
          method: "POST",
          body: formData,
          headers: { Accept: "application/json" },
        });

        if (response.ok) {
          checklistForm.style.display = "none";
          document
            .getElementById("success-message-checklist")
            .classList.remove("hidden");
        } else {
          alert("Erro ao enviar. Tente novamente.");
        }
      } catch (error) {
        console.error("Error submitting form:", error);
        alert("Erro ao enviar. Tente novamente.");
      }
    });
  }

  // Swiper Initialization
  const swiper = new Swiper(".solucoes-swiper", {
    slidesPerView: 1,
    spaceBetween: 20,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      640: {
        slidesPerView: 2,
        spaceBetween: 20,
      },
      1024: {
        slidesPerView: 3,
        spaceBetween: 30,
      },
      1280: {
        slidesPerView: 4,
        spaceBetween: 30,
      },
    },
  });

  // Mobile Menu Overlay Logic
  const mobileMenuTrigger = document.getElementById("mobile-menu-trigger");
  const mobileMenuOverlay = document.getElementById("mobile-menu-overlay");
  const mobileMenuClose = document.getElementById("mobile-menu-close");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");

  if (mobileMenuTrigger && mobileMenuOverlay && mobileMenuClose) {
    const closeMobileMenu = () => {
      mobileMenuOverlay.classList.remove("active");
      document.body.style.overflow = "";
    };

    mobileMenuTrigger.addEventListener("click", () => {
      mobileMenuOverlay.classList.add("active");
      document.body.style.overflow = "hidden"; // Prevent background scrolling
    });

    mobileMenuClose.addEventListener("click", closeMobileMenu);

    mobileNavLinks.forEach((link) => {
      link.addEventListener("click", closeMobileMenu);
    });
  }

  if (typeof lucide !== "undefined") {
    lucide.createIcons();
  }

  // Ativação dos Modais Legais
  const privModal = document.getElementById("modal-privacidade");
  const termsModal = document.getElementById("modal-termos");

  document.getElementById("btn-privacidade")?.addEventListener("click", () => {
    privModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  document.getElementById("btn-termos")?.addEventListener("click", () => {
    termsModal.classList.add("active");
    document.body.style.overflow = "hidden";
  });

  // Fechamento ao clicar no fundo escuro ou no X
  document.querySelectorAll('.legal-modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
          if (e.target === modal || e.target.closest('.close-legal')) {
              modal.classList.remove('active');
              document.body.style.overflow = '';
          }
      });
  });
});
