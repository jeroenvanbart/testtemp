const FMS_API = require('fms-api-client');
const { connect } = require('marpat');

const connection =
    connect('nedb://memory')
        //#
        .then(db => {
            //#client-create-example
            const client = FMS_API.Filemaker.create({
                database: process.env.FM_DATABASE,
                server: process.env.FM_SERVER,
                user: process.env.FM_USER,
                password: process.env.FM_PASSWORD,
            });
            //#
            //#client-save-example
            return client.save()
        })
        .catch((err) => { console.error(err) });

module.exports = connection