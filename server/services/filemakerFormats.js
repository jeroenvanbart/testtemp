const { response } = require('express')
const connection = require('../config/db')
const listfields = ['']

const fmDate = (date) => {
  let formatDate = new Date(date)
  return (formatDate.getMonth() + 1) + "/" + formatDate.getDate() + "/" + formatDate.getFullYear()
}

const fmTimestamp = (date) => {
  let formatDate = new Date(date)
  return (formatDate.getMonth() + 1) + "/" + formatDate.getDate() + "/" + formatDate.getFullYear() + " " + formatDate.getHours() + ":" + formatDate.getMinutes() + ":" + formatDate.getSeconds()
}

const changeFmDate = (date) => {
  newDate = new Date(date)
  return newDate.getFullYear() + "-" + (newDate.getMonth() + 1) + "-" + newDate.getDate()
}

const changeFmZeroDate = (date) => {
  newDate = new Date(date)
  var day = newDate.getDate()
  var month = newDate.getMonth() + 1
  var year = newDate.getFullYear()
  if (day.toString().length < 2) { day = '0' + day }
  if (month.toString().length < 2) { month = '0' + month }
  return year + "-" + month + "-" + day
}

const filemakerFind = async (layout, query, params = {}) => {
  const fms = await connection.catch((err) => {
    console.error('Connection error', err)
    return { error: err }
  })

  const response = await fms.find(layout, query, params).catch((err) => {
    console.error(`Error finding data in ${layout} in Filemaker`, err)
  })
  fms.logout()

  if (response && response.data.length > 0) {
    return { foundCount: response.dataInfo.foundCount, returnedCount: response.dataInfo.returnedCount, data: transformData(response) }
  }
  return "No Results"
}

const filemakerList = async (layout, params) => {
  const fms = await connection.catch((err) => {
    console.error('Connection error', err)
    return { error: err }
  })

  const response = await fms.list(layout, params).catch((err) => {
    console.error(`Error finding data in ${layout} in Filemaker`, err)
  })
  fms.logout()

  if (response && response.data.length > 0) {
    return { foundCount: response.dataInfo.foundCount, returnedCount: response.dataInfo.returnedCount, data: transformData(response) }
  }
  return "No Results"
}

const filemakerRecordId = async (layout, query, params = {}) => {
  const response = await filemakerFind(layout, query, params).catch((err) => {
    console.error(`Error finding data for recordId in ${layout} in Filemaker`, err)
  })
  if (response && response.length > 0) {
    return response[0].RecordID
  }
  return
}

const filemakerCreate = async (layout, data) => {
  const fms = await connection.catch((err) => {
    console.error('Connection error', err)
    return
  })

  const create = await fms.create(layout, data).catch((err) => {
    console.error(`Error creating data in ${layout} in Filemaker`, err)
    fms.logout()
    return
  })

  if (create) {
    const data = await filemakerFind(layout, [{ RecordID: create.recordId }]).catch((err) => {
      console.error(`Error after update finding data in ${layout} in Filemaker`, err)
      fms.logout()
      return
    })
    if (data && data.length > 0) {
      return data
    }
  }
  fms.logout()
  return { message: 'Geen data geinserteerd.' }
}

const filemakerScript = async (layout, script, recordId) => {

  const fms = await connection.catch((err) => {
    console.error('Connection error', err)
    return
  })

  const scriptResult = await fms.script(layout, script, recordId).catch((err) => {
    console.error('Error firing script', err)
  })
  fms.logout()

  if (scriptResult.scriptError === '0') {
    return { scriptResult }
  }

  return { message: `Er is een fout opgetreden tijdens het versturen van de resetwachtwoord mail.`, scriptError: scriptResult }
}


const filemakerUpdate = async (layout, recordId, data) => {
  const fms = await connection.catch((err) => {
    console.error('Connection error', err)
    return
  })

  const update = await fms.edit(layout, recordId, data).catch((err) => {
    console.error(`Error updating data in ${layout} in Filemaker`, err)
    fms.logout()
    return
  })

  if (update) {
    const data = await filemakerFind(layout, [{ RecordID: recordId }]).catch((err) => {
      console.error(`Error after update finding data in ${layout} in Filemaker`, err)
      fms.logout()
      return
    })
    if (data && data.length > 0) {
      return data
    }
  }
  fms.logout()
  return { message: 'Geen data verwerkt.' }
}

const filemakerError = (err) => {
  let errorMessage
  console.error('Error occured when retrieving data', err)
  if (err.code == '802') {
    errorMessage = 'Unable to connect to database'
  } else {
    errorMessage = 'Something went wrong with the search'
  }
  return errorMessage
}

function transformData(response) {
  let Data = []
  for (let i = 0; i < response.data.length; i++) {
    Data[i] = {}
    for (const key of Object.keys(response.data[i].fieldData)) {
      let parts = key.split('::')
      if (parts.length === 2) {
        Data[i][parts[1]] = transformValue(key, response.data[i].fieldData[key])
      } else {
        Data[i][key] = transformValue(key, response.data[i].fieldData[key])
      }
    }
    let pData = []
    for (const pKey of Object.keys(response.data[i].portalData)) {
      pData[pKey] = []
      var cols = response.data[i].portalData[pKey]
      for (let i = 0; i < cols.length; i++) {
        let cData = {}
        for (const cKey of Object.keys(cols[i])) {
          let parts = cKey.split('::')
          if (parts.length === 2) {
            cData[parts[1]] = transformValue(parts[1], (cols[i][cKey]))
          } else {
            cData[cKey] = transformValue(cKey, (cols[i][cKey]))
          }

        }
        pData[pKey].push(cData)
      }
    }
    Object.assign(Data[i], pData)
  }
  return Data;
}

function validateDate(value) {
  const date_regex = /^\d{2}\/\d{2}\/\d{4}$/;
  return date_regex.test(value);
}

function transformValue(key, value) {
  if (validateDate(value)) {
    return changeFmDate(value)
  }
  if (listfields.includes(key)) {
    return value.split('\r')
  }
  return value
}


module.exports = {
  fmDate,
  fmTimestamp,
  changeFmDate,
  changeFmZeroDate,
  filemakerFind,
  filemakerList,
  filemakerUpdate,
  filemakerCreate,
  filemakerScript,
  filemakerRecordId,
  filemakerError
}
