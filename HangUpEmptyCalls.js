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

const HANGUP_TIMER = 30000 // How long to wait for no people to be detected (in milliseconds)
let newHangupTimer = null;
var numCalls=0;

/*
usePeopleCount Flag: controls whether PeopleSense or PeopleCount should be used. PeopleCount is faster, but relies on head tracking (camera enabled).
PeopleSense uses HeadTracking and Ultrasound (works on audio only calls), but requires an average of 2 minutes to detect no one is in the room.
*/
const usePeopleCount=false;

function startHangupTimer() {
  newHangupTimer = setTimeout(onHangupTimerExpired, HANGUP_TIMER);
}

function stopHangupTimer() {
  clearTimeout(newHangupTimer);
  newHangupTimer = null;
}

function restartHangupTimer() {
  console.log(`Restarted hangup timer...`)
  stopHangupTimer();
  startHangupTimer();
}

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
    numCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
    console.log(`Started with ${numCalls} calls.`)

    let isPeople=await xapi.Status.RoomAnalytics.PeoplePresence.get()
    console.log(`PeoplePresence ${isPeople}`)

    // If usePeopleCount is True, assume camera is on, use PeopleCount head tracking to determine presence
    if (usePeopleCount) {
      xapi.Config.RoomAnalytics.PeopleCountOutOfCall.set('On');
      xapi.Config.RoomAnalytics.PeoplePresence.Input.HeadDetector.set('On');
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
}

init();
