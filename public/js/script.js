/* =====================================================
   MOBILE MENU
===================================================== */

const menuToggle = document.getElementById("menuToggle");
const mobileMenu = document.getElementById("mobileMenu");


// Open / Close menu
menuToggle.addEventListener("click", function () {

    mobileMenu.classList.toggle("open");

});


// Close menu after clicking a link
const mobileLinks =
    document.querySelectorAll(".mobile-menu a");


mobileLinks.forEach(function (link) {

    link.addEventListener("click", function () {

        mobileMenu.classList.remove("open");

    });

});


/* =====================================================
   HEADER SHADOW ON SCROLL
===================================================== */

const header =
    document.querySelector(".main-header");


window.addEventListener("scroll", function () {

    if (window.scrollY > 30) {

        header.style.boxShadow =
            "0 10px 30px rgba(0,0,0,0.15), 0 5px 0 rgba(255,255,255,0.7)";

    } else {

        header.style.boxShadow =
            "0 8px 0 rgba(255,255,255,0.65), 0 18px 40px rgba(0,0,0,0.10)";

    }

});


/* =====================================================
   CLOSE MENU WHEN CLICKING OUTSIDE
===================================================== */

document.addEventListener("click", function (event) {

    const clickedInsideMenu =
        mobileMenu.contains(event.target);

    const clickedButton =
        menuToggle.contains(event.target);


    if (
        !clickedInsideMenu &&
        !clickedButton
    ) {

        mobileMenu.classList.remove("open");

    }

});

document.addEventListener("DOMContentLoaded", () => {
    const stage = document.getElementById("carouselStage");
    const cards = Array.from(stage.querySelectorAll(".product-card"));
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const dotsContainer = document.getElementById("carouselDots");

    let activeIndex = 0;
    const total = cards.length;

    // Create pagination dots
    cards.forEach((_, i) => {
        const dot = document.createElement("div");
        dot.classList.add("dot");
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", () => goToSlide(i));
        dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.querySelectorAll(".dot"));

function updatePositions() {
    const stageWidth = stage.offsetWidth;
    const cardWidth = cards[0].offsetWidth;
    
    // Calculate the translation required to center the active card
    const centerTranslateX = (stageWidth - cardWidth) / 2;

    cards.forEach((card, index) => {
        // Distance relative to current active slide
        let diff = index - activeIndex;

        // Handle wrap-around diff for continuous loop calculation
        if (diff > total / 2) diff -= total;
        if (diff < -total / 2) diff += total;

        if (diff === 0) {
            // Active Center Card: scale 1.0, full opacity
            card.style.transform = `translate(${centerTranslateX}px, 0px) scale(1)`;
            card.style.zIndex = 10;
            card.style.opacity = "1";
        } else if (diff === -1) {
            // Left Side Card: scale 0.5, increased gap/margin from center card
            const leftX = centerTranslateX - (cardWidth * 0.58);
            card.style.transform = `translate(${leftX}px, 0px) scale(0.5)`;
            card.style.zIndex = 5;
            card.style.opacity = "0.85";
        } else if (diff === 1) {
            // Right Side Card: scale 0.5, increased gap/margin from center card
            const rightX = centerTranslateX + (cardWidth * 0.58);
            card.style.transform = `translate(${rightX}px, 0px) scale(0.5)`;
            card.style.zIndex = 5;
            card.style.opacity = "0.85";
        } else {
            // Off-screen hidden cards
            const farX = centerTranslateX + (diff * cardWidth * 0.6);
            card.style.transform = `translate(${farX}px, 0px) scale(0.5)`;
            card.style.zIndex = 1;
            card.style.opacity = "0";
        }
    });

    // Update active dot indicator
    dots.forEach((dot, idx) => {
        dot.classList.toggle("active", idx === activeIndex);
    });
}

    function goToSlide(index) {
        activeIndex = index;
        updatePositions();
    }

    nextBtn.addEventListener("click", () => {
        activeIndex = (activeIndex + 1) % total;
        updatePositions();
    });

    prevBtn.addEventListener("click", () => {
        activeIndex = (activeIndex - 1 + total) % total;
        updatePositions();
    });

    window.addEventListener("resize", updatePositions);
    updatePositions();
});


// Form Submission
function handleFormSubmit(event) {
    event.preventDefault();
    alert('Enquiry Submitted Successfully!');
    closeModal();
}