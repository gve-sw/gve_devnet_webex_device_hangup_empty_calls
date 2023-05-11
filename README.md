# Hang Up Empty Calls for Webex Devices

This macro monitors the number of people present in a room during an active call. If the number drops to 0 for a certain duration (an 'Empty Call'), the call is ended. This is the default behavior.

The macro also supports daily hang up of calls at a specified time. See `ScheduleTime` parameter for more information.

## Contacts
* Gerardo Chaves
* Trevor Maco

## Solution Components
* Webex Devices
* xAPI
* Javascript

## Requirements
* Devices must be running RoomOS 11 or later (for realtime people detection)
* Supported Devices: Room, Board, Desk Series

## Prerequisites
- **UI Extension Editor**: To create and activate custom panels, you can use the UI Extension Editor. You need a local Admin user on the device to create UI Extensions together with macros and the xAPI. Follow these instructions to launch the UI Extension Editor:
1. Open the local web interface for the device.
2. From the customer view in [https://admin.webex.com](https://admin.webex.com) go to the <b>Devices page</b>, and select your device in the list. Go to <b>Support</b> and click <b>Web Portal</b>. If you have set up an Admin, Integrator or RoomControl user for the device, you can access the local web interface directly by opening a web browser and typing in http(s)://<endpoint ip or hostname>.
3. From the <b>Customization</b> tab, select <b>UI Extensions Editor</b>.

> For more information about UI Extensions and how to load them from the devices web interface, visit [this article](https://help.webex.com/en-us/n18glho/User-Interface-Extensions-with-Room-and-Desk-Devices-and-Webex-Boards). You can find more details and screenshots 
also in [this guide](https://www.cisco.com/c/dam/en/us/td/docs/telepresence/endpoint/roomos-103/desk-room-kit-boards-customization-guide-roomos-103.pdf).

## Installation/Configuration
1. Load the Javascript code included in the `HangUpEmptyCalls.js` file in this repository into a new Macro in the Macro editor of the Cisco Webex device you wish to use.
2. Before activating the macro, set the `hangUpTimer` constant in the code on your device for real time people detection:
```
const hangUpTimer = 900000 // If no one is detected on a call for 15 minutes (900000 ms), hang up the call for ex.
```
3. If scheduled hang up functionality is desired, set the `scheduleTime` constant in the code to a 24-hour HH:MM timestamp:
```
const scheduleTime = 02:00 // Hang up at 2 AM daily for ex.
```
* Note: Leave this value as blank if using real time people detection
4. Activate the macro

> If you are unfamiliar with Cisco Room device macros, [this](https://help.webex.com/en-us/np8b6m6/Use-of-Macros-with-Room-and-Desk-Devices-and-Webex-Boards) is a good article to get started.

> For some sample code to show you how to automate the deployment of this macro, wallpapers, touch 10 UI controls and others to multiple Webex devices, you can visit [this repository](https://github.com/voipnorm/CE-Deploy)

> For information on deploying the macros, you can read the [Awesome xAPI GitHub repository](https://github.com/CiscoDevNet/awesome-xapi#user-content-developer-tools). In addition to the deployment information, this repository also has tutorials for different macro uses, articles dedicated to different macro capabilities, libraries to help interacting with codecs, code samples illustrating the xAPI capabilities, and sandbox and testing resources for macro applications.

### LICENSE

Provided under Cisco Sample Code License, for details see [LICENSE](LICENSE.md)

### CODE_OF_CONDUCT

Our code of conduct is available [here](CODE_OF_CONDUCT.md)

### CONTRIBUTING

See our contributing guidelines [here](CONTRIBUTING.md)

#### DISCLAIMER:
<b>Please note:</b> This script is meant for demo purposes only. All tools/ scripts in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.
You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.