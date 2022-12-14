const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    let requestJSON;
    let user;
    switch (event.routeKey) {
      case "PUT /users/login":
        requestJSON = JSON.parse(event.body);
        if (!requestJSON.login) {
          statusCode = 401;
          body = {'error': 'No se introdujo usuario'};
        }
        else if (!requestJSON.pwd) {
          statusCode = 401;
          body = {'error': 'No se introdujo constraseña'};
        }
        user = await dynamo.get({
          TableName: "Users",
          Key: { login: requestJSON.login }
        }).promise();
        if (user.Item && user.Item.pwd == requestJSON.pwd) {
          body = {'medic': user.Item.medic};
          if (user.Item.medic == true){
            body['patient'] = user.Item.patient;
          }
        }
        else {
          statusCode = 401;
          body = {'error': 'Usuario/contraseña incorrectos'};
        }
        break;
      case "PUT /users/signup":
        requestJSON = JSON.parse(event.body);
        if (!requestJSON.login) {
          statusCode = 401;
          body = {'error': 'No se introdujo usuario'};
        }
        else if (!requestJSON.pwd) {
          statusCode = 401;
          body = {'error': 'No se introdujo constraseña'};
        }
        user = await dynamo.get({
          TableName: "Users",
          Key: { login: requestJSON.login }
        }).promise();
        if (user.Item) {
          statusCode = 409;
          body = {'error': 'El usuario ingresado ya existe'};
        }
        else {
          await dynamo.put({
            TableName: "Users",
            Item: {
              login: requestJSON.login,
              pwd: requestJSON.pwd,
              doc_type: requestJSON.doc_type,
              doc_number: requestJSON.doc_number,
              birth_date: requestJSON.birth_date,
              name: requestJSON.name,
              surname: requestJSON.surname,
              height: requestJSON.height,
              weight: requestJSON.weight,
              medic: requestJSON.medic,
              patient: requestJSON.patient,
              report_mail: requestJSON.report_mail,
              weigh_method: requestJSON.weigh_method,
              sample_qty: requestJSON.sample_qty,
              sample_time: requestJSON.sample_time,
            }
          }).promise();
          body = {'message': 'Usuario creado correctamente'};
        }
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
