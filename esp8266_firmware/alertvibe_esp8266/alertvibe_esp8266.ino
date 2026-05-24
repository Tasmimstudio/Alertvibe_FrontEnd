/**
 * AlertVibe - ESP8266 Vibration Sensor Firmware
 * Hardware: ESP8266 NodeMCU + SW-40 Vibration Sensor + 5 LEDs
 *
 * Wiring:
 *   SW-40 VCC  → 3.3V
 *   SW-40 GND  → GND
 *   SW-40 DO   → D5 (GPIO14)
 *
 *   GREEN  LED → D1 — WiFi connected
 *   BLUE   LED → D2 — Low detection
 *   YELLOW LED → D6 — Medium detection
 *   RED    LED → D7 — Hard / critical threat
 *   SAFE   LED → D0 — Safe, device working
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <EEPROM.h>

// ─── CONFIG ────────────────────────────────────────────────────────────────
const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

const char* BACKEND_URL =
  "https://alervibe-bckend.onrender.com/api/alerts";

const char* DEVICE_ID = "motorcycle-02";
const char* LOCATION  = "Motorcycle";

// ─── PINS ──────────────────────────────────────────────────────────────────
#define VIBRATION_PIN   D5

#define LED_GREEN       D1
#define LED_BLUE_LOW    D2
#define LED_YELLOW      D6
#define LED_RED         D7
#define LED_SAFE        D0

// ─── THRESHOLDS ────────────────────────────────────────────────────────────
#define LOW_THRESHOLD   1
#define MED_THRESHOLD   3
#define HIGH_THRESHOLD  6

// ─── TIMING ────────────────────────────────────────────────────────────────
#define DEBOUNCE_MS      150
#define COOLDOWN_MS      5000
#define WIFI_TIMEOUT     20000
#define LED_HOLD_MS      50
#define PULSE_WINDOW_MS  15000

// ─── STATE ─────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;

bool vibrating = false;

int pulseCount         = 0;
int lastSentLevel      = 0;
int sensorTriggerLevel = LOW;

// ─── WIFI CREDS ────────────────────────────────────────────────────────────
char currentSsid[64];
char currentPassword[64];

// ─── LED HELPERS ───────────────────────────────────────────────────────────
void allLedsOff() {
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE_LOW, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_SAFE, LOW);
}

void setSafeState() {
  allLedsOff();

  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_SAFE, HIGH);
}

// ─── WIFI ──────────────────────────────────────────────────────────────────
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.disconnect();

  delay(200);

  Serial.print("Connecting to WiFi: ");
  Serial.println(currentSsid);

  WiFi.begin(currentSsid, currentPassword);

  unsigned long start = millis();

  bool blink = false;

  while (WiFi.status() != WL_CONNECTED) {

    if (millis() - start > WIFI_TIMEOUT) {
      Serial.println("\nWiFi timeout. Restarting...");
      ESP.restart();
    }

    blink = !blink;

    digitalWrite(LED_GREEN, blink);

    Serial.print(".");

    delay(500);
  }

  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  setSafeState();

  delay(1000);
}

// ─── ALERT ─────────────────────────────────────────────────────────────────
bool sendAlert(int count) {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  std::unique_ptr<BearSSL::WiFiClientSecure> client(
    new BearSSL::WiFiClientSecure);

  client->setInsecure();

  HTTPClient http;

  http.begin(*client, BACKEND_URL);
  http.setTimeout(30000);
  http.addHeader("Content-Type", "application/json");

  const char* sev;
  const char* msg;

  if (count >= HIGH_THRESHOLD) {
    sev = "strong";
    msg = "Strong vibration detected. Possible tampering!";
  }
  else if (count >= MED_THRESHOLD) {
    sev = "moderate";
    msg = "Moderate vibration detected.";
  }
  else {
    sev = "light";
    msg = "Low vibration detected.";
  }

  String payload = "{";
  payload += "\"deviceId\":\"";
  payload += DEVICE_ID;
  payload += "\",";
  payload += "\"message\":\"";
  payload += msg;
  payload += "\",";
  payload += "\"severity\":\"";
  payload += sev;
  payload += "\",";
  payload += "\"meta\":{";
  payload += "\"location\":\"";
  payload += LOCATION;
  payload += "\",";
  payload += "\"pulseCount\":";
  payload += String(count);
  payload += "}}";

  Serial.println("POST →");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  bool success = (httpCode >= 200 && httpCode < 300);

  if (success) {

    Serial.println("Alert sent!");

    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_RED, HIGH);
      delay(200);
      digitalWrite(LED_RED, LOW);
      delay(200);
    }

  } else {

    Serial.print("HTTP Error: ");
    Serial.println(httpCode);

    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_YELLOW, HIGH);
      delay(200);
      digitalWrite(LED_YELLOW, LOW);
      delay(200);
    }
  }

  http.end();

  return success;
}

// ─── SETUP ─────────────────────────────────────────────────────────────────
void setup() {

  Serial.begin(115200);

  delay(100);

  Serial.println("\n=== AlertVibe ESP8266 Starting ===");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE_LOW, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_SAFE, OUTPUT);

  allLedsOff();

  // Startup LED test
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_BLUE_LOW, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_SAFE, HIGH);

  delay(1000);

  allLedsOff();

  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  // Auto-detect polarity
  int highCount = 0;

  for (int i = 0; i < 30; i++) {

    int reading = digitalRead(VIBRATION_PIN);

    Serial.print("PIN raw: ");
    Serial.println(reading);

    if (reading == HIGH) {
      highCount++;
    }

    delay(10);
  }

  sensorTriggerLevel = (highCount > 15) ? LOW : HIGH;

  Serial.print("Sensor idle: ");
  Serial.print((highCount > 15) ? "HIGH" : "LOW");
  Serial.print(" → trigger on ");
  Serial.println((sensorTriggerLevel == LOW) ? "LOW" : "HIGH");

  strncpy(currentSsid, DEFAULT_SSID, sizeof(currentSsid) - 1);
  strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);

  Serial.println("Using default WiFi credentials");

  connectWiFi();

  unsigned long nowSetup = millis();

  lastAlertTime =
    (nowSetup >= COOLDOWN_MS)
    ? nowSetup - COOLDOWN_MS
    : 0;

  Serial.println("Monitoring for vibration...");

  Serial.print("LOW  threshold : ");
  Serial.print(LOW_THRESHOLD);
  Serial.println(" pulses");

  Serial.print("MED  threshold : ");
  Serial.print(MED_THRESHOLD);
  Serial.println(" pulses");

  Serial.print("HIGH threshold : ");
  Serial.print(HIGH_THRESHOLD);
  Serial.println(" pulses → Alert");

  setSafeState();
}

// ─── LOOP ──────────────────────────────────────────────────────────────────
void loop() {

  bool sensorTriggered =
    (digitalRead(VIBRATION_PIN) == sensorTriggerLevel);

  unsigned long now = millis();

  // ─── DETECT PULSE ─────────────────────────────────────────────────────
  if (sensorTriggered) {

    lastVibrationTime = now;

    if (!vibrating) {

      vibrating = true;

      if (now - pulseWindowStart > PULSE_WINDOW_MS) {

        pulseCount = 0;

        pulseWindowStart = now;
      }

      pulseCount++;

      Serial.print("Pulse! Count: ");
      Serial.println(pulseCount);

      // ─── LED STATES ────────────────────────────────────────────────
      if (pulseCount >= HIGH_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED, HIGH);

        Serial.println("HIGH level");

      } else if (pulseCount >= MED_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_YELLOW, HIGH);

        Serial.println("MEDIUM level");

      } else if (pulseCount >= LOW_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_BLUE_LOW, HIGH);

        Serial.println("LOW level");
      }
    }

  } else {

    if (vibrating &&
        (now - lastVibrationTime >= LED_HOLD_MS)) {

      vibrating = false;
    }
  }

  // ─── ESCALATING ALERTS ────────────────────────────────────────────────
  int currentLevel = 0;

  if (pulseCount >= HIGH_THRESHOLD) {
    currentLevel = 3;
  }
  else if (pulseCount >= MED_THRESHOLD) {
    currentLevel = 2;
  }
  else if (pulseCount >= LOW_THRESHOLD) {
    currentLevel = 1;
  }

  bool cooldownOk =
    (lastSentLevel > 0) ||
    (now - lastAlertTime >= COOLDOWN_MS);

  if (currentLevel > lastSentLevel && cooldownOk) {

    lastSentLevel = currentLevel;

    lastAlertTime = now;

    if (currentLevel == 3) {
      Serial.println("=== HIGH ALERT ===");
    }
    else if (currentLevel == 2) {
      Serial.println("=== MEDIUM ALERT ===");
    }
    else {
      Serial.println("=== LOW ALERT ===");
    }

    sendAlert(pulseCount);

    delay(500);
  }

  // ─── WINDOW RESET ─────────────────────────────────────────────────────
  if (!vibrating &&
      (now - pulseWindowStart > PULSE_WINDOW_MS) &&
      pulseCount > 0) {

    Serial.print("Window expired. Pulses: ");
    Serial.println(pulseCount);

    pulseCount = 0;

    setSafeState();
  }

  // ─── RESET ESCALATION ─────────────────────────────────────────────────
  if (lastSentLevel > 0 &&
      !vibrating &&
      pulseCount == 0 &&
      (now - lastAlertTime >= COOLDOWN_MS)) {

    Serial.println("Cooldown complete. Ready again.");

    lastSentLevel = 0;
  }

  yield();
  delay(5);
}