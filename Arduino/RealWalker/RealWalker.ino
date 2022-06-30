//Connections
int sensorPin = A0;                           //scale pin
int motorOutput = 5;                          //pwm output

//Variables
int state = 0;
int input;
int valorLeido = 500;
  //Configuration
  int calibratedWeight = 20;                  //equals 20kg
  int valorMinimo = 0;
  int valorMaximo = 1024;


void setup() {
  pinMode(motorOutput, OUTPUT);
  Serial.begin(9600);
  Serial.println("Starting");
}

void loop() {  
  if(Serial.available() > 0){                               // Checks whether data is comming from the serial port
    readSerial();
  }  

  if (input >=0 && input < 11) {setUpMotorSpeed();}
  else if (input == 11) {configureScaleZero();}
  else if (input == 12) {configureScaleCalibrated();}
  else if (input == 13) {getScaleValue();}
  input = -1;                                               // Avoid re-call the functions every loop
}  

void readSerial() {
  char rawInput[5]="00000";                                 //The character array is used as buffer to read into.
  int x = Serial.readBytesUntil("\n",rawInput,5);           //It require two things, variable name to read into, number of bytes to read.
  //input = ((String(rawInput)).substring(0,x-1)).toInt();  //works fine with pc/console serial input
  input = ((String(rawInput)).substring(0,x)).toInt();      //works fine with Bluetooth serial input
  /* //Debbuging functions
  Serial.print("Se leyo raw: ");    
  Serial.print(rawInput);      
  Serial.print(", Convertido: ");    
  Serial.println(input);
  */
}

void setUpMotorSpeed() {
  Serial.print("Velocidad ");
  Serial.println(input); 
  analogWrite(motorOutput, input * 25);   // 25 because: 255/10 ≃ 25
}

void configureScaleZero() {
  valorMinimo = analogRead(sensorPin);
  Serial.print("Se leyo valor minimo balanza: ");    
  Serial.println(valorMinimo); 
}

void configureScaleCalibrated() {
  valorMaximo = analogRead(sensorPin);
  Serial.print("Se leyo 20kg: ");    
  Serial.println(valorMaximo);   
}

void getScaleValue() {
  valorLeido = analogRead(sensorPin);
  float ratio_1 = (float) (valorLeido-valorMinimo);
  float ratio_2 = (float) (valorMaximo-valorMinimo);
  float ratio = ratio_1/ratio_2;
  float weight = calibratedWeight*ratio;
  /* //Debbuging functions
  Serial.print("valorLeido: ");    
  Serial.print(valorLeido); 
  Serial.print(" Peso: ");    
  */
  Serial.println(weight);   
}
