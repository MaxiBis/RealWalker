#define ledPin 7
int state = 0;
int input;
int motorOutput = 5;
int sensorPin = A0; 
int valorMinimo = 0;
int valorMaximo = 1024;


void setup() {
  pinMode(motorOutput, OUTPUT);
  Serial.begin(9600);
  Serial.println("Starting");
}

void loop() {
  
  if(Serial.available() > 0){                               // Checks whether data is comming from the serial port
    char rawInput[5]="00000";                               //The character array is used as buffer to read into.
    int x = Serial.readBytesUntil("\n",rawInput,5);         //It require two things, variable name to read into, number of bytes to read.
    input = ((String(rawInput)).substring(0,x-1)).toInt();
    Serial.print("Se leyo: ");    
    Serial.println(input);    
  }  

  if (input >=0 && input < 11) {setUpMotorSpeed();}
  else if (input == 11) {configureScale();}
}  

void setUpMotorSpeed() {
  Serial.print("Velocidad ");
  Serial.println(input); 
  analogWrite(motorOutput, input * 25);   // 25 because: 255/10 ≃ 25
  input = -1;                             // Avoid re-set the pwm signal every loop
}

void configureScale() {
  Serial.println("Configuracion galga detectada");
  Serial.println("colocar peso minimo e ingresar 12 para OK, o 13 para salir");
  
  while (!((input == 12) || (input == 13))){
    if(Serial.available() > 0){   // Checks whether data is comming from the serial port
      char rawInput[5]="00000";//The character array is used as buffer to read into.
      int x = Serial.readBytesUntil("\n",rawInput,5);//It require two things, variable name to read into, number of bytes to read.
      input = ((String(rawInput)).substring(0,x-1)).toInt();
      Serial.print("Se leyo entrada: ");    
      Serial.println(input);    
    }
  }
  if(input == 12){ 
    valorMinimo = analogRead(sensorPin);
    Serial.print("Se leyo potenciometro: ");    
    Serial.println(valorMinimo);  
  }
  if(input == 13){ 
    Serial.print("Cancelado");    
  }                  
  input = -1;    
  while (!((input == 12) || (input == 13))){
    if(Serial.available() > 0){   // Checks whether data is comming from the serial port
      char rawInput[5]="00000";//The character array is used as buffer to read into.
      int x = Serial.readBytesUntil("\n",rawInput,5);//It require two things, variable name to read into, number of bytes to read.
      input = ((String(rawInput)).substring(0,x-1)).toInt();
      Serial.print("Se leyo entrada: ");    
      Serial.println(input);    
    }
  }
  if(input == 12){ 
    valorMaximo = analogRead(sensorPin);
    Serial.print("Se leyo potenciometro: ");    
    Serial.println(valorMaximo);  
  }
  if(input == 13){ 
    Serial.print("Cancelado");    
  }     
  
}
