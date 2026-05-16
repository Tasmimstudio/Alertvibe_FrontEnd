/**
 * AlertVibe - ESP8266 Vibration Sensor Firmware
 * Hardware: ESP8266 NodeMCU + SW-40 Vibration Sensor + 5 LEDs
 *
 * Wiring:
 *   SW-40 VCC  → 3.3V
 *   SW-40 GND  → GND
 *   SW-40 DO   → D2  (GPIO4)
 *
 *   GREEN  LED → D1  (GPIO5)  — WiFi connected
 *   BLUE   LED → D0  (GPIO16) — Low detection
 *   YELLOW LED → D5  (GPIO14) — Medium detection
 *   RED    LED → D6  (GPIO12) — Hard / critical threat
 *   BLUE   LED → D7  (GPIO13) — Safe, device working
 *
 *   (Each LED anode → pin through 220Ω resistor, cathode → GND)
 *
 * Detection levels:
 *   2+  pulses → LOW    (BLUE D0 on)
 *   3+  pulses → MEDIUM (YELLOW on)
 *   5+  pulses → HARD   (RED on, alert sent)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <EEPROM.h>

// ─── CONFIGURE THESE ────────────────────────────────────────────────────────
const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

// LOCAL backend (same WiFi as the ESP8266 — no sleep/timeout issues)
// const char* BACKEND_URL      = "http://192.168.1.146:4000/api/alerts";
// const char* WIFI_CONFIG_URL  = "http://192.168.1.146:4000/api/motorcycles/wifi/config";

// PRODUCTION — Render cloud backend (HTTPS)
const char* BACKEND_URL     = "https://alervibe-bckend.onrender.com/api/alerts";
const char* WIFI_CONFIG_URL = "https://alervibe-bckend.onrender.com/api/motorcycles/wifi/config";

const char* DEVICE_ID        = "motorcycle-02";
const char* LOCATION         = "Motorcycle";
// ────────────────────────────────────────────────────────────────────────────

// Dynamic WiFi credentials (loaded from EEPROM or defaults)
char currentSsid[64];
char currentPassword[64];

// EEPROM layout — magic byte at 0 guards against stale/corrupt reads
#define EEPROM_MAGIC  0xAB
#define EEPROM_SIZE   129
#define MAGIC_OFFSET    0
#define SSID_OFFSET     1
#define PASS_OFFSET    65

// Pin assignments (NodeMCU GPIO numbers)
#define VIBRATION_PIN   4    // D2  — SW-40 data output (active LOW)

#define LED_GREEN       5    // D1  — WiFi connected
#define LED_BLUE_LOW   16    // D0  — Low detection
#define LED_YELLOW     14    // D5  — Medium detection
#define LED_RED        12    // D6  — Hard / critical threat
#define LED_BLUE_SAFE  13    // D7  — Safe / device working

// Detection thresholds (pulse count)
#define LOW_THRESHOLD   1    // 1+  pulses  → low
#define MED_THRESHOLD   2    // 2+  pulses  → medium
#define HIGH_THRESHOLD  3    // 3+  pulses  → alert (lowered for testing; set to 5 for production)

// Timing (milliseconds)
#define DEBOUNCE_MS     20
#define COOLDOWN_MS     5000
#define WIFI_TIMEOUT    20000
#define LED_HOLD_MS     100
#define PULSE_WINDOW_MS 3000

// ─── State ───────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;
bool          vibrating         = false;
int           pulseCount        = 0;
int           sensorTriggerLevel = LOW;  // auto-detected in setup()

// ─── EEPROM Credential Helpers (replaces ESP32 NVS / Preferences) ────────────
void loadCredentials() {
  EEPROM.begin(EEPROM_SIZE);
  uint8_t magic = EEPROM.read(MAGIC_OFFSET);
  char ssid[64] = {0};
  char pass[64] = {0};
  if (magic == EEPROM_MAGIC) {
    for (int i = 0; i < 63; i++) ssid[i] = (char)EEPROM.read(SSID_OFFSET + i);
    for (int i = 0; i < 63; i++) pass[i] = (char)EEPROM.read(PASS_OFFSET + i);
  }
  EEPROM.end();

  if (magic == EEPROM_MAGIC && strlen(ssid) > 0) {
    strncpy(currentSsid, ssid, sizeof(currentSsid) - 1);
    strncpy(currentPassword, pass, sizeof(currentPassword) - 1);
    Serial.println("Loaded WiFi from EEPROM: " + String(ssid));
  } else {
    strncpy(currentSsid, DEFAULT_SSID, sizeof(currentSsid) - 1);
    strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);
    Serial.println("Using default WiFi credentials");
  }
}

void saveCredentials(const String& ssid, const String& pass) {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.write(MAGIC_OFFSET, EEPROM_MAGIC);
  for (int i = 0; i < 64; i++)
    EEPROM.write(SSID_OFFSET + i, i < (int)ssid.length() ? ssid[i] : 0);
  for (int i = 0; i < 64; i++)
    EEPROM.write(PASS_OFFSET + i, i < (int)pass.length() ? pass[i] : 0);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("WiFi credentials saved to EEPROM");
}

// Simple JSON string extractor — returns value of a quoted key, or "" if null/missing
String extractJsonString(const String& json, const String& key) {
  String searchKey = "\"" + key + "\":\"";
  int start = json.indexOf(searchKey);
  if (start == -1) return "";
  start += searchKey.length();
  int end = json.indexOf("\"", start);
  if (end == -1) return "";
  return json.substring(start, end);
}

// Polls backend for WiFi config; saves and restarts if credentials changed
void checkWifiConfigUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  BearSSL::WiFiClientSecure client;
  client.setInsecure();  // skip cert validation — fine for internal config polling
  HTTPClient http;

  String url = String(WIFI_CONFIG_URL) + "?deviceId=" + String(DEVICE_ID);
  http.begin(client, url);
  http.setTimeout(30000);

  int code = http.GET();
  if (code == 200) {
    String body = http.getString();
    String newSsid = extractJsonString(body, "ssid");
    String newPass = extractJsonString(body, "password");

    if (newSsid.length() > 0 && newSsid != String(currentSsid)) {
      Serial.println("New WiFi config from backend: " + newSsid);
      saveCredentials(newSsid, newPass);
      http.end();
      delay(500);
      Serial.println("Restarting to apply new WiFi config...");
      delay(500);
      ESP.restart();
    }
  }
  http.end();
}

// ─── LED Helpers ─────────────────────────────────────────────────────────────
void allLedsOff() {
  digitalWrite(LED_GREEN,     LOW);
  digitalWrite(LED_BLUE_LOW,  LOW);
  digitalWrite(LED_YELLOW,    LOW);
  digitalWrite(LED_RED,       LOW);
  digitalWrite(LED_BLUE_SAFE, LOW);
}

void setSafeState() {
  allLedsOff();
  digitalWrite(LED_GREEN,     HIGH);
  digitalWrite(LED_BLUE_SAFE, HIGH);
}

// ─── WiFi ─────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(currentSsid);

  allLedsOff();
  digitalWrite(LED_BLUE_SAFE, HIGH);   // Device is alive

  WiFi.mode(WIFI_STA);
  WiFi.begin(currentSsid, currentPassword);

  unsigned long start = millis();
  bool blink = false;
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT) {
      Serial.println("\nWiFi timeout — restarting");
      allLedsOff();
      delay(1500);
      ESP.restart();
    }
    // Blink green while connecting
    blink = !blink;
    digitalWrite(LED_GREEN, blink ? HIGH : LOW);
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  setSafeState();
  delay(2000);
}

// ─── Alert ────────────────────────────────────────────────────────────────────
bool sendAlert(int count) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting");
    connectWiFi();
  }

  HTTPClient http;
  BearSSL::WiFiClientSecure secureClient;
  secureClient.setInsecure();  // skip cert validation for Render HTTPS
  http.begin(secureClient, BACKEND_URL);
  http.setTimeout(30000);  // Render free tier can take up to 30s on cold start
  http.addHeader("Content-Type", "application/json");

  const char* sev;
  const char* msg;
  if (count >= HIGH_THRESHOLD * 2) {
    sev = "critical";
    msg = "Extreme vibration detected. Motorcycle may be under attack!";
  } else if (count >= HIGH_THRESHOLD) {
    sev = "high";
    msg = "Strong vibration detected. Possible tampering in progress!";
  } else {
    sev = "medium";
    msg = "Low-level vibration detected. Stay alert.";
  }

  String payload = "{\"deviceId\":\"";
  payload += DEVICE_ID;
  payload += "\",\"message\":\"";
  payload += msg;
  payload += "\",\"severity\":\"";
  payload += sev;
  payload += "\",\"meta\":{\"location\":\"";
  payload += LOCATION;
  payload += "\",\"pulseCount\":";
  payload += count;
  payload += "}}";

  Serial.print("POST → ");
  Serial.println(payload);

  int httpCode = http.POST(payload);
  bool success = (httpCode >= 200 && httpCode < 300);

  if (success) {
    Serial.println("Alert sent!");
    // Flash RED 3 times to confirm alert sent
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_RED, HIGH); delay(200);
      digitalWrite(LED_RED, LOW);  delay(200);
    }
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpCode);
    // Flash YELLOW to indicate send failure
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_YELLOW, HIGH); delay(200);
      digitalWrite(LED_YELLOW, LOW);  delay(200);
    }
  }

  http.end();
  return success;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== AlertVibe Sensor Starting ===");

  pinMode(LED_GREEN,     OUTPUT);
  pinMode(LED_BLUE_LOW,  OUTPUT);
  pinMode(LED_YELLOW,    OUTPUT);
  pinMode(LED_RED,       OUTPUT);
  pinMode(LED_BLUE_SAFE, OUTPUT);
  allLedsOff();

  // Startup blink — all LEDs on briefly
  digitalWrite(LED_GREEN,     HIGH);
  digitalWrite(LED_BLUE_LOW,  HIGH);
  digitalWrite(LED_YELLOW,    HIGH);
  digitalWrite(LED_RED,       HIGH);
  digitalWrite(LED_BLUE_SAFE, HIGH);
  delay(800);
  allLedsOff();
  delay(200);

  pinMode(VIBRATION_PIN, INPUT_PULLUP);

  // Auto-detect sensor polarity: sample 30 readings to find idle state
  int highCount = 0;
  for (int i = 0; i < 30; i++) { if (digitalRead(VIBRATION_PIN) == HIGH) highCount++; delay(10); }
  sensorTriggerLevel = (highCount > 15) ? LOW : HIGH;
  Serial.println("Sensor idle: " + String(highCount > 15 ? "HIGH" : "LOW") + " → trigger on: " + String(sensorTriggerLevel == LOW ? "LOW" : "HIGH"));

  loadCredentials();
  connectWiFi();
  checkWifiConfigUpdate();  // Apply any pending config change from dashboard

  // Allow the first alert immediately — guard against unsigned underflow
  unsigned long now_setup = millis();
  lastAlertTime = (now_setup >= COOLDOWN_MS) ? now_setup - COOLDOWN_MS : 0;

  Serial.println("Monitoring for vibration...");
  Serial.print("LOW  threshold : "); Serial.print(LOW_THRESHOLD);  Serial.println(" pulses");
  Serial.print("MED  threshold : "); Serial.print(MED_THRESHOLD);  Serial.println(" pulses");
  Serial.print("HIGH threshold : "); Serial.print(HIGH_THRESHOLD); Serial.println(" pulses → Alert");

  setSafeState();
}

// ─── Main Loop ────────────────────────────────────────────────────────────────
void loop() {
  bool sensorTriggered = (digitalRead(VIBRATION_PIN) == sensorTriggerLevel);
  unsigned long now    = millis();

  // ── Periodic WiFi reconnect (every 30s) ─────────────────────────────────
  static unsigned long lastWifiCheck = 0;
  if (now - lastWifiCheck > 30000) {
    lastWifiCheck = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi dropped — reconnecting");
      connectWiFi();
    }
  }

  // ── Count pulses ────────────────────────────────────────────────────────
  if (sensorTriggered) {
    lastVibrationTime = now;

    if (!vibrating) {
      vibrating = true;

      if (now - pulseWindowStart > PULSE_WINDOW_MS) {
        pulseCount       = 0;
        pulseWindowStart = now;
      }

      pulseCount++;
      Serial.print("Pulse! Count: ");
      Serial.println(pulseCount);

      // Update LEDs based on detection level
      if (pulseCount >= HIGH_THRESHOLD) {
        allLedsOff();
        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED,   HIGH);        // HARD — critical threat
        Serial.println("!! HARD — Critical Threat !!");
      } else if (pulseCount >= MED_THRESHOLD) {
        allLedsOff();
        digitalWrite(LED_GREEN,  HIGH);
        digitalWrite(LED_YELLOW, HIGH);       // MEDIUM detection
        Serial.println("MEDIUM detection");
      } else {
        allLedsOff();
        digitalWrite(LED_GREEN,    HIGH);
        digitalWrite(LED_BLUE_LOW, HIGH);     // LOW detection
        Serial.println("LOW detection");
      }
    }

  } else {
    if (vibrating && (now - lastVibrationTime >= LED_HOLD_MS)) {
      vibrating = false;
    }
  }

  // ── Send Alert at HIGH threshold ────────────────────────────────────────
  bool alertReady = (pulseCount >= HIGH_THRESHOLD)
                 && (now - lastAlertTime    >= COOLDOWN_MS)
                 && (now - pulseWindowStart >= DEBOUNCE_MS);

  if (alertReady) {
    Serial.println("=== ALERT THRESHOLD REACHED ===");
    lastAlertTime = now;
    int countToSend = pulseCount;
    pulseCount = 0;

    sendAlert(countToSend);

    delay(2000);
    setSafeState();
  }

  // ── Reset after pulse window expires ────────────────────────────────────
  if (!vibrating && (now - pulseWindowStart > PULSE_WINDOW_MS) && pulseCount > 0) {
    Serial.print("Window expired. Pulses this round: ");
    Serial.println(pulseCount);
    pulseCount = 0;
    setSafeState();
  }

  delay(5);
}
