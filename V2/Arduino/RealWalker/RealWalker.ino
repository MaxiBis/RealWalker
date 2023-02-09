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
  if(Serial.available() > 0) {input = Serial.readStringUntil("\n");}
  if (input.startsWith("P")) {
    String weightVals = input.substring(2);
    int separatorIndex = weightVals.indexOf("X");
    int sampleQty = weightVals.substring(0, separatorIndex).toInt();
    int waitTime = weightVals.substring(separatorIndex+1).toInt();
    Serial.println(getScaleValue(input[1], sampleQty, waitTime));
  }
  else if (input.startsWith("V")) {setUpMotorSpeed(input.substring(1).toInt());}
  else if (input.startsWith("C")) {configureScale(input[1]);}
  input = ""; // Para no volver a llamar a las funciones en cada loop, reseteo el input
}

void setUpMotorSpeed(int speed) {
  // Lo máximo que puedo dar es 255, así que hago un proporcional tomando la velocidad solicitada y la máxima posible
  // (ej.: si la velocidad máxima es 10 y la que recibo por parámetro es 10, voy a dar 255)
  if (speed >= 0 && speed <= maxSpeed) {analogWrite(motorOutput, int(255 * speed / maxSpeed));}
}

void configureScale(char value) {
  unsigned int newValue = analogRead(sensorPin);
  if (value == '0') {zeroValue = newValue;}
  else if (value == '1') {calibratedValue = newValue;}
  updateCalibratedDifference();
  updateValuesInRom();
}

float readWeight(int waitTime){
  delay(waitTime);
  unsigned int weightValue = analogRead(sensorPin);
  // Tras leer el valor de la balanza, hago una regla de tres contra el peso nulo y calibrado, para ver a qué peso
  // corresponde el valor obtenido
  int weightDifference = weightValue-zeroValue;
  float weightRatio = (float)weightDifference/calibratedDifference;
  return calibratedWeight*weightRatio;
}

float sort(float *cmp1, float *cmp2){
  return *cmp1 - *cmp2;
}

float getMode(float values[], int lowerLimit, int upperLimit){
  float first_sample = values[lowerLimit];
  float max_val = first_sample;
  int max_occurrences = 1;
  float curr_val = first_sample;
  int curr_occurrences = 1;
  for (int i=lowerLimit+1; i<upperLimit; i++){
    float val = values[i];
    if (curr_val == val){
      curr_occurrences += 1;
      if (curr_occurrences > max_occurrences){
        max_occurrences = curr_occurrences;
        max_val = val;
      }
    }else{
      curr_val = val;
      curr_occurrences = 1;
    }
  }
  return max_val;
}

float getScaleValue(char method, int sampleQty, int waitTime){
  if (method == 'A') {return getScaleValueAvg(sampleQty, waitTime);}
  else if (method == 'B') {return getScaleValueQuartileAvg(sampleQty, waitTime);}
  else if (method == 'C') {return getScaleValueMode(sampleQty, waitTime);}
  else if (method == 'D') {return getScaleValueQuartileMode(sampleQty, waitTime);}
}

float getScaleValueAvg(int sampleQty, int waitTime) {
  float total = 0;
  for (int i=0; i<sampleQty; i++) {total += readWeight(waitTime);}
  return total/sampleQty;
}

float getScaleValueQuartileAvg(int sampleQty, int waitTime) {
  float samples[sampleQty] = {};
  for (int i=0; i<sampleQty; i++) {samples[i] = readWeight(waitTime);}
  qsort(samples, sampleQty, sizeof(samples[0]), sort);
  int lower_limit = floor(sampleQty/4);
  int upper_limit = ceil(3*sampleQty/4);
  float total = 0.0;
  for (int i=lower_limit; i<upper_limit; i++) {total += samples[i];}
  return total/(upper_limit-lower_limit);
}

float getScaleValueMode(int sampleQty, int waitTime) {
  float samples[sampleQty] = {};
  for (int i=0; i<sampleQty; i++) {samples[i] = readWeight(waitTime);}
  return getMode(samples, 0, sampleQty);
}

float getScaleValueQuartileMode(int sampleQty, int waitTime) {
  float samples[sampleQty] = {};
  for (int i=0; i<sampleQty; i++) {samples[i] = readWeight(waitTime);}
  qsort(samples, sampleQty, sizeof(samples[0]), sort);
  return getMode(samples, floor(sampleQty/4), ceil(3*sampleQty/4));
}
