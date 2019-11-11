import time
import random
from datetime import datetime
from clock.botclock import BotClock, ColorHelper
import neopixel

class BotClock(BotClock):
    def __init__(self):
        super(BotClock, self).__init__()
        # add available animations to dictionary
        self.animations["colorDrop"] = self.animationColorDrop
        self.animations["colorWipe"] = self.animationColorWipe
        self.animations["colorWipeQuarter"] = self.animationColorWipeQuarter
        self.animations["rainbow"] = self.animationRainbow
        # keep random and nothing at the end to allow random to pick only valid ones (count- 2)
        self.animations["random"] = self.animationRandom
        self.animations["nothing"] = self.animationNothing

    def animationRandom(self):
        animationNames= list(self.animations.keys())
        anim= self.animations[animationNames[random.randrange(0, len(animationNames)- 2)]]
        anim()

    def animationColorWipe(self):
        self.colorWipe(self.secCol, 20)
        self.colorWipe(self.colBg, 20)

    def animationRainbow(self):
        self.rainbow(10, 1)

    # Define functions which animate LEDs in various ways.
    def colorWipe(self, color, wait_ms=50, group=1):
        """Wipe color across display a pixel at a time."""
        groups = self.strip.n // group
        for i in range(groups):
            for j in range(group):
                self.colorSet(color, i + j * groups)
                #self.strip[self.ledForPixel(i + j * groups)]= color
            self.strip.show()
            time.sleep(wait_ms/1000.0)

    def animationNothing(self):
        return

    def animationColorWipeQuarter(self):
        self.colorWipeSpecial(self.secCol, self.secCol, 20, 4)
        self.colorWipeSpecial(self.colBg, self.colBg, 20, 4)

    # Define functions which animate LEDs in various ways.
    def setBgColors(self, color, color2):
        for pixel in range(self.strip.n):
            newCol = (0, 0, 0)
            colBg = color2 if (pixel % 5) == 0 else color
            self.strip[self.ledForPixel(pixel)]= colBg
    
    # Define functions which animate LEDs in various ways.
    def colorWipeSpecial(self, color, color2, wait_ms= 50, group= 1):
        """Wipe color across display a pixel at a time."""
        groups = self.strip.n // group
        for i in range(groups):
            for j in range(group):
                pixel = i + j * groups
                colBg = color2 if (pixel % 5) == 0 else color
                self.strip[self.ledForPixel(pixel)]= colBg
            self.strip.show()
            time.sleep(wait_ms/1000.0)

    def theaterChase(self, color, wait_ms=50, iterations=10):
        """Movie theater light style chaser animation."""
        for j in range(iterations):
            for q in range(3):
                for i in range(0, self.strip.n, 3):
                    self.strip[self.ledForPixel(i+q)]= color
                self.strip.show()
                time.sleep(wait_ms/1000.0)
                for i in range(0, self.strip.n, 3):
                    self.strip[self.ledForPixel(i+q)]= 0

    def wheel(self, pos):
        """Generate rainbow colors across 0-255 positions."""
        if pos < 85:
            return (pos * 3, 255 - pos * 3, 0)
        elif pos < 170:
            pos -= 85
            return (255 - pos * 3, 0, pos * 3)
        else:
            pos -= 170
            return (0, pos * 3, 255 - pos * 3)

    def rainbow(self, wait_ms=10, iterations=1):
        """Draw rainbow that fades across all pixels at once."""
        for j in range(256*iterations):
            for i in range(60): #self.strip.n):
                self.strip[self.ledForPixel(i)]= self.wheel((i+j) & 255)
                self.strip[self.ledForPixel(i+ self.LED_START2)]= self.wheel((i+j) & 255)
            self.strip.show()
            time.sleep(wait_ms/1000.0)

    def rainbowCycle(self, wait_ms=10, iterations=1):
        """Draw rainbow that uniformly distributes itself across all pixels."""
        for j in range(256*iterations):
            for i in range(60): #self.strip.n):
                self.strip[self.ledForPixel(i)]= self.wheel((int(self.ledForPixel(i) * 256 / self.strip.n) + j) & 255)
                self.strip[self.ledForPixel(i+ self.LED_START2)]= self.wheel((int(self.ledForPixel(i) * 256 / self.strip.n) + j) & 255)
            self.strip.show()
            time.sleep(wait_ms/1000.0)

    def theaterChaseRainbow(self, wait_ms=50):
        """Rainbow movie theater light style chaser animation."""
        for j in range(256):
            for q in range(3):
                for i in range(0, self.strip.n, 3):
                    self.strip[self.ledForPixel(i+q)]= self.wheel((i+j) % 255)
                self.strip.show()
                time.sleep(wait_ms/1000.0)
                for i in range(0, self.strip.n, 3):
                    self.strip[self.ledForPixel(i+q)]= 0

    def animationColorDrop(self):
        self.colorDrop(self.secCol, self.colBg, 20)

    # Define functions which animate LEDs in various ways.
    def colorDrop(self, color, color2, wait_ms=50):
        """Wipe color across display a pixel at a time."""
        if (wait_ms < 30):
            wait_ms = 30
        max = 60 #self.strip.n
        groups = max // 2
        for i in range(groups + 1):
            self.strip[self.ledForPixel(i)]= color
            self.strip[self.ledForPixel(i+ self.LED_START2)]= color
            if (i not in (0, groups)):
                self.strip[self.ledForPixel(max - i)]= color
                self.strip[self.ledForPixel(max + self.LED_START2 - i)]= color
            self.strip.show()
            if (i < (max // 4) and wait_ms > 0):
                wait_ms -= 2
            else:
                wait_ms += 2
            time.sleep(wait_ms/1000.0)
        for i in range(groups, -1, -1):
            pixel = i
            colBg = self.colBg2 if (pixel % 5) == 0 else self.colBg

            self.strip[self.ledForPixel(pixel)]= colBg
            self.strip[self.ledForPixel(pixel+ self.LED_START2)]= colBg
            if (i not in (0, groups)):
                pixel = max - i
                colBg = self.colBg2 if (pixel % 5) == 0 else self.colBg
                self.strip[self.ledForPixel(pixel)]= colBg
                self.strip[self.ledForPixel(pixel+ self.LED_START2)]= colBg
            self.strip.show()
            if (i > (max // 4) and wait_ms > 0):
                wait_ms -= 2
            else:
                wait_ms += 2
            time.sleep(wait_ms/1000.0)

