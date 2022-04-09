#define ledPin 7
int state = 0;
String input;

void setup() {
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, LOW);
  Serial.begin(9600);
  Serial.println("Starting");
}

void loop() {
  
  if(Serial.available() > 0){   // Checks whether data is comming from the serial port
    char rawInput[5]="00000";//The character array is used as buffer to read into.
    int x = Serial.readBytesUntil("\n",rawInput,5);//It require two things, variable name to read into, number of bytes to read.
    input = (String(rawInput)).substring(0,x-1);
    Serial.print("Se leyo: ");    
    Serial.println(input);    
  }
  
  switch (input.toInt()) {  
    case 1:
      Serial.println("Velocidad 1");
      // statements
      break;
    case 2:
      Serial.println("Velocidad 2");
      // statements
      break;
    //default:
      // statements
  }
}                                                                                             
