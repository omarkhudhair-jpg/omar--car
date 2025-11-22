// ===== Maintenance Management =====

class MaintenanceManager {
    constructor() {
        this.maintenanceRecords = Storage.get('maintenance', []);
    }

    // الحصول على جميع السجلات
    getAll(vehicleId = null) {
        if (vehicleId) {
            return this.maintenanceRecords.filter(m => m.vehicleId === vehicleId);
        }
        return this.maintenanceRecords;
    }

    // الحصول على سجل بالمعرف
    getById(id) {
        return this.maintenanceRecords.find(m => m.id === id);
    }

    // إضافة سجل صيانة
    add(maintenanceData) {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return null;
        }

        const record = {
            id: generateId(),
            vehicleId: activeVehicle.id,
            ...maintenanceData,
            createdAt: new Date().toISOString()
        };

        this.maintenanceRecords.push(record);
        this.maintenanceRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.save();

        showAlert('تمت إضافة سجل الصيانة بنجاح', 'success');
        return record;
    }

    // تحديث سجل
    update(id, maintenanceData) {
        const index = this.maintenanceRecords.findIndex(m => m.id === id);
        if (index === -1) return false;

        this.maintenanceRecords[index] = {
            ...this.maintenanceRecords[index],
            ...maintenanceData,
            updatedAt: new Date().toISOString()
        };

        this.save();
        showAlert('تم تحديث السجل بنجاح', 'success');
        return true;
    }

    // حذف سجل
    delete(id) {
        if (!confirmDelete('هل أنت متأكد من حذف هذا السجل؟')) {
            return false;
        }

        this.maintenanceRecords = this.maintenanceRecords.filter(m => m.id !== id);
        this.save();
        showAlert('تم حذف السجل بنجاح', 'success');
        return true;
    }

    // حساب إجمالي التكلفة
    getTotalCost(vehicleId) {
        const records = this.getAll(vehicleId);
        return records.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0);
    }

    // حفظ البيانات
    save() {
        Storage.set('maintenance', this.maintenanceRecords);
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.renderMaintenanceList();

        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // عرض قائمة الصيانة
    renderMaintenanceList() {
        const container = document.getElementById('maintenanceList');
        if (!container) return;

        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke-width="2"/>
                    </svg>
                    <p>الرجاء اختيار مركبة</p>
                </div>
            `;
            return;
        }

        const records = this.getAll(activeVehicle.id);

        if (records.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke-width="2"/>
                    </svg>
                    <p>لا توجد عمليات صيانة مسجلة</p>
                </div>
            `;
            return;
        }

        container.innerHTML = records.map(record => `
            <div class="maintenance-card">
                <div class="maintenance-header">
                    <div>
                        <span class="maintenance-type ${record.type === 'دورية' ? 'routine' : 'emergency'}">${record.type}</span>
                        <h4>${record.service}</h4>
                    </div>
                    <div class="action-btns">
                        <button class="btn-icon btn-sm" onclick="maintenanceManager.showEditModal('${record.id}')" title="تعديل">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-sm btn-danger" onclick="maintenanceManager.delete('${record.id}')" title="حذف">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="maintenance-details">
                    <div class="maintenance-detail">
                        <span>التاريخ</span>
                        <span>${formatDateShort(record.date)}</span>
                    </div>
                    <div class="maintenance-detail">
                        <span>التكلفة</span>
                        <span>${formatCurrency(record.cost)}</span>
                    </div>
                    ${record.mileage ? `
                        <div class="maintenance-detail">
                            <span>قراءة العداد</span>
                            <span>${formatNumber(record.mileage)} كم</span>
                        </div>
                    ` : ''}
                    ${record.workshop ? `
                        <div class="maintenance-detail">
                            <span>الورشة</span>
                            <span>${record.workshop}</span>
                        </div>
                    ` : ''}
                    ${record.notes ? `
                        <div class="maintenance-detail" style="flex-direction: column; align-items: flex-start;">
                            <span>ملاحظات</span>
                            <span style="margin-top: 0.5rem; color: var(--text-primary);">${record.notes}</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `).join('');
    }

    // عرض نافذة إضافة صيانة
    showAddModal() {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return;
        }

        const modal = this.createModal('إضافة صيانة');
        document.getElementById('modalContainer').appendChild(modal);
    }

    // عرض نافذة تعديل صيانة
    showEditModal(id) {
        const record = this.getById(id);
        if (!record) return;

        const modal = this.createModal('تعديل سجل الصيانة', record);
        document.getElementById('modalContainer').appendChild(modal);
    }

    // إنشاء نافذة منبثقة
    createModal(title, record = null) {
        const isEdit = record !== null;

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
                    <form id="maintenanceForm">
                        <div class="form-group">
                            <label>نوع الصيانة *</label>
                            <select class="form-control" name="type" required>
                                <option value="دورية" ${record?.type === 'دورية' ? 'selected' : ''}>دورية</option>
                                <option value="طارئة" ${record?.type === 'طارئة' ? 'selected' : ''}>طارئة</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>نوع الخدمة *</label>
                            <select class="form-control" name="service" required>
                                <option value="تغيير زيت" ${record?.service === 'تغيير زيت' ? 'selected' : ''}>تغيير زيت</option>
                                <option value="فحص دوري" ${record?.service === 'فحص دوري' ? 'selected' : ''}>فحص دوري</option>
                                <option value="فرامل" ${record?.service === 'فرامل' ? 'selected' : ''}>فرامل</option>
                                <option value="إطارات" ${record?.service === 'إطارات' ? 'selected' : ''}>إطارات</option>
                                <option value="بطارية" ${record?.service === 'بطارية' ? 'selected' : ''}>بطارية</option>
                                <option value="تكييف" ${record?.service === 'تكييف' ? 'selected' : ''}>تكييف</option>
                                <option value="كهرباء" ${record?.service === 'كهرباء' ? 'selected' : ''}>كهرباء</option>
                                <option value="محرك" ${record?.service === 'محرك' ? 'selected' : ''}>محرك</option>
                                <option value="أخرى" ${record?.service === 'أخرى' ? 'selected' : ''}>أخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>التاريخ *</label>
                            <input type="date" class="form-control" name="date" value="${record?.date || getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label>التكلفة (ر.س) *</label>
                            <input type="number" class="form-control" name="cost" value="${record?.cost || ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>قراءة العداد (كم)</label>
                            <input type="number" class="form-control" name="mileage" value="${record?.mileage || ''}" min="0">
                        </div>
                        <div class="form-group">
                            <label>الورشة</label>
                            <input type="text" class="form-control" name="workshop" value="${record?.workshop || ''}">
                        </div>
                        <div class="form-group">
                            <label>ملاحظات</label>
                            <textarea class="form-control" name="notes">${record?.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="maintenanceManager.${isEdit ? `updateMaintenance('${record.id}')` : 'addMaintenance()'}">
                        ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // إضافة صيانة من النموذج
    addMaintenance() {
        const form = document.getElementById('maintenanceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const maintenanceData = Object.fromEntries(formData.entries());

        this.add(maintenanceData);
        document.querySelector('.modal-overlay').remove();
    }

    // تحديث صيانة من النموذج
    updateMaintenance(id) {
        const form = document.getElementById('maintenanceForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const maintenanceData = Object.fromEntries(formData.entries());

        this.update(id, maintenanceData);
        document.querySelector('.modal-overlay').remove();
    }
}

// إنشاء مثيل من مدير الصيانة
const maintenanceManager = new MaintenanceManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addMaintenanceBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => maintenanceManager.showAddModal());
    }

    maintenanceManager.updateUI();
});
