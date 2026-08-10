(() => {
  const values = {
    "emergency-repair": "Emergency Roof Repair",
    "flat-roof-inspection": "Flat Roof Inspection",
    "roof-repair": "Roof Repair",
    "roof-coating": "Roof Coating or Restoration",
    "roof-replacement": "Commercial Roof Replacement",
    "service-agreement": "Service Agreement",
    "not-sure": "Not Sure Yet",
  };
  const request = new URLSearchParams(location.search).get("service");
  if (request && values[request]) {
    document.querySelectorAll('select[name="serviceType"]').forEach((select) => {
      select.value = values[request];
    });
  }
})();
