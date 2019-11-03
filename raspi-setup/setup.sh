#!/bin/sh

# go to users home directory
cd ~pi
# add ll alias to .bashrc
sudo printf "alias ll='ls -la'\n" >> .bashrc

# update and upgrade system
sudo apt-get update 
sudo apt-get upgrade 
sudo apt-get dist-upgrade 
sudo apt-get autoremove 
sudo apt-get autoclean

# disable ssh root
sudo printf "PermitRootLogin no" >> /etc/ssh/sshd_config

# expand filesystem
sudo raspi-config --expand-rootfs
# enable i2c
sudo printf "i2c-dev\n" >> /etc/modules
sudo printf "dtparam=i2c_arm=on\n" >> /boot/config.txt

# enable spi
# need to check /etc/modprobe.d/raspi-blacklist.conf to comment out #blacklist spi-bcm2708
sudo printf "dtparam=spi=on\n" >> /boot/config.txt

# install gpio
sudo apt-get -y install raspi-gpio

# install music player mpg123 (use: mpg123 song.mp3 to play a song)
sudo apt-get -y install mpg123

# install python smbus
sudo apt-get -y install python-smbus

# install i2c tools
sudo apt-get -y install i2c-tools

# set python v3 as default
sudo rm /usr/bin/python 
sudo ln -s /usr/bin/python3 /usr/bin/python

# install python 3 installer
sudo apt-get -y install python3-pip

# install python library to get local IP address (see https://pythonhosted.org/ifaddr/)
sudo pip3 install ifaddr

# install python neopixel (see https://learn.adafruit.com/adafruit-neopixel-uberguide/python-circuitpython#python-installation-of-neopixel-library-17-9)
sudo pip3 install adafruit-circuitpython-neopixel

# install python GPIO
sudo pip3 install RPI.GPIO

# install python flask webserver:
sudo apt-get -y install python3-flask

# install samba, in dialog select yes to add DHCP
# sudo apt-get -y install samba samba-common-bin
#sudo printf "support = yes\n\n" >> /etc/samba/smb.conf 
# add PiShare entry (see below)
#sudo printf "[PiShare]\n" >> /etc/samba/smb.conf 
#sudo printf "comment=Raspberry Pi Share\n" >> /etc/samba/smb.conf 
#sudo printf "path=/home/pi\n" >> /etc/samba/smb.conf 
#sudo printf "browseable=Yes\n" >> /etc/samba/smb.conf 
#sudo printf "writeable=Yes\n" >> /etc/samba/smb.conf 
#sudo printf "only guest=no\n" >> /etc/samba/smb.conf 
#sudo printf "create mask=0777\n" >> /etc/samba/smb.conf 
#sudo printf "directory mask=0777\n" >> /etc/samba/smb.conf 
#sudo printf "public=no\n" >> /etc/samba/smb.conf 
# allow pi to use samba share, enter password “botclock” twice
#sudo smbpasswd -a pi


# install git
sudo apt-get install git

# config git
git config --global user.email "pi@bot.clock"
git config --global user.name "botclock"

# install python wpasupplicantconf
cd ~pi
git clone https://github.com/gokko/wpasupplicantconf.git 
cd wpasupplicantconf 
sudo python setup.py install 
cd ~pi
sudo rm -rf wpasupplicantconf

# install python parse-crontab:
git clone https://github.com/gokko/parse-crontab.git 
cd parse-crontab 
sudo python setup.py install 
cd ~pi
sudo rm -rf parse-crontab

# clone bot clock project from github
cd ~pi
sudo git clone https://github.com/gokko/beamOfTime.git
# copy initial config.json to clock folder
sudo cp ~pi/beamOfTime/raspi-setup/config.json ~pi/beamOfTime/bot/clock

# setup and start bot clock service
sudo cp ~pi/beamOfTime/raspi-setup/bot.service /lib/systemd/system
sudo chmod 644 /lib/systemd/system/bot.service
#sudo chmod +w ~pi/beamOfTime/bot/app.py
sudo systemctl daemon-reload
sudo systemctl enable bot.service
sudo systemctl start bot.service

# change hostname to botclock
# this doesn't work ?!
# sudo hostname -b botclock

# reboot to activate all changes
# sudo reboot now
