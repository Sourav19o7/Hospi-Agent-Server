// controllers/insightController.js - Updated implementation
const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all insights
 * @route   GET /api/insights
 * @access  Private
 */
const getInsights = asyncHandler(async (req, res) => {
    try {
        const { category, status } = req.query;

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
    const { id } = req.params;
    
    console.log("Reached here")
    // Use a transaction to ensure all operations are atomic
    const { data, error } = await supabaseAdmin.rpc('begin_transaction');

    console.log("Error" , error)
    
    if (error) {
        res.status(500);
        throw new Error(`Transaction error: ${error.message}`);
    }
    
    try {
        // 1. Get the insight details
        const { data: insight, error: getError } = await supabaseAdmin
            .from('insights')
            .select('*')
            .eq('id', id)
            .single();

        if (getError || !insight) {
            res.status(404);
            throw new Error('Insight not found');
        }

        // 2. Check if insight is already applied or dismissed
        if (insight.status !== 'pending') {
            res.status(400);
            throw new Error(`Insight already ${insight.status}`);
        }
        
        // 3. Create a record in insight_applications
        const { data: application, error: appError } = await supabaseAdmin
            .from('insight_applications')
            .insert({
                insight_id: id,
                applied_by: req.user.id,
                status: 'in_progress',
                notes: `Applying ${insight.category} insight`
            })
            .select()
            .single();
            
        if (appError) {
            await supabaseAdmin.rpc('rollback_transaction');
            res.status(400);
            throw new Error(`Error creating application record: ${appError.message}`);
        }
        
        // 4. Process the insight based on category
        let result = { changes: [], insights: 0 };
        
        switch (insight.category) {
            case 'scheduling':
                result = await applySchedulingInsight(insight, req.user.id);
                break;
                
            case 'inventory':
                result = await applyInventoryInsight(insight, req.user.id);
                break;
                
            case 'revenue':
                result = await applyRevenueInsight(insight, req.user.id);
                break;
                
            case 'patients':
                result = await applyPatientInsight(insight, req.user.id);
                break;
                
            default:
                await supabaseAdmin.rpc('rollback_transaction');
                res.status(400);
                throw new Error('Invalid insight category');
        }
        
        // 5. Update the insight status
        const { error: updateError } = await supabaseAdmin
            .from('insights')
            .update({
                status: 'applied',
                updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
        if (updateError) {
            await supabaseAdmin.rpc('rollback_transaction');
            res.status(400);
            throw new Error(`Error updating insight: ${updateError.message}`);
        }
        
        // 6. Update the application record with results
        const { error: appUpdateError } = await supabaseAdmin
            .from('insight_applications')
            .update({
                status: 'completed',
                result: JSON.stringify(result)
            })
            .eq('id', application.id);
            
        if (appUpdateError) {
            await supabaseAdmin.rpc('rollback_transaction');
            res.status(400);
            throw new Error(`Error updating application: ${appUpdateError.message}`);
        }
        
        // 7. Commit the transaction
        await supabaseAdmin.rpc('commit_transaction');
        
        // 8. Return success response
        res.status(200).json({
            message: `${insight.category.charAt(0).toUpperCase() + insight.category.slice(1)} insight applied successfully`,
            insight,
            result: {
                applicationId: application.id,
                applicationTime: application.application_time,
                ...result
            }
        });
    } catch (error) {
        // Make sure to rollback on any error
        await supabaseAdmin.rpc('rollback_transaction');
        
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
        console.log(error)
        res.status(500);
        throw new Error(`Error generating insights: ${error.message}`);
    }
});

/**
 * Implementation for applying scheduling insights
 */
const applySchedulingInsight = async (insight, userId) => {
    try {
        const changes = [];
        const data = insight.data;
        
        // Make sure we have valid data to work with
        if (!data || !data.appointments || !Array.isArray(data.appointments)) {
            return { changes: [], insights: 0 };
        }
        
        // Process each appointment in the insight
        for (const apt of data.appointments) {
            // Get the appointment to update
            const { data: appointment, error: getError } = await supabaseAdmin
                .from('appointments')
                .select('*')
                .eq('id', apt.id)
                .single();
                
            if (getError || !appointment) {
                console.error(`Appointment ${apt.id} not found`);
                continue;
            }
            
            // Update the appointment time
            const { data: updatedApt, error: updateError } = await supabaseAdmin
                .from('appointments')
                .update({
                    time: apt.newTime,
                    updated_at: new Date().toISOString(),
                    updated_by: userId
                })
                .eq('id', apt.id)
                .select()
                .single();
                
            if (updateError) {
                console.error(`Failed to update appointment ${apt.id}: ${updateError.message}`);
                continue;
            }
            
            // Get patient details for the change record
            const { data: patient, error: patientError } = await supabaseAdmin
                .from('patients')
                .select('name')
                .eq('id', appointment.patient_id)
                .single();
                
            // Add to the changes list
            changes.push({
                appointment_id: apt.id,
                patient_id: appointment.patient_id,
                patient_name: patient?.name || "Unknown Patient",
                old_time: apt.oldTime,
                new_time: apt.newTime,
                date: appointment.date
            });
        }
        
        return { changes, insights: 0 };
    } catch (error) {
        console.error('Error applying scheduling insight:', error);
        throw new Error(`Failed to apply scheduling insight: ${error.message}`);
    }
};

/**
 * Implementation for applying inventory insights
 */
const applyInventoryInsight = async (insight, userId) => {
    try {
        const changes = [];
        const data = insight.data;
        
        // Make sure we have valid data to work with
        if (!data || !data.itemsToRestock || !Array.isArray(data.itemsToRestock)) {
            return { changes: [], insights: 0 };
        }
        
        // Create a purchase order
        const { data: purchaseOrder, error: poError } = await supabaseAdmin
            .from('purchase_orders')
            .insert({
                order_date: new Date().toISOString().split('T')[0],
                expected_delivery: data.suggestedDate,
                total_amount: data.totalCost,
                status: 'pending',
                created_by: userId,
                notes: `Generated from inventory insight ${insight.id}`
            })
            .select()
            .single();
            
        if (poError) {
            throw new Error(`Failed to create purchase order: ${poError.message}`);
        }
        
        // Add items to the purchase order
        for (const item of data.itemsToRestock) {
            const orderQuantity = item.suggestedStock - item.currentStock;
            const totalPrice = orderQuantity * item.unitPrice;
            
            // Skip items that don't need ordering
            if (orderQuantity <= 0) continue;
            
            // Add the item to the purchase order
            const { error: itemError } = await supabaseAdmin
                .from('purchase_order_items')
                .insert({
                    purchase_order_id: purchaseOrder.id,
                    inventory_item_id: item.id,
                    quantity: orderQuantity,
                    unit_price: item.unitPrice,
                    total_price: totalPrice
                });
                
            if (itemError) {
                console.error(`Failed to add item ${item.id} to purchase order: ${itemError.message}`);
                continue;
            }
            
            // Add to the changes list
            changes.push({
                item_id: item.id,
                item_name: item.name,
                quantity: orderQuantity,
                unit_price: item.unitPrice,
                total_price: totalPrice
            });
        }
        
        // Add a record of the purchase order creation
        changes.unshift({
            action: 'create_order',
            purchase_order_id: purchaseOrder.id,
            items_count: changes.length,
            total_amount: data.totalCost,
            expected_delivery: data.suggestedDate
        });
        
        return { changes, insights: 0 };
    } catch (error) {
        console.error('Error applying inventory insight:', error);
        throw new Error(`Failed to apply inventory insight: ${error.message}`);
    }
};

/**
 * Implementation for applying revenue insights
 */
const applyRevenueInsight = async (insight, userId) => {
    try {
        const changes = [];
        const data = insight.data;
        
        // Make sure we have valid data to work with
        if (!data) {
            return { changes: [], insights: 0 };
        }
        
        // Process price changes if available
        if (data.priceChanges && Array.isArray(data.priceChanges)) {
            for (const priceChange of data.priceChanges) {
                // In a real implementation, you would update service prices in your database
                // For this example, we'll just record the changes
                changes.push({
                    service_name: priceChange.serviceName,
                    old_price: priceChange.currentPrice,
                    new_price: priceChange.suggestedPrice,
                    potential_revenue: priceChange.potentialRevenue
                });
            }
        }
        
        // Process billing campaign if available
        if (data.billingCampaign) {
            // Create the campaign in the database
            const { data: campaign, error: campaignError } = await supabaseAdmin
                .from('campaigns')
                .insert({
                    name: data.billingCampaign.name,
                    type: 'billing',
                    status: 'draft',
                    target_count: data.billingCampaign.targetPatients,
                    created_by: userId
                })
                .select()
                .single();
                
            if (campaignError) {
                console.error(`Failed to create campaign: ${campaignError.message}`);
            } else {
                // Add to changes
                changes.push({
                    campaign_id: campaign.id,
                    campaign_name: data.billingCampaign.name,
                    target_count: data.billingCampaign.targetPatients,
                    expected_revenue: data.billingCampaign.expectedRevenue
                });
            }
        }
        
        return { changes, insights: 0 };
    } catch (error) {
        console.error('Error applying revenue insight:', error);
        throw new Error(`Failed to apply revenue insight: ${error.message}`);
    }
};

/**
 * Implementation for applying patient insights
 */
const applyPatientInsight = async (insight, userId) => {
    try {
        const changes = [];
        const data = insight.data;
        
        // Make sure we have valid data to work with
        if (!data) {
            return { changes: [], insights: 0 };
        }
        
        // Process follow-ups
        if (data.followUps && Array.isArray(data.followUps)) {
            for (const followUp of data.followUps) {
                // Create an appointment for the follow-up
                const { data: appointment, error: apptError } = await supabaseAdmin
                    .from('appointments')
                    .insert({
                        patient_id: followUp.id,
                        date: followUp.suggestedDate,
                        time: '10:00', // Default time as example
                        type: 'follow-up',
                        notes: `Follow-up appointment for ${followUp.reason}`,
                        status: 'pending',
                        created_by: userId
                    })
                    .select()
                    .single();
                    
                if (apptError) {
                    console.error(`Failed to create follow-up appointment: ${apptError.message}`);
                    continue;
                }
                
                // Add to changes
                changes.push({
                    appointment_id: appointment.id,
                    patient_id: followUp.id,
                    patient_name: followUp.name,
                    reason: followUp.reason,
                    date: followUp.suggestedDate,
                    type: 'follow-up'
                });
            }
        }
        
        // Process health check reminders
        if (data.healthCheckReminders && Array.isArray(data.healthCheckReminders)) {
            for (const reminder of data.healthCheckReminders) {
                // Create a health reminder in the database
                const { data: healthReminder, error: reminderError } = await supabaseAdmin
                    .from('health_reminders')
                    .insert({
                        patient_id: reminder.id,
                        reminder_type: reminder.checkType,
                        due_date: reminder.dueDate,
                        status: 'pending'
                    })
                    .select()
                    .single();
                    
                if (reminderError) {
                    console.error(`Failed to create health reminder: ${reminderError.message}`);
                    continue;
                }
                
                // Add to changes
                changes.push({
                    reminder_id: healthReminder.id,
                    patient_id: reminder.id,
                    patient_name: reminder.name,
                    check_type: reminder.checkType,
                    due_date: reminder.dueDate
                });
            }
        }
        
        return { changes, insights: 0 };
    } catch (error) {
        console.error('Error applying patient insight:', error);
        throw new Error(`Failed to apply patient insight: ${error.message}`);
    }
};

module.exports = {
    getInsights,
    getInsightById,
    getInsightStats,
    applyInsight,
    dismissInsight,
    generateInsights,
};