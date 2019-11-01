sudo cp ~pi/beamOfTime/raspi-setup/bot.service /lib/systemd/system
sudo chmod 644 /lib/systemd/system/bot.service
sudo chmod +w ~pi/beamOfTime/bot/app.py
sudo systemctl daemon-reload
sudo systemctl enable bot.service
sudo systemctl start bot.service
