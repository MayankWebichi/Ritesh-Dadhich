document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       0. PRELOADER & ASSET MANAGEMENT
       ========================================= */
    const preloader = document.getElementById('preloader');
    const loadProgress = document.getElementById('load-progress');
    const percentText = document.getElementById('percent');

    /* =========================================
       1. SCROLLYTELLING ENGINE (Canvas Sequence)
       ========================================= */
    const canvas = document.getElementById('scroll-sequence');
    const ctx = canvas.getContext('2d');

    // Configuration
    // Configuration
    const frameCount = 240;
    // CRITICAL FIX: URL encoding for spaces in folder name
    const currentFrame = index => `Sequence%20images/ezgif-frame-${index.toString().padStart(3, '0')}.jpg`;

    const images = [];
    let imagesLoaded = 0;

    const updateProgress = () => {
        imagesLoaded++;
        const percent = Math.floor((imagesLoaded / frameCount) * 100);

        if (loadProgress) loadProgress.style.width = `${percent}%`;
        if (percentText) percentText.innerText = `${percent}%`;

        // LAZY LOAD START: Start site after 30 frames (approx 10-15%)
        if (imagesLoaded === 30) {
            // Fade out preloader early
            setTimeout(() => {
                preloader.style.opacity = '0';
                setTimeout(() => {
                    preloader.style.display = 'none';
                    // Trigger initial render
                    render();
                    // Reveal Hero Elements
                    const hero = document.querySelector('.hero-section');
                    if (hero) hero.classList.add('active');
                }, 800);
            }, 500);
        }
    };

    const preloadImages = () => {
        for (let i = 1; i <= frameCount; i++) {
            const img = new Image();
            img.src = currentFrame(i);
            img.onload = updateProgress;
            img.onerror = updateProgress; // Proceed even if frame fails
            images.push(img);
        }
    };

    // Draw Frame
    // We use "cover" fit logic for the canvas
    const render = () => {
        // Calculate frame index based on scroll
        const scrollTop = document.documentElement.scrollTop;
        const maxScrollTop = document.documentElement.scrollHeight - window.innerHeight;
        const scrollFraction = Math.max(0, Math.min(1, scrollTop / maxScrollTop)); // Clamp between 0 and 1

        // Map scroll fraction to frame index
        // We might want to stop the sequence at the footer, so maybe adjust maxScrollTop logic if needed.
        // For now, map 0-100% scroll to 1-240 frames.
        const frameIndex = Math.min(
            frameCount - 1,
            Math.ceil(scrollFraction * frameCount)
        );

        requestAnimationFrame(() => updateCanvas(frameIndex + 1));
    };

    const updateCanvas = index => {
        // Ensure index is valid [1, 240]
        if (index < 1) index = 1;
        if (index > frameCount) index = frameCount;

        const img = images[index - 1];

        // Safety check if image is loaded
        if (img && img.complete) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            // Draw Image "Cover" style
            const hRatio = canvas.width / img.width;
            const vRatio = canvas.height / img.height;
            const ratio = Math.max(hRatio, vRatio);

            const centerShift_x = (canvas.width - img.width * ratio) / 2;
            const centerShift_y = (canvas.height - img.height * ratio) / 2;

            // Clean
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw
            ctx.drawImage(img,
                0, 0, img.width, img.height,
                centerShift_x, centerShift_y, img.width * ratio, img.height * ratio
            );

            // Apply "Morph" effect (Blur/Darken) when in About section
            // About section is roughly the 2nd viewport, so scrollFraction > 0.3
            const scrollFraction = document.documentElement.scrollTop / (document.documentElement.scrollHeight - window.innerHeight);

            if (scrollFraction > 0.2) {
                // Determine intensity of overlay
                const intensity = Math.min(0.6, (scrollFraction - 0.2) * 2); // Max 0.6 opacity
                const blurAmount = Math.min(5, (scrollFraction - 0.2) * 20); // Max 5px blur

                // Darken
                ctx.fillStyle = `rgba(38, 38, 38, ${intensity})`; // Slate color
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Note: Canvas filter blur is expensive on performance, use carefully or fallback to CSS backdrop-filter on overlay div if FPS drops.
                // For now, let's skip canvas-level blur for performance and rely on the overlay fill.
            }
        }
    };

    // Initialize
    preloadImages();
    // Initial render attempt (wait for first image)
    images[0].onload = () => render();

    // Listen to scroll
    window.addEventListener('scroll', () => {
        requestAnimationFrame(render);
    });

    window.addEventListener('resize', () => requestAnimationFrame(render));

    /* =========================================
       2. INTERACTIONS (Physics & Glitch)
       ========================================= */

    // a. Magnetic Buttons
    const magneticBtns = document.querySelectorAll('.magnetic-btn');
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-dot-outline');

    // Cursor Follow
    let cursorX = 0, cursorY = 0;
    let outlineX = 0, outlineY = 0;

    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        cursorDot.style.left = `${cursorX}px`;
        cursorDot.style.top = `${cursorY}px`;

        // Liquid Button Magnetic Effect
        const liquidBtn = document.querySelector('.liquid-btn');
        if (liquidBtn) {
            const rect = liquidBtn.getBoundingClientRect();
            const dist = Math.hypot(cursorX - (rect.left + rect.width / 2), cursorY - (rect.top + rect.height / 2));
            if (dist < 100) {
                const x = (cursorX - (rect.left + rect.width / 2)) * 0.3;
                const y = (cursorY - (rect.top + rect.height / 2)) * 0.3;
                liquidBtn.style.transform = `translate(${x}px, ${y}px) scale(1.05)`;
            } else {
                liquidBtn.style.transform = `translate(0px, 0px) scale(1)`;
            }
        }
    });

    const animateCursor = () => {
        const dx = cursorX - outlineX;
        const dy = cursorY - outlineY;
        outlineX += dx * 0.15;
        outlineY += dy * 0.15;
        cursorOutline.style.left = `${outlineX}px`;
        cursorOutline.style.top = `${outlineY}px`;
        requestAnimationFrame(animateCursor);
    };
    animateCursor();

    // b. Polaroid Tilt Effect (Mouse Move Parallax)
    const polaroids = document.querySelectorAll('.polaroid-card');
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth / 2 - e.clientX) / 50;
        const y = (window.innerHeight / 2 - e.clientY) / 50;

        polaroids.forEach((card, index) => {
            const factor = index + 1; // Different speeds
            const rotate = index % 2 === 0 ? -5 : 8;
            card.style.transform = `rotate(${rotate}deg) translate(${x * factor}px, ${y * factor}px)`;
        });
    });

    /* =========================================
       3. AUDIO VISUALIZER (Simulated)
       ========================================= */
    const audioCanvas = document.getElementById('audio-visualizer');
    if (audioCanvas) {
        const aCtx = audioCanvas.getContext('2d');
        const resizeAudio = () => {
            // Parent container sizing
            const parent = audioCanvas.parentElement;
            audioCanvas.width = parent.offsetWidth;
            audioCanvas.height = parent.offsetHeight;
        };
        // Delay resize to ensure layout is done
        setTimeout(resizeAudio, 100);
        window.addEventListener('resize', resizeAudio);

        const bars = Array(60).fill(0).map(() => Math.random() * 50);

        const drawVisualizer = () => {
            aCtx.clearRect(0, 0, audioCanvas.width, audioCanvas.height);
            const barWidth = audioCanvas.width / bars.length;

            bars.forEach((h, i) => {
                // Animate noise - MORE ENERGY
                bars[i] += (Math.random() - 0.5) * 30; // Bigger jumps

                // Clamp and decaying return to center
                // We want them to bounce around 20-80 range
                if (bars[i] < 10) bars[i] += 5;
                if (bars[i] > 120) bars[i] -= 5;

                // Draw Bar
                const x = i * barWidth;
                // Taller bars: Multiplier 1.5
                const height = (bars[i] / 100) * audioCanvas.height * 0.8;

                // Cyan Glow
                aCtx.fillStyle = `rgba(0, 245, 212, ${0.4 + (bars[i] / 200)})`; // Higher base opacity
                aCtx.shadowBlur = 15;
                aCtx.shadowColor = "rgba(0, 245, 212, 0.8)";
                aCtx.fillRect(x, audioCanvas.height - height, barWidth - 2, height);
                aCtx.shadowBlur = 0; // Reset
            });
            requestAnimationFrame(drawVisualizer);
        };
        drawVisualizer();
    }
    /* =========================================
       4. MAGIC UI (Vanilla Port)
       ========================================= */

    // A. HyperText (Glitch Shuffle on Brand Name)
    const brandName = document.querySelector('.brand-name');
    if (brandName) {
        brandName.addEventListener('mouseover', event => {
            const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            let interval = null;
            let iteration = 0;

            clearInterval(interval);

            interval = setInterval(() => {
                event.target.innerText = event.target.innerText
                    .split("")
                    .map((letter, index) => {
                        if (index < iteration) {
                            return event.target.dataset.value[index];
                        }
                        return letters[Math.floor(Math.random() * 26)]
                    })
                    .join("");

                if (iteration >= event.target.dataset.value.length) {
                    clearInterval(interval);
                }

                iteration += 1 / 3;
            }, 30);
        });
        // Store original text
        brandName.dataset.value = brandName.innerText;
    }

    // B. Number Ticker (Intersection Observer)
    const statsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const ticker = entry.target;
                const endValue = parseInt(ticker.dataset.value);
                let startValue = 0;
                let duration = 2000;
                let startTime = null;

                const step = (timestamp) => {
                    if (!startTime) startTime = timestamp;
                    const progress = Math.min((timestamp - startTime) / duration, 1);
                    ticker.innerText = Math.floor(progress * (endValue - startValue) + startValue);
                    if (progress < 1) {
                        window.requestAnimationFrame(step);
                    }
                };
                window.requestAnimationFrame(step);
                statsObserver.unobserve(ticker);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.number-ticker').forEach(el => statsObserver.observe(el));

    // C. Animated List (Notifications)
    const listContainer = document.getElementById('animated-list');
    if (listContainer) {
        const notifications = [
            { name: "New Research", desc: "AIIMS Journal", icon: "🗞️", color: "#00C9A7" },
            { name: "Lab Result", desc: "P. Science", icon: "🧬", color: "#FFB800" },
            { name: "Emergency", desc: "Trauma Center", icon: "🚨", color: "#FF3D71" },
            { name: "Shift Update", desc: "ICU Ward", icon: "⏱️", color: "#1E86FF" }
        ];

        let notifIndex = 0;

        setInterval(() => {
            const item = notifications[notifIndex % notifications.length];

            const card = document.createElement('div');
            card.className = 'notification-item';
            card.innerHTML = `
                <div class="notif-icon" style="color: ${item.color}">${item.icon}</div>
                <div class="notif-content">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                </div>
            `;

            listContainer.prepend(card);
            notifIndex++;

            // Remove old items to keep list clean
            if (listContainer.children.length > 3) {
                const last = listContainer.lastElementChild;
                last.style.opacity = '0';
                setTimeout(() => last.remove(), 300);
            }
        }, 3000); // Add new every 3 seconds
    }

    // D. Video Text (Simple lazy load if needed, already handled by HTML5)
    // Ensure video plays
    const videoBg = document.querySelector('.video-bg');
    if (videoBg) videoBg.play().catch(e => console.log("Autoplay blocked", e));

    // E. Typing Animation (Fixed for proper spacing)
    const typingText = document.querySelector('.typing-text');
    if (typingText) {
        const textToType = typingText.dataset.text;
        typingText.textContent = ''; // Use textContent instead of innerText
        typingText.style.whiteSpace = 'pre-wrap'; // Preserve spaces
        let typeIndex = 0;

        const typeChar = () => {
            if (typeIndex < textToType.length) {
                const currentChar = textToType.charAt(typeIndex);

                // Use textContent to preserve spaces
                typingText.textContent += currentChar;
                typeIndex++;

                // Longer delay after spaces to ensure they render
                const delay = currentChar === ' ' ? 150 : 50;
                setTimeout(typeChar, delay);
            }
        };

        // Start typing when in view
        const typeObserver = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    typeChar();
                    typeObserver.unobserve(e.target);
                }
            });
        });
        typeObserver.observe(typingText);
    }

    /* =========================================
       5. BACKGROUND AUDIO
       ========================================= */
    const bgMusic = document.getElementById('bg-music');
    if (bgMusic) {
        bgMusic.volume = 0.5; // Set initial volume

        const playMusic = () => {
            bgMusic.play().then(() => {
                console.log("Music started");
                // Remove listener once started
                window.removeEventListener('scroll', playMusic);
                window.removeEventListener('click', playMusic);
            }).catch(e => {
                console.log("Audio autoplay prevented", e);
            });
        };

        // Try on scroll or click (user interaction)
        window.addEventListener('scroll', playMusic, { once: true });
        window.addEventListener('click', playMusic, { once: true });
    }

    /* =========================================
       6. SCROLL PROGRESS INDICATOR
       ========================================= */
    const progressBar = document.querySelector('.scroll-progress-bar');
    if (progressBar) {
        window.addEventListener('scroll', () => {
            const scrollTop = document.documentElement.scrollTop;
            const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
            const progress = (scrollTop / scrollHeight) * 100;
            progressBar.style.width = `${progress}%`;
        });
    }

    /* =========================================
       7. PARTICLE SYSTEM (Floating Fireflies)
       ========================================= */
    const particlesContainer = document.getElementById('particles-container');
    if (particlesContainer) {
        const createParticle = () => {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const startX = Math.random() * window.innerWidth;
            const driftX = (Math.random() - 0.5) * 200;
            const duration = 8 + Math.random() * 12; // 8-20s
            const delay = Math.random() * 5;

            particle.style.left = `${startX}px`;
            particle.style.setProperty('--drift-x', `${driftX}px`);
            particle.style.animationDuration = `${duration}s`;
            particle.style.animationDelay = `${delay}s`;

            particlesContainer.appendChild(particle);

            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, (duration + delay) * 1000);
        };

        // Create initial batch
        for (let i = 0; i < 20; i++) {
            createParticle();
        }

        // Continuous spawning
        setInterval(createParticle, 800);
    }

    /* =========================================
       8. MOUSE TRAIL
       ========================================= */
    let lastTrailTime = 0;
    document.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastTrailTime < 50) return; // Throttle to 20 FPS
        lastTrailTime = now;

        const trail = document.createElement('div');
        trail.className = 'trail-particle';
        trail.style.left = `${e.clientX}px`;
        trail.style.top = `${e.clientY}px`;
        document.body.appendChild(trail);

        setTimeout(() => trail.remove(), 800);
    });

    /* =========================================
       9. 3D CARD TILT ON MOUSE MOVE
       ========================================= */
    const cards = document.querySelectorAll('.polaroid-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * 10;  // Max 10deg
            const rotateY = ((x - centerX) / centerX) * -10; // Max 10deg

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.15)`;
        });

        card.addEventListener('mouseleave', () => {
            const baseRotate = card.classList.contains('tilt-left') ? 'rotate(-5deg)' : 'rotate(8deg)';
            card.style.transform = baseRotate;
        });
    });

    /* =========================================
       10. TEXT SCRAMBLE EFFECT
       ========================================= */
    const scrambleElements = document.querySelectorAll('.narrative-heading');
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    scrambleElements.forEach(el => {
        const originalText = el.textContent;

        const scramble = () => {
            let iteration = 0;
            const interval = setInterval(() => {
                el.textContent = originalText.split('').map((char, index) => {
                    if (index < iteration) {
                        return originalText[index];
                    }
                    return chars[Math.floor(Math.random() * chars.length)];
                }).join('');

                iteration += 1 / 3;
                if (iteration >= originalText.length) {
                    clearInterval(interval);
                }
            }, 30);
        };

        // Trigger on intersection
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(e => {
                if (e.isIntersecting) {
                    scramble();
                    observer.unobserve(e.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(el);
    });

    /* =========================================
       11. SMOOTH SCROLL (Custom Momentum)
       ========================================= */
    let scrollTarget = 0;
    let currentScroll = 0;
    const ease = 0.075;

    function smoothScrollUpdate() {
        currentScroll += (scrollTarget - currentScroll) * ease;

        if (Math.abs(scrollTarget - currentScroll) < 0.5) {
            currentScroll = scrollTarget;
        }

        requestAnimationFrame(smoothScrollUpdate);
    }

    window.addEventListener('scroll', () => {
        scrollTarget = window.pageYOffset;
    });

    // Note: For true smooth scroll, would need to virtualize the page
    // This is a simplified version that adds momentum feel
    smoothScrollUpdate();

    /* =========================================
       12. MATRIX RAIN EASTER EGG (Ctrl+Shift+M)
       ========================================= */
    let matrixActive = false;
    let matrixCanvas = null;

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
            e.preventDefault();

            if (matrixActive) {
                // Deactivate
                if (matrixCanvas) {
                    matrixCanvas.remove();
                    matrixCanvas = null;
                }
                matrixActive = false;
            } else {
                // Activate Matrix Rain
                matrixActive = true;
                matrixCanvas = document.createElement('canvas');
                matrixCanvas.id = 'matrix-rain';
                matrixCanvas.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: 9999;
                    pointer-events: none;
                    opacity: 0.8;
                `;
                document.body.appendChild(matrixCanvas);

                const ctx = matrixCanvas.getContext('2d');
                matrixCanvas.width = window.innerWidth;
                matrixCanvas.height = window.innerHeight;

                const fontSize = 16;
                const columns = Math.floor(matrixCanvas.width / fontSize);
                const drops = Array(columns).fill(1);

                function drawMatrix() {
                    if (!matrixActive) return;

                    ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
                    ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

                    ctx.fillStyle = '#0F0';
                    ctx.font = fontSize + 'px monospace';

                    for (let i = 0; i < drops.length; i++) {
                        const text = String.fromCharCode(0x30A0 + Math.random() * 96);
                        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                        if (drops[i] * fontSize > matrixCanvas.height && Math.random() > 0.975) {
                            drops[i] = 0;
                        }
                        drops[i]++;
                    }
                }

                setInterval(drawMatrix, 50);
            }
        }
    });

    /* =========================================
       13. SOUND EFFECTS (Hover/Click)
       ========================================= */
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();

    function playTone(frequency, duration, volume = 0.1) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';

        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
    }

    // Add sounds to nav links
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('mouseenter', () => playTone(800, 0.1, 0.05));
        link.addEventListener('click', () => playTone(1200, 0.15, 0.08));
    });

    // Liquid button sound
    const liquidBtn = document.querySelector('.liquid-btn');
    if (liquidBtn) {
        liquidBtn.addEventListener('mouseenter', () => playTone(600, 0.15, 0.06));
        liquidBtn.addEventListener('click', () => {
            playTone(1000, 0.1, 0.08);
            setTimeout(() => playTone(1500, 0.1, 0.08), 100);
        });
    }

    /* =========================================
       14. SKILL BAR ANIMATIONS
       ========================================= */
    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const skillFill = entry.target;
                const targetWidth = skillFill.dataset.skill + '%';
                skillFill.style.width = targetWidth;
                skillObserver.unobserve(skillFill);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.skill-fill').forEach(skill => {
        skillObserver.observe(skill);
    });

    /* =========================================
       15. HERO STATS COUNTER ANIMATION
       ========================================= */
    const heroStats = document.querySelectorAll('.hero-stat-value');
    heroStats.forEach(stat => {
        const target = parseInt(stat.dataset.target);
        let current = 0;
        const increment = target / 100; // 100 steps
        const duration = 2000; // 2 seconds
        const stepTime = duration / 100;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                stat.textContent = Math.floor(current);
                setTimeout(updateCounter, stepTime);
            } else {
                stat.textContent = target;
            }
        };

        // Start counting after preloader
        setTimeout(updateCounter, 1500);
    });

    /* =========================================
       16. DOWNLOAD RESUME BUTTON
       ========================================= */
    const downloadBtn = document.getElementById('downloadResume');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Play sound
            playTone(1200, 0.2, 0.1);
            setTimeout(() => playTone(1500, 0.2, 0.1), 150);

            // Create particle burst effect
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.style.cssText = `
                    position: fixed;
                    left: ${e.clientX}px;
                    top: ${e.clientY}px;
                    width: 8px;
                    height: 8px;
                    background: var(--biolum-cyan);
                    border-radius: 50%;
                    pointer-events: none;
                    z-index: 10000;
                `;
                document.body.appendChild(particle);

                const angle = (Math.PI * 2 * i) / 20;
                const velocity = 3 + Math.random() * 2;
                const vx = Math.cos(angle) * velocity;
                const vy = Math.sin(angle) * velocity;

                let px = e.clientX;
                let py = e.clientY;
                let life = 1;

                const animate = () => {
                    px += vx;
                    py += vy;
                    life -= 0.02;

                    particle.style.left = px + 'px';
                    particle.style.top = py + 'px';
                    particle.style.opacity = life;

                    if (life > 0) {
                        requestAnimationFrame(animate);
                    } else {
                        particle.remove();
                    }
                };
                animate();
            }

            // Simulate download (replace with actual file link)
            alert('Resume download would start here!\n\nIn production, replace this with:\nwindow.location.href = "path/to/ritesh_dadhich_resume.pdf"');

            // Example of actual download:
            // window.location.href = 'ritesh_dadhich_resume.pdf';
        });
    }

    /* =========================================
       PHASE 2: ADVANCED FEATURES
       ========================================= */

    /* =========================================
       17. CONTACT FORM WITH VALIDATION
       ========================================= */
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            //Clear previous errors
            document.querySelectorAll('.form-error').forEach(err => err.classList.remove('show'));

            // Get form data
            const name = document.getElementById('name').value.trim();
            const email = document.getElementById('email').value.trim();
            const subject = document.getElementById('subject').value.trim();
            const message = document.getElementById('message').value.trim();

            // Validation
            let isValid = true;

            if (name.length < 2) {
                showError('name', 'Name must be at least 2 characters');
                isValid = false;
            }

            if (!isValidEmail(email)) {
                showError('email', 'Please enter a valid email address');
                isValid = false;
            }

            if (subject.length < 3) {
                showError('subject', 'Subject must be at least 3 characters');
                isValid = false;
            }

            if (message.length < 10) {
                showError('message', 'Message must be at least 10 characters');
                isValid = false;
            }

            if (!isValid) {
                playTone(400, 0.3, 0.1); // Error sound
                return;
            }

            // Show loading
            const submitBtn = e.target.querySelector('.form-submit-btn');
            submitBtn.classList.add('loading');

            // Simulate sending (replace with actual API call)
            setTimeout(() => {
                submitBtn.classList.remove('loading');
                document.querySelector('.form-success').classList.add('show');
                contactForm.reset();

                // Success sound
                playTone(800, 0.2, 0.1);
                setTimeout(() => playTone(1200, 0.2, 0.1), 150);

                // Hide success message after 5s
                setTimeout(() => {
                    document.querySelector('.form-success').classList.remove('show');
                }, 5000);
            }, 2000);
        });

        function showError(fieldId, errorMessage) {
            const field = document.getElementById(fieldId);
            const error = field.nextElementSibling;
            error.textContent = errorMessage;
            error.classList.add('show');
            field.focus();
        }

        function isValidEmail(email) {
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        }
    }

    /* =========================================
       18. LIGHTBOX GALLERY
       ========================================= */
    const polaroidCards = document.querySelectorAll('.polaroid-card img');
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.getElementById('lightboxClose');
    const lightboxPrev = document.getElementById('lightboxPrev');
    const lightboxNext = document.getElementById('lightboxNext');

    let currentImageIndex = 0;
    const lightboxImages = Array.from(polaroidCards).map(img => img.src);

    polaroidCards.forEach((img, index) => {
        img.style.cursor = 'pointer';
        img.addEventListener('click', () => {
            currentImageIndex = index;
            openLightbox();
        });
    });

    function openLightbox() {
        lightboxImg.src = lightboxImages[currentImageIndex];
        lightbox.classList.add('active');
        playTone(600, 0.1, 0.05);
        document.body.style.overflow = 'hidden';
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        playTone(400, 0.1, 0.05);
        document.body.style.overflow = '';
    }

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) closeLightbox();
    });

    lightboxPrev.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex - 1 + lightboxImages.length) % lightboxImages.length;
        lightboxImg.src = lightboxImages[currentImageIndex];
        playTone(500, 0.1, 0.05);
    });

    lightboxNext.addEventListener('click', () => {
        currentImageIndex = (currentImageIndex + 1) % lightboxImages.length;
        lightboxImg.src = lightboxImages[currentImageIndex];
        playTone(700, 0.1, 0.05);
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') lightboxPrev.click();
        if (e.key === 'ArrowRight') lightboxNext.click();
    });

    /* =========================================
       19. ADDITIONAL EASTER EGGS
       ========================================= */

    // Konami Code Easter Egg
    let konamiCode = [];
    const konamiSequence = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

    document.addEventListener('keydown', (e) => {
        konamiCode.push(e.key);
        konamiCode = konamiCode.slice(-10);

        if (konamiCode.join(',') === konamiSequence.join(',')) {
            // Konami code activated!
            document.body.style.animation = 'rainbow 2s linear infinite';
            playTone(1000, 0.1, 0.1);
            setTimeout(() => playTone(1200, 0.1, 0.1), 100);
            setTimeout(() => playTone(1500, 0.2, 0.1), 200);

            alert('🎮 KONAMI CODE ACTIVATED! 🎮\\n\\nYou found the secret!\\n\\nAwesome achievement unlocked!');

            setTimeout(() => {
                document.body.style.animation = '';
            }, 5000);
        }
    });

    // Triple-click logo easter egg
    let logoClickCount = 0;
    const brandLogo = document.querySelector('.brand-logo');
    if (brandLogo) {
        brandLogo.addEventListener('click', () => {
            logoClickCount++;

            if (logoClickCount === 3) {
                // Secret unlocked
                playTone(2000, 0.5, 0.1);
                const facts = [
                    '💡 The heart beats about 100,000 times per day!',
                    '🧬 Your body has about 37.2 trillion cells!',
                    '🫀 Blood makes up about 7% of your body weight!',
                    '🧠 The brain uses 20% of body\'s oxygen!',
                    '💪 The human body has 206 bones!'
                ];
                const randomFact = facts[Math.floor(Math.random() * facts.length)];
                alert(`🎯 SECRET UNLOCKED!\\n\\nMedical Fact:\\n${randomFact}`);
                logoClickCount = 0;
            }

            setTimeout(() => {
                logoClickCount = 0;
            }, 2000);
        });
    }

    /* =========================================
       PHASE 3 & 4: ULTIMATE FEATURES
       ========================================= */

    /* =========================================
       20. SERVICE WORKER REGISTRATION (PWA)
       ========================================= */
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then((registration) => {
                    console.log('✅ Service Worker registered:', registration.scope);
                })
                .catch((error) => {
                    console.log('❌ Service Worker registration failed:', error);
                });
        });
    }

    /* ======================================== =
       21. VOICE COMMAND SYSTEM
       ========================================= */
    const voiceIndicator = document.getElementById('voiceIndicator');
    let recognition;

    // Check for Web Speech API support
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim();
            console.log('🎤 Voice command:', transcript);

            // Command processing
            if (transcript.includes('show skills') || transcript.includes('show expertise')) {
                document.getElementById('expertise')?.scrollIntoView({ behavior: 'smooth' });
                playTone(1000, 0.2, 0.1);
            } else if (transcript.includes('show timeline') || transcript.includes('show journey')) {
                document.getElementById('timeline')?.scrollIntoView({ behavior: 'smooth' });
                playTone(1000, 0.2, 0.1);
            } else if (transcript.includes('show achievements') || transcript.includes('show badges')) {
                document.getElementById('achievements')?.scrollIntoView({ behavior: 'smooth' });
                playTone(1000, 0.2, 0.1);
            } else if (transcript.includes('show contact') || transcript.includes('contact form')) {
                document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' });
                playTone(1000, 0.2, 0.1);
            } else if (transcript.includes('play music') || transcript.includes('start music')) {
                const bgMusic = document.getElementById('bg-music');
                if (bgMusic) {
                    bgMusic.play();
                    playTone(1200, 0.2, 0.1);
                }
            } else if (transcript.includes('stop music') || transcript.includes('pause music')) {
                const bgMusic = document.getElementById('bg-music');
                if (bgMusic) {
                    bgMusic.pause();
                    playTone(800, 0.2, 0.1);
                }
            } else if (transcript.includes('matrix') || transcript.includes('matrix mode')) {
                // Trigger Matrix easter egg
                document.dispatchEvent(new KeyboardEvent('keydown', { key: 'M', ctrlKey: true, shiftKey: true }));
            } else if (transcript.includes('scroll top') || transcript.includes('go to top')) {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                playTone(1500, 0.2, 0.1);
            }
        };

        recognition.onstart = () => {
            voiceIndicator.classList.add('active');
        };

        recognition.onend = () => {
            voiceIndicator.classList.remove('active');
        };

        recognition.onerror = (event) => {
            console.log('Voice recognition error:', event.error);
            voiceIndicator.classList.remove('active');
        };

        // Toggle voice recognition with "V" key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'v' && e.ctrlKey) {
                e.preventDefault();
                if (voiceIndicator.classList.contains('active')) {
                    recognition.stop();
                    playTone(600, 0.1, 0.1);
                } else {
                    recognition.start();
                    playTone(1000, 0.1, 0.1);
                }
            }
        });

        console.log('🎤 Voice commands enabled! Press Ctrl+V to toggle listening.');
        console.log('📢 Commands: "show skills", "show timeline", "show contact", "play music", "scroll top", etc.');
    }

    /* =========================================
       22. LAZY LOADING IMAGES (Performance)
       ========================================= */
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.classList.add('loaded');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    /* =========================================
       23. ACCESSIBILITY IMPROVEMENTS
       ========================================= */
    // Add ARIA labels to interactive elements
    document.querySelectorAll('button, a, input, textarea').forEach((el, index) => {
        if (!el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')) {
            const text = el.textContent?.trim() || el.placeholder || `Interactive element ${index}`;
            el.setAttribute('aria-label', text);
        }
    });

    // Add role attributes where missing
    document.querySelector('nav')?.setAttribute('role', 'navigation');
    document.querySelector('main')?.setAttribute('role', 'main');
    document.querySelector('footer, .footer-section')?.setAttribute('role', 'contentinfo');

    console.log('✅ Portfolio fully loaded with all features!');
    console.log('🎮 Easter eggs: Konami code, Triple-click logo, Ctrl+Shift+M for Matrix');
    console.log('🎤 Voice: Ctrl+V to toggle voice commands');
    console.log('♿ Accessibility: Tab navigation, reduced motion support');
    console.log('📱 PWA: Installable as app');

    /* =========================================
       24. MOBILE OPTIMIZATIONS
       ========================================= */

    // Detect Mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile || isTouch) {
        console.log('📱 Mobile device detected - Touch optimizations enabled');

        // Add touch-friendly class to body
        document.body.classList.add('touch-device');

        /* Touch Events for Lightbox Swipe */
        let touchStartX = 0;
        let touchEndX = 0;

        if (lightbox) {
            lightbox.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            lightbox.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });

            function handleSwipe() {
                const swipeThreshold = 50;
                if (touchEndX < touchStartX - swipeThreshold) {
                    // Swipe left - next image
                    lightboxNext?.click();
                } else if (touchEndX > touchStartX + swipeThreshold) {
                    // Swipe right - previous image
                    lightboxPrev?.click();
                }
            }
        }

        /* Mobile Scroll-to-Top Button (Converted from Menu Toggle) */
        const createMobileMenuToggle = () => {
            const nav = document.querySelector('nav');
            if (!nav || window.innerWidth > 768) return;

            // Check if already exists to prevent duplicates on resize
            if (document.querySelector('.mobile-scroll-top')) return;

            const toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle mobile-scroll-top'; // Keep original class for styling if needed, add new one
            // Use same icon as back-to-top
            toggle.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 19V5M5 12l7-7 7 7" />
                </svg>
            `;
            toggle.setAttribute('aria-label', 'Scroll to top');

            toggle.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
                // Play sound
                playTone(1500, 0.15, 0.1);
            });

            nav.parentElement?.insertBefore(toggle, nav);
        };

        window.addEventListener('load', createMobileMenuToggle);
        window.addEventListener('resize', createMobileMenuToggle);

        /* Touch Feedback for Cards */
        const addTouchFeedback = () => {
            const touchableElements = document.querySelectorAll('.badge-item, .testimonial-card, .case-card, .skill-item');

            touchableElements.forEach(el => {
                el.addEventListener('touchstart', function () {
                    this.style.transform = 'scale(0.95)';
                }, { passive: true });

                el.addEventListener('touchend', function () {
                    setTimeout(() => {
                        this.style.transform = '';
                    }, 150);
                }, { passive: true });
            });
        };

        addTouchFeedback();

        /* Disable Zoom on Double Tap (iOS) */
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        /* Mobile-Friendly Voice Command Alternative */
        if (!recognition) {
            // Add floating menu button for non-voice mobile
            const floatingMenu = document.createElement('div');
            floatingMenu.className = 'mobile-floating-menu';
            floatingMenu.innerHTML = `
                <button class="fab-btn" id="fabBtn">
                    <span>+</span>
                </button>
                <div class="fab-menu" id="fabMenu">
                    <button data-scroll="expertise">Skills</button>
                    <button data-scroll="timeline">Timeline</button>
                    <button data-scroll="achievements">Achievements</button>
                    <button data-scroll="contact">Contact</button>
                </div>
            `;
            document.body.appendChild(floatingMenu);

            const fabBtn = document.getElementById('fabBtn');
            const fabMenu = document.getElementById('fabMenu');

            fabBtn.addEventListener('click', () => {
                fabMenu.classList.toggle('active');
                fabBtn.querySelector('span').textContent = fabMenu.classList.contains('active') ? '×' : '+';
            });

            fabMenu.querySelectorAll('button[data-scroll]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const target = btn.dataset.scroll;
                    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' });
                    fabMenu.classList.remove('active');
                    fabBtn.querySelector('span').textContent = '+';
                    playTone(1000, 0.2, 0.1);
                });
            });
        }

        /* Optimize Particles for Mobile */
        const particleContainer = document.getElementById('particles-container');
        if (particleContainer && window.innerWidth < 768) {
            // Reduce particle count on mobile
            const existingParticles = particleContainer.querySelectorAll('.particle');
            existingParticles.forEach((p, i) => {
                if (i % 2 === 0) p.remove(); // Remove every other particle
            });
        }

        /* Touch-friendly Download Button */
        const downloadBtn = document.getElementById('downloadResume');
        if (downloadBtn) {
            downloadBtn.addEventListener('touchstart', function () {
                this.style.transform = 'scale(0.95)';
            }, { passive: true });

            downloadBtn.addEventListener('touchend', function () {
                this.style.transform = '';
            }, { passive: true });
        }

        console.log('✅ Mobile optimizations complete!');
        console.log('👆 Swipe lightbox images left/right');
        console.log('🎯 Tap floating + button for quick navigation');
    }

    // Final Performance Check
    window.addEventListener('load', () => {
        console.log(`⚡ Page fully loaded in ${performance.now().toFixed(2)}ms`);
        console.log(`🎉 All ${document.querySelectorAll('*').length} elements rendered`);
    });
});
