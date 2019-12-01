
import threading
import time
import atexit
import os

from tkinter import *
from math import *

def f2r(f):
    return f* 2* pi

def drawHand(canvas, mid, hand, r, l, w, col):
    angle= f2r(hand/ 60)
    x1= mid + (sin(angle) * r)
    y1= mid - (cos(angle) * r)
    x2= x1+ sin(angle)* l
    y2= y1- cos(angle)* l
    return canvas.create_line((x1, y1, x2, y2), fill=col, width=w)

class NeoPixel(object):
    def __init__(self, pin, num, freq_hz=800000, dma=10, invert=False,
            brightness=255, channel=0, strip_type=1):

        self.n= num                 # count of LEDs
        self.ww = self.wh = 800     # window size
        self.brd = 50               # window border
        self.r = (self.ww - (2 * self.brd)) // 2
        self.mid = self.r + self.brd
        self.ll = 100               # length of minutes
        self.lw = 10                # width/thickness of minutes

        # setup tkinter windows and canvas
        self.mw = Tk()
        self.mw.configure(background='white')
        self.canvas = Canvas(self.mw, width=self.ww, height=self.wh, bg="black")
        self.canvas.pack(expand = YES, fill = BOTH)
        img = PhotoImage(file= os.path.dirname(os.path.realpath(__file__))+ '\\blackCircle.gif')
        self.canvas.create_image(45, 45, image=img, anchor=NW)
        label = Label(image=img)
        label.image = img # keep a reference!
        label.place(x=0, y=0, width=1, height=1)
        label.pack()
        self.mw.geometry("{0}x{1}".format(self.ww, self.wh))

        print('LED clock emulator started')
        
        # initialize lines for minutes
        self.canvasLines = {}
        # inner ring
        for i in range(0, 60):
            l= self.ll
            r= (self.r- 2* l- 20)
            # if only one ring make lines longer
            if self.n<= 60:
                r= self.r- 2* l
                l= l* 2
            # if two rings, make 5,10,15... minute lines longer
            elif i % 5== 0:
                r= r- l
                l= 2* l
            self.canvasLines[i] = drawHand(self.canvas, self.mid, i, r, l, self.lw, '#000000')

        for i in range(60, self.n):
            l= self.ll
            r= self.r- l
            self.canvasLines[i] = drawHand(self.canvas, self.mid, i-60, r, l, self.lw, '#000000')

        # init led strip array with given length using black color
        self._led_data = []
        for i in range(0, self.n+ 1):
            self._led_data.append((0, 0, 0))

        # Substitute for __del__, traps an exit condition and cleans up properly
        atexit.register(self._cleanup)

    def __setitem__(self, pos, value):
        # Handle if a slice of positions are passed in by setting the appropriate
        # LED data values to the provided values.
        if isinstance(pos, slice):
            index = 0
            for n in xrange(*pos.indices(self.n)):
                red = value[index][0]
                green = value[index][1]
                blue = value[index][2]
                red = red if red <= 255 else 255
                green = green if green <= 255 else 255
                blue = blue if blue <= 255 else 255
                value[index] = (red, green, blue)
                self._led_data[n] = value[index] # if (value[index] <= 0xFFFFFF) else 0xFFFFFF
                index += 1
        # Else assume the passed in value is a number to the position.
        else:
            red = value[0]
            green = value[1]
            blue = value[2]
            red = red if red <= 255 else 255
            green = green if green <= 255 else 255
            blue = blue if blue <= 255 else 255
            value = (red, green, blue)
            self._led_data[pos] = value

    def __getitem__(self, pos):
        return self._led_data[pos]

    def _cleanup(self):
        # Clean up memory used by the library when not needed anymore.
        self.mw.destroy()

    def begin(self):
        """Initialize library, must be called once before other functions are called.
        """
        return

    def show(self):
        """Update the display with the data from the LED buffer."""
        for p in range(0, self.n):
            self.canvas.itemconfig(self.canvasLines[p], fill='#{:02X}{:02X}{:02X}'.format(self._led_data[p][0], self._led_data[p][1], self._led_data[p][2]))
        self.mw.update()

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
        return self.n

    def getPixelColor(self, pos):
        """Get the 24-bit RGB color value for the LED at position n."""
        return self._led_data[pos]

