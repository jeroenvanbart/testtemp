const FMS = require('fms-api-client')
const { connect } = require('marpat');
const fs = require('fs');

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
		})
		.catch((err) => {
			console.error(err)
		});


module.exports.renewTags = async () => {
	console.log("Tag renew was called!")
	try {
		const tagList = await getTags();
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

		console.log("Tag renew has ended.")
	} catch (err) {
		console.error('Error in renewTags:', err);
	}
}

async function getTags() {
	return new Promise(async (resolve, reject) => {
		try {
			const fms = await connection;
			const params = { limit: 100000 };

			const result = await fms.list('API_Carriers_Compact', params);
			const macObj = {};

			result.data.forEach((item) => {
				if (item?.fieldData?.MacAddress) {
					macObj[item.fieldData.MacAddress] = {
						barcode: item.fieldData.BarCode,
						uuid: item.fieldData.UUID_Carrier
					}
				}
			});

			fms.logout();
			resolve(macObj);
		} catch (err) {
			console.error('Error in getTags:', err);
			reject(err);
		}
	});
}
