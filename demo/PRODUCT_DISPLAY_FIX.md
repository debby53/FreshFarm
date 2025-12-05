# Fix: Buyers Cannot See Products

## Problem
Farmers can add products successfully, but buyers see empty marketplace.

## Root Causes Identified
1. **Database Schema Issue**: The `status` column might not exist in the `products` table
2. **Query Filtering**: The repository query might be filtering out products incorrectly
3. **Null Status Handling**: Products without status set might be excluded

## Fixes Applied

### 1. Backend - Repository Query Fix
- Added `left join fetch` to ensure farmer data is loaded
- Improved null status handling in query
- Added fallback for products without status

### 2. Backend - ProductResponse Enhancement
- Added `farmerLocation` field to ProductResponse
- Updated service to include farmer location in response

### 3. Backend - Error Handling
- Added try-catch in controller to prevent crashes
- Added debug endpoint: `GET /api/products/debug/all`

### 4. Frontend - Error Handling
- Added console logging for debugging
- Added error display UI
- Added retry functionality
- Added debug endpoint test button

## Critical Step: Run Database Migration

**YOU MUST RUN THIS SQL FIRST:**

```sql
-- Connect to PostgreSQL and run:
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(30);
UPDATE products SET status = 'IN_STOCK' WHERE status IS NULL;
```

## Testing Steps

1. **Check Database**:
   ```sql
   SELECT product_id, product_name, status, available FROM products;
   ```
   - Verify products exist
   - Verify status column exists
   - Verify status is set (not null)

2. **Test Backend API**:
   - Open browser: `http://localhost:8080/api/products`
   - Should return JSON array of products
   - Check browser console for errors

3. **Test Debug Endpoint**:
   - Open: `http://localhost:8080/api/products/debug/all`
   - Should show total count and all products

4. **Test Frontend**:
   - Open browser console (F12)
   - Navigate to marketplace page
   - Check console logs:
     - "Fetching products with params: ..."
     - "Products received: ..."
   - Check Network tab for `/api/products` request
   - Verify response status is 200
   - Verify response contains products array

## Common Issues & Solutions

### Issue 1: "column status does not exist"
**Solution**: Run the SQL migration above

### Issue 2: Empty array returned
**Check**:
- Are products actually in database?
- Is status column set?
- Check backend logs for errors

### Issue 3: CORS errors
**Solution**: Already configured in SecurityConfig, but verify:
- Frontend URL matches `spring.mvc.cors.allowed-origins`
- Backend is running on port 8080

### Issue 4: 401 Unauthorized
**Solution**: Products endpoint should be public (check SecurityConfig)

## Verification Checklist

- [ ] Database has products
- [ ] Status column exists and has values
- [ ] Backend API returns products when tested directly
- [ ] Frontend console shows products being fetched
- [ ] Network tab shows successful API call
- [ ] Products display on marketplace page

## Next Steps if Still Not Working

1. Check backend logs for SQL errors
2. Verify `Product` entity matches database schema
3. Test with Postman/curl:
   ```bash
   curl http://localhost:8080/api/products
   ```
4. Check if products have `farmer` relationship set
5. Verify Hibernate is creating correct queries (check logs)

