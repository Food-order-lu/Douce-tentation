document.addEventListener('DOMContentLoaded', () => {
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
        observer.observe(el);
    });
});

function toggleMenu() {
    const navLinks = document.getElementById('navLinks');
    const mobileBtn = document.querySelector('.mobile-menu-btn i');

    navLinks.classList.toggle('active');

    if (navLinks.classList.contains('active')) {
        mobileBtn.classList.replace('fa-bars', 'fa-times');
    } else {
        mobileBtn.classList.replace('fa-times', 'fa-bars');
    }
}
