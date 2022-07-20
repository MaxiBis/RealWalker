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
      case "DELETE /plans/{name}":
        await dynamo
          .delete({
            TableName: "Plans",
            Key: {
              name: event.pathParameters.name
            }
          })
          .promise();
        body = `Se eliminó ${event.pathParameters.name}`;
        break;
      case "GET /plans/{name}":
        var plan = await dynamo
          .get({
            TableName: "Plans",
            Key: {
              name: event.pathParameters.name,
            }
          })
          .promise();
        if (plan.Item){
          body = plan.Item["steps"];
        } else {
          body = ``;
        }
        break;
      case "GET /plans":
        let res = await dynamo.scan({ TableName: "Plans" }).promise();
        let vals = [];
        for (let i=0; i<res["Items"].length; i++){
          vals.push(res["Items"][i]["name"]);
        }
        body = vals.join();
        break;
      case "PUT /plans":
        var requestJSON = JSON.parse(event.body);
        await dynamo
          .put({
            TableName: "Plans",
            Item: {
              name: requestJSON.name,
              steps: requestJSON.steps,
            }
          })
          .promise();
        body = `Se agregó ${requestJSON.name}`;
        break;
      default:
        throw new Error(`Unsupported route: "${event.routeKey}"`);
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