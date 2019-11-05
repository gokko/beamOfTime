#!/bin/sh

# go to users home directory
cd ~pi
# install samba, in dialog select yes to add DHCP
sudo apt-get -y --force-yes install samba samba-common-bin
printf "support = yes\n\n" | sudo tee -a /etc/samba/smb.conf
# add PiShare in smb.config
printf "[PiShare]\n" | sudo tee -a /etc/samba/smb.conf 
printf "comment=Raspberry Pi Share\n" | sudo tee -a /etc/samba/smb.conf 
printf "path=/home/pi\n" | sudo tee -a /etc/samba/smb.conf 
printf "browseable=Yes\n" | sudo tee -a /etc/samba/smb.conf 
printf "writeable=Yes\n" | sudo tee -a /etc/samba/smb.conf 
printf "only guest=no\n" | sudo tee -a /etc/samba/smb.conf 
printf "create mask=0777\n" | sudo tee -a /etc/samba/smb.conf 
printf "directory mask=0777\n" | sudo tee -a /etc/samba/smb.conf 
printf "public=no\n\n" | sudo tee -a /etc/samba/smb.conf

# allow pi to use samba share, enter password “botclock” twice
sudo smbpasswd -a pi
