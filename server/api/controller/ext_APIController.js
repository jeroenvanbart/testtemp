const {
    passwordCheck,
    checkAuth,
} = require('../../services/passwords')
const {
    filemakerFind,
    filemakerList,
    filemakerUpdate,
    filemakerCreate,
    filemakerScript,
    filemakerRecordId,
    fmDate,
    fmTimestamp,
    filemakerError
} = require('../../services/filemakerFormats')
const Layouts = require('../../config/layouts.json');

module.exports.API_Login = async (req, res) => {
    if (!req.body?.username || !req.body?.password) {
        return res.status(400).send({
            API_Result: 'Bad request',
        })
    }

    const username = req.body.username.trim();
    const password = req.body.password.trim();

    const query = [{
        Username: `==${username}`,
    }]
    const params = {
        limit: 1
    }

    const userCheck = await filemakerFind(Layouts.API_Accounts, query, params).catch((err) => {
        const errorMessage = filemakerError(err);
        return res.status(500).send({ API_Result: errorMessage })
    })

    if (userCheck.data) {
        const correctPasword = await passwordCheck(password, userCheck.data[0].Password)
            .catch((err) => {
                return res.status(401).send({ API_Result: 'Login failed; Invalid username or password.' })
            })
        if (correctPasword) {
            req.session.authenticated = true
            req.session.userId = userCheck.data[0].UUID_Relation
            req.session.userType = userCheck.data[0].UserType
            return res.status(200).send({
                API_Result: 'Logged in'
            })
        }
    } else {
        console.error("User not found")
        return res.status(401).send({
            API_Result: 'Login failed; Invalid username or password.'
        })
    }
}

module.exports.API_Logout = async (req, res) => {
    console.log("User logged out")
    req.session.destroy()
    return res.status(200).send({ API_Result: 'Session destroyed' })
}

module.exports.GetCarriers = async (req, res) => {

    // Authenticate Account
    if (!req?.session?.authenticated) {
        console.log('Not Authenticated')
        return res.status(400).send({ API_Result: 'Session expired'})
    }

    const authorization = checkAuth(req.session.userId, req.session.userType)

    if (authorization == false) {
        return res.status(401).send({ API_Result: 'Unauthorized' })
    }

    const LocationID = req?.body?.LocationID ? req.body.LocationID : "";
    const Limit = req?.body?.Limit ? req.body.Limit : "100";
    const Offset = req?.body?.Offset ? req.body.Offset : "";

    let query = []

    if (req.session.userType == "ExternUser") {
        query.push({
            'EXT_API_Locations::UUID_Relations': `==\"${req.session.userId}\"`,
        })
    }

    if (LocationID != "") {
        query.push({
            'EXT_API_Locations::UUID_Location': `==\"${LocationID}\"`,
        })
    }

    const params = {}

    if (Limit != "") {
        params.limit = Limit
    }

    if (Offset != "") {
        params.offset = Offset
    }

    if (LocationID != "") {
        carriers = await filemakerFind(Layouts.API_Carriers, query, params).catch((err) => {
            const errorMessage = filemakerError(err);
            return res.status(500).send({ API_Result: errorMessage })
        })

    } else {
        console.log("No LocationID")
        carriers = await filemakerList(Layouts.API_Carriers, params).catch((err) => {
            const errorMessage = filemakerError(err);
            return res.status(500).send({ API_Result: errorMessage })
        })
    }
    if (carriers?.data) {
        const carriersUpdatedData = renameKeys(["UUID_LastLocation", "UUID_Relations", "c_LastRegistrationSeenDate", "c_FirstRegistrationSeenDate", "UUID_Location"], ["LastLocationID", "RelationID", "LastSeenDate", "FirstSeenDate", "LocationID"], carriers.data)
        const foundCount = carriers.foundCount
        const returnedCount = carriers.returnedCount
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: carriersUpdatedData })
    } else {
        return res.status(200).send({ API_Found_Amount: 0, API_Result_Amount: 0, API_Result: "No Results" })
    }
}

module.exports.GetStaticCarriers = async (req, res) => {
    // Authenticate Account
    if (!req?.session?.authenticated) {
        console.log('Not Authenticated')
        return res.status(400).send({ API_Result: 'Session expired'})
    }

    const authorization = checkAuth(req.session.userId, req.session.userType)

    if (authorization == false) {
        return res.status(401).send({ API_Result: 'Unauthorized' })
    }

    const LocationID = req?.body?.LocationID ? req.body.LocationID : "";
    const Limit = req?.body?.Limit ? req.body.Limit : "100";
    const AmountOfDays = req?.body?.Days ? req.body.Days : "7";
    const Offset = req?.body?.Offset ? req.body.Offset : "";


    let query = []

    if (req.session.userType == "ExternUser") {
        query.push({
            'EXT_API_Locations::UUID_Relations': `==\"${req.session.userId}\"`,
        })
    }

    if (LocationID != "") {
        query.push({
            'EXT_API_Locations::UUID_Location': `==\"${LocationID}\"`,
        })
    }

    if (AmountOfDays != "") {
        query.push({
            'AmountDaysLastRegistration': `>=\"${AmountOfDays}\"`,
        })
    }

    const params = {}

    if (Limit != "") {
        params.limit = Limit
    }

    if (Offset != "") {
        params.offset = Offset
    }

    let staticCarriers = await filemakerFind(Layouts.API_Carriers, query, params).catch((err) => {
        const errorMessage = filemakerError(err);
        return res.status(500).send({ API_Result: errorMessage })
    })

    if (staticCarriers) {
        const foundCount = staticCarriers.foundCount
        const returnedCount = staticCarriers.returnedCount
        console.log("Sending Data to API")
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: staticCarriers.data })
    } else {
        return res.status(200).send({ API_Found_Amount: 0, API_Result_Amount: 0, API_Result: "No Results" })
    }
}

module.exports.GetLocations = async (req, res) => {
    // Authenticate Account
    if (!req?.session?.authenticated) {
        console.log('Not Authenticated')
        return res.status(400).send({ API_Result: 'Session expired'})
    }

    const authorization = checkAuth(req.session.userId, req.session.userType)

    if (authorization == false) {
        return res.status(401).send({ API_Result: 'Unauthorized' })
    }

    const Limit = req?.body?.Limit ? req.body.Limit : "100";
    const Offset = req?.body?.Offset ? req.body.Offset : "";

    let query = []

    if (req.session.userType == "ExternUser") {
        query.push({
            'EXT_API_Locations::UUID_Relations': `==\"${req.session.userId}\"`,
        })
    }

    const params = {}

    if (Limit != "") {
        params.limit = Limit
    }

    if (Offset != "") {
        params.offset = Offset
    }

    let locations
    if (req.session.userType == "ExternUser") {
        locations = await filemakerFind(Layouts.API_Locations, query, params).catch((err) => {
            const errorMessage = filemakerError(err);
            return res.status(500).send({ API_Result: errorMessage })
        })

    } else {
        locations = await filemakerList(Layouts.API_Locations, params).catch((err) => {
            const errorMessage = filemakerError(err);
            return res.status(500).send({ API_Result: errorMessage })
        })
    }

    if (locations?.data) {
        const locationsUpdatedData = renameKeys(["UUID_Relations", "UUID_Location", "Store#", "custcode"], ["RelationID", "LocationID", "StoreNumber", "CustomerCode"], locations.data)
        const foundCount = locations.foundCount
        const returnedCount = locations.returnedCount
        console.log("Sending Data to API")
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: locationsUpdatedData })
    } else {
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: "No Results" })
    }
}


module.exports.GetHistory = async (req, res) => {
    // Authenticate Account
    if (!req?.session?.authenticated) {
        console.log('Not Authenticated')
        return res.status(400).send({ API_Result: 'Session expired'})
    }

    const authorization = checkAuth(req.session.userId, req.session.userType)

    if (authorization == false && req.session.userType !== "SuperUser") {
        return res.status(401).send({ API_Result: 'Unauthorized' })
    }
    const Limit = req?.body?.Limit ? req.body.Limit : "100";
    const Offset = req?.body?.Offset ? req.body.Offset : "";
    const MacAdres = req?.body?.MacAddress ? req.body.MacAddress : "";

    if (MacAdres == "") {
        return res.status(400).send({ API_Result_Amount: Amount, API_Result: "Invalid API_CALL" })
    }

    let query = []

    query.push({
        'MacAdres': `==\"${MacAdres}\"`
    })

    const params = {
        sort: [{ "fieldName": "CreationTimestamp", "sortOrder": "descend" }]
    }

    if (Limit != "") {
        params.limit = Limit
    }

    if (Offset != "") {
        params.offset = Offset
    }

    let history = await filemakerFind(Layouts.API_History, query, params).catch((err) => {
        const errorMessage = filemakerError(err);
        return res.status(500).send({ API_Result: errorMessage })
    })

    if (history) {
        const foundCount = history.foundCount
        const returnedCount = history.returnedCount
        console.log("Sending Data to API")
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: history.data })
    } else {
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: "No Results" })
    }
}


module.exports.GetRegistrations = async (req, res) => {
    // Authenticate Account
    if (!req?.session?.authenticated) {
        console.log('Not Authenticated')
        return res.status(400).send({ API_Result: 'Session expired'})
    }

    const authorization = checkAuth(req.session.userId, req.session.userType)

    if (authorization == false && req.session.userType !== "SuperUser") {
        return res.status(401).send({ API_Result: 'Unauthorized' })
    }
    const Limit = req?.body?.Limit ? req.body.Limit : "100";
    const Offset = req?.body?.Offset ? req.body.Offset : "";

    let query = [
        { 'CreationTimestamp': `// *:*:*` },
        { 'LastSeenDate': `//` }
    ]

    const params = {
        sort: [{ "fieldName": "CreationTimestamp", "sortOrder": "descend" }]
    }

    if (Limit != "") {
        params.limit = Limit
    }

    if (Offset != "") {
        params.offset = Offset
    }

    let registrations = await filemakerFind(Layouts.API_History, query, params).catch((err) => {
        const errorMessage = filemakerError(err);
        return res.status(500).send({ API_Result: errorMessage })
    })

    if (registrations?.data) {
        const foundCount = registrations.foundCount
        const returnedCount = registrations.returnedCount
        console.log("Sending Data to API")
        return res.status(200).send({ API_Found_Amount: foundCount, API_Result_Amount: returnedCount, API_Result: registrations.data })
    } else {
        return res.status(200).send({ API_Found_Amount: 0, API_Result_Amount: 0, API_Result: "No Results" })
    }
}

function renameKeys(currentkeyArray, newkeyArray, array) {
    // loop trough the array and rename the keys in the object to the new keys using reduce and the spread operator
    return array.map((obj) => {
        return Object.keys(obj).reduce((acc, key) => {
            const index = currentkeyArray.indexOf(key);
            const newKey = newkeyArray[index] || key;
            return {
                ...acc,
                [newKey]: obj[key],
            };
        }, {});
    });
}