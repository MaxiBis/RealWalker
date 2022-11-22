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

      case "GET /patients":
        let res = await dynamo.scan({ TableName: "Users" }).promise();
        body = [];
        for (let i = 0; i < res["Items"].length; i++) {
          if (res["Items"][i]["medic"] == false) {
            body.push({
              'name': res["Items"][i]["name"],
              'surname': res["Items"][i]["surname"],
              'doc_type': res["Items"][i]["doc_type"],
              'doc_number': res["Items"][i]["doc_number"],
              'login': res["Items"][i]["login"],
            });
          }
        }
        break;
      case "GET /patients/{id}":
        let patient = await dynamo.get({
          TableName: "Users",
          Key: {
            login: event.pathParameters.id,
          }
        }).promise();
        if (patient.Item) {
          body = {
            'doc_type': patient.Item["doc_type"],
            'doc_number': patient.Item["doc_number"],
            'name': patient.Item["name"],
            'surname': patient.Item["surname"],
            'diagnosis': patient.Item["diagnosis"],
            'height': patient.Item["height"],
            'weight': patient.Item["weight"],
            'birth_date': patient.Item["birth_date"],
          };
        }
        else {
          body = {};
        }
        break;
      case "PUT /patients":
        let requestJSON = JSON.parse(event.body);
        await dynamo.update({
          TableName: "Users",
          Key: {login: requestJSON.login},
          AttributeUpdates: {
            doc_type: {Action: 'PUT', Value: requestJSON.doc_type},
            doc_number: {Action: 'PUT', Value: requestJSON.doc_number},
            name: {Action: 'PUT', Value: requestJSON.name},
            surname: {Action: 'PUT', Value: requestJSON.name},
            diagnosis: {Action: 'PUT', Value: requestJSON.diagnosis},
            height: {Action: 'PUT', Value: requestJSON.height},
            weight: {Action: 'PUT', Value: requestJSON.weight},
            birth_date: {Action: 'PUT', Value: requestJSON.birth_date},
          }
        }).promise();
        body = {'message': 'Paciente guardado'};
        break;
      case "PUT /patients/weight":
        let weight_request = JSON.parse(event.body);
        await dynamo.update({
          TableName: "Users",
          Key: {login: weight_request.login},
          AttributeUpdates: {
            weight: {Action: 'PUT', Value: weight_request.weight},
          }
        }).promise();
        body = {'message': 'Peso guardado'};
        break;
      default:
        throw new Error('Unsupported route: "${event.routeKey}"');
    }
  }
  catch (err) {
    statusCode = 400;
    body = {'error': err.message};
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
