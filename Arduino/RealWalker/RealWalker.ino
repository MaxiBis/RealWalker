//Connections
int sensorPin = A0;                           //scale pin
int motorOutput = 5;                          //pwm output

//Variables
String input;
//Configuration
int calibratedWeight = 20;                  //equals 20kg
int minValue = 0;
int maxValue = 1024;
int maxSpeed = 10;


void setup() {
  pinMode(motorOutput, OUTPUT);
  Serial.setTimeout(50);
  Serial.begin(9600);
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
  int x = Serial.readBytesUntil("\n",rawInput,10);
  input = (String(rawInput)).substring(0,x);
}

void setUpMotorSpeed(int speed) {
  if (speed >= 0 && speed <= maxSpeed){
    analogWrite(motorOutput, int(255 * speed / maxSpeed));
  }
}

void configureScaleZero() {
  minValue = analogRead(sensorPin);
}

void configureScaleCalibrated() {
  maxValue = analogRead(sensorPin); 
}

void getScaleValue(int samples, int waitTime) {
  for (int i=0; i<samples; i++){
    delay(waitTime);
    int weightValue = analogRead(sensorPin);
    float ratio_1 = (float) (weightValue-minValue);
    float ratio_2 = (float) (maxValue-minValue);
    float ratio = ratio_1/ratio_2;
    Serial.println(calibratedWeight*ratio);
  }
}
