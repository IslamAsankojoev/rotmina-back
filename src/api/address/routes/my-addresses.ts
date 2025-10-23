export default {
  routes: [
    {
      method: 'POST',
      path: '/addresses/add-address',
      handler: 'address.addAddress',
    },
    {
      method: 'GET',
      path: '/my-addresses',
      handler: 'address.findMyAddresses',
    },
  ],
};