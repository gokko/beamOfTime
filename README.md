# beamOfTime
beam of time clock project

raspberry pi powered 3D printed LED clock with many color options, animations and even sound.

still work in progress, check back later for more details
and see the website for some intermediate pics:
http://www.beamoftime.com


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

run botclock:
- python beamoftime/bot/app.py

for configuration from browser connect to:
- http://localhost:8080
