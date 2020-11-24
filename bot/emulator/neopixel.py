
import threading
import time
import atexit
import os

from tkinter import *
from math import *

def f2r(f):
    return f* 2* pi

class NeoPixel(object):
    def __init__(self, pin, num, freq_hz=800000, dma=10, invert=False,
            brightness=255, channel=0, strip_type=1):

        self.n= self.LEDcount= num                  # count of LEDs
        self.windowWidth = self.windowHight = 800   # window size
        self.windowBorder = 50                      # window border
        self.radius = (self.windowWidth - (2 * self.windowBorder)) // 2
        self.mid = self.radius + self.windowBorder
        self.handsLength = 100                      # length of minutes
        self.handsWidth = 10                        # width/thickness of minutes
        self.innerDir= -1                           # direction 1: clockwise, -1: anti-clockwise inner ring
        self.innerStart= 30                         # starting pixel (top position) inner ring
        self.outerDir= 1                            # direction 1: clockwise, -1: anti-clockwise inner ring
        self.outerStart= 90                         # starting pixel (top position) outer ring

        # setup tkinter windows and canvas
        self.mainWindow = Tk()
        self.mainWindow.configure(background='white')
        self.canvas = Canvas(self.mainWindow, width=self.windowWidth, height=self.windowHight, bg="black")
        self.canvas.pack(expand = YES, fill = BOTH)
        img = PhotoImage(file= os.path.dirname(os.path.realpath(__file__))+ '\\blackCircle.gif')
        self.canvas.create_image(45, 45, image=img, anchor=NW)
        label = Label(image= img)
        label.image = img # keep a reference!
        label.place(x=0, y=0, width=1, height=1)
        label.pack()
        self.mainWindow.geometry("{0}x{1}".format(self.windowWidth, self.windowHight))

        print('LED clock emulator started')
        
        # initialize lines for minutes
        self.canvasLines = {}
        # inner ring
        for i in range(0, 60):
            length= self.handsLength
            radius= (self.radius- 2* length- 20)

            # if only one ring make lines longer
            if self.LEDcount<= 60:
                radius= self.radius- 2* length
                length= 2* length
            # if two rings, make 5,10,15... minute lines longer
            elif i % 5== 0:
                radius= radius- length
                length= 2* length
            self.canvasLines[i] = self.drawHand(i, radius, length, self.handsWidth, '#000000')

        # outer ring if LED count is > 60
        for i in range(60, self.LEDcount):
            length= self.handsLength
            radius= self.radius- length
            self.canvasLines[i] = self.drawHand(i, radius, length, self.handsWidth, '#000000')

        # init led strip array with given length using black color
        self._led_data = []
        for i in range(0, self.LEDcount+ 1):
            self._led_data.append((0, 0, 0))

        # Substitute for __del__, traps an exit condition and cleans up properly
        atexit.register(self._cleanup)

    def __setitem__(self, pos, value):
        # Handle if a slice of positions are passed in by setting the appropriate
        # LED data values to the provided values.
        if isinstance(pos, slice):
            index = 0
            for n in xrange(*pos.indices(self.LEDcount)):
                # make sure color values are valid
                value[index] = (min(255, value[index][0]), min(255, value[index][1]), min(255, value[index][2]))
                self._led_data[n] = value[index] # if (value[index] <= 0xFFFFFF) else 0xFFFFFF
                index += 1
        # Else assume the passed in value is a number to the position.
        else:
            # make sure color values are valid
            value = (min(255, value[0]), min(255, value[1]), min(255, value[2]))
            self._led_data[pos] = value

    def __getitem__(self, pos):
        return self._led_data[pos]

    def _cleanup(self):
        # Clean up memory used by the library when not needed anymore.
        self.mainWindow.destroy()

    def begin(self):
        """Initialize library, must be called once before other functions are called.
        """
        return

    def drawHand(self, hand, r, l, w, col):
        # transform LED position based on config
        if hand< 60:
            hand= (self.innerStart+ hand) % 60 if self.innerDir== 1 else (60- self.innerStart+ hand) % 60
        else:
            hand= (self.outerStart+ hand) % 60 if self.outerDir== 1 else (60- self.outerStart+ hand) % 60
            hand= hand+ 60
            # hand= self.outerStart+ hand- diff if self.outerDir== 1 else (self.outerStart- hand+ diff) % 120

        angle= f2r(hand/ 60)
        x1= self.mid + (sin(angle) * r)
        y1= self.mid - (cos(angle) * r)
        x2= x1+ sin(angle)* l
        y2= y1- cos(angle)* l
        return self.canvas.create_line((x1, y1, x2, y2), fill=col, width=w)

    def show(self):
        """Update the display with the data from the LED buffer."""
        for p in range(0, self.LEDcount):
            self.canvas.itemconfig(self.canvasLines[p], fill='#{:02X}{:02X}{:02X}'.format(self._led_data[p][0], self._led_data[p][1], self._led_data[p][2]))
        self.mainWindow.update()

    def setPixelColor(self, pos, color):
        """Set LED at position n to the provided 24-bit color value (in RGB order).
        """
        #print('setting color {1} for pixel {0}'.format(n, color))
        self._led_data[pos] = color

    def setPixelColorRGB(self, pos, red, green, blue):
        self.setPixelColor(pos, (red, green, blue))

    def setBrightness(self, brightness):
        return

    def getBrightness(self):
        return 0

    def getPixels(self):
        """Return an object which allows access to the LED display data as if
        it were a sequence of 24-bit RGB values.
        """
        return self._led_data

    def numPixels(self):
        """Return the number of pixels in the display."""
        return self.LEDcount

    def getPixelColor(self, pos):
        """Get the 24-bit RGB color value for the LED at position n."""
        return self._led_data[pos]

