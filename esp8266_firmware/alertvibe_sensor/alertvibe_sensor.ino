/**
 * AlertVibe - ESP32 Vibration Sensor Firmware
 * Hardware: ESP32 + SW-40 Vibration Sensor + 5 LEDs
 *
 * Wiring:
 *   SW-40 VCC  → 3.3V
 *   SW-40 GND  → GND
 *   SW-40 DO   → GPIO4
 *
 *   GREEN  LED → GPIO5  — WiFi connected
 *   BLUE   LED → GPIO16 — Low detection
 *   YELLOW LED → GPIO17 — Medium detection
 *   RED    LED → GPIO18 — Hard / critical threat
 *   BLUE   LED → GPIO19 — Safe, device working
 *
 *   (Each LED anode → pin through 220Ω resistor, cathode → GND)
 *
 * Detection levels:
 *   2–3  pulses → LOW    (BLUE GPIO16 on,  low alert sent after window)
 *   4–5  pulses → MEDIUM (YELLOW on,       medium alert sent after window)
 *   6+   pulses → HIGH   (RED on,          high/critical alert sent immediately)
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <Preferences.h>

// ─── CONFIGURE THESE ────────────────────────────────────────────────────────
const char* DEFAULT_SSID     = "SIGIDAS";
const char* DEFAULT_PASSWORD = "Lolipop123";

// LOCAL backend:
// const char* BACKEND_URL      = "http://192.168.1.146:4000/api/alerts";
// const char* WIFI_CONFIG_URL  = "http://192.168.1.146:4000/api/motorcycles/wifi/config";

// PRODUCTION — Render cloud backend (HTTPS)
const char* BACKEND_URL     = "https://alervibe-bckend.onrender.com/api/alerts";
const char* WIFI_CONFIG_URL = "https://alervibe-bckend.onrender.com/api/motorcycles/wifi/config";

const char* DEVICE_ID        = "motorcycle-01";
const char* LOCATION         = "Motorcycle";
// ────────────────────────────────────────────────────────────────────────────

// Dynamic WiFi credentials (loaded from NVS or defaults)
char currentSsid[64];
char currentPassword[64];

Preferences prefs;

// Pin assignments (ESP32 uses direct GPIO numbers)
#define VIBRATION_PIN   4    // GPIO4  — SW-40 data output (active LOW)

#define LED_GREEN       5    // GPIO5  — WiFi connected
#define LED_BLUE_LOW    16   // GPIO16 — Low detection
#define LED_YELLOW      17   // GPIO17 — Medium detection
#define LED_RED         18   // GPIO18 — Hard / critical threat
#define LED_BLUE_SAFE   19   // GPIO19 — Safe / device working

// Detection thresholds (pulse count within PULSE_WINDOW_MS)
#define LOW_THRESHOLD   1    // 1–2  pulses → light    (gentle vibration)
#define MED_THRESHOLD   3    // 3–5  pulses → moderate (noticeable shake)
#define HIGH_THRESHOLD  6    // 6+   pulses → strong   (hard/repeated shake)

// Timing (milliseconds)
#define DEBOUNCE_MS     150
#define COOLDOWN_MS     5000
#define WIFI_TIMEOUT    20000
#define LED_HOLD_MS     300
#define PULSE_WINDOW_MS 15000

// ─── State ───────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;
bool          vibrating         = false;
int           pulseCount        = 0;
int           lastSentLevel     = 0;   // highest level already alerted in current window: 0=none 1=low 2=med 3=high
int           sensorTriggerLevel = LOW;  // auto-detected in setup()

// ─── NVS Credential Helpers ───────────────────────────────────────────────────
void loadCredentials() {
  prefs.begin("alertvibe", true);
  String ssid = prefs.getString("wifi_ssid", "");
  String pass = prefs.getString("wifi_pass", "");
  prefs.end();

  if (ssid.length() > 0) {
    ssid.toCharArray(currentSsid, sizeof(currentSsid));
    pass.toCharArray(currentPassword, sizeof(currentPassword));
    Serial.println("Loaded WiFi from NVS: " + ssid);
  } else {
    strncpy(currentSsid, DEFAULT_SSID, sizeof(currentSsid) - 1);
    strncpy(currentPassword, DEFAULT_PASSWORD, sizeof(currentPassword) - 1);
    Serial.println("Using default WiFi credentials");
  }
}

void saveCredentials(const String& ssid, const String& pass) {
  prefs.begin("alertvibe", false);
  prefs.putString("wifi_ssid", ssid);
  prefs.putString("wifi_pass", pass);
  prefs.end();
  Serial.println("WiFi credentials saved to NVS");
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

  WiFiClientSecure client;
  client.setInsecure();
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
  WiFi.persistent(false);
  WiFi.disconnect(true);
  delay(200);

  Serial.print("Connecting to WiFi: ");
  Serial.println(currentSsid);

  allLedsOff();
  digitalWrite(LED_BLUE_SAFE, HIGH);   // Device is alive

  WiFi.mode(WIFI_STA);
  WiFi.begin(currentSsid, currentPassword);

  unsigned long start = millis();
  bool blink = false;
  int attempts = 0;

  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT) {
      attempts++;
      Serial.printf("\nWiFi timeout (attempt %d)\n", attempts);
      if (attempts >= 3) {
        strncpy(currentSsid,     DEFAULT_SSID,    sizeof(currentSsid) - 1);
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
  WiFiClientSecure secureClient;
  secureClient.setInsecure();  // skip cert validation for Render HTTPS
  http.begin(secureClient, BACKEND_URL);
  http.setTimeout(30000);  // Render free tier can take up to 30s on cold start
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

  // Allow first alert immediately — guard against unsigned underflow
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
  bool sensorTriggered = (digitalRead(VIBRATION_PIN) == LOW);
  unsigned long now    = millis();

  // ── Count pulses ────────────────────────────────────────────────────────
  if (sensorTriggered) {
    lastVibrationTime = now;

    if (!vibrating) {
      vibrating = true;

      if (now - pulseWindowStart > PULSE_WINDOW_MS) {
        pulseCount       = 0;
        pulseWindowStart = now;
        // lastSentLevel intentionally NOT reset — escalation persists across windows
      }

      pulseCount++;
      Serial.print("Pulse! Count: ");
      Serial.println(pulseCount);

      // LED reflects current level (only lights up at LOW_THRESHOLD+)
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

  // ── Escalating alerts: fire immediately each time a new level is crossed ─
  int currentLevel = 0;
  if      (pulseCount >= HIGH_THRESHOLD) currentLevel = 3;
  else if (pulseCount >= MED_THRESHOLD)  currentLevel = 2;
  else if (pulseCount >= LOW_THRESHOLD)  currentLevel = 1;

  // Escalations within the same window skip the cooldown;
  // only the very first alert of a new burst checks cooldown.
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

  // ── Pulse window expiry: reset counter, restore safe LEDs ──────────────
  if (!vibrating && (now - pulseWindowStart > PULSE_WINDOW_MS) && pulseCount > 0) {
    Serial.print("Window expired. Pulses: ");
    Serial.println(pulseCount);
    pulseCount = 0;
    setSafeState();  // LEDs back to safe — lastSentLevel kept for escalation
  }

  // ── After full cooldown silence: reset escalation sequence ──────────────
  if (lastSentLevel > 0 && !vibrating && pulseCount == 0
      && (now - lastAlertTime >= COOLDOWN_MS)) {
    Serial.println("Cooldown complete. Ready for new alert sequence.");
    lastSentLevel = 0;
  }

  delay(5);
}
