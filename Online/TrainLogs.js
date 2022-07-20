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
        for (let i=0; i < requestJSON.length; i++){
          let vals = requestJSON[i];
          await dynamo
          .put({
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
          })
          .promise(); 
        }
        body = `Entrenamiento guardado`;
        break;
      case "GET /trainlogs/user/{uid}":
        let res = await dynamo.scan({ TableName: "TrainLogs" }).promise();
        var uid = event.pathParameters.uid;
        let vals = [];
        for (let i=0; i<res["Items"].length; i++){
          if (res["Items"][i]["medic"] == uid){
            vals.push(res["Items"][i]["patient"] + '|' + res["Items"][i]["date_time"]);
          }
        }
        body = vals.join('¬');
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
      case "GET /trainlogs/log/{id}":
        var log = await dynamo
          .get({
            TableName: "TrainLogs",
            Key: {
              id: event.pathParameters.id,
              date_time: event.pathParameters.id.split("|")[1],
            }
          })
          .promise();
        if (log.Item){
          body = log.Item["date_time"] + "|" + log.Item["notes"] + "|" + log.Item["paused"] + "|" + log.Item["plan"] + "|" + log.Item["patient"] + "|" + log.Item["effective_time"];
        } else {
          body = ``;
        }
        break;
    }
  } catch (err) {
    statusCode = 400;
    body = err.message;
  } finally {
    body = JSON.stringify(body).replace(/"/g,"");
  }

  return {
    statusCode,
    body,
    headers
  };
};