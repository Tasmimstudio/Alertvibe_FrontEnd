# AlertVibe — ESP8266 Firmware (alertvibe_esp8266)

Vibration sensor firmware for the AlertVibe security system.
Uses an **ESP8266 NodeMCU** and an **SW-40 tilt/vibration switch**.
This is the second device firmware (`motorcycle-02`). The first device uses the ESP32 sketch.

---

## Hardware Required

| Component         | Quantity |
|-------------------|----------|
| ESP8266 NodeMCU   | 1        |
| SW-40 Sensor      | 1        |
| LEDs (any color)  | 5        |
| 220Ω resistors    | 5        |
| Jumper wires      | as needed|
| Micro-USB cable   | 1        |

---

## Wiring Diagram

### Full Circuit Connection

```
NodeMCU ESP8266                                        Components
─────────────────────────────────────────────────────────────────────────────

3.3V ──────────────────────────────────────────────── SW-40 VCC
GND  ──────────────────────────────────────────────── SW-40 GND
D2   ──────────────────────────────────────────────── SW-40 DO

D1   ── 220Ω ──[GREEN LED +]──[GREEN LED -]─────────── GND
D0   ── 220Ω ──[BLUE  LED +]──[BLUE  LED -]─────────── GND   (low)
D5   ── 220Ω ──[YELLOW LED+]──[YELLOW LED-]─────────── GND
D6   ── 220Ω ──[RED   LED +]──[RED   LED -]─────────── GND
D7   ── 220Ω ──[BLUE  LED +]──[BLUE  LED -]─────────── GND   (safe)

GND  ──────────────────────────────────────────────── GND rail (shared)
```

### Every Wire Listed

| Wire | From                  | To                        | Note                        |
|------|-----------------------|---------------------------|-----------------------------|
| 1    | NodeMCU **3.3V**      | SW-40 **VCC**             | Power for sensor            |
| 2    | NodeMCU **GND**       | SW-40 **GND**             | Ground for sensor           |
| 3    | NodeMCU **D2**        | SW-40 **DO**              | Vibration signal            |
| 4    | NodeMCU **D1**        | Resistor R1 (leg 1)       | GREEN LED signal            |
| 5    | Resistor R1 (leg 2)   | GREEN LED **anode (+)**   | 220Ω current limit          |
| 6    | GREEN LED **cathode (-)** | GND rail              | WiFi connected indicator    |
| 7    | NodeMCU **D0**        | Resistor R2 (leg 1)       | BLUE LOW LED signal         |
| 8    | Resistor R2 (leg 2)   | BLUE LED **anode (+)**    | 220Ω current limit          |
| 9    | BLUE LED **cathode (-)** | GND rail               | Low detection indicator     |
| 10   | NodeMCU **D5**        | Resistor R3 (leg 1)       | YELLOW LED signal           |
| 11   | Resistor R3 (leg 2)   | YELLOW LED **anode (+)**  | 220Ω current limit          |
| 12   | YELLOW LED **cathode (-)** | GND rail             | Medium detection indicator  |
| 13   | NodeMCU **D6**        | Resistor R4 (leg 1)       | RED LED signal              |
| 14   | Resistor R4 (leg 2)   | RED LED **anode (+)**     | 220Ω current limit          |
| 15   | RED LED **cathode (-)** | GND rail               | Critical threat indicator   |
| 16   | NodeMCU **D7**        | Resistor R5 (leg 1)       | BLUE SAFE LED signal        |
| 17   | Resistor R5 (leg 2)   | BLUE LED **anode (+)**    | 220Ω current limit          |
| 18   | BLUE LED **cathode (-)** | GND rail               | Safe / working indicator    |
| 19   | NodeMCU **GND**       | GND rail                  | Common ground               |

> **Total: 19 wires, 5 resistors**

### Pin Summary

| NodeMCU Pin | GPIO   | Connected To         | Direction |
|-------------|--------|----------------------|-----------|
| 3.3V        | —      | SW-40 VCC            | Power out |
| GND         | —      | SW-40 GND + GND rail | Ground    |
| D2          | GPIO4  | SW-40 DO             | Input     |
| D1          | GPIO5  | GREEN LED (wifi)     | Output    |
| D0          | GPIO16 | BLUE LED (low)       | Output    |
| D5          | GPIO14 | YELLOW LED (medium)  | Output    |
| D6          | GPIO12 | RED LED (critical)   | Output    |
| D7          | GPIO13 | BLUE LED (safe)      | Output    |

> The SW-40 pulls its DO pin LOW when vibration is detected.
> The firmware uses `INPUT_PULLUP` so the pin reads HIGH at rest and LOW on vibration.
> LED **anode** = long leg (+), LED **cathode** = short leg (−).
> All cathodes connect to the same shared GND rail.

---

## Software Setup

### 1. Install Arduino IDE
Download from https://www.arduino.cc/en/software

### 2. Add ESP8266 Board Support
Go to **File → Preferences → Additional Boards Manager URLs** and add:
```
http://arduino.esp8266.com/stable/package_esp8266com_index.json
```
Then go to **Tools → Board Manager** → search `esp8266` → Install **esp8266 by ESP8266 Community**

### 3. No Extra Libraries Needed
All libraries used (`ESP8266WiFi`, `ESP8266HTTPClient`, `WiFiClientSecureBearSSL`, `EEPROM`) are included with the ESP8266 board package.

### 4. Configure the Sketch
Open `alertvibe_esp8266.ino` and edit the top section:

```cpp
const char* DEFAULT_SSID     = "SIGIDAS";         // your WiFi name
const char* DEFAULT_PASSWORD = "Lolipop123";      // your WiFi password

const char* BACKEND_URL     = "http://192.168.1.146:4000/api/alerts";
const char* WIFI_CONFIG_URL = "http://192.168.1.146:4000/api/motorcycles/wifi/config";

const char* DEVICE_ID = "motorcycle-02";          // must match what you register in the app
```

To find your PC's local IP (where the backend runs):
- Windows: open Command Prompt → run `ipconfig` → look for **IPv4 Address**

### 5. Select Board and Port
- **Board:** `NodeMCU 1.0 (ESP-12E Module)`
- **Port:** the COM port that appears when you plug in the ESP8266
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
BearSSL::WiFiClientSecure plainClient;
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

| Constant        | Default | Description                                        |
|-----------------|---------|----------------------------------------------------|
| `LOW_THRESHOLD` | 1       | Pulses to trigger LOW (blue LED)                   |
| `MED_THRESHOLD` | 2       | Pulses to trigger MEDIUM (yellow LED)              |
| `HIGH_THRESHOLD`| 3       | Pulses to send an alert (increase to 5 for production) |
| `DEBOUNCE_MS`   | 20 ms   | Minimum pulse width to count                       |
| `COOLDOWN_MS`   | 5000 ms | Minimum time between consecutive alerts            |
| `PULSE_WINDOW_MS`| 3000 ms | Time window to accumulate pulses                   |
| `WIFI_TIMEOUT`  | 20000 ms| Restart if WiFi not connected within this time     |

---

## WiFi Credential Updates (Remote Config)

The firmware polls the backend on startup for updated WiFi credentials. If you change the WiFi SSID/password from the app dashboard, the device will automatically save the new credentials to EEPROM and restart to reconnect. No reflashing needed.

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
- ESP8266 only supports **2.4 GHz** networks — 5 GHz will not work
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
- Check wiring: SW-40 DO → D2, not D0
- Open **Serial Monitor at 115200 baud** — it will print every pulse count and alert

**EEPROM not saving credentials**
- This is normal on first flash (EEPROM reads 0xFF) — device falls back to default credentials automatically
