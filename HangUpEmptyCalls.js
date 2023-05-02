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

  if (peopleThere<1) {
    console.log('Disconnecting Active Call!')
    xapi.Command.Call.Disconnect()
  }
}

async function init() {

numCalls = await xapi.Status.SystemUnit.State.NumberOfActiveCalls.get()
console.log(`Started with ${numCalls} calls.`)

  // Handler for responding to people coming/going from room
  xapi.Status.RoomAnalytics.PeopleCount.Current
      .on(value => {
        console.log(`Peoplecount: ${value}`)
        if (value<1 && numCalls>0) {
          restartHangupTimer();
        }
      });

  // Handler for responding to starting and stopping calls
  xapi.Status.SystemUnit.State.NumberOfActiveCalls
      .on(async value => {
        console.log(`NumberOfActiveCalls: ${value}`)
        numCalls=value;
        if (numCalls>0)
          {
            // Check if someone is originally there when a call starts, otherwise start countdown timer
            let peopleThere=await xapi.Status.RoomAnalytics.PeopleCount.Current.get()
            if (peopleThere<1) restartHangupTimer();
          }

        }
      );
}

init();
