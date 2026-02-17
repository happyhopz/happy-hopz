import { isTestUser } from './middleware/auth';

const tests = [
    { email: 'user@test.com', expected: true },
    { email: 'realuser@gmail.com', expected: false },
    { email: 'test@example.com', expected: true },
    { email: 'lovable-test@lovable.dev', expected: true },
    { email: 'test.johndoe@gmail.com', expected: true },
    { email: 'testuser123@yahoo.com', expected: true },
    { email: 'happyhopz308@gmail.com', expected: false }, // Admin
];

console.log('🧪 Verifying isTestUser logic...');

let passed = 0;
tests.forEach(({ email, expected }) => {
    const result = isTestUser(email);
    const status = result === expected ? '✅' : '❌';
    console.log(`${status} ${email.padEnd(30)} | Result: ${result} | Expected: ${expected}`);
    if (result === expected) passed++;
});

console.log(`\n📊 Results: ${passed}/${tests.length} passed.`);
if (passed !== tests.length) {
    process.exit(1);
}
