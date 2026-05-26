# 4.3.1 User Interface Design

The interface is crafted for simplicity, user-friendliness, and effective navigation. Motorcycle owners and security staff can utilize a web application that offers push notifications, monitoring records, and alert history for accessing the system. Users can enroll their motorcycles, monitor sensor activity, and receive push notifications activated by observed tampering or unauthorized movement. The interface features login verification to guarantee secure entry and limit access to unauthorized users. A dashboard showcases crucial details like registered motorcycles, sensor status, and alerts, allowing swift reactions to security threats.

---

## 4.3.1.1 Main Page

The Main Page serves as the primary interface for the Motorcycle Alert System with Push Notification (ALERTVIBE). It displays the ALERTVIBE emblem and the system name prominently at the top of the screen. Users can sign in by inputting their registered email address and password. A **Login** button is provided to authenticate and grant access to the system. A **"Forgot Password?"** link is also available to assist users who need to recover their credentials. New users are directed to create an account through the Registration page using the sign-up link. The page is designed with a dark-themed background that reflects the security-focused nature of the system.

*Figure 4.5 Main Page of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.2 Registration Page

The Registration Page enables users to set up an account and enroll their motorcycle in the system, guaranteeing that only approved users and authorized motorcycles are linked to the alert system. The registration procedure involves two phases: initially, users enter their personal information, including full name, email address, phone number, and password. Upon completing this step, they proceed to input their motorcycle information, including the plate number, model, color, and device code assigned to their sensor unit. A **Next** button directs users through the steps, while the **Register** button finalizes the process. After successful registration, the system automatically redirects the user to the login page to access their newly created account.

*Figure 4.6.1 Registration Page of Motorcycle Alert System with Push Notification (ALERTVIBE) 1 of 2*

*Figure 4.6.2 Registration Page of Motorcycle Alert System with Push Notification (ALERTVIBE) 2 of 2*

---

## 4.3.1.3 User Dashboard (Home)

Upon successful login, the user is directed to the Dashboard, which serves as the central hub of the AlertVibe system. The dashboard displays the connection status, indicating whether the device is **Connected** or **Not Connected** to the backend server. It presents the latest alert previews organized under three tabs: **Last Alert**, which shows the most recent vibration alerts received within the last ten minutes; **Motorcycle Info**, which displays the registered motorcycle's details including plate number, model, and photo; and **WiFi Config**, which allows users to remotely update the sensor device's WiFi credentials without the need to reflash the firmware. Each alert card is color-coded according to severity: green for Light, yellow for Moderate, and red for Strong alerts. Users can navigate to manage motorcycles, view the full alert log, access the tutorial page, or log out from the sidebar on desktop or the bottom navigation bar on mobile devices.

*Figure 4.6.3 User Dashboard of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.4 Manage Motorcycles Page

The Manage Motorcycles Page allows users to register and manage their motorcycle information within the AlertVibe system. Functions available on this page include registering a new motorcycle, editing existing motorcycle records, and deleting registered motorcycles. To register a motorcycle, users are required to provide the plate number, motorcycle model, device ID corresponding to the sensor unit, and an optional photo. Users can also activate or deactivate the monitoring system for each motorcycle using a toggle control. The status of each registered motorcycle is clearly indicated by a badge labeled **Active** (green) or **Inactive** (gray). This page ensures that the system only monitors authorized and registered motorcycles linked to the user's account.

*Figure 4.6.4 Manage Motorcycles Page of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.5 Alert History Page

The Alert History Page presents a comprehensive log of all vibration alerts that have been recorded for the user's registered motorcycle. Alerts are displayed in chronological order, with the most recent entries appearing first. Each alert entry contains the date and time of detection, the device ID, the severity level, the alert message, and the total pulse count recorded by the sensor. Severity levels are visually distinguished through color-coded badges: **LIGHT** (green) indicates minimal vibration such as wind or a passing vehicle; **MODERATE** (yellow) indicates noticeable shaking that may suggest tampering; and **STRONG** (red) indicates repeated and intense vibration consistent with a theft attempt. The page supports pagination to allow users to navigate through extensive alert records efficiently.

*Figure 4.6.5 Alert History Page of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.6 Profile Page

The Profile Page enables users to view and update their personal account information. Users can modify their display name and upload a profile photo. A password reset option is also available, which sends a reset link to the user's registered email address. The profile page reflects the current role assigned to the user's account, such as User, Security, or Admin, providing a clear indication of the level of access granted within the system.

*Figure 4.6.6 Profile Page of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.7 How It Works Page

The How It Works Page serves as an in-application tutorial and reference guide for users of the AlertVibe system. It explains the complete system flow from vibration detection at the sensor level to the delivery of push notifications to the user's browser. The page is organized into clearly defined sections covering: the step-by-step system flow, alert level descriptions and their corresponding color indicators, the LED indicator guide for the physical device, an overview of the hardware components, a testing guide outlining how many sensor taps are required to trigger each alert level, and a Frequently Asked Questions section addressing common concerns. This page is accessible from the desktop sidebar under the label **How It Works** and from the mobile bottom navigation under the **Guide** icon.

*Figure 4.6.7 How It Works Page of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.8 Security Dashboard *(Security and Admin roles only)*

The Security Dashboard is accessible exclusively to users assigned the Security or Admin role. It provides security personnel with a real-time monitoring interface covering all registered motorcycles and their associated alert activity across the entire system. The dashboard displays a live feed of incoming alerts, a summary of alert counts categorized by severity, and an overview of all registered motorcycles along with their current status. Security personnel can respond to alerts directly from this interface by marking them as handled, enabling efficient incident management and timely response to detected threats.

*Figure 4.6.8 Security Dashboard of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.9 Security Alert Log *(Security and Admin roles only)*

The Security Alert Log provides security personnel with access to the complete alert history across all users and devices registered in the system. Alerts can be filtered by severity level, device ID, or date to assist in targeted monitoring and incident review. Each alert entry displays the severity badge, timestamp, device identifier, alert message, and response status. Security users can mark individual alerts as responded directly from the log. The page incorporates pagination to manage large volumes of alert data effectively.

*Figure 4.6.9 Security Alert Log of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## 4.3.1.10 Admin Dashboard *(Admin role only)*

The Admin Dashboard is the highest-level management interface of the AlertVibe system, accessible only to users with the Admin role. It is organized into three primary tabs for comprehensive system oversight.

The **Users Tab** displays a list of all registered user accounts, including their name, email address, assigned role, and account status. Administrators can manage each user account through a three-dot action menu that provides options to Deactivate or Activate the account, send a Password Reset email, or permanently Delete the user from the system.

The **Motorcycles Tab** presents all motorcycles registered across all user accounts, displaying the plate number, model, device ID, owner information, and current activation status. This allows administrators to oversee the full inventory of monitored vehicles within the system.

The **Alerts Tab** provides system-wide access to all recorded alerts, with filtering options by severity and device. Administrators can mark alerts as responded and remove outdated records as needed.

A summary section at the top of the Admin Dashboard displays statistical overview cards showing the total number of users, registered motorcycles, and alerts, along with a breakdown of alerts by severity level.

*Figure 4.6.10 Admin Dashboard of Motorcycle Alert System with Push Notification (ALERTVIBE)*

---

## Alert Severity Reference

| Severity | Color | Pulse Count | Description |
|---|---|---|---|
| **LIGHT** | Green | 1–2 pulses | Gentle vibration detected. May be caused by wind, a passing vehicle, or minor contact. |
| **MODERATE** | Yellow | 3–5 pulses | Noticeable shaking detected. Possible tampering or unauthorized movement. |
| **STRONG** | Red | 6+ pulses | Repeated strong vibration detected. Immediate attention is recommended. |
