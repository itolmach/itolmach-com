document.addEventListener('DOMContentLoaded', () => {
    // Custom Cursor
    const cursor = document.getElementById('cursor');
    const cursorBlur = document.getElementById('cursor-blur');
    
    // Check if device supports hover (desktop)
    const isDesktop = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    if (isDesktop) {
        document.addEventListener('mousemove', (e) => {
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
            
            // Add a slight delay for the blur effect
            setTimeout(() => {
                cursorBlur.style.left = e.clientX + 'px';
                cursorBlur.style.top = e.clientY + 'px';
            }, 50);
        });

        // Add hover effect to interactive elements
        const interactiveElements = document.querySelectorAll('a, button, .magnetic-wrap');
        
        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                document.body.classList.add('cursor-hover');
            });
            
            el.addEventListener('mouseleave', () => {
                document.body.classList.remove('cursor-hover');
            });
        });
    } else {
        // Hide custom cursor on mobile
        cursor.style.display = 'none';
        cursorBlur.style.display = 'none';
    }

    // Scroll Reveal Animation
    const reveals = document.querySelectorAll('.reveal');
    
    const revealOnScroll = () => {
        const windowHeight = window.innerHeight;
        const elementVisible = 150;
        
        reveals.forEach(reveal => {
            const elementTop = reveal.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - elementVisible) {
                reveal.classList.add('active');
            }
        });
    };

    // Initial check
    revealOnScroll();
    
    // Listen for scroll
    window.addEventListener('scroll', revealOnScroll);

    // Navbar Glassmorphism Effect on Scroll
    const navbar = document.querySelector('.navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.padding = '1rem 0';
            navbar.style.background = 'rgba(10, 10, 10, 0.8)';
        } else {
            navbar.style.padding = '1.5rem 0';
            navbar.style.background = 'var(--glass-bg)';
        }
    });

    // Magnetic Effect for Project Cards
    const magnetics = document.querySelectorAll('.magnetic-wrap');
    
    if (isDesktop) {
        magnetics.forEach(magnetic => {
            magnetic.addEventListener('mousemove', (e) => {
                const position = magnetic.getBoundingClientRect();
                const x = e.pageX - position.left - position.width / 2;
                const y = e.pageY - position.top - position.height / 2;
                
                magnetic.style.transform = `translate(${x * 0.05}px, ${y * 0.05}px)`;
            });
            
            magnetic.addEventListener('mouseleave', () => {
                magnetic.style.transform = 'translate(0px, 0px)';
                magnetic.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
            });
            
            magnetic.addEventListener('mouseenter', () => {
                magnetic.style.transition = 'none';
            });
        });
    }
});
