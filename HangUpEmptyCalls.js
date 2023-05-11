/*
Copyright (c) 2022 Cisco and/or its affiliates.
This software is licensed to you under the terms of the Cisco Sample
Code License, Version 1.1 (the "License"). You may obtain a copy of the
License at
               https://developer.cisco.com/docs/licenses
All use of the material herein must be in accordance with the terms of
the License. All rights not expressly granted by the License are
reserved. Unless required by applicable law or agreed to separately in
writing, software distributed under the License is distributed on an "AS
IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
or implied.
*/

import xapi from 'xapi';

let newHangupTimer = null;
var numCalls=0;

/*
usePeopleCount Flag: controls whether PeopleSense or PeopleCount should be used. PeopleCount is faster, but relies on head tracking (camera enabled).
PeopleSense uses HeadTracking and Ultrasound (works on audio only calls), but requires an average of 2 minutes to detect no one is in the room.
*/
const usePeopleCount=false;
const hangUpTimer = 900000 // How long to wait for no people to be detected (in milliseconds) - only considered if scheduleTime = '' - default = 15 minutes

const scheduleTime = '';  // Set this to the time you want the device to hang up at (24h HH:MM format) daily -> leave blank if realtime people detection functionality desired

// Create scheduled action (hangup) if scheduleTime != ''
function schedule(time, action) {
  let [alarmH, alarmM] = time.replace('.', ':').split(':');
  let now = new Date();
  now = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  let difference = parseInt(alarmH) * 3600 + parseInt(alarmM) * 60 - now;
  if (difference <= 0) difference += 24 * 3600;

  return setTimeout(action, difference * 1000);
}

// Hangup call at set time
async function scheduledHangUp() {
  numCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
  if (numCalls > 0) {
    console.log(`There's an active call! Disconnecting...`)
    xapi.Command.Call.Disconnect()
  }

  console.log(`Reschedule for tomorrow at ${scheduleTime}`)
  newHangupTimer = schedule(scheduleTime, scheduledHangUp); // schedule it for the next day
}

// Start timer when no one is detected
function startHangupTimer() {
  newHangupTimer = setTimeout(onHangupTimerExpired, hangUpTimer);
}

// Stop timer when someone is detected
function stopHangupTimer() {
  clearTimeout(newHangupTimer);
  newHangupTimer = null;
}

// Reset timer value when no one is detected
function restartHangupTimer() {
  console.log(`Restarted hangup timer...`)
  stopHangupTimer();
  startHangupTimer();
}

// Action to execute when timer expires
async function onHangupTimerExpired() {
  // Fail Safe Check to make sure an Active Call with someone present is disconnected
  let peopleThere=await xapi.Status.RoomAnalytics.PeopleCount.Current.get()
  console.log(`Number of People Detected: ${peopleThere}`)

  if (peopleThere<1) {
    console.log('Disconnecting Active Call!')
    xapi.Command.Call.Disconnect()
  }
}

async function init() {
  // Use PeopleCount/Presence capability
  if (scheduleTime == '') {
    console.log(`Realtime people detection option selected...`)

    numCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
    console.log(`Started with ${numCalls} calls.`)

    let isPeople=await xapi.Status.RoomAnalytics.PeoplePresence.get()
    console.log(`PeoplePresence ${isPeople}`)

    // If usePeopleCount is True, assume camera is on, use PeopleCount head tracking to determine presence
    if (usePeopleCount) {
      xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
      xapi.Config.RoomAnalytics.PeoplePresence.Input.HeadDetector.set('On');

      // Handerler for changes in PeopleCount value
      xapi.Status.RoomAnalytics.PeopleCount.Current.on(value => {
        console.log(`Peoplecount: ${value}`)
        if (value<1 && numCalls>0) {
            restartHangupTimer();
        } else {
            stopHangupTimer()}
      });
    // usePeopleCount is false, rely on ultrasound, assume camera is off (or audio only call)
    } else {
      xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('Off');
      xapi.Config.RoomAnalytics.PeoplePresence.Input.Ultrasound.set('On');

      // Handler for changes in people presence
      xapi.Status.RoomAnalytics.PeoplePresence.on(value => {
        console.log(`PeoplePresence: ${value}`)
        if (value=='No' && numCalls>0) {
          restartHangupTimer();
        } else {stopHangupTimer()}
      });
    }

    // Handler for responding to starting and stopping calls
    xapi.Status.SystemUnit.State.NumberOfActiveCalls
      .on(async value => {
        console.log(`NumberOfActiveCalls: ${value}`)
        numCalls=value;
        if (numCalls>0)
          {
            // Check if someone is originally there when a call starts (either with PeopleCount or PeoplePresence), otherwise start countdown timer
            if (usePeopleCount) {
              let peopleThere=await xapi.Status.RoomAnalytics.PeopleCount.Current.get()
              if (peopleThere<1) restartHangupTimer();
            }
            else {
              let peoplePresent = await xapi.Status.RoomAnalytics.PeoplePresence.get();
              if (peoplePresent=='No') restartHangupTimer();
            }
          }
        }
      );

  // Use daily schedule functionality
  } else {
    console.log(`Scheduled option selected...`)
    newHangupTimer = schedule(scheduleTime, scheduledHangUp);
  }
}

init();