# beamOfTime
beam of time clock project

raspberry pi powered 3D printed LED clock with many color options, animations and even sound.

work in progress
see the website for some intermediate pics:
http://www.beamoftime.com

## note: master branch is protected
- to protect the users changes to the master branch will only be commited after an approval
- to contribute, please create another branch and submit to master via pull request

# development environment setup
(incl. tkinter based emulator)

- install python (version 3.x or above) https://www.python.org/downloads/
  - on windows tkinter is installed together with python
  - on linux install tkinter:
    sudo apt-get install python3-tk

- install git client https://git-scm.com/downloads
- fork/clone clock repository https://github.com/gokko/beamOfTime
- fork/clone wpa helper repository https://github.com/gokko/wpasupplicantconf
- fork/clone crontab helper repository https://github.com/gokko/parse-crontab

- install libraries
  - pip3 install ifaddr
  - pip3 install flask
  - python wpasupplicantconf/setup.py install
  - python beamoftime/bot/emulator/setup.py install
  - python beamoftime/bot/parse-crontab/setup.py install

- install espeak http://espeak.sourceforge.net/download.html
  (make sure on Windows folder with executable is included in PATH)
- install/unzip mpg123 https://www.mpg123.de/download.shtml
  (make sure on Windows folder with executable is included in PATH)

run botclock:
- python beamoftime/bot/app.py

for configuration from browser connect to:
- http://localhost:8080

# project structure
## start script
app.py in bot folder
- contains (and starts) the webserver flask app to manage the (vue.js) configuration website
- and in parallel starts the BotClock in a second thread (from clock/botclock.py)

## folder: bot
main application folder containing
- sounds: collection of sound files that can be used in timers
- app.py start script containing flask webserver and starting BotClock as parallel thread
- botclock.py containing main BotClock with major logic to control the clock
- botAnimations.py module containing animations, can be used for extensions
- folder css, js, fonts, files, locales, pages used in vue.js configuration website
- index.html starting page for configuration website
- version.json version history used in configuration website to show available updates
- timedatectl.json contains time zone information

## folder: bot/emulator
tkinter based clock emulator, can be used to test clock on desktop computer

## folder: 3D
STL model files to print the clock with 3D printer

## folder: info
collection of information files like logos/ images used on external website (https://www.beamoftime.com)

## folder: raspi-setup
contains the scripts required to setup the service on the raspberry pi
