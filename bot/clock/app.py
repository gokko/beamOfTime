#!/usr/bin/python
#
# NeoPixel wall clock
# Author: Gottfried Koschel (gogo@koschel.org)
#
# based on NeoPixel library strandtest example by Tony DiCola (tony@tonydicola.com)
# Direct port of the Arduino NeoPixel library strandtest example.  

from botclock import BotClock
from botAnimations import *

# Main program just starts the BotClock
if __name__ == '__main__':
    clock = BotClock()

    print ('Press Ctrl-C to quit.')

    clock.run()

    #print ('Color wipe animations.')
    #colorWipe(strip, (255, 0, 0))  # Red wipe
    #colorWipe(strip, (0, 255, 0))  # Blue wipe
    #colorWipe(strip, (0, 0, 255))  # Green wipe
    #print ('Theater chase animations.')
    #theaterChase(strip, (127, 127, 127))  # White theater chase
    #theaterChase(strip, (127,   0,   0))  # Red theater chase
    #theaterChase(strip, (  0,   0, 127))  # Blue theater chase
    #print ('Rainbow animations.')
    #rainbow(strip)
    #rainbowCycle(strip)
    #theaterChaseRainbow(strip)

