// global.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey:            "AQ.Ab8RN6IAgrFqC1WGf-czIOWE__jT7-7UEv_kdAgvsZozwvS3Ow",
    authDomain:        "myuniversityguide-c083c.firebaseapp.com",
    projectId:         "myuniversityguide-c083c",
    storageBucket:     "myuniversityguide-c083c.firebasestorage.app",
    messagingSenderId: "649652214412",
    appId:             "1:649652214412:web:06937089fc7bbe111579a9"
};

// ถ้า Firebase initialize ไปแล้ว ใช้อันเดิม ไม่ต้องสร้างใหม่
const app  = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
    if (user) {
        const tryInit = () => {
            if (typeof window.initAIChat === 'function') {
                window.initAIChat("AQ.Ab8RN6IAgrFqC1WGf-czIOWE__jT7-7UEv_kdAgvsZozwvS3Ow", user.email);
            } else {
                setTimeout(tryInit, 100);
            }
        };
        tryInit();
    }
});