const FMS = require('fms-api-client')
const { connect } = require('marpat');
const { getJSDocTags } = require('typescript');
const fs = require('fs');
const path = require('path');

const connection =
	connect('nedb://memory')
	.then(db => {
		const client = FMS.Filemaker.create({
			database: process.env.FM_DATABASE,
			server: process.env.FM_SERVER,
			user: process.env.FM_USER,
			password: process.env.FM_PASSWORD,
		});

		return client.save()
	}).catch((err) => { console.error(err) })

module.exports.verify = async (req, res) => {
	var foundCarriers = req.body?.devices || {}
	var position = req.body?.position || {}
	const start = new Date().getTime()

	if (!foundCarriers.length > 0) {
		return res.status(404).send({message: `There are no carriers to verify`})
	}

	foundCarriers = foundCarriers.map((carrier) => {
		return carrier.replace(/:/g,'').toLowerCase()
	})

	console.log('Carriers', foundCarriers)

	const checkedCarriers = await checkCarriers(foundCarriers, position).catch((err) => {
		console.error('Error checking', err)
		return res.status(400).send({message: `Error verifying the carriers`})
	});
	console.log('checked',checkedCarriers)
	if(!checkedCarriers.errorMessage) {
		const end = new Date().getTime()
		console.log(`Elapsed time: ${(end - start) / 1000} seconds`)
		return res.status(200).send({message: `Successfully registered ${checkedCarriers.length} carriers`, data: checkedCarriers})
	} else if (checkedCarriers.errorMessage) {
		return res.status(500).send({message: checkedCarriers.errorMessage})
	}

	async function checkCarriersDeprecated(items, position) {
		// console.log('Items found in app', items)
		const fms = await connection.catch((err) => {
			console.error('Server issue',err)
			return res.status(500).send({message:'Server issue occurred'})
		})
		var checkedItems = []
		var error = ''
		for (let i = 0; i < items.length; i++) {
			await fms.find('API_Carriers', [{'MacAddress': `==\"${items[i]}\"`}])
			.then(async(result) => {
				console.log('Found result',result)
				if(result.data[0]?.fieldData) {
					let data = {
						macAddress: result.data[0].fieldData.MacAddress,
						serialNumber: result.data[0].fieldData.SerialNumber,
						barCode: result.data[0].fieldData.BarCode,
					}
					let dataRegistration = {
						UUID_Carrier: result.data[0].fieldData.UUID_Carrier,
						LocationLatitude: position?.latitude || 'unknown',
						LocationLongitude: position?.longitude || 'unknown',
						UUID_User: req.session.userId,
						newrecord: 1
					}
					const registration = await registerCarriers(dataRegistration).catch((err) => {
						console.error('Error registering carriers', err)
						return res.status(400).send({message: 'Error registering the carriers'})
					})
	
					if (registration) {
						checkedItems.push(data)
						console.log('Successfull registration ',registration )
					}
				} else{
					console.log("Could not find tag in FileMaker.")		
				}
			})
			.catch((err) => {
				console.error('Error verifying carriers', err)
				error = {message: 'Error verifying carriers', errorMessage: err}
				// return res.status(400).send({message: 'Error'})
			})

		}

		if (error != '') {
			let err = ''
			if (error.errorMessage.code == '802') {
				err = { errorMessage:'Unable to connect to database' }
			} else {
				err = {errorMessage: 'Something went wrong' }
			}
			fms.logout()
			return err
		}
		const locationScript = await fms.script('API_Registrations','set_location_carrier').catch((err) => {
			console.error('Error triggering location script', err)
		})
		if (locationScript?.scriptError != '0') {
			console.error(locationScript)
		}
		const sortedItems = checkedItems.sort((a, b) => {
			return a.barCode.localeCompare(b.barCode)
		});
		return sortedItems
	}

	async function checkCarriers(items, position) {	
		const macAddressesPath = path.join(__dirname, '..', '..', 'mac_addresses.json');
		const macAddresses = JSON.parse(fs.readFileSync(macAddressesPath));
	  
		const checkedItems = [];
		const notFoundItems = [];
	  
		for (let i = 0; i < items.length; i++) {
		  if (items[i] in macAddresses) {
			console.log("item found!",macAddresses[items[i]])
			const data = {
			  macAddress: items[i],
			  barCode: macAddresses[items[i]].barcode
			};
			const dataRegistration = {
			  UUID_Carrier: macAddresses[items[i]].uuid,
			  LocationLatitude: position?.latitude || 'unknown',
			  LocationLongitude: position?.longitude || 'unknown',
			  UUID_User: req.session.userId,
			  newrecord: 1
			};
			const registration = await registerCarriers(dataRegistration).catch((err) => {
				console.error('Error registering carriers', err)
				return res.status(400).send({message: 'Error registering the carriers'})
			})

			if (registration) {
				checkedItems.push(data)
				console.log('Successful registration ',registration )
			}
		  } else {
			notFoundItems.push(items[i]);
			console.log(`MAC address not found: ${items[i]}`);
		  }
		}
	  
		const sortedItems = checkedItems.sort((a, b) => {
		  return a.barCode.localeCompare(b.barCode);
		});
	  
		return sortedItems;
	}
	
	async function registerCarriers(data) {
		return new Promise(async (resolve, reject) => {
			var successRegistrations = false
			const fms = await connection.catch((err) => {
				console.error('Error connecting to FMS', err)
				return reject(err)
			})
	
			const registeredItem = await fms.create('API_Registrations', data).catch((err) => {
				fms.logout()
				return reject(err)
			})

			if (registeredItem?.recordId != (null || undefined) ) {
				successRegistrations = true
			}
			fms.logout()
			return resolve(successRegistrations)
		})
	}
}

module.exports.getscaninfo = async (req, res) => {
	let timeOut = await getTimeouts()
	let timeout = timeOut[0].fieldData.ScanTime * 1000
	let timeoutLong = timeOut[0].fieldData.ScanTimeEnd
	const tagList = await getTags()
	.catch((err) => {
		console.error('Error ', err)
		return res.status(400).send({message: `Error`})
	});

	async function getTags() {
		return new Promise(async (resolve, reject) => {
			const fms = await connection.catch((err) => {
				console.error('Error connecting to FMS', err)
				return reject(err)
			})
			await fms.list('API_Tags')
			.then((result) => {
				let resultArray = []
					result.data.forEach((item) => {
						if(item['portalData']['Settings_TypeTags_Index'].length > 0){
							let tagObject = {}
							item['portalData']['Settings_TypeTags_Index'].forEach((key) => {
								let index = key['Settings_TypeTags_Index::Index']
								let value = key['Settings_TypeTags_Index::Value']
								if(index !== "" && value !== ""){
									tagObject[index] = parseInt(value,10)
								}
							})
							if(Object.keys(tagObject).length > 0){
								resultArray.push(tagObject)
							}
						}
					})
				fms.logout()
				return resolve(resultArray);
			})
			.catch((err) => {
				fms.logout()
				return reject(err)
			})
			fms.logout()

		})
		.catch((err) => {
			console.log(err)
		})
	}

	async function getTimeouts() {
		return new Promise(async (resolve, reject) => {
			const fms = await connection.catch((err) => {
				console.error('Error connecting to FMS', err)
				return reject(err)
			})
			await fms.list('API_ScanTime')
			.then((result) => {
				fms.logout()
				return resolve(result.data);
			})
			.catch((err) => {
				fms.logout()
				return reject(err)
			})
			fms.logout()
		})
		.catch((err) => {
			console.log(err)
		})
	}

	res.status(200).send({ timeout, timeoutLong, tagList });
}

module.exports.createMacList = async (req, res) => {
	const tagList = await getTags()
	.catch((err) => {
		console.error('Error ', err)
		return res.status(400).send({message: `Error`})
	});

	async function getTags() {
		return new Promise(async (resolve, reject) => {
			const fms = await connection.catch((err) => {
				console.error('Error connecting to FMS', err)
				return reject(err)
			})

			const params = {
				limit: 100000
			}

			await fms.list('API_Carriers_Compact', params)
			.then((result) => {
				const macObj = {}
					result.data.forEach((item) => {
						if(item?.fieldData?.MacAddress){
							macObj[item.fieldData.MacAddress] = {
								barcode: item.fieldData.BarCode,
								uuid: item.fieldData.UUID_Carrier
							}
						}
					})
				fms.logout()
				return resolve(macObj);
			})
			.catch((err) => {
				fms.logout()
				return reject(err)
			})
			fms.logout()

		})
		.catch((err) => {
			console.log(err)
		})
	}

	const jsonString = JSON.stringify(tagList);

    fs.unlink('mac_addresses_fm.json', err => {
        if (err && err.code !== 'ENOENT') {
            console.error('Error deleting file', err);
            return;
        }
    
        fs.writeFile('mac_addresses_fm.json', jsonString, err => {
            if (err) {
                console.log('Error writing file', err);
            } else {
                console.log('File written successfully');
            }
        });
    });

	res.status(200).send("Success");
}