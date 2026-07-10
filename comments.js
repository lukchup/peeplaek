/* ============================================================
   comments.js — ระบบคอมเมนต์ (Firebase v10 Modular)
   - คอมเมนต์วิ่งลอยทับ hero section จากขวาไปซ้าย
   - กล่องพิมพ์และรายการคอมเมนต์อยู่ด้านล่างหน้าเว็บ
============================================================ */

// ===== คำหยาบที่ต้องกรอง =====
const BAD_WORDS = [
    //ไทย
    "ควย","หี","สัตว์","ไอสัตว์","มึง","กู","เย็ด","เงี่ยน","อีสัตว์",
    "ไอ้สัตว์","หน้าหี","หน้าควย","เหี้ย","สัส","ระยำ","ชาติหมา",
    "อีดอก","ไอ้ดอก","บ้าหอย","แม่มึง","พ่อมึง","ชิบหาย","ฉิบหาย",
    //อังกฤษ
    "fuck","shit","bitch","asshole","bastard","cunt","dick","pussy",
    "whore","slut","nigger","faggot","retard"
];

function containsBadWord(text) {
    const lower = text.toLowerCase().replace(/\s+/g, '');
    return BAD_WORDS.some(w => lower.includes(w));
}

function maskBadWords(text) {
    let result = text;
    BAD_WORDS.forEach(w => {
        const regex = new RegExp(w, 'gi');
        result = result.replace(regex, '*'.repeat(w.length));
    });
    return result;
}

// ===== ซ่อนอีเมล =====
function maskEmail(email) {
    if (!email) return 'ผู้ใช้นิรนาม';
    const [user, domain] = email.split('@');
    if (!domain) return email.slice(0, 3) + '***';
    const visibleUser   = user.slice(0, Math.min(3, user.length));
    const domainParts   = domain.split('.');
    const visibleDomain = domainParts[0].slice(0, 1) + '***';
    const ext           = domainParts.slice(1).join('.');
    return `${visibleUser}***@${visibleDomain}.${ext}`;
}

// ===== จัดรูปแบบเวลา =====
function formatTime(ts) {
    if (!ts) return '';
    const d   = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return 'เมื่อกี้';
    if (diff < 3600)  return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

// ===== สร้าง floating ticker ทับ hero =====
function createHeroTicker() {
    if (document.getElementById('hero-comment-overlay')) return;

    const hero = document.querySelector('#home.hero, section#home, .hero');
    if (!hero) return;

    // ทำให้ hero เป็น position:relative เพื่อ anchor overlay
    if (getComputedStyle(hero).position === 'static') {
        hero.style.position = 'relative';
    }

    // สร้าง overlay container วิ่งในแนว hero
    const overlay = document.createElement('div');
    overlay.id = 'hero-comment-overlay';

    // สร้าง 3 แถววิ่ง แต่ละแถวมีความเร็วและตำแหน่งต่างกัน
    for (let i = 0; i < 3; i++) {
        const lane = document.createElement('div');
        lane.className = 'hco-lane';
        lane.dataset.lane = i;
        overlay.appendChild(lane);
    }

    hero.appendChild(overlay);
}

// ===== สร้างกล่องพิมพ์ + รายการคอมเมนต์ด้านล่าง footer =====
function createCommentSection() {
    if (document.getElementById('comment-section')) return;
    const section = document.createElement('section');
    section.id = 'comment-section';
    section.innerHTML = `
        <div class="comment-container">
            <div class="comment-header">
                <span class="comment-icon">💬</span>
                <h3>พูดคุยเล่นกันหน่อยไหม</h3>
                <p class="comment-subtitle">คุณคงเครียดเรื่องมหาวิทยาลัย มาบ่นตรงนี้ได้นะ</p>
            </div>
            <div class="comment-input-area" id="commentInputArea">
                <div class="comment-input-row">
                    <span class="comment-user-badge" id="commentUserBadge">👤</span>
                    <input type="text" id="commentInput" class="comment-input"
                        placeholder="พิมพ์ข้อความสั้นๆ แล้วกด Enter..." maxlength="100">
                    <button class="comment-send-btn" id="commentSendBtn" onclick="sendComment()">ส่ง</button>
                </div>
                <div class="comment-char-count"><span id="charCount">0</span>/100</div>
            </div>
            <div class="comment-list" id="commentList">
                <div class="comment-loading">กำลังโหลดความคิดเห็น...</div>
            </div>
        </div>
    `;
    const footer = document.querySelector('footer');
    if (footer) document.body.insertBefore(section, footer);
    else document.body.appendChild(section);
}

// ===== ยิง bubble ลงแถวที่เลือก =====
const LANE_SPEEDS = [18, 24, 20]; // วินาที แต่ละแถว
const LANE_TOPS   = ['22%', '50%', '72%']; // ตำแหน่ง Y ของแต่ละแถว
const AVATARS = ['😊','🎓','📚','✏️','💡','🌟','🏫','😄','👋','🤔'];

function shootBubble(data, laneIndex) {
    const overlay = document.getElementById('hero-comment-overlay');
    if (!overlay) return;

    const lane = overlay.querySelector(`.hco-lane[data-lane="${laneIndex}"]`);
    if (!lane) return;

    const avatar = AVATARS[Math.abs(
        (data.user || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % AVATARS.length];

    const bubble = document.createElement('div');
    bubble.className = 'hco-bubble';

    // ความเร็ว ± 20% เพื่อให้ดูเป็นธรรมชาติ
    const speed = LANE_SPEEDS[laneIndex] * (0.8 + Math.random() * 0.4);
    bubble.style.animationDuration = `${speed}s`;
    // delay เล็กน้อยเพื่อไม่ให้ออกมาพร้อมกัน
    bubble.style.animationDelay = `${Math.random() * 3}s`;

    bubble.innerHTML = `
        <span class="hco-avatar">${avatar}</span>
        <span class="hco-user">${maskEmail(data.user)}</span>
        <span class="hco-text">${maskBadWords(data.text)}</span>
    `;

    lane.appendChild(bubble);

    // ลบ bubble หลังจาก animation จบ เพื่อไม่ให้ DOM บวม
    bubble.addEventListener('animationend', () => bubble.remove());
}

// ===== คิวรอส่ง bubble ไปแต่ละแถว =====
let bubbleQueue   = [];
let laneCounters  = [0, 0, 0]; // นับ bubble ในแต่ละแถว

function enqueueBubble(data) {
    bubbleQueue.push(data);
    processBubbleQueue();
}

function processBubbleQueue() {
    if (bubbleQueue.length === 0) return;
    // เลือกแถวที่ว่างที่สุด
    const laneIndex = laneCounters.indexOf(Math.min(...laneCounters));
    laneCounters[laneIndex]++;
    const data = bubbleQueue.shift();
    shootBubble(data, laneIndex);
    // ลด counter หลัง animation จบโดยประมาณ
    setTimeout(() => { laneCounters[laneIndex]--; },
        (LANE_SPEEDS[laneIndex] + 3) * 1000);
}

// ===== Style ทั้งหมด =====
function injectCommentStyles() {
    if (document.getElementById('comment-styles')) return;
    const style = document.createElement('style');
    style.id = 'comment-styles';
    style.textContent = `

        /* ===== Hero Comment Overlay ===== */
        #hero-comment-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;   /* ไม่บัง interaction ของ hero */
            overflow: hidden;
            z-index: 10;
        }

        /* แถววิ่ง — วางตาม LANE_TOPS */
        .hco-lane {
            position: absolute;
            left: 0; right: 0;
            height: 44px;
            display: flex;
            align-items: center;
        }
        .hco-lane[data-lane="0"] { top: 22%; }
        .hco-lane[data-lane="1"] { top: 50%; }
        .hco-lane[data-lane="2"] { top: 72%; }

        /* bubble แต่ละอัน วิ่งจากขวาไปซ้าย */
        .hco-bubble {
            position: absolute;
            right: -400px;              /* เริ่มนอกจอด้านขวา */
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(6px);
            -webkit-backdrop-filter: blur(6px);
            border: 1px solid rgba(255,255,255,0.35);
            border-radius: 30px;
            padding: 6px 14px 6px 8px;
            font-family: 'Sarabun', sans-serif;
            font-size: 13px;
            color: #000000;
            text-shadow: 0 1px 3px rgba(0,0,0,0.3);
            box-shadow: 0 2px 12px rgba(0,0,0,0.12);
            animation: heroBubbleScroll linear forwards;
            pointer-events: none;
        }

        @keyframes heroBubbleScroll {
            0%   { transform: translateX(0); opacity: 0; }
            5%   { opacity: 1; }
            90%  { opacity: 1; }
            100% { transform: translateX(calc(-100vw - 500px)); opacity: 0; }
        }

        .hco-avatar { font-size: 16px; }
        .hco-user   { font-size: 11px; opacity: 0.75; }
        .hco-text   { font-size: 13px; font-weight: 500; }

        /* ===== Comment Section (กล่องพิมพ์ด้านล่าง) ===== */
        #comment-section {
            background: #fafafa;
            border-top: 1px solid #f0f0f0;
            padding: 40px 0 60px;
        }
        .comment-container { max-width: 760px; margin: 0 auto; padding: 0 24px; }
        .comment-header { text-align: center; margin-bottom: 28px; }
        .comment-icon   { font-size: 32px; display: block; margin-bottom: 8px; }
        .comment-header h3 {
            font-family: 'Sarabun', sans-serif;
            font-size: 20px; font-weight: 600; color: #111; margin-bottom: 6px;
        }
        .comment-subtitle { font-family: 'Sarabun', sans-serif; font-size: 14px; color: #888; }

        .comment-input-area {
            background: #fff; border: 1.5px solid #e8e8e8; border-radius: 14px;
            padding: 14px 16px; margin-bottom: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .comment-input-row { display: flex; align-items: center; gap: 10px; }
        .comment-user-badge { font-size: 22px; flex-shrink: 0; }
        .comment-input {
            flex: 1; border: none; outline: none;
            font-family: 'Sarabun', sans-serif; font-size: 15px;
            color: #222; background: transparent;
        }
        .comment-input::placeholder { color: #ccc; }
        .comment-send-btn {
            padding: 7px 18px; background: #000; color: #fff;
            border: none; border-radius: 20px;
            font-family: 'Sarabun', sans-serif; font-size: 13px;
            cursor: pointer; flex-shrink: 0; transition: background 0.2s;
        }
        .comment-send-btn:hover    { background: #333; }
        .comment-send-btn:disabled { background: #ccc; cursor: not-allowed; }
        .comment-char-count { font-size: 11px; color: #ccc; text-align: right; margin-top: 6px; }
        .comment-char-count.warn { color: #f59e0b; }
        .comment-char-count.over { color: #ef4444; }

        .comment-list {
            display: flex; flex-direction: column; gap: 12px;
            max-height: 420px;          /* แสดงประมาณ 3-4 comment */
            overflow-y: auto;
            padding-right: 6px;         /* เว้นพื้นที่ scrollbar */
            scrollbar-width: thin;
            scrollbar-color: #e0e0e0 transparent;
        }
        .comment-list::-webkit-scrollbar       { width: 4px; }
        .comment-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }
        .comment-loading {
            text-align: center; color: #bbb;
            font-family: 'Sarabun', sans-serif; font-size: 14px; padding: 20px;
        }
        .comment-item {
            background: #fff; border: 1px solid #f0f0f0; border-radius: 12px;
            padding: 12px 16px; display: flex; align-items: flex-start; gap: 12px;
            animation: fadeSlideIn 0.3s ease;
        }
        @keyframes fadeSlideIn {
            from { opacity:0; transform:translateY(8px); }
            to   { opacity:1; transform:translateY(0); }
        }
        .comment-avatar {
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg, #e8f0fe, #fde8e8);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px; flex-shrink: 0;
        }
        .comment-meta { flex: 1; }
        .comment-name { font-family: 'Sarabun', sans-serif; font-size: 12px; color: #999; margin-bottom: 4px; }
        .comment-text { font-family: 'Sarabun', sans-serif; font-size: 14px; color: #222; line-height: 1.6; }
        .comment-time { font-family: 'Sarabun', sans-serif; font-size: 11px; color: #ccc; flex-shrink: 0; margin-top: 2px; }

        /* ปุ่มแก้ไข / ลบ (แสดงเฉพาะ comment ของตัวเอง) */
        .comment-actions {
            display: flex; gap: 6px; margin-top: 8px;
        }
        .comment-btn-edit, .comment-btn-delete {
            font-family: 'Sarabun', sans-serif; font-size: 11px;
            padding: 3px 10px; border-radius: 20px; border: none;
            cursor: pointer; transition: all 0.15s;
        }
        .comment-btn-edit             { background: #f0f0f0; color: #555; }
        .comment-btn-edit:hover       { background: #e0e0e0; }
        .comment-btn-delete           { background: #fde8e8; color: #c81e1e; }
        .comment-btn-delete:hover     { background: #fcc; }

        /* กล่องแก้ไข inline */
        .comment-edit-row {
            display: flex; gap: 8px; margin-top: 8px; align-items: center;
        }
        .comment-edit-input {
            flex: 1; border: 1px solid #ddd; border-radius: 8px;
            padding: 6px 10px; font-family: 'Sarabun', sans-serif; font-size: 13px;
            outline: none; color: #222;
        }
        .comment-edit-input:focus { border-color: #000; }
        .comment-btn-save {
            font-family: 'Sarabun', sans-serif; font-size: 11px;
            padding: 4px 12px; border-radius: 20px; border: none;
            background: #000; color: #fff; cursor: pointer;
        }
        .comment-btn-cancel {
            font-family: 'Sarabun', sans-serif; font-size: 11px;
            padding: 4px 12px; border-radius: 20px;
            border: 1px solid #ccc; background: transparent; color: #666; cursor: pointer;
        }

                .comment-toast {
            position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
            background: #1a1a1a; color: #fff;
            font-family: 'Sarabun', sans-serif; font-size: 14px;
            padding: 10px 24px; border-radius: 30px;
            z-index: 9999; opacity: 0; transition: opacity 0.3s; pointer-events: none;
        }
        .comment-toast.show { opacity: 1; }
    `;
    document.head.appendChild(style);
}

// ===== Toast =====
function showToast(msg, duration = 2500) {
    let toast = document.getElementById('commentToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'commentToast';
        toast.className = 'comment-toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== Card คอมเมนต์ในรายการด้านล่าง =====
function createCommentCard(data) {
    const div = document.createElement('div');
    div.className = 'comment-item';
    div.dataset.id = data.id;

    const avatar = AVATARS[Math.abs(
        (data.user || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % AVATARS.length];

    // แสดงปุ่มแก้ไข/ลบเฉพาะ comment ของตัวเอง
    const isOwn = window.__commentUser && data.user === window.__commentUser.email;
    const actionsHtml = isOwn ? `
        <div class="comment-actions">
            <button class="comment-btn-edit"   onclick="editComment('${data.id}')">✏️ แก้ไข</button>
            <button class="comment-btn-delete" onclick="deleteComment('${data.id}')">🗑️ ลบ</button>
        </div>` : '';

    div.innerHTML = `
        <div class="comment-avatar">${avatar}</div>
        <div class="comment-meta">
            <div class="comment-name">${maskEmail(data.user)}</div>
            <div class="comment-text" id="text-${data.id}">${maskBadWords(data.text)}</div>
            ${actionsHtml}
        </div>
        <div class="comment-time">${formatTime(data.createdAt)}</div>
    `;
    return div;
}

// ===== ลบคอมเมนต์ =====
window.deleteComment = async function (docId) {
    if (!confirm('ลบความคิดเห็นนี้?')) return;
    const db = window.__commentDB;
    if (!db) return;
    try {
        const { doc, deleteDoc } = window.__firestoreFns;
        await deleteDoc(doc(db, 'comments', docId));
        showToast('🗑️ ลบแล้ว');
    } catch (e) {
        console.error('deleteComment error:', e);
        showToast('❌ ลบไม่สำเร็จ');
    }
};

// ===== แก้ไขคอมเมนต์ (inline edit) =====
window.editComment = function (docId) {
    const textEl = document.getElementById(`text-${docId}`);
    if (!textEl) return;

    // ถ้ากำลัง edit อยู่แล้ว ไม่ต้องทำอีก
    if (document.getElementById(`edit-row-${docId}`)) return;

    const currentText = textEl.textContent.trim();

    // ซ่อน text เดิม
    textEl.style.display = 'none';

    // สร้าง inline edit row
    const editRow = document.createElement('div');
    editRow.className = 'comment-edit-row';
    editRow.id = `edit-row-${docId}`;
    editRow.innerHTML = `
        <input type="text" class="comment-edit-input" id="edit-input-${docId}"
            value="${currentText}" maxlength="100">
        <button class="comment-btn-save"   onclick="saveComment('${docId}')">บันทึก</button>
        <button class="comment-btn-cancel" onclick="cancelEdit('${docId}')">ยกเลิก</button>
    `;

    textEl.parentNode.insertBefore(editRow, textEl.nextSibling);

    // focus และ select ข้อความ
    const inp = document.getElementById(`edit-input-${docId}`);
    if (inp) { inp.focus(); inp.select(); }
};

// ===== บันทึกการแก้ไข =====
window.saveComment = async function (docId) {
    const inp = document.getElementById(`edit-input-${docId}`);
    if (!inp) return;

    const newText = inp.value.trim();
    if (!newText) { showToast('⚠️ ข้อความห้ามว่าง'); return; }
    if (newText.length > 100) { showToast('⚠️ ยาวเกิน 100 ตัวอักษร'); return; }
    if (containsBadWord(newText)) { showToast('🚫 กรุณาไม่ใช้คำที่ไม่เหมาะสม'); return; }

    const db = window.__commentDB;
    if (!db) return;

    try {
        const { doc, updateDoc } = window.__firestoreFns;
        await updateDoc(doc(db, 'comments', docId), { text: newText });
        showToast('✅ แก้ไขแล้ว');
        // Firestore onSnapshot จะ re-render card ให้อัตโนมัติ
    } catch (e) {
        console.error('saveComment error:', e);
        showToast('❌ แก้ไขไม่สำเร็จ');
    }
};

// ===== ยกเลิกการแก้ไข =====
window.cancelEdit = function (docId) {
    const editRow = document.getElementById(`edit-row-${docId}`);
    const textEl  = document.getElementById(`text-${docId}`);
    if (editRow) editRow.remove();
    if (textEl)  textEl.style.display = '';
};

// ===== ส่งคอมเมนต์ =====
window.sendComment = async function () {
    const input = document.getElementById('commentInput');
    const btn   = document.getElementById('commentSendBtn');
    const text  = (input?.value || '').trim();

    if (!text) return;
    if (text.length > 100) { showToast('⚠️ ข้อความยาวเกิน 100 ตัวอักษร'); return; }
    if (containsBadWord(text)) { showToast('🚫 กรุณาไม่ใช้คำที่ไม่เหมาะสม'); return; }

    const user = window.__commentUser;
    if (!user) { showToast('กรุณาเข้าสู่ระบบก่อนคอมเมนต์'); return; }

    const db = window.__commentDB;
    if (!db)  { showToast('❌ ระบบยังไม่พร้อม กรุณารีเฟรช'); return; }

    btn.disabled = true;
    try {
        const { collection, addDoc, serverTimestamp } = window.__firestoreFns;
        await addDoc(collection(db, 'comments'), {
            user:      user.email,
            text:      text,
            createdAt: serverTimestamp()
        });
        input.value = '';
        document.getElementById('charCount').textContent = '0';
        document.getElementById('charCount').parentElement.className = 'comment-char-count';
        showToast('✅ ส่งความคิดเห็นแล้ว!');
    } catch (e) {
        console.error('sendComment error:', e);
        showToast('❌ ส่งไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
    btn.disabled = false;
};

// ===== โหลดคอมเมนต์ real-time =====
// แต่ละคอมเมนต์ใหม่จะถูกยิงเป็น bubble ใน hero ด้วย
let isFirstLoad = true;

function loadComments(db) {
    const list = document.getElementById('commentList');
    const { collection, query, orderBy, limit, onSnapshot, doc, deleteDoc, updateDoc } = window.__firestoreFns;

    const q = query(
        collection(db, 'comments'),
        orderBy('createdAt', 'desc'),
        limit(30)
    );

    // เก็บ snapshot ก่อนหน้าเพื่อตรวจว่ามี comment ใหม่จริงไหม
    let prevIds = new Set();

    onSnapshot(q, snapshot => {
        list.innerHTML = '';
        const comments = [];

        if (snapshot.empty) {
            list.innerHTML = '<div class="comment-loading">ยังไม่มีความคิดเห็น — เป็นคนแรกได้เลย! 🎉</div>';
            isFirstLoad = false;
            return;
        }

        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            comments.push(data);
            list.appendChild(createCommentCard(data));
        });

        if (isFirstLoad) {
            // โหลดครั้งแรก: ยิง bubble ทุกอันแบบ stagger
            comments.slice(0, 6).forEach((c, i) => {
                setTimeout(() => enqueueBubble(c), i * 1200);
            });
            isFirstLoad = false;
        } else {
            // มี comment ใหม่เข้ามา: ยิง bubble เฉพาะอันใหม่
            comments.forEach(c => {
                if (!prevIds.has(c.id)) {
                    setTimeout(() => enqueueBubble(c), 300);
                }
            });
        }

        prevIds = new Set(comments.map(c => c.id));

    }, err => {
        console.error('onSnapshot error:', err);
        list.innerHTML = '<div class="comment-loading">❌ โหลดความคิดเห็นไม่ได้ กรุณารีเฟรช</div>';
    });
}

// ===== initComments — เรียกจาก index.html หลัง login =====
window.initComments = function (user, db, firestoreFns) {
    window.__commentUser  = user;
    window.__commentDB    = db;
    window.__firestoreFns = firestoreFns;

    const badge = document.getElementById('commentUserBadge');
    if (badge) badge.title = maskEmail(user.email);

    const input     = document.getElementById('commentInput');
    const charCount = document.getElementById('charCount');
    if (input && charCount) {
        input.addEventListener('input', () => {
            const len = input.value.length;
            charCount.textContent = len;
            charCount.parentElement.className = 'comment-char-count' +
                (len > 90 ? ' over' : len > 70 ? ' warn' : '');
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') window.sendComment();
        });
    }

    // สร้าง hero ticker หลัง DOM พร้อม
    createHeroTicker();
    loadComments(db);
};

// ===== inject style + section ทันทีที่โหลดไฟล์ =====
injectCommentStyles();
createCommentSection();