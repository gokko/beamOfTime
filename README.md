# beamOfTime
beam of time clock project

raspberry pi powered 3D printed LED clock with many color options, animations and even sound.

work in progress
see the website for some intermediate pics:
http://www.beamoftime.com

# note: master branch is protected
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
## main start script
app.py in bot folder
- it contains the flask server to manage the configuration website
- and in parallel starts the BotClock in a second thread

## folder: raspi-setup
contains the scripts required to setup the service on the raspberry pi

## folder info
collection of information files like logos/ images used on website

## 
 