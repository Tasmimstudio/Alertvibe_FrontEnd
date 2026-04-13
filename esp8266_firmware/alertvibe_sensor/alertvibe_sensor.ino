/**
 * AlertVibe - ESP8266 Vibration Sensor Firmware
 * Hardware: ESP8266 NodeMCU + SW-40 Vibration Sensor + 4 LEDs
 *
 * Wiring:
 *   SW-40 VCC  → 3.3V
 *   SW-40 GND  → GND
 *   SW-40 DO   → D2 (GPIO4)
 *
 *   D1 → 220Ω → Blue   LED (+) → LED (−) → GND   (WiFi status)
 *   D7 → 220Ω → Green  LED (+) → LED (−) → GND   (device monitoring)
 *   D6 → 220Ω → Yellow LED (+) → LED (−) → GND   (mild vibration)
 *   D5 → 220Ω → Red    LED (+) → LED (−) → GND   (alert threshold)
 *
 * LED Behavior:
 *   BLUE   — Slow blink = connecting to WiFi
 *            Solid ON   = WiFi connected
 *            OFF        = WiFi lost
 *   GREEN  — Solid ON = actively monitoring for vibration
 *   YELLOW — ON when pulse count reaches LOW_THRESHOLD  (mild vibration)
 *   RED    — ON when pulse count reaches HIGH_THRESHOLD (alert sent)
 *
 * Thresholds:
 *   LOW_THRESHOLD  = 3 pulses → Yellow LED only
 *   HIGH_THRESHOLD = 6 pulses → Red LED + send alert
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
#define RED_LED_PIN     D5   // GPIO14 — High vibration / alert sent
#define YELLOW_LED_PIN  D6   // GPIO12 — Mild vibration detected
#define GREEN_LED_PIN   D7   // GPIO13 — Device actively monitoring
#define BLUE_LED_PIN    D1   // GPIO5  — WiFi connection status

// Vibration thresholds (pulse count)
#define LOW_THRESHOLD   3    // Yellow LED ON  — mild vibration
#define HIGH_THRESHOLD  6    // Red LED ON     — alert triggered

// Timing (milliseconds)
#define DEBOUNCE_MS     50
#define COOLDOWN_MS     10000
#define WIFI_TIMEOUT    20000
#define LED_HOLD_MS     2000
#define PULSE_WINDOW_MS 3000   // Window to count pulses

// ─── State ───────────────────────────────────────────────────────────────────
unsigned long lastAlertTime     = 0;
unsigned long lastVibrationTime = 0;
unsigned long pulseWindowStart  = 0;
bool          vibrating         = false;
int           pulseCount        = 0;

// ─── LED Helpers ─────────────────────────────────────────────────────────────
void setBlue  (bool on) { digitalWrite(BLUE_LED_PIN,   on ? HIGH : LOW); }
void setGreen (bool on) { digitalWrite(GREEN_LED_PIN,  on ? HIGH : LOW); }
void setYellow(bool on) { digitalWrite(YELLOW_LED_PIN, on ? HIGH : LOW); }
void setRed   (bool on) { digitalWrite(RED_LED_PIN,    on ? HIGH : LOW); }

void allLedsOff() {
  setBlue(false);
  setGreen(false);
  setYellow(false);
  setRed(false);
}

void blinkAll(int times, int ms = 150) {
  for (int i = 0; i < times; i++) {
    setBlue(true); setGreen(true); setYellow(true); setRed(true); delay(ms);
    allLedsOff();                                                  delay(ms);
  }
}

void blinkRed(int times, int ms = 80) {
  for (int i = 0; i < times; i++) {
    setRed(true);  delay(ms);
    setRed(false); delay(ms);
  }
}

// ─── WiFi ─────────────────────────────────────────────────────────────────────
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);

  allLedsOff();
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED) {
    if (millis() - start > WIFI_TIMEOUT) {
      Serial.println("\nWiFi timeout — restarting");
      ESP.restart();
    }
    // Blue slow blink while connecting to WiFi
    setBlue(true);  delay(300);
    setBlue(false); delay(300);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("Connected! IP: ");
  Serial.println(WiFi.localIP());

  blinkAll(3);       // All 4 LEDs blink 3x = WiFi connected
  setBlue(true);     // Blue stays solid = WiFi connected
  setGreen(true);    // Green stays solid = device monitoring
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
  http.setTimeout(15000);   // 15s timeout — gives Render time to wake up
  http.addHeader("Content-Type", "application/json");

  // Severity scales with pulse count
  const char* sev = "high";
  if      (count >= HIGH_THRESHOLD * 2) sev = "critical";
  else if (count >= HIGH_THRESHOLD)     sev = "high";
  else                                  sev = "medium";

  // Build JSON payload
  String payload = "{\"deviceId\":\"";
  payload += DEVICE_ID;
  payload += "\",\"message\":\"Vibration detected - possible tampering!\",\"severity\":\"";
  payload += sev;
  payload += "\",\"meta\":{\"location\":\"";
  payload += LOCATION;
  payload += "\",\"pulseCount\":";
  payload += count;
  payload += "}}";

  Serial.print("POST → ");
  Serial.println(payload);

  ESP.wdtFeed();   // Feed watchdog before long HTTP request
  int httpCode = http.POST(payload);
  ESP.wdtFeed();   // Feed again after
  bool success = (httpCode == 200 || httpCode == 201);

  if (success) {
    Serial.println("Alert sent!");
    blinkRed(5, 80);    // Red rapid blink 5x = success
  } else {
    Serial.print("HTTP error: ");
    Serial.println(httpCode);
    blinkRed(2, 500);   // Red 2 slow blinks = error
  }

  http.end();
  return success;
}

// ─── Setup ────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  delay(100);
  Serial.println("\n=== AlertVibe Sensor Starting ===");

  pinMode(BLUE_LED_PIN,   OUTPUT);
  pinMode(GREEN_LED_PIN,  OUTPUT);
  pinMode(YELLOW_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN,    OUTPUT);
  pinMode(VIBRATION_PIN,  INPUT);

  allLedsOff();
  connectWiFi();

  Serial.println("Monitoring for vibration...");
  Serial.print("LOW  threshold: "); Serial.print(LOW_THRESHOLD);  Serial.println(" pulses → Yellow");
  Serial.print("HIGH threshold: "); Serial.print(HIGH_THRESHOLD); Serial.println(" pulses → Red + Alert");
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

      // Reset pulse window if it expired
      if (now - pulseWindowStart > PULSE_WINDOW_MS) {
        pulseCount       = 0;
        pulseWindowStart = now;
      }

      pulseCount++;
      Serial.print("Pulse! Count: ");
      Serial.println(pulseCount);
    }

  } else {
    if (vibrating && (now - lastVibrationTime >= LED_HOLD_MS)) {
      vibrating = false;
    }
  }

  // ── LED Threshold Display ───────────────────────────────────────────────
  if (pulseCount >= HIGH_THRESHOLD) {
    setYellow(true);
    setRed(true);                    // RED + YELLOW = alert level

  } else if (pulseCount >= LOW_THRESHOLD) {
    setYellow(true);
    setRed(false);                   // YELLOW only = mild vibration

  } else {
    setYellow(false);
    setRed(false);                   // GREEN only = idle
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

    // After alert: reset to green only
    setYellow(false);
    setRed(false);
    setGreen(true);
  }

  // ── Reset after pulse window expires ────────────────────────────────────
  if (!vibrating && (now - pulseWindowStart > PULSE_WINDOW_MS) && pulseCount > 0) {
    Serial.print("Window expired. Pulses this round: ");
    Serial.println(pulseCount);
    pulseCount = 0;
    setYellow(false);
    setRed(false);
  }

  // ── Blue LED tracks WiFi status in real time ─────────────────────────────
  if (WiFi.status() == WL_CONNECTED) {
    setBlue(true);   // Solid blue = WiFi connected
  } else {
    // Blink blue = WiFi dropped, trying to reconnect
    setBlue((now / 300) % 2 == 0);
  }

  delay(10);
}
