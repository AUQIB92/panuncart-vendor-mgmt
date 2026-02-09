/**
 * Test the Shopify Token API Endpoint
 */

async function testShopifyTokenAPI() {
  console.log('🛍️  TESTING SHOPIFY TOKEN API ENDPOINT');
  console.log('=====================================\n');
  
  // Test 1: Check token status (GET request)
  console.log('1️⃣ Checking token status...');
  try {
    const getStatus = await fetch('http://localhost:3000/api/shopify/test-token', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    const statusData = await getStatus.json();
    console.log('Token Status:', statusData);
    
  } catch (error) {
    console.log('❌ GET request failed:', error.message);
  }
  
  // Test 2: Test product listing (POST request)
  console.log('\n2️⃣ Testing product listing...');
  try {
    const listProducts = await fetch('http://localhost:3000/api/shopify/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        create_product: false // Just list existing products
      })
    });
    
    const listData = await listProducts.json();
    console.log('Product Listing Result:', listData);
    
    if (listData.success) {
      console.log('✅ Product listing successful!');
      console.log('Products found:', listData.products_found);
      console.log('Sample products:', listData.sample_products);
    } else {
      console.log('❌ Product listing failed:', listData.error);
      if (listData.oauth_required) {
        console.log('🔧 OAuth required. Install URL:');
        console.log(listData.install_url);
      }
    }
    
  } catch (error) {
    console.log('❌ POST request failed:', error.message);
  }
  
  // Test 3: Test product creation (POST request with create flag)
  console.log('\n3️⃣ Testing product creation...');
  try {
    const createProduct = await fetch('http://localhost:3000/api/shopify/test-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        create_product: true,
        title: "API Test Product",
        description: "Created via API endpoint test",
        price: "49.99",
        sku: `API-TEST-${Date.now()}`
      })
    });
    
    const createData = await createProduct.json();
    console.log('Product Creation Result:', createData);
    
    if (createData.success) {
      console.log('✅ Product created successfully!');
      console.log('New product ID:', createData.new_product?.id);
    }
    
  } catch (error) {
    console.log('❌ Product creation failed:', error.message);
  }
  
  console.log('\n🎯 API endpoint is ready for testing!');
  console.log('Make sure your development server is running on port 3000');
}

// Run the test
testShopifyTokenAPI();
