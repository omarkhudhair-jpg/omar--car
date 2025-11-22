// ===== Dashboard Management =====

// تحديث لوحة التحكم
function updateDashboard() {
    const activeVehicle = vehicleManager.getActive();

    if (!activeVehicle) {
        // إذا لم تكن هناك مركبة نشطة، اعرض رسالة
        updateDashboardStats(0, 0, 0, 0);
        clearCharts();
        clearRecentTransactions();
        return;
    }

    // حساب الإحصائيات
    const fuelCost = fuelManager.getTotalCost(activeVehicle.id);
    const maintenanceCost = maintenanceManager.getTotalCost(activeVehicle.id);
    const partsCost = partsManager.getTotalCost(activeVehicle.id);
    const totalCost = fuelCost + maintenanceCost + partsCost;

    // تحديث بطاقات الإحصائيات
    updateDashboardStats(totalCost, fuelCost, maintenanceCost, partsCost);

    // تحديث الرسوم البيانية
    updateMonthlyChart(activeVehicle.id);
    updateExpensesPieChart(fuelCost, maintenanceCost, partsCost);

    // تحديث آخر العمليات
    updateRecentTransactions(activeVehicle.id);
}

// تحديث بطاقات الإحصائيات
function updateDashboardStats(total, fuel, maintenance, parts) {
    const totalEl = document.getElementById('totalExpenses');
    const fuelEl = document.getElementById('fuelExpenses');
    const maintenanceEl = document.getElementById('maintenanceExpenses');
    const partsEl = document.getElementById('partsExpenses');

    if (totalEl) totalEl.textContent = formatCurrency(total);
    if (fuelEl) fuelEl.textContent = formatCurrency(fuel);
    if (maintenanceEl) maintenanceEl.textContent = formatCurrency(maintenance);
    if (partsEl) partsEl.textContent = formatCurrency(parts);

    // تحديث عدد العمليات
    const activeVehicle = vehicleManager.getActive();
    if (activeVehicle) {
        const fuelCount = fuelManager.getAll(activeVehicle.id).length;
        const maintenanceCount = maintenanceManager.getAll(activeVehicle.id).length;
        const partsCount = partsManager.getAll(activeVehicle.id).length;

        const fuelCard = fuelEl?.closest('.stat-card');
        const maintenanceCard = maintenanceEl?.closest('.stat-card');
        const partsCard = partsEl?.closest('.stat-card');

        if (fuelCard) {
            const changeEl = fuelCard.querySelector('.stat-change');
            if (changeEl) changeEl.textContent = `${fuelCount} عملية تعبئة`;
        }

        if (maintenanceCard) {
            const changeEl = maintenanceCard.querySelector('.stat-change');
            if (changeEl) changeEl.textContent = `${maintenanceCount} عملية صيانة`;
        }

        if (partsCard) {
            const changeEl = partsCard.querySelector('.stat-change');
            if (changeEl) changeEl.textContent = `${partsCount} قطعة`;
        }
    }
}

// تحديث الرسم البياني الشهري
let monthlyChartInstance = null;
function updateMonthlyChart(vehicleId) {
    const canvas = document.getElementById('monthlyChart');
    if (!canvas) return;

    // جمع البيانات لآخر 6 أشهر
    const months = [];
    const fuelData = [];
    const maintenanceData = [];
    const partsData = [];

    for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
        const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

        months.push(date.toLocaleDateString('ar-SA', { month: 'short' }));

        // حساب التكاليف لكل شهر
        const fuelRecords = fuelManager.getAll(vehicleId).filter(r => {
            const d = new Date(r.date);
            return d >= monthStart && d <= monthEnd;
        });

        const maintenanceRecords = maintenanceManager.getAll(vehicleId).filter(r => {
            const d = new Date(r.date);
            return d >= monthStart && d <= monthEnd;
        });

        const partsRecords = partsManager.getAll(vehicleId).filter(r => {
            const d = new Date(r.date);
            return d >= monthStart && d <= monthEnd;
        });

        fuelData.push(fuelRecords.reduce((sum, r) => sum + parseFloat(r.cost), 0));
        maintenanceData.push(maintenanceRecords.reduce((sum, r) => sum + parseFloat(r.cost || 0), 0));
        partsData.push(partsRecords.reduce((sum, r) => sum + parseFloat(r.price || 0), 0));
    }

    // تدمير الرسم البياني السابق
    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
    }

    // إنشاء رسم بياني جديد
    const ctx = canvas.getContext('2d');
    monthlyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: months,
            datasets: [
                {
                    label: 'الوقود',
                    data: fuelData,
                    backgroundColor: 'rgba(240, 147, 251, 0.8)',
                    borderColor: 'rgba(240, 147, 251, 1)',
                    borderWidth: 2
                },
                {
                    label: 'الصيانة',
                    data: maintenanceData,
                    backgroundColor: 'rgba(79, 172, 254, 0.8)',
                    borderColor: 'rgba(79, 172, 254, 1)',
                    borderWidth: 2
                },
                {
                    label: 'قطع الغيار',
                    data: partsData,
                    backgroundColor: 'rgba(250, 112, 154, 0.8)',
                    borderColor: 'rgba(250, 112, 154, 1)',
                    borderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: {
                            family: 'Cairo'
                        },
                        callback: function (value) {
                            return formatNumber(value) + ' ر.س';
                        }
                    }
                },
                x: {
                    ticks: {
                        font: {
                            family: 'Cairo'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: 'Cairo',
                            size: 12
                        },
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return context.dataset.label + ': ' + formatCurrency(context.parsed.y);
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

// تحديث المخطط الدائري
let pieChartInstance = null;
function updateExpensesPieChart(fuel, maintenance, parts) {
    const canvas = document.getElementById('expensesPieChart');
    if (!canvas) return;

    // تدمير الرسم البياني السابق
    if (pieChartInstance) {
        pieChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    pieChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['الوقود', 'الصيانة', 'قطع الغيار'],
            datasets: [{
                data: [fuel, maintenance, parts],
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
                            size: 12
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
                            const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
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

// تحديث آخر العمليات
function updateRecentTransactions(vehicleId) {
    const container = document.getElementById('recentTransactions');
    if (!container) return;

    // جمع جميع العمليات
    const allTransactions = [];

    // إضافة عمليات الوقود
    fuelManager.getAll(vehicleId).forEach(record => {
        allTransactions.push({
            type: 'fuel',
            date: record.date,
            title: 'تعبئة وقود',
            description: `${formatNumber(record.liters)} لتر`,
            amount: record.cost,
            icon: 'fuel'
        });
    });

    // إضافة عمليات الصيانة
    maintenanceManager.getAll(vehicleId).forEach(record => {
        allTransactions.push({
            type: 'maintenance',
            date: record.date,
            title: record.service,
            description: record.type,
            amount: record.cost,
            icon: 'maintenance'
        });
    });

    // إضافة قطع الغيار
    partsManager.getAll(vehicleId).forEach(record => {
        allTransactions.push({
            type: 'parts',
            date: record.date,
            title: record.name,
            description: record.category,
            amount: record.price,
            icon: 'parts'
        });
    });

    // ترتيب حسب التاريخ
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // عرض آخر 5 عمليات
    const recent = allTransactions.slice(0, 5);

    if (recent.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <path d="M12 8v4m0 4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>لا توجد عمليات حتى الآن</p>
            </div>
        `;
        return;
    }

    const iconColors = {
        fuel: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        maintenance: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
        parts: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)'
    };

    container.innerHTML = recent.map(transaction => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon" style="background: ${iconColors[transaction.type]};">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        ${transaction.icon === 'fuel' ? '<path d="M3 22h12M4 9h10M5 2h8l1 7H4l1-7z" stroke-width="2"/>' :
            transaction.icon === 'maintenance' ? '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke-width="2"/>' :
                '<circle cx="12" cy="12" r="3" stroke-width="2"/><circle cx="12" cy="12" r="8" stroke-width="2"/>'}
                    </svg>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.title}</h4>
                    <p>${transaction.description} • ${formatDateShort(transaction.date)}</p>
                </div>
            </div>
            <div class="transaction-amount">${formatCurrency(transaction.amount)}</div>
        </div>
    `).join('');
}

// مسح الرسوم البيانية
function clearCharts() {
    if (monthlyChartInstance) {
        monthlyChartInstance.destroy();
        monthlyChartInstance = null;
    }

    if (pieChartInstance) {
        pieChartInstance.destroy();
        pieChartInstance = null;
    }
}

// مسح آخر العمليات
function clearRecentTransactions() {
    const container = document.getElementById('recentTransactions');
    if (container) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10" stroke-width="2"/>
                    <path d="M12 8v4m0 4h.01" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <p>لا توجد عمليات حتى الآن</p>
            </div>
        `;
    }
}

// تهيئة لوحة التحكم
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
});
