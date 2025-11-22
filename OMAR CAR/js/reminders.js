// ===== Reminders Management =====

class RemindersManager {
    constructor() {
        this.reminders = Storage.get('reminders', []);
    }

    // الحصول على جميع التذكيرات
    getAll(vehicleId = null) {
        if (vehicleId) {
            return this.reminders.filter(r => r.vehicleId === vehicleId);
        }
        return this.reminders;
    }

    // الحصول على تذكير بالمعرف
    getById(id) {
        return this.reminders.find(r => r.id === id);
    }

    // الحصول على التذكيرات القادمة
    getUpcoming(vehicleId = null, days = 30) {
        const now = new Date();
        const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        let reminders = this.reminders.filter(r => {
            const reminderDate = new Date(r.date);
            return reminderDate >= now && reminderDate <= futureDate && !r.completed;
        });

        if (vehicleId) {
            reminders = reminders.filter(r => r.vehicleId === vehicleId);
        }

        return reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    // إضافة تذكير
    add(reminderData) {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return null;
        }

        const reminder = {
            id: generateId(),
            vehicleId: activeVehicle.id,
            completed: false,
            ...reminderData,
            createdAt: new Date().toISOString()
        };

        this.reminders.push(reminder);
        this.reminders.sort((a, b) => new Date(a.date) - new Date(b.date));
        this.save();

        showAlert('تمت إضافة التذكير بنجاح', 'success');
        return reminder;
    }

    // تحديث تذكير
    update(id, reminderData) {
        const index = this.reminders.findIndex(r => r.id === id);
        if (index === -1) return false;

        this.reminders[index] = {
            ...this.reminders[index],
            ...reminderData,
            updatedAt: new Date().toISOString()
        };

        this.save();
        showAlert('تم تحديث التذكير بنجاح', 'success');
        return true;
    }

    // حذف تذكير
    delete(id) {
        if (!confirmDelete('هل أنت متأكد من حذف هذا التذكير؟')) {
            return false;
        }

        this.reminders = this.reminders.filter(r => r.id !== id);
        this.save();
        showAlert('تم حذف التذكير بنجاح', 'success');
        return true;
    }

    // تعليم كمكتمل
    markComplete(id) {
        const reminder = this.getById(id);
        if (!reminder) return false;

        reminder.completed = true;
        reminder.completedAt = new Date().toISOString();
        this.save();

        showAlert('تم تعليم التذكير كمكتمل', 'success');
        return true;
    }

    // حفظ البيانات
    save() {
        Storage.set('reminders', this.reminders);
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.renderRemindersList();

        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // عرض قائمة التذكيرات
    renderRemindersList() {
        const container = document.getElementById('remindersList');
        if (!container) return;

        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke-width="2"/>
                    </svg>
                    <p>الرجاء اختيار مركبة</p>
                </div>
            `;
            return;
        }

        const reminders = this.getAll(activeVehicle.id).filter(r => !r.completed);

        if (reminders.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" stroke-width="2"/>
                    </svg>
                    <p>لا توجد تذكيرات</p>
                </div>
            `;
            return;
        }

        container.innerHTML = reminders.map(reminder => {
            const reminderDate = new Date(reminder.date);
            const now = new Date();
            const daysUntil = Math.ceil((reminderDate - now) / (1000 * 60 * 60 * 24));

            let statusClass = '';
            if (daysUntil < 0) statusClass = 'urgent';
            else if (daysUntil <= 7) statusClass = 'upcoming';

            return `
                <div class="reminder-card ${statusClass}">
                    <div class="reminder-info">
                        <h4>${reminder.title}</h4>
                        <p>${reminder.description || ''}</p>
                        <p style="margin-top: 0.5rem; color: var(--text-tertiary); font-size: 0.85rem;">
                            ${daysUntil < 0 ? 'متأخر بـ ' + Math.abs(daysUntil) + ' يوم' :
                    daysUntil === 0 ? 'اليوم' :
                        'بعد ' + daysUntil + ' يوم'}
                        </p>
                    </div>
                    <div>
                        <div class="reminder-date">
                            <div>${formatDateShort(reminder.date)}</div>
                        </div>
                        <div class="action-btns" style="margin-top: 1rem; justify-content: flex-end;">
                            <button class="btn btn-sm btn-primary" onclick="remindersManager.markComplete('${reminder.id}')">إكمال</button>
                            <button class="btn btn-sm btn-edit" onclick="remindersManager.showEditModal('${reminder.id}')">تعديل</button>
                            <button class="btn btn-sm btn-delete" onclick="remindersManager.delete('${reminder.id}')">حذف</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // عرض نافذة إضافة تذكير
    showAddModal() {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return;
        }

        const modal = this.createModal('إضافة تذكير');
        document.getElementById('modalContainer').appendChild(modal);
    }

    // عرض نافذة تعديل تذكير
    showEditModal(id) {
        const reminder = this.getById(id);
        if (!reminder) return;

        const modal = this.createModal('تعديل التذكير', reminder);
        document.getElementById('modalContainer').appendChild(modal);
    }

    // إنشاء نافذة منبثقة
    createModal(title, reminder = null) {
        const isEdit = reminder !== null;

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        overlay.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${title}</h3>
                    <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="reminderForm">
                        <div class="form-group">
                            <label>العنوان *</label>
                            <input type="text" class="form-control" name="title" value="${reminder?.title || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>النوع *</label>
                            <select class="form-control" name="type" required>
                                <option value="صيانة دورية" ${reminder?.type === 'صيانة دورية' ? 'selected' : ''}>صيانة دورية</option>
                                <option value="تجديد تأمين" ${reminder?.type === 'تجديد تأمين' ? 'selected' : ''}>تجديد تأمين</option>
                                <option value="تجديد رخصة" ${reminder?.type === 'تجديد رخصة' ? 'selected' : ''}>تجديد رخصة</option>
                                <option value="فحص دوري" ${reminder?.type === 'فحص دوري' ? 'selected' : ''}>فحص دوري</option>
                                <option value="تغيير زيت" ${reminder?.type === 'تغيير زيت' ? 'selected' : ''}>تغيير زيت</option>
                                <option value="أخرى" ${reminder?.type === 'أخرى' ? 'selected' : ''}>أخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>التاريخ *</label>
                            <input type="date" class="form-control" name="date" value="${reminder?.date || getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label>الوصف</label>
                            <textarea class="form-control" name="description">${reminder?.description || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="remindersManager.${isEdit ? `updateReminder('${reminder.id}')` : 'addReminder()'}">
                        ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // إضافة تذكير من النموذج
    addReminder() {
        const form = document.getElementById('reminderForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const reminderData = Object.fromEntries(formData.entries());

        this.add(reminderData);
        document.querySelector('.modal-overlay').remove();
    }

    // تحديث تذكير من النموذج
    updateReminder(id) {
        const form = document.getElementById('reminderForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const reminderData = Object.fromEntries(formData.entries());

        this.update(id, reminderData);
        document.querySelector('.modal-overlay').remove();
    }
}

// إنشاء مثيل من مدير التذكيرات
const remindersManager = new RemindersManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addReminderBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => remindersManager.showAddModal());
    }

    remindersManager.updateUI();
});
