// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const headerOffset = 80;
            const elementPosition = target.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// Header scroll effect
let lastScroll = 0;
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        header.style.padding = '1rem 0';
    } else {
        header.style.padding = '1.5rem 0';
    }
    
    lastScroll = currentScroll;
});

// Investor form submission
const investorForm = document.getElementById('investor-form');
const investorSuccess = document.getElementById('investor-success');

if (investorForm && investorSuccess) {
    investorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
            type: 'investor',
            name: this.name.value,
            email: this.email.value,
            organisation: this.organisation.value,
            message: this.message.value,
            timestamp: new Date().toISOString()
        };
        
        console.log('Investor Form Submission:', formData);
        
        // Show success message
        investorSuccess.classList.add('show');
        
        // Reset form
        this.reset();
        
        // Hide success message after 5 seconds
        setTimeout(() => {
            investorSuccess.classList.remove('show');
        }, 5000);
    });
}

// Hotel form submission
const hotelForm = document.getElementById('hotel-form');
const hotelSuccess = document.getElementById('hotel-success');

hotelForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        type: 'hotel',
        name: this.name.value,
        hotel: this.hotel.value,
        email: this.email.value,
        location: this.location.value,
        message: this.message.value,
        timestamp: new Date().toISOString()
    };
    
    console.log('Hotel Form Submission:', formData);
    
    // Show success message
    hotelSuccess.classList.add('show');
    
    // Reset form
    this.reset();
    
    // Hide success message after 5 seconds
    setTimeout(() => {
        hotelSuccess.classList.remove('show');
    }, 5000);
});

// Add subtle parallax effect to hero section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.getElementById('hero');
    if (hero && scrolled < window.innerHeight) {
        hero.style.transform = `translateY(${scrolled * 0.3}px)`;
        hero.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all sections and cards
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section');
    const cards = document.querySelectorAll('.benefit-card');
    
    sections.forEach(section => {
        section.style.opacity = '0';
        section.style.transform = 'translateY(30px)';
        section.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(section);
    });
    
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });
});
