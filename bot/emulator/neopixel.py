
import threading
import time
import atexit
import os

from tkinter import *
from math import *

def Color(green, red, blue, white = 0):
    """Convert the provided red, green, blue color to a 24-bit color value.
    Each color component should be a value 0-255 where 0 is the lowest intensity
    and 255 is the highest intensity, colors are modified to better fit to PC screen
    """
    red = red + ((255 - red) // 4)
    green = green + ((255 - green) // 4)
    blue = blue + ((255 - blue) // 4)
    return (red, green, blue)

class _LED_Data(object):
    """Wrapper class which makes a SWIG LED color data array look and feel like
    a Python list of integers.
    """
    def __init__(self, channel, size):
        self.size = size
        self.channel = channel

        # initialize colors for LEDs
        self.ptColor = []
        for i in range(0, size+ 1):
            self.ptColor.append((0xff, 0xff, 0xff))

    def __getitem__(self, pos):
        """Return the 24-bit RGB color value at the provided position or slice
        of positions.
        """
        return self.ptColor[pos]

    def __setitem__(self, pos, value):
        """Set the 24-bit RGB color value at the provided position or slice of
        positions.
        """

        # Handle if a slice of positions are passed in by setting the appropriate
        # LED data values to the provided values.
        if isinstance(pos, slice):
            index = 0
            for n in xrange(*pos.indices(self.size)):
                red = value[index][0]
                green = value[index][1]
                blue = value[index][2]
                red = red if red <= 255 else 255
                green = green if green <= 255 else 255
                blue = blue if blue <= 255 else 255
                value[index] = (red, green, blue)
                self.ptColor[n] = value[index] # if (value[index] <= 0xFFFFFF) else 0xFFFFFF
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
            self.ptColor[pos] = value


class NeoPixel(object):
    def __init__(self, pin, num, freq_hz=800000, dma=10, invert=False,
            brightness=255, channel=0, strip_type=1):
        """Class to represent a NeoPixel/WS281x LED display.  Num should be the
        number of pixels in the display, and pin should be the GPIO pin connected
        to the display signal line (must be a PWM pin like 18!).  Optional
        parameters are freq, the frequency of the display signal in hertz (default
        800khz), dma, the DMA channel to use (default 10), invert, a boolean
        specifying if the signal line should be inverted (default False), and
        channel, the PWM channel to use (defaults to 0).
        """

        self.n= num
        self.ww = self.wh = 800     # window size
        self.brd = 50               # window border
        self.r = (self.ww - (2 * self.brd)) // 2
        self.mid = self.r + self.brd
        self.ll = 100               # length of minutes
        self.lw = 10                # width/thickness of minutes

        # setup tkinter windows and canvas
        self.mw = Tk()
        self.mw.configure(background='white')
        self.c = Canvas(self.mw, width=self.ww, height=self.wh, bg="black")
        self.c.pack(expand = YES, fill = BOTH)
        img = PhotoImage(file= os.path.dirname(os.path.realpath(__file__))+ '\\blackCircle.gif')
        self.c.create_image(45, 45, image=img, anchor=NW)
        label = Label(image=img)
        label.image = img # keep a reference!
        label.place(x=0, y=0, width=1, height=1)
        label.pack()
        self.mw.geometry("{0}x{1}".format(self.ww, self.wh))

        print('started')
        # self.mw.mainloop()
        # self.mw.after(100, self.mw.mainloop)
        
        # initialize lines for minutes
        self.pts = {}
        # inner ring
        for w in range(0, 91, 6):
            r= (self.r- self.ll- 20)
            y = round(sin(radians(w)) * r)
            x = round(sqrt(pow(r, 2) - pow(y, 2)))
            y2 = round(sin(radians(w)) * (r- self.ll))
            x2 = round(sqrt(pow((r - self.ll), 2) - pow(y2, 2)))
            self.pts[15 + (w // 6)] = self.c.create_line((self.mid + x, self.mid + y, self.mid + x2, self.mid + y2), fill='#000000', width=self.lw)
            self.pts[45 + (w // 6)] = self.c.create_line((self.mid - x, self.mid - y, self.mid - x2, self.mid - y2), fill='#000000', width=self.lw)
            self.pts[15 - (w // 6)] = self.c.create_line((self.mid + x, self.mid - y, self.mid + x2, self.mid - y2), fill='#000000', width=self.lw)
            self.pts[45 - (w // 6)] = self.c.create_line((self.mid - x, self.mid + y, self.mid - x2, self.mid + y2), fill='#000000', width=self.lw)

        # outer ring
        for w in range(0, 91, 6):
            y = round(sin(radians(w)) * self.r)
            x = round(sqrt(pow(self.r, 2) - pow(y, 2)))
            y2 = round(sin(radians(w)) * (self.r- self.ll))
            x2 = round(sqrt(pow((self.r - self.ll), 2) - pow(y2, 2)))
            self.pts[75 + (w // 6)] = self.c.create_line((self.mid + x, self.mid + y, self.mid + x2, self.mid + y2), fill='#000000', width=self.lw)
            self.pts[105 + (w // 6)] = self.c.create_line((self.mid - x, self.mid - y, self.mid - x2, self.mid - y2), fill='#000000', width=self.lw)
            self.pts[75 - (w // 6)] = self.c.create_line((self.mid + x, self.mid - y, self.mid + x2, self.mid - y2), fill='#000000', width=self.lw)
            self.pts[105 - (w // 6)] = self.c.create_line((self.mid - x, self.mid + y, self.mid - x2, self.mid + y2), fill='#000000', width=self.lw)

            # Grab the led data array.
        self._led_data = _LED_Data(0, num)

        # Substitute for __del__, traps an exit condition and cleans up properly
        atexit.register(self._cleanup)

    def __setitem__(self, nr, data):
        self._led_data[nr] = data

    def __getitem__(self, nr):
        return self._led_data[nr]

    def _cleanup(self):
        # Clean up memory used by the library when not needed anymore.
        self.mw.destroy()

    def begin(self):
        """Initialize library, must be called once before other functions are
        called.
        """
        #self.start()
        return

    def show(self):
        """Update the display with the data from the LED buffer."""
        for p in range(0, self.n+ 1):
            self.c.itemconfig(self.pts[p], fill='#{:02X}{:02X}{:02X}'.format(self._led_data[p][0], self._led_data[p][1], self._led_data[p][2]))
        self.mw.update()

    def setPixelColor(self, n, color):
        """Set LED at position n to the provided 24-bit color value (in RGB order).
        """
        #print('setting color {1} for pixel {0}'.format(n, color))
        self._led_data[n] = color

    def setPixelColorRGB(self, n, red, green, blue, white = 0):
        """Set LED at position n to the provided red, green, and blue color.
        Each color component should be a value from 0 to 255 (where 0 is the
        lowest intensity and 255 is the highest intensity).
        """
        self.setPixelColor(n, Color(red, green, blue, white))

    def setBrightness(self, brightness):
        """Scale each LED in the buffer by the provided brightness.  A brightness
        of 0 is the darkest and 255 is the brightest.
        """
        return

    def getBrightness(self):
        """Get the brightness value for each LED in the buffer. A brightness
        of 0 is the darkest and 255 is the brightest.
        """
        return 0

    def getPixels(self):
        """Return an object which allows access to the LED display data as if
        it were a sequence of 24-bit RGB values.
        """
        return self._led_data

    def numPixels(self):
        """Return the number of pixels in the display."""
        return 60

    def getPixelColor(self, n):
        """Get the 24-bit RGB color value for the LED at position n."""
        return self._led_data[n]

