// Test file to check FormData behavior
const testFormData = () => {
  const f = new FormData();
  f.append('test', 'value');
  console.log('FormData works!', f);
};

testFormData();
