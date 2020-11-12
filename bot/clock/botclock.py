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
import board
import neopixel
import argparse
import platform
from subprocess import Popen, PIPE, STDOUT

from crontab import CronTab
from datetime import datetime
from subprocess import call
from math import *

isRaspi= (platform.system() == 'Linux' and platform.machine()[0:3] == 'arm')

# class with some helpful functions to deal with Color
class ColorHelper(object):

    @classmethod
    def getColorFromRgb(cls, rgb):
        col = int(rgb.replace('#', '0x'), 16)
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
        baseFolder= os.path.dirname(os.path.realpath(__file__))
        self.cfgFileName = baseFolder + '/config.json'
        self.homeFolder = os.path.dirname(os.path.dirname(os.path.dirname(baseFolder)))
        self.mediaFolder = baseFolder+ '/sounds' # self.homeFolder+ '/media'
        self.localesFolder = os.path.dirname(baseFolder) + '/locales'
        # read config from file once on init, will be updated later from web application using updateConfig() method
        self.cfgChanged= True
        with open(self.cfgFileName, 'r', encoding='utf-8') as f:
            self.cfg = json.load(f)
        # get system settings from config
        sysConfig= self.cfg.get('system', {})
        self.language= self.cfg.get('settings', {}).get('language', 'en')
        self.lampColor= ColorHelper.getColorFromRgb(self.cfg.get('settings', {}).get('lightColor'))
        self.ring2Brightness= float(self.cfg.get('system', {}).get('ledBrightness2', 100)/ 100)
        self.ring2ColorMap= {}
        i18nFile= self.localesFolder+ '/'+ self.language+ '/translation.json'
        try:
            with open(i18nFile, 'r', encoding='utf-8') as f:
                self.i18n = json.load(f)
        except:
            print('error reading locales for language {0}, file {1}'.format(self.language, i18nFile))

        # NeoPixels must be connected to baord.D10, board.D12, board.D18 or board.D21 to work.
        self.LED_PIN = board.D18 if sysConfig.get('ledPin', 12) == 18 else board.D12   # PIN on raspi where LED strip is connected
        self.LED_COUNT = sysConfig.get('ledCount', 120)            # Number of LED pixels.
        self.LED_START = sysConfig.get('ledStart', 0)              # inner (1st) ring, which LED is the starting point (12 o'clock)
        self.LED_DIRECTION = sysConfig.get('ledDirection', 1)      # 1 for clockwise, -1 for anticlockwise direction of LEDs
        self.LED_START2 = sysConfig.get('ledStart2', 60)           # outer (2nd) ring, which LED is the starting point (12 o'clock)
        self.LED_DIRECTION2 = sysConfig.get('ledDirection2', -1)   # 1 for clockwise, -1 for anticlockwise direction of LEDs
        self.SOUND_AVAILABLE = sysConfig.get('soundAvailable', False)  # speaker is available for playing sounds or not
        self.SOUND_VOLUME = sysConfig.get('soundVolume', 100)      # speaker volume
        try:
            if self.SOUND_AVAILABLE and isRaspi:
                Popen('amixer -q sset Master {0}%'.format(self.SOUND_VOLUME), shell=True)
        except:
            print('error setting volume {0}'.format(sys.exc_info()[0]))

        # get current theme from config
        self.currentTheme = self.getCurrentTheme()

        # initialize time and status variables
        self.sec = self.min = self.hr  = 0
        self.secNew = self.minNew = self.hrNew = 0
        self.running = False
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
        
    # get number of LED based on direction and start position in configuration
    def ledForPixel(self, pixel):
        if (self.LED_START2 > 0 and pixel >= self.LED_START2):
            return (self.LED_COUNT- (pixel- self.LED_START2+ 1)) if (self.LED_DIRECTION2 == -1) else (self.LED_START2 + (pixel - self.LED_START2))
        return (pixel * self.LED_DIRECTION + self.LED_START) % self.LED_COUNT 

    # get the color for given pixel (piexel=0-59 with ring=0|1)
    # ring: 0= inner, 1= outer
    def colorForPixel(self, ring, pixel):
        # get background color first
        color= self.lampColor if self.mode== 'lamp' else (0, 0, 0)
        if self.mode== 'clock':
            # get background color
            color= self.colBg2 if (pixel % 5) == 0 else self.colBg
            # hours are shown on inner ring only
            if (ring== 0 and pixel== self.hrNew and self.hrCol != (0, 0, 0)):
                color= self.hrCol
            # minutes are shown on outer ring only
            if ((ring== 1 or self.LED_COUNT<= 60) and pixel== self.minNew and self.minCol != (0, 0, 0)):
                color= self.minCol
            # seconds are shown on both inner and outer ring
            if (pixel== self.secNew and self.secCol != (0, 0, 0)):
                color= self.secCol

        return color

    # set all pixel for all available rings
    def updateAllPixel(self):
        for ring in range(2 if self.LED_COUNT> 60 else 1):
            for pixel in range(60):
                color= self.colorForPixel(ring, pixel)
                self.colorRingSet(color, ring, pixel)
        self.strip.show()

    # set one specific pixel in given ring to given color
    def colorRingSet(self, color, ring, pixel):
        self.colorSet(color, ring* 60+ pixel)

    # set one specific pixel to given color
    def colorSet(self, color, pixel):
        """set one specific pixel to given color."""
        pixel= round(pixel)
        
        # increase brightness of outer ring
        # if pixel>= 60:
        #     # create new color map if it's not available yet for given color
        #     if color not in self.ring2ColorMap:
        #         fact= min(self.ring2Brightness, 255/ max(color))
        #         newColor= (min(int(color[0]* fact), 255), min(int(color[1]* fact), 255), min(int(color[2]* fact), 255))
        #         self.ring2ColorMap[color]= newColor
        #     color= self.ring2ColorMap[color]

        self.strip[self.ledForPixel(pixel)]= color

    def readCurrentIpAddress(self):
        ipAddress= ''
        adapters = ifaddr.get_adapters()
        for adapter in adapters:
            aName= adapter.nice_name.lower()
            if aName== 'lo' or 'virtual' in aName or 'loopback' in aName or 'bluetooth' in aName:
                continue
            for ip in adapter.ips:
                if not type(ip.ip) == str:
                    continue
                ipAddress= ip.ip
        return ipAddress

    def updateConfig(self, cfg):
        self.cfg= cfg
        self.cfgChanged= True

    def getCurrentTheme(self):
        themeName = self.cfg['settings'].get('currentTheme')
        theme = [x for x in self.cfg['themes'] if x['name'] == themeName]
        if (not theme):
            theme = self.cfg['themes']
        return theme[0]

    def refreshColorsForCurrentTheme(self):
        self.colBg = ColorHelper.getColorFromRgb(self.currentTheme['color']['bg'])
        self.colBg2 = ColorHelper.getColorFromRgb(self.currentTheme['color']['bg2'])
        self.secCol = ColorHelper.getColorFromRgb(self.currentTheme['color']['sec'])
        self.minCol = ColorHelper.getColorFromRgb(self.currentTheme['color']['min'])
        self.hrCol = ColorHelper.getColorFromRgb(self.currentTheme['color']['hr'])

    # timers format: [seconds, optional2] [minutes] [hours] [day of month] [month] [day of week] [year, optional1]
    # https://github.com/josiahcarlson/parse-crontab
    # 30 */2 * * * -> 30 minutes past the hour every 2 hours
    # 15,45 23 * * * -> 11:15PM and 11:45PM every day
    # 0 1 ? * SUN -> 1AM every Sunday
    # 0 1 * * SUN -> 1AM every Sunday (same as above)
    # 24 7 L * * -> 7:24 AM on the last day of every mont
    def checkAndApplyTimers(self):
        settings= self.cfg.get('settings', {})
        for tmr in self.cfg['timers']:
            try:
                # skip if timer is disabled
                if tmr.get('enabled', True) == False:
                    continue
                # parse the crontab entry
                tmrDiff = round(CronTab(tmr['time']).previous(self.tNow, default_utc=False))
                # print(self.tNow, tmr['name'], tmr['time'], tmrDiff)
                # skip if this entry is not due in the current second
                if (tmrDiff != 0):
                    continue
                # switch function (off, clock, lamp, animation)
                if tmr.get('action') == 'function' and tmr['params'] in ['off', 'clock', 'lamp', 'animation']:
                    self.mode= settings['mode']= tmr['params']
                    self.cfgChanged= True
                # run given animation
                if tmr.get('action') == 'animation':
                    try:
                        self.animations[tmr['params']]()
                    except Exception as ex:
                        print('animation {0} error for timer {1} '.format(tmr['params'], tmr['name']), ex)
                # apply new theme
                elif tmr.get('action') == 'theme':
                    if ([x for x in self.cfg['themes'] if x['name'] == tmr['params']]):
                        settings['currentTheme'] = tmr['params']
                        self.currentTheme = self.getCurrentTheme()
                        self.refreshColorsForCurrentTheme()
                    else:
                        print('theme {0} not found for timer {1} '.format(tmr['params'], tmr['name']))
                # play audio file if sound module available
                elif tmr.get('action') == 'sound' and self.SOUND_AVAILABLE:
                    try:
                        # play special cuckoo sound once per hour count
                        if tmr['params'] == 'cuckoo-hours':
                            hr= self.tNow.hour % 12
                            if hr== 0:
                                hr= 12
                            file= self.mediaFolder+ '/cuckoo-hours/'+ str(hr)+ '.mp3'
                        # play given sound file
                        else:
                            file= self.mediaFolder+ '/'+ tmr['params']
                        res= Popen('mpg123 "{0}"'.format(file), shell=True)
                    except Exception as ex:
                        print('sound {0} error for timer {1} '.format(tmr['params'], tmr['name']), ex)
                elif tmr.get('action') == 'speak' and self.SOUND_AVAILABLE:
                    try:
                        i18nSpeak= self.i18n.get('timers', {}).get('speak', {})
                        # speak current time
                        if tmr.get('params', '').lower().find('current-time')>= 0:
                            hr= self.tNow.hour % 12
                            if hr== 0:
                                hr= 12
                            textToSpeak= i18nSpeak.get('current_time', '').format(hr, self.tNow.minute)
                            if self.tNow.minute== 0:
                                textToSpeak= i18nSpeak.get('current_time_0min', '').format(hr)
                        # speak current date
                        elif tmr.get('params', '').lower().find('current-date')>= 0:
                            weekday= i18nSpeak.get('weekday_{0}'.format(self.tNow.weekday()), '')
                            month= i18nSpeak.get('month_{0}'.format(self.tNow.month), '')
                            textToSpeak= i18nSpeak.get('current_date', '').format(weekday, self.tNow.day, month, self.tNow.year)
                        # speak provided text
                        else:
                            textToSpeak= tmr.get('params', '')
                        speed= i18nSpeak.get('speed', '')
                        Popen('espeak {0} -v{1} "{2}"'.format(speed, self.language, textToSpeak), shell=True)
                    except Exception as ex:
                        print('speak {0} error for timer {1} '.format(tmr['params'], tmr['name']), ex)

            except Exception as ex:
                print('error processing timer {0} '.format(tmr['name']), ex)
        

    # the actual logic running the beam of time clock
    def run(self):
        
        # initialize time variables
        self.sec = self.min = self.hr  = -1
        self.running = False
        self.mode= 'clock'
        # remember application start time
        self.tStartTime= datetime.now()
        # check if system booted/started recently
        # get system uptime on raspi
        if isRaspi:
            uptime= float(os.popen("awk '{print $1}' /proc/uptime").readline().strip())
        # dummy value for debugging on other system
        else:
            uptime= 10
        self.justBooted= (uptime < 60)

        # initialize config file change time
        cfgFileChangeTime = 0

        try:
            print ('starting clock {}'.format(self.thread_running))

            prevMode= ''
            while self.thread_running:
                self.tNow = datetime.now()
                self.secNew = self.tNow.second
                self.minNew = self.tNow.minute
                self.hrNew  = 5* (self.tNow.hour % 12) + floor(self.tNow.minute / 12)
                # just sleep and continue if second did not change
                if (self.sec == self.secNew):
                    time.sleep(0.1)
                    continue

                # if config changed (from web application), get settings and colors
                if (self.cfgChanged):
                    self.cfgChanged= False
                    config= self.cfg.get('system', {})
                    settings= self.cfg.get('settings', {})
                    self.lampColor= ColorHelper.getColorFromRgb(settings.get('lightColor'))
                    self.ring2Brightness= float(self.cfg.get('system', {}).get('ledBrightness2', 100)/ 100)
                    self.ring2ColorMap= {}
                    self.mode= settings.get('mode')

                    # get language and read translations from i18n file
                    if self.language != settings.get('language', 'en'):
                        self.language= settings.get('language', 'en')
                        i18nFile= self.localesFolder+ '/'+ self.language+ '/translation.json'
                        try:
                            with open(i18nFile, 'r', encoding='utf-8') as f:
                                self.i18n = json.load(f)
                        except:
                            print('error reading locales for language {0}, file {1}'.format(self.language, i18nFile))

                    # get global settings
                    startAnimation = settings.get('startAnimation')
                    self.currentTheme = self.getCurrentTheme()
                    self.refreshColorsForCurrentTheme()

                    self.SOUND_AVAILABLE = config.get('soundAvailable', False)
                    self.SOUND_VOLUME = config.get('soundVolume', 100)
                    try:
                        if self.SOUND_AVAILABLE and isRaspi:
                            Popen('amixer -q sset Master {0}%'.format(self.SOUND_VOLUME), shell=True)
                    except:
                        print('error setting volume {0}'.format(sys.exc_info()[0]))

                # check if clock was booted recently and tell IP address if sound module is available
                if self.secNew == 0 and self.justBooted:
                    self.justBooted= False
                    # only speak IP during day times if sound module is available
                    if self.SOUND_AVAILABLE and self.tNow.hour>= 8 and self.tNow.hour<= 22:
                        ipAddress= self.readCurrentIpAddress()
                        ipText= ''
                        for i in range(0, len(ipAddress)):
                            ipText+= ipAddress[i]+ ' '
                        i18nSpeak= self.i18n.get('timers', {}).get('speak', {})
                        ipText= ipText.replace('.', i18nSpeak.get('dot', '.'))
                        ipText= i18nSpeak.get('current_ip_address', '').format(ipText)
                        Popen('espeak -v{0} -s 100 "{1}"'.format(self.language, ipText), shell=True)

                # if not in clock mode, simple update
                if (self.mode!= 'clock'):
                    # remember time
                    self.sec = self.secNew
                    self.min = self.minNew
                    self.hr = self.hrNew
                    # keep LEDs updated even if unchanged
                    self.strip.show()

                # clock is enabled, so if it's not running yet play start animation if enabled
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
                    if (self.mode!= 'off'):
                        self.colorWipeSpecial(self.colBg, self.colBg2, 25, 4)

                # if we are here, clock is running
                if (self.mode!= 'off'):
                    self.running = True

                    # every full minute check for timers in config matching current time
                    if (self.secNew == 0):
                        self.checkAndApplyTimers()

                # if disabled, stop if was running before
                if (self.mode== 'off'):
                    # show stop animation and stop if still running
                    if (self.running):
                        self.running = False
                        black= (0,0,0)
                        self.colorWipeSpecial(black, black, 50, 8)

                # use clock as light, if just light is enabled, no further actions required
                elif (self.mode== 'lamp'):
                    self.colorWipe(self.lampColor, 30, 4)

                # use clock to play an animation only, no further actions required
                elif (self.mode== 'animation'):
                    self.animations[settings.get('currentAnimation', 'colorDrop')]()

                # else update all LEDs to show current time (incl. background)
                elif (self.mode== 'clock' and self.sec != self.secNew):
                    self.updateAllPixel()

                    self.sec = self.secNew
                    self.min = self.minNew
                    self.hr = self.hrNew
                
                # remember current function mode
                prevMode= self.mode

        except:
            print('Unexpected error:', ', '.join(map(str, sys.exc_info())) )
            raise

        finally:
            print ('stopping clock')
            self.colorWipe((0,0,0), 10, 8)
            os._exit(0)
