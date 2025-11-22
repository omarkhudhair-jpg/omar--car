// ===== Vehicles Management =====

class VehicleManager {
    constructor() {
        this.vehicles = Storage.get('vehicles', []);
        this.activeVehicleId = Storage.get('activeVehicle');
    }

    // الحصول على جميع المركبات
    getAll() {
        return this.vehicles;
    }

    // الحصول على مركبة بالمعرف
    getById(id) {
        return this.vehicles.find(v => v.id === id);
    }

    // الحصول على المركبة النشطة
    getActive() {
        if (!this.activeVehicleId) return null;
        return this.getById(this.activeVehicleId);
    }

    // إضافة مركبة جديدة
    add(vehicleData) {
        const vehicle = {
            id: generateId(),
            ...vehicleData,
            createdAt: new Date().toISOString()
        };

        this.vehicles.push(vehicle);
        this.save();

        // إذا كانت أول مركبة، اجعلها نشطة
        if (this.vehicles.length === 1) {
            this.setActive(vehicle.id);
        }

        showAlert('تمت إضافة المركبة بنجاح', 'success');
        return vehicle;
    }

    // تحديث مركبة
    update(id, vehicleData) {
        const index = this.vehicles.findIndex(v => v.id === id);
        if (index === -1) return false;

        this.vehicles[index] = {
            ...this.vehicles[index],
            ...vehicleData,
            updatedAt: new Date().toISOString()
        };

        this.save();
        showAlert('تم تحديث المركبة بنجاح', 'success');
        return true;
    }

    // حذف مركبة
    delete(id) {
        if (!confirmDelete('هل أنت متأكد من حذف هذه المركبة؟ سيتم حذف جميع البيانات المرتبطة بها.')) {
            return false;
        }

        this.vehicles = this.vehicles.filter(v => v.id !== id);

        // إذا كانت المركبة المحذوفة هي النشطة
        if (this.activeVehicleId === id) {
            this.activeVehicleId = this.vehicles.length > 0 ? this.vehicles[0].id : null;
            Storage.set('activeVehicle', this.activeVehicleId);
        }

        this.save();

        // حذف البيانات المرتبطة
        this.deleteRelatedData(id);

        showAlert('تم حذف المركبة بنجاح', 'success');
        return true;
    }

    // حذف البيانات المرتبطة بالمركبة
    deleteRelatedData(vehicleId) {
        // حذف سجلات الوقود
        let fuel = Storage.get('fuel', []);
        fuel = fuel.filter(f => f.vehicleId !== vehicleId);
        Storage.set('fuel', fuel);

        // حذف سجلات الصيانة
        let maintenance = Storage.get('maintenance', []);
        maintenance = maintenance.filter(m => m.vehicleId !== vehicleId);
        Storage.set('maintenance', maintenance);

        // حذف سجلات قطع الغيار
        let parts = Storage.get('parts', []);
        parts = parts.filter(p => p.vehicleId !== vehicleId);
        Storage.set('parts', parts);

        // حذف التذكيرات
        let reminders = Storage.get('reminders', []);
        reminders = reminders.filter(r => r.vehicleId !== vehicleId);
        Storage.set('reminders', reminders);
    }

    // تعيين المركبة النشطة
    setActive(id) {
        this.activeVehicleId = id;
        Storage.set('activeVehicle', id);
        this.updateUI();
    }

    // حفظ البيانات
    save() {
        Storage.set('vehicles', this.vehicles);
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.renderVehiclesList();
        this.updateVehicleSelector();

        // تحديث لوحة التحكم إذا كانت موجودة
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // عرض قائمة المركبات
    renderVehiclesList() {
        const container = document.getElementById('vehiclesList');
        if (!container) return;

        if (this.vehicles.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 17h14v-5l-1.5-4.5h-11L5 12v5z" stroke-width="2"/>
                        <circle cx="7.5" cy="17.5" r="1.5" fill="currentColor"/>
                        <circle cx="16.5" cy="17.5" r="1.5" fill="currentColor"/>
                    </svg>
                    <p>لا توجد مركبات مضافة</p>
                    <button class="btn btn-primary" onclick="vehicleManager.showAddModal()">إضافة مركبة الآن</button>
                </div>
            `;
            return;
        }

        container.innerHTML = this.vehicles.map(vehicle => `
            <div class="vehicle-card ${vehicle.id === this.activeVehicleId ? 'active' : ''}" onclick="vehicleManager.setActive('${vehicle.id}')">
                <div class="vehicle-header">
                    <div class="vehicle-info">
                        <h3>${vehicle.make} ${vehicle.model}</h3>
                        <p>${vehicle.year} • ${vehicle.plateNumber}</p>
                    </div>
                    <div class="vehicle-actions">
                        <button class="btn-icon btn-sm" onclick="event.stopPropagation(); vehicleManager.showEditModal('${vehicle.id}')" title="تعديل">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke-width="2" stroke-linecap="round"/>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                        <button class="btn-icon btn-sm btn-danger" onclick="event.stopPropagation(); vehicleManager.delete('${vehicle.id}')" title="حذف">
                            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke-width="2" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="vehicle-stats">
                    <div class="vehicle-stat">
                        <p>نوع الوقود</p>
                        <h4>${vehicle.fuelType || 'بنزين'}</h4>
                    </div>
                    <div class="vehicle-stat">
                        <p>اللون</p>
                        <h4>${vehicle.color || '-'}</h4>
                    </div>
                </div>
            </div>
        `).join('');
    }

    // تحديث قائمة اختيار المركبة
    updateVehicleSelector() {
        const selector = document.getElementById('activeVehicle');
        if (!selector) return;

        selector.innerHTML = '<option value="">اختر مركبة</option>' +
            this.vehicles.map(v => `
                <option value="${v.id}" ${v.id === this.activeVehicleId ? 'selected' : ''}>
                    ${v.make} ${v.model} (${v.plateNumber})
                </option>
            `).join('');
    }

    // عرض نافذة إضافة مركبة
    showAddModal() {
        const modal = this.createModal('إضافة مركبة جديدة');
        document.getElementById('modalContainer').appendChild(modal);
    }

    // عرض نافذة تعديل مركبة
    showEditModal(id) {
        const vehicle = this.getById(id);
        if (!vehicle) return;

        const modal = this.createModal('تعديل المركبة', vehicle);
        document.getElementById('modalContainer').appendChild(modal);
    }

    // إنشاء نافذة منبثقة
    createModal(title, vehicle = null) {
        const isEdit = vehicle !== null;

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
                    <form id="vehicleForm">
                        <div class="form-group">
                            <label>الشركة المصنعة *</label>
                            <input type="text" class="form-control" name="make" value="${vehicle?.make || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>الموديل *</label>
                            <input type="text" class="form-control" name="model" value="${vehicle?.model || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>سنة الصنع *</label>
                            <input type="number" class="form-control" name="year" value="${vehicle?.year || new Date().getFullYear()}" min="1900" max="${new Date().getFullYear() + 1}" required>
                        </div>
                        <div class="form-group">
                            <label>رقم اللوحة *</label>
                            <input type="text" class="form-control" name="plateNumber" value="${vehicle?.plateNumber || ''}" required>
                        </div>
                        <div class="form-group">
                            <label>نوع الوقود</label>
                            <select class="form-control" name="fuelType">
                                <option value="بنزين" ${vehicle?.fuelType === 'بنزين' ? 'selected' : ''}>بنزين</option>
                                <option value="ديزل" ${vehicle?.fuelType === 'ديزل' ? 'selected' : ''}>ديزل</option>
                                <option value="كهرباء" ${vehicle?.fuelType === 'كهرباء' ? 'selected' : ''}>كهرباء</option>
                                <option value="هجين" ${vehicle?.fuelType === 'هجين' ? 'selected' : ''}>هجين</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>اللون</label>
                            <input type="text" class="form-control" name="color" value="${vehicle?.color || ''}">
                        </div>
                        <div class="form-group">
                            <label>قراءة العداد الحالية (كم)</label>
                            <input type="number" class="form-control" name="currentMileage" value="${vehicle?.currentMileage || ''}" min="0">
                        </div>
                        <div class="form-group">
                            <label>ملاحظات</label>
                            <textarea class="form-control" name="notes">${vehicle?.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="vehicleManager.${isEdit ? `updateVehicle('${vehicle.id}')` : 'addVehicle()'}">
                        ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // إضافة مركبة من النموذج
    addVehicle() {
        const form = document.getElementById('vehicleForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const vehicleData = Object.fromEntries(formData.entries());

        this.add(vehicleData);
        document.querySelector('.modal-overlay').remove();
    }

    // تحديث مركبة من النموذج
    updateVehicle(id) {
        const form = document.getElementById('vehicleForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const vehicleData = Object.fromEntries(formData.entries());

        this.update(id, vehicleData);
        document.querySelector('.modal-overlay').remove();
    }
}

// إنشاء مثيل من مدير المركبات
const vehicleManager = new VehicleManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // زر إضافة مركبة
    const addBtn = document.getElementById('addVehicleBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => vehicleManager.showAddModal());
    }

    // قائمة اختيار المركبة
    const selector = document.getElementById('activeVehicle');
    if (selector) {
        selector.addEventListener('change', (e) => {
            if (e.target.value) {
                vehicleManager.setActive(e.target.value);
            }
        });
    }

    // تحديث الواجهة
    vehicleManager.updateUI();
});
