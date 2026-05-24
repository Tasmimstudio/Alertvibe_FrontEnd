/**
 * AlertVibe - ESP8266 Vibration Sensor Firmware
 * Ported from alertvibe_sensor.ino (ESP32) — identical logic, ESP8266 libraries
 *
 * Wiring:
 *   SW-420 VCC  → 3.3V
 *   SW-420 GND  → GND
 *   SW-420 DO   → D2 (GPIO4)
 *
 *   GREEN  LED → D1  (GPIO5)  — WiFi connected
 *   BLUE   LED → D0  (GPIO16) — Low detection
 *   YELLOW LED → D5  (GPIO14) — Medium detection
 *   RED    LED → D6  (GPIO12) — Strong / critical threat
 *   BLUE   LED → D7  (GPIO13) — Safe, device working
 *
 *   (Each LED anode → pin through 220Ω resistor, cathode → GND)
 *
 * Detection levels:
 *   1–2  pulses → light    (BLUE GPIO16 on)
 *   3–5  pulses → moderate (YELLOW on)
 *   6+   pulses → strong   (RED on, alert sent immediately)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecureBearSSL.h>
#include <EEPROM.h>

// ─── CONFIGURE THESE ────────────────────────────────────────────────────────
const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

const char* BACKEND_URL     = "https://alervibe-bckend.onrender.com/api/alerts";
const char* WIFI_CONFIG_URL = "https://alervibe-bckend.onrender.com/api/motorcycles/wifi/config";

const char* DEVICE_ID = "motorcycle-02";
const char* LOCATION  = "Motorcycle";
// ────────────────────────────────────────────────────────────────────────────

// Dynamic WiFi credentials
char currentSsid[64];
char currentPassword[64];

// ─── EEPROM ────────────────────────────────────────────────────────────────
#define EEPROM_MAGIC   0xAB
#define EEPROM_SIZE    129
#define MAGIC_OFFSET   0
#define SSID_OFFSET    1
#define PASS_OFFSET    65

// ─── PINS ──────────────────────────────────────────────────────────────────
#define VIBRATION_PIN   4    // D2  — SW-420 data output (active LOW)

#define LED_GREEN       5    // D1  — WiFi connected
#define LED_BLUE_LOW   16    // D0  — Low detection
#define LED_YELLOW     14    // D5  — Medium detection
#define LED_RED        12    // D6  — Strong / critical threat
#define LED_BLUE_SAFE  13    // D7  — Safe / device working

// ─── THRESHOLDS ───────────────────────────────────────────────────────────
#define LOW_THRESHOLD   1    // 1–2  pulses → light
#define MED_THRESHOLD   3    // 3–5  pulses → moderate
#define HIGH_THRESHOLD  6    // 6+   pulses → strong

// ─── TIMING ───────────────────────────────────────────────────────────────
#define COOLDOWN_MS     5000
#define WIFI_TIMEOUT    20000
#define LED_HOLD_MS     50
#define PULSE_WINDOW_MS 15000

// ─── STATE ────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;
bool          vibrating         = false;
int           pulseCount        = 0;
int           lastSentLevel     = 0;
int           idleLevel         = HIGH;

// ─── EEPROM CREDENTIAL HELPERS ────────────────────────────────────────────
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
    strncpy(currentSsid,     ssid, sizeof(currentSsid) - 1);
    strncpy(currentPassword, pass, sizeof(currentPassword) - 1);
    Serial.println("Loaded WiFi from EEPROM: " + String(currentSsid));
  } else {
    strncpy(currentSsid,     DEFAULT_SSID,     sizeof(currentSsid) - 1);
    strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);
    Serial.println("Using default WiFi credentials");
  }
}

void saveCredentials(const String& ssid, const String& pass) {
  EEPROM.begin(EEPROM_SIZE);
  EEPROM.write(MAGIC_OFFSET, EEPROM_MAGIC);
  for (int i = 0; i < 64; i++) EEPROM.write(SSID_OFFSET + i, i < (int)ssid.length() ? ssid[i] : 0);
  for (int i = 0; i < 64; i++) EEPROM.write(PASS_OFFSET + i, i < (int)pass.length() ? pass[i] : 0);
  EEPROM.commit();
  EEPROM.end();
  Serial.println("WiFi credentials saved to EEPROM");
}

// ─── JSON HELPER ──────────────────────────────────────────────────────────
String extractJsonString(const String& json, const String& key) {
  String searchKey = "\"" + key + "\":\"";
  int start = json.indexOf(searchKey);
  if (start == -1) return "";
  start += searchKey.length();
  int end = json.indexOf("\"", start);
  if (end == -1) return "";
  return json.substring(start, end);
}

// ─── WIFI CONFIG UPDATE ───────────────────────────────────────────────────
void checkWifiConfigUpdate() {
  if (WiFi.status() != WL_CONNECTED) return;

  BearSSL::WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  String url = String(WIFI_CONFIG_URL) + "?deviceId=" + String(DEVICE_ID);
  http.begin(client, url);
  http.setTimeout(30000);

  int code = http.GET();
  if (code == 200) {
    String body     = http.getString();
    String newSsid  = extractJsonString(body, "ssid");
    String newPass  = extractJsonString(body, "password");

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

// ─── LED HELPERS ──────────────────────────────────────────────────────────
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

// ─── WIFI ─────────────────────────────────────────────────────────────────
void connectWiFi() {
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(200);

  Serial.print("Connecting to WiFi: ");
  Serial.println(currentSsid);

  allLedsOff();
  digitalWrite(LED_BLUE_SAFE, HIGH);

  WiFi.mode(WIFI_STA);
  WiFi.begin(currentSsid, currentPassword);

  unsigned long start = millis();
  bool blink    = false;
  int  attempts = 0;

  while (WiFi.status() != WL_CONNECTED) {
    yield();
    if (millis() - start > WIFI_TIMEOUT) {
      attempts++;
      Serial.print("\nWiFi timeout (attempt ");
      Serial.print(attempts);
      Serial.println(")");
      if (attempts >= 3) {
        strncpy(currentSsid,     DEFAULT_SSID,     sizeof(currentSsid) - 1);
        strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);
        allLedsOff();
        delay(1000);
        ESP.restart();
      }
      WiFi.disconnect(true);
      delay(500);
      WiFi.begin(currentSsid, currentPassword);
      start = millis();
    }
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

// ─── ALERT ────────────────────────────────────────────────────────────────
bool sendAlert(int count) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi lost — reconnecting");
    connectWiFi();
  }

  BearSSL::WiFiClientSecure secureClient;
  secureClient.setInsecure();
  HTTPClient http;

  http.begin(secureClient, BACKEND_URL);
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
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_RED, HIGH); delay(200);
      digitalWrite(LED_RED, LOW);  delay(200);
    }
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpCode);
    for (int i = 0; i < 3; i++) {
      digitalWrite(LED_YELLOW, HIGH); delay(200);
      digitalWrite(LED_YELLOW, LOW);  delay(200);
    }
  }

  http.end();
  return success;
}

// ─── SETUP ────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== AlertVibe ESP8266 Starting ===");

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

  // Sample idle state — trigger fires on any deviation from this
  int highCount = 0;
  for (int i = 0; i < 30; i++) { if (digitalRead(VIBRATION_PIN) == HIGH) highCount++; delay(10); }
  idleLevel = (highCount > 15) ? HIGH : LOW;
  Serial.print("Sensor idle: "); Serial.println(idleLevel == HIGH ? "HIGH → trigger on LOW" : "LOW → trigger on HIGH");

  loadCredentials();
  connectWiFi();
  checkWifiConfigUpdate();

  // Allow first alert immediately
  unsigned long now_setup = millis();
  lastAlertTime = (now_setup >= COOLDOWN_MS) ? now_setup - COOLDOWN_MS : 0;

  Serial.println("Monitoring for vibration...");
  Serial.print("LOW  threshold : "); Serial.print(LOW_THRESHOLD);  Serial.println(" pulses");
  Serial.print("MED  threshold : "); Serial.print(MED_THRESHOLD);  Serial.println(" pulses");
  Serial.print("HIGH threshold : "); Serial.print(HIGH_THRESHOLD); Serial.println(" pulses → Alert");

  setSafeState();
}

// ─── MAIN LOOP ────────────────────────────────────────────────────────────
void loop() {
  bool sensorTriggered = (digitalRead(VIBRATION_PIN) != idleLevel);
  unsigned long now    = millis();

  // ── Debug: raw pin state every 1s ───────────────────────────────────────
  static unsigned long lastDebug = 0;
  if (now - lastDebug > 1000) {
    lastDebug = now;
    Serial.print("PIN raw: "); Serial.print(digitalRead(VIBRATION_PIN));
    Serial.print("  idle: "); Serial.print(idleLevel);
    Serial.print("  triggered: "); Serial.println(sensorTriggered ? "YES" : "NO");
  }

  // ── WiFi watchdog ────────────────────────────────────────────────────────
  static unsigned long lastWifiCheck = 0;
  if (now - lastWifiCheck > 30000) {
    lastWifiCheck = now;
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("WiFi lost — reconnecting");
      connectWiFi();
    }
  }

  // ── Count pulses ─────────────────────────────────────────────────────────
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

      if (pulseCount >= HIGH_THRESHOLD) {
        allLedsOff();
        digitalWrite(LED_GREEN, HIGH);
        digitalWrite(LED_RED,   HIGH);
        Serial.println("HIGH level");
      } else if (pulseCount >= MED_THRESHOLD) {
        allLedsOff();
        digitalWrite(LED_GREEN,  HIGH);
        digitalWrite(LED_YELLOW, HIGH);
        Serial.println("MEDIUM level");
      } else if (pulseCount >= LOW_THRESHOLD) {
        allLedsOff();
        digitalWrite(LED_GREEN,    HIGH);
        digitalWrite(LED_BLUE_LOW, HIGH);
        Serial.println("LOW level");
      }
    }

  } else {
    if (vibrating && (now - lastVibrationTime >= LED_HOLD_MS)) {
      vibrating = false;
    }
  }

  // ── Escalating alerts ────────────────────────────────────────────────────
  int currentLevel = 0;
  if      (pulseCount >= HIGH_THRESHOLD) currentLevel = 3;
  else if (pulseCount >= MED_THRESHOLD)  currentLevel = 2;
  else if (pulseCount >= LOW_THRESHOLD)  currentLevel = 1;

  bool cooldownOk = (lastSentLevel > 0) || (now - lastAlertTime >= COOLDOWN_MS);

  if (currentLevel > lastSentLevel && cooldownOk) {
    lastSentLevel = currentLevel;
    lastAlertTime = now;
    const char* label = (currentLevel == 3) ? "=== HIGH ALERT ===" :
                        (currentLevel == 2) ? "=== MEDIUM ALERT ===" : "=== LOW ALERT ===";
    Serial.println(label);
    sendAlert(pulseCount);
    delay(500);
  }

  // ── Pulse window expiry ──────────────────────────────────────────────────
  if (!vibrating && (now - pulseWindowStart > PULSE_WINDOW_MS) && pulseCount > 0) {
    Serial.print("Window expired. Pulses: ");
    Serial.println(pulseCount);
    pulseCount = 0;
    setSafeState();
  }

  // ── Cooldown reset ───────────────────────────────────────────────────────
  if (lastSentLevel > 0 && !vibrating && pulseCount == 0
      && (now - lastAlertTime >= COOLDOWN_MS)) {
    Serial.println("Cooldown complete. Ready for new alert sequence.");
    lastSentLevel = 0;
  }

  yield();
  delay(5);
}
