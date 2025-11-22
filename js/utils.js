// ===== Utility Functions =====

// تنسيق التاريخ بالعربية
function formatDate(date) {
    if (!date) return '';
    const d = new Date(date);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return d.toLocaleDateString('ar-SA', options);
}

// تنسيق التاريخ القصير
function formatDateShort(date) {
    if (!date) return '';
    const d = new Date(date);
    return d.toLocaleDateString('ar-SA');
}

// تنسيق الأرقام بالعربية
function formatNumber(number) {
    if (number === null || number === undefined) return '0';
    return Number(number).toLocaleString('ar-SA', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// تنسيق العملة
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '0 ر.س';
    return `${formatNumber(amount)} ر.س`;
}

// إنشاء معرف فريد
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// الحصول على التاريخ الحالي بصيغة YYYY-MM-DD
function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

// حساب الفرق بين تاريخين بالأيام
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// التحقق من صحة رقم الهاتف
function isValidPhone(phone) {
    const re = /^[0-9]{10}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// عرض رسالة تنبيه
function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 1rem 2rem;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 0.5rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 9999;
        animation: slideDown 0.3s ease;
        font-family: 'Cairo', sans-serif;
        font-weight: 600;
    `;
    alertDiv.textContent = message;
    document.body.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.style.animation = 'slideUp 0.3s ease';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

// تأكيد الحذف
function confirmDelete(message = 'هل أنت متأكد من الحذف؟') {
    return confirm(message);
}

// LocalStorage Functions
const Storage = {
    // حفظ البيانات
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    },
    
    // قراءة البيانات
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    },
    
    // حذف البيانات
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    },
    
    // مسح جميع البيانات
    clear() {
        try {
            localStorage.clear();
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }
};

// تصدير البيانات
function exportData() {
    const data = {
        vehicles: Storage.get('vehicles', []),
        fuel: Storage.get('fuel', []),
        maintenance: Storage.get('maintenance', []),
        parts: Storage.get('parts', []),
        reminders: Storage.get('reminders', []),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vehicle-expenses-backup-${getCurrentDate()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showAlert('تم تصدير البيانات بنجاح', 'success');
}

// استيراد البيانات
function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.vehicles) Storage.set('vehicles', data.vehicles);
            if (data.fuel) Storage.set('fuel', data.fuel);
            if (data.maintenance) Storage.set('maintenance', data.maintenance);
            if (data.parts) Storage.set('parts', data.parts);
            if (data.reminders) Storage.set('reminders', data.reminders);
            
            showAlert('تم استيراد البيانات بنجاح', 'success');
            location.reload();
        } catch (error) {
            showAlert('خطأ في استيراد البيانات', 'error');
            console.error('Import error:', error);
        }
    };
    reader.readAsText(file);
}

// إنشاء نسخة احتياطية تلقائية
function autoBackup() {
    const lastBackup = Storage.get('lastBackup');
    const now = new Date().getTime();
    
    // نسخة احتياطية كل 7 أيام
    if (!lastBackup || (now - lastBackup) > 7 * 24 * 60 * 60 * 1000) {
        const data = {
            vehicles: Storage.get('vehicles', []),
            fuel: Storage.get('fuel', []),
            maintenance: Storage.get('maintenance', []),
            parts: Storage.get('parts', []),
            reminders: Storage.get('reminders', [])
        };
        
        Storage.set('backup', data);
        Storage.set('lastBackup', now);
    }
}

// استعادة النسخة الاحتياطية
function restoreBackup() {
    const backup = Storage.get('backup');
    if (!backup) {
        showAlert('لا توجد نسخة احتياطية', 'error');
        return;
    }
    
    if (confirmDelete('هل تريد استعادة النسخة الاحتياطية؟ سيتم استبدال البيانات الحالية.')) {
        Storage.set('vehicles', backup.vehicles || []);
        Storage.set('fuel', backup.fuel || []);
        Storage.set('maintenance', backup.maintenance || []);
        Storage.set('parts', backup.parts || []);
        Storage.set('reminders', backup.reminders || []);
        
        showAlert('تم استعادة النسخة الاحتياطية بنجاح', 'success');
        location.reload();
    }
}

// إضافة أنماط CSS للتنبيهات
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
        to {
            opacity: 1;
            transform: translate(-50%, 0);
        }
    }
    
    @keyframes slideUp {
        from {
            opacity: 1;
            transform: translate(-50%, 0);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -20px);
        }
    }
`;
document.head.appendChild(style);

// تشغيل النسخ الاحتياطي التلقائي عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', autoBackup);
