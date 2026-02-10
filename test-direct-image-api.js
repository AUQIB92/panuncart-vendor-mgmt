/**
 * Direct API Test for Multiple Image Upload
 * Tests the actual implementation through the API endpoint
 */

require('dotenv').config({ path: '.env.local' });

async function testDirectImageUpload() {
  console.log('🖼️  DIRECT IMAGE UPLOAD TEST');
  console.log('============================\n');
  
  try {
    // Test the actual API endpoint that handles image uploads
    console.log('🔧 Testing /api/shopify/upload-image endpoint...');
    
    // Create a simple test image buffer (1x1 pixel JPEG)
    const imageBuffer = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgMCAgMDAwMEAwMEBQgFBAQE\nBQoHBwYIDAoMDAsKCwsNDhIQDQ4RDgsLEBYQERMUFRUVDA8XGBYUGBIUFRT/\n2wBDAQMEBAUEBQkFBQkUDQsNFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQU\nFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBT/wAARCAABAAEDAREAAhEBAxEB/8QA\nHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUF\nBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkK\nFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1\ndnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXG\nx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEB\nAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAEC\nAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRom\nJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOE\nhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU\n1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD+f+iiigD/\n2Q==', 'base64');
    
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });
    formData.append('image', blob, 'test-image.jpg');
    
    console.log('📤 Sending test image to upload endpoint...');
    
    const response = await fetch('http://localhost:3000/api/shopify/upload-image', {
      method: 'POST',
      body: formData,
    });
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Upload endpoint responded successfully');
      console.log('Response:', JSON.stringify(data, null, 2));
      
      if (data.success && data.cdnUrl) {
        console.log('\n🎉 IMAGE UPLOAD ENDPOINT WORKING CORRECTLY');
        console.log('✅ Test image uploaded to Shopify CDN');
        console.log('📦 CDN URL:', data.cdnUrl);
        console.log('\nThe multiple image upload fix should now work properly!');
        return true;
      } else {
        console.log('❌ Upload failed:', data.error || 'Unknown error');
        return false;
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Upload endpoint failed');
      console.log('Status:', response.status);
      console.log('Response:', errorText);
      return false;
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure your Next.js development server is running on port 3000');
      console.log('   Run: npm run dev');
    }
    return false;
  }
}

// Run the test
if (require.main === module) {
  testDirectImageUpload()
    .then(success => {
      console.log('\n' + '='.repeat(50));
      if (success) {
        console.log('✅ DIRECT API TEST PASSED');
        console.log('Multiple image upload should now work correctly');
      } else {
        console.log('❌ DIRECT API TEST FAILED');
      }
      console.log('='.repeat(50));
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.log('\n💥 TEST CRASHED:', error.message);
      process.exit(1);
    });
}

module.exports = { testDirectImageUpload };