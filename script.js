// Ensure website always starts from top only on open or reload
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener('beforeunload', () => window.scrollTo(0, 0));
window.addEventListener('pageshow', () => window.scrollTo(0, 0));

/* =======================================================
   CINEMATIC VIDEO INTRO (Plays only on site open or page reload)
======================================================== */

const intro = document.getElementById("intro");
const introVideo = document.getElementById("introVideo");
const introSkipBtn = document.getElementById("introSkipBtn");

if (intro) {
    let introEnded = false;
    let fallbackTimer = null;

    const finishIntro = () => {
        if (introEnded) return;
        introEnded = true;
        if (fallbackTimer) clearTimeout(fallbackTimer);

        intro.classList.add("hide");
        document.body.classList.remove("intro-active");

        // Trigger cinematic hero entrance animations
        const heroContent = document.querySelector(".hero-content");
        if (heroContent) {
            heroContent.classList.add("hero-animated");
        }

        // Trigger initial reveal check for above-fold elements
        if (typeof checkInitialReveals === "function") {
            checkInitialReveals();
        }

        // Check typewriter if Start Your Project is already in view
        if (typeof window.triggerStartProjectTypewriterCheck === "function") {
            window.triggerStartProjectTypewriterCheck();
        }

        if (introVideo) {
            try {
                introVideo.pause();
            } catch (e) { }
        }
    };

    try {
        const nav = window.performance && performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
        const isReload = nav ? nav.type === "reload" : (window.performance && window.performance.navigation && window.performance.navigation.type === 1);
        const hasVisited = sessionStorage.getItem("site_intro_played");

        if (!hasVisited || isReload) {
            // Fresh tab or page reload
            sessionStorage.setItem("site_intro_played", "true");
            document.body.classList.add("intro-active");

            // Skip button listener
            if (introSkipBtn) {
                introSkipBtn.addEventListener("click", finishIntro);
            }

            // Keyboard shortcut (Escape or Space to skip)
            const handleKeydown = (e) => {
                if (e.key === "Escape" || e.code === "Space") {
                    finishIntro();
                    window.removeEventListener("keydown", handleKeydown);
                }
            };
            window.addEventListener("keydown", handleKeydown);

            if (introVideo) {
                // Ensure muted for strict browser autoplay policies
                introVideo.muted = true;
                const playPromise = introVideo.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        console.warn("Autoplay was prevented or postponed:", err);
                    });
                }

                // Smoothly finish when video playback completes naturally
                introVideo.addEventListener("ended", () => {
                    setTimeout(finishIntro, 500);
                });

                // Safety timeout fallback (video is ~7s, fallback at 8.5s)
                fallbackTimer = setTimeout(finishIntro, 8500);
            } else {
                fallbackTimer = setTimeout(finishIntro, 2500);
            }
        } else {
            // Already visited in this session and not reloaded
            finishIntro();
        }
    } catch (err) {
        finishIntro();
    }
}


/* =======================================================
   NAVBAR SCROLL, PROGRESS BAR & ACTIVE SECTION SPY
======================================================== */

const navbar = document.getElementById("navbar");
const scrollProgressBar = document.getElementById("scrollProgressBar");
const navSections = document.querySelectorAll("section[id]");
const navLinksList = document.querySelectorAll(".nav-links a[href^='#']");

function handlePageScroll() {
    const scrollY = window.scrollY;

    // Navbar Scrolled Effect
    if (navbar) {
        if (scrollY > 40) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    }

    // Scroll Progress Bar (0% to 100%)
    if (scrollProgressBar) {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
        scrollProgressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    // Active Section Spy for Navigation Links
    let currentSectionId = "";
    navSections.forEach(section => {
        const sectionTop = section.offsetTop - 140;
        const sectionHeight = section.offsetHeight;
        if (scrollY >= sectionTop && scrollY < sectionTop + sectionHeight) {
            currentSectionId = section.getAttribute("id");
        }
    });

    if (currentSectionId) {
        navLinksList.forEach(link => {
            if (link.getAttribute("href") === `#${currentSectionId}`) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }
}

window.addEventListener("scroll", handlePageScroll, { passive: true });
window.addEventListener("load", handlePageScroll);


/* =======================================================
   MOBILE MENU CONTROLLER
======================================================== */

const menuToggle = document.getElementById("menuToggle");

function closeMobileNav() {
    if (!navbar) return;
    navbar.classList.remove("mobile-open");
    if (menuToggle) {
        menuToggle.textContent = "☰";
        menuToggle.setAttribute("aria-expanded", "false");
    }
    document.body.classList.remove("menu-open-locked");
}

function openMobileNav() {
    if (!navbar) return;
    navbar.classList.add("mobile-open");
    if (menuToggle) {
        menuToggle.textContent = "✕";
        menuToggle.setAttribute("aria-expanded", "true");
    }
    document.body.classList.add("menu-open-locked");
}

if (menuToggle && navbar) {
    menuToggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (navbar.classList.contains("mobile-open")) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    });

    // Close when clicking any link or mobile action button
    document.querySelectorAll(".nav-links a, .nav-links button").forEach(item => {
        item.addEventListener("click", () => {
            closeMobileNav();
        });
    });

    // Close when clicking outside navbar (e.g. on backdrop)
    document.addEventListener("click", (e) => {
        if (navbar.classList.contains("mobile-open") && !navbar.contains(e.target)) {
            closeMobileNav();
        }
    });

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && navbar.classList.contains("mobile-open")) {
            closeMobileNav();
        }
    });
}


/* =======================================================
   TESTIMONIALS (RESPONSIVE TOUCH, SWIPE & CONTROLS)
======================================================== */

const testimonialWrapper = document.getElementById("testimonialWrapper") || document.querySelector(".testimonial-wrapper");
const testimonialTrack = document.getElementById("testimonialTrack") || document.querySelector(".testimonial-track");
const testimonialPrevBtn = document.getElementById("testimonialPrevBtn");
const testimonialNextBtn = document.getElementById("testimonialNextBtn");
const testimonialPlayPauseBtn = document.getElementById("testimonialPlayPauseBtn");
const testimonialPauseIcon = document.getElementById("testimonialPauseIcon");

if (testimonialWrapper && testimonialTrack) {
    let isUserPaused = false;
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let resumeTimer = null;
    let manualOffset = 0;
    let isManualStepping = false;

    // Desktop hover pause
    testimonialWrapper.addEventListener("mouseenter", () => {
        if (!isUserPaused) testimonialTrack.classList.add("is-paused");
    });

    testimonialWrapper.addEventListener("mouseleave", () => {
        if (!isUserPaused && !isTouching && !isManualStepping) {
            testimonialTrack.classList.remove("is-paused");
        }
    });

    // Mobile touch events: pause on touch and allow swipe
    testimonialWrapper.addEventListener("touchstart", (e) => {
        isTouching = true;
        clearTimeout(resumeTimer);
        testimonialTrack.classList.add("is-paused");
        if (e.touches && e.touches[0]) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    testimonialWrapper.addEventListener("touchend", (e) => {
        isTouching = false;
        if (e.changedTouches && e.changedTouches[0]) {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const diffX = touchEndX - touchStartX;
            const diffY = touchEndY - touchStartY;

            // Detect horizontal swipe
            if (Math.abs(diffX) > 35 && Math.abs(diffX) > Math.abs(diffY)) {
                if (diffX < 0) {
                    stepTestimonial(1);
                } else {
                    stepTestimonial(-1);
                }
            }
        }

        // Resume auto-scroll after 3.5 seconds if user didn't explicitly toggle pause
        if (!isUserPaused) {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                if (!isUserPaused && !isTouching) {
                    resumeMarquee();
                }
            }, 3500);
        }
    }, { passive: true });

    // Step cards calculation
    function getCardStep() {
        const firstCard = testimonialTrack.querySelector(".testimonial-card");
        if (!firstCard) return 320;
        const style = window.getComputedStyle(firstCard);
        const margin = parseFloat(style.marginRight) || 16;
        return firstCard.offsetWidth + margin;
    }

    function stepTestimonial(direction) {
        testimonialTrack.classList.add("is-paused");

        // Sync with current matrix offset if starting manual step
        if (!isManualStepping) {
            const style = window.getComputedStyle(testimonialTrack);
            const matrix = new DOMMatrixReadOnly(style.transform);
            manualOffset = matrix.m41;
            testimonialTrack.style.animation = "none";
            isManualStepping = true;
        }

        const step = getCardStep();
        manualOffset -= direction * step;

        const halfWidth = testimonialTrack.scrollWidth / 2;
        if (manualOffset < -halfWidth) {
            manualOffset = 0;
        } else if (manualOffset > 0) {
            manualOffset = -halfWidth + step;
        }

        testimonialTrack.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
        testimonialTrack.style.transform = `translateX(${manualOffset}px)`;

        // Reset auto scroll after inactivity if user didn't click Pause
        if (!isUserPaused) {
            clearTimeout(resumeTimer);
            resumeTimer = setTimeout(() => {
                if (!isUserPaused && !isTouching) {
                    resumeMarquee();
                }
            }, 4000);
        }
    }

    function resumeMarquee() {
        isManualStepping = false;
        testimonialTrack.style.transition = "none";
        testimonialTrack.style.transform = "";
        testimonialTrack.style.animation = "";
        testimonialTrack.classList.remove("is-paused");
    }

    if (testimonialPrevBtn) {
        testimonialPrevBtn.addEventListener("click", () => stepTestimonial(-1));
    }

    if (testimonialNextBtn) {
        testimonialNextBtn.addEventListener("click", () => stepTestimonial(1));
    }

    if (testimonialPlayPauseBtn) {
        testimonialPlayPauseBtn.addEventListener("click", () => {
            isUserPaused = !isUserPaused;
            if (isUserPaused) {
                testimonialTrack.classList.add("is-paused");
                if (testimonialPauseIcon) {
                    testimonialPauseIcon.classList.remove("fa-pause");
                    testimonialPauseIcon.classList.add("fa-play");
                }
                testimonialPlayPauseBtn.setAttribute("aria-label", "Play marquee auto-scroll");
            } else {
                resumeMarquee();
                if (testimonialPauseIcon) {
                    testimonialPauseIcon.classList.remove("fa-play");
                    testimonialPauseIcon.classList.add("fa-pause");
                }
                testimonialPlayPauseBtn.setAttribute("aria-label", "Pause marquee auto-scroll");
            }
        });
    }
}


/* =======================================================
   HERO SLIDER
======================================================== */

const slides =
    document.querySelectorAll(".hero-slide");

const heroCounter =
    document.querySelector(".hero-counter");

let currentSlide = 0;

function showSlide(index) {

    slides.forEach(slide => {
        slide.classList.remove("active");
    });

    currentSlide = index;

    slides[currentSlide].classList.add("active");

    heroCounter.textContent =
        `0${currentSlide + 1} / 03`;

}

setInterval(() => {

    showSlide(
        (currentSlide + 1) % slides.length
    );

}, 3000);


/* =======================================================
   SCROLL REVEAL (RESPONSIVE & MOBILE-OPTIMIZED)
======================================================== */

const revealObserver = new IntersectionObserver(
    entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("in-view");
                revealObserver.unobserve(entry.target);
            }
        });
    },
    {
        threshold: 0.08,
        rootMargin: "0px 0px -30px 0px"
    }
);

document
    .querySelectorAll(".reveal, .reveal-left, .reveal-right, .reveal-scale")
    .forEach(element => {
        revealObserver.observe(element);
    });

// Ensure any elements already above fold or on page reload are marked in-view
function checkInitialReveals() {
    const vh = window.innerHeight;
    document
        .querySelectorAll(".reveal:not(.in-view), .reveal-left:not(.in-view), .reveal-right:not(.in-view), .reveal-scale:not(.in-view)")
        .forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.top < vh && rect.bottom > 0) {
                element.classList.add("in-view");
                revealObserver.unobserve(element);
            }
        });
}

window.addEventListener("DOMContentLoaded", checkInitialReveals);
window.addEventListener("pageshow", checkInitialReveals);


/* =======================================================
   COUNTERS (SILKY 60/120FPS REQUESTANIMATIONFRAME)
======================================================== */

const counters = document.querySelectorAll(".stat-number");
const statsSection = document.querySelector(".stats");

function runCounterAnimation() {
    counters.forEach(counter => {
        const target = Number(counter.dataset.target) || 0;
        const suffix = counter.querySelector("span")?.outerHTML || "+";
        const duration = 1600;
        const startTime = performance.now();

        function step(now) {
            const progress = Math.min((now - startTime) / duration, 1);
            const easeProgress = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeProgress * target);
            counter.innerHTML = `${current}${suffix}`;

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                counter.innerHTML = `${target}${suffix}`;
            }
        }
        requestAnimationFrame(step);
    });
}

if (statsSection) {
    let countersHasRun = false;
    const counterObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !countersHasRun) {
                    countersHasRun = true;
                    runCounterAnimation();
                } else if (!entry.isIntersecting) {
                    countersHasRun = false;
                }
            });
        },
        { threshold: 0.25 }
    );
    counterObserver.observe(statsSection);
}


/* =======================================================
   TYPEWRITER EFFECT — "START YOUR PROJECT" ONLY
   Triggers when opened newly, on reload, and whenever scrolled into view
======================================================== */

function initStartProjectTypewriter() {
    const label = document.getElementById("startProjectLabel");
    if (!label) return;

    let textSpan = label.querySelector(".typewriter-text");
    let cursorSpan = label.querySelector(".typewriter-cursor");

    if (!textSpan) {
        const originalText = label.textContent.trim() || "Start Your Project";
        label.innerHTML = `<span class="typewriter-text">${originalText}</span><span class="typewriter-cursor" aria-hidden="true">|</span>`;
        textSpan = label.querySelector(".typewriter-text");
        cursorSpan = label.querySelector(".typewriter-cursor");
    }

    const fullText = label.getAttribute("data-typewriter") || "Start Your Project";
    let typeTimer = null;
    let isTyping = false;
    let hasTypedInCurrentView = false;

    function playTypewriter() {
        if (isTyping) return;
        isTyping = true;
        hasTypedInCurrentView = true;

        if (typeTimer) clearInterval(typeTimer);
        textSpan.textContent = "";

        if (cursorSpan) {
            cursorSpan.classList.add("typing");
        }

        let charIndex = 0;
        typeTimer = setInterval(() => {
            if (charIndex < fullText.length) {
                textSpan.textContent += fullText.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeTimer);
                typeTimer = null;
                isTyping = false;
                if (cursorSpan) {
                    cursorSpan.classList.remove("typing");
                }
            }
        }, 70);
    }

    function resetTypewriter() {
        if (typeTimer) {
            clearInterval(typeTimer);
            typeTimer = null;
        }
        isTyping = false;
        hasTypedInCurrentView = false;
        textSpan.textContent = "";
    }

    const targetSection = document.getElementById("contact") || label.closest(".enquiry-section") || label;

    const typewriterObserver = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!hasTypedInCurrentView) {
                        playTypewriter();
                    }
                } else {
                    resetTypewriter();
                }
            });
        },
        {
            threshold: 0.20,
            rootMargin: "0px 0px -40px 0px"
        }
    );

    typewriterObserver.observe(targetSection);

    function checkInitialVisibility() {
        const rect = targetSection.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
            if (!hasTypedInCurrentView) {
                playTypewriter();
            }
        }
    }

    if (document.readyState === "complete" || document.readyState === "interactive") {
        setTimeout(checkInitialVisibility, 250);
    } else {
        window.addEventListener("DOMContentLoaded", checkInitialVisibility);
    }
    window.addEventListener("pageshow", checkInitialVisibility);
}

initStartProjectTypewriter();


/* =======================================================
   PROJECT FILTER
======================================================== */

const filterButtons =
    document.querySelectorAll(
        ".filter-btn"
    );

const projectCards =
    document.querySelectorAll(
        ".project-card"
    );

projectCards.forEach((card, index) => {
    card.querySelector(".project-view").addEventListener("click", event => {
        event.stopPropagation();
        openProject(index);
    });
});


filterButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            filterButtons.forEach(btn => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            const filter =
                button.dataset.filter;

            projectCards.forEach(
                (card, index) => {

                    const category =
                        card.dataset.category;

                    const shouldShow =
                        filter === "all" ||
                        category === filter;

                    if (shouldShow) {

                        card.style.display = "";

                        card.animate(
                            [
                                {
                                    opacity: 0,
                                    transform:
                                        "translateY(15px)"
                                },
                                {
                                    opacity: 1,
                                    transform:
                                        "translateY(0)"
                                }
                            ],
                            {
                                duration: 450,
                                delay: index * 40,
                                easing:
                                    "cubic-bezier(.2,.7,.2,1)"
                            }
                        );

                    } else {

                        card.style.display = "none";

                    }

                }
            );

        }
    );

});


/* =======================================================
   PROJECT DATA  (5 images per project)
======================================================== */

const projectData = [

    {
        title:
            "Tridha",

        subtitle:
            "Contemporary residences designed for elevated everyday living.",

        status:
            "Ongoing",

        location:
            "Hyderabad",

        type:
            "Premium Residences",

        category:
            "Residential",

        images: [
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=90"
        ],

        description: [
            "Contemporary architecture with refined, elegant interiors",
            "Thoughtfully planned homes for comfortable everyday living",
            "Carefully designed community spaces that encourage connection"
        ],

        facilities: ["24/7 security", "Landscaped gardens", "Clubhouse", "Children's play area"],

        highlights: [
            { icon: "🚗", text: "Dedicated parking space" },
            { icon: "🏊", text: "Swimming pool and recreation" },
            { icon: "🌳", text: "Landscaped community spaces" }
        ]
    },


    {
        title:
            "Dvita",

        subtitle:
            "A refined urban address shaped by light and thoughtful design.",

        status:
            "Upcoming",

        location:
            "Bengaluru",

        type:
            "Luxury Apartments",

        category:
            "Residential",

        images: [
            "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600607687644-c7171b42498f?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=90"
        ],

        description: [
            "Premium apartments shaped around natural light and elegant proportions",
            "Modern urban living with functional, well-balanced layouts",
            "A refined residential address with thoughtfully planned amenities"
        ],

        facilities: ["24/7 security", "Fitness centre", "Landscaped gardens", "Community lounge"],

        highlights: [
            { icon: "🚗", text: "Dedicated parking space" },
            { icon: "💪", text: "Modern fitness centre" },
            { icon: "🌿", text: "Open green spaces" }
        ]
    },


    {
        title:
            "Advayam",

        subtitle:
            "Contemporary architectural residences crafted for refined living and timeless presence.",

        status:
            "Completed",

        location:
            "Hyderabad",

        type:
            "Luxury Residences",

        category:
            "Residential",

        images: [
            "./Advayam.jpg",
            "./Ad3.png",
            "./Ad1.png",
            "./Ad2.png",
            "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1600&q=90"
        ],

        frontDescription: [
            { icon: "fa-solid fa-location-dot", text: "Budwel, Hyderabad, Telangana 500030" },
            { icon: "fa-solid fa-school", text: "Opposite to Gateway international high school, Budwel" },
            { icon: "fa-solid fa-road", text: "ORR exit gate no 17 at a distance of 3km" },
            { icon: "fa-solid fa-bus", text: "TSRTC Rajendra nagar bus stop within a proximity of 2km" },
            { icon: "fa-solid fa-hospital", text: "Hospitals within a proximity of 2km" },
            { icon: "fa-solid fa-gas-pump", text: "Fuel stations at a distance of 3km" }
        ],

        description: [
            "Discover your dream home at our meticulously designed apartments, crafted with 100% Vastu compliant principles to ensure harmony and positivity in every corner of your living space.",
            "Our spacious three bedroom apartments offer the perfect blend of style and functionality.",
            "Experience urban living at its finest with our prime location, where everything you need is right at your doorstep."
        ],

        facilities: [
            { icon: "fa-solid fa-compass", text: "100% Vastu" },
            { icon: "fa-solid fa-square-parking", text: "Spacious Car Parking" },
            { icon: "fa-solid fa-bolt", text: "Backup Generator" },
            { icon: "fa-solid fa-table-cells-large", text: "UPVC Windows" },
            { icon: "fa-solid fa-shapes", text: "Vitrified Tiles & Antiskid Tiles for Utility" },
            { icon: "fa-solid fa-door-open", text: "Main Door: Teakwood Wooden Door" },
            { icon: "fa-solid fa-door-closed", text: "Internal Doors: Wooden Frame with Flush Shutters" }
        ],

        highlights: [
            { icon: "fa-solid fa-couch", text: "1 Living Room" },
            { icon: "fa-solid fa-bed", text: "2 Bed Room" },
            { icon: "fa-solid fa-bath", text: "2 Bath Room" },
            { icon: "fa-solid fa-door-open", text: "1 Balcony" }
        ]
    },


    {
        title:
            "Vertex Business Park",

        subtitle:
            "Flexible workspaces created for modern businesses.",

        status:
            "Ongoing",

        location:
            "Hyderabad",

        type:
            "Commercial",

        category:
            "Commercial",

        images: [
            "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1577495508048-b635879837f1?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=90"
        ],

        description: [
            "A modern commercial destination for productive workplaces",
            "Flexible business environments suited to evolving needs",
            "A premium visitor experience with efficient everyday operations"
        ],

        facilities: ["High-speed lifts", "24/7 security", "Visitor parking", "Power backup"],

        highlights: [
            { icon: "🅿️", text: "Ample visitor parking" },
            { icon: "⚡", text: "Power backup for essential services" },
            { icon: "🏢", text: "Flexible modern workspaces" }
        ]
    },


    {
        title:
            "Eden Courtyard",

        subtitle:
            "Comfortable homes arranged around a welcoming green courtyard.",

        status:
            "Completed",

        location:
            "Secunderabad",

        type:
            "Residential",

        category:
            "Premium",

        images: [
            "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600566752355-35792bedcfea?auto=format&fit=crop&w=1600&q=90"
        ],

        description: [
            "Completed homes featuring warm material palettes",
            "Practical layouts that support comfortable everyday living",
            "A welcoming green courtyard at the heart of the community"
        ],

        facilities: ["Gated entry", "Landscaped courtyard", "Children's play area", "Visitor parking"],

        highlights: [
            { icon: "🚗", text: "Convenient resident parking" },
            { icon: "🌼", text: "Central landscaped courtyard" },
            { icon: "🛡️", text: "Secure gated community" }
        ]
    },


    {
        title:
            "The Haven",

        subtitle:
            "A calm villa community with contemporary character.",

        status:
            "Upcoming",

        location:
            "Hyderabad",

        type:
            "Premium Villas",

        category:
            "Luxury",

        images: [
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=90",
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=90"
        ],

        description: [
            "Upcoming villas planned with generous, spacious interiors",
            "Contemporary architecture in a calm residential setting",
            "A private community designed for modern family living"
        ],

        facilities: ["Gated security", "Private gardens", "Residents' clubhouse", "Dedicated parking"],

        highlights: [
            { icon: "🚘", text: "Dedicated villa parking" },
            { icon: "🏠", text: "Spacious contemporary homes" },
            { icon: "🌿", text: "Calm, green surroundings" }
        ]
    }

];


/* =======================================================
   CAROUSEL STATE
======================================================== */

let carouselIndex = 0;
let carouselImages = [];
let currentOpenedProject = null;

function buildCarousel(images) {

    const track = document.getElementById("carouselTrack");
    const dotsWrap = document.getElementById("carouselDots");

    // Clear previous content
    track.innerHTML = "";
    dotsWrap.innerHTML = "";

    carouselImages = images;
    carouselIndex = 0;

    // Build image elements
    images.forEach((src, i) => {

        const img = document.createElement("img");
        img.src = src;
        img.alt = `Project image ${i + 1}`;
        img.style.cursor = "zoom-in";
        img.title = "Click to view full image";
        img.addEventListener("click", () => {
            if (currentOpenedProject) {
                openProjectLightbox(i, currentOpenedProject);
            }
        });
        track.appendChild(img);

    });

    // Build dot buttons
    images.forEach((_, i) => {

        const dot = document.createElement("button");
        dot.className = "carousel-dot" + (i === 0 ? " active" : "");
        dot.setAttribute("aria-label", `Go to image ${i + 1}`);

        dot.addEventListener("click", () => goToCarousel(i));

        dotsWrap.appendChild(dot);

    });

    // Position track at index 0
    track.style.transform = "translateX(0%)";

}

function goToCarousel(index) {

    const track = document.getElementById("carouselTrack");
    const dots = document.querySelectorAll(".carousel-dot");

    // Clamp
    const total = carouselImages.length;
    carouselIndex = (index + total) % total;

    track.style.transform =
        `translateX(-${carouselIndex * 100}%)`;

    dots.forEach((d, i) => {
        d.classList.toggle("active", i === carouselIndex);
    });

}


/* =======================================================
   OPEN PROJECT
======================================================== */

function openProject(index) {

    const project = projectData[index];
    currentOpenedProject = project;

    // Show only the first (cover) image — no carousel, no arrows
    const singleImg = document.getElementById("modalSingleImage");
    if (singleImg && project.images && project.images.length > 0) {
        singleImg.classList.remove("loaded");
        singleImg.src = project.images[0];
        singleImg.alt = project.title + " – project image";
        // clicking the cover still opens the full lightbox
        singleImg.onclick = () => openProjectLightbox(0, project);
        // fade in once loaded
        singleImg.onload = () => singleImg.classList.add("loaded");
        if (singleImg.complete) singleImg.classList.add("loaded");
    }

    document.getElementById("modalProjectTitle").textContent = project.title;
    document.getElementById("modalProjectStatus").textContent = project.status;
    const modalDescElem = document.getElementById("modalProjectDescription");
    modalDescElem.replaceChildren();

    const frontText = project.frontDescription || project.description;
    if (Array.isArray(frontText)) {
        if (project.frontDescription) {
            const ul = document.createElement("ul");
            ul.className = "modal-points-list";
            frontText.forEach(item => {
                const li = document.createElement("li");
                li.className = "modal-point-item";

                const bullet = document.createElement("span");
                bullet.className = "point-bullet";
                bullet.textContent = "•";

                const iconSpan = document.createElement("span");
                iconSpan.className = "point-icon";
                const iconClass = (typeof item === "object" && item.icon) ? item.icon : "fa-solid fa-location-dot";
                iconSpan.innerHTML = `<i class="${iconClass}" aria-hidden="true"></i>`;

                const textSpan = document.createElement("span");
                textSpan.className = "point-text";
                textSpan.textContent = typeof item === "object" ? item.text : item;

                li.append(bullet, iconSpan, textSpan);
                ul.appendChild(li);
            });
            modalDescElem.appendChild(ul);
        } else {
            modalDescElem.textContent = frontText.join(". ");
        }
    } else {
        modalDescElem.textContent = frontText;
    }
    document.getElementById("modalLocation").textContent = project.location;
    document.getElementById("modalType").textContent = project.type;
    document.getElementById("modalStatus").textContent = project.status;
    document.getElementById("modalCategory").textContent = project.category;

    document.getElementById("detailProjectTitle").textContent = project.title;
    document.getElementById("detailProjectSubtitle").textContent = project.subtitle;
    document.getElementById("detailProjectStatus").textContent = project.status;
    document.getElementById("detailProjectLocation").textContent = project.location;
    renderProjectDescription(project.description);
    renderProjectImages(project);
    renderProjectList("projectFacilities", project.facilities);
    renderProjectHighlights(project.highlights);
    flipProjectDetails(false);

    openModal("projectModal");

}


function renderProjectDescription(description) {
    const list = document.getElementById("detailProjectDescription");
    list.replaceChildren();

    const points = Array.isArray(description) ? description : [description];
    points.forEach(point => {
        const entry = document.createElement("li");
        entry.textContent = point;
        list.appendChild(entry);
    });
}


function renderProjectImages(project) {
    const imageGrid = document.getElementById("projectImageGrid");
    imageGrid.replaceChildren();

    project.images.slice(0, 5).forEach((src, index) => {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "project-gallery-item";
        item.setAttribute("aria-label", `View full image ${index + 1} of ${project.images.length} - ${project.title}`);

        const image = document.createElement("img");
        image.src = src;
        image.alt = `${project.title} — view ${index + 1}`;
        image.loading = "lazy";

        const badge = document.createElement("span");
        badge.className = "gallery-zoom-badge";
        badge.innerHTML = `<i class="fa-solid fa-up-right-and-down-left-from-center" aria-hidden="true"></i><span>View</span>`;

        const tapIcon = document.createElement("span");
        tapIcon.className = "gallery-tap-icon";
        tapIcon.setAttribute("aria-hidden", "true");
        tapIcon.innerHTML = `<i class="fa-solid fa-magnifying-glass-plus"></i>`;

        item.append(image, badge, tapIcon);

        item.addEventListener("click", () => {
            openProjectLightbox(index, project);
        });

        imageGrid.appendChild(item);
    });
}


function getFacilityIcon(facility) {
    const text = (typeof facility === "string" ? facility : (facility && facility.text) || "").toLowerCase();
    if (text.includes("vastu")) return "fa-solid fa-compass";
    if (text.includes("parking") || text.includes("car")) return "fa-solid fa-square-parking";
    if (text.includes("generator") || text.includes("backup") || text.includes("power")) return "fa-solid fa-bolt";
    if (text.includes("window") || text.includes("upvc")) return "fa-solid fa-table-cells-large";
    if (text.includes("tile") || text.includes("antiskid") || text.includes("vitrified")) return "fa-solid fa-shapes";
    if (text.includes("main door") || text.includes("teakwood")) return "fa-solid fa-door-open";
    if (text.includes("internal door") || text.includes("door")) return "fa-solid fa-door-closed";
    if (text.includes("security") || text.includes("gated")) return "fa-solid fa-shield-halved";
    if (text.includes("garden") || text.includes("courtyard") || text.includes("green")) return "fa-solid fa-tree";
    if (text.includes("gym") || text.includes("fitness")) return "fa-solid fa-dumbbell";
    if (text.includes("pool") || text.includes("swimming")) return "fa-solid fa-person-swimming";
    if (text.includes("play") || text.includes("children")) return "fa-solid fa-child-reaching";
    if (text.includes("lift") || text.includes("elevator")) return "fa-solid fa-elevator";
    if (text.includes("club") || text.includes("lounge")) return "fa-solid fa-landmark";
    return "fa-solid fa-circle-check";
}

function renderProjectList(elementId, items) {
    const list = document.getElementById(elementId);
    list.replaceChildren();

    items.forEach(item => {
        const entry = document.createElement("li");
        const iconSpan = document.createElement("span");
        iconSpan.className = "facility-icon";
        iconSpan.setAttribute("aria-hidden", "true");

        const text = typeof item === "object" ? item.text : item;
        const iconClass = (typeof item === "object" && item.icon) ? item.icon : getFacilityIcon(item);

        iconSpan.innerHTML = `<i class="${iconClass}"></i>`;

        const textSpan = document.createElement("span");
        textSpan.className = "facility-text";
        textSpan.textContent = text.trim();

        entry.append(iconSpan, textSpan);
        list.appendChild(entry);
    });
}


function renderProjectHighlights(highlights) {
    const list = document.getElementById("projectHighlights");
    list.replaceChildren();

    highlights.forEach(highlight => {
        const entry = document.createElement("li");
        const icon = document.createElement("span");
        icon.setAttribute("aria-hidden", "true");
        if (highlight.icon && (highlight.icon.includes("fa-") || highlight.icon.startsWith("<"))) {
            icon.innerHTML = highlight.icon.startsWith("<") ? highlight.icon : `<i class="${highlight.icon}" aria-hidden="true"></i>`;
        } else {
            icon.textContent = highlight.icon;
        }
        entry.append(icon, document.createTextNode(highlight.text));
        list.appendChild(entry);
    });
}


function flipProjectDetails(showDetails) {
    const modal = document.getElementById("projectModal");
    const front = document.getElementById("projectModalFront");
    const back = document.getElementById("projectModalBack");

    modal.querySelector(".project-modal-box").classList.toggle("is-flipped", showDetails);
    front.setAttribute("aria-hidden", String(showDetails));
    back.setAttribute("aria-hidden", String(!showDetails));
    front.inert = showDetails;
    back.inert = !showDetails;

    if (showDetails) {
        back.scrollTop = 0;
    } else {
        front.scrollTop = 0;
    }
}


/* =======================================================
   PROJECT FULL-VIEW LIGHTBOX
======================================================== */

let currentLightboxProject = null;
let currentLightboxIndex = 0;
let isLightboxZoomed = false;

function openProjectLightbox(index, project) {
    currentLightboxProject = project || currentOpenedProject;
    if (!currentLightboxProject || !currentLightboxProject.images || !currentLightboxProject.images.length) return;

    currentLightboxIndex = Math.max(0, Math.min(index, currentLightboxProject.images.length - 1));
    isLightboxZoomed = false;

    const lightbox = document.getElementById("projectLightbox");
    if (!lightbox) return;

    updateLightboxContent();

    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    const closeBtn = lightbox.querySelector(".project-lightbox-close");
    if (closeBtn) closeBtn.focus();
}

function closeProjectLightbox() {
    const lightbox = document.getElementById("projectLightbox");
    if (!lightbox) return;

    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");

    resetLightboxZoom();

    const projectModal = document.getElementById("projectModal");
    if (!projectModal || !projectModal.classList.contains("active")) {
        document.body.style.overflow = "";
    }
}

function updateLightboxContent() {
    if (!currentLightboxProject) return;

    const images = currentLightboxProject.images;
    const total = images.length;
    currentLightboxIndex = (currentLightboxIndex + total) % total;

    const currentSrc = images[currentLightboxIndex];

    const titleEl = document.getElementById("lightboxTitle");
    const counterEl = document.getElementById("lightboxCounter");
    const mainImg = document.getElementById("lightboxMainImage");
    const thumbsContainer = document.getElementById("lightboxThumbnails");

    if (titleEl) titleEl.textContent = currentLightboxProject.title;
    if (counterEl) counterEl.textContent = `${currentLightboxIndex + 1} / ${total}`;

    if (mainImg) {
        mainImg.style.opacity = "0.35";
        mainImg.src = currentSrc;
        mainImg.alt = `${currentLightboxProject.title} — view ${currentLightboxIndex + 1} of ${total}`;
        mainImg.onload = () => {
            mainImg.style.opacity = "1";
        };
    }

    resetLightboxZoom();

    if (thumbsContainer) {
        thumbsContainer.replaceChildren();
        images.forEach((src, idx) => {
            const thumbBtn = document.createElement("button");
            thumbBtn.type = "button";
            thumbBtn.className = "project-lightbox-thumb" + (idx === currentLightboxIndex ? " active" : "");
            thumbBtn.setAttribute("aria-label", `Jump to image ${idx + 1} of ${total}`);

            const thumbImg = document.createElement("img");
            thumbImg.src = src;
            thumbImg.alt = `Thumbnail ${idx + 1}`;
            thumbBtn.appendChild(thumbImg);

            thumbBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                currentLightboxIndex = idx;
                updateLightboxContent();
            });

            thumbsContainer.appendChild(thumbBtn);
        });
    }
}

function navigateLightbox(direction) {
    if (!currentLightboxProject || !currentLightboxProject.images.length) return;
    currentLightboxIndex += direction;
    updateLightboxContent();
}

function toggleLightboxZoom() {
    const wrap = document.getElementById("lightboxImageWrap");
    const icon = document.getElementById("lightboxZoomIcon");
    if (!wrap) return;

    isLightboxZoomed = !isLightboxZoomed;
    wrap.classList.toggle("is-zoomed", isLightboxZoomed);

    if (icon) {
        icon.className = isLightboxZoomed ? "fa-solid fa-magnifying-glass-minus" : "fa-solid fa-magnifying-glass-plus";
    }
}

function resetLightboxZoom() {
    isLightboxZoomed = false;
    const wrap = document.getElementById("lightboxImageWrap");
    const icon = document.getElementById("lightboxZoomIcon");
    if (wrap) wrap.classList.remove("is-zoomed");
    if (icon) icon.className = "fa-solid fa-magnifying-glass-plus";
}

// Touch gestures & zoom for lightbox
(function initLightboxGestures() {
    const stage = document.getElementById("lightboxStage");
    if (!stage) return;

    let touchStartX = 0;
    let touchStartY = 0;

    stage.addEventListener("touchstart", e => {
        if (!e.changedTouches || !e.changedTouches.length) return;
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    stage.addEventListener("touchend", e => {
        if (!e.changedTouches || !e.changedTouches.length) return;
        const diffX = e.changedTouches[0].screenX - touchStartX;
        const diffY = e.changedTouches[0].screenY - touchStartY;
        if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX < 0) {
                navigateLightbox(1);
            } else {
                navigateLightbox(-1);
            }
        }
    }, { passive: true });

    const wrap = document.getElementById("lightboxImageWrap");
    if (wrap) {
        wrap.addEventListener("click", e => {
            if (e.target && e.target.id === "lightboxMainImage") {
                toggleLightboxZoom();
            }
        });
    }
})();


/* =======================================================
   CAROUSEL ARROW LISTENERS
======================================================== */

const carouselPrevBtn = document.getElementById("carouselPrev");
if (carouselPrevBtn) {
    carouselPrevBtn.addEventListener("click", () => {
        goToCarousel(carouselIndex - 1);
    });
}

const carouselNextBtn = document.getElementById("carouselNext");
if (carouselNextBtn) {
    carouselNextBtn.addEventListener("click", () => {
        goToCarousel(carouselIndex + 1);
    });
}




/* =======================================================
   MODAL
======================================================== */

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    if (id === "enquiryModal") {
        if (typeof window.clearEnquiryFormState === "function") {
            window.clearEnquiryFormState(true);
        }
    }

    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow =
        "hidden";

}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    if (id === "projectModal") {
        closeProjectLightbox();
        flipProjectDetails(false);
    }

    if (id === "enquiryModal") {
        if (typeof window.clearEnquiryFormState === "function") {
            window.clearEnquiryFormState(true);
        }
    }

    document.body.style.overflow =
        "";

}


document
    .querySelectorAll(".modal")
    .forEach(modal => {

        modal.addEventListener(
            "click",
            event => {

                if (
                    event.target === modal
                ) {

                    closeModal(modal.id);

                }

            }
        );

    });


/* =======================================================
   ESCAPE CLOSE
======================================================== */

document.addEventListener(
    "keydown",
    event => {

        const lightbox = document.getElementById("projectLightbox");
        if (lightbox && lightbox.classList.contains("active")) {
            if (event.key === "Escape") {
                closeProjectLightbox();
                return;
            }
            if (event.key === "ArrowLeft") {
                navigateLightbox(-1);
                return;
            }
            if (event.key === "ArrowRight") {
                navigateLightbox(1);
                return;
            }
        }

        if (event.key === "Escape") {

            document
                .querySelectorAll(".modal.active")
                .forEach(modal => {

                    closeModal(modal.id);

                });

        }

    }
);


/* =======================================================
   ENQUIRY
======================================================== */

function openEnquiry() {

    closeModal("projectModal");

    openModal("enquiryModal");

}


/* =======================================================
   ENQUIRY FORM VALIDATION & SUBMISSION
======================================================== */

function initEnquiryFormValidation() {
    const form = document.getElementById("enquiryForm");
    if (!form) return;

    const nameInput = form.querySelector("#name");
    const phoneInput = form.querySelector("#phone");
    const emailInput = form.querySelector("#email");
    const projectTypeInput = form.querySelector("#projectType");
    const messageInput = form.querySelector("#message");
    const successMsg = document.getElementById("successMessage");
    const charCounter = document.getElementById("messageCount");

    const nameError = document.getElementById("nameError");
    const phoneError = document.getElementById("phoneError");
    const emailError = document.getElementById("emailError");
    const projectTypeError = document.getElementById("projectTypeError");
    const messageError = document.getElementById("messageError");

    function setError(input, errorEl, msg) {
        if (input) input.classList.add("input-error");
        if (errorEl) {
            errorEl.textContent = msg;
            errorEl.classList.add("active");
        }
    }

    function clearError(input, errorEl) {
        if (input) input.classList.remove("input-error");
        if (errorEl) {
            errorEl.textContent = "";
            errorEl.classList.remove("active");
        }
    }

    // Function to completely clear all validation errors and optionally reset inputs
    function clearAllFormErrors(resetInputs = true) {
        if (resetInputs && form) {
            form.reset();
        }
        clearError(nameInput, nameError);
        clearError(phoneInput, phoneError);
        clearError(emailInput, emailError);
        clearError(projectTypeInput, projectTypeError);
        clearError(messageInput, messageError);
        if (charCounter) {
            charCounter.textContent = "0 / 100";
        }
        if (successMsg) {
            successMsg.textContent = "";
            successMsg.classList.remove("show");
        }
    }

    // Expose globally so modal open/close functions can reset errors cleanly
    window.clearEnquiryFormState = clearAllFormErrors;

    // 1. FULL NAME: Max 50, only alphabets and single space
    if (nameInput) {
        nameInput.setAttribute("maxlength", "50");
        nameInput.addEventListener("input", () => {
            let val = nameInput.value;
            val = val.replace(/[^a-zA-Z ]/g, ""); // only alphabets and spaces
            val = val.replace(/^ +/, "");          // no leading space
            val = val.replace(/ {2,}/g, " ");      // collapse multiple spaces to single space
            if (val.length > 50) val = val.slice(0, 50);
            nameInput.value = val;

            if (val.length > 0) {
                validateName(false);
            } else {
                clearError(nameInput, nameError);
            }
        });
        nameInput.addEventListener("blur", () => validateName(true));
    }

    function validateName(showEmpty = true) {
        if (!nameInput) return true;
        const val = nameInput.value.trim();
        if (!val) {
            if (showEmpty) setError(nameInput, nameError, "Full Name is mandatory and cannot be empty.");
            return false;
        }
        if (val.length < 2) {
            setError(nameInput, nameError, "Full Name must be at least 2 characters.");
            return false;
        }
        if (val.length > 50) {
            setError(nameInput, nameError, "Full Name cannot exceed 50 characters.");
            return false;
        }
        if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(val)) {
            setError(nameInput, nameError, "Name must contain only alphabets and single spaces.");
            return false;
        }
        clearError(nameInput, nameError);
        return true;
    }

    // 2. PHONE NUMBER: Must be 10 digits, numbers only, no spaces
    if (phoneInput) {
        phoneInput.setAttribute("maxlength", "10");
        phoneInput.addEventListener("input", () => {
            let val = phoneInput.value;
            val = val.replace(/\D/g, ""); // numbers only, no spaces
            if (val.length > 10) val = val.slice(0, 10);
            phoneInput.value = val;

            if (val.length > 0) {
                validatePhone(false);
            } else {
                clearError(phoneInput, phoneError);
            }
        });
        phoneInput.addEventListener("blur", () => validatePhone(true));
    }

    function validatePhone(showEmpty = true) {
        if (!phoneInput) return true;
        const val = phoneInput.value.trim();
        if (!val) {
            if (showEmpty) setError(phoneInput, phoneError, "Phone Number is mandatory and cannot be empty.");
            return false;
        }
        if (val.length !== 10) {
            setError(phoneInput, phoneError, "Phone Number must be exactly 10 digits (numbers only, no spaces).");
            return false;
        }
        if (!/^\d{10}$/.test(val)) {
            setError(phoneInput, phoneError, "Phone Number must contain only digits.");
            return false;
        }
        clearError(phoneInput, phoneError);
        return true;
    }

    // 3. EMAIL: Max 70, only letters, digits, '@' and '.', no spaces. '@' and '.' allowed only once.
    if (emailInput) {
        emailInput.setAttribute("maxlength", "70");

        emailInput.addEventListener("keydown", (e) => {
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return;
            const selStart = emailInput.selectionStart ?? 0;
            const selEnd = emailInput.selectionEnd ?? 0;
            const unselectedText = emailInput.value.slice(0, selStart) + emailInput.value.slice(selEnd);

            if (e.key === "@" && unselectedText.includes("@")) {
                e.preventDefault();
            } else if (e.key === "." && unselectedText.includes(".")) {
                e.preventDefault();
            }
        });

        emailInput.addEventListener("input", () => {
            let val = emailInput.value;
            val = val.replace(/[^a-zA-Z0-9@.]/g, ""); // only letters, digits, @, and .

            // Ensure '@' is taken at most 1 time
            let atCount = 0;
            val = val.replace(/@/g, (match) => {
                atCount++;
                return atCount === 1 ? match : "";
            });

            // Ensure '.' is taken at most 1 time
            let dotCount = 0;
            val = val.replace(/\./g, (match) => {
                dotCount++;
                return dotCount === 1 ? match : "";
            });

            if (val.length > 70) val = val.slice(0, 70);

            if (emailInput.value !== val) {
                const start = emailInput.selectionStart;
                emailInput.value = val;
                if (start !== null) {
                    const newPos = Math.min(start, val.length);
                    emailInput.setSelectionRange(newPos, newPos);
                }
            }

            if (val.length > 0) {
                validateEmail(false);
            } else {
                clearError(emailInput, emailError);
            }
        });
        emailInput.addEventListener("blur", () => validateEmail(true));
    }

    function validateEmail(showEmpty = true) {
        if (!emailInput) return true;
        const val = emailInput.value.trim();
        if (!val) {
            if (showEmpty) setError(emailInput, emailError, "Email is mandatory and cannot be empty.");
            return false;
        }
        if (val.length > 70) {
            setError(emailInput, emailError, "Email cannot exceed 70 characters.");
            return false;
        }
        if (val.includes(" ")) {
            setError(emailInput, emailError, "Email cannot contain spaces.");
            return false;
        }
        if (/[^a-zA-Z0-9@.]/.test(val)) {
            setError(emailInput, emailError, "Only letters, digits, '@' and '.' are allowed.");
            return false;
        }
        const atCount = (val.match(/@/g) || []).length;
        if (atCount !== 1) {
            setError(emailInput, emailError, "Email must contain exactly one '@'.");
            return false;
        }
        const dotCount = (val.match(/\./g) || []).length;
        if (dotCount !== 1) {
            setError(emailInput, emailError, "Email must contain exactly one '.'.");
            return false;
        }
        // Valid email pattern with exactly one @ and one . (e.g. name@domain.com)
        const emailRegex = /^[a-zA-Z0-9]+@[a-zA-Z0-9]+\.[a-zA-Z0-9]{2,}$/;
        if (!emailRegex.test(val)) {
            setError(emailInput, emailError, "Please enter a valid email address (e.g. name@domain.com).");
            return false;
        }
        clearError(emailInput, emailError);
        return true;
    }

    // 4. PROJECT TYPE: Mandatory dropdown
    if (projectTypeInput) {
        projectTypeInput.addEventListener("change", () => validateProjectType(true));
    }

    function validateProjectType(showEmpty = true) {
        if (!projectTypeInput) return true;
        const val = projectTypeInput.value.trim();
        if (!val) {
            if (showEmpty) setError(projectTypeInput, projectTypeError, "Please select a project type.");
            return false;
        }
        clearError(projectTypeInput, projectTypeError);
        return true;
    }

    // 5. TEXTAREA (REQUIREMENT): Max 100, only alphabets and single spaces
    if (messageInput) {
        messageInput.setAttribute("maxlength", "100");
        messageInput.addEventListener("input", () => {
            let val = messageInput.value;
            val = val.replace(/[^a-zA-Z ]/g, ""); // only alphabets and spaces
            val = val.replace(/^ +/, "");          // no leading space
            val = val.replace(/ {2,}/g, " ");      // single space only
            if (val.length > 100) val = val.slice(0, 100);
            messageInput.value = val;

            if (charCounter) {
                charCounter.textContent = `${val.length} / 100`;
            }

            if (val.length > 0) {
                validateMessage(false);
            } else {
                clearError(messageInput, messageError);
            }
        });
        messageInput.addEventListener("blur", () => validateMessage(true));
    }

    function validateMessage(showEmpty = true) {
        if (!messageInput) return true;
        const val = messageInput.value.trim();
        if (!val) {
            if (showEmpty) setError(messageInput, messageError, "Requirement is mandatory and cannot be empty.");
            return false;
        }
        if (val.length < 3) {
            setError(messageInput, messageError, "Requirement must be at least 3 characters.");
            return false;
        }
        if (val.length > 100) {
            setError(messageInput, messageError, "Requirement cannot exceed 100 characters.");
            return false;
        }
        if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(val)) {
            setError(messageInput, messageError, "Only alphabets and single spaces are allowed.");
            return false;
        }
        clearError(messageInput, messageError);
        return true;
    }

    // SUBMIT HANDLER: Strictly blocks empty or invalid submission
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const isNameValid = validateName(true);
        const isPhoneValid = validatePhone(true);
        const isEmailValid = validateEmail(true);
        const isProjectValid = validateProjectType(true);
        const isMessageValid = validateMessage(true);

        if (!isNameValid || !isPhoneValid || !isEmailValid || !isProjectValid || !isMessageValid) {
            const firstInvalid = form.querySelector(".input-error");
            if (firstInvalid) {
                firstInvalid.focus();
            }
            return;
        }

        const name = nameInput.value.trim();
        const phone = phoneInput.value.trim();
        const email = emailInput.value.trim();
        const projectType = projectTypeInput.value;
        const message = messageInput.value.trim();

        const whatsappNumber = "63044 01842";
        const whatsappMessage = `Enquiry\nDHRUVANTHEERA CONSTRUCTIONS\n\nName: ${name}\nPhone: ${phone}\nEmail: ${email}\nProject Type: ${projectType}\nRequirement: ${message}`;

        const whatsappURL =
            "https://wa.me/" + whatsappNumber +
            "?text=" + encodeURIComponent(whatsappMessage);

        const whatsappWindow = window.open(whatsappURL, "_blank");

        if (successMsg) {
            successMsg.textContent = whatsappWindow
                ? "Your enquiry is ready in WhatsApp. Please press Send to complete your enquiry."
                : "Please allow pop-ups for this website, then submit your enquiry again.";
            successMsg.classList.add("show");
        }

        form.reset();
        if (charCounter) charCounter.textContent = "0 / 100";
    });
}

initEnquiryFormValidation();


/* =======================================================
   HERO MOUSE CINEMATIC MOVEMENT
======================================================== */

const hero =
    document.querySelector(".hero");

const reducedMotion =
    window.matchMedia(
        "(prefers-reduced-motion: reduce)"
    ).matches;

const finePointer =
    window.matchMedia(
        "(pointer: fine)"
    ).matches;


if (
    hero &&
    finePointer &&
    !reducedMotion
) {

    hero.addEventListener(
        "mousemove",
        event => {

            const x =
                (event.clientX /
                    window.innerWidth -
                    .5) * 2;

            const y =
                (event.clientY /
                    window.innerHeight -
                    .5) * 2;

            const activeSlide =
                document.querySelector(
                    ".hero-slide.active"
                );

            if (activeSlide) {

                activeSlide.style.transform =
                    `scale(1.1)
       translate(${x * -4}px, ${y * -3}px)`;

            }

        }
    );

    hero.addEventListener(
        "mouseleave",
        () => {

            const activeSlide =
                document.querySelector(
                    ".hero-slide.active"
                );

            if (activeSlide) {

                activeSlide.style.transform =
                    "scale(1.08)";

            }

        }
    );

}


/* =======================================================
   CLOSE MOBILE MENU ON RESIZE
======================================================== */

window.addEventListener(
    "resize",
    () => {
        if (window.innerWidth > 900) {
            closeMobileNav();
        }
    }
);


/* =======================================================
   SCROLL TO TOP BUTTON
======================================================== */
const scrollTopBtn = document.getElementById("scrollTopBtn");

if (scrollTopBtn) {
    window.addEventListener("scroll", () => {
        if (window.scrollY > 350) {
            scrollTopBtn.classList.add("visible");
        } else {
            scrollTopBtn.classList.remove("visible");
        }
    }, { passive: true });

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
}


/* =======================================================
   DHRUVANTHEERA AI CHATBOT & FOUNDER CONCIERGE
======================================================== */
(function initDhruvantheeraChatbot() {
    const wrapper = document.getElementById("chatbotWrapper");
    const toggleBtn = document.getElementById("chatbotToggle");
    const teaser = document.getElementById("chatbotTeaser");
    const teaserClose = document.getElementById("teaserClose");
    const teaserTrigger = document.getElementById("teaserTrigger");
    const chatWindow = document.getElementById("chatbotWindow");
    const minBtn = document.getElementById("chatbotMinBtn");
    const resetBtn = document.getElementById("chatbotResetBtn");
    const chatMessages = document.getElementById("chatbotMessages");
    const chatForm = document.getElementById("chatbotForm");
    const chatInput = document.getElementById("chatbotInput");
    const chatChips = document.getElementById("chatbotChips");

    if (!wrapper || !toggleBtn || !chatWindow) return;

    let hasOpened = false;
    let teaserHideTimer = null;
    let teaserIndex = 0;

    const teaserHeadline = document.getElementById("teaserHeadline");
    const teaserSubtext = document.getElementById("teaserSubtext");

    // Rotating messages for the animated mascot teaser
    const teaserMessages = [
        { headline: "Hi! Wanna know? Click me! 👋", subtext: "Explore luxury projects, pricing & founder desk" },
        { headline: "Looking for your dream home? 🏛️", subtext: "100% Vaastu compliant residences • Click me!" },
        { headline: "Want instant cost estimates? 💰", subtext: "Itemized BOQ & pricing packages • Click to chat" },
        { headline: "Have questions about Advayam? ✨", subtext: "Budwel luxury residences info • Click here!" },
        { headline: "Need to speak with our Founder? 👤", subtext: "Direct WhatsApp & phone desk • Click to connect" }
    ];

    function showTeaser() {
        if (!teaser) return;
        // Don't show teaser if the chat window is already open
        if (wrapper.classList.contains("open")) return;

        const currentMsg = teaserMessages[teaserIndex % teaserMessages.length];
        teaserIndex++;

        if (teaserHeadline) teaserHeadline.textContent = currentMsg.headline;
        if (teaserSubtext) teaserSubtext.textContent = currentMsg.subtext;

        teaser.classList.remove("hide");

        // Stays for 10 seconds, then automatically slides out
        clearTimeout(teaserHideTimer);
        teaserHideTimer = setTimeout(() => {
            if (!wrapper.classList.contains("open")) {
                teaser.classList.add("hide");
            }
        }, 10000);
    }

    // Initial popup comes after 2.5 seconds
    setTimeout(showTeaser, 2500);

    // Pop message comes every 2 minutes (120,000 ms) and stays for 10 seconds
    setInterval(showTeaser, 120000);

    // Dismiss teaser manually via close button
    if (teaserClose) {
        teaserClose.addEventListener("click", (e) => {
            e.stopPropagation();
            clearTimeout(teaserHideTimer);
            teaser.classList.add("hide");
        });
    }

    // Toggle Chat window
    function openChat() {
        hasOpened = true;
        clearTimeout(teaserHideTimer);
        if (teaser) teaser.classList.add("hide");

        wrapper.classList.add("open");
        chatWindow.removeAttribute("hidden");
        toggleBtn.setAttribute("aria-expanded", "true");

        if (chatMessages && chatMessages.children.length === 0) {
            sendWelcomeMessage();
        }

        setTimeout(() => {
            // Only auto-focus on wider screens to prevent aggressive keyboard popup on iOS
            if (chatInput && window.innerWidth > 600) {
                chatInput.focus();
            }
        }, 150);
    }

    function closeChat() {
        wrapper.classList.remove("open");
        chatWindow.setAttribute("hidden", "");
        toggleBtn.setAttribute("aria-expanded", "false");
    }

    // Smooth navigation from inside chatbot to any page section
    window.chatNavTo = function (target) {
        closeChat();
        setTimeout(() => {
            if (target === "enquiry") {
                if (typeof openEnquiry === "function") openEnquiry();
                return;
            }

            let el = document.getElementById(target);
            if (!el && target === "services") {
                el = document.getElementById("values") || document.getElementById("about");
            }
            if (!el && target === "pricing") {
                el = document.getElementById("contact");
            }

            if (el) {
                const navbar = document.getElementById("navbar");
                const navHeight = navbar ? navbar.offsetHeight : 70;
                const targetY = el.getBoundingClientRect().top + window.pageYOffset - navHeight - 12;
                window.scrollTo({
                    top: Math.max(0, targetY),
                    behavior: "smooth"
                });
            }
        }, 220);
    };

    toggleBtn.addEventListener("click", () => {
        if (wrapper.classList.contains("open")) {
            closeChat();
        } else {
            openChat();
        }
    });

    if (teaserTrigger) {
        teaserTrigger.addEventListener("click", openChat);
    }
    if (teaser) {
        teaser.addEventListener("click", (e) => {
            if (e && e.target && e.target.closest && e.target.closest("#teaserClose")) return;
            openChat();
        });
    }
    if (minBtn) {
        minBtn.addEventListener("click", closeChat);
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            if (chatMessages) {
                chatMessages.innerHTML = "";
                sendWelcomeMessage();
            }
            if (chatInput && window.innerWidth > 600) chatInput.focus();
        });
    }

    // Close on Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && wrapper.classList.contains("open")) {
            closeChat();
        }
    });

    // Format current time
    function getTimeStr() {
        const d = new Date();
        return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // Scroll chat to bottom
    function scrollChatBottom() {
        const body = document.getElementById("chatbotBody");
        if (body) {
            body.scrollTop = body.scrollHeight;
        }
    }

    function escapeHTML(str) {
        const p = document.createElement("p");
        p.textContent = str;
        return p.innerHTML;
    }

    // Append user message
    function appendUserMessage(text) {
        const msgDiv = document.createElement("div");
        msgDiv.className = "chat-msg user";
        msgDiv.innerHTML = `
            <div class="chat-bubble">${escapeHTML(text)}</div>
            <span class="chat-msg-time">${getTimeStr()}</span>
        `;
        chatMessages.appendChild(msgDiv);
        scrollChatBottom();
    }

    // Append bot message with typing indicator
    function appendBotMessage(htmlContent, callback) {
        const typingDiv = document.createElement("div");
        typingDiv.className = "chat-msg bot typing-msg";
        typingDiv.innerHTML = `
            <div class="typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        scrollChatBottom();

        setTimeout(() => {
            if (typingDiv && typeof typingDiv.remove === "function") {
                typingDiv.remove();
            } else if (typingDiv && typingDiv.parentNode) {
                typingDiv.parentNode.removeChild(typingDiv);
            }
            const msgDiv = document.createElement("div");
            msgDiv.className = "chat-msg bot";
            msgDiv.innerHTML = `
                <div class="chat-bubble">${htmlContent}</div>
                <span class="chat-msg-time">${getTimeStr()}</span>
            `;
            chatMessages.appendChild(msgDiv);
            scrollChatBottom();
            if (callback) callback();
        }, 500);
    }

    // Executive Founder Card HTML
    function getFounderCardHTML() {
        return `
            <div class="founder-card-chat">
                <div class="founder-card-hdr">
                    <div class="founder-avatar-wrap">
                        <i class="fa-solid fa-user-tie"></i>
                    </div>
                    <div>
                        <div class="founder-role-tag">Founder & Managing Director</div>
                        <div class="founder-name">Dhruvantheera Constructions</div>
                    </div>
                </div>
                <div class="founder-details-list">
                    <div class="f-detail-item">
                        <i class="fa-solid fa-phone"></i>
                        <div>
                            <small>Direct Mobile</small>
                            <a href="tel:+9163044 01842">+91 79812 27221</a>
                        </div>
                    </div>
                    <div class="f-detail-item">
                        <i class="fa-brands fa-whatsapp"></i>
                        <div>
                            <small>WhatsApp Desk</small>
                            <a href="https://wa.me/9163044 01842?text=Hi%2C%20I%20would%20like%20to%20connect%20with%20the%20Founder%20of%20Dhruvantheera%20Constructions." target="_blank" rel="noopener">+91 79812 27221</a>
                        </div>
                    </div>
                    <div class="f-detail-item">
                        <i class="fa-solid fa-envelope"></i>
                        <div>
                            <small>Executive Email</small>
                            <a href="mailto:info@dhruvantheeraconstructions.com">info@dhruvantheeraconstructions.com</a>
                        </div>
                    </div>
                    <div class="f-detail-item">
                        <i class="fa-solid fa-location-dot"></i>
                        <div>
                            <small>Headquarters</small>
                            <span>Hyderabad, Telangana, India</span>
                        </div>
                    </div>
                </div>
                <div class="founder-action-btns">
                    <a href="https://wa.me/9163044 01842?text=Hi%2C%20I%20would%20like%20to%20connect%20with%20the%20Founder%20of%20Dhruvantheera%20Constructions." target="_blank" class="f-btn f-btn-wa">
                        <i class="fa-brands fa-whatsapp"></i> Chat WhatsApp
                    </a>
                    <a href="tel:+9163044 01842" class="f-btn f-btn-call">
                        <i class="fa-solid fa-phone"></i> Call Direct
                    </a>
                    <a href="Book.html" class="f-btn f-btn-portfolio">
                        <i class="fa-solid fa-book-open"></i> Browse 3D Project Book
                    </a>
                    <button type="button" class="f-btn f-btn-enquiry" onclick="openEnquiry();">
                        <i class="fa-solid fa-paper-plane"></i> Submit Site Enquiry
                    </button>
                </div>
            </div>
        `;
    }

    // Initial welcome message with Founder card
    function sendWelcomeMessage() {
        const welcomeHTML = `
            <div class="chat-welcome-box">
                <div class="chat-welcome-badge">🏛️ Architectural & Engineering Desk</div>
                <p><strong>Namaste & Welcome to Dhruvantheera Constructions!</strong></p>
                <p style="margin-top: 6px; font-size: 13px; line-height: 1.55; color: rgba(255,255,255,0.88);">
                    I am your <strong>Executive AI Concierge</strong>. Whether you are planning a luxury villa, commercial landmark, seeking <strong>exact per sq.ft pricing</strong>, or want direct connection with our <strong>Founder & Managing Director</strong>, I am here to assist you.
                </p>
                ${getFounderCardHTML()}
                <p style="margin-top: 10px; font-size: 12px; color: rgba(255,255,255,0.7);">Select any quick option below or ask your custom question:</p>
            </div>
        `;
        appendBotMessage(welcomeHTML);
    }

    // Knowledge / AI response resolver
    function getBotResponse(input) {
        const query = input.toLowerCase().trim();

        if (query.includes("founder") || query.includes("owner") || query.includes("director") || query.includes("who started") || query.includes("ceo") || query.includes("yasasswini") || query.includes("leadership") || query.includes("who is")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Founder & Executive Leadership:</strong></p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        At <strong>Dhruvantheera Constructions</strong>, every blueprint and on-site pour is guided with structural precision, Vaastu compliance, and unmatched material integrity.
                    </p>
                    ${getFounderCardHTML()}
                </div>
            `;
        }

        if (query.includes("cost") || query.includes("price") || query.includes("pricing") || query.includes("rate") || query.includes("sq ft") || query.includes("sqft") || query.includes("budget") || query.includes("estimate") || query.includes("calculator") || query.includes("package")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Transparent Milestone-Based Pricing:</strong></p>
                    <p style="margin-top: 6px; font-size: 12.5px; color: rgba(255,255,255,0.85);">
                        We work with a <strong>100% transparent itemized Bill of Quantities (BOQ)</strong> with zero hidden escalation clauses:
                    </p>
                    <div class="chat-package-card">
                        <div class="pkg-header">
                            <span class="pkg-title">1. Premium Structural Package</span>
                            <span class="pkg-price">₹1,850 - ₹2,100 / sq.ft</span>
                        </div>
                        <div class="pkg-desc">Tata/Jindal Fe 550D TMT steel, Ultratech/ACC OPC-53 cement, engineered foundation, and red clay masonry.</div>
                    </div>
                    <div class="chat-package-card">
                        <div class="pkg-header">
                            <span class="pkg-title">2. Turnkey Luxury Living</span>
                            <span class="pkg-price">₹2,250 - ₹2,750 / sq.ft</span>
                        </div>
                        <div class="pkg-desc">End-to-end civil + designer vitrified/granite flooring, Hindware/Jaquar sanitaryware, modular wiring, 3-coat premium paints.</div>
                    </div>
                    <div class="chat-package-card highlight">
                        <div class="pkg-header">
                            <span class="pkg-title">3. Ultra-Luxury Bespoke</span>
                            <span class="pkg-price">₹2,850 - ₹3,600+ / sq.ft</span>
                        </div>
                        <div class="pkg-desc">Imported Italian marble, teakwood door frames, home automation conduits, designer false ceiling, and bespoke architectural elevations.</div>
                    </div>
                    <p style="margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.75);">Share your plot size or blueprint for a complimentary itemized estimate:</p>
                    <div style="margin-top: 8px; display:flex; gap:6px; flex-wrap:wrap;">
                        <a href="https://wa.me/9163044 01842?text=Hi%2C%20I%20would%20like%20a%20detailed%20construction%20cost%20estimate%20for%20my%20property." target="_blank" class="f-btn f-btn-wa">
                            <i class="fa-brands fa-whatsapp"></i> Get Quote on WhatsApp
                        </a>
                        <button type="button" class="f-btn f-btn-call" onclick="openEnquiry();">
                            <i class="fa-solid fa-file-invoice"></i> Request Free BOQ
                        </button>
                    </div>
                </div>
            `;
        }

        if (query.includes("service") || query.includes("what do you do") || query.includes("residential") || query.includes("commercial") || query.includes("villa") || query.includes("interior") || query.includes("architecture")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Our Core Construction & Design Services:</strong></p>
                    <ul class="chat-bullet-list">
                        <li><strong>Turnkey Luxury Villas & Residences:</strong> End-to-end design and construction with zero quality compromise.</li>
                        <li><strong>Commercial Spaces & Corporate Offices:</strong> Engineered for durability, high footfall, and prestigious aesthetics.</li>
                        <li><strong>Architectural Planning & 3D Elevations:</strong> 100% Vaastu-compliant designs with municipal approval documentation.</li>
                        <li><strong>Bespoke Interior Design & Modular Spaces:</strong> Premium woodwork, ambient lighting, and bespoke luxury finishes.</li>
                        <li><strong>Structural Renovation & Floor Additions:</strong> Soil testing, column retrofitting, and seamless architectural expansion.</li>
                    </ul>
                    <div style="margin-top: 10px; display:flex; gap:6px; flex-wrap:wrap;">
                        <button type="button" class="f-btn f-btn-call" onclick="chatNavTo('values')"><i class="fa-solid fa-compass-drafting"></i> View Services & Philosophy →</button>
                        <a href="Book.html" class="f-btn f-btn-portfolio"><i class="fa-solid fa-book-open"></i> View 3D Project Book</a>
                    </div>
                </div>
            `;
        }

        if (query.includes("quality") || query.includes("warranty") || query.includes("guarantee") || query.includes("material") || query.includes("cement") || query.includes("steel") || query.includes("inspection")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Uncompromising Quality & 10-Year Warranty:</strong></p>
                    <ul class="chat-bullet-list">
                        <li><strong>10-Year Structural Warranty:</strong> Complete guarantee on RCC column, beam, and foundation integrity.</li>
                        <li><strong>1-Year Seepage & Plumbing Maintenance:</strong> Full-coverage warranty on water-tightness and fixtures.</li>
                        <li><strong>Primary Certified Brands:</strong> Tata Tiscon / Jindal Panther Fe 550D TMT Steel & UltraTech / ACC Grade-53 cement.</li>
                        <li><strong>120-Point Site Audit Checklist:</strong> Rigorous cube tests, slump tests, and pre-pour structural inspections.</li>
                        <li><strong>Multi-Layer Waterproofing:</strong> Dr. Fixit chemical membranes applied to footings, sunken slabs, and terrace.</li>
                    </ul>
                    <div style="margin-top: 10px;">
                        <a href="https://wa.me/9163044 01842?text=Hi%2C%20I%20would%20like%20to%20know%20more%20about%20your%20material%20specifications." target="_blank" class="f-btn f-btn-wa">
                            <i class="fa-brands fa-whatsapp"></i> Inquire Material Specifications
                        </a>
                    </div>
                </div>
            `;
        }

        if (query.includes("timeline") || query.includes("duration") || query.includes("how long") || query.includes("process") || query.includes("stages") || query.includes("steps") || query.includes("time")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Structured 5-Stage Project Roadmap:</strong></p>
                    <ul class="chat-bullet-list">
                        <li><strong>Stage 1 (Weeks 1-3):</strong> Soil test, architectural drawings, Vaastu vetting & 3D visualizations.</li>
                        <li><strong>Stage 2 (Weeks 4-12):</strong> Foundation excavation, anti-termite treatment, column footings & plinth beam.</li>
                        <li><strong>Stage 3 (Months 3-6):</strong> RCC frame casting, red brick / solid block masonry, electrical conduit embedding.</li>
                        <li><strong>Stage 4 (Months 7-10):</strong> Dual plastering, waterproofing, designer flooring, plumbing & false ceiling.</li>
                        <li><strong>Stage 5 (Months 11-12):</strong> Premium painting, fixture installation, deep cleaning & grand handover.</li>
                    </ul>
                    <p style="margin-top: 6px; font-size: 12px; color: rgba(255,255,255,0.7);">*Typical villa construction takes 10–14 months with regular weekly photo/video progress updates.</p>
                </div>
            `;
        }

        if (query.includes("location") || query.includes("where") || query.includes("hyderabad") || query.includes("area") || query.includes("office") || query.includes("address") || query.includes("city")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Locations We Serve in Hyderabad:</strong></p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        We undertake turnkey luxury projects across Greater Hyderabad including:
                    </p>
                    <div style="margin: 6px 0; font-size: 12px; color: var(--gold-light, #e5cd9c); line-height: 1.6;">
                        • Jubilee Hills • Banjara Hills • Kokapet • Gachibowli<br/>
                        • Financial District • Tellapur • Manikonda • Madhapur<br/>
                        • Kompally • Gandipet • Narsingi • Mokila
                    </div>
                    <p style="margin-top: 6px; font-size: 12.5px;">📍 <strong>Head Office:</strong> Hyderabad, Telangana, India.</p>
                    <div style="margin-top: 8px;">
                        <button type="button" class="f-btn f-btn-call" onclick="chatNavTo('contact')"><i class="fa-solid fa-location-dot"></i> View Location Map →</button>
                    </div>
                </div>
            `;
        }

        if (query.includes("book") || query.includes("consultation") || query.includes("meeting") || query.includes("site visit") || query.includes("appointment")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Schedule a Site Visit or Founder Consultation:</strong></p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        We would be delighted to inspect your plot, review architectural blueprints, or discuss your vision in person.
                    </p>
                    <div style="margin-top: 10px; display:flex; flex-direction:column; gap:6px;">
                        <a href="https://wa.me/9163044 01842?text=Hi%20Dhruvantheera%20Team%2C%20I%20would%20like%20to%20book%20a%20complimentary%20site%20consultation." target="_blank" class="f-btn f-btn-wa">
                            <i class="fa-brands fa-whatsapp"></i> Book Instantly on WhatsApp
                        </a>
                        <button type="button" class="f-btn f-btn-call" onclick="openEnquiry();">
                            <i class="fa-solid fa-calendar-check"></i> Fill Site Visit Request Form
                        </button>
                        <a href="Book.html" class="f-btn f-btn-portfolio">
                            <i class="fa-solid fa-book-open"></i> Explore 3D Completed Projects
                        </a>
                    </div>
                </div>
            `;
        }

        if (query.includes("contact") || query.includes("phone") || query.includes("call") || query.includes("number") || query.includes("email") || query.includes("reach")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Executive Contact Directory:</strong></p>
                    <p style="margin: 6px 0; font-size: 13px;">Reach our core management team directly:</p>
                    ${getFounderCardHTML()}
                </div>
            `;
        }

        if (query.includes("project") || query.includes("portfolio") || query.includes("work") || query.includes("completed") || query.includes("gallery")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>Selected Projects & Portfolio:</strong></p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        Explore our luxury villas, private residences, and commercial developments across Hyderabad.
                    </p>
                    <div style="margin-top: 10px; display:flex; flex-direction:column; gap:6px;">
                        <a href="Book.html" class="f-btn f-btn-portfolio">
                            <i class="fa-solid fa-book-open"></i> Open 3D Project Book (10 Top Works)
                        </a>
                        <button type="button" class="f-btn f-btn-call" onclick="chatNavTo('projects')">
                            <i class="fa-solid fa-building"></i> View Projects on Website →
                        </button>
                    </div>
                </div>
            `;
        }

        if (query.includes("about") || query.includes("company") || query.includes("dhruvantheera") || query.includes("who are you")) {
            return `
                <div class="bot-section-reply">
                    <p><strong>About DHRUVANTHEERA CONSTRUCTIONS:</strong></p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        We are an elite Hyderabad construction and design firm committed to <strong>precision engineering, transparent milestone delivery, and timeless luxury</strong>.
                    </p>
                    <ul class="chat-bullet-list">
                        <li>10-Year Structural Integrity Guarantee</li>
                        <li>100% Itemized BOQ with zero hidden costs</li>
                        <li>Stage-wise photo & video audit updates</li>
                    </ul>
                    <div style="margin-top: 10px;">
                        <button type="button" class="f-btn f-btn-call" onclick="chatNavTo('about')"><i class="fa-solid fa-circle-info"></i> Read Our Story & Philosophy →</button>
                    </div>
                </div>
            `;
        }

        if (query.includes("hi") || query.includes("hello") || query.includes("hey") || query.includes("namaste") || query.includes("good morning") || query.includes("good afternoon")) {
            return `
                <div class="bot-section-reply">
                    <p>Hello & Namaste! 👋</p>
                    <p style="margin-top: 6px; font-size: 13px; line-height: 1.55;">
                        Welcome to <strong>Dhruvantheera Constructions</strong>. How may I assist your architectural or construction journey today?
                    </p>
                    <div style="margin-top: 8px; display:flex; gap:6px; flex-wrap:wrap;">
                        <button type="button" class="chip-btn" onclick="document.querySelector('[data-query=cost]').click()">💰 Pricing & Packages</button>
                        <button type="button" class="chip-btn" onclick="document.querySelector('[data-query=founder]').click()">👤 Founder Contact</button>
                        <button type="button" class="chip-btn" onclick="document.querySelector('[data-query=book]').click()">📅 Book Consultation</button>
                    </div>
                </div>
            `;
        }

        // Generic Intelligent Fallback
        return `
            <div class="bot-section-reply">
                <p>Thank you for asking! For specialized blueprints, plot evaluations, or custom quotes, connect directly with our <strong>Founder & Managing Director</strong>:</p>
                ${getFounderCardHTML()}
                <p style="margin-top: 8px; font-size: 12px; color: rgba(255,255,255,0.7);">You can also click any of the quick suggestion chips below to explore more details.</p>
            </div>
        `;
    }

    // Handle form submit
    if (chatForm) {
        chatForm.addEventListener("submit", (e) => {
            e.preventDefault();
            const text = chatInput.value.trim();
            if (!text) return;

            chatInput.value = "";
            appendUserMessage(text);

            const responseHTML = getBotResponse(text);
            appendBotMessage(responseHTML);
        });
    }

    // Handle Quick Action Chips
    if (chatChips) {
        chatChips.addEventListener("click", (e) => {
            const btn = e.target.closest(".chip-btn");
            if (!btn) return;
            const query = btn.getAttribute("data-query") || btn.textContent;
            appendUserMessage(btn.textContent);
            const responseHTML = getBotResponse(query);
            appendBotMessage(responseHTML);
        });
    }
})();
