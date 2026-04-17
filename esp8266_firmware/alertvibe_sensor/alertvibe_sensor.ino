/**
 * AlertVibe - ESP8266 Vibration Sensor Firmware
 * Hardware: ESP8266 NodeMCU + SW-40 Vibration Sensor + 5 LEDs
 *
 * Wiring:
 *   SW-40 VCC  → 3.3V
 *   SW-40 GND  → GND
 *   SW-40 DO   → D2 (GPIO4)
 *
 *   GREEN  LED → D1 (GPIO5)  — WiFi connected
 *   BLUE   LED → D0 (GPIO16) — Low detection
 *   YELLOW LED → D5 (GPIO14) — Medium detection
 *   RED    LED → D6 (GPIO12) — Hard / critical threat
 *   BLUE   LED → D7 (GPIO13) — Safe, device working
 *
 *   (Each LED anode → pin through 220Ω resistor, cathode → GND)
 *
 * Detection levels:
 *   3+  pulses → LOW    (BLUE D0 on)
 *   5+  pulses → MEDIUM (YELLOW on)
 *   7+  pulses → HARD   (RED on, alert sent)
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ─── CONFIGURE THESE ────────────────────────────────────────────────────────
const char* WIFI_SSID     = "SIGIDAS";
const char* WIFI_PASSWORD = "Lolipop123";
const char* BACKEND_URL   = "https://alertvibe-backend.onrender.com/api/alerts";
const char* DEVICE_ID     = "motorcycle-01";
const char* LOCATION      = "Motorcycle";
// ────────────────────────────────────────────────────────────────────────────

// Pin assignments
#define VIBRATION_PIN   D2   // GPIO4  — SW-40 data output (active LOW)

#define LED_GREEN       D1   // GPIO5  — WiFi connected
#define LED_BLUE_LOW    D0   // GPIO16 — Low detection
#define LED_YELLOW      D5   // GPIO14 — Medium detection
#define LED_RED         D6   // GPIO12 — Hard / critical threat
#define LED_BLUE_SAFE   D7   // GPIO13 — Safe / device working

// Detection thresholds (pulse count)
#define LOW_THRESHOLD   3    // 3+  pulses  → low
#define MED_THRESHOLD   5    // 5+  pulses  → medium
#define HIGH_THRESHOLD  7    // 7+  pulses  → hard / alert

// Timing (milliseconds)
#define DEBOUNCE_MS     50
#define COOLDOWN_MS     10000
#define WIFI_TIMEOUT    20000
#define LED_HOLD_MS     150
#define PULSE_WINDOW_MS 4000

// ─── State ───────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;
bool          vibrating         = false;
int           pulseCount        = 0;

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
  Serial.println(WIFI_SSID);

  allLedsOff();
  digitalWrite(LED_BLUE_SAFE, HIGH);   // Device is alive

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

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

  WiFiClient client;
  HTTPClient http;

  http.begin(client, BACKEND_URL);
  http.setTimeout(15000);
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

  ESP.wdtFeed();
  int httpCode = http.POST(payload);
  ESP.wdtFeed();
  bool success = (httpCode == 200 || httpCode == 201);

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

  pinMode(VIBRATION_PIN, INPUT);

  connectWiFi();

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

  delay(10);
}
