// Dynamic Date and Active Scroll Tracking
document.addEventListener('DOMContentLoaded', () => {
    // Auto-update Policy Year
    const yearSpan = document.getElementById('policyDate');
    if(yearSpan) {
        yearSpan.innerText = new Date().getFullYear();
    }

    // ScrollSpy for Sidebar Links
    const sections = document.querySelectorAll('.policy-card');
    const navLinks = document.querySelectorAll('#tocList a');

    window.addEventListener('scroll', () => {
        let current = '';

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - 150)) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').includes(current)) {
                link.classList.add('active');
            }
        });
    });
});