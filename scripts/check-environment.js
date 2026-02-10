console.log('🔍 Environment Check\n');
console.log('NODE_ENV:', process.env.NODE_ENV || 'niet ingesteld');
console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL || 'niet ingesteld');
console.log('NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET ? '✅ Ingesteld' : '❌ Niet ingesteld');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Ingesteld' : '❌ Niet ingesteld');

console.log('\n💡 Tips voor lokale development:');
console.log('1. Zorg dat NEXTAUTH_URL=http://localhost:3000 (of je lokale poort)');
console.log('2. Zorg dat DATABASE_URL naar je lokale database wijst');
console.log('3. Herstart de dev server na het aanpassen van .env.local');
console.log('4. Check of je dezelfde database gebruikt als productie (of een kopie)');


















