const smartcar = require('smartcar');

const smartcarClient = new smartcar.AuthClient({
   clientId: "dc0f0278-80d5-42c2-aa43-d0dc0bab588b",
   clientSecret: "47af6451-4e18-4ff2-920d-771123499182",
   redirectUri: 'https://smartcarapi.propostadidatica.pt/api/callback'
});

export default smartcarClient