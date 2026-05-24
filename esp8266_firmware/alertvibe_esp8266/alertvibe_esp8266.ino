/**
 * AlertVibe - Improved ESP8266 Vibration Sensor Firmware
 * Improved Threshold + Debounce Version
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <EEPROM.h>

// ─── CONFIG ────────────────────────────────────────────────────────────────
const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

const char* BACKEND_URL     = "https://alervibe-bckend.onrender.com/api/alerts";
const char* WIFI_CONFIG_URL = "https://alervibe-bckend.onrender.com/api/motorcycles/wifi/config";

const char* DEVICE_ID = "motorcycle-02";
const char* LOCATION  = "Motorcycle";

// ─── EEPROM ────────────────────────────────────────────────────────────────
#define EEPROM_MAGIC  0xAB
#define EEPROM_SIZE   129
#define MAGIC_OFFSET    0
#define SSID_OFFSET     1
#define PASS_OFFSET    65

char currentSsid[64];
char currentPassword[64];

// ─── PINS ──────────────────────────────────────────────────────────────────
#define VIBRATION_PIN   4    // D2

#define LED_GREEN       5    // D1
#define LED_BLUE_LOW   16    // D0
#define LED_YELLOW     14    // D5
#define LED_RED        12    // D6
#define LED_STATUS     13    // D7

// ─── THRESHOLDS ───────────────────────────────────────────────────────────
#define LOW_THRESHOLD      1
#define MED_THRESHOLD      3
#define HIGH_THRESHOLD     6

#define DEBOUNCE_MS        150
#define COOLDOWN_MS        5000
#define WIFI_TIMEOUT       20000
#define LED_HOLD_MS        50
#define PULSE_WINDOW_MS    15000

// ─── STATE ────────────────────────────────────────────────────────────────
unsigned long lastAlertTime      = 0;
unsigned long lastVibrationTime  = 0;
unsigned long pulseWindowStart   = 0;
unsigned long lastPulseDetected  = 0;

bool vibrating = false;

int pulseCount         = 0;
int lastSentLevel      = 0;
int sensorTriggerLevel = LOW;

// ─── EEPROM FUNCTIONS ─────────────────────────────────────────────────────
void loadCredentials() {

  EEPROM.begin(EEPROM_SIZE);

  uint8_t magic = EEPROM.read(MAGIC_OFFSET);

  char ssid[64] = {0};
  char pass[64] = {0};

  if (magic == EEPROM_MAGIC) {

    for (int i = 0; i < 63; i++) {
      ssid[i] = (char)EEPROM.read(SSID_OFFSET + i);
    }

    for (int i = 0; i < 63; i++) {
      pass[i] = (char)EEPROM.read(PASS_OFFSET + i);
    }
  }

  EEPROM.end();

  if (magic == EEPROM_MAGIC && strlen(ssid) > 0) {

    strncpy(currentSsid, ssid, sizeof(currentSsid) - 1);
    strncpy(currentPassword, pass, sizeof(currentPassword) - 1);

    Serial.println(F("Loaded WiFi from EEPROM"));

  } else {

    strncpy(currentSsid, DEFAULT_SSID, sizeof(currentSsid) - 1);
    strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);

    Serial.println(F("Using default WiFi"));
  }
}

void saveCredentials(const String& ssid, const String& pass) {

  EEPROM.begin(EEPROM_SIZE);

  EEPROM.write(MAGIC_OFFSET, EEPROM_MAGIC);

  for (int i = 0; i < 64; i++) {
    EEPROM.write(SSID_OFFSET + i,
                 i < (int)ssid.length() ? ssid[i] : 0);
  }

  for (int i = 0; i < 64; i++) {
    EEPROM.write(PASS_OFFSET + i,
                 i < (int)pass.length() ? pass[i] : 0);
  }

  EEPROM.commit();
  EEPROM.end();

  Serial.println(F("WiFi saved"));
}

// ─── JSON HELPER ───────────────────────────────────────────────────────────
String extractJsonString(const String& json, const String& key) {

  String searchKey = "\"" + key + "\":\"";

  int start = json.indexOf(searchKey);

  if (start == -1) return "";

  start += searchKey.length();

  int end = json.indexOf("\"", start);

  if (end == -1) return "";

  return json.substring(start, end);
}

// ─── CHECK WIFI UPDATE ────────────────────────────────────────────────────
void checkWifiConfigUpdate() {

  if (WiFi.status() != WL_CONNECTED) return;

  BearSSL::WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  String url = String(WIFI_CONFIG_URL) + "?deviceId=" + DEVICE_ID;

  http.begin(client, url);

  int code = http.GET();

  if (code == 200) {

    String body = http.getString();

    String newSsid = extractJsonString(body, "ssid");
    String newPass = extractJsonString(body, "password");

    if (newSsid.length() > 0 &&
        newSsid != String(currentSsid)) {

      saveCredentials(newSsid, newPass);

      delay(1000);

      ESP.restart();
    }
  }

  http.end();
}

// ─── LED HELPERS ──────────────────────────────────────────────────────────
void allLedsOff() {

  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_BLUE_LOW, LOW);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);
  digitalWrite(LED_STATUS, LOW);
}

void setSafeState() {

  allLedsOff();

  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_STATUS, HIGH);
}

// ─── WIFI ─────────────────────────────────────────────────────────────────
bool connectWiFi() {

  Serial.print(F("Connecting to WiFi: "));
  Serial.println(currentSsid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(currentSsid, currentPassword);

  unsigned long start = millis();

  bool blink = false;

  while (WiFi.status() != WL_CONNECTED) {

    yield();

    if (millis() - start > WIFI_TIMEOUT) {

      Serial.println(F("WiFi timeout"));

      return false;
    }

    blink = !blink;

    digitalWrite(LED_GREEN, blink);

    delay(500);

    Serial.print(".");
  }

  Serial.println();
  Serial.println(F("WiFi Connected"));

  setSafeState();

  return true;
}

// ─── SEND ALERT ───────────────────────────────────────────────────────────
bool sendAlert(int count) {

  if (WiFi.status() != WL_CONNECTED) {
    if (!connectWiFi()) {
      Serial.println(F("Alert skipped: WiFi unavailable"));
      return false;
    }
  }

  BearSSL::WiFiClientSecure client;
  client.setInsecure();

  HTTPClient http;

  http.begin(client, BACKEND_URL);

  http.setTimeout(30000);

  http.addHeader("Content-Type", "application/json");

  const char* sev;
  const char* msg;

  if (count >= HIGH_THRESHOLD) {

    sev = "strong";
    msg = "Strong vibration detected. Possible tampering in progress!";

  } else if (count >= MED_THRESHOLD) {

    sev = "moderate";
    msg = "Moderate vibration detected. Check on your motorcycle.";

  } else {

    sev = "light";
    msg = "Low-level vibration detected. Stay alert.";
  }

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"message\":\"" + String(msg) + "\",";
  payload += "\"severity\":\"" + String(sev) + "\",";
  payload += "\"meta\":{";
  payload += "\"location\":\"" + String(LOCATION) + "\",";
  payload += "\"pulseCount\":" + String(count);
  payload += "}}";

  Serial.println(F("Sending Alert:"));
  Serial.println(payload);

  int httpCode = http.POST(payload);

  bool success = (httpCode >= 200 && httpCode < 300);

  if (success) {

    Serial.println(F("Alert Sent"));

    for (int i = 0; i < 3; i++) {

      digitalWrite(LED_RED, HIGH);
      delay(200);

      digitalWrite(LED_RED, LOW);
      delay(200);
    }

  } else {

    Serial.print(F("HTTP Error: "));
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

// ─── SETUP ────────────────────────────────────────────────────────────────
void setup() {

  Serial.begin(115200);

  Serial.println(F("=== AlertVibe Starting ==="));

  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_BLUE_LOW, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_STATUS, OUTPUT);

  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  allLedsOff();

  // Startup animation
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_BLUE_LOW, HIGH);
  digitalWrite(LED_YELLOW, HIGH);
  digitalWrite(LED_RED, HIGH);
  digitalWrite(LED_STATUS, HIGH);

  delay(1000);

  allLedsOff();

  // Detect sensor polarity
  int highCount = 0;

  for (int i = 0; i < 30; i++) {

    if (digitalRead(VIBRATION_PIN) == HIGH) {
      highCount++;
    }

    delay(10);
  }

  sensorTriggerLevel = (highCount > 15) ? LOW : HIGH;

  loadCredentials();

  connectWiFi();

  checkWifiConfigUpdate();

  setSafeState();

  unsigned long setupNow = millis();
  lastAlertTime = (setupNow >= COOLDOWN_MS) ? setupNow - COOLDOWN_MS : 0;

  Serial.println(F("Monitoring vibration..."));
}

// ─── LOOP ─────────────────────────────────────────────────────────────────
void loop() {

  unsigned long now = millis();

  bool sensorTriggered =
      (digitalRead(VIBRATION_PIN) == sensorTriggerLevel);

  // ─── WIFI CHECK ────────────────────────────────────────────────────────
  static unsigned long lastWifiCheck = 0;

  if (now - lastWifiCheck > 30000) {

    lastWifiCheck = now;

    if (WiFi.status() != WL_CONNECTED) {

      Serial.println(F("WiFi Reconnecting"));

      connectWiFi();
    }
  }

  // ─── IMPROVED DEBOUNCE DETECTION ──────────────────────────────────────
  if (sensorTriggered &&
      (now - lastPulseDetected > DEBOUNCE_MS)) {

    lastPulseDetected = now;

    lastVibrationTime = now;

    if (!vibrating) {

      vibrating = true;

      if (now - pulseWindowStart > PULSE_WINDOW_MS) {

        pulseCount = 0;
        pulseWindowStart = now;
      }

      pulseCount++;

      Serial.print(F("Pulse Count: "));
      Serial.println(pulseCount);

      // ─── LED STATUS ───────────────────────────────────────────────────
      if (pulseCount >= HIGH_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED, HIGH);

        Serial.println(F("HIGH DETECTION"));

      } else if (pulseCount >= MED_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_YELLOW, HIGH);

        Serial.println(F("MEDIUM DETECTION"));

      } else if (pulseCount >= LOW_THRESHOLD) {

        allLedsOff();

        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_BLUE_LOW, HIGH);

        Serial.println(F("LOW DETECTION"));
      }
    }
  }

  // ─── RESET VIBRATION STATE ────────────────────────────────────────────
  if (!sensorTriggered &&
      vibrating &&
      (now - lastVibrationTime >= LED_HOLD_MS)) {

    vibrating = false;
  }

  // ─── DETERMINE ALERT LEVEL ────────────────────────────────────────────
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

  // ─── SEND ALERT ───────────────────────────────────────────────────────
  bool cooldownOk =
      (lastSentLevel > 0) ||
      (now - lastAlertTime >= COOLDOWN_MS);

  if (currentLevel > lastSentLevel && cooldownOk) {

    lastSentLevel = currentLevel;
    lastAlertTime = now;

    sendAlert(pulseCount);
  }

  // ─── WINDOW EXPIRED ───────────────────────────────────────────────────
  if (!vibrating &&
      (now - pulseWindowStart > PULSE_WINDOW_MS) &&
      pulseCount > 0) {

    Serial.print(F("Window Expired. Final Pulses: "));
    Serial.println(pulseCount);

    pulseCount = 0;

    lastSentLevel = 0;

    setSafeState();
  }

  delay(5);
}
