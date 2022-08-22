const sequelize = require("./utils/sql_database");
const {Op} = require("sequelize");
const {RegisteredMsisdn} = require("./utils/sql_models");
const moment = require('moment')

const sendMail = require("./utils/send_mail")
require("dotenv").config()

sequelize.sync()
    .then(async () => {
        console.log("Sequelize connected")

        const finalResult = []


        const startedDate = new Date("2022-06-03 00:00:00");
        const endDate = moment().subtract(1, "day").endOf("day").toDate()

        const registeredSIMS = await RegisteredMsisdn.findAll({
            where: {
                createdAt: {
                    //[Op.startsWith]: yesterday

                    [Op.between]: [startedDate, endDate]
                }
            }, raw: true
        })

        if (registeredSIMS.length > 0) {
            const cleanedData = []
            const setRegions = new Set()
            for (const registeredSIM of registeredSIMS) {
                const {msisdn, customer_type, originalPayload} = registeredSIM
                const {region, nationality} = JSON.parse(originalPayload)
                setRegions.add(getRegion(region))
                const obj = {msisdn, customer_type, region: getRegion(region), nationality}
                cleanedData.push(obj)
            }

            for (const region of setRegions) {
                let obj = {}

                const data = cleanedData.filter(value => value.region === region)

                obj.region = region
                const columnNames = ["id_NEW", "id_EX", "id_NEW_F", "id_EX_F"]
                for (const columnName of columnNames) {
                    obj[columnName] = getCount(data, columnName)
                }
                finalResult.push(obj)

            }


        }
        const message = generateEmailBody(finalResult)
        await sendMail({
            message,
            to: "spolley@surflinegh.com",
            date: moment().format("YYYY-MM-DD")
        })


    })
    .catch((error) => {
        console.log("Cannot connect to MySQL");
        throw error;

    })


function getRegion(region) {
    region = region.toString().toLowerCase();
    if (region.includes("accra")) return 'Greater Accra'
    else if (region.includes("western")) return 'Western'
    else if (region.includes("central")) return 'Central'
    else return 'Greater Accra'

}

function getCount(data, type) {
    switch (type) {
        case "id_NEW":
            return data.filter(value => value.customer_type === 'NEW' && value.nationality === 'ghanaian').length
        case "id_EX":
            return data.filter(value => value.customer_type === 'EXISTING' && value.nationality === 'ghanaian').length
        case "id_NEW_F":
            return data.filter(value => value.customer_type === 'NEW' && value.nationality !== 'ghanaian').length
        case "id_EX_F":
            return data.filter(value => value.customer_type === 'EXISTING' && value.nationality !== 'ghanaian').length
        default:
            return 0
    }
}

function generateEmailBody(data) {
    let tRow = ""

    for (const datum of data) {

        const {region, id_NEW, id_EX, id_NEW_F, id_EX_F} = datum

        tRow += `<tr>
        <td style="border: 1px solid black;text-align: center;">${region}</td>
        <td style="border: 1px solid black;text-align: center;">${id_EX}</td>
        <td style="border: 1px solid black;text-align: center;">${id_NEW}</td>
        <td style="border: 1px solid black;text-align: center;">${id_EX_F}</td>
        <td style="border: 1px solid black;text-align: center;">${id_NEW_F}</td>
         </tr>`


    }

    return `<table style="border-collapse: collapse;border: 1px solid black">
    <thead>
    <tr>
        <th style="border: 1px solid black;">Region</th>
        <th style="border: 1px solid black;">Individual SIM - Existing</th>
        <th style="border: 1px solid black;">Individual SIM - NEW</th>
        <th style="border: 1px solid black;">Foreigner SIM - Existing</th>
        <th style="border: 1px solid black;">Foreigner SIM - NEW</th>
    </tr>
    </thead>
    <tbody>${tRow}</tbody>
</table>`


}
