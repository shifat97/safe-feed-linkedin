// Default keywords for India
const defaultIndiaKeywords = [
  "India", "Indian", "Indians", "Mumbai", "Delhi", "Bangalore", "Bengaluru",
  "Hyderabad", "Ahmedabad", "Chennai", "Kolkata", "Surat", "Pune", "Jaipur",
  "Lucknow", "Nagpur", "Indore", "Thane", "Bhopal", "Visakhapatnam", "Patna",
  "Vadodara", "Ghaziabad", "Ludhiana", "Agra", "Nashik", "Faridabad", "Meerut",
  "Rajkot", "Kalyan", "Dombivli", "Vasai", "Virar", "Varanasi", "Srinagar",
  "Aurangabad", "Dhanbad", "Amritsar", "Navi Mumbai", "Allahabad", "Howrah",
  "Ranchi", "Gwalior", "Jabalpur", "Coimbatore", "Vijayawada", "Madurai",
  "Raipur", "Kota", "Guwahati", "Chandigarh", "Noida", "Gurgaon", "Gurugram",
  "Bhubaneswar", "Trivandrum", "Kochi", "Kerala", "Tamilnadu", "Tamil Nadu",
  "Karnataka", "Maharashtra", "Gujarat", "Rajasthan", "Uttar Pradesh",
  "Madhya Pradesh", "Bihar", "West Bengal", "Andhra Pradesh", "Telangana",
  "Punjab", "Haryana", "Odisha", "Assam", "Jharkhand", "Chhattisgarh",
  "Uttarakhand", "Himachal", "Goa", "Kashmir", "Dehradun", "Rourkela",
  "Bhubaneshwar", "Mysore", "Mangalore", "Bhiwandi", "Tiruppur", "Salem",
  "IIT", "BITS Pilani", "NIT", "IIM", "Delhi University", "DTU", "VIT", "SRM",
  "Manipal", "Amity", "LPU", "Kiit", "Thapar", "IIIT", "TCS", "Infosys",
  "Wipro", "Cognizant", "Tata Consultancy", "HCL", "Tech Mahindra",
  "Accenture India", "Capgemini India", "Reliance", "Jio", "Adani", "Paytm",
  "Flipkart", "Ola", "Zomato", "Swiggy"
];

// Default keywords for Pakistan
const defaultPakistanKeywords = [
  "Pakistan", "Pakistani", "Pakistanis", "Karachi", "Lahore", "Faisalabad",
  "Rawalpindi", "Gujranwala", "Peshawar", "Multan", "Islamabad", "Quetta",
  "Bahawalpur", "Sargodha", "Sialkot", "Sukkur", "Larkana", "Sheikhupura",
  "Jhang", "Rahim Yar Khan", "Gujrat", "Mardan", "Kasur", "Dera Ghazi Khan",
  "Sindh", "Balochistan", "Khyber Pakhtunkhwa", "KPK", "Gilgit", "Baltistan",
  "Azad Kashmir", "Mirpur", "Peshawari", "Lahori",
  "NUST", "FAST-NUCES", "FAST NUCES", "FAST University", "LUMS", "UET", "GIKI",
  "COMSATS", "PU", "KU", "NED", "Systems Limited", "Systems Ltd",
  "Arbisoft", "10Pearls", "Contour Software", "NetSol", "Devsinc", "Folio3",
  "TRG", "PTCL"
];

chrome.runtime.onInstalled.addListener(() => {
  // Seed initial settings if they don't exist yet
  chrome.storage.local.get(['indiaKeywords'], (res) => {
    if (!res.indiaKeywords) {
      chrome.storage.local.set({
        extensionEnabled: true,
        filterIndiaEnabled: true,
        filterPakistanEnabled: true,
        indiaKeywords: defaultIndiaKeywords,
        pakistanKeywords: defaultPakistanKeywords,
        customKeywords: [],
        blockedCount: 0,
        blockedStats: {},
        recentBlockedUrns: []
      }, () => {
        console.log("Safe Feed LinkedIn extension initialized successfully.");
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "resetToDefaults") {
    chrome.storage.local.set({
      extensionEnabled: true,
      filterIndiaEnabled: true,
      filterPakistanEnabled: true,
      indiaKeywords: defaultIndiaKeywords,
      pakistanKeywords: defaultPakistanKeywords,
      customKeywords: [],
      blockedCount: 0,
      blockedStats: {},
      recentBlockedUrns: []
    }, () => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open
  }
});
