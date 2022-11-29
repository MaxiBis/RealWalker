#include <EEPROM.h>

//Connections
char sensorPin = A0;                           //scale pin
char motorOutput = 5;                          //pwm output

//Variables
String input;
//Configuration
unsigned int calibratedWeight = 20;                  //equals 20kg
unsigned int zeroValue = 0;
unsigned int calibratedValue = 1023;
int calibratedDifference = 1023;
unsigned int maxSpeed = 10;


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
  myBytes[0] = EEPROM.read(1);
  myBytes[1] = EEPROM.read(0);
  zeroValue = (myBytes[0] << 8) | (myBytes[1]);
  myBytes[0] = EEPROM.read(3);
  myBytes[1] = EEPROM.read(2);
  calibratedValue = (myBytes[0] << 8) | (myBytes[1]);
  updateCalibratedDifference();
}

void updateValuesInRom() {
  EEPROM.put(0, zeroValue);
  EEPROM.put(2, calibratedValue);
}

void loop() {  
  if(Serial.available() > 0){                               // Checks whether data is comming from the serial port
    readSerial();
  }

  if (input.startsWith("P")) {
    String weightVals = input.substring(1);
    int separatorIndex = weightVals.indexOf("X");
    getScaleValue(weightVals.substring(0, separatorIndex).toInt(), weightVals.substring(separatorIndex+1).toInt());
  }
  else if (input.startsWith("V")) {setUpMotorSpeed(input.substring(1).toInt());}
  else if (input.equals("C0")) {configureScaleZero();}
  else if (input.equals("C1")) {configureScaleCalibrated();}
  input = "";                                               // Avoid re-call the functions every loop
  
}

void readSerial() {
  char rawInput[10]="0000000000";
  int newInput = Serial.readBytesUntil("\n",rawInput,10);
  input = (String(rawInput)).substring(0,newInput);
}

void setUpMotorSpeed(int speed) {
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

void getScaleValue(int samples, int waitTime) {
  for (int i=0; i<samples; i++){
    delay(waitTime);
    unsigned int weightValue = analogRead(sensorPin);
    int weightDifference = weightValue-zeroValue;
    float weightRatio = (float)weightDifference/(float)calibratedDifference;
    Serial.println(calibratedWeight*weightRatio);
  }
}
