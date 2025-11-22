// ===== Reports Management =====

class ReportsManager {
    constructor() {
        this.currentReport = null;
    }

    // إنشاء تقرير
    generateReport(fromDate, toDate, vehicleId = null) {
        const vehicle = vehicleId ? vehicleManager.getById(vehicleId) : vehicleManager.getActive();

        if (!vehicle) {
            showAlert('الرجاء اختيار مركبة', 'error');
            return null;
        }

        const from = new Date(fromDate);
        const to = new Date(toDate);

        // جمع البيانات
        const fuelRecords = fuelManager.getAll(vehicle.id).filter(r => {
            const date = new Date(r.date);
            return date >= from && date <= to;
        });

        const maintenanceRecords = maintenanceManager.getAll(vehicle.id).filter(r => {
            const date = new Date(r.date);
            return date >= from && date <= to;
        });

        const partsRecords = partsManager.getAll(vehicle.id).filter(r => {
            const date = new Date(r.date);
            return date >= from && date <= to;
        });

        // حساب الإحصائيات
        const fuelCost = fuelRecords.reduce((sum, r) => sum + parseFloat(r.cost), 0);
        const maintenanceCost = maintenanceRecords.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0);
        const partsCost = partsRecords.reduce((sum, r) => sum + parseFloat(r.price || 0), 0);
        const totalCost = fuelCost + maintenanceCost + partsCost;

        const totalLiters = fuelRecords.reduce((sum, r) => sum + parseFloat(r.liters), 0);

        this.currentReport = {
            vehicle,
            fromDate,
            toDate,
            fuelRecords,
            maintenanceRecords,
            partsRecords,
            stats: {
                fuelCost,
                maintenanceCost,
                partsCost,
                totalCost,
                totalLiters,
                fuelCount: fuelRecords.length,
                maintenanceCount: maintenanceRecords.length,
                partsCount: partsRecords.length
            }
        };

        this.renderReport();
        return this.currentReport;
    }

    // عرض التقرير
    renderReport() {
        const container = document.getElementById('reportContent');
        if (!container || !this.currentReport) return;

        const { vehicle, fromDate, toDate, stats } = this.currentReport;

        container.innerHTML = `
            <div class="report-header" style="margin-bottom: 2rem; padding-bottom: 1rem; border-bottom: 2px solid var(--border-color);">
                <h3 style="margin-bottom: 0.5rem;">تقرير مصروفات المركبة</h3>
                <p style="color: var(--text-secondary);">
                    ${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})
                </p>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    من ${formatDateShort(fromDate)} إلى ${formatDateShort(toDate)}
                </p>
            </div>
            
            <div class="stats-grid" style="margin-bottom: 2rem;">
                <div class="stat-box">
                    <p>إجمالي المصروفات</p>
                    <h3 style="color: var(--primary);">${formatCurrency(stats.totalCost)}</h3>
                </div>
                <div class="stat-box">
                    <p>مصروفات الوقود</p>
                    <h3>${formatCurrency(stats.fuelCost)}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                        ${stats.fuelCount} عملية تعبئة
                    </p>
                </div>
                <div class="stat-box">
                    <p>مصروفات الصيانة</p>
                    <h3>${formatCurrency(stats.maintenanceCost)}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                        ${stats.maintenanceCount} عملية صيانة
                    </p>
                </div>
                <div class="stat-box">
                    <p>قطع الغيار</p>
                    <h3>${formatCurrency(stats.partsCost)}</h3>
                    <p style="font-size: 0.85rem; color: var(--text-tertiary); margin-top: 0.25rem;">
                        ${stats.partsCount} قطعة
                    </p>
                </div>
            </div>
            
            <div style="margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1rem;">توزيع المصروفات</h4>
                <canvas id="reportPieChart" style="max-height: 300px;"></canvas>
            </div>
            
            <div class="report-actions" style="display: flex; gap: 1rem; margin-top: 2rem;">
                <button class="btn btn-primary" onclick="reportsManager.printReport()">
                    <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" stroke-width="2"/>
                        <rect x="6" y="14" width="12" height="8" stroke-width="2"/>
                    </svg>
                    طباعة
                </button>
            </div>
        `;

        // رسم المخطط الدائري
        setTimeout(() => this.renderPieChart(), 100);
    }

    // رسم المخطط الدائري
    renderPieChart() {
        const canvas = document.getElementById('reportPieChart');
        if (!canvas || !this.currentReport) return;

        const { stats } = this.currentReport;

        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['الوقود', 'الصيانة', 'قطع الغيار'],
                datasets: [{
                    data: [stats.fuelCost, stats.maintenanceCost, stats.partsCost],
                    backgroundColor: [
                        'rgba(240, 147, 251, 0.8)',
                        'rgba(79, 172, 254, 0.8)',
                        'rgba(250, 112, 154, 0.8)'
                    ],
                    borderColor: [
                        'rgba(240, 147, 251, 1)',
                        'rgba(79, 172, 254, 1)',
                        'rgba(250, 112, 154, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: {
                                family: 'Cairo',
                                size: 14
                            },
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = formatCurrency(context.parsed);
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        },
                        titleFont: {
                            family: 'Cairo'
                        },
                        bodyFont: {
                            family: 'Cairo'
                        }
                    }
                }
            }
        });
    }

    // طباعة التقرير
    printReport() {
        window.print();
    }
}

// إنشاء مثيل من مدير التقارير
const reportsManager = new ReportsManager();

// تهيئة الصفحة
document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generateReportBtn');
    if (generateBtn) {
        generateBtn.addEventListener('click', () => {
            const fromDate = document.getElementById('reportFromDate').value;
            const toDate = document.getElementById('reportToDate').value;

            if (!fromDate || !toDate) {
                showAlert('الرجاء اختيار الفترة الزمنية', 'error');
                return;
            }

            if (new Date(fromDate) > new Date(toDate)) {
                showAlert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية', 'error');
                return;
            }

            reportsManager.generateReport(fromDate, toDate);
        });
    }

    // تعيين التواريخ الافتراضية
    const toDateInput = document.getElementById('reportToDate');
    const fromDateInput = document.getElementById('reportFromDate');

    if (toDateInput) {
        toDateInput.value = getCurrentDate();
    }

    if (fromDateInput) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        fromDateInput.value = lastMonth.toISOString().split('T')[0];
    }
});
