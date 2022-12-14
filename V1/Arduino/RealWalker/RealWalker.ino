#include <EEPROM.h>

//Connections
char sensorPin = A0; // Pin sobre el cual se va a leer la balanza
char motorOutput = 5; // Pin al cual se va a dar potencia para hacer funcionar el motor

String input; // Variable para almacenar la entrada que se reciba
unsigned int calibratedWeight = 20; // El peso contra el que se va a calibrar son 20 kg
unsigned int zeroValue = 0; // Valor de la balanza para peso 0
unsigned int calibratedValue = 1023; // Valor de la balanza para peso calibrado
int calibratedDifference = 1023; // Diferencia entre los dos valores de la balanza
unsigned int maxSpeed = 10; // Velocidad máxima solicitable desde el exterior


void setup() {
  pinMode(motorOutput, OUTPUT);
  readValuesFromRom();
  Serial.setTimeout(50);
  Serial.begin(9600);
}

void updateCalibratedDifference() {
  calibratedDifference = calibratedValue - zeroValue;
}

void readValuesFromRom() {
  byte myBytes[2];
  // Leo las posiciones 0 y 1 de la ROM y los traslado al array de bytes en orden inverso (ya que, como se maneja en
  // little endian, el byte más significativo va a estar en la posición 1)
  myBytes[0] = EEPROM.read(1);
  myBytes[1] = EEPROM.read(0);
  // Armo el int de valor cero en base a los dos bytes que leí antes
  zeroValue = (myBytes[0] << 8) | (myBytes[1]);
  // Repito el procedimiento con las posiciones 2 y 3 para el int de valor calibrado
  myBytes[0] = EEPROM.read(3);
  myBytes[1] = EEPROM.read(2);
  calibratedValue = (myBytes[0] << 8) | (myBytes[1]);
  updateCalibratedDifference();
}

void updateValuesInRom() {
  // Como cada int ocupa 2 bytes en memoria, escribo el valor 0 en los bytes 0 y 1, y el calibrado en los 2 y 3
  EEPROM.put(0, zeroValue);
  EEPROM.put(2, calibratedValue);
}

void loop() {  
  if(Serial.available() > 0) {
    readSerial();
  }

  if (input.equals("P")) {getScaleValue();}
  else if (input.startsWith("V")) {setUpMotorSpeed(input.substring(1).toInt());}
  else if (input.equals("C0")) {configureScaleZero();}
  else if (input.equals("C1")) {configureScaleCalibrated();}
  input = ""; // Para no volver a llamar a las funciones en cada loop, reseteo el input
  
}

void readSerial() {
  char rawInput[10]="0000000000";
  int newInput = Serial.readBytesUntil("\n",rawInput,10);
  input = (String(rawInput)).substring(0,newInput);
}

void setUpMotorSpeed(int speed) {
  // Lo máximo que puedo dar es 255, así que hago un proporcional tomando la velocidad solicitada y la máxima posible
  // (ej.: si la velocidad máxima es 10 y la que recibo por parámetro es 10, voy a dar 255)
  if (speed >= 0 && speed <= maxSpeed){
    analogWrite(motorOutput, int(255 * speed / maxSpeed));
  }
}

void configureScaleZero() {
  zeroValue = analogRead(sensorPin);
  updateCalibratedDifference();
  updateValuesInRom();
}

void configureScaleCalibrated() {
  calibratedValue = analogRead(sensorPin);
  updateCalibratedDifference();
  updateValuesInRom();
}

void getScaleValue() {
  unsigned int weightValue = analogRead(sensorPin);
  // Tras leer el valor de la balanza, hago una regla de tres contra el peso nulo y calibrado, para ver a qué peso
  // corresponde el valor obtenido
  int weightDifference = weightValue-zeroValue;
  float weightRatio = (float)weightDifference/(float)calibratedDifference;
  Serial.println(calibratedWeight*weightRatio);
}
