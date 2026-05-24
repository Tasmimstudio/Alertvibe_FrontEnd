/**
 * AlertVibe - ESP8266 Firmware (FIXED VERSION)
 * Hardware: ESP8266 NodeMCU + SW-40 Vibration Sensor + 5 LEDs
 *
 * SENSOR WIRING:
 *   SW-40 VCC → 3.3V
 *   SW-40 GND → GND
 *   SW-40 DO  → D2
 *
 * LED WIRING:
 *   D1 → GREEN  LED (WiFi)
 *   D0 → BLUE   LED (LOW)
 *   D5 → YELLOW LED (MEDIUM)
 *   D6 → RED    LED (HIGH)
 *   D7 → BLUE   LED (SAFE)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <EEPROM.h>

// ─────────────────────────────────────────────────────────────
// WIFI + BACKEND CONFIG
// ─────────────────────────────────────────────────────────────

const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

// LOCAL BACKEND
// const char* BACKEND_URL = "http://192.168.1.146:4000/api/alerts";

// PRODUCTION BACKEND
const char* BACKEND_URL =
  "https://alervibe-bckend.onrender.com/api/alerts";

const char* DEVICE_ID = "motorcycle-02";
const char* LOCATION  = "Motorcycle";

// ─────────────────────────────────────────────────────────────
// PIN DEFINITIONS
// ─────────────────────────────────────────────────────────────

#define VIBRATION_PIN D2

#define LED_GREEN     D1
#define LED_BLUE_LOW  D0
#define LED_YELLOW    D5
#define LED_RED       D6
#define LED_SAFE      D7

// ─────────────────────────────────────────────────────────────
// DETECTION THRESHOLDS
// ─────────────────────────────────────────────────────────────

#define LOW_THRESHOLD   1
#define MED_THRESHOLD   2
#define HIGH_THRESHOLD  3

// ─────────────────────────────────────────────────────────────
// TIMING
// ─────────────────────────────────────────────────────────────

#define DEBOUNCE_MS      20
#define COOLDOWN_MS      5000
#define PULSE_WINDOW_MS  3000
#define WIFI_TIMEOUT     20000
#define LED_HOLD_MS      50

// ─────────────────────────────────────────────────────────────
// STATE VARIABLES
// ─────────────────────────────────────────────────────────────

unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;

bool vibrating = false;

int pulseCount    = 0;
int lastSentLevel = 0;

// ─────────────────────────────────────────────────────────────
// LED HELPERS
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// WIFI CONNECTION
// ─────────────────────────────────────────────────────────────

void connectWiFi() {

  WiFi.mode(WIFI_STA);

  Serial.print("Connecting to WiFi: ");
  Serial.println(DEFAULT_SSID);

  WiFi.begin(DEFAULT_SSID, DEFAULT_PASSWORD);

  unsigned long start = millis();

  bool blink = false;

  while (WiFi.status() != WL_CONNECTED) {

    if (millis() - start > WIFI_TIMEOUT) {

      Serial.println("\nWiFi Timeout. Restarting...");
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
}

// ─────────────────────────────────────────────────────────────
// SEND ALERT
// ─────────────────────────────────────────────────────────────

bool sendAlert(int count) {

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  std::unique_ptr<BearSSL::WiFiClientSecure> client(
    new BearSSL::WiFiClientSecure);

  client->setInsecure();

  HTTPClient http;

  http.begin(*client, BACKEND_URL);

  http.addHeader("Content-Type", "application/json");

  const char* severity;
  const char* message;

  if (count >= HIGH_THRESHOLD) {

    severity = "strong";
    message  = "Strong vibration detected! Possible tampering.";

  } else if (count >= MED_THRESHOLD) {

    severity = "moderate";
    message  = "Moderate vibration detected.";

  } else {

    severity = "light";
    message  = "Low vibration detected.";
  }

  String payload = "{";

  payload += "\"deviceId\":\"";
  payload += DEVICE_ID;
  payload += "\",";

  payload += "\"message\":\"";
  payload += message;
  payload += "\",";

  payload += "\"severity\":\"";
  payload += severity;
  payload += "\",";

  payload += "\"meta\":{";

  payload += "\"location\":\"";
  payload += LOCATION;
  payload += "\",";

  payload += "\"pulseCount\":";
  payload += String(count);

  payload += "}}";

  Serial.println("POST:");
  Serial.println(payload);

  int httpCode = http.POST(payload);

  bool success = (httpCode >= 200 && httpCode < 300);

  if (success) {

    Serial.println("Alert Sent!");

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

// ─────────────────────────────────────────────────────────────
// SETUP
// ─────────────────────────────────────────────────────────────

void setup() {

  Serial.begin(115200);

  delay(100);

  Serial.println("\n=== ALERTVIBE ESP8266 STARTING ===");

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE_LOW, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_SAFE, OUTPUT);

  allLedsOff();

  // Startup LED Test
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_BLUE_LOW, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_SAFE, HIGH);

  delay(1000);

  allLedsOff();

  // SW-40 SENSOR
  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  Serial.println("Sensor idle: HIGH");
  Serial.println("Trigger on: LOW");

  connectWiFi();

  lastAlertTime = millis() - COOLDOWN_MS;

  Serial.println("Monitoring vibration...");
}

// ─────────────────────────────────────────────────────────────
// MAIN LOOP
// ─────────────────────────────────────────────────────────────

void loop() {

  int raw = digitalRead(VIBRATION_PIN);

  bool sensorTriggered = (raw == LOW);

  unsigned long now = millis();

  // DEBUG — print every 1s only
  static unsigned long lastDebug = 0;
  if (now - lastDebug >= 1000) {
    lastDebug = now;
    Serial.print("RAW: "); Serial.print(raw);
    Serial.print("  Triggered: "); Serial.println(sensorTriggered ? "YES" : "NO");
  }

  // ─────────────────────────────────────────────────────────
  // DETECT VIBRATION PULSE
  // ─────────────────────────────────────────────────────────

  if (sensorTriggered) {

    lastVibrationTime = now;

    if (!vibrating) {

      vibrating = true;

      // NEW WINDOW
      if (now - pulseWindowStart > PULSE_WINDOW_MS) {

        pulseCount = 0;

        pulseWindowStart = now;
      }

      pulseCount++;

      Serial.print("Pulse Count: ");
      Serial.println(pulseCount);

      // ─────────────────────────────────────────────
      // LED LEVELS
      // ─────────────────────────────────────────────

      if (pulseCount >= HIGH_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED, HIGH);

        Serial.println("HIGH LEVEL");

      } else if (pulseCount >= MED_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_YELLOW, HIGH);

        Serial.println("MEDIUM LEVEL");

      } else {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_BLUE_LOW, HIGH);

        Serial.println("LOW LEVEL");
      }
    }

  } else {

    if (vibrating &&
        (now - lastVibrationTime >= LED_HOLD_MS)) {

      vibrating = false;
    }
  }

  // ─────────────────────────────────────────────────────────
  // ESCALATING ALERTS
  // ─────────────────────────────────────────────────────────

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

  bool cooldownOK =
    (lastSentLevel > 0) ||
    (now - lastAlertTime >= COOLDOWN_MS);

  if (currentLevel > lastSentLevel && cooldownOK) {

    lastSentLevel = currentLevel;

    lastAlertTime = now;

    if (currentLevel == 3) {

      Serial.println("=== HIGH ALERT ===");

    } else if (currentLevel == 2) {

      Serial.println("=== MEDIUM ALERT ===");

    } else {

      Serial.println("=== LOW ALERT ===");
    }

    sendAlert(pulseCount);

    delay(500);
  }

  // ─────────────────────────────────────────────────────────
  // RESET WINDOW
  // ─────────────────────────────────────────────────────────

  if (!vibrating &&
      (now - pulseWindowStart > PULSE_WINDOW_MS) &&
      pulseCount > 0) {

    Serial.print("Window Expired. Pulses: ");
    Serial.println(pulseCount);

    pulseCount = 0;

    setSafeState();
  }

  // ─────────────────────────────────────────────────────────
  // RESET ALERT STATE
  // ─────────────────────────────────────────────────────────

  if (lastSentLevel > 0 &&
      pulseCount == 0 &&
      !vibrating &&
      (now - lastAlertTime >= COOLDOWN_MS)) {

    Serial.println("Cooldown complete.");

    lastSentLevel = 0;
  }

  yield();
  delay(10);
}