
# Install app
npm install

Start metro server:
npm run start

# Testing app (Android Studio)
Install Android Studio

Open android folder in Anroid Studio

Connect android phone to laptop (at this moment the virtual phones do not support bluetooth which is required for the app),

Within Developer Tools on phone make sure USB Debugging is enabled

SDK folder run the following command
adb reverse tcp:8081 tcp:8081

# API
within the server folder
npm Install

copy and rename .env.example

Fill in envirement variables 

start server:
npm run server


# To do 
Write actions for sdk release creation
+ extra

