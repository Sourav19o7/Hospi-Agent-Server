const asyncHandler = require('express-async-handler');
const { supabaseAdmin } = require('../config/supabase');

/**
 * @desc    Get all inventory items
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventoryItems = asyncHandler(async (req, res) => {
    const { search, category, status } = req.query;

    let query = supabaseAdmin
        .from('inventory')
        .select('*')
        .order('name', { ascending: true });

    // Filter by search term if provided
    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    // Filter by category if provided
    if (category) {
        query = query.eq('category', category);
    }

    // Filter by status if provided
    if (status) {
        query = query.eq('status', status);
    }

    const { data: items, error } = await query;

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    // Calculate status based on stock and threshold
    const itemsWithStatus = items.map(item => {
        let calculatedStatus = 'in-stock';

        if (item.stock <= 0) {
            calculatedStatus = 'out-of-stock';
        } else if (item.stock <= item.threshold * 0.25) {
            calculatedStatus = 'critical';
        } else if (item.stock <= item.threshold) {
            calculatedStatus = 'low-stock';
        }

        return { ...item, status: calculatedStatus };
    });

    res.status(200).json(itemsWithStatus);
});

/**
 * @desc    Get inventory item by ID
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryItemById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { data: item, error } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !item) {
        res.status(404);
        throw new Error('Inventory item not found');
    }

    // Calculate status based on stock and threshold
    let status = 'in-stock';

    if (item.stock <= 0) {
        status = 'out-of-stock';
    } else if (item.stock <= item.threshold * 0.25) {
        status = 'critical';
    } else if (item.stock <= item.threshold) {
        status = 'low-stock';
    }

    res.status(200).json({ ...item, status });
});

/**
 * @desc    Get inventory alerts (low stock items)
 * @route   GET /api/inventory/alerts
 * @access  Private
 */
const getInventoryAlerts = asyncHandler(async (req, res) => {
    // Fetch all inventory items first
    const { data: inventoryItems, error } = await supabaseAdmin
      .from('inventory')
      .select('*')
      .order('stock', { ascending: true });
      
    if (error) {
      res.status(400);
      throw new Error(error.message);
    }
    
    // Filter items where stock <= threshold using JavaScript
    const items = inventoryItems.filter(item => item.stock <= item.threshold);
    
    // Calculate status and add percentage
    const itemsWithStatus = items.map(item => {
      let status = 'low-stock';
      
      if (item.stock <= 0) {
        status = 'out-of-stock';
      } else if (item.stock <= item.threshold * 0.25) {
        status = 'critical';
      }
      
      const percentage = item.threshold > 0 ? Math.round((item.stock / item.threshold) * 100) : 0;
      
      return { ...item, status, percentage };
    });
    
    res.status(200).json(itemsWithStatus);
  });

/**
 * @desc    Create a new inventory item
 * @route   POST /api/inventory
 * @access  Private
 */
const createInventoryItem = asyncHandler(async (req, res) => {
    const {
        name,
        category,
        stock,
        threshold,
        unit_price,
        expiry_date,
        supplier,
        description,
    } = req.body;

    // Check for required fields
    if (!name || stock === undefined || threshold === undefined) {
        res.status(400);
        throw new Error('Please provide name, stock and threshold');
    }

    // Create inventory item in Supabase
    const { data, error } = await supabaseAdmin
        .from('inventory')
        .insert([
            {
                name,
                category: category || 'Other',
                stock,
                threshold,
                unit_price: unit_price || 0,
                expiry_date: expiry_date || null,
                supplier: supplier || null,
                description: description || null,
            },
        ])
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(201).json(data);
});

/**
 * @desc    Update an inventory item
 * @route   PUT /api/inventory/:id
 * @access  Private
 */
const updateInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const {
        name,
        category,
        stock,
        threshold,
        unit_price,
        expiry_date,
        supplier,
        description,
    } = req.body;

    // Check if item exists
    const { data: existingItem, error: existingError } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

    if (existingError || !existingItem) {
        res.status(404);
        throw new Error('Inventory item not found');
    }

    // Prepare update data
    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (stock !== undefined) updateData.stock = stock;
    if (threshold !== undefined) updateData.threshold = threshold;
    if (unit_price !== undefined) updateData.unit_price = unit_price;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (supplier !== undefined) updateData.supplier = supplier;
    if (description !== undefined) updateData.description = description;

    // Update inventory item in Supabase
    const { data: updatedItem, error } = await supabaseAdmin
        .from('inventory')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(200).json(updatedItem);
});

/**
 * @desc    Update inventory stock
 * @route   PUT /api/inventory/:id/stock
 * @access  Private
 */
const updateInventoryStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, operation = 'add' } = req.body;

    // Check for required fields
    if (quantity === undefined) {
        res.status(400);
        throw new Error('Please provide quantity');
    }

    // Check if item exists
    const { data: existingItem, error: existingError } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

    if (existingError || !existingItem) {
        res.status(404);
        throw new Error('Inventory item not found');
    }

    // Calculate new stock
    let newStock;

    if (operation === 'add') {
        newStock = existingItem.stock + quantity;
    } else if (operation === 'subtract') {
        newStock = existingItem.stock - quantity;

        // Prevent negative stock
        if (newStock < 0) {
            res.status(400);
            throw new Error('Cannot reduce stock below zero');
        }
    } else {
        res.status(400);
        throw new Error('Invalid operation. Use "add" or "subtract"');
    }

    // Update inventory stock in Supabase
    const { data: updatedItem, error } = await supabaseAdmin
        .from('inventory')
        .update({ stock: newStock })
        .eq('id', id)
        .select()
        .single();

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(200).json(updatedItem);
});

/**
 * @desc    Delete an inventory item
 * @route   DELETE /api/inventory/:id
 * @access  Private
 */
const deleteInventoryItem = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Check if item exists
    const { data: existingItem, error: existingError } = await supabaseAdmin
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

    if (existingError || !existingItem) {
        res.status(404);
        throw new Error('Inventory item not found');
    }

    // Delete inventory item from Supabase
    const { error } = await supabaseAdmin
        .from('inventory')
        .delete()
        .eq('id', id);

    if (error) {
        res.status(400);
        throw new Error(error.message);
    }

    res.status(200).json({ message: 'Inventory item removed' });
});

module.exports = {
    getInventoryItems,
    getInventoryItemById,
    getInventoryAlerts,
    createInventoryItem,
    updateInventoryItem,
    updateInventoryStock,
    deleteInventoryItem,
};