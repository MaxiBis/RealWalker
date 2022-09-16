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

      case "GET /patients/{id}":
        let patient = await dynamo.get({
          TableName: "Patients",
          Key: {
            id: event.pathParameters.id,
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
      case "GET /patients/medic/{medic_id}":
        let res = await dynamo.scan({ TableName: "Patients" }).promise();
        let medic_id = event.pathParameters.medic_id;
        body = [];
        for (let i = 0; i < res["Items"].length; i++) {
          let data = res["Items"][i];
          if (data["medic_id"] == medic_id) {
            body.push({
              'full_name': data["full_name"],
              'doc_type': data["doc_type"],
              'doc_number': data["doc_number"],
            });
          }
        }
        body.sort(function(a, b){return a['full_name']-b['full_name']});
        break;
      case "PUT /patients":
        let requestJSON = JSON.parse(event.body);
        await dynamo.put({
          TableName: "Patients",
          Item: {
            id: requestJSON.doc_type + '|' + requestJSON.doc_number,
            medic_id: requestJSON.medic_id,
            doc_type: requestJSON.doc_type,
            doc_number: requestJSON.doc_number,
            name: requestJSON.name,
            surname: requestJSON.surname,
            full_name: requestJSON.surname + ", " + requestJSON.name,
            diagnosis: requestJSON.diagnosis,
            height: requestJSON.height,
            weight: requestJSON.weight,
            birth_date: requestJSON.birth_date,
          }
        }).promise();
        body = `Se agregó paciente`;
        break;
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
