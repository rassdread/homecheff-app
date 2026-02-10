const testDeliverySignup = async () => {
  const testData = {
    name: "Test Bezorger",
    email: `test.bezorger.${Date.now()}@homecheff.eu`,
    password: "test123456",
    username: `test_bezorger_${Date.now()}`,
    age: 16,
    transportation: ["BIKE", "WALKING"],
    maxDistance: 3,
    availableDays: ["maandag", "dinsdag", "woensdag"],
    availableTimeSlots: ["afternoon", "evening"],
    bio: "Test bio voor bezorger account"
  };

  try {
    console.log('🧪 Testing delivery signup API...');
    console.log('📝 Test data:', JSON.stringify(testData, null, 2));

    const response = await fetch('http://localhost:3000/api/delivery/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success!');
      console.log('📊 Response:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Error!');
      console.log('🚨 Status:', response.status);
      console.log('📝 Error response:', JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('💥 Test failed:', error);
  }
};

testDeliverySignup();


