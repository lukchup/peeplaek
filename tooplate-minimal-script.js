/*

Tooplate 2141 Minimal White

https://www.tooplate.com/view/2141-minimal-white

*/

// JavaScript Document

        // Mobile menu toggle
        const menuToggle = document.getElementById('menuToggle');
        const navLinks = document.getElementById('navLinks');

        menuToggle.addEventListener('click', function() {
            menuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when link is clicked
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Navbar scroll effect and active menu highlighting
        const sections = document.querySelectorAll('section');
        const navItems = document.querySelectorAll('.nav-link');

        window.addEventListener('scroll', function() {
            const navbar = document.getElementById('navbar');
            
            // Navbar style on scroll
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // Active menu highlighting
            let current = '';
            sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.clientHeight;
                if (scrollY >= (sectionTop - 100)) {
                    current = section.getAttribute('id');
                }
            });

            navItems.forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('href').slice(1) === current) {
                    item.classList.add('active');
                }
            });
        });

        // Trigger scroll event on load to set initial active state
        window.dispatchEvent(new Event('scroll'));

        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Fade in animation on scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function(entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, observerOptions);

        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
        // วางไว้ด้านล่างสุดของสคริปต์หลัก ก่อนเจอแท็กปิด </script>

    let loggedInUserEmail = "Guest";

    // ดักจับ Email จากระบบ Firebase Auth ที่คุณเขียนไว้ด้านบนมาใช้งานอัตโนมัติ
    setTimeout(() => {
        try {
            const currentAuth = getAuth();
            if (currentAuth.currentUser) {
                loggedInUserEmail = currentAuth.currentUser.email;
            }
        } catch(e) { console.log("Firebase Auth ยังไม่พร้อมใช้งาน"); }
    }, 1500);

    // 1. ฟังก์ชันเซนเซอร์อีเมล (แสดงแค่ 3 ตัวแรก)
    function maskEmail(email) {
        if (!email || email === "Guest") return "ผู้เยี่ยมชม";
        const parts = email.split('@');
        const namePart = parts[0];
        const domainPart = parts[1] || "";
        
        if (namePart.length <= 3) {
            return namePart + "***@" + domainPart;
        }
        return namePart.substring(0, 3) + "***@" + domainPart;
    }

    // 2. ฟังก์ชันกรองคำหยาบ
    function filterBadWords(text) {
        const badWords = ["ค_ย", "มึง", "กู", "สัส", "เย็ด", "ควย", "เหี้ย", "ชั่ว", "fuck", "bitch"]; 
        let filteredText = text;
        badWords.forEach(word => {
            const regex = new RegExp(word, "gi");
            filteredText = filteredText.replace(regex, "***");
        });
        return filteredText;
    }

    // 3. ฟังก์ชันโพสต์ข้อความ
    window.addComment = function() {
        const input = document.getElementById("commentInput");
        const container = document.getElementById("commentContainer");
        const rawText = input.value.trim();

        if (rawText === "") return;

        const now = new Date();
        const timeString = now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });

        const safeUser = maskEmail(loggedInUserEmail);
        const safeText = filterBadWords(rawText);

        const bubble = document.createElement("div");
        bubble.className = "comment-bubble";
        bubble.innerHTML = `
            <div class="comment-meta">
                <span class="comment-user">👤 ${safeUser}</span>
                <span>${timeString} น.</span>
            </div>
            <div class="comment-text">${safeText}</div>
        `;

        container.insertBefore(bubble, container.firstChild);
        input.value = "";
    };

    // กด Enter ในช่องกรอกแล้วส่งได้เลย
    document.getElementById("commentInput")?.addEventListener("keypress", function(e) {
        if (e.key === 'Enter') {
            addComment();
        }
    });