/* ============================================================
   page-comments.js — ระบบคอมเมนต์เล็กสำหรับหน้า Page ย่อย
   (เช่น rmutt.html, ku.html, cmru.html)

   ไฟล์นี้เป็นอิสระสมบูรณ์ ไม่ต้องโหลด comments.js เลย
   มีฟังก์ชันกรองคำหยาบ / toast / จัดรูปแบบเวลา ในตัวเองทั้งหมด

   - ไม่มี hero bubble ลอย มีแค่กล่องพิมพ์ + รายการด้านล่าง
   - คอมเมนต์แยก collection ตามแต่ละมหาวิทยาลัย ไม่ปนกับหน้า index
     และไม่ปนกันระหว่างมหาวิทยาลัย
   - ผู้คอมเมนต์ทุกคนแสดงชื่อเป็น "🎓 รุ่นพี่ปริศนา" เหมือนกันหมด

   วิธีใช้ในหน้า Page ย่อย:
       <script src="page-comments.js" defer></script>

   เรียกใช้: window.initPageComments(user, db, firestoreFns, pageId)
             pageId = ชื่อไม่ซ้ำของหน้า เช่น "rmutt" หรือ "ku"
============================================================ */

// ===== คำหยาบที่ต้องกรอง (ชุดเดียวกับ comments.js) =====
const PC_BAD_WORDS = [
    "ควย","หี","สัตว์","ไอสัตว์","มึง","กู","เย็ด","เงี่ยน","อีสัตว์",
    "ไอ้สัตว์","หน้าหี","หน้าควย","เหี้ย","สัส","ระยำ","ชาติหมา",
    "อีดอก","ไอ้ดอก","บ้าหอย","แม่มึง","พ่อมึง","ชิบหาย","ฉิบหาย",
    "fuck","shit","bitch","asshole","bastard","cunt","dick","pussy",
    "whore","slut","nigger","faggot","retard"
];

function pcContainsBadWord(text) {
    const lower = text.toLowerCase().replace(/\s+/g, '');
    return PC_BAD_WORDS.some(w => lower.includes(w));
}

function pcMaskBadWords(text) {
    let result = text;
    PC_BAD_WORDS.forEach(w => {
        const regex = new RegExp(w, 'gi');
        result = result.replace(regex, '*'.repeat(w.length));
    });
    return result;
}

// ===== จัดรูปแบบเวลา =====
function pcFormatTime(ts) {
    if (!ts) return '';
    const d   = ts.toDate ? ts.toDate() : new Date(ts.seconds ? ts.seconds * 1000 : ts);
    const now = new Date();
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60)    return 'เมื่อกี้';
    if (diff < 3600)  return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ชม.`;
    return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

// ===== Toast notification (กล่องแจ้งเตือนลอย) =====
function pcShowToast(message) {
    let toast = document.getElementById('pcToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'pcToast';
        Object.assign(toast.style, {
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: '#1f2937',
            color: '#ffffff',
            padding: '12px 24px',
            borderRadius: '30px',
            fontSize: '14px',
            fontFamily: "'Sarabun', sans-serif",
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '99999',
            opacity: '0',
            transition: 'opacity 0.3s ease, transform 0.3s ease',
            pointerEvents: 'none'
        });
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(-5px)';

    clearTimeout(toast._hideTimer);
    toast._hideTimer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(5px)';
    }, 2500);
}

// ===== สร้าง HTML กล่องคอมเมนต์เล็กสำหรับหน้า Page ย่อย =====
function createPageCommentSection() {
    if (document.getElementById('page-comment-section')) return;

    const section = document.createElement('section');
    section.id = 'page-comment-section';
    section.innerHTML = `
        <div class="pc-container">
            <div class="pc-header">
                <span class="pc-icon">💬</span>
                <h3>รุ่นพี่มีอะไรอยากบอกน้องด้วยแหล่ะ</h3>
            </div>

            <div class="pc-input-area">
                <div class="pc-input-row">
                    <span class="pc-user-badge" id="pcUserBadge">👤</span>
                    <input type="text" id="pcInput" class="pc-input"
                        placeholder="พิมพ์ความคิดเห็นสั้นๆ แล้วกด Enter..." maxlength="100">
                    <button class="pc-send-btn" id="pcSendBtn" onclick="sendPageComment()">ส่ง</button>
                </div>
                <div class="pc-char-count"><span id="pcCharCount">0</span>/100</div>
            </div>

            <div class="pc-list" id="pcList">
                <div class="pc-loading">กำลังโหลดความคิดเห็น...</div>
            </div>
        </div>
    `;

    const footer = document.querySelector('footer');
    if (footer) document.body.insertBefore(section, footer);
    else document.body.appendChild(section);
}

// ===== Style ของกล่องคอมเมนต์เล็ก =====
function injectPageCommentStyles() {
    if (document.getElementById('page-comment-styles')) return;
    const style = document.createElement('style');
    style.id = 'page-comment-styles';
    style.textContent = `
        #page-comment-section {
            background: #fafafa;
            border-top: 1px solid #f0f0f0;
            padding: 32px 16px 48px;
        }
        .pc-container { max-width: 640px; margin: 0 auto; }

        .pc-header { text-align: center; margin-bottom: 18px; }
        .pc-icon { font-size: 26px; display: block; margin-bottom: 6px; }
        .pc-header h3 {
            font-family: 'Sarabun', sans-serif;
            font-size: 16px; font-weight: 600; color: #111;
        }

        .pc-input-area {
            background: #fff; border: 1.5px solid #e8e8e8; border-radius: 12px;
            padding: 12px 14px; margin-bottom: 16px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        }
        .pc-input-row { display: flex; align-items: center; gap: 8px; }
        .pc-user-badge { font-size: 18px; flex-shrink: 0; }
        .pc-input {
            flex: 1; border: none; outline: none;
            font-family: 'Sarabun', sans-serif; font-size: 14px;
            color: #222; background: transparent;
        }
        .pc-input::placeholder { color: #ccc; }
        .pc-send-btn {
            padding: 6px 16px; background: #000; color: #fff;
            border: none; border-radius: 20px;
            font-family: 'Sarabun', sans-serif; font-size: 12px;
            cursor: pointer; flex-shrink: 0; transition: background 0.2s;
        }
        .pc-send-btn:hover    { background: #333; }
        .pc-send-btn:disabled { background: #ccc; cursor: not-allowed; }
        .pc-char-count { font-size: 10px; color: #ccc; text-align: right; margin-top: 4px; }
        .pc-char-count.warn { color: #f59e0b; }
        .pc-char-count.over { color: #ef4444; }

        .pc-list {
            display: flex; flex-direction: column; gap: 10px;
            max-height: 360px; overflow-y: auto; padding-right: 4px;
            scrollbar-width: thin; scrollbar-color: #e0e0e0 transparent;
        }
        .pc-list::-webkit-scrollbar       { width: 4px; }
        .pc-list::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

        .pc-loading {
            text-align: center; color: #bbb;
            font-family: 'Sarabun', sans-serif; font-size: 13px; padding: 16px;
        }
        .pc-item {
            background: #fff; border: 1px solid #f0f0f0; border-radius: 10px;
            padding: 10px 14px; display: flex; align-items: flex-start; gap: 10px;
            animation: pcFadeIn 0.3s ease;
        }
        @keyframes pcFadeIn {
            from { opacity:0; transform:translateY(6px); }
            to   { opacity:1; transform:translateY(0); }
        }
        .pc-avatar {
            width: 30px; height: 30px; border-radius: 50%;
            background: linear-gradient(135deg, #e8f0fe, #fde8e8);
            display: flex; align-items: center; justify-content: center;
            font-size: 14px; flex-shrink: 0;
        }
        .pc-meta { flex: 1; }
        .pc-name { font-family: 'Sarabun', sans-serif; font-size: 11px; color: #999; margin-bottom: 3px; }
        .pc-text { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #222; line-height: 1.5; }
        .pc-time { font-family: 'Sarabun', sans-serif; font-size: 10px; color: #ccc; flex-shrink: 0; margin-top: 1px; }

        .pc-actions { display: flex; gap: 5px; margin-top: 6px; }
        .pc-btn-edit, .pc-btn-delete {
            font-family: 'Sarabun', sans-serif; font-size: 10px;
            padding: 2px 8px; border-radius: 16px; border: none; cursor: pointer;
        }
        .pc-btn-edit   { background: #f0f0f0; color: #555; }
        .pc-btn-edit:hover   { background: #e0e0e0; }
        .pc-btn-delete { background: #fde8e8; color: #c81e1e; }
        .pc-btn-delete:hover { background: #fcc; }

        .pc-edit-row { display: flex; gap: 6px; margin-top: 6px; align-items: center; }
        .pc-edit-input {
            flex: 1; border: 1px solid #ddd; border-radius: 8px;
            padding: 5px 8px; font-family: 'Sarabun', sans-serif; font-size: 12px;
            outline: none; color: #222;
        }
        .pc-edit-input:focus { border-color: #000; }
        .pc-btn-save {
            font-family: 'Sarabun', sans-serif; font-size: 10px;
            padding: 3px 10px; border-radius: 16px; border: none;
            background: #000; color: #fff; cursor: pointer;
        }
        .pc-btn-cancel {
            font-family: 'Sarabun', sans-serif; font-size: 10px;
            padding: 3px 10px; border-radius: 16px;
            border: 1px solid #ccc; background: transparent; color: #666; cursor: pointer;
        }
    `;
    document.head.appendChild(style);
}

// ===== Card คอมเมนต์เล็ก =====
function createPageCommentCard(data) {
    const div = document.createElement('div');
    div.className = 'pc-item';
    div.dataset.id = data.id;

    const avatars = ['😊','🎓','📚','✏️','💡','🌟','🏫','😄','👋','🤔'];
    const avatar = avatars[Math.abs(
        (data.user || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
    ) % avatars.length];

    const isOwn = window.__pcUser && data.user === window.__pcUser.email;
    const actionsHtml = isOwn ? `
        <div class="pc-actions">
            <button class="pc-btn-edit"   onclick="editPageComment('${data.id}')">✏️ แก้ไข</button>
            <button class="pc-btn-delete" onclick="deletePageComment('${data.id}')">🗑️ ลบ</button>
        </div>` : '';

    div.innerHTML = `
        <div class="pc-avatar">${avatar}</div>
        <div class="pc-meta">
            <div class="pc-name">🎓 รุ่นพี่ปริศนา</div>
            <div class="pc-text" id="pc-text-${data.id}">${pcMaskBadWords(data.text)}</div>
            ${actionsHtml}
        </div>
        <div class="pc-time">${pcFormatTime(data.createdAt)}</div>
    `;
    return div;
}

// ===== ส่งคอมเมนต์ในหน้า Page ย่อย =====
window.sendPageComment = async function () {
    const input = document.getElementById('pcInput');
    const btn   = document.getElementById('pcSendBtn');
    const text  = (input?.value || '').trim();

    if (!text) return;
    if (text.length > 100) { pcShowToast('⚠️ ข้อความยาวเกิน 100 ตัวอักษร'); return; }
    if (pcContainsBadWord(text)) { pcShowToast('🚫 กรุณาไม่ใช้คำที่ไม่เหมาะสม'); return; }

    const user = window.__pcUser;
    if (!user) { pcShowToast('กรุณาเข้าสู่ระบบก่อนคอมเมนต์'); return; }

    const db = window.__pcDB;
    if (!db)  { pcShowToast('❌ ระบบยังไม่พร้อม กรุณารีเฟรช'); return; }

    btn.disabled = true;
    try {
        const { collection, addDoc, serverTimestamp } = window.__pcFirestoreFns;
        await addDoc(collection(db, 'page-comments', window.__pcPageId, 'items'), {
            user:      user.email,
            text:      text,
            createdAt: serverTimestamp()
        });
        input.value = '';
        document.getElementById('pcCharCount').textContent = '0';
        document.getElementById('pcCharCount').parentElement.className = 'pc-char-count';
        pcShowToast('✅ ส่งความคิดเห็นแล้ว!');
    } catch (e) {
        console.error('sendPageComment error:', e);
        pcShowToast('❌ ส่งไม่สำเร็จ ลองใหม่อีกครั้ง');
    }
    btn.disabled = false;
};

// ===== ลบคอมเมนต์ในหน้า Page ย่อย (เฉพาะของตัวเอง) =====
window.deletePageComment = async function (docId) {
    if (!confirm('ลบความคิดเห็นนี้?')) return;
    const db = window.__pcDB;
    if (!db) return;
    try {
        const { doc, deleteDoc } = window.__pcFirestoreFns;
        await deleteDoc(doc(db, 'page-comments', window.__pcPageId, 'items', docId));
        pcShowToast('🗑️ ลบแล้ว');
    } catch (e) {
        console.error('deletePageComment error:', e);
        pcShowToast('❌ ลบไม่สำเร็จ');
    }
};

// ===== แก้ไขคอมเมนต์ในหน้า Page ย่อย (inline edit) =====
window.editPageComment = function (docId) {
    const textEl = document.getElementById(`pc-text-${docId}`);
    if (!textEl) return;
    if (document.getElementById(`pc-edit-row-${docId}`)) return;

    const currentText = textEl.textContent.trim();
    textEl.style.display = 'none';

    const editRow = document.createElement('div');
    editRow.className = 'pc-edit-row';
    editRow.id = `pc-edit-row-${docId}`;
    editRow.innerHTML = `
        <input type="text" class="pc-edit-input" id="pc-edit-input-${docId}"
            value="${currentText}" maxlength="100">
        <button class="pc-btn-save"   onclick="savePageComment('${docId}')">บันทึก</button>
        <button class="pc-btn-cancel" onclick="cancelPageEdit('${docId}')">ยกเลิก</button>
    `;
    textEl.parentNode.insertBefore(editRow, textEl.nextSibling);

    const inp = document.getElementById(`pc-edit-input-${docId}`);
    if (inp) { inp.focus(); inp.select(); }
};

window.savePageComment = async function (docId) {
    const inp = document.getElementById(`pc-edit-input-${docId}`);
    if (!inp) return;

    const newText = inp.value.trim();
    if (!newText) { pcShowToast('⚠️ ข้อความห้ามว่าง'); return; }
    if (newText.length > 100) { pcShowToast('⚠️ ยาวเกิน 100 ตัวอักษร'); return; }
    if (pcContainsBadWord(newText)) { pcShowToast('🚫 กรุณาไม่ใช้คำที่ไม่เหมาะสม'); return; }

    const db = window.__pcDB;
    if (!db) return;

    try {
        const { doc, updateDoc } = window.__pcFirestoreFns;
        await updateDoc(doc(db, 'page-comments', window.__pcPageId, 'items', docId), { text: newText });
        pcShowToast('✅ แก้ไขแล้ว');
    } catch (e) {
        console.error('savePageComment error:', e);
        pcShowToast('❌ แก้ไขไม่สำเร็จ');
    }
};

window.cancelPageEdit = function (docId) {
    const editRow = document.getElementById(`pc-edit-row-${docId}`);
    const textEl  = document.getElementById(`pc-text-${docId}`);
    if (editRow) editRow.remove();
    if (textEl)  textEl.style.display = '';
};

// ===== โหลดคอมเมนต์ real-time สำหรับหน้า Page ย่อย =====
function loadPageComments(db, pageId) {
    const list = document.getElementById('pcList');
    const { collection, query, orderBy, limit, onSnapshot } = window.__pcFirestoreFns;

    const q = query(
        collection(db, 'page-comments', pageId, 'items'),
        orderBy('createdAt', 'desc'),
        limit(30)
    );

    onSnapshot(q, snapshot => {
        list.innerHTML = '';
        if (snapshot.empty) {
            list.innerHTML = '<div class="pc-loading">ยังไม่มีความคิดเห็น — เป็นคนแรกได้เลย! 🎉</div>';
            return;
        }
        snapshot.forEach(doc => {
            const data = { id: doc.id, ...doc.data() };
            list.appendChild(createPageCommentCard(data));
        });
    }, err => {
        console.error('loadPageComments onSnapshot error:', err);
        list.innerHTML = '<div class="pc-loading">❌ โหลดความคิดเห็นไม่ได้ กรุณารีเฟรช</div>';
    });
}

// ===== initPageComments — เรียกจากหน้า Page ย่อยหลัง login =====
window.initPageComments = function (user, db, firestoreFns, pageId) {
    if (!pageId) { console.error('initPageComments: ต้องระบุ pageId'); return; }

    window.__pcUser          = user;
    window.__pcDB            = db;
    window.__pcFirestoreFns  = firestoreFns;
    window.__pcPageId        = pageId;

    injectPageCommentStyles();
    createPageCommentSection();

    const badge = document.getElementById('pcUserBadge');
    if (badge) badge.title = 'รุ่นพี่ปริศนา';

    const input     = document.getElementById('pcInput');
    const charCount = document.getElementById('pcCharCount');
    if (input && charCount) {
        input.addEventListener('input', () => {
            const len = input.value.length;
            charCount.textContent = len;
            charCount.parentElement.className = 'pc-char-count' +
                (len > 90 ? ' over' : len > 70 ? ' warn' : '');
        });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') window.sendPageComment();
        });
    }

    loadPageComments(db, pageId);
};