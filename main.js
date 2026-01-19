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

    // E. Typing Animation
    const typingText = document.querySelector('.typing-text');
    if (typingText) {
        const textToType = typingText.dataset.text;
        typingText.innerText = '';
        let typeIndex = 0;

        const typeChar = () => {
            if (typeIndex < textToType.length) {
                typingText.innerText += textToType.charAt(typeIndex);
                typeIndex++;
                setTimeout(typeChar, 50); // Speed
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
});
