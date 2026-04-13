# AlertVibe — ESP8266 Firmware

Vibration sensor firmware for the AlertVibe security system.
Uses an **ESP8266 NodeMCU** and an **SW-40 tilt/vibration switch**.

---

## Hardware Required

| Component        | Quantity |
|------------------|----------|
| ESP8266 NodeMCU  | 1        |
| SW-40 Sensor     | 1        |
| Jumper wires     | 3        |
| Micro-USB cable  | 1        |

---

## Wiring Diagram

```
ESP8266 NodeMCU          SW-40 Sensor
─────────────────        ────────────
3.3V      ──────────────  VCC
GND       ──────────────  GND
D2 (GPIO4)──────────────  DO (data out)
```

> The SW-40 pulls its DO pin LOW when vibration is detected.

---

## Software Setup

### 1. Install Arduino IDE
Download from https://www.arduino.cc/en/software

### 2. Add ESP8266 Board Support
In Arduino IDE → File → Preferences → Additional Boards Manager URLs, add:
```
http://arduino.esp8266.com/stable/package_esp8266com_index.json
```
Then: Tools → Board Manager → search "esp8266" → Install

### 3. Install ArduinoJson Library
Sketch → Include Library → Manage Libraries → search "ArduinoJson" (by Benoit Blanchon) → Install v6+

### 4. Configure the Sketch
Open `alertvibe_sensor/alertvibe_sensor.ino` and edit these lines:

```cpp
const char* WIFI_SSID     = "YOUR_WIFI_SSID";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";
const char* BACKEND_URL   = "http://YOUR_BACKEND_IP:4000/api/alerts";
const char* DEVICE_ID     = "esp8266-sw40-001";
const char* LOCATION      = "Motorcycle";
```

To find your PC's local IP (where the backend runs):
- Windows: run `ipconfig` in Command Prompt → look for IPv4 Address

### 5. Upload
- Board: NodeMCU 1.0 (ESP-12E Module)
- Port: COMx (whichever port appears when you plug in the ESP8266)
- Click Upload

---

## LED Status Codes

| Pattern              | Meaning                  |
|----------------------|--------------------------|
| 3 blinks (medium)   | WiFi connected           |
| 5 rapid blinks      | Alert sent successfully  |
| 2 slow blinks       | HTTP error               |
| Solid ON            | Startup / no WiFi        |

---

## Tuning Parameters

| Constant       | Default | Description                                  |
|----------------|---------|----------------------------------------------|
| `DEBOUNCE_MS`  | 50 ms   | Ignore triggers shorter than this            |
| `COOLDOWN_MS`  | 10000 ms| Min time between consecutive alerts (10s)    |
| `SEVERITY`     | "high"  | Alert severity sent to backend               |

---

## How It Works

```
[SW-40 detects vibration]
        ↓
[ESP8266 debounces signal]
        ↓
[POST /api/alerts to backend]
        ↓
[Backend saves to Firestore + sends FCM push notification]
        ↓
[AlertVibe dashboard shows alert — user is notified]
```

---

## Troubleshooting

**No WiFi connection**
- Double-check SSID and password (case-sensitive)
- Make sure it's a 2.4 GHz network (ESP8266 doesn't support 5 GHz)

**HTTP error / no alerts reaching backend**
- Confirm backend is running: `curl http://YOUR_BACKEND_IP:4000`
- Make sure your PC firewall allows port 4000
- Verify the IP address with `ipconfig`

**Sensor always triggering / never triggering**
- Swap HIGH/LOW logic: some SW-40 modules are active HIGH
- Check wiring: DO → D2, not D0

**Open Serial Monitor** (115200 baud) for live debug output.
