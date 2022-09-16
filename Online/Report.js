const AWS = require("aws-sdk");

const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    switch (event.routeKey) {
      case "GET /report/{uid}":
        let res = await dynamo.scan({ TableName: "TrainLogs" }).promise();
        let uid = event.pathParameters.uid;
        let vals = {};
        let total = 0;
        for (let i = 0; i < res["Items"].length; i++) {
          if (res["Items"][i]["medic"] == uid) {
            let patient = res["Items"][i]["patient"];
            if (!(patient in vals)) {
              vals[patient] = 0;
            }
            vals[patient] += parseInt(res["Items"][i]["effective_time"], 10);
          }
        }
        body = "<html><body><h2 style='text-align:center'>Entrenamientos de " + uid;
        body += "</h2><table style='border:1px solid;width:100%'><thead style='background-color:black;color:white'><tr><td><b>Paciente</b></td><td><b>Tiempo efectivo</b></td></tr></thead><tbody>";
        for (let k in vals) {
          body += "<tr><td>" + k + "</td><td>" + vals[k] + " segundos</td></tr>";
          total += vals[k];
        }
        body += "</tbody></table><p><b>Tiempo total: ";
        body += total;
        body += " segundos</p></body></html>";
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  }
  catch (err) {
    statusCode = 400;
    body = err.message;
  }
  finally {
    body = JSON.stringify(body).replace(/"/g, "");
  }

  return {
    statusCode,
    body,
    headers
  };
};
