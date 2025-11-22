// ===== Main Application =====

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

// تهيئة التطبيق
function initializeApp() {
    // تهيئة الثيم
    initializeTheme();

    // تهيئة التنقل
    initializeNavigation();

    // تحديث لوحة التحكم
    updateDashboard();

    // التحقق من التذكيرات
    checkReminders();
}

// تهيئة الثيم
function initializeTheme() {
    const savedTheme = Storage.get('theme', 'light');
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

// تبديل الثيم
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-theme', newTheme);
    Storage.set('theme', newTheme);

    // تحديث أيقونة الثيم
    const icon = document.querySelector('#themeToggle .icon');
    if (icon) {
        if (newTheme === 'dark') {
            icon.innerHTML = `
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            `;
        } else {
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5" stroke-width="2"/>
                <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke-width="2" stroke-linecap="round"/>
            `;
        }
    }
}

// تهيئة التنقل
function initializeNavigation() {
    const navItems = document.querySelectorAll('.nav-item');

    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = item.getAttribute('data-page');
            navigateToPage(pageName);
        });
    });
}

// التنقل إلى صفحة
function navigateToPage(pageName) {
    // إخفاء جميع الصفحات
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });

    // إزالة التحديد من جميع عناصر القائمة
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });

    // عرض الصفحة المطلوبة
    const targetPage = document.getElementById(pageName + 'Page');
    if (targetPage) {
        targetPage.classList.add('active');
    }

    // تحديد عنصر القائمة
    const targetNavItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (targetNavItem) {
        targetNavItem.classList.add('active');
    }

    // تحديث المحتوى حسب الصفحة
    switch (pageName) {
        case 'dashboard':
            updateDashboard();
            break;
        case 'vehicles':
            vehicleManager.updateUI();
            break;
        case 'fuel':
            fuelManager.updateUI();
            break;
        case 'maintenance':
            maintenanceManager.updateUI();
            break;
        case 'parts':
            partsManager.updateUI();
            break;
        case 'reminders':
            remindersManager.updateUI();
            break;
    }
}

// التحقق من التذكيرات
function checkReminders() {
    const upcomingReminders = remindersManager.getUpcoming(null, 7);

    if (upcomingReminders.length > 0) {
        // عرض إشعار بالتذكيرات القادمة
        const urgentReminders = upcomingReminders.filter(r => {
            const daysUntil = Math.ceil((new Date(r.date) - new Date()) / (1000 * 60 * 60 * 24));
            return daysUntil <= 3;
        });

        if (urgentReminders.length > 0) {
            setTimeout(() => {
                showAlert(`لديك ${urgentReminders.length} تذكير قادم خلال 3 أيام`, 'info');
            }, 2000);
        }
    }
}

// إضافة اختصارات لوحة المفاتيح
document.addEventListener('keydown', (e) => {
    // Alt + D للوحة التحكم
    if (e.altKey && e.key === 'd') {
        e.preventDefault();
        navigateToPage('dashboard');
    }

    // Alt + V للمركبات
    if (e.altKey && e.key === 'v') {
        e.preventDefault();
        navigateToPage('vehicles');
    }

    // Alt + F للوقود
    if (e.altKey && e.key === 'f') {
        e.preventDefault();
        navigateToPage('fuel');
    }

    // Alt + M للصيانة
    if (e.altKey && e.key === 'm') {
        e.preventDefault();
        navigateToPage('maintenance');
    }

    // Alt + P لقطع الغيار
    if (e.altKey && e.key === 'p') {
        e.preventDefault();
        navigateToPage('parts');
    }

    // Alt + R للتقارير
    if (e.altKey && e.key === 'r') {
        e.preventDefault();
        navigateToPage('reports');
    }

    // Alt + N للتذكيرات
    if (e.altKey && e.key === 'n') {
        e.preventDefault();
        navigateToPage('reminders');
    }

    // Escape لإغلاق النوافذ المنبثقة
    if (e.key === 'Escape') {
        const modal = document.querySelector('.modal-overlay');
        if (modal) {
            modal.remove();
        }
    }
});

// إضافة دعم السحب والإفلات للاستيراد
document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    body.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    body.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/json') {
            if (confirm('هل تريد استيراد البيانات من هذا الملف؟')) {
                importData(files[0]);
            }
        }
    });
});

// إضافة قائمة سياق مخصصة (اختياري)
document.addEventListener('contextmenu', (e) => {
    // يمكن إضافة قائمة سياق مخصصة هنا إذا لزم الأمر
});

// معالجة الأخطاء العامة
window.addEventListener('error', (e) => {
    console.error('Application error:', e.error);
    // يمكن إضافة معالجة أخطاء مخصصة هنا
});

// معالجة الأخطاء غير المعالجة في الوعود
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    // يمكن إضافة معالجة أخطاء مخصصة هنا
});

// تحديث الساعة (اختياري)
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-SA');
    const dateString = now.toLocaleDateString('ar-SA', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // يمكن عرض الوقت في الترويسة إذا لزم الأمر
}

// تحديث الساعة كل ثانية (اختياري)
// setInterval(updateClock, 1000);

// رسالة ترحيب
console.log('%c🚗 تطبيق تتبع مصروفات المركبة', 'font-size: 20px; font-weight: bold; color: #667eea;');
console.log('%cمرحباً بك! التطبيق جاهز للاستخدام.', 'font-size: 14px; color: #64748b;');
console.log('%cاختصارات لوحة المفاتيح:', 'font-size: 12px; font-weight: bold; margin-top: 10px;');
console.log('Alt + D: لوحة التحكم');
console.log('Alt + V: المركبات');
console.log('Alt + F: الوقود');
console.log('Alt + M: الصيانة');
console.log('Alt + P: قطع الغيار');
console.log('Alt + R: التقارير');
console.log('Alt + N: التذكيرات');
console.log('Escape: إغلاق النوافذ المنبثقة');
