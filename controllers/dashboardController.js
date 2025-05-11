const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get dashboard statistics
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getDashboardStats = asyncHandler(async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // Get today's appointments
        const { data: todayAppointments, error: appointmentsError } = await supabaseAdmin
            .from('appointments')
            .select('*')
            .eq('date', today);

        console.log("Appointments : ", todayAppointments)
        if (appointmentsError) {
            res.status(400);
            throw new Error(appointmentsError.message);
        }

        // Get today's revenue
        const { data: todayInvoices, error: invoicesError } = await supabaseAdmin
            .from('invoices')
            .select('total_amount')
            .eq('invoice_date', today)
            .eq('status', 'paid');

        if (invoicesError) {
            res.status(400);
            throw new Error(invoicesError.message);
        }

        const todayRevenue = todayInvoices.reduce((sum, invoice) => sum + invoice.total_amount, 0);

        // Get total patients
        const { count: totalPatients, error: patientsError } = await supabaseAdmin
            .from('patients')
            .select('*', { count: 'exact', head: true });

        if (patientsError) {
            res.status(400);
            throw new Error(patientsError.message);
        }

        // Get average wait time (normally would be calculated from appointments data)
        // This is a placeholder - in a real app, this would be more sophisticated
        const avgWaitTime = 12; // minutes

        // Get inventory alerts
        // Get inventory alerts
        const { data: inventoryItems, error: inventoryError } = await supabaseAdmin
            .from('inventory')
            .select('*')
            .order('stock', { ascending: true });

        if (inventoryError) {
            res.status(400);
            throw new Error(inventoryError.message);
        }

        // Process inventory alerts - filter items where stock <= threshold
        const inventoryAlerts = inventoryItems
            .filter(item => item.stock <= item.threshold)
            .slice(0, 5);

        // Process inventory alerts
        const processedInventoryAlerts = inventoryAlerts.map(item => {
            let status = 'low-stock';

            if (item.stock <= 0) {
                status = 'out-of-stock';
            } else if (item.stock <= item.threshold * 0.25) {
                status = 'critical';
            }

            const percentage = item.threshold > 0 ? Math.round((item.stock / item.threshold) * 100) : 0;

            return {
                id: item.id,
                name: item.name,
                stock: item.stock,
                threshold: item.threshold,
                percentage,
                status,
            };
        });

        // Calculate stats trends (compared to previous period)
        // This is a placeholder - in a real app, this would use actual historical data
        const trends = {
            appointmentsTrend: { value: 8, isPositive: true },
            patientsTrend: { value: 12, isPositive: true },
            revenueTrend: { value: 5, isPositive: true },
            waitTimeTrend: { value: 2, isPositive: false },
        };

        res.status(200).json({
            todayAppointments: {
                count: todayAppointments.length,
                data: todayAppointments,
                trend: trends.appointmentsTrend,
            },
            totalPatients: {
                count: totalPatients,
                trend: trends.patientsTrend,
            },
            todayRevenue: {
                amount: todayRevenue,
                trend: trends.revenueTrend,
            },
            avgWaitTime: {
                minutes: avgWaitTime,
                trend: trends.waitTimeTrend,
            },
            inventoryAlerts: processedInventoryAlerts,
        });
    } catch (error) {
        console.log(error)
    }
});

/**
 * @desc    Get appointment analytics for dashboard
 * @route   GET /api/dashboard/appointments-overview
 * @access  Private
 */
const getAppointmentsOverview = asyncHandler(async (req, res) => {
    const today = new Date();
    const lastWeekStart = new Date(today);
    lastWeekStart.setDate(today.getDate() - 6);

    // Format date range for query
    const startDate = lastWeekStart.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    // Get appointments for the last week
    const { data: appointments, error } = await supabaseAdmin
        .from('appointments')
        .select('date, status')
        .gte('date', startDate)
        .lte('date', endDate);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Define days of the week
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Initialize result array with zero counts
    const result = days.map(day => ({
        day,
        appointments: 0,
    }));

    // Process appointments data
    appointments.forEach(appointment => {
        const date = new Date(appointment.date);
        const dayIndex = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

        result[dayIndex].appointments += 1;
    });

    // Reorder result to start from Monday
    const mondayIndex = days.indexOf('Mon');
    const reorderedResult = [
        ...result.slice(mondayIndex),
        ...result.slice(0, mondayIndex),
    ];

    res.status(200).json(reorderedResult);
});

/**
 * @desc    Get revenue analytics for dashboard
 * @route   GET /api/dashboard/revenue-chart
 * @access  Private
 */
const getRevenueChart = asyncHandler(async (req, res) => {
    // Get invoices for the last 6 months
    const today = new Date();
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // 6 months including current

    const startDate = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1)
        .toISOString()
        .split('T')[0];

    const { data: invoices, error } = await supabaseAdmin
        .from('invoices')
        .select('invoice_date, total_amount, status')
        .gte('invoice_date', startDate)
        .eq('status', 'paid');

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Define months
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    // Initialize monthly revenue data
    const monthlyData = {};

    // Get the last 6 months
    for (let i = 0; i < 6; i++) {
        const d = new Date(today);
        d.setMonth(today.getMonth() - i);
        const monthKey = months[d.getMonth()];
        monthlyData[monthKey] = 0;
    }

    // Process invoices data
    invoices.forEach(invoice => {
        const date = new Date(invoice.invoice_date);
        const monthKey = months[date.getMonth()];

        // Only include data for the last 6 months
        if (monthlyData[monthKey] !== undefined) {
            monthlyData[monthKey] += invoice.total_amount;
        }
    });

    // Convert to array format for chart
    const result = Object.entries(monthlyData)
        .map(([month, revenue]) => ({
            month,
            revenue,
        }))
        .reverse(); // To get chronological order

    res.status(200).json(result);
});

/**
 * @desc    Get patient analytics for dashboard
 * @route   GET /api/dashboard/patient-analytics
 * @access  Private
 */
const getPatientAnalytics = asyncHandler(async (req, res) => {
    // Get all patients
    const { data: patients, error } = await supabaseAdmin
        .from('patients')
        .select('*');

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Age distribution
    const ageGroups = {
        '0-18': 0,
        '19-35': 0,
        '36-50': 0,
        '51-65': 0,
        '65+': 0,
    };

    // Gender distribution
    const genderData = {
        'Male': 0,
        'Female': 0,
        'Other': 0,
    };

    // Process patient data
    patients.forEach(patient => {
        // Age distribution
        const age = patient.age;

        if (age <= 18) {
            ageGroups['0-18'] += 1;
        } else if (age <= 35) {
            ageGroups['19-35'] += 1;
        } else if (age <= 50) {
            ageGroups['36-50'] += 1;
        } else if (age <= 65) {
            ageGroups['51-65'] += 1;
        } else {
            ageGroups['65+'] += 1;
        }

        // Gender distribution
        const gender = patient.gender || 'Other';
        genderData[gender] = (genderData[gender] || 0) + 1;
    });

    // Convert to array format for charts
    const ageDistribution = Object.entries(ageGroups).map(([name, value]) => ({
        name,
        value,
    }));

    const genderDistribution = Object.entries(genderData).map(([name, value]) => ({
        name,
        value,
    }));

    // Get appointment types
    const { data: appointments, error: appointmentsError } = await supabaseAdmin
        .from('appointments')
        .select('type')
        .not('type', 'is', null);

    if (appointmentsError) {
        res.status(400);
        throw new Error(appointmentsError.message);
    }

    // Process appointment types
    const appointmentTypes = {};

    appointments.forEach(appointment => {
        const type = appointment.type;
        appointmentTypes[type] = (appointmentTypes[type] || 0) + 1;
    });

    // Convert to array format for chart
    const appointmentTypeData = Object.entries(appointmentTypes)
        .map(([name, value]) => ({
            name,
            value,
        }))
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 5); // Get top 5

    res.status(200).json({
        ageDistribution,
        genderDistribution,
        appointmentTypeData,
        totalPatients: patients.length,
        // Additional summary metrics
        newPatients: 87, // Placeholder - in a real app, calculate from actual data
        returningRate: 68, // Placeholder - in a real app, calculate from actual data
        avgWaitTime: 12, // Placeholder - in a real app, calculate from actual data
    });
});

module.exports = {
    getDashboardStats,
    getAppointmentsOverview,
    getRevenueChart,
    getPatientAnalytics,
};