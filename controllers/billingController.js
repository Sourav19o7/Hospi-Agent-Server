const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all invoices
 * @route   GET /api/billing/invoices
 * @access  Private
 */
const getInvoices = asyncHandler(async (req, res) => {
  const { patient_id, status, start_date, end_date } = req.query;
  
  let query = supabaseAdmin
    .from('invoices')
    .select(`
      *,
      patients(id, name, contact, email)
    `)
    .order('created_at', { ascending: false });
    
  // Filter by patient if provided
  if (patient_id) {
    query = query.eq('patient_id', patient_id);
  }
  
  // Filter by status if provided
  if (status) {
    query = query.eq('status', status);
  }
  
  // Filter by date range if provided
  if (start_date && end_date) {
    query = query
      .gte('invoice_date', start_date)
      .lte('invoice_date', end_date);
  } else if (start_date) {
    query = query.gte('invoice_date', start_date);
  } else if (end_date) {
    query = query.lte('invoice_date', end_date);
  }
  
  const { data: invoices, error } = await query;
  
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  res.status(200).json(invoices);
});

/**
 * @desc    Get invoice by ID
 * @route   GET /api/billing/invoices/:id
 * @access  Private
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      patients(id, name, contact, email, address),
      invoice_items(*)
    `)
    .eq('id', id)
    .single();
    
  if (error || !invoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  
  res.status(200).json(invoice);
});

/**
 * @desc    Create a new invoice
 * @route   POST /api/billing/invoices
 * @access  Private
 */
const createInvoice = asyncHandler(async (req, res) => {
  const {
    patient_id,
    invoice_date,
    items,
    payment_method,
    notes,
    tax_percentage = 18, // Default GST rate
  } = req.body;
  
  // Check for required fields
  if (!patient_id || !invoice_date || !items || items.length === 0) {
    res.status(400);
    throw new Error('Please provide patient, invoice date, and at least one item');
  }
  
  // Check if patient exists
  const { data: patient, error: patientError } = await supabaseAdmin
    .from('patients')
    .select('id')
    .eq('id', patient_id)
    .single();
    
  if (patientError || !patient) {
    res.status(404);
    throw new Error('Patient not found');
  }
  
  // Calculate invoice totals
  const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  const tax_amount = (subtotal * tax_percentage) / 100;
  const total_amount = subtotal + tax_amount;
  
  // Generate invoice number (format: INV-YYYYMMDD-XXXX)
  const dateString = new Date(invoice_date).toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  const invoice_number = `INV-${dateString}-${randomPart}`;
  
  // Create invoice in Supabase
  const { data: invoice, error } = await supabaseAdmin
    .from('invoices')
    .insert([
      {
        patient_id,
        invoice_number,
        invoice_date,
        subtotal,
        tax_percentage,
        tax_amount,
        total_amount,
        payment_method: payment_method || 'Cash',
        status: 'pending',
        notes: notes || null,
      },
    ])
    .select()
    .single();
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  // Create invoice items
  const invoiceItems = items.map(item => ({
    invoice_id: invoice.id,
    description: item.description,
    quantity: item.quantity,
    rate: item.rate,
    amount: item.quantity * item.rate,
  }));
  
  const { error: itemsError } = await supabaseAdmin
    .from('invoice_items')
    .insert(invoiceItems);
    
  if (itemsError) {
    // Rollback invoice creation
    await supabaseAdmin
      .from('invoices')
      .delete()
      .eq('id', invoice.id);
    
    res.status(400);
    throw new Error(itemsError.message);
  }
  
  // Get complete invoice with items
  const { data: completeInvoice, error: fetchError } = await supabaseAdmin
    .from('invoices')
    .select(`
      *,
      patients(id, name, contact, email),
      invoice_items(*)
    `)
    .eq('id', invoice.id)
    .single();
    
  res.status(201).json(completeInvoice);
});

/**
 * @desc    Update invoice status
 * @route   PUT /api/billing/invoices/:id/status
 * @access  Private
 */
const updateInvoiceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  // Check for required fields
  if (!status) {
    res.status(400);
    throw new Error('Please provide status');
  }
  
  // Check if invoice exists
  const { data: existingInvoice, error: existingError } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .eq('id', id)
    .single();
    
  if (existingError || !existingInvoice) {
    res.status(404);
    throw new Error('Invoice not found');
  }
  
  // Update invoice status in Supabase
  const { data: updatedInvoice, error } = await supabaseAdmin
    .from('invoices')
    .update({ 
      status, 
      payment_date: status === 'paid' ? new Date().toISOString() : null 
    })
    .eq('id', id)
    .select()
    .single();
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  res.status(200).json(updatedInvoice);
});

/**
 * @desc    Get payment analytics
 * @route   GET /api/billing/analytics
 * @access  Private
 */
const getPaymentAnalytics = asyncHandler(async (req, res) => {
  const { period, start_date, end_date } = req.query;
  
  let timeFilter;
  
  if (start_date && end_date) {
    timeFilter = `invoice_date.gte.${start_date},invoice_date.lte.${end_date}`;
  } else if (period === 'today') {
    const today = new Date().toISOString().split('T')[0];
    timeFilter = `invoice_date.eq.${today}`;
  } else if (period === 'week') {
    const today = new Date();
    const lastWeek = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
    const currentDate = new Date().toISOString().split('T')[0];
    timeFilter = `invoice_date.gte.${lastWeek},invoice_date.lte.${currentDate}`;
  } else if (period === 'month') {
    const today = new Date();
    const lastMonth = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
    const currentDate = new Date().toISOString().split('T')[0];
    timeFilter = `invoice_date.gte.${lastMonth},invoice_date.lte.${currentDate}`;
  } else if (period === 'year') {
    const today = new Date();
    const lastYear = new Date(today.setFullYear(today.getFullYear() - 1)).toISOString().split('T')[0];
    const currentDate = new Date().toISOString().split('T')[0];
    timeFilter = `invoice_date.gte.${lastYear},invoice_date.lte.${currentDate}`;
  }
  
  // Get all invoices for the period
  const { data: invoices, error } = await supabaseAdmin
    .from('invoices')
    .select('*')
    .or(timeFilter ? timeFilter : '');
    
  if (error) {
    res.status(400);
    throw new Error(error.message);
  }
  
  // Calculate analytics
  const totalRevenue = invoices.reduce((sum, invoice) => sum + (invoice.status === 'paid' ? invoice.total_amount : 0), 0);
  const pendingAmount = invoices.reduce((sum, invoice) => sum + (invoice.status === 'pending' ? invoice.total_amount : 0), 0);
  const paidInvoices = invoices.filter(invoice => invoice.status === 'paid').length;
  const pendingInvoices = invoices.filter(invoice => invoice.status === 'pending').length;
  
  // Group by payment method (for paid invoices)
  const paymentMethodsData = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((acc, invoice) => {
      const method = invoice.payment_method || 'Other';
      acc[method] = (acc[method] || 0) + invoice.total_amount;
      return acc;
    }, {});
  
  // Convert to array format for charts
  const paymentMethods = Object.entries(paymentMethodsData).map(([name, value]) => ({
    name,
    value,
  }));
  
  // Calculate monthly revenue for charts
  const monthlyRevenue = invoices
    .filter(invoice => invoice.status === 'paid')
    .reduce((acc, invoice) => {
      const month = invoice.invoice_date.substring(0, 7); // Format: YYYY-MM
      acc[month] = (acc[month] || 0) + invoice.total_amount;
      return acc;
    }, {});
  
  // Convert to array format for charts
  const revenueByMonth = Object.entries(monthlyRevenue).map(([month, revenue]) => {
    // Format month for display (convert YYYY-MM to MMM)
    const date = new Date(month + '-01');
    const formattedMonth = date.toLocaleString('default', { month: 'short' });
    
    return {
      month: formattedMonth,
      revenue,
    };
  });
  
  res.status(200).json({
    totalRevenue,
    pendingAmount,
    paidInvoices,
    pendingInvoices,
    paymentMethods,
    revenueByMonth,
  });
});

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  getPaymentAnalytics,
};