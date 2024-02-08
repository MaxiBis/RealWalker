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
        body = [];
        for (let i = 0; i < res["Items"].length; i++) {
          if (res["Items"][i]["patient"] == uid) {
            let curr_time = parseInt(res["Items"][i]["effective_time"], 10);
            let split_plan = res["Items"][i]["plan"].split(';');
            let adapted_plan = [];
            for (let step of split_plan){
              let split_step = step.split(',');
              let adapted_time = Math.min(split_step[1], curr_time);
              adapted_plan.push(String(split_step[0]) + "," + String(adapted_time));
              curr_time -= split_step[1];
              if (curr_time <= 0){
                break;
              }
            }
            body.push({
              'date_time': res["Items"][i]["date_time"],
              'plan': adapted_plan.join(';'),
              'effective_time': res["Items"][i]["effective_time"],
              'weight': res["Items"][i]["weight"],
            });
          }
        }
        if (body.length == 0){
          statusCode = 401;
          body = {'error': 'No se puede emitir un reporte sin entrenamientos'};
        }
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
    body = JSON.stringify(body);
  }

  return {
    statusCode,
    body,
    headers
  };
};
