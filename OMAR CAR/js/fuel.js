// ===== Fuel Management =====

class FuelManager {
    constructor() {
        this.fuelRecords = Storage.get('fuel', []);
    }

    // الحصول على جميع السجلات
    getAll(vehicleId = null) {
        if (vehicleId) {
            return this.fuelRecords.filter(f => f.vehicleId === vehicleId);
        }
        return this.fuelRecords;
    }

    // الحصول على سجل بالمعرف
    getById(id) {
        return this.fuelRecords.find(f => f.id === id);
    }

    // إضافة سجل تعبئة
    add(fuelData) {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return null;
        }

        const record = {
            id: generateId(),
            vehicleId: activeVehicle.id,
            ...fuelData,
            createdAt: new Date().toISOString()
        };

        this.fuelRecords.push(record);
        this.fuelRecords.sort((a, b) => new Date(b.date) - new Date(a.date));
        this.save();

        showAlert('تمت إضافة سجل التعبئة بنجاح', 'success');
        return record;
    }

    // تحديث سجل
    update(id, fuelData) {
        const index = this.fuelRecords.findIndex(f => f.id === id);
        if (index === -1) return false;

        this.fuelRecords[index] = {
            ...this.fuelRecords[index],
            ...fuelData,
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

        this.fuelRecords = this.fuelRecords.filter(f => f.id !== id);
        this.save();
        showAlert('تم حذف السجل بنجاح', 'success');
        return true;
    }

    // حساب معدل الاستهلاك
    calculateConsumption(vehicleId) {
        const records = this.getAll(vehicleId).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (records.length < 2) return null;

        let totalDistance = 0;
        let totalLiters = 0;

        for (let i = 1; i < records.length; i++) {
            const distance = records[i].mileage - records[i - 1].mileage;
            if (distance > 0) {
                totalDistance += distance;
                totalLiters += parseFloat(records[i].liters);
            }
        }

        if (totalLiters === 0) return null;

        return totalDistance / totalLiters; // كم/لتر
    }

    // حساب تكلفة الكيلومتر
    calculateCostPerKm(vehicleId) {
        const records = this.getAll(vehicleId);
        if (records.length === 0) return null;

        const totalCost = records.reduce((sum, r) => sum + parseFloat(r.cost), 0);
        const firstMileage = Math.min(...records.map(r => parseFloat(r.mileage)));
        const lastMileage = Math.max(...records.map(r => parseFloat(r.mileage)));
        const totalDistance = lastMileage - firstMileage;

        if (totalDistance === 0) return null;

        return totalCost / totalDistance;
    }

    // حساب إجمالي الكمية
    getTotalLiters(vehicleId) {
        const records = this.getAll(vehicleId);
        return records.reduce((sum, r) => sum + parseFloat(r.liters), 0);
    }

    // حساب إجمالي التكلفة
    getTotalCost(vehicleId) {
        const records = this.getAll(vehicleId);
        return records.reduce((sum, r) => sum + parseFloat(r.cost), 0);
    }

    // حفظ البيانات
    save() {
        Storage.set('fuel', this.fuelRecords);
        this.updateUI();
    }

    // تحديث واجهة المستخدم
    updateUI() {
        this.renderFuelList();
        this.updateFuelStats();

        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    }

    // عرض قائمة التعبئة
    renderFuelList() {
        const tbody = document.getElementById('fuelTableBody');
        if (!tbody) return;

        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">الرجاء اختيار مركبة</td></tr>';
            return;
        }

        const records = this.getAll(activeVehicle.id);

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-cell">لا توجد عمليات تعبئة</td></tr>';
            return;
        }

        tbody.innerHTML = records.map((record, index) => {
            let consumption = '-';
            if (index < records.length - 1) {
                const distance = record.mileage - records[index + 1].mileage;
                if (distance > 0) {
                    consumption = formatNumber(distance / parseFloat(record.liters)) + ' كم/لتر';
                }
            }

            return `
                <tr>
                    <td>${formatDateShort(record.date)}</td>
                    <td>${formatNumber(record.liters)}</td>
                    <td>${formatCurrency(record.cost)}</td>
                    <td>${formatNumber(record.mileage)} كم</td>
                    <td>${consumption}</td>
                    <td>
                        <div class="action-btns">
                            <button class="btn btn-sm btn-edit" onclick="fuelManager.showEditModal('${record.id}')">تعديل</button>
                            <button class="btn btn-sm btn-delete" onclick="fuelManager.delete('${record.id}')">حذف</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // تحديث إحصائيات الوقود
    updateFuelStats() {
        const activeVehicle = vehicleManager.getActive();

        const avgConsumptionEl = document.getElementById('avgConsumption');
        const costPerKmEl = document.getElementById('costPerKm');
        const totalLitersEl = document.getElementById('totalLiters');

        if (!activeVehicle) {
            if (avgConsumptionEl) avgConsumptionEl.textContent = '-- كم/لتر';
            if (costPerKmEl) costPerKmEl.textContent = '-- ر.س/كم';
            if (totalLitersEl) totalLitersEl.textContent = '0 لتر';
            return;
        }

        const consumption = this.calculateConsumption(activeVehicle.id);
        const costPerKm = this.calculateCostPerKm(activeVehicle.id);
        const totalLiters = this.getTotalLiters(activeVehicle.id);

        if (avgConsumptionEl) {
            avgConsumptionEl.textContent = consumption ? formatNumber(consumption) + ' كم/لتر' : '-- كم/لتر';
        }

        if (costPerKmEl) {
            costPerKmEl.textContent = costPerKm ? formatNumber(costPerKm) + ' ر.س/كم' : '-- ر.س/كم';
        }

        if (totalLitersEl) {
            totalLitersEl.textContent = formatNumber(totalLiters) + ' لتر';
        }
    }

    // عرض نافذة إضافة تعبئة
    showAddModal() {
        const activeVehicle = vehicleManager.getActive();
        if (!activeVehicle) {
            showAlert('الرجاء اختيار مركبة أولاً', 'error');
            return;
        }

        const modal = this.createModal('إضافة تعبئة وقود');
        document.getElementById('modalContainer').appendChild(modal);
    }

    // عرض نافذة تعديل تعبئة
    showEditModal(id) {
        const record = this.getById(id);
        if (!record) return;

        const modal = this.createModal('تعديل سجل التعبئة', record);
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
                    <form id="fuelForm">
                        <div class="form-group">
                            <label>التاريخ *</label>
                            <input type="date" class="form-control" name="date" value="${record?.date || getCurrentDate()}" required>
                        </div>
                        <div class="form-group">
                            <label>الكمية (لتر) *</label>
                            <input type="number" class="form-control" name="liters" value="${record?.liters || ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>التكلفة (ر.س) *</label>
                            <input type="number" class="form-control" name="cost" value="${record?.cost || ''}" step="0.01" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>قراءة العداد (كم) *</label>
                            <input type="number" class="form-control" name="mileage" value="${record?.mileage || ''}" min="0" required>
                        </div>
                        <div class="form-group">
                            <label>المحطة</label>
                            <input type="text" class="form-control" name="station" value="${record?.station || ''}">
                        </div>
                        <div class="form-group">
                            <label>ملاحظات</label>
                            <textarea class="form-control" name="notes">${record?.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="fuelManager.${isEdit ? `updateFuel('${record.id}')` : 'addFuel()'}">
                        ${isEdit ? 'تحديث' : 'إضافة'}
                    </button>
                    <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">إلغاء</button>
                </div>
            </div>
        `;

        return overlay;
    }

    // إضافة تعبئة من النموذج
    addFuel() {
        const form = document.getElementById('fuelForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const fuelData = Object.fromEntries(formData.entries());

        this.add(fuelData);
        document.querySelector('.modal-overlay').remove();
    }

    // تحديث تعبئة من النموذج
    updateFuel(id) {
        const form = document.getElementById('fuelForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const formData = new FormData(form);
        const fuelData = Object.fromEntries(formData.entries());

        this.update(id, fuelData);
        document.querySelector('.modal-overlay').remove();
    }
}

// إنشاء مثيل من مدير الوقود
const fuelManager = new FuelManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.getElementById('addFuelBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => fuelManager.showAddModal());
    }

    fuelManager.updateUI();
});
