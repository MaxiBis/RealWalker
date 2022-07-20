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
        let patient = await dynamo
          .get({
            TableName: "Patients",
            Key: {
              id: event.pathParameters.id.split("-")[1].trim().replace(" ", "|"),
              full_name: event.pathParameters.id.split("-")[0].trim(),
            }
          })
          .promise();
        if (patient.Item){
          body = patient.Item["doc_type"] + '|' + patient.Item["doc_number"] + '|' + patient.Item["name"] + '|' + patient.Item["surname"] + '|' + patient.Item["diagnosis"] + '|' + patient.Item["height"] + '|' + patient.Item["weight"] + '|' + patient.Item["birth_date"];
        } else {
          body = ``;
        }
        break;
      case "GET /patients/medic/{medic_id}":
        let res = await dynamo.scan({ TableName: "Patients" }).promise();
        let medic_id = event.pathParameters.medic_id;
        let vals = [];
        for (let i=0; i<res["Items"].length; i++){
            if (res["Items"][i]["medic_id"] == medic_id){
                let data = res["Items"][i];
                let str = data["full_name"] + " - " + data["doc_type"] + " " + data["doc_number"];
                vals.push(str);
            }
        }
        vals = vals.reverse();
        body = vals.join('|');
        break;
      case "PUT /patients":
        let requestJSON = JSON.parse(event.body);
        await dynamo
          .put({
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
          })
          .promise();
        body = `Se agregó paciente`;
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