fetch("http://localhost:3003/api/fee-management/installment-plans?month=2026-06&sessionId=1&classId=all&programId=all&sectionId=all")
  .then(r => r.json())
  .then(data => {
    console.log(JSON.stringify(data).slice(0, 1000));
  })
  .catch(console.error);
