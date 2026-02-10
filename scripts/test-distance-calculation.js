// Test distance calculation with actual data from database
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

// Test cases from database
const testCases = [
  {
    name: "Rotterdam to Dordrecht (correct)",
    user: { lat: 51.9244, lng: 4.4777 }, // Rotterdam
    product: { lat: 51.8133, lng: 4.6901 }, // Dordrecht
    expected: "~19 km"
  },
  {
    name: "Rotterdam to Dordrecht (corrected DB)",
    user: { lat: 51.9244, lng: 4.4777 }, // Rotterdam
    product: { lat: 51.8133, lng: 4.6901 }, // Corrected Dordrecht in DB
    expected: "~19 km"
  },
  {
    name: "Same coordinates",
    user: { lat: 52.3676, lng: 4.9041 },
    product: { lat: 52.3676, lng: 4.9041 },
    expected: "0 km"
  },
  {
    name: "Rotterdam to Rotterdam",
    user: { lat: 51.9244, lng: 4.4777 },
    product: { lat: 51.9244, lng: 4.4777 },
    expected: "0 km"
  }
];

console.log("Testing distance calculations:\n");

testCases.forEach(test => {
  const distance = calculateDistance(
    test.user.lat, 
    test.user.lng, 
    test.product.lat, 
    test.product.lng
  );
  
  console.log(`${test.name}:`);
  console.log(`  User: (${test.user.lat}, ${test.user.lng})`);
  console.log(`  Product: (${test.product.lat}, ${test.product.lng})`);
  console.log(`  Calculated: ${distance.toFixed(2)} km`);
  console.log(`  Expected: ${test.expected}`);
  console.log(`  Match: ${Math.abs(distance - 0) < 0.01 ? "YES (0 km)" : "NO"}`);
  console.log("");
});

// Test with null/undefined values
console.log("Testing with null values:");
console.log("User location null:", calculateDistance(null, null, 51.9244, 4.4777));
console.log("Product location null:", calculateDistance(51.9244, 4.4777, null, null));
console.log("Both null:", calculateDistance(null, null, null, null));
