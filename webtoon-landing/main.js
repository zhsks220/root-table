gsap.registerPlugin(ScrollTrigger);

const panels = document.querySelectorAll('.panel');

panels.forEach((panel, index) => {
    gsap.to(panel, {
        scrollTrigger: {
            trigger: panel,
            start: "top 80%", // When top of panel hits 80% scroll height
            toggleActions: "play none none none",
        },
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        delay: index * 0.1 // Slight stagger
    });
});

// Optional: Speed lines or flicker effect during scroll
ScrollTrigger.create({
    trigger: ".manga-grid",
    start: "top center",
    onEnter: () => {
        document.body.style.backgroundColor = "#fff";
    }
});
