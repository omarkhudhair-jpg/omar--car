// ===== Parts Management =====

class PartsManager {
    constructor() {
        this.partsRecords = Storage.get('parts', []);
    }

    // الحصول على جميع السجلات
    getAll(vehicleId = null) {
        if (vehicleId) {
            return this.partsRecords.filter(p => p.vehicleId === vehicleId);
        }
        return this.partsRecords;
    }

    // الحصول على سجل بالمعرف
    getById(id) {
        return this.partsRecords.find(p => p.id === id);
    }

    // إضافة سجل قطعة
    add(partData) {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return null;
        }

        const record = {
            id: generateId(),
            vehicleId: activeVehicle.id,
            ...partData,
            createdAt: new Date().toISOString()
        };

        this.partsRecords.push(record);
        this.partsRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.save();

        showAlert('تمت إضافة قطعة الغيار بنجاح', 'success');
        return record;
    }

    // تحديث سجل
    update(id, partData) {
        const index = this.partsRecords.findIndex(p => p.id === id);
        if (index === -1) return false;

        this.partsRecords[index] = {
            ...this.partsRecords[index],
            ...partData,
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

        this.partsRecords = this.partsRecords.filter(p => p.id !== id);
        this.save();
        showAlert('تم حذف السجل بنجاح', 'success');
        return true;
    }

    // حساب إجمالي التكلفة
    getTotalCost(vehicleId) {
        const records = this.getAll(vehicleId);
        return records.reduce((sum, r) => sum + parseFloat(r.price || 0), 0);
    }

    // حفظ البيانات
    save() {
        Storage.set('parts', this.partsRecords);
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.renderPartsList();

        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // عرض قائمة قطع الغيار
    renderPartsList() {
        const tbody = document.getElementById('partsTableBody');
        if (!tbody) return;

        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">الرجاء اختيار مركبة</td></tr>';
            return;
        }

        const records = this.getAll(activeVehicle.id);

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">لا توجد قطع غيار مسجلة</td></tr>';
            return;
        }

        tbody.innerHTML = records.map(record => `
            <tr>
                <td>${formatDateShort(record.date)}</td>
                <td>${record.name}</td>
                <td>${record.category}</td>
                <td>${formatCurrency(record.price)}</td>
                <td>${record.supplier || '-'}</td>
                <td>
                    <div class="action-btns">
                        <button class="btn btn-sm btn-edit" onclick="partsManager.showEditModal('${record.id}')">تعديل</button>
                        <button class="btn btn-sm btn-delete" onclick="partsManager.delete('${record.id}')">حذف</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // عرض نافذة إضافة قطعة
    showAddModal() {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return;
        }

        const modal = this.createModal('إضافة قطعة غيار');
        document.getElementById('modalContainer').appendChild(modal);
    }

    // عرض نافذة تعديل قطعة
    showEditModal(id) {
        const record = this.getById(id);
        if (!record) return;

        const modal = this.createModal('تعديل قطعة الغيار', record);
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
                    <form id="partForm">
                        <div class="form-group">
                            <label>اسم القطعة *</label>
                            <input type="text" class="form-control" name="name" value="${record?.name || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>التصنيف *</label>
                            <select class="form-control" name="category" required>
                                <option value="محرك" ${record?.category === 'محرك' ? 'selected' : ''}>محرك</option>
                                <option value="فرامل" ${record?.category === 'فرامل' ? 'selected' : ''}>فرامل</option>
                                <option value="تعليق" ${record?.category === 'تعليق' ? 'selected' : ''}>تعليق</option>
                                <option value="كهرباء" ${record?.category === 'كهرباء' ? 'selected' : ''}>كهرباء</option>
                                <option value="إطارات" ${record?.category === 'إطارات' ? 'selected' : ''}>إطارات</option>
                                <option value="زيوت وفلاتر" ${record?.category === 'زيوت وفلاتر' ? 'selected' : ''}>زيوت وفلاتر</option>
                                <option value="تكييف" ${record?.category === 'تكييف' ? 'selected' : ''}>تكييف</option>
                                <option value="إضاءة" ${record?.category === 'إضاءة' ? 'selected' : ''}>إضاءة</option>
                                <option value="أخرى" ${record?.category === 'أخرى' ? 'selected' : ''}>أخرى</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>التاريخ *</label>
                            <input type="date" class="form-control" name="date" value="${record?.date || getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label>السعر (ر.س) *</label>
                            <input type="number" class="form-control" name="price" value="${record?.price || ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>المورد</label>
                            <input type="text" class="form-control" name="supplier" value="${record?.supplier || ''}">
                        </div>
                        <div class="form-group">
                            <label>الكمية</label>
                            <input type="number" class="form-control" name="quantity" value="${record?.quantity || '1'}" min="1">
                        </div>
                        <div class="form-group">
                            <label>ملاحظات</label>
                            <textarea class="form-control" name="notes">${record?.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="partsManager.${isEdit ? `updatePart('${record.id}')` : 'addPart()'}">
                        ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // إضافة قطعة من النموذج
    addPart() {
        const form = document.getElementById('partForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const partData = Object.fromEntries(formData.entries());

        this.add(partData);
        document.querySelector('.modal-overlay').remove();
    }

    // تحديث قطعة من النموذج
    updatePart(id) {
        const form = document.getElementById('partForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const partData = Object.fromEntries(formData.entries());

        this.update(id, partData);
        document.querySelector('.modal-overlay').remove();
    }
}

// إنشاء مثيل من مدير قطع الغيار
const partsManager = new PartsManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addPartBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => partsManager.showAddModal());
    }

    partsManager.updateUI();
});
