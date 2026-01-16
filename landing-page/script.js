/**
 * GIBA APP - Landing Page Script
 * Modern interactions and animations
 */

document.addEventListener('DOMContentLoaded', function() {
    
    // ==================
    // FAQ Accordion
    // ==================
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });

    // ==================
    // Smooth Scroll
    // ==================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#' || href === '#cadastro') return; // Let these pass through
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                const navHeight = document.querySelector('.nav').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ==================
    // Scroll Animations
    // ==================
    const animateOnScroll = () => {
        const elements = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .journey-step, .faq-item');
        
        elements.forEach((el, index) => {
            const rect = el.getBoundingClientRect();
            const isVisible = rect.top < window.innerHeight - 100;
            
            if (isVisible && !el.classList.contains('animated')) {
                el.classList.add('animated');
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
                el.style.transitionDelay = `${index * 0.05}s`;
            }
        });
    };

    // Initial setup for animated elements
    document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card, .journey-step, .faq-item').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    });

    // Run on load and scroll
    window.addEventListener('scroll', animateOnScroll, { passive: true });
    animateOnScroll();

    // ==================
    // Navigation Effects
    // ==================
    const nav = document.querySelector('.nav');
    let lastScrollY = 0;
    
    const handleNavScroll = () => {
        const currentScrollY = window.pageYOffset;
        
        // Add shadow when scrolled
        if (currentScrollY > 50) {
            nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            nav.style.boxShadow = 'none';
        }
        
        lastScrollY = currentScrollY;
    };
    
    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // ==================
    // Sticky CTA Mobile
    // ==================
    const stickyCTA = document.getElementById('sticky-cta');
    
    const handleStickyCTA = () => {
        if (window.innerWidth <= 768) {
            const scrollTop = window.pageYOffset;
            const heroBottom = document.querySelector('.hero').offsetHeight;
            
            if (scrollTop > heroBottom - 200) {
                stickyCTA.classList.add('show');
            } else {
                stickyCTA.classList.remove('show');
            }
        } else {
            stickyCTA.classList.remove('show');
        }
    };
    
    window.addEventListener('scroll', handleStickyCTA, { passive: true });
    window.addEventListener('resize', handleStickyCTA);
    handleStickyCTA();

    // ==================
    // CTA Click Handlers
    // ==================
    document.querySelectorAll('a[href="#cadastro"]').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            // Redirect to signup page
            window.location.href = '/cadastro';
        });
    });

    // ==================
    // Phone Mockup Animation
    // ==================
    const phoneMockup = document.querySelector('.phone-mockup');
    
    if (phoneMockup) {
        let tiltX = 0;
        let tiltY = 0;
        
        document.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 968) {
                const rect = phoneMockup.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                
                tiltX = (e.clientY - centerY) / 50;
                tiltY = (centerX - e.clientX) / 50;
                
                // Limit tilt
                tiltX = Math.max(-8, Math.min(8, tiltX));
                tiltY = Math.max(-8, Math.min(8, tiltY));
                
                phoneMockup.style.transform = `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`;
            }
        });
        
        document.addEventListener('mouseleave', () => {
            phoneMockup.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
        });
    }

    // ==================
    // Floating Cards Parallax
    // ==================
    const floatingCards = document.querySelectorAll('.floating-card');
    
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        
        floatingCards.forEach((card, index) => {
            const speed = index % 2 === 0 ? 0.03 : -0.02;
            card.style.transform = `translateY(${scrollY * speed}px)`;
        });
    }, { passive: true });

    // ==================
    // Button Ripple Effect
    // ==================
    document.querySelectorAll('.btn-primary, .btn-secondary').forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            ripple.style.cssText = `
                position: absolute;
                width: 0;
                height: 0;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                transform: translate(-50%, -50%);
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
                animation: rippleEffect 0.6s ease-out forwards;
            `;
            
            btn.style.position = 'relative';
            btn.style.overflow = 'hidden';
            btn.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Add ripple animation keyframes
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rippleEffect {
            to {
                width: 300px;
                height: 300px;
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // ==================
    // Intersection Observer for Sections
    // ==================
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('section-visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '-50px 0px'
    });

    document.querySelectorAll('section').forEach(section => {
        sectionObserver.observe(section);
    });

    // ==================
    // Pricing Card Hover
    // ==================
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            pricingCards.forEach(c => {
                if (c !== this && !c.classList.contains('featured')) {
                    c.style.opacity = '0.7';
                    c.style.transform = 'scale(0.98)';
                }
            });
        });
        
        card.addEventListener('mouseleave', function() {
            pricingCards.forEach(c => {
                if (!c.classList.contains('featured')) {
                    c.style.opacity = '1';
                    c.style.transform = 'scale(1)';
                } else {
                    c.style.transform = 'scale(1.05)';
                }
            });
        });
    });

    // ==================
    // Testimonial Auto-scroll (Mobile)
    // ==================
    if (window.innerWidth <= 768) {
        const testimonialsGrid = document.querySelector('.testimonials-grid');
        if (testimonialsGrid) {
            let scrollPosition = 0;
            const cards = testimonialsGrid.querySelectorAll('.testimonial-card');
            const cardWidth = cards[0]?.offsetWidth + 24 || 300;
            
            // Enable horizontal scroll on mobile
            testimonialsGrid.style.display = 'flex';
            testimonialsGrid.style.overflowX = 'auto';
            testimonialsGrid.style.scrollSnapType = 'x mandatory';
            testimonialsGrid.style.gap = '16px';
            testimonialsGrid.style.paddingBottom = '16px';
            
            cards.forEach(card => {
                card.style.minWidth = '85vw';
                card.style.scrollSnapAlign = 'center';
            });
        }
    }

    // ==================
    // Console Easter Egg
    // ==================
    console.log('%c💪 Giba App', 'font-size: 24px; font-weight: bold; color: #f59e0b;');
    console.log('%cTransforme seu corpo com ciência e praticidade!', 'font-size: 14px; color: #8b95a5;');
    console.log('%chttps://gibaapp.com', 'font-size: 12px; color: #4ade80;');

});

// ==================
// Preloader (optional)
// ==================
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});
