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
      case "PUT /trainlogs":
        let requestJSON = JSON.parse(event.body);
        for (let i = 0; i < requestJSON.length; i++) {
          let vals = requestJSON[i];
          await dynamo.put({
            TableName: "TrainLogs",
            Item: {
              id: vals.medic + "|" + vals.date_time,
              date_time: vals.date_time,
              paused: vals.paused,
              plan: vals.plan,
              notes: vals.notes,
              patient: vals.patient,
              medic: vals.medic,
              effective_time: vals.effective_time,
            }
          }).promise();
        }
        body = `Entrenamiento guardado`;
        break;
      case "GET /trainlogs/user/{uid}":
        let res = await dynamo.scan({ TableName: "TrainLogs" }).promise();
        var uid = event.pathParameters.uid;
        body = [];
        for (let i = 0; i < res["Items"].length; i++) {
          if (res["Items"][i]["medic"] == uid) {
            body.push({
              'patient': res["Items"][i]["patient"],
              'date_time': res["Items"][i]["date_time"],
            });
          }
        }
        body.sort(function(a, b){return a['date_time']-b['date_time']});
        break;
      case "GET /trainlogs/log/{id}":
        var log = await dynamo.get({
          TableName: "TrainLogs",
          Key: {
            id: event.pathParameters.id,
            date_time: event.pathParameters.id.split("|")[1],
          }
        }).promise();
        if (log.Item) {
          body = {
            'date_time': log.Item['date_time'],
            'notes': log.Item['notes'],
            'paused': log.Item['paused'],
            'plan': log.Item['plan'],
            'patient': log.Item['patient'],
            'effective_time': log.Item['effective_time'],
          };
        }
        else {
          body = {};
        }
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
    }
  }
  catch (err) {
    statusCode = 400;
    body = err.stack;
  }
  finally {
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers
  };
};
