#!/usr/bin/env python
# NeoPixel wall clock
# Author: Gottfried Koschel (gogo@koschel.org)
# more information: http://www.beamoftime.com
#
# based on NeoPixel library strandtest example by Tony DiCola (tony@tonydicola.com)
# Direct port of the Arduino NeoPixel library strandtest example.  

import sys
import os
import signal
import time
import json
import ifaddr
import subprocess
import board
import neopixel
import argparse

from crontab import CronTab
from datetime import datetime
from subprocess import call
from math import *

# class with some helpful functions to deal with Color
class ColorHelper(object):

    @classmethod
    def getColorFromRgb(cls, rgb):
        col = int(rgb.replace("#", "0x"), 16)
        r = (col & 0xff0000) >> 16
        g = (col & 0xff00) >> 8
        b = (col & 0xff)
        return (r, g, b)

    @classmethod
    def colorAdd(cls, col1, col2):
        return (max(0, min(col1[0]+ col2[0], 255)), max(0, min(col1[1]+ col2[1], 255)), max(0, min(col1[2]+ col2[2], 255)))

# main class to handle all the beam of time clock specifics
class BotClock(object):
    
    
    # constructor will create and initialize the NeoPixel strip
    def __init__(self):
        # LED strip configuration:
        
        # initialize configuration file
        self.cfgFileName = os.path.dirname(os.path.realpath(__file__)) + '/config.json'
        self.cfg = self.getConfigFromFile()
        # get system settings from config
        config= self.cfg.get("system", {})

        # NeoPixels must be connected to baord.D10, board.D12, board.D18 or board.D21 to work.
        self.LED_PIN = board.D18 if config.get("ledPin", 12) == 18 else board.D12   # PIN on raspi where LED strip is connected
        self.LED_COUNT = config.get("ledCount", 120)            # Number of LED pixels.
        self.LED_START = config.get("ledStart", 0)              # inner (1st) ring, which LED is the starting point (12 o'clock)
        self.LED_DIRECTION = config.get("ledDirection", 1)      # 1 for clockwise, -1 for anticlockwise direction of LEDs
        self.LED_START2 = config.get("ledStart2", 60)           # outer (2nd) ring, which LED is the starting point (12 o'clock)
        self.LED_DIRECTION2 = config.get("ledDirection2", -1)   # 1 for clockwise, -1 for anticlockwise direction of LEDs
        self.SOUND_AVAILABLE = config.get("soundAvailable", False)  # speaker is available for playing sounds or not
        self.SOUND_VOLUME = config.get("soundVolume", 100)      # speaker volume
        try:
            if self.SOUND_AVAILABLE:
                subprocess.Popen(['amixer', 'cset', 'numid=1', '--', str(self.SOUND_VOLUME)+ '%'])
        except:
            print("error setting volume")

        # get current theme from config
        self.currentTheme = self.getCurrentTheme()

        # initialize time and status variables
        self.sec = self.min = self.hr  = 0
        self.secNew = self.minNew = self.hrNew = 0
        self.running = False
        self.disabled = True
        self.thread_running= True
        
        # initialize colors
        self.colBg = self.colBg2 = self.secCol = self.minCol = self.hrCol = (0, 0, 0)

        # initialize animations dictionary
        # will be filled by additional modules providing animations
        self.animations = {}

        # Create NeoPixel object with appropriate configuration.
        self.strip = neopixel.NeoPixel(self.LED_PIN, self.LED_COUNT)
        # old: Adafruit_NeoPixel(self.LED_COUNT, self.LED_PIN, self.LED_FREQ_HZ, self.LED_DMA, self.LED_INVERT, self.LED_BRIGHTNESS, self.LED_CHANNEL)
        # Intialize the library (must be called once before other functions).
        self.strip.auto_write = False

    def stop(self):
        self.thread_running= False
        
    # Define functions which animate LEDs in various ways.
    def ledForPixel(self, pixel):
        if (self.LED_START2 > 0 and pixel >= self.LED_START2):
            return (self.LED_COUNT- (pixel- self.LED_START2+ 1)) if (self.LED_DIRECTION2 == -1) else (self.LED_START2 + (pixel - self.LED_START2))
        return (pixel * self.LED_DIRECTION + self.LED_START) % self.LED_COUNT 

    # Define functions which animate LEDs in various ways.
    def colorSet(self, color, pixel):
        """set one specific pixel to given color."""
        pixel= round(pixel)
        # color correction for outer LEDs
        if (pixel >= 60):
            color= (color[0]- color[0]// 3, color[1]// 2, color[2]// 2)
        self.strip[self.ledForPixel(pixel)]= color

    def getConfigFromFile(self):
        cfg= {}
        try:
            with open(self.cfgFileName, 'r') as f:
                cfg = json.load(f)
        except:
            # retry after 100ms in case of exception (maybe file was just written)
            time.sleep(100)
            with open(self.cfgFileName, 'r') as f:
                cfg = json.load(f)
        return cfg

    def getCurrentTheme(self):
        themeName = self.cfg["settings"].get("currentTheme")
        theme = [x for x in self.cfg["themes"] if x["name"] == themeName]
        if (not theme):
            theme = [x for x in self.cfg["themes"] if x["name"] == "default"]
        return theme[0]

    def refreshColorsForCurrentTheme(self):
        self.colBg = ColorHelper.getColorFromRgb(self.currentTheme["color"]["bg"])
        self.colBg2 = ColorHelper.getColorFromRgb(self.currentTheme["color"]["bg2"])
        self.secCol = ColorHelper.getColorFromRgb(self.currentTheme["color"]["sec"])
        self.minCol = ColorHelper.getColorFromRgb(self.currentTheme["color"]["min"])
        self.hrCol = ColorHelper.getColorFromRgb(self.currentTheme["color"]["hr"])


    # the actual logic running the beam of time clock
    def run(self):
        
        # initialize time variables
        self.sec = self.min = self.hr  = -1
        self.running = False
        self.disabled = True
        self.justBooted= True

        # initialize config file change time
        cfgFileChangeTime = 0

        try:
            print ('starting clock {}'.format(self.thread_running))

            while self.thread_running:
                self.tNow = datetime.now()
                self.secNew = self.tNow.second
                self.minNew = self.tNow.minute
                self.hrNew  = 5* (self.tNow.hour % 12) + floor(self.tNow.minute / 12)
                # just sleep and continue if second did not change
                if (self.sec == self.secNew):
                    time.sleep(0.1)
                    continue

                # if config file changed, read and get settings and colors
                cfgFileChangeTimeNew = os.stat(self.cfgFileName).st_mtime
                if (cfgFileChangeTime != cfgFileChangeTimeNew):
                    cfgFileChangeTime = cfgFileChangeTimeNew
                    # read changed config file
                    self.cfg = self.getConfigFromFile()
                    config= self.cfg.get("system", {})
                    settings= self.cfg.get("settings", {})

                    # get global settings
                    self.disabled = settings.get("mode")== 'off'
                    justLight = settings.get("mode")== 'lamp'
                    justAnimation = settings.get("mode")== 'animation'
                    startAnimation = settings.get("startAnimation")
                    self.currentTheme = self.getCurrentTheme()
                    self.refreshColorsForCurrentTheme()

                    self.SOUND_AVAILABLE = config.get("soundAvailable", False)
                    self.SOUND_VOLUME = config.get("soundVolume", 100)
                    try:
                        if self.SOUND_AVAILABLE:
                            subprocess.Popen(['amixer', 'cset', 'numid=1', '--', str(self.SOUND_VOLUME)+ '%'])
                    except:
                        print("error setting volume")

                    # reset background as current theme may have changed (but only if enabled)
                    if (not self.disabled and (not startAnimation or self.running)):
                        self.colorWipeSpecial(self.colBg, self.colBg2, 50, 8)

                # if disabled, stop if was running before or do nothing
                if (self.disabled):
                    # show stop animation and stop if still running
                    if (self.running):
                        self.running = False
                        black= (0,0,0)
                        self.colorWipeSpecial(black, black, 50, 8)
                    # pause 1sec and skip all the rest
                    time.sleep(1)
                    continue

                # it is enabled, so if not running yet play start animation if requested
                if (startAnimation and not self.running):
                    self.colorWipe((255, 0, 0), 30)  # Green wipe
                    self.colorWipe((0, 255, 0), 20)  # Green wipe
                    self.colorWipe((0, 0, 255), 10)  # Green wipe
                    #self.rainbowCycle(10, 1)
                    self.theaterChase((0, 0, 255))  # Blue theater chase
                    self.colorWipe((0, 255, 0), 40, 4)  # red extra wipe
                    self.colorWipe((0, 0, 255), 30, 4)  # blue extra wipe
                    self.colorWipe((255, 0, 0), 20, 4)  # green extra wipe
                    # set background to prepare for clock if not disabled
                    if (not self.disabled):
                        self.colorWipeSpecial(self.colBg, self.colBg2, 25, 4)

                # if we are here, clock is running
                self.running = True

                # use clock as light, if just light is enabled, no further actions required
                if (justLight):
                    self.colorWipe(ColorHelper.getColorFromRgb(settings.get("lightColor")), 30, 4)
                    # pause and skip all the rest
                    time.sleep(1)
                    continue

                # use clock to play an animation only, no further actions required
                if (justAnimation):
                    self.animations[settings.get('currentAnimation')]()
                    # pause and skip all the rest
                    time.sleep(0.1)
                    continue

                # else do all the clock magic
                if (self.sec != self.secNew):
                    # every full minute check for timers in config matching current time
                    if (self.secNew == 0):
                        # check if clock was booted recently and tell IP address if sound module is available
                        uptime= 0
                        if self.justBooted:
                            uptime= float(os.popen("awk '{print $1}' /proc/uptime").readline().strip())
                        if uptime > 120:
                            self.justBooted= False
                        if self.justBooted and uptime > 60:
                            self.justBooted= False
                            ipText= ''
                            adapters = ifaddr.get_adapters()
                            for adapter in adapters:
                                aName= adapter.nice_name.lower()
                                if aName== 'lo' or 'virtual' in aName or 'loopback' in aName or 'bluetooth' in aName:
                                    continue
                                for ip in adapter.ips:
                                    if not type(ip.ip) == str:
                                        continue
                                    for i in range(0, len(ip.ip)):
                                        ipText+= ip.ip[i]+ ' '
                            os.popen('espeak -s 30 -g 30 "my i p address is: '+  ipText+ '"')

                        # check all timers and run the active ones for the current second

                        # timers format: [seconds, optional2] [minutes] [hours] [day of month] [month] [day of week] [year, optional1]
                        # https://github.com/josiahcarlson/parse-crontab
                        # 30 */2 * * * -> 30 minutes past the hour every 2 hours
                        # 15,45 23 * * * -> 11:15PM and 11:45PM every day
                        # 0 1 ? * SUN -> 1AM every Sunday
                        # 0 1 * * SUN -> 1AM every Sunday (same as above)
                        # 24 7 L * * -> 7:24 AM on the last day of every mont

                        for tmr in self.cfg['timers']:
                            crontab = CronTab(tmr['time'])
                            # run given animation if given timer is less than 1 sec. back
                            if (crontab.previous(self.tNow, default_utc=False) <= -1):
                                continue
                            # skip if timer is disabled
                            if tmr.get('enabled', True) == False:
                                continue
                            if tmr.get('action') == "animation":
                                try:
                                    self.animations[tmr['params']]()
                                except Exception as ex:
                                    print("animation '{0}' error for timer {1} ".format(tmr['params'], tmr['name']), ex)
                            # apply new theme
                            elif tmr.get('action') == "theme":
                                if ([x for x in self.cfg["themes"] if x["name"] == tmr['params']]):
                                    settings["currentTheme"] = tmr['params']
                                    self.currentTheme = self.getCurrentTheme()
                                    self.refreshColorsForCurrentTheme()
                                else:
                                    print("theme '{0}' not found for timer {1} ".format(tmr['params'], tmr['name']))
                            # play audio file if sound module available
                            elif tmr.get('action') == "sound" and self.SOUND_AVAILABLE:
                                try:
                                    # play special cuckoo sound once per hour count
                                    if tmr['params'] == 'cuckoo-hours':
                                        hr= self.tNow.hour % 12
                                        if hr== 0:
                                            hr= 12
                                        file= '/home/pi/beamOfTime/bot/clock/sounds/cuckoo-hours/'+ str(hr)+ '.mp3'
                                    # play given sound file
                                    else:
                                        file= '/home/pi/beamOfTime/bot/clock/sounds/'+ tmr['params']
                                    res= subprocess.Popen(['mpg123', file], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
                                except Exception as ex:
                                    print("sound '{0}' error for timer {1} ".format(tmr['params'], tmr['name']), ex)
                            elif tmr.get('action') == "speak" and self.SOUND_AVAILABLE:
                                try:
                                    # speak current time
                                    if tmr.get('params', '') == 'current-time':
                                        hr= self.tNow.hour % 12
                                        if hr== 0:
                                            hr= 12
                                        min= self.tNow.minute
                                        timeText= 'Es ist '+ str(hr)+ ' : '+ str(min)
                                    # speak provided text
                                    else:
                                        timeText= tmr.get('params', '')
                                    res= subprocess.Popen(['espeak', '-s', '1', '-g', '1', '-vde', timeText], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, close_fds=True)
                                except Exception as ex:
                                    print("speak '{0}' error for timer {1} ".format(tmr['params'], tmr['name']), ex)
                        
                    # always reset background first
                    self.setBgColors(self.colBg, self.colBg2)

                    if (self.hrCol != (0, 0, 0)):
                        # set brightness range from 12h to current hour based on config
                        if ("gradient" in self.currentTheme and self.currentTheme["gradient"]["hr"]):
                            for i in range(1, self.hrNew):
                                r= round(self.hrCol[0]/ self.hrNew* i)
                                g= round(self.hrCol[1]/ self.hrNew* i)
                                b= round(self.hrCol[2]/ self.hrNew* i)
                                self.colorSet((r, g, b), i)
                        # for hours set only inner ring
                        self.colorSet(self.hrCol, self.hrNew)
                    if (self.minCol != (0, 0, 0)):
                        # set brightness range from 12h to current hour based on config
                        if ("gradient" in self.currentTheme and self.currentTheme["gradient"]["min"]):
                            for i in range(1, self.minNew):
                                r= round(self.minCol[0]/ self.minNew* i)
                                g= round(self.minCol[1]/ self.minNew* i)
                                b= round(self.minCol[2]/ self.minNew* i)
                                self.colorSet((r, g, b), i+ self.LED_START2)
                        # for minutes set only outer ring
                        self.colorSet(self.minCol, self.minNew+ self.LED_START2)
                    if (self.secCol != (0, 0, 0)):
                        # set seconds on inner ring
                        self.colorSet(self.secCol, self.secNew)
                        # if more than 60 LED, set seconds on outer ring
                        if self.LED_COUNT> 60:
                            self.colorSet(self.secCol, self.secNew+ self.LED_START2)

                    self.sec = self.secNew
                    self.min = self.minNew
                    self.hr = self.hrNew

                self.strip.show()
                time.sleep(0.01)
                
        except:
            self.colorWipe((0,0,0), 10, 8)
            print("Unexpected error:", sys.exc_info()[0])
            raise

        finally:
            print ('stopping clock')
            self.colorWipe((0,0,0), 10, 8)

