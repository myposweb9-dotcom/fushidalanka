# FushidaLanka - Hardware Shop Admin Management

## Overview
Convert the admin dashboard to hardware shop management interface by ensuring all product-related functionality is properly configured.

## Tasks

### 1. Update User Routes (routes/user.js)
- [ ] Remove all product-related routes (/products/*)
- [ ] Update dashboard route to remove product data fetching
- [ ] Keep only authentication and profile routes

### 2. Update Dashboard View (views/user/dashboard.ejs)
- [ ] Remove product stats cards (Total Products, Active Products, Pending Review)
- [ ] Remove "My Products" section and product table
- [ ] Remove "Add Product" modal
- [ ] Replace with FushidaLanka-focused content:
  - Company information cards
  - Services overview
  - Recent news/updates
  - Quick links to company pages

### 3. Update Navigation and Links
- [ ] Check and update any navigation menus that link to product pages
- [ ] Update quick action buttons to FushidaLanka-relevant actions

### 4. Testing
- [ ] Test dashboard loads without errors
- [ ] Verify user authentication still works
- [ ] Check that no product-related functionality remains accessible

## Implementation Order
1. Update routes/user.js first
2. Update views/user/dashboard.ejs
3. Update any navigation components
4. Test the changes
