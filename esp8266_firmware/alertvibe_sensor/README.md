# AlertVibe — ESP32 Firmware (alertvibe_sensor)

Vibration sensor firmware for the AlertVibe security system.
Uses an **ESP32** and an **SW-40 tilt/vibration switch**.
This is the first device firmware (`motorcycle-01`).

---

## Hardware Required

| Component         | Quantity |
|-------------------|----------|
| ESP32 Dev Board   | 1        |
| SW-40 Sensor      | 1        |
| LEDs (any color)  | 5        |
| 220Ω resistors    | 5        |
| Jumper wires      | as needed|
| Micro-USB cable   | 1        |

---

## Wiring Diagram

### Full Connection Layout

```
                           ESP32 Dev Board
                   ┌──────────────────────────┐
              3.3V │ 3V3                   GND │──────────────────────── GND (shared)
               GND │ GND                   D23 │
                   │ D1  (TX)              D22 │
                   │ D3  (RX)              D21 │
                   │ D4  (GPIO4)           D19 │── 220Ω ── BLUE LED (safe) ──── GND
SW-40 DO ─────────│ D4                    D18 │── 220Ω ── RED LED (critical) ── GND
                   │ D5  (GPIO5)           D17 │── 220Ω ── YELLOW LED (medium) ─ GND
GREEN LED ── 220Ω ─│ D5                    D16 │── 220Ω ── BLUE LED (low) ────── GND
                   │ D18 (GPIO18)           D5 │
                   │ D19 (GPIO19)          D4  │
                   │ D21 (GPIO21)          D0  │
                   │ D22 (GPIO22)          D2  │
                   │ D23 (GPIO23)          D15 │
                   │ GND                   D13 │
              3.3V │ 3V3                   D12 │
                   └──────────────────────────┘
```

### SW-40 Vibration Sensor
```
SW-40 Pin    →    ESP32 Pin
──────────────────────────────
VCC          →    3.3V
GND          →    GND
DO           →    GPIO4 (D4)
```

### LEDs (each wired: Pin → 220Ω resistor → LED anode → LED cathode → GND)
```
ESP32 Pin      Resistor    LED Color    Role
──────────────────────────────────────────────────────
GPIO5  (D5) →   220Ω   →   GREEN    →  WiFi connected
GPIO16      →   220Ω   →   BLUE     →  Low vibration detected
GPIO17      →   220Ω   →   YELLOW   →  Medium vibration detected
GPIO18      →   220Ω   →   RED      →  Hard / critical threat
GPIO19      →   220Ω   →   BLUE     →  Safe / device working
```

> The SW-40 pulls its DO pin LOW when vibration is detected.
> The firmware uses `INPUT_PULLUP` so the pin reads HIGH at rest and LOW on vibration.
> All LED cathodes (short leg) connect to the shared GND rail.

---

## Software Setup

### 1. Install Arduino IDE
Download from https://www.arduino.cc/en/software

### 2. Add ESP32 Board Support
Go to **File → Preferences → Additional Boards Manager URLs** and add:
```
https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
```
Then go to **Tools → Board Manager** → search `esp32` → Install **esp32 by Espressif Systems**

### 3. No Extra Libraries Needed
All libraries used (`WiFi`, `HTTPClient`, `WiFiClientSecure`, `Preferences`) are included with the ESP32 board package.

### 4. Configure the Sketch
Open `alertvibe_sensor.ino` and edit the top section:

```cpp
const char* DEFAULT_SSID     = "SIGIDAS";         // your WiFi name
const char* DEFAULT_PASSWORD = "Lolipop123";      // your WiFi password

const char* BACKEND_URL     = "http://192.168.1.146:4000/api/alerts";
const char* WIFI_CONFIG_URL = "http://192.168.1.146:4000/api/motorcycles/wifi/config";

const char* DEVICE_ID = "motorcycle-01";          // must match what you register in the app
```

To find your PC's local IP (where the backend runs):
- Windows: open Command Prompt → run `ipconfig` → look for **IPv4 Address**

### 5. Select Board and Port
- **Board:** `ESP32 Dev Module`
- **Port:** the COM port that appears when you plug in the ESP32
- Click **Upload**

---

## Switching to Production (Render Backend)

When testing is done and you want to use the deployed backend, do two things:

**Step 1 — Swap the URLs** in the config section:
```cpp
// Comment out local:
// const char* BACKEND_URL    = "http://192.168.1.146:4000/api/alerts";
// const char* WIFI_CONFIG_URL = "http://192.168.1.146:4000/api/motorcycles/wifi/config";

// Uncomment production:
const char* BACKEND_URL     = "https://alervibe-bckend.onrender.com/api/alerts";
const char* WIFI_CONFIG_URL = "https://alervibe-bckend.onrender.com/api/motorcycles/wifi/config";
```

**Step 2 — Switch to HTTPS client** inside `sendAlert()` and `checkWifiConfigUpdate()`:
```cpp
// Replace:
WiFiClient plainClient;

// With:
WiFiClientSecure plainClient;
plainClient.setInsecure();
```

---

## LED Status Codes

| LEDs ON                  | Meaning                          |
|--------------------------|----------------------------------|
| BLUE SAFE only           | Device powered, starting up      |
| GREEN blinks             | Connecting to WiFi               |
| GREEN + BLUE SAFE        | Connected, monitoring (safe)     |
| GREEN + BLUE LOW         | Low vibration detected (1 pulse) |
| GREEN + YELLOW           | Medium vibration (2+ pulses)     |
| GREEN + RED              | Critical threat (3+ pulses)      |
| RED flashes 3×           | Alert sent successfully          |
| YELLOW flashes 3×        | Alert send failed (HTTP error)   |
| All LEDs on briefly      | Startup sequence                 |

---

## Detection Thresholds

| Constant         | Default  | Description                                        |
|------------------|----------|----------------------------------------------------|
| `LOW_THRESHOLD`  | 1        | Pulses to trigger LOW (blue LED)                   |
| `MED_THRESHOLD`  | 2        | Pulses to trigger MEDIUM (yellow LED)              |
| `HIGH_THRESHOLD` | 3        | Pulses to send an alert (increase to 5 for production) |
| `DEBOUNCE_MS`    | 20 ms    | Minimum pulse width to count                       |
| `COOLDOWN_MS`    | 5000 ms  | Minimum time between consecutive alerts            |
| `PULSE_WINDOW_MS`| 3000 ms  | Time window to accumulate pulses                   |
| `WIFI_TIMEOUT`   | 20000 ms | Restart if WiFi not connected within this time     |

---

## WiFi Credential Updates (Remote Config)

The firmware polls the backend on startup for updated WiFi credentials. If you change the WiFi SSID/password from the app dashboard, the device will automatically save the new credentials to NVS (non-volatile storage) and restart to reconnect. No reflashing needed.

---

## How It Works

```
[SW-40 detects vibration → pulls GPIO4 LOW]
        ↓
[Firmware counts pulses within a 3-second window]
        ↓
[3+ pulses → alert threshold reached]
        ↓
[POST /api/alerts to backend with deviceId, severity, pulseCount]
        ↓
[Backend saves to Firestore + sends FCM push notification]
        ↓
[AlertVibe app shows alert — owner is notified]
```

---

## Troubleshooting

**No WiFi connection**
- Check SSID and password (case-sensitive)
- ESP32 supports both **2.4 GHz and 5 GHz** networks
- Green LED will keep blinking while trying to connect; the device restarts after 20 seconds

**HTTP error / alerts not reaching backend**
- Confirm backend is running locally: open browser → `http://192.168.1.146:4000`
- Check your PC's firewall allows port 4000
- Verify the IP address with `ipconfig` — it may have changed

**Sensor always triggering**
- Some SW-40 modules are active HIGH — swap the condition in `loop()`:
  ```cpp
  bool sensorTriggered = (digitalRead(VIBRATION_PIN) == HIGH);
  ```

**Sensor never triggering**
- Check wiring: SW-40 DO → GPIO4, not another pin
- Open **Serial Monitor at 115200 baud** — it will print every pulse count and alert

**NVS not saving credentials**
- First flash always uses default credentials — this is normal
- After a successful WiFi update from the dashboard, credentials persist across restarts
