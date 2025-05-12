// controllers/insightController.js
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');
const { generateSchedulingInsights, generateInventoryInsights, generateRevenueInsights, generatePatientInsights } = require('../services/insightGenerationService');

/**
 * @desc    Get all insights
 * @route   GET /api/insights
 * @access  Private
 */
const getInsights = asyncHandler(async (req, res) => {
    try {
        const { category, status } = req.query;

        console.log(category + " " + status)
        let query = supabaseAdmin
            .from('insights')
            .select('*')
            .order('created_at', { ascending: false });

        // Filter by category if provided
        if (category && category !== 'all') {
            query = query.eq('category', category);
        }

        // Filter by status if provided
        if (status) {
            query = query.eq('status', status);
        }

        const { data: insights, error } = await query;

        if (error) {
            res.status(400);
            throw new Error(error.message);
        }

        res.status(200).json(insights);
    } catch (error) {
        res.status(500);
        throw new Error(`Error getting insights: ${error.message}`);
    }
});

/**
 * @desc    Get insight by ID
 * @route   GET /api/insights/:id
 * @access  Private
 */
const getInsightById = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        const { data: insight, error } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            res.status(404);
            throw new Error('Insight not found');
        }

        res.status(200).json(insight);
    } catch (error) {
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Error retrieving insight');
    }
});

/**
 * @desc    Get insight statistics
 * @route   GET /api/insights/stats
 * @access  Private
 */
const getInsightStats = asyncHandler(async (req, res) => {
    try {
        // Get total insights count
        const { count: totalInsights, error: countError } = await supabaseAdmin
            .from('insights')
            .select('*', { count: 'exact', head: true });

        console.log(totalInsights)

        if (countError) {
            res.status(400);
            throw new Error(countError.message);
        }

        // Get new insights in the last 24 hours
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const { count: newInsights, error: newError } = await supabaseAdmin
            .from('insights')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', yesterday.toISOString());

        if (newError) {
            res.status(400);
            throw new Error(newError.message);
        }

        // Get insights by category
        const { data: categoryData, error: categoryError } = await supabaseAdmin
            .from('insights')
            .select('category')
            .eq('status', 'pending');

        if (categoryError) {
            res.status(400);
            throw new Error(categoryError.message);
        }

        // Count insights by category
        const schedulingInsights = categoryData.filter(item => item.category === 'scheduling').length;
        const inventoryInsights = categoryData.filter(item => item.category === 'inventory').length;
        const revenueInsights = categoryData.filter(item => item.category === 'revenue').length;
        const patientsInsights = categoryData.filter(item => item.category === 'patients').length;

        res.status(200).json({
            totalInsights,
            newInsights,
            schedulingInsights,
            inventoryInsights,
            revenueInsights,
            patientsInsights
        });
    } catch (error) {
        res.status(500);
        throw new Error(`Error getting insight stats: ${error.message}`);
    }
});

/**
 * @desc    Apply an insight
 * @route   POST /api/insights/:id/apply
 * @access  Private
 */
const applyInsight = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        // Get the insight details
        const { data: insight, error: getError } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('id', id)
            .single();

        if (getError || !insight) {
            res.status(404);
            throw new Error('Insight not found');
        }

        // Check if insight is already applied or dismissed
        if (insight.status !== 'pending') {
            res.status(400);
            throw new Error(`Insight already ${insight.status}`);
        }

        // Apply the insight based on its category and specific details
        let applyResult;

        switch (insight.category) {
            case 'scheduling':
                // Logic to apply scheduling insights
                // e.g., Reschedule appointments, adjust doctor schedules, etc.
                applyResult = await applySchedulingInsight(insight);
                break;

            case 'inventory':
                // Logic to apply inventory insights
                // e.g., Create purchase orders, adjust reorder thresholds, etc.
                applyResult = await applyInventoryInsight(insight);
                break;

            case 'revenue':
                // Logic to apply revenue insights
                // e.g., Adjust pricing, create billing campaigns, etc.
                applyResult = await applyRevenueInsight(insight);
                break;

            case 'patients':
                // Logic to apply patient insights
                // e.g., Send reminders, flag patients for follow-up, etc.
                applyResult = await applyPatientInsight(insight);
                break;

            default:
                res.status(400);
                throw new Error('Invalid insight category');
        }

        // Update insight status to applied
        const { data: updatedInsight, error: updateError } = await supabaseAdmin
            .from('insights')
            .update({
                status: 'applied',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            res.status(400);
            throw new Error(updateError.message);
        }

        res.status(200).json({
            message: 'Insight applied successfully',
            insight: updatedInsight,
            result: applyResult
        });
    } catch (error) {
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Error applying insight');
    }
});

/**
 * @desc    Dismiss an insight
 * @route   POST /api/insights/:id/dismiss
 * @access  Private
 */
const dismissInsight = asyncHandler(async (req, res) => {
    try {
        const { id } = req.params;

        // Check if insight exists
        const { data: existingInsight, error: existingError } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('id', id)
            .single();

        if (existingError || !existingInsight) {
            res.status(404);
            throw new Error('Insight not found');
        }

        // Update insight status to dismissed
        const { data: updatedInsight, error } = await supabaseAdmin
            .from('insights')
            .update({
                status: 'dismissed',
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            res.status(400);
            throw new Error(error.message);
        }

        res.status(200).json({
            message: 'Insight dismissed successfully',
            insight: updatedInsight
        });
    } catch (error) {
        res.status(error.statusCode || 500);
        throw new Error(error.message || 'Error dismissing insight');
    }
});

/**
 * @desc    Generate new insights
 * @route   POST /api/insights/generate
 * @access  Private
 */
const generateInsights = asyncHandler(async (req, res) => {
    try {
        const { type } = req.body;

        let insights = [];

        // Generate insights based on type or all types if not specified
        if (!type || type === 'scheduling') {
            const schedulingInsights = await generateSchedulingInsights();
            insights = [...insights, ...schedulingInsights];
        }

        if (!type || type === 'inventory') {
            const inventoryInsights = await generateInventoryInsights();
            insights = [...insights, ...inventoryInsights];
        }

        if (!type || type === 'revenue') {
            const revenueInsights = await generateRevenueInsights();
            insights = [...insights, ...revenueInsights];
        }

        if (!type || type === 'patients') {
            const patientInsights = await generatePatientInsights();
            insights = [...insights, ...patientInsights];
        }

        // Insert new insights into the database
        if (insights.length > 0) {
            const { data: createdInsights, error } = await supabaseAdmin
                .from('insights')
                .insert(insights)
                .select();

            if (error) {
                res.status(400);
                throw new Error(error.message);
            }

            res.status(201).json({
                message: `Generated ${createdInsights.length} new insights`,
                insights: createdInsights
            });
        } else {
            res.status(200).json({
                message: 'No new insights generated at this time',
                insights: []
            });
        }
    } catch (error) {
        res.status(500);
        throw new Error(`Error generating insights: ${error.message}`);
    }
});

// Helper functions to apply various types of insights
const applySchedulingInsight = async (insight) => {
    // Implementation will depend on the specific insight's data
    // This could involve rescheduling appointments, adjusting time slots, etc.

    // Example implementation:
    const { data, error } = await supabaseAdmin.rpc('apply_scheduling_insight', {
        insight_id: insight.id,
        insight_data: insight.data
    });

    if (error) throw new Error(`Failed to apply scheduling insight: ${error.message}`);

    return data;
};

const applyInventoryInsight = async (insight) => {
    // Implementation for inventory insights
    // This could involve creating purchase orders, updating reorder levels, etc.

    // Example implementation:
    const { data, error } = await supabaseAdmin.rpc('apply_inventory_insight', {
        insight_id: insight.id,
        insight_data: insight.data
    });

    if (error) throw new Error(`Failed to apply inventory insight: ${error.message}`);

    return data;
};

const applyRevenueInsight = async (insight) => {
    // Implementation for revenue insights
    // This could involve adjusting service prices, creating promotions, etc.

    // Example implementation:
    const { data, error } = await supabaseAdmin.rpc('apply_revenue_insight', {
        insight_id: insight.id,
        insight_data: insight.data
    });

    if (error) throw new Error(`Failed to apply revenue insight: ${error.message}`);

    return data;
};

const applyPatientInsight = async (insight) => {
    // Implementation for patient insights
    // This could involve sending reminders, generating follow-up appointments, etc.

    // Example implementation:
    const { data, error } = await supabaseAdmin.rpc('apply_patient_insight', {
        insight_id: insight.id,
        insight_data: insight.data
    });

    if (error) throw new Error(`Failed to apply patient insight: ${error.message}`);

    return data;
};

module.exports = {
    getInsights,
    getInsightById,
    getInsightStats,
    applyInsight,
    dismissInsight,
    generateInsights,
};