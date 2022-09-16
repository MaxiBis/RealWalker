const AWS = require("aws-sdk");
const dynamo = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event, context) => {
  let body;
  let statusCode = 200;
  const headers = {
    "Content-Type": "application/json"
  };

  try {
    let requestJSON = JSON.parse(event.body);
    if (!requestJSON.login) {
      statusCode = 401;
      body = `No se introdujo usuario`;
    }
    else if (!requestJSON.pwd) {
      statusCode = 401;
      body = `No se introdujo contraseña`;
    }
    else {
      let user;
      switch (event.routeKey) {
        case "PUT /users/login":
          user = await dynamo.get({
            TableName: "Users",
            Key: { login: requestJSON.login }
          }).promise();
          if (user.Item && user.Item.pwd == requestJSON.pwd) {
            body = `Login exitoso`;
          }
          else {
            statusCode = 401;
            body = `Usuario/contraseña incorrectos`;
          }
          break;
        case "PUT /users/signup":
          user = await dynamo.get({
            TableName: "Users",
            Key: { login: requestJSON.login }
          }).promise();
          if (user.Item) {
            statusCode = 409;
            body = `El usuario ingresado ya existe`;
          }
          else {
            await dynamo.put({
              TableName: "Users",
              Item: {
                login: requestJSON.login,
                pwd: requestJSON.pwd
              }
            }).promise();
            body = `Usuario creado correctamente`;
          }
          break;
      }
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
