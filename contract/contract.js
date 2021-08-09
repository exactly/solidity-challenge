const fs = require('fs')
const Web3 = require('../web3')


  const contract = new Web3.eth.Contract(
    JSON.parse(fs.readFileSync('./contract/ABI.json')),
    "0x04c1d2315C62c13B53406EfCeE169099947791DA"
  )
  


module.exports = contract